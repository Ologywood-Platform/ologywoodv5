import {
  SUBSCRIPTION_PRODUCTS,
  type BillingInterval,
  type SubscriptionProductKey,
} from "../../shared/products";

/**
 * Canonical subscription pricing metadata.
 *
 * Stripe price IDs are account- and mode-specific, so they must not be
 * hard-coded here. Checkout resolves the active price by lookup key through
 * shared/products.ts. This module exposes lookup keys instead of stale IDs
 * from an older Stripe account.
 */
export interface PricingTier {
  name: string;
  productKey: SubscriptionProductKey | null;
  monthly: { lookupKey: string | null; amount: number };
  yearly: {
    lookupKey: string;
    amount: number;
    monthlyEquivalent: number;
    savings: number;
  } | null;
  currency: string;
}

function toPricingTier(
  product: (typeof SUBSCRIPTION_PRODUCTS)[SubscriptionProductKey],
): PricingTier {
  return {
    name: product.name.replace(/ Plan$/, ""),
    productKey: product.key,
    monthly: { lookupKey: product.lookupKey, amount: product.priceMonthly },
    yearly: {
      lookupKey: product.yearlyLookupKey,
      amount: product.priceYearly,
      monthlyEquivalent: Math.round(product.priceYearly / 12),
      savings: product.priceMonthly * 12 - product.priceYearly,
    },
    currency: product.currency,
  };
}

export const STRIPE_PRICING: Record<string, PricingTier> = {
  free: {
    name: "Free",
    productKey: null,
    monthly: { lookupKey: null, amount: 0 },
    yearly: null,
    currency: "usd",
  },
  starter: toPricingTier(SUBSCRIPTION_PRODUCTS.ARTIST_STARTER),
  professional: toPricingTier(SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL),
  enterprise: toPricingTier(SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE),
};

export type StripePricingTier = keyof typeof STRIPE_PRICING;

/** Return the canonical Stripe lookup key for a tier and billing interval. */
export function getStripePriceLookupKey(
  tier: StripePricingTier,
  interval: BillingInterval = "month",
): string | null {
  const pricing = STRIPE_PRICING[tier];
  return interval === "year"
    ? pricing.yearly?.lookupKey ?? null
    : pricing.monthly.lookupKey;
}

export function getStripePricingInfo(tier: StripePricingTier) {
  return STRIPE_PRICING[tier];
}

export function getYearlySavingsPercent(tier: StripePricingTier): number {
  const pricing = STRIPE_PRICING[tier];
  if (!pricing.yearly || pricing.monthly.amount === 0) return 0;
  return Math.round((pricing.yearly.savings / (pricing.monthly.amount * 12)) * 100);
}
