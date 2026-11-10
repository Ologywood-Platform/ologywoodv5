import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEffectiveSubscriptionTier, hasPaidSubscriptionAccess, projectSubscriptionEntitlements } from '../shared/subscriptionEntitlements';
import { resolveOwnerSubscription } from './services/ownerSubscriptionAccess';
import { resolveComplimentarySubscription } from './services/complimentaryAccessResolution';
import type { UserSubscription } from '../drizzle/schema';
import type { GrantState } from '../shared/complimentaryAccess';
import { assertRiderDocumentAccess, type RiderDocumentConnection } from './services/riderDocumentAccessService';

const dbMock = vi.hoisted(() => ({ getSubscriptionByUserId: vi.fn(), getDb: vi.fn(), upsertSubscription: vi.fn() }));
vi.mock('./db', () => dbMock);
import { hasFeatureAccess, canCreateRelease, canCreateProjectPreview, getMaxTracksPerProject, getMaxSnippetSeconds, getAllTiers } from './services/pricingTierService';
import { checkArtistSubscription, requireSubscription } from './subscriptionMiddleware';
const NOW = new Date('2026-11-10T20:00:00Z');
const FUTURE = new Date('2026-12-10T20:00:00Z');
const PAST = new Date('2026-10-10T20:00:00Z');
const raw: UserSubscription = {
  id: 1, userId: 7, tier: 'professional', status: 'cancelled', stripeSubscriptionId: null,
  stripeCustomerId: null, stripePriceId: null, trialEndsAt: null, currentPeriodStart: null,
  currentPeriodEnd: PAST, cancelledAt: PAST, pausedAt: null, pauseExpiresAt: null,
  createdAt: PAST, updatedAt: PAST,
};
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe('shared effective subscription entitlements', () => {
  it.each(['cancelled', 'past_due', 'paused', 'incomplete', 'canceled', 'free'])('retains raw paid tier but denies access for %s', status => {
    const billing = { ...raw, status };
    expect(getEffectiveSubscriptionTier(billing, NOW)).toBe('free');
    const projected = projectSubscriptionEntitlements(billing, NOW);
    expect(projected).toMatchObject({ tier: 'free', billingTier: 'professional', billingStatus: status });
    expect(billing.tier).toBe('professional');
  });
  it('free/unknown tiers never become paid merely from active status', () => {
    expect(hasPaidSubscriptionAccess({ tier: 'free', status: 'active' }, NOW)).toBe(false);
    expect(getEffectiveSubscriptionTier({ tier: 'bogus', status: 'active' }, NOW)).toBe('free');
    expect(getEffectiveSubscriptionTier(null, NOW)).toBe('free');
  });
  it.each([null, PAST, NOW, 'not a date', 0])('denies missing/expired/invalid trial dates: %j', trialEndsAt => {
    expect(getEffectiveSubscriptionTier({ tier: 'enterprise', status: 'trialing', trialEndsAt }, NOW)).toBe('free');
  });
  it('allows genuine unexpired trials including legacy beta trials, never requiring fabricated Stripe evidence', () => {
    expect(getEffectiveSubscriptionTier({ tier: 'professional', status: 'trialing', trialEndsAt: FUTURE }, NOW)).toBe('professional');
    expect(getEffectiveSubscriptionTier({ tier: 'starter', status: 'active' }, NOW)).toBe('starter');
  });
  it('preserves the existing verified owner override without mutating cancelled billing history', () => {
    const before = structuredClone(raw);
    const owner = resolveOwnerSubscription({ id: 7, openId: 'mock_owner' }, raw, { openId: 'mock_owner' });
    expect(getEffectiveSubscriptionTier(owner, NOW)).toBe('enterprise');
    expect(owner).toMatchObject({ isComplimentary: true, accessSource: 'platform_owner', billingStatus: 'cancelled', billingTier: 'professional' });
    expect(raw).toEqual(before);
    expect(getEffectiveSubscriptionTier(resolveOwnerSubscription({ id: 7, openId: 'other' }, raw, { openId: 'mock_owner' }), NOW)).toBe('free');
  });
  it('preserves existing complimentary grants and denies expired/revoked grants', () => {
    const grant: GrantState = { userId: 7, tier: 'starter', status: 'active', expiresAt: FUTURE, reason: 'mock', grantedByUserId: 8, grantedAt: PAST, revision: 1, revokedAt: null, updatedAt: PAST };
    const effective = resolveComplimentarySubscription(7, raw, grant, NOW);
    expect(getEffectiveSubscriptionTier(effective, NOW)).toBe('starter');
    expect(getEffectiveSubscriptionTier(effective, FUTURE)).toBe('free');
    expect(getEffectiveSubscriptionTier(resolveComplimentarySubscription(7, raw, { ...grant, status: 'revoked' }, NOW), NOW)).toBe('free');
    expect(getEffectiveSubscriptionTier(resolveComplimentarySubscription(7, raw, { ...grant, expiresAt: PAST }, NOW), NOW)).toBe('free');
  });
});

describe('pricing and subscription middleware use effective access', () => {
  it.each(['cancelled', 'past_due', 'paused'] as const)('denies paid features/limits for raw %s billing without changing free features', async status => {
    dbMock.getSubscriptionByUserId.mockResolvedValue({ ...raw, status });
    expect(await hasFeatureAccess(7, 'riderBuilder')).toBe(false);
    expect(await hasFeatureAccess(7, 'messaging')).toBe(true);
    expect(await hasFeatureAccess(7, 'paymentProcessing')).toBe(true);
    expect(await canCreateRelease(7, 0)).toMatchObject({ allowed: false, maxAllowed: 0 });
    expect(await canCreateProjectPreview(7, 0)).toMatchObject({ allowed: false, maxAllowed: 0 });
    expect(await getMaxTracksPerProject(7)).toBe(0);
    expect(await getMaxSnippetSeconds(7)).toBe(0);
    expect(await checkArtistSubscription(7)).toBe(false);
    await expect(requireSubscription(7, 'artist')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(requireSubscription(7, 'venue')).resolves.toBeUndefined();
  });
  it('permits real trials but not missing/expired trials in middleware and pricing', async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW);
    for (const trialEndsAt of [null, PAST]) {
      dbMock.getSubscriptionByUserId.mockResolvedValue({ ...raw, status: 'trialing', trialEndsAt });
      expect(await checkArtistSubscription(7)).toBe(false);
      expect(await hasFeatureAccess(7, 'riderBuilder')).toBe(false);
    }
    dbMock.getSubscriptionByUserId.mockResolvedValue({ ...raw, status: 'trialing', trialEndsAt: FUTURE });
    expect(await checkArtistSubscription(7)).toBe(true);
    expect(await hasFeatureAccess(7, 'riderBuilder')).toBe(true);
    expect(await canCreateRelease(7, 20)).toMatchObject({ allowed: true, maxAllowed: Infinity });
  });
  it('does not change plan prices, release quotas, or free payment access', () => {
    const tiers = getAllTiers();
    expect(Object.values(tiers).map(tier => tier.price)).toEqual([0, 9, 29, 79]);
    expect(tiers.starter.maxActiveReleases).toBe(2);
    expect(tiers.starter.maxMerchItems).toBe(6);
    expect(tiers.enterprise.maxMerchItems).toBe(30);
    expect(tiers.free.features.paymentProcessing).toBe(true);
  });
});

describe('rider transaction access enforces real trial expiration', () => {
  function connection(subscription: Record<string, unknown>, grant?: Record<string, unknown>): RiderDocumentConnection {
    return { async execute(sql: string) {
      let rows: unknown[] = [];
      if (sql.includes('FROM artist_profiles')) rows = [{ id: 15, userId: 7, artistName: 'Mock' }];
      else if (sql.includes('SELECT id, openId, email, emailVerified FROM users')) rows = [{ id: 7, openId: 'not_owner', email: 'mock@example.invalid', emailVerified: false }];
      else if (sql.includes('FROM user_subscriptions')) rows = [subscription];
      else if (sql.includes('FROM complimentary_access_grants')) rows = grant ? [grant] : [];
      return [rows, {}];
    } } as RiderDocumentConnection;
  }
  it.each([null, PAST, NOW])('refuses new rider writes for an invalid trial date %j while retaining reads', async trialEndsAt => {
    vi.useFakeTimers(); vi.setSystemTime(NOW);
    const db = connection({ tier: 'professional', status: 'trialing', trialEndsAt });
    await expect(assertRiderDocumentAccess(db, 7, 7, { requirePlan: true })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(assertRiderDocumentAccess(db, 7, 7, { requirePlan: false })).resolves.toMatchObject({ canManage: true, planAllowed: false, tier: 'free' });
  });
  it('allows genuine trials and active grants without changing ownership checks', async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW);
    await expect(assertRiderDocumentAccess(connection({ tier: 'professional', status: 'trialing', trialEndsAt: FUTURE }), 7, 7, { requirePlan: true })).resolves.toMatchObject({ planAllowed: true });
    await expect(assertRiderDocumentAccess(connection({ tier: 'free', status: 'active' }, { tier: 'starter', status: 'active', expiresAt: FUTURE }), 7, 7, { requirePlan: true })).resolves.toMatchObject({ planAllowed: true, tier: 'starter' });
  });
});
