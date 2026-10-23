import { describe, expect, it } from 'vitest';
import Stripe from 'stripe';
import { getStripeApiKeyForWebhookMode, verifyStripeWebhookEvent } from './services/stripeWebhookMode';

const validateConfiguredKey = process.env.VALIDATE_STRIPE_TEST_CONFIGURATION === '1';
const expectedAccountId = 'acct_1SpHkMAjAqXCmw11';

function hasTestSecretFormat(value: string | undefined): boolean {
  return !!value && /^sk_test_[A-Za-z0-9]+$/.test(value) && value.length > 30;
}

async function validateTestKey(key: string) {
  const client = new Stripe(key, { timeout: 10000, maxNetworkRetries: 0 });
  try {
    const [account, balance] = await Promise.all([
      client.accounts.retrieve(),
      client.balance.retrieve(),
    ]);
    return { expectedAccount: account.id === expectedAccountId, testMode: balance.livemode === false };
  } catch (error) {
    const status = typeof (error as { statusCode?: unknown })?.statusCode === 'number'
      ? (error as { statusCode: number }).statusCode : 'unavailable';
    // Never echo Stripe's error message, request headers, key, or account body.
    throw new Error(`Read-only Stripe credential validation failed; HTTP status ${status}.`);
  }
}

describe('Stripe test credential configuration', () => {
  it('keeps explicit test verification separate from live and default credentials', () => {
    const selected = getStripeApiKeyForWebhookMode('test', {
      STRIPE_SECRET_KEY: 'sk_test_synthetic_default',
      STRIPE_TEST_SECRET_KEY: 'sk_test_synthetic_dedicated',
      STRIPE_LIVE_SECRET_KEY: 'sk_live_synthetic_only',
    });
    expect(selected === 'sk_test_synthetic_dedicated').toBe(true);
    expect(hasTestSecretFormat('pk_test_synthetic_only')).toBe(false);
    expect(hasTestSecretFormat('sk_live_synthetic_only')).toBe(false);
    expect(hasTestSecretFormat('whsec_synthetic_only')).toBe(false);
  });

  // This branch is enabled only for an owner-authorized read-only credential check.
  // Ordinary platform test runs make no external requests and read no real keys.
  if (validateConfiguredKey) {
    it('validates the configured dedicated key against the OlogyWood test account', async () => {
      const key = process.env.STRIPE_TEST_SECRET_KEY;
      expect(hasTestSecretFormat(key)).toBe(true);
      const proof = await validateTestKey(key!);
      expect(proof.expectedAccount).toBe(true);
      expect(proof.testMode).toBe(true);
    }, 25000);

    if (process.env.VALIDATE_STRIPE_TEST_WEBHOOK === '1') {
      it('checks the supplied test signing secret and current endpoint metadata without dispatching an event', async () => {
        const key = process.env.STRIPE_TEST_SECRET_KEY;
        const secret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
        expect(hasTestSecretFormat(key)).toBe(true);
        expect(!!secret && /^whsec_[A-Za-z0-9]+$/.test(secret) && secret.length > 25).toBe(true);
        const client = new Stripe(key!, { timeout: 10000, maxNetworkRetries: 0 });
        const payload = JSON.stringify({
          id: 'evt_synthetic_configuration_only', object: 'event',
          type: 'ologywood.webhook_probe', livemode: false, data: { object: {} },
        });
        const signature = client.webhooks.generateTestHeaderString({ payload, secret: secret! });
        const verified = verifyStripeWebhookEvent(payload, signature);
        expect(verified.mode).toBe('test');
        expect(verified.event.livemode).toBe(false);
        const wrongModePayload = payload.replace('"livemode":false', '"livemode":true');
        const wrongModeSignature = client.webhooks.generateTestHeaderString({ payload: wrongModePayload, secret: secret! });
        let mismatchRejected = false;
        try { verifyStripeWebhookEvent(wrongModePayload, wrongModeSignature); } catch { mismatchRejected = true; }
        expect(mismatchRejected).toBe(true);

        let endpoints: Stripe.ApiList<Stripe.WebhookEndpoint>;
        try { endpoints = await client.webhookEndpoints.list({ limit: 100 }); }
        catch { throw new Error('Read-only Stripe test webhook endpoint metadata check failed.'); }
        const expectedUrls = new Set([
          'https://ologywood-mp6flm6c.manus.space/api/stripe/webhook',
          'https://www.ologywood.com/api/stripe/webhook',
        ]);
        expect(endpoints.data.some(endpoint => expectedUrls.has(endpoint.url)
          && endpoint.livemode === false && endpoint.status === 'enabled')).toBe(true);
      }, 25000);
    }

    if (process.env.REQUIRE_STRIPE_TEST_ALIGNMENT === '1') {
      it('confirms the managed default and dedicated test key are aligned and valid', async () => {
        const primary = process.env.STRIPE_SECRET_KEY;
        const dedicated = process.env.STRIPE_TEST_SECRET_KEY;
        expect(hasTestSecretFormat(primary)).toBe(true);
        expect(!!primary && primary === dedicated).toBe(true);
        const publishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
        expect(!!publishable && /^pk_test_[A-Za-z0-9]+$/.test(publishable)
          && publishable.length > 30).toBe(true);
        if (process.env.VALIDATE_STRIPE_TEST_WEBHOOK === '1') {
          const defaultSigningSecret = process.env.STRIPE_WEBHOOK_SECRET;
          expect(!!defaultSigningSecret
            && defaultSigningSecret === process.env.STRIPE_TEST_WEBHOOK_SECRET).toBe(true);
        }
        const proof = await validateTestKey(primary!);
        expect(proof.expectedAccount).toBe(true);
        expect(proof.testMode).toBe(true);
      }, 25000);
    }
  }
});
