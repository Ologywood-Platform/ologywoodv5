import { beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  booking: {} as Record<string, any>,
  outside: { talentId: 7, fanId: 8 } as { talentId: number; fanId: number } | undefined,
  locks: [] as Array<{ talentId: number; fanIds: number[] }>,
  writes: [] as string[],
  conflicts: vi.fn(),
  capacity: vi.fn(),
}));

vi.mock('./db', () => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./stripe', () => ({ stripe: null }));
vi.mock('./services/scheduleService', () => ({
  assertNoScheduleConflict: vi.fn(),
  withScheduleLock: vi.fn(),
}));
vi.mock('./services/ologyLiveScheduleService', async importOriginal => {
  const actual = await importOriginal<typeof import('./services/ologyLiveScheduleService')>();
  const conn = { execute: vi.fn(async (statement: string) => {
    if (statement.startsWith('SELECT * FROM ology_live_bookings')) return [[{ ...fixture.booking }], undefined];
    if (statement.startsWith('UPDATE ology_live_bookings')) {
      fixture.writes.push(statement);
      return [{ affectedRows: 1 }, undefined];
    }
    throw new Error(`Unexpected mocked SQL: ${statement}`);
  }) };
  return {
    ...actual,
    getLiveBookingParticipants: vi.fn(async () => fixture.outside),
    withLockedLiveTalent: vi.fn(async (talentId: number, callback: any, fanIds: number[] = []) => {
      fixture.locks.push({ talentId, fanIds });
      return callback(conn);
    }),
    getLockedExperience: vi.fn(async () => ({ id: 3, talentId: 7, isActive: 1 })),
    findSlotForBooking: vi.fn(async () => ({ id: 4, talentId: 7, experienceId: 3, startTime: new Date('2030-01-01T18:00:00Z'), endTime: new Date('2030-01-01T18:30:00Z'), scheduleTimezone: 'UTC', spotsTotal: 1 })),
    assertLiveIntervalAvailable: fixture.conflicts,
    syncLiveSlotCapacity: fixture.capacity,
  };
});

import { ologyLiveRouter } from './routers/ologyLive';
const caller = (id: number, role = 'artist') => ologyLiveRouter.createCaller({ user: { id, role } } as any);

beforeEach(() => {
  vi.clearAllMocks();
  fixture.booking = { id: 9, talentId: 7, fanId: 8, experienceId: 3, status: 'pending', paymentStatus: 'paid', scheduledAt: new Date('2030-01-01T18:00:00Z'), duration: 30 };
  fixture.outside = { talentId: 7, fanId: 8 };
  fixture.locks.length = 0;
  fixture.writes.length = 0;
  fixture.conflicts.mockResolvedValue(undefined);
  fixture.capacity.mockResolvedValue(0);
});

describe('Ology Live participant-safe transitions', () => {
  it('locks talent and attendee before a fan cancellation and recomputes capacity', async () => {
    await expect(caller(8, 'user').cancelBooking({ bookingId: 9 })).resolves.toEqual({ success: true });
    expect(fixture.locks).toEqual([{ talentId: 7, fanIds: [8] }]);
    expect(fixture.writes).toHaveLength(1);
    expect(fixture.writes[0]).toContain("status='cancelled'");
    expect(fixture.capacity).toHaveBeenCalledOnce();
  });

  it.each(['talentId', 'fanId'])('rejects a stale %s preliminary lookup before any write', async key => {
    fixture.booking[key] = 12;
    await expect(caller(8, 'user').cancelBooking({ bookingId: 9 })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(fixture.writes).toEqual([]);
    expect(fixture.capacity).not.toHaveBeenCalled();
  });

  it('does not permit a stranger to cancel a receipt', async () => {
    await expect(caller(10, 'user').cancelBooking({ bookingId: 9 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(fixture.writes).toEqual([]);
  });

  it('never manually confirms an unpaid checkout hold', async () => {
    fixture.booking.paymentStatus = 'unpaid';
    await expect(caller(7).confirmBooking({ bookingId: 9 })).rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringMatching(/Payment must be verified/) });
    expect(fixture.locks).toEqual([{ talentId: 7, fanIds: [8] }]);
    expect(fixture.writes).toEqual([]);
    expect(fixture.conflicts).not.toHaveBeenCalled();
  });

  it('rechecks attendee conflicts and paid state before confirming', async () => {
    await expect(caller(7).confirmBooking({ bookingId: 9, joinLink: 'https://example.test/session' })).resolves.toEqual({ success: true });
    expect(fixture.locks).toEqual([{ talentId: 7, fanIds: [8] }]);
    expect(fixture.conflicts).toHaveBeenCalledWith(expect.anything(), 7, expect.anything(), { liveSlotId: 4 }, [8]);
    expect(fixture.writes[0]).toContain("paymentStatus='paid'");
    expect(fixture.capacity).toHaveBeenCalledOnce();
  });

  it('rejects a changed attendee on confirmation instead of checking an unlocked calendar', async () => {
    fixture.booking.fanId = 12;
    await expect(caller(7).confirmBooking({ bookingId: 9 })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(fixture.writes).toEqual([]);
    expect(fixture.conflicts).not.toHaveBeenCalled();
  });
});
