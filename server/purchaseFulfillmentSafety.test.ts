import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock('./services/purchaseFanEmailService', () => ({ capturePurchaseFanEmailOptIn: mocks.capture }));
import { captureCheckoutFanEmailBestEffort, getRealCheckoutSessionId, hasVerifiedCheckoutPayment } from './services/purchaseFulfillmentSafety';

beforeEach(() => { vi.clearAllMocks(); mocks.capture.mockResolvedValue({ captured: true }); });
describe('paid fulfillment and optional marketing boundary', () => {
  it.each(['unpaid', undefined])('rejects checkout state %s', payment_status => {
    expect(hasVerifiedCheckoutPayment({ payment_status, amount_total: 200 } as any)).toBe(false);
  });
  it('accepts paid checkout and zero-cost tickets only with explicit no-payment evidence', () => {
    expect(hasVerifiedCheckoutPayment({ payment_status: 'paid' } as any)).toBe(true);
    expect(hasVerifiedCheckoutPayment({ payment_status: 'no_payment_required', amount_total: 0, metadata: { type: 'ticket_purchase' } } as any)).toBe(true);
    expect(hasVerifiedCheckoutPayment({ payment_status: 'no_payment_required', amount_total: 0, metadata: { type: 'release_purchase' } } as any)).toBe(false);
  });
  it.each([{ optIn: 'false', buyer: 8 }, { optIn: 'true', buyer: null }])('does not resolve creator for guests or absent opt-in', async input => {
    const resolve = vi.fn();
    await captureCheckoutFanEmailBestEffort({ metadata: { fanEmailOptIn: input.optIn } }, {
      buyerUserId: input.buyer, purchaseId: 'ticket:2', resolveCreatorUserId: resolve,
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });
  it('catches failures from the entire optional creator lookup', async () => {
    const resolve = vi.fn().mockRejectedValue(new Error('profile lookup unavailable'));
    await expect(captureCheckoutFanEmailBestEffort({ metadata: { fanEmailOptIn: 'true' } }, {
      buyerUserId: 8, purchaseId: 'ticket:2', resolveCreatorUserId: resolve,
    })).resolves.toBeUndefined();
    expect(mocks.capture).not.toHaveBeenCalled();
  });
  it('passes checkout metadata and durable action identity, never a newly manufactured snapshot', async () => {
    const metadata = { fanEmailOptIn: 'true', fanEmailConsentToken: 'fixture-snapshot' };
    await captureCheckoutFanEmailBestEffort({ metadata }, {
      buyerUserId: 8, purchaseId: 'release:cs_test_private', resolveCreatorUserId: async () => 3,
    });
    expect(mocks.capture).toHaveBeenCalledWith({ creatorUserId: 3, buyerUserId: 8, optIn: true, metadata, purchaseId: 'release:cs_test_private' });
  });
  it('catches a capture exception after financial commit', async () => {
    mocks.capture.mockRejectedValue(new Error('consent unavailable'));
    await expect(captureCheckoutFanEmailBestEffort({ metadata: { fanEmailOptIn: 'true' } }, {
      buyerUserId: 8, purchaseId: 'merch:2', resolveCreatorUserId: async () => 3,
    })).resolves.toBeUndefined();
  });
  it('uses a durable real guest capability rather than a synthetic PaymentIntent ID', () => {
    expect(getRealCheckoutSessionId('cs_test_original', 'payment_intent:pi_fixture')).toBe('cs_test_original');
    expect(getRealCheckoutSessionId(null, 'cs_live_real')).toBe('cs_live_real');
    expect(getRealCheckoutSessionId(null, 'payment_intent:pi_fixture')).toBeNull();
  });
});
