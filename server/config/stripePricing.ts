/**
 * Stripe Pricing Configuration
 * Maps pricing tiers to Stripe product and price IDs
 * 
 * Yearly plans offer "2 months free" (pay for 10 months, get 12)
 * - Starter: $9/mo → $90/yr (save $18)
 * - Professional: $29/mo → $290/yr (save $58)
 */

export type BillingInterval = 'month' | 'year';

export interface PricingTier {
  name: string;
  productId: string;
  monthly: {
    priceId: string;
    amount: number; // in cents
  };
  yearly: {
    priceId: string;
    amount: number; // in cents (annual total)
    monthlyEquivalent: number; // in cents (for display: amount / 12)
    savings: number; // in cents (monthly * 12 - yearly)
  } | null;
  currency: string;
}

export const STRIPE_PRICING: Record<string, PricingTier> = {
  free: {
    name: "Free",
    productId: "prod_Tyo8p400WELYbS",
    monthly: {
      priceId: "price_1T0qVrAjAqXCmw11H7YF3dtr",
      amount: 0,
    },
    yearly: null,
    currency: "usd",
  },
  starter: {
    name: "Starter",
    productId: "prod_Tyo9bhELY4pjtg",
    monthly: {
      priceId: "price_1T0qWrAjAqXCmw11aVyutKra",
      amount: 900, // $9.00
    },
    yearly: {
      priceId: "price_starter_yearly", // Will be created on first checkout
      amount: 9000, // $90.00 (10 months)
      monthlyEquivalent: 750, // $7.50/mo effective
      savings: 1800, // $18.00 saved
    },
    currency: "usd",
  },
  professional: {
    name: "Professional",
    productId: "prod_Tyo9hR9AZd0tzL",
    monthly: {
      priceId: "price_1T0qXaAjAqXCmw11UfYRoBnf",
      amount: 2900, // $29.00
    },
    yearly: {
      priceId: "price_professional_yearly", // Will be created on first checkout
      amount: 29000, // $290.00 (10 months)
      monthlyEquivalent: 2417, // $24.17/mo effective
      savings: 5800, // $58.00 saved
    },
    currency: "usd",
  },
};

export type StripePricingTier = keyof typeof STRIPE_PRICING;

export function getStripePriceId(tier: StripePricingTier, interval: BillingInterval = 'month'): string {
  const pricing = STRIPE_PRICING[tier];
  if (interval === 'year' && pricing.yearly) {
    return pricing.yearly.priceId;
  }
  return pricing.monthly.priceId;
}

export function getStripeProductId(tier: StripePricingTier): string {
  return STRIPE_PRICING[tier].productId;
}

export function getStripePricingInfo(tier: StripePricingTier) {
  return STRIPE_PRICING[tier];
}

export function getYearlySavingsPercent(tier: StripePricingTier): number {
  const pricing = STRIPE_PRICING[tier];
  if (!pricing.yearly) return 0;
  const monthlyAnnual = pricing.monthly.amount * 12;
  return Math.round(((monthlyAnnual - pricing.yearly.amount) / monthlyAnnual) * 100);
}
