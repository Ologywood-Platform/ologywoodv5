/**
 * Stripe product and price configuration for Ologywood subscriptions.
 *
 * STARTER  – $9/month  (lookup key: artist_starter_monthly)
 * PROFESSIONAL – $29/month (lookup key: artist_professional_monthly)
 *
 * Free tier has no Stripe product; it is the default when no subscription exists.
 */

export const SUBSCRIPTION_PRODUCTS = {
  ARTIST_STARTER: {
    key: 'ARTIST_STARTER',
    lookupKey: 'artist_starter_monthly',
    name: 'Starter Plan',
    description: 'Unlimited bookings, Rider Builder, fan email updates, and more.',
    priceMonthly: 900, // $9.00 in cents
    currency: 'usd' as const,
    interval: 'month' as const,
    trialDays: 0,
    features: [
      'Unlimited booking requests',
      'Rider Builder & saved templates',
      'Fan email list & Send Update',
      'In-platform messaging',
      'Availability calendar',
    ],
  },
  ARTIST_PROFESSIONAL: {
    key: 'ARTIST_PROFESSIONAL',
    lookupKey: 'artist_professional_monthly',
    name: 'Professional Plan',
    description: 'Contracts, e-signatures, analytics, priority support, and everything in Starter.',
    priceMonthly: 2900, // $29.00 in cents
    currency: 'usd' as const,
    interval: 'month' as const,
    trialDays: 14,
    features: [
      'Everything in Starter',
      'Contract management & e-signatures',
      'Advanced analytics dashboard',
      'Payment history & earnings tracking',
      'Priority support',
      'Featured profile listing',
    ],
  },
} as const;

/** Legacy alias – existing code that references ARTIST_BASIC now maps to Professional */
(SUBSCRIPTION_PRODUCTS as any).ARTIST_BASIC = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL;

export type SubscriptionProductKey = keyof typeof SUBSCRIPTION_PRODUCTS;

/** Map from URL-friendly plan slug to product key */
export const PLAN_SLUG_MAP: Record<string, SubscriptionProductKey> = {
  starter: 'ARTIST_STARTER',
  professional: 'ARTIST_PROFESSIONAL',
};
