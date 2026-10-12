import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  paid: vi.fn(async () => undefined),
  terminal: vi.fn(async () => undefined),
  refund: vi.fn(async () => undefined),
  updateBooking: vi.fn(),
  getDb: vi.fn(async () => null),
}));
vi.mock('./db', () => ({ updateBookingPaymentStatus: mocks.updateBooking, getDb: mocks.getDb }));
vi.mock('./services/stripeWebhookMode', () => ({ verifyStripeWebhookEvent: mocks.verify, getStripeClientForWebhookMode: vi.fn() }));
vi.mock('./services/ologyLiveCheckoutService', () => ({ handleOlogyLiveCheckout: mocks.paid, handleOlogyLiveCheckoutTerminal: mocks.terminal, handleOlogyLiveCheckoutRefund: mocks.refund }));
vi.mock('./services/contentReleaseCommerceService', () => ({ fulfillContentReleaseCheckout: vi.fn(), fulfillContentReleasePaymentIntent: vi.fn(), refundContentReleaseCharge: vi.fn() }));
vi.mock('./email', () => ({}));
import { handleStripeWebhook } from './webhooks/stripe';

function response() {
  const res: any = { status: vi.fn(), send: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}
const request = () => ({ headers: { 'stripe-signature': 'synthetic-signature' }, body: Buffer.from('synthetic signed fixture') } as any);
function verified(type: string) {
  const object = { id: 'cs_fixture', metadata: { type: 'ology_live_booking', bookingId: '101' } };
  mocks.verify.mockReturnValue({ event: { id: 'evt_fixture', type, data: { object } }, mode: 'test' });
  return object;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockReset();
  mocks.paid.mockReset().mockResolvedValue(undefined);
  mocks.terminal.mockReset().mockResolvedValue(undefined);
  mocks.refund.mockReset().mockResolvedValue(undefined);
});

describe('verified Live webhook dispatch', () => {
  it.each(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])('routes %s to Live fulfillment, never ordinary booking payment', async type => {
    const object = verified(type), res = response();
    await handleStripeWebhook(request(), res);
    expect(mocks.paid).toHaveBeenCalledWith(object);
    expect(mocks.updateBooking).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it.each(['checkout.session.expired', 'checkout.session.async_payment_failed'])('routes %s to current-state Live terminal verification', async type => {
    const object = verified(type), res = response();
    await handleStripeWebhook(request(), res);
    expect(mocks.terminal).toHaveBeenCalledWith(object);
    expect(mocks.updateBooking).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it.each(['payment_intent.succeeded', 'payment_intent.payment_failed'])('never dispatches %s with a Live bookingId to the ordinary bookings table', async type => {
    verified(type); const res = response();
    await handleStripeWebhook(request(), res);
    expect(mocks.updateBooking).not.toHaveBeenCalled();
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.paid).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('routes a verified Live refund to its own receipt lifecycle', async () => {
    const object = verified('charge.refunded'), res = response();
    await handleStripeWebhook(request(), res);
    expect(mocks.refund).toHaveBeenCalledWith(object);
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures before any Live handler can run', async () => {
    mocks.verify.mockImplementation(() => { throw new Error('Invalid synthetic signature'); });
    const res = response(); await handleStripeWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.paid).not.toHaveBeenCalled();
    expect(mocks.terminal).not.toHaveBeenCalled();
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it('keeps source/verification failures retryable instead of acknowledging fulfillment', async () => {
    verified('checkout.session.completed'); mocks.paid.mockRejectedValueOnce(new Error('Generic fixture outage'));
    const res = response(); await handleStripeWebhook(request(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Webhook processing failed' });
    expect(mocks.updateBooking).not.toHaveBeenCalled();
  });
});
