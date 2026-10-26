import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const constructed = vi.hoisted(() => [] as Array<{ key: string }>);
vi.mock('stripe', () => ({
  default: class SyntheticStripe {
    constructor(key: string) { constructed.push({ key }); }
  },
}));

beforeEach(() => { vi.resetModules(); constructed.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

function apiClients() {
  return constructed.filter(item => item.key !== 'sk_test_webhook_signature_verifier');
}

describe('shared default Stripe client construction', () => {
  it('builds the shared subscription, ticketing, Fan Club and Live client with the dedicated test key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_old_default');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_rotated_default');
    const module = await import('./stripe');
    expect(module.stripe).not.toBeNull();
    expect(apiClients()).toEqual([{ key: 'sk_test_rotated_default' }]);
  });
  it('uses the configured rotated live key for default live requests rather than the retired primary', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_retired_primary');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_rotated_default');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_live_rotated_platform');
    await import('./stripe');
    expect(apiClients()).toEqual([{ key: 'sk_live_rotated_platform' }]);
  });
  it('retains the primary live fallback only when no live replacement is configured', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_legacy_primary');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', '');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_rotated_default');
    await import('./stripe');
    expect(apiClients()).toEqual([{ key: 'sk_live_legacy_primary' }]);
  });
  it('does not construct a live client with a wrong-mode dedicated key or silently revive the old key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_retired_primary');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_test_wrong_mode');
    await expect(import('./stripe')).rejects.toThrow('live-mode');
    expect(apiClients()).toEqual([]);
  });
  it('does not silently fall back or construct an API client with a wrong-mode dedicated test key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_old_default');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_live_wrong_mode');
    await expect(import('./stripe')).rejects.toThrow('test-mode');
    expect(apiClients()).toEqual([]);
  });
});
