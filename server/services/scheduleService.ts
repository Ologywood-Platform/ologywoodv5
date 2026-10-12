import type { PoolConnection } from 'mysql2/promise';
import { TRPCError } from '@trpc/server';
import { Temporal } from '@js-temporal/polyfill';
import { createHash } from 'node:crypto';
import { getDb, getPool } from '../db';
import { ensureScheduleSchema } from './scheduleSchemaService';
import { getDateOnlyKey } from '../../shared/dateOnly';
import {
  addCalendarDays, bufferedInterval, localDateAt, resolveScheduleInterval, scheduleAppointmentSchema,
  scheduleIntervalsOverlap, scheduleTimezoneSchema,
  type ScheduleInterval, type ScheduleContext, type ScheduleEntry, type ScheduleAppointmentInput,
} from '../../shared/schedule';

export type ScheduleConnection = Pick<PoolConnection, 'execute'>;
export const SCHEDULE_CONFLICT_MESSAGE = 'This time overlaps an existing commitment. Choose another time.';
const unavailable = () => new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Schedule is temporarily unavailable. Please try again.' });
const forbidden = () => new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to manage this calendar.' });
const conflict = () => new TRPCError({ code: 'CONFLICT', message: SCHEDULE_CONFLICT_MESSAGE });
const stale = () => new TRPCError({ code: 'CONFLICT', message: 'This appointment has changed. Refresh the calendar and try again.' });
const placeholders = (ids: number[]) => ids.map(() => '?').join(',');
function ownerIds(ids: number[]) {
  if (!ids.length || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw unavailable();
  return [...new Set(ids)].sort((a, b) => a - b);
}
async function rows(conn: ScheduleConnection, query: string, values: any[] = []): Promise<any[]> {
  const [result] = await conn.execute(query, values);
  if (!Array.isArray(result)) throw unavailable();
  return result;
}

/** Every writer (including booking/Live writers) locks the same deterministic owner user rows. */
export async function withScheduleLock<T>(ids: number[], callback: (conn: ScheduleConnection) => Promise<T>): Promise<T> {
  const owners = ownerIds(ids);
  await ensureScheduleSchema();
  if (!getPool()) await getDb();
  const pool = getPool();
  if (!pool) throw unavailable();
  const conn = await pool.getConnection();
  let transactionStarted = false;
  try {
    await conn.execute("SET time_zone = '+00:00'");
    await conn.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();
    transactionStarted = true;
    const locked = await rows(conn, `SELECT id FROM users WHERE id IN (${placeholders(owners)}) ORDER BY id FOR UPDATE`, owners);
    if (locked.length !== owners.length) throw unavailable();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    if (transactionStarted) await conn.rollback();
    throw error;
  } finally { conn.release(); }
}

function checkedInterval(interval: ScheduleInterval): ScheduleInterval {
  scheduleTimezoneSchema.parse(interval.timezone);
  if (!Number.isSafeInteger(interval.startAt) || !Number.isSafeInteger(interval.endAt) || interval.endAt <= interval.startAt
    || interval.endAt - interval.startAt > 32 * 86400000
    || ![interval.preparationMinutes, interval.travelMinutes].every(value => Number.isInteger(value) && value >= 0 && value <= 720)) throw unavailable();
  return interval;
}

/** No inferred duration: nullable timing absent means the stored event DATE is a whole-day commitment. */
export function getBookingScheduleInterval(booking: any, fallbackZone: string): ScheduleInterval {
  if (booking.scheduleStartAt != null || booking.scheduleEndAt != null) {
    if (booking.scheduleStartAt == null || booking.scheduleEndAt == null) throw unavailable();
    const timezone = booking.scheduleTimezone || fallbackZone;
    const allDay = booking.scheduleAllDay === true || booking.scheduleAllDay === 1;
    return checkedInterval({ startAt: Number(booking.scheduleStartAt), endAt: Number(booking.scheduleEndAt), timezone,
      allDay, date: localDateAt(Number(booking.scheduleStartAt), timezone),
      preparationMinutes: allDay ? 0 : Number(booking.preparationMinutes ?? 0), travelMinutes: allDay ? 0 : Number(booking.travelMinutes ?? 0) });
  }
  const date = getDateOnlyKey(booking.eventDate);
  if (!date) throw unavailable();
  return resolveScheduleInterval({ date, timezone: fallbackZone, allDay: true });
}
function appointmentInterval(row: any): ScheduleInterval {
  return checkedInterval({ startAt: Number(row.startAt), endAt: Number(row.endAt), timezone: row.timezone,
    allDay: Boolean(row.allDay), date: getDateOnlyKey(row.date) || localDateAt(Number(row.startAt), row.timezone),
    preparationMinutes: Number(row.preparationMinutes), travelMinutes: Number(row.travelMinutes) });
}
function liveInterval(row: any, fallbackZone: string): ScheduleInterval {
  const timezone = row.scheduleTimezone || fallbackZone;
  const startAt = Number(row.startAt), endAt = Number(row.endAt);
  return checkedInterval({ startAt, endAt, timezone, allDay: false, date: localDateAt(startAt, timezone), preparationMinutes: 0, travelMinutes: 0 });
}

// Date-only candidates are checked in the candidate timezone, including every touched date across midnight.
function range(interval: ScheduleInterval) {
  const buffered = bufferedInterval(checkedInterval(interval));
  return { ...buffered, fromDate: localDateAt(buffered.startAt, interval.timezone), toDate: localDateAt(buffered.endAt - 1, interval.timezone) };
}
const bookingColumns = `b.id, b.artistId, DATE_FORMAT(b.eventDate, '%Y-%m-%d') AS eventDate, b.status, b.bookingType,
  b.scheduleStartAt, b.scheduleEndAt, b.scheduleTimezone, b.scheduleAllDay, b.preparationMinutes, b.travelMinutes,
  b.venueName, UNIX_TIMESTAMP(b.updatedAt)*1000 AS updatedEpoch, ap.artistName, vp.organizationName AS venueDisplayName`;
// Exclude client user IDs from venue profile joins; their own calendars still include their commitments.
const bookingJoins = `LEFT JOIN artist_profiles ap ON ap.id=b.artistId
  LEFT JOIN venue_profiles vp ON vp.id=b.venueId AND COALESCE(b.bookingSource,'') NOT IN ('client_booking','client')`;
function participantWhere(owners: number[]) {
  const list = placeholders(owners);
  return `(ap.userId IN (${list}) OR vp.userId IN (${list}) OR (b.bookingSource IN ('client_booking','client') AND b.venueId IN (${list})))`;
}
async function bookingRows(conn: ScheduleConnection, owners: number[], interval: ScheduleInterval, pending = false) {
  const r = range(interval);
  return rows(conn, `SELECT ${bookingColumns} FROM bookings b ${bookingJoins}
    WHERE ${participantWhere(owners)} AND b.status IN (${pending ? "'pending'," : ''}'confirmed','completed')
    AND ((b.scheduleStartAt IS NOT NULL AND b.scheduleStartAt-b.preparationMinutes*60000 < ?
      AND b.scheduleEndAt+b.travelMinutes*60000 > ?)
      OR ((b.scheduleStartAt IS NULL OR b.scheduleEndAt IS NULL) AND b.eventDate >= ? AND b.eventDate < ?))`,
    [...owners, ...owners, ...owners, r.endAt, r.startAt, `${r.fromDate} 00:00:00`, `${addCalendarDays(r.toDate, 1)} 00:00:00`]);
}
async function liveRows(conn: ScheduleConnection, owners: number[], interval: ScheduleInterval) {
  const r = range(interval);
  const slots = await rows(conn, `SELECT s.id, s.talentId, s.scheduleTimezone, UNIX_TIMESTAMP(s.startTime)*1000 AS startAt,
    UNIX_TIMESTAMP(s.endTime)*1000 AS endAt, e.title, e.category, s.spotsTaken, EXISTS(SELECT 1 FROM ology_live_bookings reserved WHERE reserved.experienceId=s.experienceId AND reserved.scheduledAt=s.startTime AND reserved.status IN ('pending','confirmed')) AS hasReservation,
    EXISTS(SELECT 1 FROM ology_live_bookings reminder WHERE reminder.experienceId=s.experienceId AND reminder.scheduledAt=s.startTime
      AND reminder.status IN ('pending','confirmed') AND reminder.paymentStatus='paid'
      AND (reminder.talentId IN (${placeholders(owners)}) OR reminder.fanId IN (${placeholders(owners)}))) AS hasPaidReservation
    FROM ology_live_time_slots s JOIN ology_live_experiences e ON e.id=s.experienceId
    WHERE (s.talentId IN (${placeholders(owners)}) OR EXISTS (SELECT 1 FROM ology_live_bookings attendee
        WHERE attendee.experienceId=s.experienceId AND attendee.scheduledAt=s.startTime
          AND attendee.fanId IN (${placeholders(owners)}) AND attendee.status IN ('pending','confirmed')))
      AND ((e.isActive=1 AND s.isAvailable=1) OR s.spotsTaken>0 OR EXISTS (SELECT 1 FROM ology_live_bookings lb
        WHERE lb.experienceId=s.experienceId AND lb.scheduledAt=s.startTime AND lb.status IN ('pending','confirmed')))
      AND s.startTime < FROM_UNIXTIME(?/1000) AND s.endTime > FROM_UNIXTIME(?/1000)`, [...owners, ...owners, ...owners, ...owners, r.endAt, r.startAt]);
  // No invented duration: old sessions retain the duration persisted on their booking.
  // Negative source IDs distinguish orphan booking rows from positive slot IDs and cannot self-exclude a slot.
  const orphaned = await rows(conn, `SELECT -lb.id AS id, lb.talentId, NULL AS scheduleTimezone,
      UNIX_TIMESTAMP(lb.scheduledAt)*1000 AS startAt,
      (UNIX_TIMESTAMP(lb.scheduledAt)*1000+lb.duration*60000) AS endAt, e.title, e.category, 1 AS spotsTaken,
      (lb.paymentStatus='paid') AS hasPaidReservation
    FROM ology_live_bookings lb LEFT JOIN ology_live_experiences e ON e.id=lb.experienceId
    WHERE (lb.talentId IN (${placeholders(owners)}) OR lb.fanId IN (${placeholders(owners)}))
      AND lb.status IN ('pending','confirmed')
      AND lb.scheduledAt < FROM_UNIXTIME(?/1000)
      AND DATE_ADD(lb.scheduledAt, INTERVAL lb.duration MINUTE) > FROM_UNIXTIME(?/1000)
      AND NOT EXISTS (SELECT 1 FROM ology_live_time_slots s WHERE s.experienceId=lb.experienceId AND s.startTime=lb.scheduledAt)`,
    [...owners, ...owners, r.endAt, r.startAt]);
  return [...slots, ...orphaned];
}

export async function assertNoScheduleConflict(conn: ScheduleConnection, ids: number[], interval: ScheduleInterval,
  exclusions: { appointmentId?: number; bookingId?: number; liveSlotId?: number; availabilityId?: number } = {}): Promise<void> {
  const owners = ownerIds(ids), r = range(interval);
  try {
    const appointments = await rows(conn, `SELECT * FROM schedule_appointments WHERE ownerUserId IN (${placeholders(owners)})
      AND status='active' AND startAt-preparationMinutes*60000 < ? AND endAt+travelMinutes*60000 > ?`, [...owners, r.endAt, r.startAt]);
    if (appointments.some(row => row.id !== exclusions.appointmentId && scheduleIntervalsOverlap(interval, appointmentInterval(row)))) throw conflict();
    const bookings = await bookingRows(conn, owners, interval);
    if (bookings.some(row => row.id !== exclusions.bookingId && scheduleIntervalsOverlap(interval, getBookingScheduleInterval(row, interval.timezone)))) throw conflict();
    const live = await liveRows(conn, owners, interval); // never ignore a missing table or failed source
    if (live.some(row => row.id !== exclusions.liveSlotId && scheduleIntervalsOverlap(interval, liveInterval(row, interval.timezone)))) throw conflict();
    const days = await rows(conn, `SELECT av.id, DATE_FORMAT(av.date,'%Y-%m-%d') AS date, av.status, av.artistId FROM availability av JOIN artist_profiles ap ON ap.id=av.artistId
      WHERE ap.userId IN (${placeholders(owners)}) AND av.date BETWEEN ? AND ? AND av.status IN ('unavailable','booked')`, [...owners, r.fromDate, r.toDate]);
    for (const day of days) {
      if (day.id === exclusions.availabilityId) continue;
      if (day.status === 'unavailable') throw conflict();
      // Auto-generated booked days backed by precise bookings must not incorrectly block their whole date.
      // Keep self-excluded confirmed bookings here, so confirming/editing does not conflict with its generated day.
      const backing = await rows(conn, `SELECT id, scheduleStartAt, scheduleEndAt FROM bookings
        WHERE artistId=? AND status IN ('confirmed','completed') AND eventDate >= ? AND eventDate < ?`,
        [day.artistId, `${day.date} 00:00:00`, `${addCalendarDays(day.date, 1)} 00:00:00`]);
      if (!backing.length || backing.some(row => row.id !== exclusions.bookingId && (row.scheduleStartAt == null || row.scheduleEndAt == null))) throw conflict();
    }
    const venueDays = await rows(conn, `SELECT bd.date FROM venue_blocked_dates bd JOIN venue_profiles vp ON vp.id=bd.venueId
      WHERE vp.userId IN (${placeholders(owners)}) AND bd.date BETWEEN ? AND ?`, [...owners, r.fromDate, r.toDate]);
    if (venueDays.length) throw conflict();
    const recurring = await rows(conn, `SELECT rb.dayOfWeek FROM venue_recurring_blocks rb JOIN venue_profiles vp ON vp.id=rb.venueId
      WHERE vp.userId IN (${placeholders(owners)}) AND rb.isActive=1`, owners);
    for (let date = r.fromDate; date <= r.toDate; date = addCalendarDays(date, 1)) {
      if (recurring.some(row => Number(row.dayOfWeek) === Temporal.PlainDate.from(date).dayOfWeek % 7)) throw conflict();
    }
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'CONFLICT') throw error;
    throw unavailable();
  }
}

function strictPermission(value: unknown): boolean {
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return (parsed as any)?.manageCalendar === true; }
  catch { return false; }
}
/** No role/admin bypass. A denied context contains identity only, never entries or private content. */
export async function resolveScheduleContext(conn: ScheduleConnection, actorUserId: number, selectedOwner?: number,
  mutation = false): Promise<ScheduleContext> {
  const memberships = await rows(conn, `SELECT ap.userId AS ownerUserId, ap.artistName AS name, m.permissions, m.teamRole
    FROM artist_team_members m JOIN artist_profiles ap ON ap.id=m.artistProfileId
    WHERE m.userId=? AND ap.userId<>? ORDER BY ap.userId, m.id${mutation ? ' FOR UPDATE' : ''}`, [actorUserId, actorUserId]);
  const selected = selectedOwner ?? memberships.find(row => row.teamRole !== 'owner')?.ownerUserId ?? actorUserId;
  if (selected === actorUserId) {
    const own = await rows(conn, 'SELECT name FROM users WHERE id=?', [actorUserId]);
    if (!own.length) throw forbidden();
    return { ownerUserId: actorUserId, name: own[0].name || 'My schedule', canManage: true, isCollaborator: false, timezone: 'UTC' };
  }
  const member = memberships.find(row => row.ownerUserId === selected);
  if (!member) throw forbidden();
  return { ownerUserId: selected, name: member.name || 'Managed schedule', canManage: strictPermission(member.permissions), isCollaborator: true, timezone: 'UTC' };
}
async function withReadConnection<T>(callback: (conn: ScheduleConnection) => Promise<T>) {
  await ensureScheduleSchema();
  const pool = getPool();
  if (!pool) throw unavailable();
  const conn = await pool.getConnection();
  try { await conn.execute("SET time_zone = '+00:00'"); return await callback(conn); }
  finally { conn.release(); }
}
export async function getScheduleContext(actorUserId: number, selectedOwner?: number): Promise<ScheduleContext> {
  return withReadConnection(conn => resolveScheduleContext(conn, actorUserId, selectedOwner));
}

async function reconcileLiveCalendar(userId: number): Promise<void> {
  // Lazy import avoids a scheduling-adapter cycle. Stripe reads happen before any user lock.
  const { reconcileOlogyLiveReservations } = await import('./ologyLiveCheckoutService');
  try { await reconcileOlogyLiveReservations({ userId }); }
  catch { throw unavailable(); }
}

async function requireContext(conn: ScheduleConnection, actor: number, owner?: number, mutation = false) {
  const context = await resolveScheduleContext(conn, actor, owner, mutation);
  if (!context.canManage) throw forbidden();
  return context;
}
function appointmentEntry(row: any): ScheduleEntry {
  return { ...appointmentInterval(row), id: `appointment:${row.id}`, source: 'appointment', sourceId: row.id,
    title: row.title, category: row.category, status: row.status, location: row.location || '', notes: row.notes || '',
    revision: Number(row.revision), reminderMinutes: row.reminderMinutes == null ? null : Number(row.reminderMinutes), href: null };
}
function bookingEntry(row: any, timezone: string): ScheduleEntry {
  return { ...getBookingScheduleInterval(row, timezone), id: `booking:${row.id}`, source: 'booking', sourceId: row.id,
    title: row.artistName ? `Booking: ${row.artistName}` : 'Booking', category: row.bookingType || 'performance', status: row.status,
    location: row.venueName || row.venueDisplayName || '', notes: '', revision: Number(row.updatedEpoch || 1), reminderMinutes: 30,
    href: `/booking/${row.id}` };
}
function liveEntry(row: any, timezone: string, owner: number): ScheduleEntry {
  return { ...liveInterval(row, timezone), id: `live:${row.id}`, source: 'live', sourceId: row.id,
    title: row.title || 'Ology Live session', category: 'virtual_session', status: row.spotsTaken>0 || row.hasReservation ? 'reserved' : 'available', location: 'Ology Live', notes: '',
    revision: 1, reminderMinutes: row.hasPaidReservation === true || row.hasPaidReservation === 1 ? 30 : null, href: Number(row.talentId)===owner ? '/ology-live/dashboard' : '/ology-live/my-sessions' };
}
async function availabilityAgenda(conn:ScheduleConnection,owner:number,interval:ScheduleInterval):Promise<ScheduleEntry[]>{
  const r=range(interval),entries:ScheduleEntry[]=[];
  const entry=(id:string,sourceId:number,date:string,title:string,href:string):ScheduleEntry=>({...resolveScheduleInterval({date,timezone:interval.timezone,allDay:true}),id,source:'availability',sourceId,title,status:'blocked',category:'other',location:'',notes:'',revision:1,reminderMinutes:null,href});
  const artistDays=await rows(conn,`SELECT av.id, DATE_FORMAT(av.date,'%Y-%m-%d') AS date, av.status FROM availability av JOIN artist_profiles ap ON ap.id=av.artistId WHERE ap.userId=? AND av.date BETWEEN ? AND ? AND (av.status='unavailable' OR (av.status='booked' AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.artistId=av.artistId AND b.eventDate=av.date AND b.status IN ('confirmed','completed'))))`,[owner,r.fromDate,r.toDate]);
  for(const row of artistDays)entries.push(entry(`availability:artist:${row.id}`,Number(row.id),row.date,'Artist all-day block','/dashboard'));
  const venueDays=await rows(conn,`SELECT bd.id, DATE_FORMAT(bd.date,'%Y-%m-%d') AS date FROM venue_blocked_dates bd JOIN venue_profiles vp ON vp.id=bd.venueId WHERE vp.userId=? AND bd.date BETWEEN ? AND ?`,[owner,r.fromDate,r.toDate]);
  for(const row of venueDays)entries.push(entry(`availability:venue:${row.id}`,Number(row.id),row.date,'Venue all-day block','/venue-dashboard'));
  const recurring=await rows(conn,'SELECT rb.id,rb.dayOfWeek FROM venue_recurring_blocks rb JOIN venue_profiles vp ON vp.id=rb.venueId WHERE vp.userId=? AND rb.isActive=1',[owner]);
  for(let date=r.fromDate;date<=r.toDate;date=addCalendarDays(date,1))for(const row of recurring){if(Number(row.dayOfWeek)===Temporal.PlainDate.from(date).dayOfWeek%7)entries.push(entry(`availability:weekly:${row.id}:${date}`,Number(row.id),date,'Recurring venue all-day block','/venue-dashboard'));}
  return entries;
}

async function collectAgenda(conn: ScheduleConnection, owner: number, interval: ScheduleInterval): Promise<ScheduleEntry[]> {
  const appointments = await rows(conn, `SELECT *, DATE_FORMAT(date,'%Y-%m-%d') AS date FROM schedule_appointments
    WHERE ownerUserId=? AND status='active' AND startAt < ? AND endAt > ?`, [owner, interval.endAt, interval.startAt]);
  const bookings = await bookingRows(conn, [owner], interval, true);
  const live = await liveRows(conn, [owner], interval);
  const dayBlocks=await availabilityAgenda(conn,owner,interval);
  return [...dayBlocks,...appointments.map(appointmentEntry), ...bookings.map(row => bookingEntry(row, interval.timezone)), ...live.map(row => liveEntry(row, interval.timezone, owner))]
    .filter(entry => entry.startAt < interval.endAt && entry.endAt > interval.startAt)
    .sort((a, b) => a.startAt - b.startAt || a.id.localeCompare(b.id));
}
export async function getScheduleAgenda(actorUserId: number, input: { fromDate: string; toDate: string; timezone: string; ownerUserId?: number }) {
  const days = Temporal.PlainDate.from(input.fromDate).until(Temporal.PlainDate.from(input.toDate)).days + 1;
  if (days < 1 || days > 31) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Choose an agenda range of at most 31 days.' });
  // 31 calendar dates can exceed 31*24 hours when daylight saving ends.
  const interval = { ...resolveScheduleInterval({ date: input.fromDate, allDay: true, timezone: input.timezone }),
    endAt: resolveScheduleInterval({ date: input.toDate, allDay: true, timezone: input.timezone }).endAt };
  // Authorize before reading any calendar source; collaborator reads never trigger reminders to the owner.
  const preliminary = await getScheduleContext(actorUserId, input.ownerUserId);
  if (!preliminary.canManage) throw forbidden();
  await reconcileLiveCalendar(preliminary.ownerUserId);
  const agenda = await withReadConnection(async conn => {
    const context = await requireContext(conn, actorUserId, input.ownerUserId);
    return { context, entries: await collectAgenda(conn, context.ownerUserId, interval) };
  });
  await materializeScheduleRemindersBestEffort(actorUserId);
  return agenda;
}

type AppointmentMutation = ScheduleAppointmentInput & { ownerUserId?: number };
function normalizedAppointment(input: AppointmentMutation) {
  const data = scheduleAppointmentSchema.parse(input);
  let interval: ScheduleInterval;
  try { interval = resolveScheduleInterval(data); }
  catch (error) { throw new TRPCError({ code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Choose valid appointment timing.' }); }
  return { data, interval };
}
const appointmentFields = 'title=?, category=?, startAt=?, endAt=?, timezone=?, allDay=?, date=?, preparationMinutes=?, travelMinutes=?, location=?, notes=?, reminderMinutes=?';
function appointmentValues({ data, interval }: ReturnType<typeof normalizedAppointment>) {
  return [data.title, data.category, interval.startAt, interval.endAt, interval.timezone, interval.allDay,
    interval.date, interval.preparationMinutes, interval.travelMinutes, data.location, data.notes, data.reminderMinutes];
}
export async function createScheduleAppointment(actor: number, input: AppointmentMutation): Promise<{ id: number; revision: number }> {
  const value = normalizedAppointment(input);
  const context = await getScheduleContext(actor, input.ownerUserId);
  if (!context.canManage) throw forbidden();
  await reconcileLiveCalendar(context.ownerUserId);
  return withScheduleLock([actor, context.ownerUserId], async conn => {
    await requireContext(conn, actor, context.ownerUserId, true);
    await assertNoScheduleConflict(conn, [context.ownerUserId], value.interval);
    const [result] = await conn.execute(`INSERT INTO schedule_appointments
      (ownerUserId,createdByUserId,title,category,startAt,endAt,timezone,allDay,date,preparationMinutes,travelMinutes,location,notes,reminderMinutes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [context.ownerUserId, actor, ...appointmentValues(value)]);
    return { id: Number((result as any).insertId), revision: 1 };
  });
}
async function clearAppointmentReminders(conn: ScheduleConnection, owner: number, id: number) {
  await conn.execute(`DELETE n FROM notifications n JOIN schedule_reminder_receipts r ON r.notificationId=n.id
    WHERE r.ownerUserId=? AND r.source='appointment' AND r.sourceId=? AND n.userId=? AND n.isRead=0`, [owner, id, owner]);
}
export async function updateScheduleAppointment(actor: number, input: AppointmentMutation & { id: number; expectedRevision: number }): Promise<{ id: number; revision: number }> {
  const value = normalizedAppointment(input);
  const context = await getScheduleContext(actor, input.ownerUserId);
  if (!context.canManage) throw forbidden();
  await reconcileLiveCalendar(context.ownerUserId);
  return withScheduleLock([actor, context.ownerUserId], async conn => {
    await requireContext(conn, actor, context.ownerUserId, true);
    const [existing] = await rows(conn, 'SELECT id, revision, status FROM schedule_appointments WHERE id=? AND ownerUserId=? FOR UPDATE', [input.id, context.ownerUserId]);
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found.' });
    if (existing.status !== 'active' || Number(existing.revision) !== input.expectedRevision) throw stale();
    await assertNoScheduleConflict(conn, [context.ownerUserId], value.interval, { appointmentId: input.id });
    const [result] = await conn.execute(`UPDATE schedule_appointments SET ${appointmentFields}, revision=revision+1
      WHERE id=? AND ownerUserId=? AND revision=? AND status='active'`, [...appointmentValues(value), input.id, context.ownerUserId, input.expectedRevision]);
    if ((result as any).affectedRows !== 1) throw stale();
    await clearAppointmentReminders(conn, context.ownerUserId, input.id);
    return { id: input.id, revision: input.expectedRevision + 1 };
  });
}
export async function cancelScheduleAppointment(actor: number, input: { id: number; expectedRevision: number; ownerUserId?: number }): Promise<{ success: true }> {
  const context = await getScheduleContext(actor, input.ownerUserId);
  if (!context.canManage) throw forbidden();
  return withScheduleLock([actor, context.ownerUserId], async conn => {
    await requireContext(conn, actor, context.ownerUserId, true);
    const [existing] = await rows(conn, 'SELECT id, revision, status FROM schedule_appointments WHERE id=? AND ownerUserId=? FOR UPDATE', [input.id, context.ownerUserId]);
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found.' });
    if (existing.status !== 'active' || Number(existing.revision) !== input.expectedRevision) throw stale();
    const [result] = await conn.execute(`UPDATE schedule_appointments SET status='cancelled', revision=revision+1
      WHERE id=? AND ownerUserId=? AND revision=? AND status='active'`, [input.id, context.ownerUserId, input.expectedRevision]);
    if ((result as any).affectedRows !== 1) throw stale();
    await clearAppointmentReminders(conn, context.ownerUserId, input.id);
    return { success: true };
  });
}

/** Reminder delivery is inbox/agenda-read driven, not a background or offline delivery guarantee. */
export const SCHEDULE_REMINDER_DELIVERY = 'In-app reminders appear when you refresh the inbox or Schedule while signed in. No background delivery is guaranteed.';
const MISSED_REMINDER_WINDOW = 2 * 60 * 60 * 1000;
export function scheduleReminderDueAt(entry: ScheduleEntry): number | null {
  if (entry.reminderMinutes == null || (entry.source === 'booking' && !['confirmed', 'completed'].includes(entry.status))) return null;
  if (entry.source === 'appointment' && entry.status !== 'active') return null;
  // All-day notices arrive near the beginning of the local day rather than the previous midnight.
  const anchor = entry.allDay
    ? Temporal.PlainDate.from(entry.date).toZonedDateTime({ timeZone: entry.timezone, plainTime: '09:00' }).epochMilliseconds
    : entry.startAt;
  return anchor - entry.reminderMinutes * 60000;
}
function reminderRevision(entry: ScheduleEntry) {
  if (entry.source === 'appointment') return String(entry.revision);
  // Payment/status metadata updates are not schedule revisions and must not cause duplicate notices.
  return createHash('sha256').update(JSON.stringify([entry.startAt, entry.endAt, entry.timezone, entry.reminderMinutes, entry.title])).digest('hex');
}
async function cleanupStaleReminders(conn: ScheduleConnection, owner: number) {
  // Never expose cancelled/revised appointments' unread reminders; receipts remain to prevent redelivery.
  await conn.execute(`DELETE n FROM notifications n JOIN schedule_reminder_receipts r ON r.notificationId=n.id
    LEFT JOIN schedule_appointments a ON a.id=r.sourceId AND a.ownerUserId=r.ownerUserId
    WHERE r.ownerUserId=? AND r.source='appointment' AND n.userId=? AND n.isRead=0
      AND (a.id IS NULL OR a.status<>'active' OR a.reminderMinutes IS NULL OR r.revision<>CAST(a.revision AS CHAR))`, [owner, owner]);
  await conn.execute(`DELETE n FROM notifications n JOIN schedule_reminder_receipts r ON r.notificationId=n.id
    LEFT JOIN bookings b ON b.id=r.sourceId
    WHERE r.ownerUserId=? AND r.source='booking' AND n.userId=? AND n.isRead=0
      AND (b.id IS NULL OR b.status NOT IN ('confirmed','completed')
        OR (b.scheduleStartAt IS NOT NULL AND COALESCE(b.scheduleAllDay,0)=0 AND r.dueAt<>b.scheduleStartAt-1800000))`, [owner, owner]);
  await conn.execute(`DELETE n FROM notifications n JOIN schedule_reminder_receipts r ON r.notificationId=n.id
    LEFT JOIN ology_live_time_slots s ON s.id=r.sourceId
    LEFT JOIN ology_live_experiences e ON e.id=s.experienceId
    WHERE r.ownerUserId=? AND r.source='live' AND r.sourceId>0 AND n.userId=? AND n.isRead=0
      AND (s.id IS NULL OR r.dueAt<>UNIX_TIMESTAMP(s.startTime)*1000-1800000
        OR ((s.isAvailable=0 OR e.isActive=0) AND s.spotsTaken=0 AND NOT EXISTS (SELECT 1 FROM ology_live_bookings lb
          WHERE lb.experienceId=s.experienceId AND lb.scheduledAt=s.startTime AND lb.status IN ('pending','confirmed')))
        OR NOT EXISTS (SELECT 1 FROM ology_live_bookings attendee
          WHERE (attendee.fanId=r.ownerUserId OR attendee.talentId=r.ownerUserId)
            AND attendee.experienceId=s.experienceId AND attendee.scheduledAt=s.startTime
            AND attendee.status IN ('pending','confirmed') AND attendee.paymentStatus='paid'))`, [owner, owner]);
  await conn.execute(`DELETE n FROM notifications n JOIN schedule_reminder_receipts r ON r.notificationId=n.id
    LEFT JOIN ology_live_bookings lb ON lb.id=-r.sourceId
    WHERE r.ownerUserId=? AND r.source='live' AND r.sourceId<0 AND n.userId=? AND n.isRead=0
      AND (lb.id IS NULL OR lb.status NOT IN ('pending','confirmed') OR lb.paymentStatus<>'paid' OR r.dueAt<>UNIX_TIMESTAMP(lb.scheduledAt)*1000-1800000)`, [owner, owner]);
}
/** Current authenticated user's OWN commitments only; never traverse managed contexts or fan/team notification channels. */
export async function materializeScheduleReminders(userId: number, now = Date.now()): Promise<void> {
  await reconcileLiveCalendar(userId);
  await withScheduleLock([userId], async conn => {
    await cleanupStaleReminders(conn, userId);
    const [preference] = await rows(conn, 'SELECT reminderNotifications FROM notification_preferences WHERE userId=? LIMIT 1', [userId]);
    if (preference && (preference.reminderNotifications === false || preference.reminderNotifications === 0)) return;
    const date = localDateAt(now, 'UTC');
    // At most seven-day reminder lead plus a bounded missed window. No platform-wide scanning.
    const interval = resolveScheduleInterval({ date: addCalendarDays(date, -2), endDate: addCalendarDays(date, 8), allDay: true, timezone: 'UTC' });
    const entries = await collectAgenda(conn, userId, interval);
    for (const entry of entries) {
      const dueAt = scheduleReminderDueAt(entry);
      if (dueAt == null || dueAt > now || dueAt < now - MISSED_REMINDER_WINDOW || entry.endAt <= now) continue;
      const revision = reminderRevision(entry), dedupKey = `${userId}:${entry.source}:${entry.sourceId}:${revision}:${dueAt}`;
      const existing = await rows(conn, 'SELECT id FROM schedule_reminder_receipts WHERE dedupKey=? LIMIT 1', [dedupKey]);
      if (existing.length) continue;
      const [reservation] = await conn.execute(`INSERT INTO schedule_reminder_receipts (ownerUserId,source,sourceId,revision,dueAt,dedupKey) VALUES (?,?,?,?,?,?)`,
        [userId, entry.source, entry.sourceId, revision, dueAt, dedupKey]);
      // Existing notifications have no reminder enum; booking is the established in-app reminder-compatible type.
      const [notification] = await conn.execute(`INSERT INTO notifications (userId,type,title,message,actionUrl,isRead) VALUES (?,'booking',?,?,?,0)`,
        [userId, 'Schedule reminder', `${entry.title} ${entry.allDay ? 'is on your schedule today.' : 'starts soon.'}`, '/workspace?section=schedule']);
      await conn.execute('UPDATE schedule_reminder_receipts SET notificationId=? WHERE id=?', [(notification as any).insertId, (reservation as any).insertId]);
    }
  });
}

/** Notifications must continue to work if Schedule storage is temporarily unavailable. */
export async function materializeScheduleRemindersBestEffort(userId: number): Promise<void> {
  try { await materializeScheduleReminders(userId); }
  catch { /* No private data/SQL in client-facing errors or logs. Next authenticated read retries. */ }
}
