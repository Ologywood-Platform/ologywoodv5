import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ existing: vi.fn(), existingWithRelease: vi.fn(), release: vi.fn(), profile: vi.fn(),
  commit: vi.fn(), retrieve: vi.fn(), send: vi.fn(), capture: vi.fn(), authenticate: vi.fn(),
  purchaseById: vi.fn(), delivery: vi.fn(), increment: vi.fn(), storage: vi.fn() }));
vi.mock('./db', () => ({ getPurchaseBySessionId: mocks.existing, getPurchaseBySessionIdWithRelease: mocks.existingWithRelease,
  getReleaseById: mocks.release, getArtistProfileById: mocks.profile, getPurchaseById: mocks.purchaseById,
  getReleaseDeliveryById: mocks.delivery, incrementDownloadCount: mocks.increment }));
vi.mock('./email', () => ({ sendEmail: mocks.send }));
vi.mock('./storage', () => ({ storageGet: mocks.storage }));
vi.mock('./_core/sdk', () => ({ sdk: { authenticateRequest: mocks.authenticate } }));
vi.mock('./services/pricingTierService', () => ({ hasFeatureAccess: vi.fn(), canCreateRelease: vi.fn(), getUserSubscription: vi.fn(), PRICING_TIERS: {} }));
vi.mock('./services/artistUpdateService', () => ({ sendArtistUpdate: vi.fn() }));
vi.mock('./services/stripeWebhookMode', () => ({ getDefaultStripeApiKey: () => 'sk_test_fixture',
  getStripeClientForWebhookMode: () => ({ checkout: { sessions: { retrieve: mocks.retrieve } } }) }));
vi.mock('./services/releasePurchaseFulfillmentService', () => ({ commitReleasePurchase: mocks.commit }));
vi.mock('./services/purchaseFanEmailService', () => ({ capturePurchaseFanEmailOptIn: mocks.capture }));
import { releaseRouter } from './routers/release';
import releaseDownloadRouter from './routes/releaseDownload';
const session = { id: 'cs_test_guestfixture', mode: 'payment', payment_status: 'paid', payment_intent: 'pi_fixture', currency: 'usd', amount_total: 200,
  customer_details: { email: 'guest@example.test', name: 'Guest' },
  metadata: { type: 'release_purchase', releaseId: '1', artistId: '3', buyerUserId: '', buyerEmail: 'guest@example.test', fanEmailOptIn: 'false' } };
const user = { id: 8, name: 'Other account', email: 'other@example.test', role: 'user' } as any;
const ctx = { user, req: { headers: {} }, res: {} } as any;
const guestPurchase = { id: 9, releaseId: 1, buyerUserId: null, buyerEmail: 'guest@example.test', stripeCheckoutSessionId: session.id,
  downloadCount: 0, maxDownloads: 5, amountPaidCents: 200, purchasedAt: new Date() };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.existing.mockResolvedValue(null);
  mocks.release.mockResolvedValue({ id: 1, artistId: 3, title: 'Fixture Track', status: 'published', priceInCents: 200, currency: 'usd', allowPayWhatYouWant: false });
  mocks.retrieve.mockResolvedValue(session);
  mocks.commit.mockResolvedValue({ purchase: guestPurchase, created: true });
  mocks.profile.mockRejectedValue(new Error('optional creator lookup failed'));
  mocks.send.mockResolvedValue(true);
  mocks.authenticate.mockResolvedValue(user);
  mocks.purchaseById.mockResolvedValue(guestPurchase);
  mocks.delivery.mockResolvedValue({ audioFileKey: 'fixture.mp3', title: 'Fixture Track', fileFormat: 'mp3' });
  mocks.storage.mockResolvedValue({ url: 'https://storage.example.test/fixture' });
  mocks.increment.mockResolvedValue(undefined);
});
describe('guest release checkout capability', () => {
  it('preserves null buyer identity and returns success despite incidental login and optional profile failure', async () => {
    const result = await releaseRouter.createCaller(ctx).verifyPurchase({ sessionId: session.id });
    expect(result).toEqual({ status: 'created', purchaseId: 9 });
    expect(mocks.commit).toHaveBeenCalledWith(expect.objectContaining({ buyerUserId: null, buyerEmail: 'guest@example.test' }));
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ html: expect.stringContaining('/purchase-success?session_id=cs_test_guestfixture') }));
  });
  it('does not let the private session replace a signed-in checkout owner', async () => {
    mocks.retrieve.mockResolvedValue({ ...session, metadata: { ...session.metadata, buyerUserId: '99' } });
    const result = await releaseRouter.createCaller(ctx).verifyPurchase({ sessionId: session.id });
    expect(result.status).toBe('not_found');
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('does not re-run financial fulfillment for an existing receipt', async () => {
    mocks.existing.mockResolvedValue(guestPurchase);
    expect(await releaseRouter.createCaller(ctx).verifyPurchase({ sessionId: session.id })).toEqual({ status: 'already_exists', purchaseId: 9 });
    expect(mocks.commit).not.toHaveBeenCalled();
  });
});
async function download(sessionToken?: string) {
  const route = (releaseDownloadRouter as any).stack.find((layer: any) => layer.route?.path === '/:purchaseId').route.stack[0].handle;
  const res: any = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res);
  await route({ params: { purchaseId: '9' }, query: sessionToken ? { session_id: sessionToken } : {}, headers: {} }, res);
  return res;
}
describe('guest download with unrelated authenticated account', () => {
  it('accepts the exact guest capability even while another user is logged in', async () => {
    const res = await download(session.id);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(mocks.increment).toHaveBeenCalledWith(9);
  });
  it.each([undefined, 'cs_test_wrongfixture'])('rejects absent or wrong private capability: %s', async token => {
    const res = await download(token);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.storage).not.toHaveBeenCalled();
  });
  it('never authorizes a different signed-in buyer with the guest-token path', async () => {
    mocks.purchaseById.mockResolvedValue({ ...guestPurchase, buyerUserId: 99 });
    const res = await download(session.id);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
