import Stripe from 'stripe';
import { SUBSCRIPTION_PRODUCTS } from '../shared/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export { stripe };

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  email: string;
  name?: string;
  userId: string;
}): Promise<string> {
  // Check if customer already exists by email
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]!.id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId,
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout Session for artist subscription
 */
export async function createSubscriptionCheckoutSession(params: {
  customerId: string;
  userEmail: string;
  userName?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const product = SUBSCRIPTION_PRODUCTS.ARTIST_BASIC;

  // Create or get the price
  const prices = await stripe.prices.list({
    lookup_keys: ['artist_basic_monthly'],
    limit: 1,
  });

  let priceId: string;
  
  if (prices.data.length > 0) {
    priceId = prices.data[0]!.id;
  } else {
    // Create the product and price if they don't exist
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: product.priceMonthly,
      currency: product.currency,
      recurring: {
        interval: product.interval,
      },
      lookup_key: 'artist_basic_monthly',
    });

    priceId = stripePrice.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    client_reference_id: params.userId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: product.trialDays,
      metadata: {
        userId: params.userId,
        plan: 'artist_basic',
      },
    },
    metadata: {
      userId: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName || '',
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url!;
}

/**
 * Get subscription status from Stripe
 */
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = subscription as any;
    return {
      status: subscription.status,
      currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000) : new Date(),
      cancelAtPeriodEnd: subData.cancel_at_period_end || false,
      trialEnd: subData.trial_end ? new Date(subData.trial_end * 1000) : null,
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
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
