import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(), metadata: vi.fn(), sessionCreate: vi.fn(), accountRetrieve: vi.fn(),
  release: vi.fn(), artist: vi.fn(), authenticate: vi.fn(), releaseHandler: null as any,
}));
vi.mock('stripe', () => ({ default: class MockStripe {
  checkout = { sessions: { create: mocks.sessionCreate } };
  accounts = { retrieve: mocks.accountRetrieve };
} }));
vi.mock('./stripe', () => ({ stripe: { checkout: { sessions: { create: mocks.sessionCreate } } } }));
vi.mock('./services/stripeWebhookMode', () => ({ getDefaultStripeApiKey: () => 'mock-key' }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getReleaseById: mocks.release, getArtistProfileById: mocks.artist }));
vi.mock('./email', () => ({ sendMerchOrderStatusEmail: vi.fn() }));
vi.mock('./services/merchSchemaService', () => ({ ensureMerchItemsSchema: vi.fn() }));
vi.mock('./services/purchaseFanEmailService', () => ({ createPurchaseFanEmailOptInMetadata: mocks.metadata }));
vi.mock('./_core/sdk', () => ({ sdk: { authenticateRequest: mocks.authenticate } }));
vi.mock('express', () => ({ Router: () => ({ post: (_path: string, handler: any) => { mocks.releaseHandler = handler; } }) }));

import { merchOrdersRouter } from './routers/merchOrders';
import { ticketingRouter } from './routers/ticketing';
import './routes/releaseCheckout';
import { merchItems, merchOrders, ticketOrders, events, ticketTiers, artistProfiles, stripeConnectAccounts } from '../drizzle/schema';

const buyer = { id: 20, email: 'verified@example.test', name: 'Buyer', emailVerified: true };
const payout = { stripeAccountId: 'acct_mock', status: 'active', chargesEnabled: true, payoutsEnabled: true };
const event = { id: 3, artistId: 4, isPublic: true, eventTitle: 'Show' };
const tier = { id: 5, price: 500, quantity: 20, quantitySold: 0, maxPerOrder: 10, name: 'General', salesStartDate: null, salesEndDate: null };
const ctx = (user: any = buyer) => ({ user, req: { headers: { origin: 'https://www.ologywood.com' } }, res: {} } as any);
const merchInput = { merchItemId: 1, quantity: 1, selectedVariants: {}, buyerName: 'Buyer', buyerEmail: 'receipt@example.test', fulfillmentMethod: 'pickup' as const, fanEmailOptIn: true };
const ticketInput = { eventId: 3, items: [{ tierId: 5, quantity: 1 }], fanEmailOptIn: true };

function database(rows: Map<unknown, any[]> = new Map()) {
  const instance: any = {
    select: vi.fn(() => {
      let table: unknown;
      const query: any = {
        from: (value: unknown) => { table = value; return query; },
        where: () => query, orderBy: () => query, limit: () => query,
        then: (resolve: any, reject: any) => Promise.resolve(rows.get(table) ?? []).then(resolve, reject),
      };
      return query;
    }),
    insert: vi.fn(() => ({ values: () => {
      const result: any = Promise.resolve([{ insertId: 91 }]);
      result.$returningId = async () => [{ id: 91 }];
      return result;
    } })),
    update: vi.fn(() => ({ set: () => ({ where: async () => undefined }) })),
    delete: vi.fn(() => ({ where: async () => undefined })),
    transaction: vi.fn(async (work: any) => work(instance)),
  };
  mocks.getDb.mockResolvedValue(instance);
  return instance;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'true', fanEmailConsentToken: 'mock-signed-checkout-token' });
  mocks.sessionCreate.mockResolvedValue({ id: 'cs_test_durable91', url: 'https://checkout.example.test/mock' });
  mocks.accountRetrieve.mockResolvedValue({ charges_enabled: true, payouts_enabled: true });
  mocks.authenticate.mockResolvedValue(buyer);
  mocks.release.mockResolvedValue({ id: 3, artistId: 4, title: 'Single', status: 'published', priceInCents: 500, currency: 'usd' });
  mocks.artist.mockResolvedValue({ id: 4, userId: 10, artistName: 'Artist' });
});

describe('merch checkout consent metadata boundaries', () => {
  function setup(userType = 'artist') {
    database(new Map([
      [merchItems, [{ id: 1, userId: 10, userType, sellingMethod: 'ologywood', isActive: true, priceInCents: 500, productCategory: 'merch', pickupAvailable: true, variants: [], title: 'Shirt', imageUrls: [] }]],
      [stripeConnectAccounts, [payout]],
    ]));
  }

  it('binds exact opt-in snapshot to durable buyer/artist/order, copied to Checkout and PI', async () => {
    setup();
    const result = await merchOrdersRouter.createCaller(ctx()).createCheckout(merchInput);
    expect(result.checkoutUrl).toContain('checkout.example.test');
    expect(mocks.metadata).toHaveBeenCalledWith({ creatorUserId: 10, buyerUserId: 20, optIn: true, purchaseId: 'merch:91' });
    const params = mocks.sessionCreate.mock.calls[0][0];
    expect(params.metadata.fanEmailConsentToken).toBe('mock-signed-checkout-token');
    expect(params.payment_intent_data.metadata.fanEmailConsentToken).toBe(params.metadata.fanEmailConsentToken);
    expect(params.payment_intent_data.transfer_data.destination).toBe('acct_mock');
    expect(params.payment_intent_data.application_fee_amount).toBeGreaterThan(0);
  });

  it('venue flags are ignored at server and never produce an artist identity', async () => {
    setup('venue');
    mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'false' });
    await merchOrdersRouter.createCaller(ctx()).createCheckout(merchInput);
    expect(mocks.metadata).toHaveBeenCalledWith({ creatorUserId: null, buyerUserId: 20, optIn: false, purchaseId: 'merch:91' });
    expect(mocks.sessionCreate.mock.calls[0][0].metadata.fanEmailOptIn).toBe('false');
  });

  it('guest order remains account-free and has no authenticated consent identity', async () => {
    setup();
    mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'false' });
    await merchOrdersRouter.createCaller(ctx(null)).createCheckout(merchInput);
    expect(mocks.metadata.mock.calls[0][0].buyerUserId).toBeUndefined();
    expect(mocks.sessionCreate.mock.calls[0][0].metadata.buyerUserId).toBe('');
  });

  it('optional snapshot unavailable still returns a valid financial checkout', async () => {
    setup();
    mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'false' });
    await expect(merchOrdersRouter.createCaller(ctx()).createCheckout(merchInput)).resolves.toMatchObject({ checkoutUrl: 'https://checkout.example.test/mock' });
  });

  it.each(['true', 1, null])('rejects non-boolean request flag %j before DB or Stripe', async fanEmailOptIn => {
    setup();
    await expect(merchOrdersRouter.createCaller(ctx()).createCheckout({ ...merchInput, fanEmailOptIn } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });
});

describe('ticket checkout consent and guest session capability', () => {
  function setup(connect = true) {
    database(new Map([
      [events, [event]], [ticketTiers, [tier]], [artistProfiles, [{ id: 4, userId: 10 }]],
      [stripeConnectAccounts, connect ? [payout] : []],
    ]));
  }

  it.each([true, false])('copies exact signed snapshot and durable order to PI (Connect=%s)', async connect => {
    setup(connect);
    await ticketingRouter.createCaller(ctx()).createCheckout(ticketInput);
    expect(mocks.metadata).toHaveBeenCalledWith({ creatorUserId: 10, buyerUserId: 20, optIn: true, purchaseId: 'ticket:91' });
    const params = mocks.sessionCreate.mock.calls[0][0];
    expect(params.metadata.fanEmailConsentToken).toBe(params.payment_intent_data.metadata.fanEmailConsentToken);
    expect(params.payment_intent_data.metadata.items).toBe(JSON.stringify(ticketInput.items));
    if (connect) expect(params.payment_intent_data.application_fee_amount).toBe(99);
  });

  it('snapshot unavailable and guest checkout still return durable ticket checkout', async () => {
    setup();
    mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'false' });
    await expect(ticketingRouter.createCaller(ctx(null)).createCheckout({ ...ticketInput, buyerEmail: 'guest@example.test' })).resolves.toMatchObject({ orderId: 91 });
    expect(mocks.metadata.mock.calls[0][0].buyerUserId).toBeUndefined();
  });

  it('guest confirmation accepts exact stored real cs capability even under incidental login', async () => {
    const order = { id: 91, eventId: 3, buyerUserId: null, orderNumber: 'OLG-20261110-ABCD', status: 'completed', stripeCheckoutSessionId: 'cs_test_durable91' };
    database(new Map([[ticketOrders, [order]], [events, [event]]]));
    await expect(ticketingRouter.createCaller(ctx({ id: 99 })).getOrderByNumber({ orderNumber: order.orderNumber, sessionId: 'cs_test_durable91' })).resolves.toMatchObject({ id: 91 });
    await expect(ticketingRouter.createCaller(ctx(null)).getOrderByNumber({ orderNumber: order.orderNumber, sessionId: 'cs_test_wrong' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(ticketingRouter.createCaller(ctx(null)).getOrderByNumber({ orderNumber: order.orderNumber, sessionId: 'payment_intent:pi_mock' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects coerced consent flags before integrations', async () => {
    setup();
    await expect(ticketingRouter.createCaller(ctx()).createCheckout({ ...ticketInput, fanEmailOptIn: 'true' } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
  });
});

describe('release Checkout and PaymentIntent complete consent metadata', () => {
  async function checkout(body: Record<string, unknown> = { releaseId: 3, fanEmailOptIn: true }) {
    const response: any = { status: vi.fn(() => response), json: vi.fn() };
    await mocks.releaseHandler({ body, headers: {} }, response);
    return response;
  }

  it.each([true, false])('complete release metadata survives Connect=%s', async connect => {
    database(new Map([[stripeConnectAccounts, connect ? [payout] : []]]));
    const response = await checkout();
    expect(response.json).toHaveBeenCalledWith({ checkoutUrl: 'https://checkout.example.test/mock', sessionId: 'cs_test_durable91' });
    expect(mocks.metadata).toHaveBeenCalledWith({ creatorUserId: 10, buyerUserId: 20, optIn: true });
    const params = mocks.sessionCreate.mock.calls[0][0];
    expect(params.payment_intent_data.metadata).toEqual(params.metadata);
    expect(params.metadata).toMatchObject({ type: 'release_purchase', artistUserId: '10', buyerUserId: '20', amountCents: '500', currency: 'usd', source: 'release_checkout', fanEmailConsentToken: 'mock-signed-checkout-token' });
    if (connect) expect(params.payment_intent_data.application_fee_amount).toBe(5);
  });

  it('guest and optional snapshot failures preserve checkout and receipt email identity', async () => {
    database();
    mocks.authenticate.mockRejectedValue(new Error('guest'));
    mocks.metadata.mockResolvedValue({ fanEmailOptIn: 'false' });
    await checkout({ releaseId: 3, fanEmailOptIn: true, buyerEmail: 'guest@example.test' });
    const params = mocks.sessionCreate.mock.calls[0][0];
    expect(params.metadata).toMatchObject({ buyerUserId: '', buyerEmail: 'guest@example.test', fanEmailOptIn: 'false' });
    expect(params.customer_email).toBe('guest@example.test');
  });

  it('strict bool and unknown field validation run before authentication/Stripe', async () => {
    database();
    const response = await checkout({ releaseId: 3, fanEmailOptIn: 'true' });
    expect(response.status).toHaveBeenCalledWith(400);
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(mocks.sessionCreate).not.toHaveBeenCalled();
    const unknown = await checkout({ releaseId: 3, fanEmailConsentToken: 'injected' });
    expect(unknown.status).toHaveBeenCalledWith(400);
  });
});
