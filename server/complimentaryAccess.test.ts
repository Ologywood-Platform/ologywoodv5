import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User, UserSubscription } from '../drizzle/schema';
import type { ComplimentaryTier, GrantState } from '../shared/complimentaryAccess';
import {
  grantComplimentaryAccess,
  inspectComplimentaryAccess,
  revokeComplimentaryAccess,
  type GrantEvent,
  type GrantRepository,
  type GrantTransaction,
} from './services/complimentaryAccessService';
import { resolveComplimentarySubscription } from './services/complimentaryAccessResolution';
import {
  ensureComplimentaryAccessSchema,
  resetComplimentaryAccessSchemaForTests,
} from './services/complimentaryAccessSchemaService';
import type { EffectiveSubscription } from './services/ownerSubscriptionAccess';

const NOW = new Date('2030-06-15T12:00:00.000Z');
const FUTURE = new Date('2030-06-20T12:00:00.000Z');
const LATER_FUTURE = new Date('2030-06-25T12:00:00.000Z');
const originalEnvironment = {
  ownerOpenId: process.env.OWNER_OPEN_ID,
  ownerEmail: process.env.OWNER_EMAIL,
  ownerName: process.env.OWNER_NAME,
};

function restoreEnvironment(name: keyof typeof originalEnvironment) {
  const value = originalEnvironment[name];
  const environmentName = name === 'ownerOpenId' ? 'OWNER_OPEN_ID' : name === 'ownerEmail' ? 'OWNER_EMAIL' : 'OWNER_NAME';
  if (value === undefined) delete process.env[environmentName];
  else process.env[environmentName] = value;
}

function makeUser(overrides: Partial<User> = {}): User {
  const timestamp = new Date('2030-01-01T00:00:00.000Z');
  return {
    id: 2,
    openId: 'target-open-id',
    name: 'Target User',
    email: 'target@example.test',
    loginMethod: 'password',
    role: 'user',
    emailVerified: false,
    emailVerificationToken: null,
    emailVerificationSentAt: null,
    passwordHash: null,
    oauthProvider: null,
    oauthProviderId: null,
    avatarUrl: null,
    customAvatarUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSignedIn: timestamp,
    ...overrides,
  };
}

function ownerUser(overrides: Partial<User> = {}): User {
  return makeUser({
    id: 1,
    openId: 'test-owner',
    name: 'Verified Owner',
    email: 'verified-owner@example.test',
    emailVerified: true,
    ...overrides,
  });
}

function makeBilling(
  status: UserSubscription['status'] = 'cancelled',
  stripeSubscriptionId: string | null = null,
  overrides: Partial<UserSubscription> = {},
): UserSubscription {
  return {
    id: 11,
    userId: 2,
    tier: 'professional',
    status,
    stripeCustomerId: stripeSubscriptionId ? 'cus_test' : null,
    stripeSubscriptionId,
    stripePriceId: stripeSubscriptionId ? 'price_test' : null,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: status === 'cancelled' ? new Date('2030-01-01T00:00:00.000Z') : null,
    cancelledAt: status === 'cancelled' ? new Date('2030-01-01T00:00:00.000Z') : null,
    pausedAt: null,
    pauseExpiresAt: null,
    createdAt: new Date('2030-01-01T00:00:00.000Z'),
    updatedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeGrant(overrides: Partial<GrantState> = {}): GrantState {
  return {
    userId: 2,
    tier: 'starter',
    status: 'active',
    expiresAt: null,
    reason: 'Initial access reason',
    grantedByUserId: 1,
    grantedAt: NOW,
    revision: 1,
    revokedAt: null,
    updatedAt: NOW,
    ...overrides,
  };
}

function copyGrant(grant: GrantState): GrantState {
  return {
    ...grant,
    expiresAt: grant.expiresAt && new Date(grant.expiresAt),
    grantedAt: new Date(grant.grantedAt),
    revokedAt: grant.revokedAt && new Date(grant.revokedAt),
    updatedAt: new Date(grant.updatedAt),
  };
}

function copyEvent(event: GrantEvent): GrantEvent {
  return {
    ...event,
    expiresAt: event.expiresAt && new Date(event.expiresAt),
    createdAt: new Date(event.createdAt),
  };
}

/**
 * Deliberately clones the grant and event stores at each transaction boundary.
 * A thrown audit write therefore verifies the same all-or-nothing contract as
 * the production transaction without contacting MySQL or Stripe.
 */
class InMemoryGrantRepository implements GrantRepository {
  users = new Map<number, User>();
  billings = new Map<number, UserSubscription>();
  grants = new Map<number, GrantState>();
  events: GrantEvent[] = [];
  failAppend = false;
  private nextEventId = 1;

  constructor(users: User[] = [], billings: UserSubscription[] = []) {
    users.forEach((user) => this.users.set(user.id, user));
    billings.forEach((billing) => this.billings.set(billing.userId, billing));
  }

  async transaction<T>(work: (tx: GrantTransaction) => Promise<T>): Promise<T> {
    const draftGrants = new Map([...this.grants].map(([id, grant]) => [id, copyGrant(grant)]));
    const draftEvents = this.events.map(copyEvent);
    let draftNextEventId = this.nextEventId;

    const tx: GrantTransaction = {
      getUserForUpdate: async (userId) => this.users.get(userId) ?? null,
      getBillingForUpdate: async (userId) => this.billings.get(userId) ?? null,
      getGrant: async (userId) => {
        const grant = draftGrants.get(userId);
        return grant ? copyGrant(grant) : null;
      },
      saveGrant: async (grant) => {
        draftGrants.set(grant.userId, copyGrant(grant));
      },
      appendEvent: async (event) => {
        if (this.failAppend) throw new Error('audit write failed');
        draftEvents.push({ ...event, id: draftNextEventId++ });
      },
    };

    const result = await work(tx);
    this.grants = draftGrants;
    this.events = draftEvents;
    this.nextEventId = draftNextEventId;
    return result;
  }

  async inspect(userId: number) {
    const grant = this.grants.get(userId);
    return {
      user: this.users.get(userId) ?? null,
      billing: this.billings.get(userId) ?? null,
      grant: grant ? copyGrant(grant) : null,
      events: this.events.filter((event) => event.userId === userId).map(copyEvent).reverse(),
    };
  }
}

function repository(billing?: UserSubscription): InMemoryGrantRepository {
  return new InMemoryGrantRepository([makeUser()], billing ? [billing] : []);
}

function grantInput(overrides: Record<string, unknown> = {}) {
  return {
    userId: 2,
    tier: 'starter' as ComplimentaryTier,
    expiresAt: null as Date | null,
    reason: 'Legitimate access reason',
    expectedRevision: 0,
    billingAcknowledged: true as const,
    ...overrides,
  };
}

beforeEach(() => {
  process.env.OWNER_OPEN_ID = 'test-owner';
  process.env.OWNER_EMAIL = 'owner@example.test';
  process.env.OWNER_NAME = '';
  resetComplimentaryAccessSchemaForTests();
});

afterAll(() => {
  restoreEnvironment('ownerOpenId');
  restoreEnvironment('ownerEmail');
  restoreEnvironment('ownerName');
});

describe('complimentary access service', () => {
  it.each([
    ['starter', null],
    ['professional', FUTURE],
    ['enterprise', null],
  ] as const)('creates exactly one trimmed %s grant and event', async (tier, expiresAt) => {
    const repo = repository();

    await expect(grantComplimentaryAccess(
      ownerUser(),
      grantInput({ tier, expiresAt, reason: `  ${tier} access approved  ` }),
      repo,
      NOW,
    )).resolves.toEqual({ success: true });

    const state = repo.grants.get(2)!;
    expect(state).toMatchObject({
      userId: 2,
      tier,
      status: 'active',
      expiresAt,
      reason: `${tier} access approved`,
      grantedByUserId: 1,
      grantedAt: NOW,
      revision: 1,
      revokedAt: null,
      updatedAt: NOW,
    });
    expect(repo.events).toHaveLength(1);
    expect(repo.events[0]).toMatchObject({
      userId: 2,
      actorUserId: 1,
      action: 'grant',
      tier,
      expiresAt,
      reason: `${tier} access approved`,
      revision: 1,
      createdAt: NOW,
    });
  });

  it('lets only the verified configured owner inspect an existing grant', async () => {
    const repo = repository();
    await grantComplimentaryAccess(ownerUser(), grantInput(), repo, NOW);

    const inspected = await inspectComplimentaryAccess(ownerUser(), 2, repo);
    expect(inspected).toMatchObject({
      user: { id: 2, name: 'Target User', email: 'target@example.test' },
      isOwner: false,
      billing: { tier: 'free', status: 'none', hasStripeSubscription: false },
      grant: { tier: 'starter', status: 'active', effectiveStatus: 'active', revision: 1 },
    });
    expect(inspected.events).toHaveLength(1);
  });

  it('does not allow another admin to grant, revoke, or inspect', async () => {
    const repo = repository();
    const anotherAdmin = makeUser({ id: 3, openId: 'admin-other', role: 'admin', email: 'admin@example.test' });

    await expect(grantComplimentaryAccess(anotherAdmin, grantInput(), repo, NOW)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(revokeComplimentaryAccess(anotherAdmin, { userId: 2, expectedRevision: 0, reason: 'Revoke access' }, repo, NOW)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(inspectComplimentaryAccess(anotherAdmin, 2, repo)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(repo.grants).toHaveLength(0);
    expect(repo.events).toHaveLength(0);
  });

  it('does not let an unverified email match gain owner permissions', async () => {
    const repo = repository();
    const unverifiedEmailMatch = makeUser({
      id: 3,
      openId: null,
      email: 'owner@example.test',
      emailVerified: false,
      role: 'admin',
    });

    await expect(grantComplimentaryAccess(unverifiedEmailMatch, grantInput(), repo, NOW)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(inspectComplimentaryAccess(unverifiedEmailMatch, 2, repo)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('rejects a missing target and an owner-protected target', async () => {
    const repo = repository();
    await expect(grantComplimentaryAccess(ownerUser(), grantInput({ userId: 999 }), repo, NOW)).rejects.toMatchObject({ code: 'NOT_FOUND' });

    repo.users.set(9, ownerUser({ id: 9, openId: 'test-owner', email: 'other-owner@example.test' }));
    await expect(grantComplimentaryAccess(ownerUser(), grantInput({ userId: 9 }), repo, NOW)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: expect.stringContaining('protected complimentary Enterprise'),
    });
    expect(repo.events).toHaveLength(0);
  });

  it.each([
    ['unknown tier', { tier: 'vip' }],
    ['invalid date', { expiresAt: new Date('invalid') }],
    ['non-future date', { expiresAt: NOW }],
    ['too-distant date', { expiresAt: new Date('2038-01-01T00:00:00.001Z') }],
    ['too-short trimmed reason', { reason: ' x ' }],
    ['too-long reason', { reason: 'x'.repeat(501) }],
    ['missing billing acknowledgment', { billingAcknowledged: false }],
    ['negative revision', { expectedRevision: -1 }],
    ['fractional revision', { expectedRevision: 1.5 }],
  ])('rejects %s without creating a state or event', async (_label, input) => {
    const repo = repository();
    await expect(grantComplimentaryAccess(ownerUser(), grantInput(input), repo, NOW)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(repo.grants).toHaveLength(0);
    expect(repo.events).toHaveLength(0);
  });

  it('rejects a stale revision before changing state or writing a new event', async () => {
    const repo = repository();
    await grantComplimentaryAccess(ownerUser(), grantInput({ reason: 'First grant reason' }), repo, NOW);

    await expect(grantComplimentaryAccess(
      ownerUser(),
      grantInput({ tier: 'enterprise', reason: 'Stale replacement attempt', expectedRevision: 0 }),
      repo,
      NOW,
    )).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(repo.grants.get(2)).toMatchObject({ tier: 'starter', reason: 'First grant reason', revision: 1 });
    expect(repo.events).toHaveLength(1);
  });

  it('rolls back the grant when writing its audit event fails', async () => {
    const repo = repository();
    repo.failAppend = true;

    await expect(grantComplimentaryAccess(ownerUser(), grantInput(), repo, NOW)).rejects.toThrow('audit write failed');
    expect(repo.grants).toHaveLength(0);
    expect(repo.events).toHaveLength(0);
  });

  it.each(['active', 'paused', 'past_due', 'trialing'] as const)('blocks a %s Stripe subscription without mutating anything', async (status) => {
    const repo = repository(makeBilling(status, 'sub_live'));

    await expect(grantComplimentaryAccess(ownerUser(), grantInput(), repo, NOW)).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    expect(repo.grants).toHaveLength(0);
    expect(repo.events).toHaveLength(0);
  });

  it('allows a cancelled Stripe subscription because billing remains separate', async () => {
    const repo = repository(makeBilling('cancelled', 'sub_cancelled'));
    await expect(grantComplimentaryAccess(ownerUser(), grantInput(), repo, NOW)).resolves.toEqual({ success: true });
    expect(repo.grants.get(2)).toMatchObject({ status: 'active', revision: 1 });
    expect(repo.events).toHaveLength(1);
  });

  it('revokes an active grant with a second event and rejects a no-active revoke', async () => {
    const repo = repository();
    await grantComplimentaryAccess(ownerUser(), grantInput({ reason: 'Original grant reason' }), repo, NOW);

    await expect(revokeComplimentaryAccess(
      ownerUser(),
      { userId: 2, expectedRevision: 1, reason: '  Business relationship ended  ' },
      repo,
      FUTURE,
    )).resolves.toEqual({ success: true });

    expect(repo.grants.get(2)).toMatchObject({
      status: 'revoked',
      revision: 2,
      revokedAt: FUTURE,
      updatedAt: FUTURE,
      reason: 'Original grant reason',
    });
    expect(repo.events).toHaveLength(2);
    expect(repo.events[1]).toMatchObject({ action: 'revoke', revision: 2, reason: 'Business relationship ended', createdAt: FUTURE });

    await expect(revokeComplimentaryAccess(
      ownerUser(),
      { userId: 2, expectedRevision: 2, reason: 'Try another revoke' },
      repo,
      FUTURE,
    )).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(repo.events).toHaveLength(2);
  });

  it('replaces a current grant at the correct revision while retaining its old event', async () => {
    const repo = repository();
    await grantComplimentaryAccess(ownerUser(), grantInput({ tier: 'starter', reason: 'Initial starter approval' }), repo, NOW);
    await grantComplimentaryAccess(
      ownerUser(),
      grantInput({ tier: 'professional', expiresAt: LATER_FUTURE, reason: 'Replacement professional approval', expectedRevision: 1 }),
      repo,
      FUTURE,
    );

    expect(repo.grants.get(2)).toMatchObject({ tier: 'professional', expiresAt: LATER_FUTURE, revision: 2 });
    expect(repo.events).toHaveLength(2);
    expect(repo.events.map((event) => ({ tier: event.tier, reason: event.reason, revision: event.revision }))).toEqual([
      { tier: 'starter', reason: 'Initial starter approval', revision: 1 },
      { tier: 'professional', reason: 'Replacement professional approval', revision: 2 },
    ]);
  });
});

describe('complimentary subscription resolution', () => {
  it('never replaces platform-owner access with a grant', () => {
    const platformOwner = {
      ...makeBilling('active'),
      accessSource: 'platform_owner' as const,
      isComplimentary: true,
    } satisfies EffectiveSubscription;

    expect(resolveComplimentarySubscription(2, platformOwner, makeGrant({ tier: 'starter' }), NOW)).toBe(platformOwner);
  });

  it('creates an active tiered grant view with synthetic id 0 and does not mutate raw billing', () => {
    const rawCancelled = makeBilling('cancelled', 'sub_cancelled');
    const snapshot = { ...rawCancelled };
    const fromBilling = resolveComplimentarySubscription(2, rawCancelled, makeGrant({ tier: 'enterprise' }), NOW)!;
    const fromNoBilling = resolveComplimentarySubscription(2, null, makeGrant({ tier: 'professional' }), NOW)!;

    expect(rawCancelled).toEqual(snapshot);
    expect(fromBilling).not.toBe(rawCancelled);
    expect(fromBilling).toMatchObject({
      id: rawCancelled.id,
      tier: 'enterprise',
      status: 'active',
      isComplimentary: true,
      accessSource: 'complimentary_grant',
      subscriptionPrice: 0,
      hasExistingStripeSubscription: true,
      billingStatus: 'cancelled',
      billingTier: 'professional',
      stripeSubscriptionId: null,
    });
    expect(fromNoBilling).toMatchObject({ id: 0, userId: 2, tier: 'professional', isComplimentary: true });
  });

  it.each([
    ['no raw subscription', null],
    ['cancelled raw subscription', makeBilling('cancelled', 'sub_cancelled')],
  ] as const)('drops an exactly-expired grant to free for %s', (_label, billing) => {
    const result = resolveComplimentarySubscription(2, billing, makeGrant({ expiresAt: NOW }), NOW)!;
    expect(result).toMatchObject({
      tier: 'free',
      status: 'active',
      isComplimentary: false,
      accessSource: 'expired_grant',
      subscriptionPrice: 0,
      complimentaryExpiresAt: NOW,
    });
  });

  it('keeps valid raw paid access when a grant is revoked', () => {
    const paid = makeBilling('active', 'sub_paid');
    expect(resolveComplimentarySubscription(2, paid, makeGrant({ status: 'revoked' }), NOW)).toBe(paid);
  });

  it('returns exactly the ordinary billing object when there is no grant', () => {
    const ordinary = makeBilling('active', 'sub_paid');
    expect(resolveComplimentarySubscription(2, ordinary, null, NOW)).toBe(ordinary);
    expect(resolveComplimentarySubscription(2, null, null, NOW)).toBeNull();
  });

  it('lets an existing paid Stripe subscription override an otherwise active grant', () => {
    const pastDueStripe = makeBilling('past_due', 'sub_paid');
    const result = resolveComplimentarySubscription(2, pastDueStripe, makeGrant({ tier: 'enterprise' }), NOW);
    expect(result).toBe(pastDueStripe);
    expect(result).not.toMatchObject({ accessSource: 'complimentary_grant', isComplimentary: true, tier: 'free' });
  });
});

describe('complimentary schema guard', () => {
  it('shares concurrent initialization for one database and emits only the two create DDL statements', async () => {
    let releaseFirstExecute!: () => void;
    const firstExecute = new Promise<void>((resolve) => { releaseFirstExecute = resolve; });
    const statements: string[] = [];
    const db = {
      execute: vi.fn(async (statement: string) => {
        statements.push(statement);
        if (statements.length === 1) await firstExecute;
      }),
    };

    const first = ensureComplimentaryAccessSchema(db);
    const second = ensureComplimentaryAccessSchema(db);
    expect(second).toBe(first);
    expect(db.execute).toHaveBeenCalledTimes(1);
    releaseFirstExecute();
    await Promise.all([first, second]);

    expect(statements).toHaveLength(2);
    expect(statements.every((statement) => statement.startsWith('CREATE TABLE IF NOT EXISTS'))).toBe(true);
    expect(statements.some((statement) => /\bDROP\b/i.test(statement))).toBe(false);
  });

  it('forgets a failed initialization so the same database can retry', async () => {
    let calls = 0;
    const db = {
      execute: vi.fn(async () => {
        calls += 1;
        if (calls === 1) throw new Error('connection interrupted');
      }),
    };

    await expect(ensureComplimentaryAccessSchema(db)).rejects.toThrow('connection interrupted');
    await expect(ensureComplimentaryAccessSchema(db)).resolves.toBeUndefined();
    expect(db.execute).toHaveBeenCalledTimes(3);
  });

  it('initializes each independent database once with only its two create DDL statements', async () => {
    const statementsA: string[] = [];
    const statementsB: string[] = [];
    const dbA = { execute: vi.fn(async (statement: string) => { statementsA.push(statement); }) };
    const dbB = { execute: vi.fn(async (statement: string) => { statementsB.push(statement); }) };

    await Promise.all([
      ensureComplimentaryAccessSchema(dbA),
      ensureComplimentaryAccessSchema(dbB),
      ensureComplimentaryAccessSchema(dbA),
      ensureComplimentaryAccessSchema(dbB),
    ]);

    expect(statementsA).toHaveLength(2);
    expect(statementsB).toHaveLength(2);
    expect([...statementsA, ...statementsB].every((statement) => statement.includes('CREATE TABLE IF NOT EXISTS'))).toBe(true);
    expect([...statementsA, ...statementsB].some((statement) => /\bDROP\b/i.test(statement))).toBe(false);
  });
});

describe('complimentary access router', () => {
  it('uses owner protection and forwards validated grant input to its service without a database', async () => {
    const grant = vi.fn().mockResolvedValue({ success: true });
    const inspect = vi.fn().mockResolvedValue({ user: { id: 2 } });
    const revoke = vi.fn().mockResolvedValue({ success: true });
    const requireOwner = vi.fn((actor: User | null | undefined) => {
      if (actor?.openId !== 'test-owner') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the verified platform owner can manage complimentary access.' });
      }
    });

    vi.resetModules();
    vi.doMock('./services/complimentaryAccessService', () => ({
      grantComplimentaryAccess: grant,
      inspectComplimentaryAccess: inspect,
      revokeComplimentaryAccess: revoke,
      requireGrantOwner: requireOwner,
    }));

    try {
      const { complimentaryAccessRouter } = await import('./routers/complimentaryAccess');
      const owner = ownerUser();
      const context = (user: User | null) => ({ user, req: {}, res: {} }) as any;
      const ownerCaller = complimentaryAccessRouter.createCaller(context(owner));

      await expect(ownerCaller.capabilities()).resolves.toEqual({ canManage: true });
      await expect(ownerCaller.grant({
        userId: 2,
        tier: 'professional',
        expiresAt: null,
        reason: '  Router approved reason  ',
        expectedRevision: 0,
        billingAcknowledged: true,
      })).resolves.toEqual({ success: true });
      expect(grant).toHaveBeenCalledWith(owner, expect.objectContaining({ reason: 'Router approved reason', tier: 'professional' }));

      const nonOwnerCaller = complimentaryAccessRouter.createCaller(context(makeUser({ id: 3, openId: 'not-owner' })));
      await expect(nonOwnerCaller.grant({
        userId: 2,
        tier: 'starter',
        expiresAt: null,
        reason: 'Attempted owner action',
        expectedRevision: 0,
        billingAcknowledged: true,
      })).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(grant).toHaveBeenCalledTimes(1);
    } finally {
      vi.doUnmock('./services/complimentaryAccessService');
      vi.resetModules();
    }
  });
});
