import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { Pool } from 'mysql2/promise';
import type { UserSubscription } from '../drizzle/schema';
import { createSubscriptionRepository } from './db';
import {
  canReplaceBillingSubscription,
  getStripeSubscriptionPeriod,
  getSubscriptionCheckoutDecision,
  mapStripeSubscriptionStatus,
  persistSubscriptionPatch,
  resolveStripeSubscriptionTier,
  synchronizeSubscription,
  type SubscriptionRepository,
  type SubscriptionStripeClient,
} from './services/subscriptionLifecycleService';
import { getEffectiveSubscriptionTier } from '../shared/subscriptionEntitlements';

const NOW = new Date('2026-11-10T20:00:00Z');
const PAST = new Date('2026-11-09T20:00:00Z');
const FUTURE = new Date('2026-12-10T20:00:00Z');
function billing(overrides: Partial<UserSubscription> = {}): UserSubscription {
  return {
    id: 1, userId: 7, tier: 'professional', status: 'active', stripeCustomerId: 'cus_mock',
    stripeSubscriptionId: 'sub_current', stripePriceId: 'price_mock', trialEndsAt: null,
    currentPeriodStart: PAST, currentPeriodEnd: FUTURE, cancelledAt: null,
    pausedAt: null, pauseExpiresAt: null, createdAt: PAST, updatedAt: PAST, ...overrides,
  };
}
function stripeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_current', object: 'subscription', customer: 'cus_mock', status: 'active',
    metadata: { userId: '7', plan: 'ARTIST_PROFESSIONAL' }, trial_end: null,
    canceled_at: null, ended_at: null, pause_collection: null,
    items: { object: 'list', has_more: false, url: '/mock', data: [{
      id: 'si_mock', current_period_start: PAST.getTime() / 1000, current_period_end: FUTURE.getTime() / 1000,
      price: { id: 'price_mock', lookup_key: 'artist_professional_monthly', unit_amount: 2900, currency: 'usd', recurring: { interval: 'month' } },
    }] }, ...overrides,
  } as Stripe.Subscription;
}
function stripeMock(read: () => Stripe.Subscription | Promise<Stripe.Subscription>) {
  const retrieve = vi.fn(async () => read());
  return { client: { subscriptions: { retrieve } } as unknown as SubscriptionStripeClient, retrieve };
}
function memoryRepository(initial: UserSubscription | null = billing()) {
  let row = initial;
  let tail: Promise<void> = Promise.resolve();
  const saves: unknown[] = [];
  const repository: SubscriptionRepository = {
    async withUserLock(userId, work) {
      const previous = tail;
      let release!: () => void;
      tail = new Promise<void>(resolve => { release = resolve; });
      await previous;
      const before = row;
      try {
        if (userId !== 7) throw new Error('mock user not found');
        return await work({
          async getCurrent() { return row; },
          async save(data, expected, exists) {
            if (expected !== (row?.stripeSubscriptionId ?? null) || exists !== (row !== null)) throw new Error('mock compare failed');
            saves.push(data);
            row = { ...(row ?? billing({ stripeSubscriptionId: null, tier: 'free' })), ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) } as UserSubscription;
          },
        });
      } catch (error) { row = before; throw error; }
      finally { release(); }
    },
  };
  return { repository, saves, row: () => row };
}

describe('schema-valid subscription status mapping', () => {
  it.each([
    ['active', 'active'], ['trialing', 'trialing'], ['past_due', 'past_due'],
    ['canceled', 'cancelled'], ['unpaid', 'past_due'], ['incomplete', 'paused'],
    ['incomplete_expired', 'cancelled'], ['paused', 'paused'],
  ] as const)('maps %s to %s', (status, expected) => expect(mapStripeSubscriptionStatus(status)).toBe(expected));
  it('treats the existing pause_collection feature as paused access', () => {
    expect(mapStripeSubscriptionStatus('active', true)).toBe('paused');
  });
});

describe('typed authoritative subscription synchronization', () => {
  it('retrieves actual active checkout state without fabricating an EDU trial', async () => {
    const fixture = memoryRepository(null);
    const stripe = stripeMock(() => stripeSubscription());
    const result = await synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_current', allowReplacement: true, repository: fixture.repository, now: NOW });
    expect(result.synced).toBe(true);
    expect(stripe.retrieve).toHaveBeenCalledWith('sub_current');
    expect(fixture.row()).toMatchObject({ tier: 'professional', status: 'active', trialEndsAt: null, currentPeriodStart: PAST, currentPeriodEnd: FUTURE });
  });
  it.each([
    { status: 'canceled', trial_end: null, expected: 'free' },
    { status: 'incomplete', trial_end: null, expected: 'free' },
    { status: 'incomplete_expired', trial_end: null, expected: 'free' },
    { status: 'trialing', trial_end: null, expected: 'free' },
    { status: 'trialing', trial_end: PAST.getTime() / 1000, expected: 'free' },
    { status: 'trialing', trial_end: FUTURE.getTime() / 1000, expected: 'professional' },
  ] as const)('gives $expected access for actual $status / $trial_end', async ({ status, trial_end, expected }) => {
    const fixture = memoryRepository();
    const stripe = stripeMock(() => stripeSubscription({ status, trial_end }));
    await synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_current', repository: fixture.repository, now: NOW });
    expect(getEffectiveSubscriptionTier(fixture.row(), NOW)).toBe(expected);
    expect(fixture.row()?.trialEndsAt).toEqual(trial_end ? new Date(trial_end * 1000) : null);
  });
  it('honors item-level current periods and supports legacy API snapshots without fabricated dates', () => {
    expect(getStripeSubscriptionPeriod(stripeSubscription())).toEqual({ currentPeriodStart: PAST, currentPeriodEnd: FUTURE });
    const legacy = { ...stripeSubscription(), items: { data: [] }, current_period_start: PAST.getTime() / 1000, current_period_end: FUTURE.getTime() / 1000 } as unknown as Stripe.Subscription;
    expect(getStripeSubscriptionPeriod(legacy)).toEqual({ currentPeriodStart: PAST, currentPeriodEnd: FUTURE });
    expect(getStripeSubscriptionPeriod({ ...legacy, current_period_start: undefined, current_period_end: undefined } as unknown as Stripe.Subscription)).toEqual({ currentPeriodStart: null, currentPeriodEnd: null });
  });
  it('resolves current price over stale metadata, never guessing Professional for unknown prices', () => {
    const snapshot = stripeSubscription();
    snapshot.items.data[0].price.lookup_key = 'artist_starter_yearly';
    expect(resolveStripeSubscriptionTier(snapshot)).toBe('starter');
    snapshot.items.data[0].price.lookup_key = 'unknown';
    snapshot.items.data[0].price.unit_amount = 123;
    snapshot.metadata = { userId: '7' };
    expect(() => resolveStripeSubscriptionTier(snapshot)).toThrow(/resolve/);
  });
  it('late checkout/invoice events cannot overwrite current recovered active state', async () => {
    const fixture = memoryRepository(billing({ status: 'past_due' }));
    const stripe = stripeMock(() => stripeSubscription({ status: 'active' }));
    for (const allowReplacement of [false, true, false]) {
      await synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_current', allowReplacement, repository: fixture.repository, now: NOW });
    }
    expect(fixture.row()).toMatchObject({ status: 'active', trialEndsAt: null });
    expect(fixture.saves).toHaveLength(3);
  });
  it('old cancellation/failure identities cannot touch a new active subscription', async () => {
    const fixture = memoryRepository(billing({ stripeSubscriptionId: 'sub_new' }));
    const stripe = stripeMock(() => stripeSubscription({ id: 'sub_old', status: 'canceled' }));
    for (const allowReplacement of [false, true]) {
      await expect(synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_old', allowReplacement, repository: fixture.repository, now: NOW })).resolves.toEqual({ synced: false, reason: 'different_current_subscription', currentSubscriptionId: 'sub_new' });
    }
    expect(stripe.retrieve).not.toHaveBeenCalled();
    expect(fixture.saves).toHaveLength(0);
    expect(fixture.row()).toMatchObject({ status: 'active', stripeSubscriptionId: 'sub_new' });
  });
  it('only explicit checkout/reconciliation can replace proven terminated billing', async () => {
    const fixture = memoryRepository(billing({ status: 'cancelled', currentPeriodEnd: PAST }));
    const stripe = stripeMock(() => stripeSubscription({ id: 'sub_new' }));
    await expect(synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_new', repository: fixture.repository, now: NOW })).resolves.toMatchObject({ synced: false });
    await expect(synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_new', allowReplacement: true, repository: fixture.repository, now: NOW })).resolves.toMatchObject({ synced: true });
    expect(fixture.row()?.stripeSubscriptionId).toBe('sub_new');
  });
  it('serializes competing first checkouts: one wins, the other is rejected without replacing it', async () => {
    const fixture = memoryRepository(null);
    const stripeA = stripeMock(() => stripeSubscription({ id: 'sub_a' }));
    const stripeB = stripeMock(() => stripeSubscription({ id: 'sub_b' }));
    const result = await Promise.all([
      synchronizeSubscription({ stripeClient: stripeA.client, userId: 7, subscriptionId: 'sub_a', allowReplacement: true, repository: fixture.repository, now: NOW }),
      synchronizeSubscription({ stripeClient: stripeB.client, userId: 7, subscriptionId: 'sub_b', allowReplacement: true, repository: fixture.repository, now: NOW }),
    ]);
    expect(result.map(value => value.synced)).toEqual([true, false]);
    expect(fixture.row()?.stripeSubscriptionId).toBe('sub_a');
    expect(fixture.saves).toHaveLength(1);
  });
  it('retrieves inside each lock so a slower old retrieval cannot commit after newer state', async () => {
    const fixture = memoryRepository();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const old = stripeMock(async () => { await gate; return stripeSubscription({ status: 'past_due' }); });
    const recovered = stripeMock(() => stripeSubscription({ status: 'active' }));
    const first = synchronizeSubscription({ stripeClient: old.client, userId: 7, subscriptionId: 'sub_current', repository: fixture.repository, now: NOW });
    const second = synchronizeSubscription({ stripeClient: recovered.client, userId: 7, subscriptionId: 'sub_current', repository: fixture.repository, now: NOW });
    release();
    await Promise.all([first, second]);
    expect(fixture.row()?.status).toBe('active');
  });
  it.each([
    { metadata: { userId: '8', plan: 'ARTIST_PROFESSIONAL' } },
    { metadata: { userId: '7oops', plan: 'ARTIST_PROFESSIONAL' } },
    { metadata: { userId: '7', type: 'fan_club_subscription' } },
    { customer: 'cus_other' },
  ] as Partial<Stripe.Subscription>[])('rejects identity mismatches without persisting: %j', async overrides => {
    const fixture = memoryRepository();
    const stripe = stripeMock(() => stripeSubscription(overrides));
    await expect(synchronizeSubscription({ stripeClient: stripe.client, userId: 7, expectedCustomerId: 'cus_mock', subscriptionId: 'sub_current', repository: fixture.repository, now: NOW })).rejects.toThrow();
    expect(fixture.saves).toHaveLength(0);
  });
  it('provider outages reject without fake success or mutation', async () => {
    const fixture = memoryRepository();
    const stripe = stripeMock(() => { throw new Error('mock Stripe outage'); });
    await expect(synchronizeSubscription({ stripeClient: stripe.client, userId: 7, subscriptionId: 'sub_current', repository: fixture.repository, now: NOW })).rejects.toThrow('mock Stripe outage');
    expect(fixture.saves).toHaveLength(0);
  });
});

describe('replacement and checkout policy', () => {
  it.each(['active', 'trialing', 'past_due', 'paused'] as const)('blocks duplicate checkout for %s, regardless of stale free tier', status => {
    const raw = billing({ status, tier: 'free' });
    expect(canReplaceBillingSubscription(raw, NOW)).toBe(false);
    expect(getSubscriptionCheckoutDecision(raw, raw, NOW)).toEqual({ allowed: false, reason: 'existing_subscription' });
  });
  it('blocks uncertain/future cancellations and allows no Stripe / proven termination', () => {
    for (const currentPeriodEnd of [null, FUTURE]) expect(canReplaceBillingSubscription(billing({ status: 'cancelled', currentPeriodEnd }), NOW)).toBe(false);
    expect(canReplaceBillingSubscription(billing({ status: 'cancelled', currentPeriodEnd: PAST }), NOW)).toBe(true);
    expect(canReplaceBillingSubscription(null, NOW)).toBe(true);
    expect(canReplaceBillingSubscription(billing({ stripeSubscriptionId: null, tier: 'free' }), NOW)).toBe(true);
  });
  it.each(['platform_owner', 'complimentary_grant'])('preserves %s and prevents paid checkout', accessSource => {
    expect(getSubscriptionCheckoutDecision(null, { tier: 'enterprise', status: 'active', isComplimentary: true, accessSource }, NOW)).toEqual({ allowed: false, reason: 'complimentary_access' });
  });
  it('legacy upsert preserves partial signature but rejects competing IDs and invalid enum values', async () => {
    const fixture = memoryRepository();
    await persistSubscriptionPatch({ userId: 7, status: 'paused' }, fixture.repository);
    expect(fixture.row()?.status).toBe('paused');
    await expect(persistSubscriptionPatch({ userId: 7, stripeSubscriptionId: 'sub_other', status: 'active' }, fixture.repository)).rejects.toThrow(/replace/);
    await expect(persistSubscriptionPatch({ userId: 7, status: 'canceled' as never }, fixture.repository)).rejects.toThrow(/status/);
  });
  it('strict expected-identity legacy status writes never resurrect another terminated subscription', async () => {
    const fixture = memoryRepository(billing({ stripeSubscriptionId: 'sub_new', status: 'cancelled', currentPeriodEnd: PAST }));
    await expect(persistSubscriptionPatch({ userId: 7, status: 'past_due' }, fixture.repository, 'sub_old')).rejects.toThrow(/identity changed/);
    expect(fixture.saves).toHaveLength(0);
    expect(fixture.row()).toMatchObject({ stripeSubscriptionId: 'sub_new', status: 'cancelled' });
  });
});

describe('real repository contract with fully mocked mysql connection', () => {
  function sqlFixture(options: { affectedRows?: number; outage?: boolean; userMissing?: boolean; subscriptionMissing?: boolean } = {}) {
    const statements: string[] = [];
    const execute = vi.fn(async (sql: string) => {
      statements.push(sql);
      if (sql.startsWith('SELECT id FROM users')) return [options.userMissing ? [] : [{ id: 7 }], {}];
      if (sql.startsWith('SELECT * FROM user_subscriptions')) return [options.subscriptionMissing ? [] : [billing()], {}];
      if (options.outage) throw new Error('mock persistence outage');
      return [{ affectedRows: options.affectedRows ?? 1 }, {}];
    });
    const connection = { execute, beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() };
    const pool = { getConnection: vi.fn(async () => connection) } as unknown as Pick<Pool, 'getConnection'>;
    return { connection, statements, repository: createSubscriptionRepository(pool) };
  }
  it('locks user first, reads billing next, and compares Stripe identity before commit', async () => {
    const f = sqlFixture();
    await persistSubscriptionPatch({ userId: 7, status: 'paused' }, f.repository);
    expect(f.statements[0]).toMatch(/users.*FOR UPDATE/);
    expect(f.statements[1]).toMatch(/user_subscriptions.*FOR UPDATE/);
    expect(f.statements[2]).toMatch(/stripeSubscriptionId <=> \?/);
    expect(f.connection.execute.mock.calls[2]).toEqual([expect.any(String), [ 'paused', 7, 'sub_current' ]]);
    expect(f.connection.commit).toHaveBeenCalledOnce();
    expect(f.connection.rollback).not.toHaveBeenCalled();
    expect(f.connection.release).toHaveBeenCalledOnce();
  });
  it('inserts schema defaults under a user lock when no subscription exists, never updating a phantom row', async () => {
    const f = sqlFixture({ subscriptionMissing: true });
    await persistSubscriptionPatch({ userId: 7 }, f.repository);
    expect(f.statements[0]).toMatch(/users.*FOR UPDATE/);
    expect(f.statements[2]).toBe('INSERT INTO user_subscriptions (userId) VALUES (?)');
    expect(f.connection.execute.mock.calls[2]).toEqual([expect.any(String), [7]]);
    expect(f.connection.commit).toHaveBeenCalledOnce();
  });
  it.each([{ affectedRows: 0 }, { outage: true }, { userMissing: true }])('rolls back and rejects persistence failures: %j', async options => {
    const f = sqlFixture(options);
    await expect(persistSubscriptionPatch({ userId: 7, status: 'paused' }, f.repository)).rejects.toThrow();
    expect(f.connection.commit).not.toHaveBeenCalled();
    expect(f.connection.rollback).toHaveBeenCalledOnce();
    expect(f.connection.release).toHaveBeenCalledOnce();
  });
});
