import { TRPCError } from '@trpc/server';
import { Temporal } from '@js-temporal/polyfill';
import {
  addCalendarDays,
  localDateAt,
  localTimeToEpoch,
  scheduleTimezoneSchema,
  type ScheduleInterval,
} from '../../shared/schedule';
import {
  assertNoScheduleConflict,
  withScheduleLock,
  type ScheduleConnection,
} from './scheduleService';
import { getDb, getPool } from '../db';

/**
 * This adapter deliberately uses SQL on the connection handed to it by
 * withScheduleLock. A Drizzle query here would quietly use a different pooled
 * connection and defeat the cross-product scheduling transaction.
 */
export type LiveScheduleConnection = ScheduleConnection & {
  execute(sql: string, values?: unknown[]): Promise<[any, unknown]>;
};

export type LiveSlotRow = {
  id: number;
  experienceId: number;
  talentId: number;
  startTime: Date | string;
  endTime: Date | string;
  scheduleTimezone: string | null;
  spotsTotal: number;
  spotsTaken: number;
  isAvailable: number | boolean;
};

export type LiveExperienceRow = {
  id: number;
  talentId: number;
  title: string;
  duration: number;
  price: string | number;
  capacityType: 'one_on_one' | 'small_group' | 'broadcast';
  maxAttendees: number | null;
  platform: string;
  platformLink: string | null;
  linkSentAfterBooking: number | boolean | null;
  category: string;
  isActive: number | boolean;
  recurringSchedule: unknown;
};

export type LiveBookingRow = {
  id: number;
  experienceId: number;
  fanId: number;
  talentId: number;
  scheduledAt: Date | string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  stripePaymentIntentId: string | null;
};

export class LiveScheduleError extends Error {
  constructor(
    message: string,
    public readonly kind: 'validation' | 'conflict' | 'not_found' | 'capacity' | 'duplicate' = 'validation',
  ) {
    super(message);
    this.name = 'LiveScheduleError';
  }
}

export type RecurringLiveSchedule = {
  dayOfWeek: number[];
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
  weeksAhead: number;
};

export type RecurringCandidateResult = {
  candidates: Array<{ startAt: number; endAt: number; timezone: string }>;
  skipped: {
    dstInvalid: number;
    past: number;
    duplicate: number;
    conflict: number;
  };
};

const ACTIVE_RECEIPT_STATUSES = ['pending', 'confirmed'] as const;
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

function epoch(value: Date | string): number {
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(result)) throw new LiveScheduleError('Stored Live schedule time is invalid.');
  return result;
}

function countValue(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function rows<T>(conn: LiveScheduleConnection, statement: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await conn.execute(statement, values);
  return result as T[];
}

async function result(conn: LiveScheduleConnection, statement: string, values: unknown[] = []): Promise<{ insertId?: number; affectedRows?: number }> {
  const [writeResult] = await conn.execute(statement, values);
  return writeResult as { insertId?: number; affectedRows?: number };
}

export function isLiveActive(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

export function liveSlotInterval(slot: Pick<LiveSlotRow, 'startTime' | 'endTime' | 'scheduleTimezone'>): ScheduleInterval {
  const startAt = epoch(slot.startTime);
  const endAt = epoch(slot.endTime);
  const timezone = slot.scheduleTimezone || 'UTC';
  return {
    startAt,
    endAt,
    timezone,
    allDay: false,
    date: localDateAt(startAt, timezone),
    preparationMinutes: 0,
    travelMinutes: 0,
  };
}

/** Manual slots are absolute instants. Offset-less browser strings are refused. */
export function parseManualLiveInterval(input: {
  startTime: string;
  endTime: string;
  scheduleTimezone?: string | null;
}, expectedDurationMinutes: number, now = Date.now()): ScheduleInterval {
  const timezone = input.scheduleTimezone || 'UTC';
  try {
    scheduleTimezoneSchema.parse(timezone);
  } catch {
    throw new LiveScheduleError('Choose a valid named timezone for this Live slot.');
  }
  if (!ISO_WITH_OFFSET.test(input.startTime) || !ISO_WITH_OFFSET.test(input.endTime)) {
    throw new LiveScheduleError('Live slot times must be ISO timestamps with an explicit UTC offset (for example, 2027-06-01T19:00:00Z).');
  }

  let startAt: number;
  let endAt: number;
  try {
    startAt = Temporal.Instant.from(input.startTime).epochMilliseconds;
    endAt = Temporal.Instant.from(input.endTime).epochMilliseconds;
  } catch {
    throw new LiveScheduleError('Live slot times must be valid ISO timestamps with an explicit UTC offset.');
  }
  if (endAt <= startAt) throw new LiveScheduleError('Live slot end time must be after its start time.');
  if (startAt <= now) throw new LiveScheduleError('Live slots must begin in the future.');
  if (endAt - startAt !== expectedDurationMinutes * 60_000) {
    throw new LiveScheduleError(`This experience requires slots of exactly ${expectedDurationMinutes} minutes.`);
  }
  return {
    startAt,
    endAt,
    timezone,
    allDay: false,
    date: localDateAt(startAt, timezone),
    preparationMinutes: 0,
    travelMinutes: 0,
  };
}

function parseRecurringSchedule(schedule: RecurringLiveSchedule): RecurringLiveSchedule {
  try {
    scheduleTimezoneSchema.parse(schedule.timezone);
  } catch {
    throw new LiveScheduleError('Choose a valid named timezone for recurring availability.');
  }
  if (!Number.isInteger(schedule.weeksAhead) || schedule.weeksAhead < 1 || schedule.weeksAhead > 8) {
    throw new LiveScheduleError('Recurring availability must be generated between 1 and 8 weeks ahead.');
  }
  for (const key of ['startHour', 'endHour'] as const) {
    if (!Number.isInteger(schedule[key]) || schedule[key] < 0 || schedule[key] > 23) throw new LiveScheduleError('Recurring hours must be valid local hours.');
  }
  for (const key of ['startMinute', 'endMinute'] as const) {
    if (!Number.isInteger(schedule[key]) || schedule[key] < 0 || schedule[key] > 59) throw new LiveScheduleError('Recurring minutes must be valid local minutes.');
  }
  if (!Array.isArray(schedule.dayOfWeek) || !schedule.dayOfWeek.length || schedule.dayOfWeek.some(day => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new LiveScheduleError('Choose at least one valid weekday for recurring availability.');
  }
  return { ...schedule, dayOfWeek: [...new Set(schedule.dayOfWeek)] };
}

/**
 * Convert local weekday/hour choices via Temporal, never the server-local Date
 * setters. A nonexistent or ambiguous local clock time is skipped, because the
 * shared scheduling contract deliberately rejects both states.
 */
export function buildRecurringLiveCandidates(
  rawSchedule: RecurringLiveSchedule,
  durationMinutes: number,
  now = Date.now(),
): RecurringCandidateResult {
  const schedule = parseRecurringSchedule(rawSchedule);
  const skipped = { dstInvalid: 0, past: 0, duplicate: 0, conflict: 0 };
  const candidates: Array<{ startAt: number; endAt: number; timezone: string }> = [];
  const today = Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO(schedule.timezone).toPlainDate();
  const startClock = schedule.startHour * 60 + schedule.startMinute;
  const endClock = schedule.endHour * 60 + schedule.endMinute;

  for (let offset = 0; offset < schedule.weeksAhead * 7; offset++) {
    const date = today.add({ days: offset });
    // Temporal dayOfWeek is ISO Monday=1..Sunday=7; Live keeps Sunday=0..Saturday=6.
    if (!schedule.dayOfWeek.includes(date.dayOfWeek % 7)) continue;
    const dateText = date.toString();
    const endDateText = endClock <= startClock ? addCalendarDays(dateText, 1) : dateText;
    const startText = `${String(schedule.startHour).padStart(2, '0')}:${String(schedule.startMinute).padStart(2, '0')}`;
    const endText = `${String(schedule.endHour).padStart(2, '0')}:${String(schedule.endMinute).padStart(2, '0')}`;

    let windowStart: number;
    let windowEnd: number;
    try {
      windowStart = localTimeToEpoch(dateText, startText, schedule.timezone);
      windowEnd = localTimeToEpoch(endDateText, endText, schedule.timezone);
    } catch {
      // Count this requested recurring window once; its individual slots do not exist.
      skipped.dstInvalid++;
      continue;
    }
    if (windowEnd <= windowStart) {
      skipped.dstInvalid++;
      continue;
    }

    for (let startAt = windowStart; startAt + durationMinutes * 60_000 <= windowEnd; startAt += durationMinutes * 60_000) {
      if (startAt <= now) {
        skipped.past++;
        continue;
      }
      candidates.push({ startAt, endAt: startAt + durationMinutes * 60_000, timezone: schedule.timezone });
    }
  }
  return { candidates, skipped };
}

function isConflict(error: unknown): boolean {
  return error instanceof TRPCError && error.code === 'CONFLICT';
}

export async function assertLiveIntervalAvailable(
  conn: LiveScheduleConnection,
  talentId: number,
  interval: ScheduleInterval,
  exclusions: { liveSlotId?: number; bookingId?: number } = {},
  participantIds: number[] = [],
): Promise<void> {
  try {
    await assertNoScheduleConflict(conn, [talentId, ...participantIds], interval, exclusions);
  } catch (error) {
    if (isConflict(error)) throw new LiveScheduleError('This Live time conflicts with an existing calendar commitment.', 'conflict');
    throw error;
  }
}

export async function insertLiveSlot(
  conn: LiveScheduleConnection,
  values: {
    experienceId: number;
    talentId: number;
    interval: ScheduleInterval;
    spotsTotal: number;
  },
): Promise<number> {
  const write = await result(conn,
    'INSERT INTO ology_live_time_slots (experienceId,talentId,startTime,endTime,scheduleTimezone,spotsTotal,spotsTaken,isAvailable) VALUES (?,?,?,?,?,?,0,1)',
    [values.experienceId, values.talentId, new Date(values.interval.startAt), new Date(values.interval.endAt), values.interval.timezone, values.spotsTotal],
  );
  if (!write.insertId) throw new Error('Live slot was not created.');
  return Number(write.insertId);
}

export async function getLockedExperience(conn: LiveScheduleConnection, experienceId: number, talentId: number): Promise<LiveExperienceRow | undefined> {
  return (await rows<LiveExperienceRow>(conn,
    'SELECT * FROM ology_live_experiences WHERE id=? AND talentId=? LIMIT 1 FOR UPDATE',
    [experienceId, talentId],
  ))[0];
}

export async function getLockedLiveSlot(conn: LiveScheduleConnection, slotId: number, talentId: number, experienceId?: number): Promise<LiveSlotRow | undefined> {
  const statement = experienceId === undefined
    ? 'SELECT * FROM ology_live_time_slots WHERE id=? AND talentId=? LIMIT 1 FOR UPDATE'
    : 'SELECT * FROM ology_live_time_slots WHERE id=? AND talentId=? AND experienceId=? LIMIT 1 FOR UPDATE';
  const values = experienceId === undefined ? [slotId, talentId] : [slotId, talentId, experienceId];
  return (await rows<LiveSlotRow>(conn, statement, values))[0];
}

export async function getLockedLiveBooking(conn: LiveScheduleConnection, bookingId: number): Promise<LiveBookingRow | undefined> {
  return (await rows<LiveBookingRow>(conn,
    'SELECT * FROM ology_live_bookings WHERE id=? LIMIT 1 FOR UPDATE',
    [bookingId],
  ))[0];
}

/** A preliminary lookup chooses locks only; all writers must revalidate it here. */
export async function getLockedLiveBookingForParticipants(
  conn: LiveScheduleConnection,
  bookingId: number,
  participants: { talentId: number; fanId: number },
): Promise<LiveBookingRow | undefined> {
  const booking = await getLockedLiveBooking(conn, bookingId);
  if (booking && (booking.talentId !== participants.talentId || booking.fanId !== participants.fanId)) {
    throw new LiveScheduleError('This reservation changed. Please refresh and try again.', 'conflict');
  }
  return booking;
}

export async function getLiveBookingOwner(bookingId: number): Promise<number | undefined> {
  await getDb();
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const [found] = await pool.execute('SELECT talentId FROM ology_live_bookings WHERE id=? LIMIT 1', [bookingId]);
  const booking = (found as Array<{ talentId: number }>)[0];
  return booking?.talentId;
}

export async function countActiveSlotReceipts(conn: LiveScheduleConnection, experienceId: number, scheduledAt: Date | string): Promise<number> {
  const count = (await rows<{ count: number | string }>(conn,
    "SELECT COUNT(*) AS count FROM ology_live_bookings WHERE experienceId=? AND scheduledAt=? AND status IN ('pending','confirmed') FOR UPDATE",
    [experienceId, new Date(epoch(scheduledAt))],
  ))[0];
  return countValue(count?.count);
}

/** Recompute from receipts so a retry/cancel can never decrement capacity twice. */
export async function syncLiveSlotCapacity(
  conn: LiveScheduleConnection,
  slot: Pick<LiveSlotRow, 'id' | 'experienceId' | 'startTime' | 'spotsTotal'>,
  experienceIsActive: boolean,
): Promise<number> {
  const taken = await countActiveSlotReceipts(conn, slot.experienceId, slot.startTime);
  await result(conn,
    'UPDATE ology_live_time_slots SET spotsTaken=?, isAvailable=? WHERE id=?',
    [taken, experienceIsActive && taken < Number(slot.spotsTotal) ? 1 : 0, slot.id],
  );
  return taken;
}

export async function findSlotForBooking(conn: LiveScheduleConnection, booking: Pick<LiveBookingRow, 'experienceId' | 'scheduledAt' | 'talentId'>): Promise<LiveSlotRow | undefined> {
  return (await rows<LiveSlotRow>(conn,
    'SELECT * FROM ology_live_time_slots WHERE experienceId=? AND talentId=? AND startTime=? ORDER BY id ASC LIMIT 1 FOR UPDATE',
    [booking.experienceId, booking.talentId, new Date(epoch(booking.scheduledAt))],
  ))[0];
}

export async function createRecurringLiveSlots(
  conn: LiveScheduleConnection,
  experience: LiveExperienceRow,
  schedule: RecurringLiveSchedule,
  now = Date.now(),
): Promise<{ slotsCreated: number; slotsSkipped: number; skipReasons: RecurringCandidateResult['skipped'] }> {
  const generated = buildRecurringLiveCandidates(schedule, Number(experience.duration), now);
  let created = 0;
  const skipped = { ...generated.skipped };
  const spotsTotal = Math.max(1, Number(experience.maxAttendees || 1));

  for (const candidate of generated.candidates) {
    const exact = await rows<Pick<LiveSlotRow, 'id'>>(conn,
      'SELECT id FROM ology_live_time_slots WHERE experienceId=? AND startTime=? AND endTime=? LIMIT 1 FOR UPDATE',
      [experience.id, new Date(candidate.startAt), new Date(candidate.endAt)],
    );
    if (exact.length) {
      skipped.duplicate++;
      continue;
    }
    const interval: ScheduleInterval = {
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      timezone: candidate.timezone,
      allDay: false,
      date: localDateAt(candidate.startAt, candidate.timezone),
      preparationMinutes: 0,
      travelMinutes: 0,
    };
    try {
      await assertLiveIntervalAvailable(conn, experience.talentId, interval);
    } catch (error) {
      if (error instanceof LiveScheduleError && error.kind === 'conflict') {
        skipped.conflict++;
        continue;
      }
      throw error;
    }
    await insertLiveSlot(conn, { experienceId: experience.id, talentId: experience.talentId, interval, spotsTotal });
    created++;
  }

  return {
    slotsCreated: created,
    slotsSkipped: skipped.dstInvalid + skipped.past + skipped.duplicate + skipped.conflict,
    skipReasons: skipped,
  };
}

/** Export the exact lock wrapper so router mutations cannot accidentally choose another pool. */
export async function withLockedLiveTalent<T>(talentId: number, callback: (conn: LiveScheduleConnection) => Promise<T>, participantIds: number[] = []): Promise<T> {
  return withScheduleLock([talentId, ...participantIds], connection => callback(connection as LiveScheduleConnection));
}

export const LIVE_ACTIVE_RECEIPT_STATUSES = ACTIVE_RECEIPT_STATUSES;

export async function getLiveBookingParticipants(bookingId: number): Promise<{ talentId: number; fanId: number } | undefined> {
  await getDb();
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const [found] = await pool.execute('SELECT talentId,fanId FROM ology_live_bookings WHERE id=? LIMIT 1', [bookingId]);
  return (found as Array<{ talentId: number; fanId: number }>)[0];
}
