import Stripe from 'stripe';

export type StripeWebhookMode = 'live' | 'test';

type StripeWebhookEnvironment = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_LIVE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_LIVE_WEBHOOK_SECRET?: string;
  STRIPE_TEST_SECRET_KEY?: string;
  STRIPE_TEST_WEBHOOK_SECRET?: string;
};

export type VerifiedStripeWebhook = {
  event: Stripe.Event;
  mode: StripeWebhookMode;
};

const webhookVerifier = new Stripe('sk_test_webhook_signature_verifier', {
  apiVersion: '2025-12-15.clover',
});

function getApiKeyMode(key?: string): StripeWebhookMode | null {
  if (key?.startsWith('sk_live_')) return 'live';
  if (key?.startsWith('sk_test_')) return 'test';
  return null;
}

function getWebhookSecretCandidates(env: StripeWebhookEnvironment) {
  const candidates: Array<{ mode: StripeWebhookMode; secret: string }> = [];
  const primaryMode = getApiKeyMode(env.STRIPE_SECRET_KEY);
  const explicitPrimarySecret = primaryMode === 'live'
    ? env.STRIPE_LIVE_WEBHOOK_SECRET
    : primaryMode === 'test' ? env.STRIPE_TEST_WEBHOOK_SECRET : undefined;

  if (env.STRIPE_LIVE_WEBHOOK_SECRET) {
    candidates.push({ mode: 'live', secret: env.STRIPE_LIVE_WEBHOOK_SECRET });
  }
  // A configured mode-specific secret supersedes the legacy generic secret.
  // Never keep a rotated generic secret accepted for that same mode.
  if (env.STRIPE_WEBHOOK_SECRET && primaryMode && !explicitPrimarySecret) {
    candidates.push({ mode: primaryMode, secret: env.STRIPE_WEBHOOK_SECRET });
  }
  if (env.STRIPE_TEST_WEBHOOK_SECRET) {
    candidates.push({ mode: 'test', secret: env.STRIPE_TEST_WEBHOOK_SECRET });
  }

  if (candidates.some(candidate => candidates.some(other =>
    candidate.secret === other.secret && candidate.mode !== other.mode))) {
    throw new Error('Stripe webhook signing secrets must be distinct across modes');
  }

  return candidates.filter((candidate, index, all) =>
    all.findIndex((item) => item.secret === candidate.secret) === index,
  );
}

export function verifyStripeWebhookEvent(
  payload: Buffer | string,
  signature: string | string[],
  env: StripeWebhookEnvironment = process.env as StripeWebhookEnvironment,
): VerifiedStripeWebhook {
  const candidates = getWebhookSecretCandidates(env);
  if (candidates.length === 0) {
    throw new Error('Stripe webhook signing secrets are not configured');
  }

  let lastVerificationError: unknown;
  for (const candidate of candidates) {
    try {
      const event = webhookVerifier.webhooks.constructEvent(
        payload,
        signature,
        candidate.secret,
      );
      const eventMode: StripeWebhookMode = event.livemode ? 'live' : 'test';
      if (eventMode !== candidate.mode) {
        throw new Error(`Stripe webhook mode mismatch: ${eventMode} event matched ${candidate.mode} credentials`);
      }
      return { event, mode: candidate.mode };
    } catch (error) {
      lastVerificationError = error;
    }
  }

  throw lastVerificationError instanceof Error
    ? lastVerificationError
    : new Error('Stripe webhook signature verification failed');
}

export function getStripeApiKeyForWebhookMode(
  mode: StripeWebhookMode,
  env: StripeWebhookEnvironment = process.env as StripeWebhookEnvironment,
) {
  const primaryMode = getApiKeyMode(env.STRIPE_SECRET_KEY);
  if (mode === 'test') {
    const testKey = env.STRIPE_TEST_SECRET_KEY
      || (primaryMode === 'test' ? env.STRIPE_SECRET_KEY : undefined);
    if (!testKey?.startsWith('sk_test_')) {
      throw new Error('Stripe test-mode API key is not configured');
    }
    return testKey;
  }

  const explicitLiveKey = env.STRIPE_LIVE_SECRET_KEY?.startsWith('sk_live_')
    ? env.STRIPE_LIVE_SECRET_KEY
    : undefined;
  const liveKey = explicitLiveKey
    || (primaryMode === 'live' ? env.STRIPE_SECRET_KEY : undefined);
  if (!liveKey?.startsWith('sk_live_')) {
    throw new Error('Stripe live-mode API key is not configured');
  }
  return liveKey;
}

/** Preserve the existing primary mode and prefer its configured rotated key. */
export function getDefaultStripeApiKey(
  env: StripeWebhookEnvironment = process.env as StripeWebhookEnvironment,
): string {
  const primaryMode = getApiKeyMode(env.STRIPE_SECRET_KEY);
  if (primaryMode === 'test') return getStripeApiKeyForWebhookMode('test', env);
  if (primaryMode === 'live') {
    // A malformed configured replacement must not silently revive a retired key.
    if (env.STRIPE_LIVE_SECRET_KEY && !env.STRIPE_LIVE_SECRET_KEY.startsWith('sk_live_')) {
      throw new Error('Stripe live-mode API key is not configured');
    }
    return getStripeApiKeyForWebhookMode('live', env);
  }
  throw new Error('Stripe default API mode is not configured');
}

export function getStripeClientForWebhookMode(mode: StripeWebhookMode) {
  return new Stripe(getStripeApiKeyForWebhookMode(mode), {
    apiVersion: '2025-12-15.clover',
  });
}
