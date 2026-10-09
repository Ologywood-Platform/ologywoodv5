import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  artistProfiles,
  contentReleasePurchases,
  contentReleases,
  stripeConnectAccounts,
  users,
} from '../drizzle/schema';
import { contentReleasePublicView, isVerifiedContentPurchase } from '../shared/contentReleaseCommerce';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  ensureSchema: vi.fn(),
  getStripeClient: vi.fn(),
  checkoutCreate: vi.fn(),
  accountsRetrieve: vi.fn(),
  paymentIntentsRetrieve: vi.fn(),
  email: vi.fn(),
}));

vi.mock('./db', () => ({ getDb: mocks.getDb }));
vi.mock('./services/contentReleaseSchemaService', () => ({ ensureContentReleaseSchema: mocks.ensureSchema }));
vi.mock('./services/stripeWebhookMode', () => ({ getStripeClientForWebhookMode: mocks.getStripeClient }));
vi.mock('./email', () => ({ sendReleasePurchaseConfirmationEmail: mocks.email }));

import {
  contentReleaseCheckoutLimiter,
  createContentReleaseCheckout,
  fulfillContentReleaseCheckout,
  fulfillContentReleasePaymentIntent,
  refundContentReleaseCharge,
} from './services/contentReleaseCommerceService';

type TableKey = 'releases' | 'purchases' | 'accounts' | 'artists' | 'users';
type SelectQueues = Partial<Record<TableKey, any[][]>>;

function tableKey(table: unknown): TableKey {
  if (table === contentReleases) return 'releases';
  if (table === contentReleasePurchases) return 'purchases';
  if (table === stripeConnectAccounts) return 'accounts';
  if (table === artistProfiles) return 'artists';
  if (table === users) return 'users';
  throw new Error('Unexpected table in commerce test database');
}

/**
 * A deliberately small Drizzle double. Selects consume rows from table-specific
 * queues, while all writes (including transaction writes) are recorded.
 */
function commerceDatabase(queued: SelectQueues = {}) {
  const queues: Record<TableKey, any[][]> = {
    releases: [...(queued.releases ?? [])],
    purchases: [...(queued.purchases ?? [])],
    accounts: [...(queued.accounts ?? [])],
    artists: [...(queued.artists ?? [])],
    users: [...(queued.users ?? [])],
  };
  const inserts: Array<{ table: TableKey; value: any; transaction: boolean }> = [];
  const updates: Array<{ table: TableKey; value: any; transaction: boolean }> = [];
  const locks: Array<{ table: TableKey; mode: string; transaction: boolean }> = [];
  const deletes: Array<{ table: TableKey; transaction: boolean }> = [];

  function connection(transaction: boolean) {
    const select = vi.fn(() => {
      let selectedTable: TableKey | undefined;
      const builder: any = {
        from: (table: unknown) => {
          selectedTable = tableKey(table);
          return builder;
        },
        where: () => builder,
        limit: () => builder,
        orderBy: () => builder,
        for: (mode: string) => {
          if (!selectedTable) throw new Error('Lock requested before selecting a table');
          locks.push({ table: selectedTable, mode, transaction });
          return builder;
        },
        then: (resolve: (rows: any[]) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(queues[selectedTable!].shift() ?? []).then(resolve, reject),
      };
      return builder;
    });
    const insertValues = vi.fn(async (value: any) => undefined);
    const insert = vi.fn((table: unknown) => ({
      values: (value: any) => {
        inserts.push({ table: tableKey(table), value, transaction });
        return insertValues(value);
      },
    }));
    const updateWhere = vi.fn(async () => undefined);
    const update = vi.fn((table: unknown) => ({
      set: (value: any) => {
        updates.push({ table: tableKey(table), value, transaction });
        return { where: updateWhere };
      },
    }));
    const remove = vi.fn((table: unknown) => ({
      where: async () => {
        deletes.push({ table: tableKey(table), transaction });
      },
    }));
    return { select, insert, insertValues, update, updateWhere, delete: remove };
  }

  const db: any = connection(false);
  const tx: any = connection(true);
  db.transaction = vi.fn(async (callback: (transaction: any) => unknown) => callback(tx));
  return Object.assign(db, { tx, inserts, updates, locks, deletes, queues });
}

const fan = { id: 7, email: 'fan@example.test', name: 'Fan Buyer' };
const creator = { id: 80, email: 'creator@example.test', name: 'Creator' };
const connectAccount = { artistId: creator.id, stripeAccountId: 'acct_creator', status: 'active', chargesEnabled: true };

function release(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    artistProfileId: 33,
    userId: creator.id,
    title: 'A paid premiere',
    releaseType: 'film',
    hostingPlatform: 'vimeo',
    contentUrl: 'https://content.example.test/premiere',
    premiereDate: null,
    accessModel: 'ticketed',
    price: '5.00',
    minPrice: null,
    isPublished: true,
    purchaseCount: 0,
    revenue: '0.00',
    ...overrides,
  };
}

function paidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_paid',
    mode: 'payment',
    payment_status: 'paid',
    livemode: false,
    currency: 'usd',
    amount_total: 500,
    payment_intent: 'pi_paid',
    metadata: {
      type: 'content_release_purchase',
      contentReleaseId: '123',
      buyerUserId: String(fan.id),
      creatorUserId: String(creator.id),
      expectedAmountCents: '500',
      platformFeeCents: '5',
    },
    ...overrides,
  } as any;
}

function paidCheckoutDatabase(releaseRow = release(), purchaseRows: any[][] = [[]]) {
  return commerceDatabase({
    releases: [[releaseRow]],
    purchases: purchaseRows,
    accounts: [[connectAccount]],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_placeholder');
  contentReleaseCheckoutLimiter.reset(String(fan.id));
  contentReleaseCheckoutLimiter.reset(String(creator.id));
  mocks.ensureSchema.mockResolvedValue(undefined);
  mocks.getStripeClient.mockReturnValue({
    checkout: { sessions: { create: mocks.checkoutCreate } },
    accounts: { retrieve: mocks.accountsRetrieve },
    paymentIntents: { retrieve: mocks.paymentIntentsRetrieve },
  });
  mocks.checkoutCreate.mockResolvedValue({ url: 'https://checkout.example.test/session' });
  mocks.accountsRetrieve.mockResolvedValue({ charges_enabled: true });
  mocks.paymentIntentsRetrieve.mockResolvedValue({status:'succeeded',amount_received:500,currency:'usd',metadata:paidSession().metadata,latest_charge:{refunded:false,amount:500,amount_refunded:0}});
  mocks.email.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('content release checkout creation', () => {
  it('uses PWYW minPrice when price is null and preserves a fan’s custom amount', async () => {
    const minimumRelease = release({ accessModel: 'pay_what_you_want', price: null, minPrice: '1.50' });
    const first = paidCheckoutDatabase(minimumRelease);
    const second = paidCheckoutDatabase(minimumRelease);
    mocks.getDb.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 1.5 })).resolves.toMatchObject({ checkoutUrl: expect.any(String) });
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 5 })).resolves.toMatchObject({ checkoutUrl: expect.any(String) });

    expect(mocks.checkoutCreate.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(150);
    expect(mocks.checkoutCreate.mock.calls[1][0].line_items[0].price_data.unit_amount).toBe(500);
  });

  it('uses a fixed server price, has unambiguous metadata, transfers the 1% fee, and grants nothing before payment', async () => {
    const db = paidCheckoutDatabase();
    mocks.getDb.mockResolvedValue(db);

    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 0.5 })).resolves.toMatchObject({
      success: false,
      alreadyPurchased: false,
      checkoutUrl: 'https://checkout.example.test/session',
    });

    const params = mocks.checkoutCreate.mock.calls[0][0];
    expect(params.line_items[0].price_data.unit_amount).toBe(500);
    expect(params.metadata).toMatchObject({
      type: 'content_release_purchase',
      contentReleaseId: '123',
      buyerUserId: '7',
      creatorUserId: '80',
      expectedAmountCents: '500',
      platformFeeCents: '5',
    });
    expect(params.metadata).not.toHaveProperty('releaseId');
    expect(params.payment_intent_data).toMatchObject({
      application_fee_amount: 5,
      transfer_data: { destination: 'acct_creator' },
      metadata: params.metadata,
    });
    expect(db.inserts).toEqual([]);
    expect(db.updates).toEqual([]);
  });

  it('blocks undersized and invalid PWYW values plus owner, unpublished, and fan-club access attempts', async () => {
    const pwyw = release({ accessModel: 'pay_what_you_want', price: null, minPrice: '1.50' });
    const tooSmall = paidCheckoutDatabase(pwyw);
    const invalidDecimal = paidCheckoutDatabase(pwyw);
    const ownerDb = commerceDatabase({ releases: [[pwyw]] });
    const unpublishedDb = commerceDatabase({ releases: [[]] });
    const fanClubDb = commerceDatabase({ releases: [[release({ accessModel: 'fan_club_only' })]] });
    mocks.getDb
      .mockResolvedValueOnce(tooSmall)
      .mockResolvedValueOnce(invalidDecimal)
      .mockResolvedValueOnce(ownerDb)
      .mockResolvedValueOnce(unpublishedDb)
      .mockResolvedValueOnce(fanClubDb);

    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 1.49 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 1.234 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(createContentReleaseCheckout(creator, { releaseId: 123, amount: 5 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 5 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 5 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(mocks.checkoutCreate).not.toHaveBeenCalled();
    for (const db of [tooSmall, invalidDecimal, ownerDb, unpublishedDb, fanClubDb]) {
      expect(db.inserts).toEqual([]);
      expect(db.updates).toEqual([]);
    }
  });

  it('propagates checkout-provider failures so a later attempt can retry', async () => {
    const db = commerceDatabase({
      releases: [[release()], [release()]],
      purchases: [[], []],
      accounts: [[connectAccount], [connectAccount]],
    });
    mocks.getDb.mockResolvedValue(db);
    mocks.checkoutCreate.mockRejectedValueOnce(new Error('temporary checkout failure'));

    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 5 })).rejects.toThrow('temporary checkout failure');
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 5 })).resolves.toMatchObject({ checkoutUrl: expect.any(String) });
    expect(mocks.checkoutCreate).toHaveBeenCalledTimes(2);
  });
});

describe('verified payment fulfillment', () => {
  it('rejects unpaid, wrong-mode, wrong-currency, wrong-amount, and missing-PI events without granting access', async () => {
    const invalidEvents = [
      paidSession({ payment_status: 'unpaid' }),
      paidSession({ livemode: true }),
      paidSession({ currency: 'eur' }),
      paidSession({ amount_total: 501 }),
      paidSession({ payment_intent: null }),
    ];

    await expect(fulfillContentReleaseCheckout(invalidEvents[0])).resolves.toBeUndefined();
    await expect(fulfillContentReleaseCheckout(invalidEvents[1])).resolves.toBeUndefined();
    for (const event of invalidEvents.slice(2)) {
      await expect(fulfillContentReleaseCheckout(event)).rejects.toThrow('Invalid Content Release payment proof');
    }
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('writes a paid receipt with its PaymentIntent and increments release counters under a row-locking transaction', async () => {
    const db = commerceDatabase({
      releases: [[release()]],
      purchases: [[]],
      users: [[fan]],
      artists: [[{ artistName: 'Creator Name' }]],
    });
    mocks.getDb.mockResolvedValue(db);

    await fulfillContentReleaseCheckout(paidSession());

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.locks).toContainEqual({ table: 'releases', mode: 'update', transaction: true });
    expect(db.inserts).toContainEqual(expect.objectContaining({
      table: 'purchases',
      transaction: true,
      value: expect.objectContaining({
        releaseId: 123,
        userId: fan.id,
        amountPaid: '5.00',
        stripePaymentIntentId: 'pi_paid',
        paymentStatus: 'completed',
      }),
    }));
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0]).toMatchObject({ table: 'releases', transaction: true });
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({
      buyerEmail: fan.email,
      releaseTitle: 'A paid premiere',
      creatorName: 'Creator Name',
      amountPaid: 5,
    }));
  });

  it('does not duplicate the receipt, counters, or email when Stripe retries an already fulfilled session', async () => {
    const verifiedReceipt = {
      id: 9,
      releaseId: 123,
      userId: fan.id,
      amountPaid: '5.00',
      stripePaymentIntentId: 'pi_paid',
      paymentStatus: 'completed',
    };
    const db = commerceDatabase({
      releases: [[release()], [release()]],
      purchases: [[], [verifiedReceipt]],
      users: [[fan]],
      artists: [[{ artistName: 'Creator Name' }]],
    });
    mocks.getDb.mockResolvedValue(db);

    await fulfillContentReleaseCheckout(paidSession());
    await fulfillContentReleaseCheckout(paidSession());

    expect(db.transaction).toHaveBeenCalledTimes(2);
    expect(db.inserts.filter(write => write.table === 'purchases')).toHaveLength(1);
    expect(db.updates.filter(write => write.table === 'releases')).toHaveLength(1);
    expect(mocks.email).toHaveBeenCalledTimes(1);
  });

  it('fulfills a succeeded PaymentIntent fallback using the same receipt proof', async () => {
    const db = commerceDatabase({
      releases: [[release()]],
      purchases: [[]],
      users: [[]],
      artists: [[]],
    });
    mocks.getDb.mockResolvedValue(db);

    await fulfillContentReleasePaymentIntent({
      id: 'pi_fallback',
      status: 'succeeded',
      livemode: false,
      currency: 'usd',
      amount_received: 500,
      metadata: paidSession().metadata,
    } as any);

    expect(db.inserts).toContainEqual(expect.objectContaining({
      table: 'purchases',
      value: expect.objectContaining({ stripePaymentIntentId: 'pi_fallback', amountPaid: '5.00' }),
    }));
  });

  it('allows a zero-dollar claim only when the published PWYW minimum is zero', async () => {
    const zeroPriceRelease = release({ accessModel: 'pay_what_you_want', price: null, minPrice: '0.00' });
    const zeroDb = commerceDatabase({
      releases: [[zeroPriceRelease], [zeroPriceRelease]],
      purchases: [[], []],
      users: [[]],
      artists: [[]],
    });
    mocks.getDb.mockResolvedValue(zeroDb);

    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 0 })).resolves.toEqual({ success: true, alreadyPurchased: false });
    expect(mocks.getStripeClient).not.toHaveBeenCalled();
    expect(zeroDb.inserts).toContainEqual(expect.objectContaining({
      table: 'purchases',
      value: expect.objectContaining({ amountPaid: '0.00', stripePaymentIntentId: null, paymentStatus: 'completed' }),
    }));

    const nonzeroDb = commerceDatabase({
      releases: [[release({ accessModel: 'pay_what_you_want', price: null, minPrice: '0.01' })]],
      purchases: [[]],
    });
    mocks.getDb.mockResolvedValue(nonzeroDb);
    await expect(createContentReleaseCheckout(fan, { releaseId: 123, amount: 0 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(nonzeroDb.inserts).toEqual([]);
  });

  it('keeps a refunded receipt while preventing a stale success for the same PaymentIntent from reopening it', async () => {
    const staleRefund = {
      id: 9,
      releaseId: 123,
      userId: fan.id,
      amountPaid: '5.00',
      stripePaymentIntentId: 'pi_paid',
      paymentStatus: 'refunded',
    };
    const db = commerceDatabase({ releases: [[release()]], purchases: [[staleRefund]] });
    mocks.getDb.mockResolvedValue(db);

    await fulfillContentReleaseCheckout(paidSession());

    expect(db.inserts).toEqual([]);
    expect(db.updates).toEqual([]);
    expect(mocks.email).not.toHaveBeenCalled();
  });

  it('does not grant access when a refund preceded a delayed successful event', async()=>{
    mocks.paymentIntentsRetrieve.mockResolvedValue({status:'succeeded',amount_received:500,currency:'usd',metadata:paidSession().metadata,latest_charge:{refunded:true,amount:500,amount_refunded:500}});
    await fulfillContentReleaseCheckout(paidSession());
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('marks a fully refunded charge as refunded without deleting its purchase receipt', async () => {
    const db = commerceDatabase();
    mocks.getDb.mockResolvedValue(db);

    await refundContentReleaseCharge({
      metadata: { type: 'content_release_purchase' },
      livemode: false,
      amount: 500,
      amount_refunded: 500,
      payment_intent: 'pi_paid',
    } as any);

    expect(mocks.paymentIntentsRetrieve).toHaveBeenCalledWith('pi_paid');
    expect(db.updates).toEqual([expect.objectContaining({
      table: 'purchases',
      value: { paymentStatus: 'refunded' },
      transaction: false,
    })]);
    expect(db.deletes).toEqual([]);
  });

  it('does not fail completed fulfillment when its optional confirmation email fails', async () => {
    const db = commerceDatabase({
      releases: [[release()]],
      purchases: [[]],
      users: [[fan]],
      artists: [[{ artistName: 'Creator Name' }]],
    });
    mocks.getDb.mockResolvedValue(db);
    mocks.email.mockRejectedValueOnce(new Error('email provider unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(fulfillContentReleaseCheckout(paidSession())).resolves.toBeUndefined();

    expect(db.inserts).toContainEqual(expect.objectContaining({ table: 'purchases' }));
    expect(warn).toHaveBeenCalledWith('[ContentRelease] Optional purchase email failed');
  });
});

describe('shared purchase visibility and verification helpers', () => {
  it('redacts paid content publicly and recognizes only non-refunded paid or zero-dollar receipts', () => {
    const paid = { id: 123, userId: creator.id, accessModel: 'ticketed', contentUrl: 'https://private.example.test/content' };
    expect(contentReleasePublicView(paid, fan.id).contentUrl).toBeNull();
    expect(contentReleasePublicView(paid, creator.id).contentUrl).toBe(paid.contentUrl);
    expect(contentReleasePublicView({ ...paid, accessModel: 'free' }, fan.id).contentUrl).toBe(paid.contentUrl);

    expect(isVerifiedContentPurchase({ amountPaid: '5.00', stripePaymentIntentId: 'pi_paid', paymentStatus: 'completed' })).toBe(true);
    expect(isVerifiedContentPurchase({ amountPaid: '0.00', stripePaymentIntentId: null, paymentStatus: 'completed' })).toBe(true);
    expect(isVerifiedContentPurchase({ amountPaid: '5.00', stripePaymentIntentId: 'pi_paid', paymentStatus: 'refunded' })).toBe(false);
    expect(isVerifiedContentPurchase({ amountPaid: '5.00', stripePaymentIntentId: null, paymentStatus: 'completed' })).toBe(false);
  });
});
