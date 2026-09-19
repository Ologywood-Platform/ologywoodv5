import { afterEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import {
  createMerchCheckoutSessionFromPaymentIntent,
  handleStripeWebhook,
} from './webhooks/stripe';
import {
  getStripeApiKeyForWebhookMode,
  verifyStripeWebhookEvent,
} from './services/stripeWebhookMode';

const liveSecret = 'whsec_live_unit_secret';
const testSecret = 'whsec_test_unit_secret';
const env = {
  STRIPE_SECRET_KEY: 'sk_live_unit_key',
  STRIPE_WEBHOOK_SECRET: liveSecret,
  STRIPE_TEST_SECRET_KEY: 'sk_test_unit_key',
  STRIPE_TEST_WEBHOOK_SECRET: testSecret,
};
const signer = new Stripe('sk_test_unit_key', { apiVersion: '2025-12-15.clover' });

function makeEvent(livemode: boolean, id: string) {
  return JSON.stringify({
    id,
    object: 'event',
    api_version: '2025-12-15.clover',
    created: 1_788_444_000,
    data: { object: { id: 'obj_unit' } },
    livemode,
    pending_webhooks: 1,
    request: null,
    type: 'ologywood.webhook_probe',
  });
}

function sign(payload: string, secret: string) {
  return signer.webhooks.generateTestHeaderString({ payload, secret });
}

function createResponse() {
  const state: { status: number; body?: unknown } = { status: 200 };
  const response = {
    status(code: number) {
      state.status = code;
      return response;
    },
    send(body: unknown) {
      state.body = body;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  };
  return { response, state };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Stripe same-URL dual-mode webhook verification', () => {
  it('verifies live events only with the live signing secret', () => {
    const payload = makeEvent(true, 'evt_live_unit');
    const verified = verifyStripeWebhookEvent(payload, sign(payload, liveSecret), env);
    expect(verified.mode).toBe('live');
    expect(verified.event.id).toBe('evt_live_unit');
  });

  it('verifies test events only with the test signing secret', () => {
    const payload = makeEvent(false, 'evt_test_unit');
    const verified = verifyStripeWebhookEvent(payload, sign(payload, testSecret), env);
    expect(verified.mode).toBe('test');
    expect(verified.event.id).toBe('evt_test_unit');
  });

  it('rejects an invalid signature', () => {
    const payload = makeEvent(false, 'evt_invalid_unit');
    expect(() => verifyStripeWebhookEvent(payload, sign(payload, 'whsec_wrong'), env))
      .toThrow(/signature|signatures/i);
  });

  it('rejects a test-signed payload that claims to be live', () => {
    const payload = makeEvent(true, 'evt_mode_mismatch_unit');
    expect(() => verifyStripeWebhookEvent(payload, sign(payload, testSecret), env))
      .toThrow(/mode mismatch/i);
  });

  it('selects the API key that matches the verified event mode', () => {
    expect(getStripeApiKeyForWebhookMode('live', env)).toBe(env.STRIPE_SECRET_KEY);
    expect(getStripeApiKeyForWebhookMode('test', env)).toBe(env.STRIPE_TEST_SECRET_KEY);
  });

  it('uses explicit live credentials when the primary project configuration remains in test mode', () => {
    const mixedModeEnv = {
      STRIPE_SECRET_KEY: 'sk_test_primary_key',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_primary_secret',
      STRIPE_TEST_SECRET_KEY: 'sk_test_primary_key',
      STRIPE_TEST_WEBHOOK_SECRET: 'whsec_test_primary_secret',
      STRIPE_LIVE_SECRET_KEY: 'sk_live_explicit_key',
      STRIPE_LIVE_WEBHOOK_SECRET: liveSecret,
    };
    const payload = makeEvent(true, 'evt_live_mixed_mode_unit');
    const verified = verifyStripeWebhookEvent(payload, sign(payload, liveSecret), mixedModeEnv);

    expect(verified.mode).toBe('live');
    expect(verified.event.id).toBe('evt_live_mixed_mode_unit');
    expect(getStripeApiKeyForWebhookMode('live', mixedModeEnv)).toBe('sk_live_explicit_key');
  });

  it('does not misclassify a generic test signing secret as live', () => {
    const testPrimaryEnv = {
      STRIPE_SECRET_KEY: 'sk_test_primary_key',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_primary_secret',
      STRIPE_TEST_SECRET_KEY: 'sk_test_primary_key',
      STRIPE_TEST_WEBHOOK_SECRET: 'whsec_test_primary_secret',
    };
    const payload = makeEvent(true, 'evt_live_without_explicit_secret_unit');

    expect(() => verifyStripeWebhookEvent(
      payload,
      sign(payload, testPrimaryEnv.STRIPE_WEBHOOK_SECRET),
      testPrimaryEnv,
    )).toThrow(/mode mismatch/i);
    expect(() => getStripeApiKeyForWebhookMode('live', testPrimaryEnv))
      .toThrow(/live-mode API key is not configured/i);
  });

  it('ignores an invalid live-key record ID and keeps a valid primary live API key', () => {
    expect(getStripeApiKeyForWebhookMode('live', {
      ...env,
      STRIPE_LIVE_SECRET_KEY: 'mk_unit_key_record_id',
    })).toBe(env.STRIPE_SECRET_KEY);
  });

  it('maps a successful merchandise PaymentIntent into the idempotent order fulfillment path', () => {
    const session = createMerchCheckoutSessionFromPaymentIntent({
      id: 'pi_live_merch_unit',
      amount: 499,
      amount_received: 499,
      metadata: {
        type: 'merch_purchase',
        orderId: '53',
        orderNumber: 'OWM-UNIT-53',
      },
    } as Stripe.PaymentIntent);

    expect(session).toMatchObject({
      id: 'payment_intent:pi_live_merch_unit',
      payment_intent: 'pi_live_merch_unit',
      amount_total: 499,
      metadata: {
        type: 'merch_purchase',
        orderId: '53',
        orderNumber: 'OWM-UNIT-53',
      },
    });
    expect(createMerchCheckoutSessionFromPaymentIntent({
      id: 'pi_booking_unit',
      amount: 499,
      amount_received: 499,
      metadata: { bookingId: '12' },
    } as Stripe.PaymentIntent)).toBeNull();
  });

  it('returns HTTP 200 for a valid unsupported test event, including a retry', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY);
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', env.STRIPE_WEBHOOK_SECRET);
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', env.STRIPE_TEST_SECRET_KEY);
    vi.stubEnv('STRIPE_TEST_WEBHOOK_SECRET', env.STRIPE_TEST_WEBHOOK_SECRET);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const payload = makeEvent(false, 'evt_retry_unit');
    const request = {
      body: Buffer.from(payload),
      headers: { 'stripe-signature': sign(payload, testSecret) },
    } as any;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { response, state } = createResponse();
      await handleStripeWebhook(request, response as any);
      expect(state).toEqual({ status: 200, body: { received: true } });
    }
  });

  it('returns HTTP 200 for a valid live event while the primary project key remains test mode', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_primary_key');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_primary_secret');
    vi.stubEnv('STRIPE_TEST_SECRET_KEY', 'sk_test_primary_key');
    vi.stubEnv('STRIPE_TEST_WEBHOOK_SECRET', 'whsec_test_primary_secret');
    vi.stubEnv('STRIPE_LIVE_SECRET_KEY', 'sk_live_explicit_key');
    vi.stubEnv('STRIPE_LIVE_WEBHOOK_SECRET', liveSecret);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const payload = makeEvent(true, 'evt_live_handler_mixed_mode_unit');
    const request = {
      body: Buffer.from(payload),
      headers: { 'stripe-signature': sign(payload, liveSecret) },
    } as any;
    const { response, state } = createResponse();

    await handleStripeWebhook(request, response as any);

    expect(state).toEqual({ status: 200, body: { received: true } });
  });

  it('returns HTTP 400 when the Stripe signature is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { response, state } = createResponse();
    await handleStripeWebhook({ body: Buffer.from('{}'), headers: {} } as any, response as any);
    expect(state.status).toBe(400);
    expect(state.body).toBe('No signature');
  });

  it('keeps raw-body parsing before JSON middleware and ticket fulfillment atomic', () => {
    const fs = require('fs');
    const indexSource = fs.readFileSync(new URL('./_core/index.ts', import.meta.url), 'utf8');
    const webhookSource = fs.readFileSync(new URL('./webhooks/stripe.ts', import.meta.url), 'utf8');
    expect(indexSource.indexOf("app.post('/api/stripe/webhook'"))
      .toBeLessThan(indexSource.indexOf('app.use(express.json'));
    expect(webhookSource).toContain("eq(ticketOrders.status, 'pending')");
    expect(webhookSource).toContain('await database.transaction');
    expect(webhookSource).toContain('already processed, skipping');
    expect(webhookSource).toContain('createMerchCheckoutSessionFromPaymentIntent(paymentIntent)');
    expect(webhookSource).toContain('await handleMerchPurchaseCompleted(merchCheckoutSession)');
  });
});
