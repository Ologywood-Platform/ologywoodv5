import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const constructed = vi.hoisted(() => [] as Array<{ key: string }>);
vi.mock('stripe', () => ({
  default: class SyntheticStripe {
    constructor(key: string) { constructed.push({ key }); }
  },
}));

beforeEach(() => { vi.resetModules(); constructed.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('shared default Stripe client construction', () => {
  it('builds the shared subscription, ticketing, Fan Club and Live client with the dedicated test key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_old_default');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_rotated_default');
    const module = await import('./stripe');
    expect(module.stripe).not.toBeNull();
    const requests = constructed.filter(item => item.key !== 'sk_test_webhook_signature_verifier');
    expect(requests).toEqual([{ key: 'sk_test_rotated_default' }]);
  });
  it('keeps the exact primary live key when test and separate live-webhook API credentials exist', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_original_primary');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_rotated_default');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_live_separate_webhook_override');
    await import('./stripe');
    const requests = constructed.filter(item => item.key !== 'sk_test_webhook_signature_verifier');
    expect(requests).toEqual([{ key: 'sk_live_original_primary' }]);
  });
  it('does not silently fall back or construct an API client with a wrong-mode dedicated key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_old_default');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_live_wrong_mode');
    await expect(import('./stripe')).rejects.toThrow('test-mode');
    expect(constructed.filter(item => item.key !== 'sk_test_webhook_signature_verifier')).toEqual([]);
  });
});
