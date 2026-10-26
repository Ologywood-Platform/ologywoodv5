import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import Stripe from 'stripe';
import { getDefaultStripeApiKey, getStripeApiKeyForWebhookMode, verifyStripeWebhookEvent } from './services/stripeWebhookMode';

const signer = new Stripe('sk_test_synthetic_signer');
function payload(live: boolean) {
  return JSON.stringify({ id: 'evt_synthetic_selection', object: 'event', livemode: live,
    type: 'ologywood.webhook_probe', data: { object: {} } });
}
function signature(body: string, secret: string) {
  return signer.webhooks.generateTestHeaderString({ payload: body, secret });
}
const env = {
  STRIPE_SECRET_KEY: 'sk_test_old_primary', STRIPE_TEST_SECRET_KEY: 'sk_test_rotated',
  STRIPE_WEBHOOK_SECRET: 'whsec_old_primary', STRIPE_TEST_WEBHOOK_SECRET: 'whsec_rotated_test',
  STRIPE_LIVE_SECRET_KEY: 'sk_live_existing_override', STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_existing_live',
};

describe('default Stripe credential rotation without mode/settings changes', () => {
  it('uses the dedicated rotated API key while the primary configuration remains test', () => {
    expect(getDefaultStripeApiKey(env)).toBe(env.STRIPE_TEST_SECRET_KEY);
    expect(getDefaultStripeApiKey(env)).toBe(getStripeApiKeyForWebhookMode('test', env));
  });
  it('uses the configured rotated live key without switching the default to test', () => {
    const live = { ...env, STRIPE_SECRET_KEY: 'sk_live_primary_existing_account' };
    expect(getDefaultStripeApiKey(live)).toBe(env.STRIPE_LIVE_SECRET_KEY);
    expect(getDefaultStripeApiKey(live)).not.toBe(env.STRIPE_TEST_SECRET_KEY);
    expect(getStripeApiKeyForWebhookMode('live', live)).toBe(env.STRIPE_LIVE_SECRET_KEY);
  });
  it('retains the primary live key only when no dedicated live replacement is configured', () => {
    expect(getDefaultStripeApiKey({ STRIPE_SECRET_KEY: 'sk_live_legacy',
      STRIPE_TEST_SECRET_KEY: 'sk_test_other' })).toBe('sk_live_legacy');
  });
  it.each(['sk_test_wrong', 'mk_key_record_id', ' invalid_live_key'])('fails closed for malformed live replacement %s', (replacement) => {
    expect(() => getDefaultStripeApiKey({ ...env, STRIPE_SECRET_KEY: 'sk_live_primary',
      STRIPE_LIVE_SECRET_KEY: replacement })).toThrow('live-mode API key');
  });
  it('does not infer live default mode from a dedicated key alone', () => {
    expect(() => getDefaultStripeApiKey({ STRIPE_LIVE_SECRET_KEY: 'sk_live_rotated' })).toThrow('default API mode');
  });
  it('retains the legacy test API fallback when no dedicated key is configured', () => {
    expect(getDefaultStripeApiKey({ STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY })).toBe(env.STRIPE_SECRET_KEY);
  });
  it('fails closed rather than switch to live if a dedicated test key has the wrong mode', () => {
    expect(() => getDefaultStripeApiKey({ ...env, STRIPE_TEST_SECRET_KEY: 'sk_live_wrong' })).toThrow('test-mode');
  });
  it('does not infer a default mode from a dedicated key alone or unknown primary format', () => {
    expect(() => getDefaultStripeApiKey({ STRIPE_TEST_SECRET_KEY: env.STRIPE_TEST_SECRET_KEY })).toThrow('default API mode');
    expect(() => getDefaultStripeApiKey({ ...env, STRIPE_SECRET_KEY: 'unknown' })).toThrow('default API mode');
  });
  it('does not mutate protected settings or input environments', () => {
    const frozen = Object.freeze({ ...env });
    expect(getDefaultStripeApiKey(frozen)).toBe(env.STRIPE_TEST_SECRET_KEY);
    expect(frozen.STRIPE_SECRET_KEY).toBe(env.STRIPE_SECRET_KEY);
  });
  it('uses the rotated test signing secret and rejects the superseded generic test secret', () => {
    const body = payload(false);
    expect(verifyStripeWebhookEvent(body, signature(body, env.STRIPE_TEST_WEBHOOK_SECRET), env).mode).toBe('test');
    expect(() => verifyStripeWebhookEvent(body, signature(body, env.STRIPE_WEBHOOK_SECRET), env)).toThrow();
  });
  it('preserves the existing explicit live signing secret and verified live API selection', () => {
    const body = payload(true);
    expect(verifyStripeWebhookEvent(body, signature(body, env.STRIPE_LIVE_WEBHOOK_SECRET), env).mode).toBe('live');
    expect(getStripeApiKeyForWebhookMode('live', env)).toBe(env.STRIPE_LIVE_SECRET_KEY);
  });
  it('retains generic live signing only when an explicit live secret is absent', () => {
    const legacy = { STRIPE_SECRET_KEY: 'sk_live_legacy', STRIPE_WEBHOOK_SECRET: 'whsec_live_legacy',
      STRIPE_TEST_WEBHOOK_SECRET: env.STRIPE_TEST_WEBHOOK_SECRET };
    const body = payload(true);
    expect(verifyStripeWebhookEvent(body, signature(body, legacy.STRIPE_WEBHOOK_SECRET), legacy).mode).toBe('live');
  });
  it('rejects cross-mode claims signed with the new test secret', () => {
    const body = payload(true);
    expect(() => verifyStripeWebhookEvent(body, signature(body, env.STRIPE_TEST_WEBHOOK_SECRET), env)).toThrow();
  });
  it('rejects ambiguous same-secret configuration across test and live modes', () => {
    const body = payload(false);
    const ambiguous = { ...env, STRIPE_LIVE_WEBHOOK_SECRET: env.STRIPE_TEST_WEBHOOK_SECRET };
    expect(() => verifyStripeWebhookEvent(body, signature(body, env.STRIPE_TEST_WEBHOOK_SECRET), ambiguous)).toThrow('distinct across modes');
  });
  it('updates all default constructors without rewriting Connect routing, fees, or Stripe options', () => {
    const names = ['stripe.ts','services/bookingCancellation.ts','routes/bookingCheckout.ts',
      'routes/releaseCheckout.ts','routers/merchOrders.ts','routers/tip.ts','routers/stripeConnect.ts',
      'routers/promote.ts','routers/release.ts','routers/admin.ts'];
    for (const name of names) {
      const source = readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
      expect(source).toContain('new Stripe(getDefaultStripeApiKey()');
      expect(source).not.toContain('new Stripe(process.env.STRIPE_SECRET_KEY');
    }
    const releaseCheckout = readFileSync(new URL('./routes/releaseCheckout.ts', import.meta.url),'utf8');
    expect(releaseCheckout).toContain('const PLATFORM_FEE_PERCENT = 1');
    expect(releaseCheckout).toContain('application_fee_amount');
    expect(releaseCheckout).toContain('transfer_data');
  });
});
