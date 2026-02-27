import Stripe from 'stripe';
import { SUBSCRIPTION_PRODUCTS, PLAN_SLUG_MAP, type SubscriptionProductKey } from '../shared/products';

// Initialize Stripe only if API key is provided
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('[Stripe] WARNING: STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export { stripe };

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  email: string;
  name?: string;
  userId: string;
}): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]!.id;
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { userId: params.userId },
  });

  return customer.id;
}

/**
 * Resolve a Stripe Price ID for a given product, creating the product + price if needed.
 */
async function resolvePrice(product: (typeof SUBSCRIPTION_PRODUCTS)[SubscriptionProductKey]): Promise<string> {
  if (!stripe) throw new Error('Stripe is not configured.');

  // Try to find existing price by lookup key
  const prices = await stripe.prices.list({
    lookup_keys: [product.lookupKey],
    limit: 1,
  });

  if (prices.data.length > 0) {
    return prices.data[0]!.id;
  }

  // Create product + price
  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.description,
  });

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.priceMonthly,
    currency: product.currency,
    recurring: { interval: product.interval },
    lookup_key: product.lookupKey,
  });

  return stripePrice.id;
}

/**
 * Create a Stripe Checkout Session for an artist subscription.
 *
 * @param params.plan – optional plan slug ("starter" | "professional"). Defaults to "professional".
 */
export async function createSubscriptionCheckoutSession(params: {
  customerId: string;
  userEmail: string;
  userName?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  plan?: string;
}): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }

  // Resolve the product from the plan slug
  const planSlug = params.plan || 'professional';
  const productKey = PLAN_SLUG_MAP[planSlug] || 'ARTIST_PROFESSIONAL';
  const product = SUBSCRIPTION_PRODUCTS[productKey];

  const priceId = await resolvePrice(product);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    client_reference_id: params.userId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        userId: params.userId,
        plan: productKey,
      },
    },
    metadata: {
      userId: params.userId,
      userEmail: params.userEmail,
      customer_name: params.userName || '',
      plan: productKey,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  };

  // Only add trial if the product specifies trial days
  if (product.trialDays > 0) {
    sessionParams.subscription_data!.trial_period_days = product.trialDays;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

/**
 * Get subscription status from Stripe
 */
export async function getSubscriptionStatus(subscriptionId: string) {
  if (!stripe) {
    console.error('Stripe is not configured.');
    return null;
  }
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = subscription as any;
    const priceItem = subData.items?.data?.[0]?.price;
    return {
      status: subscription.status,
      currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : new Date(),
      cancelAtPeriodEnd: subData.cancel_at_period_end || false,
      trialEnd: subData.trial_end ? new Date(subData.trial_end * 1000) : null,
      priceAmount: priceItem?.unit_amount as number | undefined,
      lookupKey: priceItem?.lookup_key as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
