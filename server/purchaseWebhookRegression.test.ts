import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  verify: vi.fn(), getDb: vi.fn(), getPurchase: vi.fn(), getRelease: vi.fn(), getArtist: vi.fn(),
  getUser: vi.fn(), commit: vi.fn(), capture: vi.fn(), sendEmail: vi.fn(), listSessions: vi.fn(), retrieveSubscription: vi.fn(),
  synchronize: vi.fn(), eduDependencies: vi.fn(), eduActivation: vi.fn(),
}));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPurchaseBySessionId: mocks.getPurchase, getReleaseById: mocks.getRelease,
  getArtistProfileById: mocks.getArtist, getUserById: mocks.getUser }));
vi.mock('./email', () => ({ sendEmail: mocks.sendEmail }));
vi.mock('./services/purchaseFanEmailService', () => ({ capturePurchaseFanEmailOptIn: mocks.capture }));
vi.mock('./services/stripeWebhookMode', () => ({
  verifyStripeWebhookEvent: mocks.verify,
  getDefaultStripeApiKey: () => 'sk_test_fixture',
  getStripeClientForWebhookMode: () => ({ checkout: { sessions: { list: mocks.listSessions } }, subscriptions: { retrieve: mocks.retrieveSubscription } }),
}));
vi.mock('./services/releasePurchaseFulfillmentService', async importOriginal => ({
  ...(await importOriginal<any>()), commitReleasePurchase: mocks.commit,
}));
vi.mock('./services/subscriptionLifecycleService', () => ({ synchronizeSubscription: mocks.synchronize }));
vi.mock('./services/eduBillingService', () => ({ defaultEduBillingDependencies: mocks.eduDependencies, recordEduSubscriptionActivation: mocks.eduActivation }));
import { handleStripeWebhook } from './webhooks/stripe';
import { artistProfiles, events, ticketItems, ticketOrders, ticketTiers } from '../drizzle/schema';

const music = { id: 'cs_test_musicfixture', mode: 'payment', payment_status: 'paid', payment_intent: 'pi_musicfixture',
  currency: 'usd', amount_total: 200, customer_details: { email: 'buyer@example.test', name: 'Buyer' },
  metadata: { type: 'release_purchase', releaseId: '1', artistId: '3', buyerUserId: '8', fanEmailOptIn: 'true', fanEmailConsentToken: 'snapshot-fixture' } } as any;
function response() {
  const res: any = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res); return res;
}
async function deliver(type: string, object: any) {
  mocks.verify.mockReturnValue({ event: { id: 'evt_fixture', type, data: { object } }, mode: 'test' });
  const res = response();
  await handleStripeWebhook({ headers: { 'stripe-signature': 'fixture' }, body: Buffer.from('fixture') } as any, res);
  return res;
}
function ticketDatabase() {
  const event = { id: 2, artistId: 3, eventTitle: 'Fixture Event', eventDate: '2026-12-15', eventTime: '19:00', location: 'Fixture Hall' };
  const order = { id: 4, stripeCheckoutSessionId: 'cs_test_originalticket', orderNumber: 'OWT-FIXTURE' };
  const select = vi.fn((selection?: any) => {
    let table: any;
    const chain: any = {
      from: (value: any) => { table = value; return chain; }, where: () => chain, limit: () => chain,
      orderBy: () => chain, then: (ok: any, fail: any) => {
        if (selection?.artistId) return Promise.reject(new Error('optional artist resolution unavailable')).then(ok, fail);
        const rows = table === events ? [event] : table === ticketOrders ? [order]
          : table === ticketItems ? [{ id: 9, tierId: 5, ticketCode: 'fixture-code-123', price: 200 }]
          : table === ticketTiers ? [{ id: 5, name: 'General', price: 200 }]
          : table === artistProfiles ? [] : [];
        return Promise.resolve(rows).then(ok, fail);
      },
    };
    return chain;
  });
  const tx = { select, update: () => ({ set: () => ({ where: async () => [{ affectedRows: 1 }] }) }), insert: () => ({ values: async () => [{ insertId: 9 }] }) };
  return { select, transaction: vi.fn(async (work: any) => work(tx)) };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPurchase.mockResolvedValue(null);
  mocks.getRelease.mockResolvedValue({ id: 1, artistId: 3, title: 'Fixture Track', priceInCents: 200, currency: 'usd', allowPayWhatYouWant: false });
  mocks.getArtist.mockRejectedValue(new Error('optional profile unavailable'));
  mocks.getUser.mockResolvedValue(null);
  mocks.commit.mockResolvedValue({ purchase: { id: 9 }, created: true });
  mocks.capture.mockResolvedValue({ captured: false });
  mocks.sendEmail.mockResolvedValue(true);
  mocks.listSessions.mockResolvedValue({ data: [music] });
  mocks.eduDependencies.mockResolvedValue({ fixture: 'test-mode-dependencies' });
  mocks.eduActivation.mockResolvedValue({ status: 'recorded' });
  mocks.synchronize.mockResolvedValue({ synced: true, subscription: { id: 'sub_fixture', status: 'active', metadata: { userId: '8' }, items: { data: [] } }, state: { userId: 8, status: 'active', tier: 'starter' } });
});
describe('composed music fulfillment', () => {
  it('returns success and delivers the private receipt despite creator lookup failure', async () => {
    const res = await deliver('checkout.session.completed', music);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'buyer@example.test', html: expect.stringContaining('/purchase-success?session_id=cs_test_musicfixture') }));
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(res.status).not.toHaveBeenCalled();
  });
  it('never commits an unpaid session', async () => {
    await deliver('checkout.session.completed', { ...music, payment_status: 'unpaid' });
    expect(mocks.commit).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
  it('fulfills a later asynchronous payment success through the same paid path', async () => {
    await deliver('checkout.session.async_payment_succeeded', music);
    expect(mocks.commit).toHaveBeenCalledTimes(1);
  });
  it('resolves the real Checkout capability when the music PaymentIntent arrives first', async () => {
    const res = await deliver('payment_intent.succeeded', { id: 'pi_musicfixture', status: 'succeeded', metadata: music.metadata });
    expect(mocks.listSessions).toHaveBeenCalledWith({ payment_intent: 'pi_musicfixture', limit: 1 });
    expect(mocks.commit).toHaveBeenCalledWith(expect.objectContaining({ stripeCheckoutSessionId: 'cs_test_musicfixture' }));
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });
  it('does not duplicate the receipt when atomic fulfillment reports an existing purchase', async () => {
    mocks.commit.mockResolvedValue({ purchase: { id: 9 }, created: false });
    await deliver('checkout.session.completed', music);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
  it('returns a retriable failure rather than acknowledging a failed financial transaction', async () => {
    mocks.commit.mockRejectedValue(new Error('financial storage unavailable'));
    const res = await deliver('checkout.session.completed', music);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Webhook processing failed' });
  });
});
describe('composed subscription and EDU activation', () => {
  const checkout = { id: 'cs_test_edufixture', mode: 'subscription', livemode: false, subscription: 'sub_fixture', customer: 'cus_fixture',
    payment_status: 'paid', metadata: { userId: '8', eduVerificationId: '2' } };
  it('uses the actual synchronized subscription and records EDU provenance only afterwards', async () => {
    const res = await deliver('checkout.session.completed', checkout);
    expect(mocks.synchronize).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'sub_fixture', userId: 8, expectedCustomerId: 'cus_fixture', allowReplacement: true }));
    expect(mocks.eduDependencies).toHaveBeenCalledWith('test');
    expect(mocks.eduActivation).toHaveBeenCalledWith({ userId: 8, checkoutSessionId: 'cs_test_edufixture', subscriptionId: 'sub_fixture' }, { fixture: 'test-mode-dependencies' });
    expect(mocks.synchronize.mock.invocationCallOrder[0]).toBeLessThan(mocks.eduActivation.mock.invocationCallOrder[0]);
    expect(res.status).not.toHaveBeenCalled();
  });
  it('does not attach EDU billing when a different current subscription blocks replacement', async () => {
    mocks.synchronize.mockResolvedValue({ synced: false, reason: 'different_current_subscription' });
    await deliver('checkout.session.completed', checkout);
    expect(mocks.eduActivation).not.toHaveBeenCalled();
  });
  it('uses subscription identity-aware synchronization for a stale update event', async () => {
    mocks.synchronize.mockResolvedValue({ synced: false, reason: 'different_current_subscription' });
    const res = await deliver('customer.subscription.updated', { id: 'sub_oldfixture', status: 'trialing', metadata: { userId: '8' } });
    expect(mocks.synchronize).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 'sub_oldfixture', userId: 8 }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  it('retries an EDU provenance failure without fabricating activation success', async () => {
    mocks.eduActivation.mockRejectedValue(new Error('EDU billing proof unavailable'));
    const res = await deliver('checkout.session.completed', checkout);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
describe('ticket receipt independence', () => {
  it('sends a real guest capability despite optional creator-resolution failure after commit', async () => {
    const database = ticketDatabase(); mocks.getDb.mockResolvedValue(database);
    const session = { id: 'cs_test_ticketevent', mode: 'payment', payment_status: 'paid', payment_intent: 'pi_ticketfixture', amount_total: 200,
      metadata: { type: 'ticket_purchase', orderId: '4', orderNumber: 'OWT-FIXTURE', eventId: '2', buyerUserId: '8', fanEmailOptIn: 'true',
        customer_email: 'ticketbuyer@example.test', items: JSON.stringify([{ tierId: 5, quantity: 1 }]) } };
    const res = await deliver('checkout.session.completed', session);
    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.capture).not.toHaveBeenCalled();
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ticketbuyer@example.test', html: expect.stringContaining('session_id=cs_test_originalticket') }));
    expect(res.status).not.toHaveBeenCalled();
  });
});
