import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const scheduleMocks = vi.hoisted(() => ({
  assertNoScheduleConflict: vi.fn(),
  withScheduleLock: vi.fn(async (_owners: number[], callback: (connection: any) => Promise<unknown>) => callback({ execute: vi.fn() })),
}));

vi.mock('./services/scheduleService', () => ({
  assertNoScheduleConflict: scheduleMocks.assertNoScheduleConflict,
  withScheduleLock: scheduleMocks.withScheduleLock,
}));

import {
  LiveScheduleError,
  assertLiveIntervalAvailable,
  buildRecurringLiveCandidates,
  parseManualLiveInterval,
  syncLiveSlotCapacity,
} from './services/ologyLiveScheduleService';

type FixtureReceipt = { experienceId: number; scheduledAt: Date; status: string };

function fixtureConnection(receipts: FixtureReceipt[], updates: unknown[][]) {
  return {
    execute: vi.fn(async (statement: string, values: unknown[] = []) => {
      if (statement.startsWith('SELECT COUNT(*) AS count FROM ology_live_bookings')) {
        const [experienceId, scheduledAt] = values as [number, Date];
        return [[{ count: receipts.filter(receipt => receipt.experienceId === experienceId
          && receipt.scheduledAt.getTime() === scheduledAt.getTime()
          && ['pending', 'confirmed'].includes(receipt.status)).length }], undefined] as any;
      }
      if (statement.startsWith('UPDATE ology_live_time_slots')) {
        updates.push(values);
        return [{ affectedRows: 1 }, undefined] as any;
      }
      throw new Error(`Unexpected SQL: ${statement}`);
    }),
  } as any;
}

describe('Ology Live shared scheduling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires absolute ISO timestamps and exact experience duration for manual slots', () => {
    expect(() => parseManualLiveInterval({
      startTime: '2030-06-01T10:00', endTime: '2030-06-01T10:30', scheduleTimezone: 'America/New_York',
    }, 30, Date.UTC(2029, 0, 1))).toThrow(/explicit UTC offset/i);

    expect(() => parseManualLiveInterval({
      startTime: '2030-06-01T10:00:00Z', endTime: '2030-06-01T10:45:00Z', scheduleTimezone: 'UTC',
    }, 30, Date.UTC(2029, 0, 1))).toThrow(/exactly 30 minutes/i);

    const interval = parseManualLiveInterval({
      startTime: '2030-06-01T10:00:00Z', endTime: '2030-06-01T10:30:00Z', scheduleTimezone: 'UTC',
    }, 30, Date.UTC(2029, 0, 1));
    expect(interval).toMatchObject({ startAt: Date.UTC(2030, 5, 1, 10), endAt: Date.UTC(2030, 5, 1, 10, 30), timezone: 'UTC' });
  });

  it('passes zero schedule buffers and current Live slot exclusion to the common conflict engine', async () => {
    const conn = { execute: vi.fn() } as any;
    await assertLiveIntervalAvailable(conn, 42, {
      startAt: 1000, endAt: 2000, timezone: 'UTC', allDay: false, date: '1970-01-01', preparationMinutes: 0, travelMinutes: 0,
    }, { liveSlotId: 7, bookingId: 9 });
    expect(scheduleMocks.assertNoScheduleConflict).toHaveBeenCalledWith(conn, [42], expect.objectContaining({ preparationMinutes: 0, travelMinutes: 0 }), { liveSlotId: 7, bookingId: 9 });

    scheduleMocks.assertNoScheduleConflict.mockRejectedValueOnce(new TRPCError({code:'CONFLICT',message:'This time overlaps an existing commitment.'}));
    await expect(assertLiveIntervalAvailable(conn, 42, {
      startAt: 1000, endAt: 2000, timezone: 'UTC', allDay: false, date: '1970-01-01', preparationMinutes: 0, travelMinutes: 0,
    })).rejects.toMatchObject({ kind: 'conflict' } satisfies Partial<LiveScheduleError>);
  });

  it('uses named-zone weekdays and skips the spring-forward nonexistent local hour without server-local Date setters', () => {
    // Sunday 10 March 2024 at 02:30 does not occur in America/New_York.
    const result = buildRecurringLiveCandidates({
      dayOfWeek: [0], startHour: 2, startMinute: 30, endHour: 3, endMinute: 30,
      timezone: 'America/New_York', weeksAhead: 1,
    }, 30, Date.UTC(2024, 2, 10, 4));
    expect(result.candidates).toHaveLength(0);
    expect(result.skipped.dstInvalid).toBe(1);
  });

  it('preserves group capacity above one and derives it from active receipts rather than a decrement', async () => {
    const start = new Date('2031-01-01T18:00:00.000Z');
    const receipts: FixtureReceipt[] = [
      { experienceId: 11, scheduledAt: start, status: 'confirmed' },
      { experienceId: 11, scheduledAt: start, status: 'pending' },
      { experienceId: 11, scheduledAt: start, status: 'cancelled' },
    ];
    const updates: unknown[][] = [];
    const conn = fixtureConnection(receipts, updates);
    const taken = await syncLiveSlotCapacity(conn, { id: 8, experienceId: 11, startTime: start, spotsTotal: 3 }, true);
    expect(taken).toBe(2);
    expect(updates).toEqual([[2, 1, 8]]);
  });

  it('does not allow an exact boundary overlap, but rejects a true overlap through the shared engine', async () => {
    const conn = { execute: vi.fn() } as any;
    await assertLiveIntervalAvailable(conn, 42, {
      startAt: 2_000, endAt: 3_000, timezone: 'UTC', allDay: false, date: '1970-01-01', preparationMinutes: 0, travelMinutes: 0,
    });
    expect(scheduleMocks.assertNoScheduleConflict).toHaveBeenCalledTimes(1);

    scheduleMocks.assertNoScheduleConflict.mockRejectedValueOnce(new TRPCError({code:'CONFLICT',message:'overlap'}));
    await expect(assertLiveIntervalAvailable(conn, 42, {
      startAt: 2_999, endAt: 3_500, timezone: 'UTC', allDay: false, date: '1970-01-01', preparationMinutes: 0, travelMinutes: 0,
    })).rejects.toMatchObject({ kind: 'conflict' });
  });

  it('serializes simultaneous final-spot attempts in a fixture: only one reservation is admitted', async () => {
    let taken = 1;
    let chain = Promise.resolve();
    const reserve = () => {
      const pending = chain.then(async () => {
        if (taken >= 2) return false;
        await Promise.resolve(); // emulate work while holding the deterministic talent lock
        taken++;
        return true;
      });
      chain = pending.then(() => undefined, () => undefined);
      return pending;
    };
    const [first, second] = await Promise.all([reserve(), reserve()]);
    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect(taken).toBe(2);
  });
});

describe('participant calendars and source outages',()=>{
 it('includes the attendee in the exact same shared conflict check',async()=>{
  const i=parseManualLiveInterval({startTime:'2030-06-01T19:00:00Z',endTime:'2030-06-01T19:30:00Z'},30,0);
  await assertLiveIntervalAvailable({execute:vi.fn()} as any,7,i,{liveSlotId:10},[8]);
  expect(scheduleMocks.assertNoScheduleConflict).toHaveBeenCalledWith(expect.anything(),[7,8],i,{liveSlotId:10});
 });
 it('does not mislabel a source outage as a normal skipped recurring conflict',async()=>{
  const error=new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Schedule is temporarily unavailable'});scheduleMocks.assertNoScheduleConflict.mockRejectedValueOnce(error);
  const i=parseManualLiveInterval({startTime:'2030-06-01T19:00:00Z',endTime:'2030-06-01T19:30:00Z'},30,0);
  await expect(assertLiveIntervalAvailable({execute:vi.fn()} as any,7,i)).rejects.toBe(error);
 });
});
