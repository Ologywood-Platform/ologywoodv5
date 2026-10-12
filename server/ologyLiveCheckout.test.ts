import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getPool: vi.fn(),
  ensureSchema: vi.fn(),
  getParticipants: vi.fn(),
  getLockedBooking: vi.fn(),
  getLockedBookingForParticipants: vi.fn(),
  getLockedExperience: vi.fn(),
  findSlot: vi.fn(),
  syncCapacity: vi.fn(),
  withLocked: vi.fn(),
  stripeForMode: vi.fn(),
  retrieveCheckout: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  poolExecute: vi.fn(),
}));

vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));
vi.mock('./services/ologyLiveSchemaService', () => ({ ensureOlogyLiveBookingsSchema: mocks.ensureSchema }));
vi.mock('./services/stripeWebhookMode', () => ({ getStripeClientForWebhookMode: mocks.stripeForMode }));
vi.mock('./services/ologyLiveScheduleService', () => ({
  getLiveBookingParticipants: mocks.getParticipants,
  getLockedLiveBooking: mocks.getLockedBooking,
  getLockedLiveBookingForParticipants: mocks.getLockedBookingForParticipants,
  getLockedExperience: mocks.getLockedExperience,
  findSlotForBooking: mocks.findSlot,
  isLiveActive: (value: unknown) => value === true || value === 1,
  syncLiveSlotCapacity: mocks.syncCapacity,
  withLockedLiveTalent: mocks.withLocked,
}));

import {
  handleOlogyLiveCheckout,
  handleOlogyLiveCheckoutRefund,
  handleOlogyLiveCheckoutTerminal,
  reconcileOlogyLiveReservations,
} from './services/ologyLiveCheckoutService';

type BookingOverrides = Partial<ReturnType<typeof booking>>;

function metadata(overrides: Record<string, string> = {}) {
  return {
    type: 'ology_live_booking', bookingId: '101', experienceId: '21', slotId: '31', fanId: '7', talentId: '9',
    ...overrides,
  };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_live_booking', livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
    currency: 'usd', amount_total: 2500, payment_intent: 'pi_live_booking', metadata: metadata(), ...overrides,
  } as any;
}

function paymentIntent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pi_live_booking', livemode: false, status: 'succeeded', currency: 'usd', amount: 2500, amount_received: 2500, metadata: metadata(),
    latest_charge: { id: 'ch_live_booking', amount: 2500, amount_refunded: 0, refunded: false }, ...overrides,
  } as any;
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 101, experienceId: 21, fanId: 7, talentId: 9, scheduledAt: new Date('2030-01-01T10:00:00Z'), duration: 30,
    status: 'pending', paymentStatus: 'unpaid', stripePaymentIntentId: 'cs_live_booking', amount: '25.00',
    createdAt: new Date(Date.now() - 31 * 60_000), ...overrides,
  } as any;
}

function setup(lockedBooking: BookingOverrides = {}) {
  const conn = { execute: vi.fn() };
  conn.execute.mockResolvedValue([{ affectedRows: 1 }]);
  const current = session();
  mocks.getDb.mockResolvedValue({});
  mocks.ensureSchema.mockResolvedValue(undefined);
  mocks.getParticipants.mockResolvedValue({ talentId: 9, fanId: 7 });
  mocks.getLockedBooking.mockResolvedValue(booking(lockedBooking));
  mocks.getLockedBookingForParticipants.mockImplementation(async (_conn: unknown, _id: number, participants: any) => {
    const row = booking(lockedBooking);
    if (row.talentId !== participants.talentId || row.fanId !== participants.fanId) throw new Error('participant mismatch');
    return row;
  });
  mocks.getLockedExperience.mockResolvedValue({ id: 21, talentId: 9, isActive: true });
  mocks.findSlot.mockResolvedValue({ id: 31, experienceId: 21, talentId: 9, startTime: booking().scheduledAt, spotsTotal: 2 });
  mocks.syncCapacity.mockResolvedValue(0);
  mocks.withLocked.mockImplementation(async (_talent: number, callback: (connection: any) => Promise<unknown>, people: number[]) => {
    expect(people).toEqual([7]);
    return callback(conn);
  });
  mocks.retrieveCheckout.mockResolvedValue(current);
  mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent());
  mocks.stripeForMode.mockReturnValue({
    checkout: { sessions: { retrieve: mocks.retrieveCheckout } },
    paymentIntents: { retrieve: mocks.retrievePaymentIntent },
  });
  return { conn, current };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Ology Live authoritative Checkout lifecycle', () => {
  it('fulfills a verified current paid Checkout before its attachment write races in, preserving pending status and binding cs id', async () => {
    const { conn, current } = setup({ stripePaymentIntentId: null });
    await handleOlogyLiveCheckout(session());
    expect(mocks.retrieveCheckout).toHaveBeenCalledWith('cs_live_booking');
    expect(mocks.retrievePaymentIntent).toHaveBeenCalledWith('pi_live_booking', { expand: ['latest_charge'] });
    expect(mocks.withLocked).toHaveBeenCalledWith(9, expect.any(Function), [7]);
    expect(conn.execute.mock.calls[0][0]).toContain("paymentStatus='paid'");
    expect(conn.execute.mock.calls[0][1]).toEqual([current.id, 101, 21, 7, 9, current.id]);
    expect(conn.execute.mock.calls[0][0]).not.toContain("status='confirmed'");
  });

  it('accepts legacy empty PaymentIntent metadata only with the exact already-bound Checkout receipt', async () => {
    const { conn } = setup();
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ metadata: {} }));
    await handleOlogyLiveCheckout(session());
    expect(conn.execute).toHaveBeenCalledOnce();
    vi.clearAllMocks();
    const unbound = setup({ stripePaymentIntentId: null });
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ metadata: {} }));
    await expect(handleOlogyLiveCheckout(session())).rejects.toThrow('Ology Live checkout processing failed.');
    expect(unbound.conn.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['wrong amount', session({ amount_total: 2501 })],
    ['wrong currency', session({ currency: 'eur' })],
    ['wrong mode', session({ mode: 'subscription' })],
    ['wrong identity', session({ metadata: metadata({ bookingId: '102' }) })],
  ])('fails closed for %s and writes nothing', async (_label, current) => {
    const { conn } = setup();
    mocks.retrieveCheckout.mockResolvedValue(current);
    await expect(handleOlogyLiveCheckout(session())).rejects.toThrow('Ology Live checkout processing failed.');
    expect(mocks.withLocked).not.toHaveBeenCalled();
    expect(conn.execute).not.toHaveBeenCalled();
  });

  it('fails closed for invalid current payment amounts and provider timeouts', async () => {
    const cases = [
      () => mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ amount_received: 2499 })),
      () => mocks.retrieveCheckout.mockImplementation(() => new Promise(() => undefined)),
    ];
    for (const arrange of cases) {
      const { conn } = setup();
      arrange();
      await expect(handleOlogyLiveCheckout(session())).rejects.toThrow('Ology Live checkout processing failed.');
      expect(conn.execute).not.toHaveBeenCalled();
      vi.clearAllMocks();
    }
  }, 7_000);

  it('acknowledges an unpaid async Checkout completion without granting or manually confirming access', async () => {
    const { conn } = setup();
    mocks.retrieveCheckout.mockResolvedValue(session({ payment_status: 'unpaid' }));
    await handleOlogyLiveCheckout(session({ payment_status: 'unpaid' }));
    expect(mocks.withLocked).not.toHaveBeenCalled();
    expect(conn.execute).not.toHaveBeenCalled();
  });

  it('reflects authoritative full-refund proof on a delayed completion instead of paying or retaining an unpaid ghost hold', async () => {
    const { conn } = setup();
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ latest_charge: { amount: 2500, amount_refunded: 2500, refunded: true } }));
    await handleOlogyLiveCheckout(session());
    expect(conn.execute.mock.calls[0][0]).toContain("paymentStatus='refunded'");
    expect(conn.execute.mock.calls[0][0]).not.toContain("SET paymentStatus='paid'");
    expect(mocks.syncCapacity).toHaveBeenCalledOnce();
  });

  it('is idempotent and cannot resurrect paid, cancelled, completed, or refunded rows during duplicated/reordered success events', async () => {
    for (const row of [
      booking({ paymentStatus: 'paid' }), booking({ status: 'cancelled' }), booking({ status: 'completed' }), booking({ paymentStatus: 'refunded' }),
    ]) {
      const { conn } = setup(row);
      await handleOlogyLiveCheckout(session());
      await handleOlogyLiveCheckout(session());
      expect(conn.execute).not.toHaveBeenCalled();
      vi.clearAllMocks();
    }
  });

  it('cancels only an expired unpaid receipt bound to this cs id, under both locks, and recomputes shared capacity', async () => {
    const { conn } = setup();
    mocks.retrieveCheckout.mockResolvedValue(session({ status: 'expired', payment_status: 'unpaid' }));
    await handleOlogyLiveCheckoutTerminal(session({ status: 'expired', payment_status: 'unpaid' }));
    expect(mocks.withLocked).toHaveBeenCalledWith(9, expect.any(Function), [7]);
    expect(conn.execute.mock.calls[0][0]).toContain("status='cancelled'");
    expect(mocks.syncCapacity).toHaveBeenCalledWith(conn, expect.objectContaining({ id: 31 }), true);
  });

  it('releases a definitively failed async payment but does not release a processing payment', async () => {
    const { conn } = setup();
    mocks.retrieveCheckout.mockResolvedValue(session({ status: 'complete', payment_status: 'unpaid' }));
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ status: 'requires_payment_method', last_payment_error: { message: 'Declined' } }));
    await handleOlogyLiveCheckoutTerminal(session({ payment_status: 'unpaid' }));
    expect(conn.execute.mock.calls[0][0]).toContain("status='cancelled'");
    expect(mocks.syncCapacity).toHaveBeenCalledOnce();
    vi.clearAllMocks();
    const processing = setup();
    mocks.retrieveCheckout.mockResolvedValue(session({ status: 'complete', payment_status: 'unpaid' }));
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ status: 'processing' }));
    await handleOlogyLiveCheckoutTerminal(session({ payment_status: 'unpaid' }));
    expect(processing.conn.execute).not.toHaveBeenCalled();
  });

  it('does not cancel an expired event replay after payment, cancellation, or refund', async () => {
    for (const state of [booking({ paymentStatus: 'paid' }), booking({ status: 'cancelled' }), booking({ paymentStatus: 'refunded' })]) {
      const { conn } = setup(state);
      mocks.retrieveCheckout.mockResolvedValue(session({ status: 'expired', payment_status: 'unpaid' }));
      await handleOlogyLiveCheckoutTerminal(session({ status: 'expired', payment_status: 'unpaid' }));
      expect(conn.execute).not.toHaveBeenCalled();
      expect(mocks.syncCapacity).not.toHaveBeenCalled();
      vi.clearAllMocks();
    }
  });

  it('fails closed when the participant tuple changes before the shared locks are acquired', async () => {
    setup();
    mocks.getLockedBookingForParticipants.mockRejectedValue(new Error('participant mismatch'));
    await expect(handleOlogyLiveCheckout(session())).rejects.toThrow('Ology Live checkout processing failed.');
  });

  it('marks only verified full Live refunds refunded/cancelled; a partial refund preserves paid state', async () => {
    const { conn } = setup({ paymentStatus: 'paid' });
    const charge = { livemode: false, payment_intent: 'pi_live_booking', metadata: metadata() } as any;
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ stripePaymentIntentId: 'cs_live_booking' }]]);
    mocks.retrieveCheckout.mockResolvedValue(session());
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ latest_charge: { amount: 2500, amount_refunded: 2500, refunded: true } }));
    await handleOlogyLiveCheckoutRefund(charge);
    expect(conn.execute.mock.calls[0][0]).toContain("paymentStatus='refunded'");
    expect(mocks.syncCapacity).toHaveBeenCalled();

    vi.clearAllMocks();
    setup({ paymentStatus: 'paid' });
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ latest_charge: { amount: 2500, amount_refunded: 100, refunded: false } }));
    await handleOlogyLiveCheckoutRefund(charge);
    expect(mocks.withLocked).not.toHaveBeenCalled();
  });

  it('releases a fully refunded receipt even when refund arrives before paid fulfillment, and never resurrects it', async () => {
    const state = { paymentStatus: 'unpaid', status: 'pending' };
    const { conn } = setup(state);
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ stripePaymentIntentId: 'cs_live_booking' }]]);
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ latest_charge: { amount: 2500, amount_refunded: 2500, refunded: true } }));
    conn.execute.mockImplementation(async () => {
      state.paymentStatus = 'refunded'; state.status = 'cancelled';
      return [{ affectedRows: 1 }];
    });
    await handleOlogyLiveCheckoutRefund({ livemode: false, payment_intent: 'pi_live_booking', metadata: metadata() } as any);
    expect(state).toEqual({ paymentStatus: 'refunded', status: 'cancelled' });
    expect(conn.execute.mock.calls[0][0]).toContain("paymentStatus IN ('unpaid','paid')");
    expect(mocks.syncCapacity).toHaveBeenCalledOnce();
    // Even an older apparently successful proof cannot override the persisted refund.
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent());
    await handleOlogyLiveCheckout(session());
    expect(conn.execute).toHaveBeenCalledOnce();
  });

  it('rejects a refund PaymentIntent from the wrong Stripe mode before any mutation', async () => {
    const { conn } = setup({ paymentStatus: 'paid' });
    mocks.retrievePaymentIntent.mockResolvedValue(paymentIntent({ livemode: true, latest_charge: { amount: 2500, amount_refunded: 2500, refunded: true } }));
    await expect(handleOlogyLiveCheckoutRefund({ livemode: false, payment_intent: 'pi_live_booking', metadata: metadata() } as any)).rejects.toThrow('Ology Live checkout processing failed.');
    expect(conn.execute).not.toHaveBeenCalled();
  });
});

describe('bounded stale-hold reconciliation', () => {
  it('refuses platform-wide unscoped cleanup before accessing the database', async () => {
    setup();
    await expect(reconcileOlogyLiveReservations({})).rejects.toThrow('Ology Live checkout processing failed.');
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('queries at most 50 stale minimal receipts, obtains current Stripe state outside locks, and fulfills delayed paid Checkout', async () => {
    const { conn } = setup();
    const order: string[] = [];
    mocks.retrieveCheckout.mockImplementation(async () => { order.push('stripe'); return session(); });
    mocks.withLocked.mockImplementation(async (_talent: number, callback: (connection: any) => Promise<unknown>) => {
      order.push('lock');
      return callback(conn);
    });
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: 'cs_live_booking' }]]);
    await reconcileOlogyLiveReservations({ experienceId: 21, userId: 7 });
    const [query, values] = mocks.poolExecute.mock.calls[0];
    expect(query).toContain('SELECT id, stripePaymentIntentId');
    expect(query).toContain('LIMIT ?');
    expect(values.at(-1)).toBe(50);
    expect(order).toEqual(['stripe', 'lock']);
    expect(conn.execute.mock.calls[0][0]).toContain("paymentStatus='paid'");
  });

  it('releases stale null attachments only after an in-lock createdAt/current-state recheck and leaves normal/attached holds unchanged', async () => {
    const { conn } = setup({ stripePaymentIntentId: null, createdAt: new Date(Date.now() - 31 * 60_000) });
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: null }]]);
    await reconcileOlogyLiveReservations({ userId: 7 });
    expect(conn.execute.mock.calls[0][0]).toContain('stripePaymentIntentId IS NULL');
    expect(mocks.syncCapacity).toHaveBeenCalled();

    vi.clearAllMocks();
    setup({ stripePaymentIntentId: null, createdAt: new Date() });
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: null }]]);
    await reconcileOlogyLiveReservations({ userId: 7 });
    expect(conn.execute).not.toHaveBeenCalled();
  });

  it('releases only current expired unpaid Checkout, retains open/async-unpaid state, and surfaces Stripe outages generically', async () => {
    const { conn } = setup();
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: 'cs_live_booking' }]]);
    mocks.retrieveCheckout.mockResolvedValue(session({ status: 'expired', payment_status: 'unpaid' }));
    await reconcileOlogyLiveReservations({ experienceId: 21 });
    expect(conn.execute.mock.calls[0][0]).toContain("status='cancelled'");

    vi.clearAllMocks();
    setup();
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: 'cs_live_booking' }]]);
    mocks.retrieveCheckout.mockResolvedValue(session({ status: 'open', payment_status: 'unpaid' }));
    await reconcileOlogyLiveReservations({ experienceId: 21 });
    expect(mocks.withLocked).not.toHaveBeenCalled();

    vi.clearAllMocks();
    setup();
    mocks.getPool.mockReturnValue({ execute: mocks.poolExecute });
    mocks.poolExecute.mockResolvedValue([[{ id: 101, stripePaymentIntentId: 'cs_live_booking' }]]);
    mocks.retrieveCheckout.mockRejectedValue(new Error('network unavailable'));
    await expect(reconcileOlogyLiveReservations({ experienceId: 21 })).rejects.toThrow('Ology Live checkout processing failed.');
  });
});
