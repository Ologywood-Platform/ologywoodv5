import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleEntry } from '../../shared/schedule';
import { resolveScheduleInterval } from '../../shared/schedule';
const mocks = vi.hoisted(() => ({ pool: { getConnection: vi.fn() }, schema: vi.fn(async () => undefined), getDb: vi.fn(), reconcile: vi.fn(async () => undefined) }));
vi.mock('../db', () => ({ getPool: () => mocks.pool, getDb: mocks.getDb }));
vi.mock('./scheduleSchemaService', () => ({ ensureScheduleSchema: mocks.schema }));
vi.mock('./ologyLiveCheckoutService', () => ({ reconcileOlogyLiveReservations: mocks.reconcile }));
import {
  assertNoScheduleConflict, cancelScheduleAppointment, createScheduleAppointment, getBookingScheduleInterval,
  getScheduleAgenda, materializeScheduleReminders, materializeScheduleRemindersBestEffort,
  resolveScheduleContext, scheduleReminderDueAt, SCHEDULE_CONFLICT_MESSAGE, updateScheduleAppointment, withScheduleLock,
} from './scheduleService';

const timing = { date: '2026-10-12', startTime: '10:00', endTime: '11:00', timezone: 'UTC', preparationMinutes: 0, travelMinutes: 0 };
const interval = resolveScheduleInterval(timing);
const appointment = (overrides: Record<string, any> = {}) => ({ id: 20, ownerUserId: 1, title: 'PRIVATE TITLE', category: 'podcast',
  ...interval, date: timing.date, status: 'active', location: 'PRIVATE LOCATION', notes: 'PRIVATE NOTES', reminderMinutes: 30, revision: 1, ...overrides });
const booking = (overrides: Record<string, any> = {}) => ({ id: 30, artistId: 7, status: 'confirmed', eventDate: timing.date,
  scheduleStartAt: interval.startAt, scheduleEndAt: interval.endAt, scheduleTimezone: 'UTC', scheduleAllDay: false,
  preparationMinutes: 0, travelMinutes: 0, artistName: 'Artist', ...overrides });
const live = (overrides: Record<string, any> = {}) => ({ id: 40, title: 'Live', startAt: interval.startAt, endAt: interval.endAt, scheduleTimezone: 'UTC', ...overrides });

function fixture(options: Record<string, any> = {}) {
  const state = { appointments: [] as any[], bookings: [] as any[], live: [] as any[], days: [] as any[], backing: [] as any[],
    venueDays: [] as any[], recurring: [] as any[], memberships: [] as any[], preference: [] as any[], receipts: [] as any[],
    notifications: [] as any[], orphanLive: [] as any[], failOn: '', affectedRows: 1, ...options };
  let receiptId = 100, notificationId = 200;
  const execute = vi.fn(async (sql: string, args: any[] = []): Promise<any> => {
    const query = sql.replace(/\s+/g, ' ').trim();
    if (state.failOn && query.includes(state.failOn)) throw new Error('private DB outage details');
    if (query.startsWith('SET ')) return [[], []];
    if (query.startsWith('SELECT id FROM users')) return [args.map(id => ({ id })), []];
    if (query.includes('FROM artist_team_members')) return [state.memberships, []];
    if (query === 'SELECT name FROM users WHERE id=?') return [[{ name: 'Owner' }], []];
    if (query.includes('SELECT id, revision, status FROM schedule_appointments')) return [state.appointments.filter(row => row.id === args[0] && row.ownerUserId === args[1]), []];
    if (query.includes('FROM schedule_appointments')) return [state.appointments.filter(row => row.status === 'active'), []];
    if (query.startsWith('SELECT av.')) return [state.days, []];
    if (query.includes('FROM bookings b')) return [state.bookings.filter(row => query.includes("'pending'") || row.status !== 'pending'), []];
    if (query.includes('FROM bookings') && query.startsWith('SELECT')) return [state.backing, []];
    if (query.includes('FROM ology_live_bookings lb') && query.startsWith('SELECT -lb.id')) return [state.orphanLive, []];
    if (query.includes('FROM ology_live_time_slots')) return [state.live, []];
    if (query.includes('FROM availability')) return [state.days, []];
    if (query.includes('FROM venue_blocked_dates')) return [state.venueDays, []];
    if (query.includes('FROM venue_recurring_blocks')) return [state.recurring, []];
    if (query.includes('FROM notification_preferences')) return [state.preference, []];
    if (query.includes('SELECT id FROM schedule_reminder_receipts')) return [state.receipts.filter(row => row.dedupKey === args[0]), []];
    if (query.startsWith('INSERT INTO schedule_appointments')) {
      return [{ insertId: 50, affectedRows: 1 }, []];
    }
    if (query.startsWith('UPDATE schedule_appointments')) {
      const cancelling = query.includes("status='cancelled'");
      const id = cancelling ? args[0] : args[12];
      const found = state.appointments.find(row => row.id === id);
      if (found && state.affectedRows === 1) { found.revision++; if (cancelling) found.status = 'cancelled'; }
      return [{ affectedRows: state.affectedRows }, []];
    }
    if (query.startsWith('INSERT INTO schedule_reminder_receipts')) {
      const id = receiptId++;
      state.receipts.push({ id, ownerUserId: args[0], source: args[1], sourceId: args[2], revision: args[3], dueAt: args[4], dedupKey: args[5] });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (query.startsWith('INSERT INTO notifications')) {
      const id = notificationId++;
      state.notifications.push({ id, userId: args[0], title: args[1], message: args[2], actionUrl: args[3], isRead: 0 });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (query.startsWith('UPDATE schedule_reminder_receipts')) {
      state.receipts.find(row => row.id === args[1]).notificationId = args[0]; return [{ affectedRows: 1 }, []];
    }
    if (query.startsWith('DELETE n FROM notifications')) {
      if (query.includes("r.source='appointment'")) {
        state.notifications = state.notifications.filter(notification => {
          const receipt = state.receipts.find(row => row.notificationId === notification.id);
          if (!receipt || receipt.source !== 'appointment' || notification.isRead) return true;
          const source = state.appointments.find(row => row.id === receipt.sourceId);
          return query.includes('LEFT JOIN') ? Boolean(source && source.status === 'active' && source.reminderMinutes != null) : receipt.sourceId !== args[1];
        });
      }
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unmocked SQL: ${query}`);
  });
  let snapshot: Record<string, any> | undefined;
  const connection = { execute, beginTransaction: vi.fn(async () => {
    snapshot = structuredClone({ appointments: state.appointments, receipts: state.receipts, notifications: state.notifications });
  }), commit: vi.fn(async () => { snapshot = undefined; }),
    rollback: vi.fn(async () => { if (snapshot) Object.assign(state, snapshot); snapshot = undefined; }), release: vi.fn() };
  mocks.pool.getConnection.mockResolvedValue(connection);
  return { state, connection, execute };
}

beforeEach(() => { vi.clearAllMocks(); mocks.reconcile.mockReset().mockResolvedValue(undefined); });

describe('cross-source bounded conflicts', () => {
  it('allows exact adjacency, but preparation and travel buffers reserve time', async () => {
    const other = appointment({ startAt: interval.endAt, endAt: interval.endAt + 3600000 });
    const { state, connection } = fixture({ appointments: [other] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).resolves.toBeUndefined();
    state.appointments[0].preparationMinutes = 1;
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT', message: SCHEDULE_CONFLICT_MESSAGE });
    state.appointments[0].preparationMinutes = 0;
    await expect(assertNoScheduleConflict(connection as any, [1], { ...interval, travelMinutes: 1 })).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it.each(['appointments', 'bookings', 'live'])('blocks %s without revealing the private title', async source => {
    const value = source === 'appointments' ? appointment() : source === 'bookings' ? booking() : live();
    const { connection } = fixture({ [source]: [value] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT', message: SCHEDULE_CONFLICT_MESSAGE });
  });
  it('pending ordinary requests are tentative and do not block; confirmed/completed block', async () => {
    const { state, connection, execute } = fixture({ bookings: [booking({ status: 'pending' })] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).resolves.toBeUndefined();
    expect(execute.mock.calls.find(([query]) => query.includes('FROM bookings b'))?.[0]).not.toContain("'pending'");
    state.bookings[0].status = 'completed';
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('excludes only explicitly identified self sources, allowing existing group Live slots', async () => {
    const { connection } = fixture({ appointments: [appointment()], bookings: [booking()], live: [live()] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval, { appointmentId: 20, bookingId: 30, liveSlotId: 40 })).resolves.toBeUndefined();
    await expect(assertNoScheduleConflict(connection as any, [1], interval, { appointmentId: 20, bookingId: 30 })).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('fails closed on missing Live or another source', async () => {
    const { connection } = fixture({ failOn: 'FROM ology_live_time_slots' });
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
  it('legacy Live booking without a slot remains a commitment using persisted duration, not inferred duration', async () => {
    const { connection, execute } = fixture({ orphanLive: [live({ id: -44 })] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval, { liveSlotId: 44 })).rejects.toMatchObject({ code: 'CONFLICT' });
    const query = execute.mock.calls.find(([query]) => query.includes('SELECT -lb.id'))?.[0];
    expect(query).toContain('lb.duration*60000'); expect(query).toContain('NOT EXISTS');
  });
  it('checks unavailable/orphan-booked dates; generated timed booked day does not consume whole day', async () => {
    const { state, connection } = fixture({ days: [{ id: 60, date: timing.date, artistId: 7, status: 'unavailable' }] });
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(assertNoScheduleConflict(connection as any, [1], interval, { availabilityId: 60 })).resolves.toBeUndefined();
    state.days[0].status = 'booked';
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT' });
    state.backing.push(booking({ scheduleStartAt: interval.endAt, scheduleEndAt: interval.endAt + 3600000 }));
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).resolves.toBeUndefined();
    state.backing[0].scheduleStartAt = null;
    await expect(assertNoScheduleConflict(connection as any, [1], interval)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(assertNoScheduleConflict(connection as any, [1], interval, { bookingId: 30 })).resolves.toBeUndefined();
  });
  it('blocks manual venue dates and weekly closures across midnight', async () => {
    const overnight = resolveScheduleInterval({ ...timing, endDate: '2026-10-13', startTime: '23:30', endTime: '00:30' });
    const { state, connection, execute } = fixture({ recurring: [{ dayOfWeek: 2 }] });
    await expect(assertNoScheduleConflict(connection as any, [1], overnight)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(execute.mock.calls.find(([query]) => query.includes('FROM availability'))?.[1]).toEqual([1, '2026-10-12', '2026-10-13']);
    state.recurring = []; state.venueDays = [{ date: '2026-10-13' }];
    await expect(assertNoScheduleConflict(connection as any, [1], overnight)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('uses candidate timezone for legacy bookings, preserving dates without a fake two-hour duration', async () => {
    const old = booking({ scheduleStartAt: null, scheduleEndAt: null, eventDate: new Date('2026-10-12T12:00:00Z'), eventTime: '10:00' });
    const legacy = getBookingScheduleInterval(old, 'America/New_York');
    expect(legacy).toMatchObject({ allDay: true, date: '2026-10-12', timezone: 'America/New_York', preparationMinutes: 0, travelMinutes: 0 });
    expect(legacy.endAt - legacy.startAt).toBe(86400000);
    const candidate = resolveScheduleInterval({ ...timing, date: '2026-10-11', endDate: '2026-10-12', startTime: '23:30', endTime: '00:30', timezone: 'America/New_York' });
    await expect(assertNoScheduleConflict(fixture({ bookings: [old] }).connection as any, [1], candidate)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('honors explicit all-day flag and rejects malformed partially present timing', () => {
    expect(getBookingScheduleInterval(booking({ scheduleAllDay: true, preparationMinutes: 90 }), 'UTC')).toMatchObject({ allDay: true, preparationMinutes: 0 });
    expect(() => getBookingScheduleInterval(booking({ scheduleEndAt: null }), 'UTC')).toThrow();
  });
  it('bounds owner/date/time SQL and avoids joining client user IDs to venue profiles', async () => {
    const { connection, execute } = fixture();
    await assertNoScheduleConflict(connection as any, [3, 1, 3], interval);
    const call = execute.mock.calls.find(([query]) => query.includes('FROM bookings b'))!;
    expect(call[0]).toContain("NOT IN ('client_booking','client')");
    expect(call[0]).toContain('b.venueId IN');
    expect(call[1]?.slice(0, 6)).toEqual([1, 3, 1, 3, 1, 3]);
    const liveQuery = execute.mock.calls.find(([query]) => query.includes('FROM ology_live_time_slots'))?.[0];
    expect(liveQuery).toContain('(e.isActive=1 AND s.isAvailable=1) OR s.spotsTaken>0 OR EXISTS');
    expect(liveQuery).toContain("lb.status IN ('pending','confirmed')");
  });
});

describe('resource transaction serialization', () => {
  it('initializes guard then locks sorted unique owners on same connection, commits and releases', async () => {
    const { connection, execute } = fixture();
    const callback = vi.fn(async conn => { expect(conn).toBe(connection); return 'ok'; });
    expect(await withScheduleLock([4, 1, 4], callback)).toBe('ok');
    expect(mocks.schema).toHaveBeenCalledOnce();
    expect(execute.mock.calls.find(([query]) => query.includes('FOR UPDATE'))).toEqual(['SELECT id FROM users WHERE id IN (?,?) ORDER BY id FOR UPDATE', [1, 4]]);
    expect(execute.mock.calls.find(([query]) => query.includes('ISOLATION'))?.[0]).toContain('READ COMMITTED');
    expect(connection.commit).toHaveBeenCalledOnce(); expect(connection.rollback).not.toHaveBeenCalled(); expect(connection.release).toHaveBeenCalledOnce();
  });
  it('rolls back and releases on conflict, and never commits', async () => {
    const { connection } = fixture({ appointments: [appointment()] });
    await expect(withScheduleLock([1], conn => assertNoScheduleConflict(conn, [1], interval))).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(connection.rollback).toHaveBeenCalledOnce(); expect(connection.commit).not.toHaveBeenCalled(); expect(connection.release).toHaveBeenCalledOnce();
  });
  it('rejects empty/invalid or missing resource locks before invoking callback', async () => {
    const { connection } = fixture(); const callback = vi.fn();
    await expect(withScheduleLock([], callback)).rejects.toThrow();
    await expect(withScheduleLock([NaN], callback)).rejects.toThrow();
    connection.execute.mockImplementation(async sql => sql.includes('FROM users') ? [[], []] : [[], []]);
    await expect(withScheduleLock([1], callback)).rejects.toThrow();
    expect(callback).not.toHaveBeenCalled(); expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it('two concurrent same-owner writers serialize; second sees committed appointment and rejects', async () => {
    const store: any[] = []; let lockTail = Promise.resolve(); const events: string[] = [];
    mocks.pool.getConnection.mockImplementation(async () => {
      let unlock: () => void = () => undefined; let local: any[] = [];
      return {
        execute: async (sql: string, args: any[]) => {
          if (sql.includes('FROM users')) {
            const previous = lockTail; lockTail = new Promise<void>(resolve => { unlock = resolve; });
            await previous; events.push('locked'); return [[{ id: 1 }], []];
          }
          if (sql.includes('FROM schedule_appointments')) return [store, []];
          if (sql.includes('INSERT INTO')) { local.push(appointment()); events.push('insert'); return [{ insertId: 20 }, []]; }
          return [[], []];
        }, beginTransaction: async () => undefined,
        commit: async () => { store.push(...local); events.push('commit'); unlock(); },
        rollback: async () => { local = []; events.push('rollback'); unlock(); }, release: () => events.push('release'),
      };
    });
    const write = () => withScheduleLock([1], async conn => {
      await assertNoScheduleConflict(conn, [1], interval); await conn.execute('INSERT INTO schedule_appointments VALUES (?)', [1]);
    });
    const settled = await Promise.allSettled([write(), write()]);
    expect(settled.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(store).toHaveLength(1); expect(events.indexOf('commit')).toBeLessThan(events.lastIndexOf('locked')); expect(events).toContain('rollback');
  });
});

describe('private context and revision-safe mutations', () => {
  const member = (permissions: any) => ({ ownerUserId: 2, name: 'Managed artist', teamRole: 'manager', permissions });
  it('denies nonmembers even if their external role could be admin; own selection remains available', async () => {
    const { connection } = fixture();
    await expect(resolveScheduleContext(connection as any, 1, 2)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await resolveScheduleContext(connection as any, 1, 1)).toMatchObject({ ownerUserId: 1, canManage: true, isCollaborator: false, timezone: 'UTC' });
  });
  it.each([null, {}, { manageCalendar: 1 }, { manageCalendar: 'true' }, { manageBookings: true }, 'not-json'])('requires manageCalendar strictly true: %j', async permission => {
    const { connection } = fixture({ memberships: [member(permission)] });
    expect(await resolveScheduleContext(connection as any, 1)).toMatchObject({ ownerUserId: 2, canManage: false, isCollaborator: true });
  });
  it('authorized manager default is owner calendar, explicit own selection stays own', async () => {
    const { connection } = fixture({ memberships: [member('{"manageCalendar":true}')] });
    expect(await resolveScheduleContext(connection as any, 1)).toMatchObject({ ownerUserId: 2, canManage: true });
    expect(await resolveScheduleContext(connection as any, 1, 1)).toMatchObject({ ownerUserId: 1, canManage: true });
  });
  it('denied agenda never queries appointments, bookings, or Live', async () => {
    const { execute } = fixture({ memberships: [member({ manageCalendar: false })] });
    await expect(getScheduleAgenda(1, { fromDate: timing.date, toDate: timing.date, timezone: 'UTC' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(execute.mock.calls.some(([query]) => query.includes('FROM schedule_appointments') || query.includes('FROM bookings') || query.includes('FROM ology_live'))).toBe(false);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });
  it('rechecks permission after external Live reconciliation before reading private entries', async () => {
    const { state, execute } = fixture({ memberships: [member({ manageCalendar: true })] });
    mocks.reconcile.mockImplementationOnce(async () => { state.memberships[0].permissions = { manageCalendar: false }; });
    await expect(getScheduleAgenda(1, { fromDate: timing.date, toDate: timing.date, timezone: 'UTC' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.reconcile).toHaveBeenCalledWith({ userId: 2 });
    expect(execute.mock.calls.some(([query]) => query.includes('FROM schedule_appointments'))).toBe(false);
  });
  it('creates without checkout and verifies collaborator permission again inside owner lock transaction', async () => {
    const { execute, connection } = fixture({ memberships: [member({ manageCalendar: true })] });
    expect(await createScheduleAppointment(1, { ...timing, title: 'Radio', category: 'radio_interview' })).toEqual({ id: 50, revision: 1 });
    const permissions = execute.mock.calls.filter(([query]) => query.includes('FROM artist_team_members'));
    expect(permissions).toHaveLength(2); expect(permissions[1][0]).toContain('FOR UPDATE');
    expect(execute.mock.calls.find(([query]) => query.includes('SELECT id FROM users'))?.[1]).toEqual([1, 2]);
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(mocks.reconcile).toHaveBeenCalledWith({ userId: 2 });
    expect(mocks.reconcile.mock.invocationCallOrder[0]).toBeLessThan(connection.beginTransaction.mock.invocationCallOrder[0]);
  });
  it('does not write or expose provider details when Live reconciliation fails', async () => {
    const { connection } = fixture();
    mocks.reconcile.mockRejectedValueOnce(new Error('Private Stripe or database details'));
    await expect(createScheduleAppointment(1, { ...timing, title: 'Radio', category: 'radio_interview' })).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'Schedule is temporarily unavailable. Please try again.' });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });
  it('rechecks a permission revoked after context resolution and rolls back without insertion', async () => {
    const { state, execute, connection } = fixture({ memberships: [member({ manageCalendar: true })] });
    const original = execute.getMockImplementation()!;
    execute.mockImplementation(async (sql, args) => {
      if (sql.includes('FROM artist_team_members') && sql.includes('FOR UPDATE')) state.memberships[0].permissions = { manageCalendar: false };
      return original(sql, args);
    });
    await expect(createScheduleAppointment(1, { ...timing, title: 'Radio', category: 'radio_interview' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(execute.mock.calls.some(([query]) => query.includes('INSERT INTO schedule_appointments'))).toBe(false); expect(connection.rollback).toHaveBeenCalledOnce();
  });
  it('update excludes itself, increments revision, and cleans unread old reminders', async () => {
    const { execute } = fixture({ appointments: [appointment()] });
    expect(await updateScheduleAppointment(1, { ...timing, id: 20, expectedRevision: 1, title: 'Edited', category: 'podcast' })).toEqual({ id: 20, revision: 2 });
    expect(execute.mock.calls.some(([query]) => query.includes("r.source='appointment'") && query.includes('n.isRead=0'))).toBe(true);
  });
  it('rejects foreign ownership, stale revisions, and stale affected-row races without write', async () => {
    const { state, connection } = fixture({ appointments: [appointment({ ownerUserId: 2 })] });
    const input = { ...timing, id: 20, expectedRevision: 1, title: 'Edited', category: 'podcast' as const };
    await expect(updateScheduleAppointment(1, input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    state.appointments[0].ownerUserId = 1; state.appointments[0].revision = 2;
    await expect(updateScheduleAppointment(1, input)).rejects.toMatchObject({ code: 'CONFLICT' });
    state.appointments[0].revision = 1; state.affectedRows = 0;
    await expect(updateScheduleAppointment(1, input)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(connection.commit).not.toHaveBeenCalled();
  });
  it('returns pending agenda entries as tentative without fake duration and omits booking notes', async () => {
    const { state } = fixture({ appointments: [appointment()], bookings: [booking({ status: 'pending', scheduleStartAt: null, scheduleEndAt: null, notes: 'secret booking note' })] });
    state.preference = [{ reminderNotifications: false }];
    const agenda = await getScheduleAgenda(1, { fromDate: timing.date, toDate: timing.date, timezone: 'UTC' });
    expect(agenda.entries.find(entry => entry.source === 'booking')).toMatchObject({ allDay: true, date: timing.date, status: 'pending', notes: '', href: '/booking/30' });
    expect(agenda.entries.find(entry => entry.source === 'appointment')?.notes).toBe('PRIVATE NOTES');
    await expect(getScheduleAgenda(1, { fromDate: '2026-10-01', toDate: '2026-11-01', timezone: 'UTC' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
  it('accepts 31 calendar dates spanning daylight saving fall-back', async () => {
    fixture({ preference: [{ reminderNotifications: false }] });
    await expect(getScheduleAgenda(1, { fromDate: '2026-10-12', toDate: '2026-11-11', timezone: 'America/New_York' })).resolves.toMatchObject({ entries: [] });
  });
});

describe('native read-driven reminders', () => {
  const now = interval.startAt - 30 * 60000;
  it('deduplicates receipts durably and inserts reservation and notification in same transaction, no notes/location', async () => {
    const { state, connection, execute } = fixture({ appointments: [appointment()] });
    await materializeScheduleReminders(1, now); await materializeScheduleReminders(1, now + 60000);
    expect(state.receipts).toHaveLength(1); expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]).toMatchObject({ userId: 1, title: 'Schedule reminder', actionUrl: '/workspace?section=schedule' });
    expect(state.notifications[0].message).not.toContain('PRIVATE NOTES'); expect(state.notifications[0].message).not.toContain('PRIVATE LOCATION');
    expect(execute.mock.calls.find(([query]) => query.includes('INSERT INTO notifications'))?.[0]).toContain("'booking'");
    expect(connection.commit).toHaveBeenCalledTimes(2);
  });
  it('honors preferences and caps missed window instead of spamming far-past or future entries', async () => {
    const { state } = fixture({ appointments: [appointment()], preference: [{ reminderNotifications: 0 }] });
    await materializeScheduleReminders(1, now); expect(state.notifications).toHaveLength(0);
    state.preference = []; await materializeScheduleReminders(1, now - 1); expect(state.notifications).toHaveLength(0);
    await materializeScheduleReminders(1, now + 3 * 3600000); expect(state.notifications).toHaveLength(0);
  });
  it('cancel removes old unread notices and receipts prevent redelivery', async () => {
    const { state } = fixture({ appointments: [appointment()] });
    await materializeScheduleReminders(1, now); expect(state.notifications).toHaveLength(1);
    expect(await cancelScheduleAppointment(1, { id: 20, expectedRevision: 1 })).toEqual({ success: true });
    expect(state.notifications).toHaveLength(0); expect(state.receipts).toHaveLength(1);
    await materializeScheduleReminders(1, now); expect(state.notifications).toHaveLength(0);
  });
  it('pending ordinary booking requests never remind; all-day reminders arrive at local beginning of day', () => {
    const entry = { ...appointment(), source: 'booking', sourceId: 30, href: '/booking/30', status: 'pending' } as ScheduleEntry;
    expect(scheduleReminderDueAt(entry)).toBeNull();
    const allDay = { ...entry, status: 'confirmed', ...resolveScheduleInterval({ date: timing.date, allDay: true, timezone: 'America/New_York' }) };
    expect(new Date(scheduleReminderDueAt(allDay)!).toISOString()).toBe('2026-10-12T12:30:00.000Z');
  });
  it('notification insert failure rolls back reservation; best-effort inbox reads swallow unavailable Schedule', async () => {
    const { state, connection } = fixture({ appointments: [appointment()], failOn: 'INSERT INTO notifications' });
    await expect(materializeScheduleReminders(1, now)).rejects.toThrow();
    expect(connection.rollback).toHaveBeenCalledOnce(); expect(connection.commit).not.toHaveBeenCalled();
    expect(state.receipts).toHaveLength(0); expect(state.notifications).toHaveLength(0);
    await expect(materializeScheduleRemindersBestEffort(1)).resolves.toBeUndefined();
  });
  it('reminder processing uses current user own ID, not collaborator managed owner', async () => {
    const { execute } = fixture({ memberships: [{ ownerUserId: 2, teamRole: 'manager', permissions: { manageCalendar: true } }], appointments: [appointment()] });
    await materializeScheduleReminders(1, now);
    expect(execute.mock.calls.find(([query]) => query.includes('FROM schedule_appointments'))?.[1]?.[0]).toBe(1);
    expect(execute.mock.calls.some(([query]) => query.includes('FROM artist_team_members'))).toBe(false);
  });
});

describe('visible closures and accurate Live reminders',()=>{
 it('shows manual artist and venue all-day blocks as read-only agenda entries',async()=>{
  fixture({days:[{id:61,date:timing.date,status:'unavailable'}],venueDays:[{id:71,date:timing.date}],preference:[{reminderNotifications:false}]});
  const agenda=await getScheduleAgenda(1,{fromDate:timing.date,toDate:timing.date,timezone:'UTC'});
  expect(agenda.entries.filter(e=>e.source==='availability')).toHaveLength(2);
  expect(agenda.entries.every(e=>e.source!=='availability'||(e.allDay&&e.reminderMinutes===null&&e.notes===''))).toBe(true);
 });
 it('unbooked published Live availability blocks conflicts but does not create an appointment reminder',async()=>{
  const {state}=fixture({live:[live({talentId:1,spotsTaken:0,hasReservation:0})]});
  await materializeScheduleReminders(1,interval.startAt-1800000);expect(state.notifications).toHaveLength(0);
 });
 it('reserved Live sessions notify once and attendee agenda links to My Sessions',async()=>{
  const {state}=fixture({live:[live({talentId:2,spotsTaken:1,hasReservation:1,hasPaidReservation:1})]});
  const agenda=await getScheduleAgenda(1,{fromDate:timing.date,toDate:timing.date,timezone:'UTC'});
  expect(agenda.entries[0]).toMatchObject({source:'live',status:'reserved',href:'/ology-live/my-sessions',reminderMinutes:30});
  await materializeScheduleReminders(1,interval.startAt-1800000);await materializeScheduleReminders(1,interval.startAt-1700000);expect(state.notifications).toHaveLength(1);
 });
 it('unpaid checkout holds reserve time but do not notify as paid commitments',async()=>{
  const {state,execute}=fixture({live:[live({talentId:2,spotsTaken:1,hasReservation:1,hasPaidReservation:0})]});
  const agenda=await getScheduleAgenda(1,{fromDate:timing.date,toDate:timing.date,timezone:'UTC'});
  expect(agenda.entries[0]).toMatchObject({status:'reserved',reminderMinutes:null});
  await materializeScheduleReminders(1,interval.startAt-1800000);expect(state.notifications).toHaveLength(0);
  const query=execute.mock.calls.find(([sql])=>sql.includes('AS hasPaidReservation'))?.[0];
  expect(query).toContain("reminder.paymentStatus='paid'");expect(query).toContain('reminder.fanId IN');
 });
});
