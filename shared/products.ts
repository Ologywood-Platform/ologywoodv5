/**
 * Stripe product and price configuration for Ologywood subscriptions.
 *
 * STARTER  – $9/month | $90/year (2 months free)
 * PROFESSIONAL – $29/month | $290/year (2 months free)
 *
 * Free tier has no Stripe product; it is the default when no subscription exists.
 */

export type BillingInterval = 'month' | 'year';

export interface SubscriptionProduct {
  key: string;
  lookupKey: string;
  yearlyLookupKey: string;
  name: string;
  description: string;
  priceMonthly: number; // cents
  priceYearly: number; // cents (annual total)
  currency: 'usd';
  interval: 'month';
  trialDays: number;
  features: string[];
}

export const SUBSCRIPTION_PRODUCTS = {
  ARTIST_STARTER: {
    key: 'ARTIST_STARTER',
    lookupKey: 'artist_starter_monthly',
    yearlyLookupKey: 'artist_starter_yearly',
    name: 'Starter Plan',
    description: 'Unlimited bookings, Rider Builder, fan email updates, and more.',
    priceMonthly: 900, // $9.00 in cents
    priceYearly: 9000, // $90.00 in cents (10 months — 2 months free)
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
    yearlyLookupKey: 'artist_professional_yearly',
    name: 'Professional Plan',
    description: 'Contracts, e-signatures, analytics, priority support, and everything in Starter.',
    priceMonthly: 2900, // $29.00 in cents
    priceYearly: 29000, // $290.00 in cents (10 months — 2 months free)
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

/** Get the yearly savings percentage for a product */
export function getYearlySavingsPercent(product: typeof SUBSCRIPTION_PRODUCTS[SubscriptionProductKey]): number {
  const monthlyAnnual = product.priceMonthly * 12;
  return Math.round(((monthlyAnnual - product.priceYearly) / monthlyAnnual) * 100);
}

/** Get the effective monthly price when billed yearly */
export function getYearlyMonthlyEquivalent(product: typeof SUBSCRIPTION_PRODUCTS[SubscriptionProductKey]): number {
  return Math.round(product.priceYearly / 12);
}
