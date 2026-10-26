import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';

const state = vi.hoisted(() => ({
  keys: [] as string[],
  rows: [] as Array<{ stripeAccountId: string }>,
  predicates: [] as unknown[],
  getDb: vi.fn(),
  login: vi.fn(),
  loggedError: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}));
vi.mock('stripe', () => ({ default: class SyntheticStripe {
  accounts = { createLoginLink: state.login };
  constructor(key: string) { state.keys.push(key); }
} }));
vi.mock('./db', () => ({ getDb: state.getDb }));
vi.mock('./_core/logger', () => ({ logger: {
  trpcCall: vi.fn(), trpcError: state.loggedError,
} }));

const safeMessage = 'Stripe payouts are temporarily unavailable. Please try again later or contact OlogyWood support.';
const safeNoAccount = 'No Stripe Connect account found. Please connect your account first.';

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); state.keys.length = 0; state.predicates.length = 0;
  state.rows = [{ stripeAccountId: 'acct_synthetic_owner' }];
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_synthetic_retired');
  vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_live_synthetic_rotated');
  vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_synthetic_other');
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn((predicate) => { state.predicates.push(predicate); return chain; }),
    limit: vi.fn(async () => state.rows),
  };
  state.select.mockReturnValue(chain);
  state.getDb.mockResolvedValue({ select: state.select, update: state.update });
  state.login.mockResolvedValue({ url: 'https://connect.stripe.com/express/synthetic-owner' });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); });

async function caller(userId: number | null = 7) {
  const { stripeConnectRouter } = await import('./routers/stripeConnect');
  return stripeConnectRouter.createCaller({
    user: userId === null ? null : { id: userId, role: 'artist' }, req: {}, res: {},
  } as any);
}

function loggedText() {
  return state.loggedError.mock.calls.map(args => args.map(value =>
    value instanceof Error ? `${value.message}\n${value.stack}\n${String(value.cause)}` : String(value),
  ).join(' ')).join('\n');
}

describe('protected Stripe payouts dashboard link', () => {
  it('constructs the real Connect router with the rotated live key and returns only the user-scoped login URL', async () => {
    const api = await caller(7);
    expect(await api.getDashboardLink()).toEqual({ url: 'https://connect.stripe.com/express/synthetic-owner' });
    expect(state.keys.filter(key => key !== 'sk_test_webhook_signature_verifier')).toEqual(['sk_live_synthetic_rotated']);
    expect(state.login).toHaveBeenCalledTimes(1);
    expect(state.login).toHaveBeenCalledWith('acct_synthetic_owner');
    expect(new MySqlDialect().sqlToQuery(state.predicates[0] as any).params).toEqual([7]);
    expect(state.update).not.toHaveBeenCalled();
  });
  it('uses the dedicated test key in existing test mode even when a live replacement is present', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_synthetic_retired');
    await (await caller()).getDashboardLink();
    expect(state.keys.filter(key => key !== 'sk_test_webhook_signature_verifier')).toEqual(['sk_test_synthetic_other']);
  });
  it('rejects anonymous access before reading accounts or generating a link', async () => {
    await expect((await caller(null)).getDashboardLink()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(state.getDb).not.toHaveBeenCalled(); expect(state.login).not.toHaveBeenCalled();
  });
  it('does not create or connect an account when the current user has no linked account', async () => {
    state.rows = [];
    await expect((await caller()).getDashboardLink()).rejects.toMatchObject({ code: 'NOT_FOUND', message: safeNoAccount });
    expect(state.login).not.toHaveBeenCalled(); expect(state.update).not.toHaveBeenCalled();
  });
  it('binds lookup to a different caller rather than accepting another user account ID', async () => {
    state.rows = [{ stripeAccountId: 'acct_synthetic_second_owner' }];
    await (await caller(19)).getDashboardLink();
    expect(new MySqlDialect().sqlToQuery(state.predicates[0] as any).params).toEqual([19]);
    expect(state.login).toHaveBeenCalledTimes(1);
    expect(state.login).toHaveBeenCalledWith('acct_synthetic_second_owner');
  });
  it.each(['api_key_expired', 'api_key_invalid', 'api_connection_error'])('sanitizes provider failure %s without retrying another key or exposing fragments in tRPC logs', async (code) => {
    const marker = 'sk_live_SYNTHETIC_SECRET_FRAGMENT';
    const failure = Object.assign(new Error(`Expired API Key provided: ${marker}`), { code,
      headers: { authorization: `Bearer ${marker}` } });
    state.login.mockRejectedValue(failure);
    const error = await (await caller()).getDashboardLink().catch(value => value);
    expect(error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: safeMessage });
    expect(error.cause).toBeUndefined();
    expect(state.login).toHaveBeenCalledTimes(1);
    expect(loggedText()).not.toContain(marker);
    expect(loggedText()).not.toContain('Expired API Key');
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('[Stripe Connect] Could not prepare the payouts dashboard link');
    expect(state.update).not.toHaveBeenCalled();
  });
  it('sanitizes database outages instead of exposing a database connection string', async () => {
    state.getDb.mockRejectedValue(new Error('mysql://SYNTHETIC_PRIVATE_DATABASE_STRING'));
    await expect((await caller()).getDashboardLink()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: safeMessage });
    expect(loggedText()).not.toContain('SYNTHETIC_PRIVATE_DATABASE_STRING');
    expect(state.login).not.toHaveBeenCalled();
  });
});
