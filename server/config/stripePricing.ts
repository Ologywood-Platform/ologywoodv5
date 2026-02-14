/**
 * Stripe Pricing Configuration
 * Maps pricing tiers to Stripe product and price IDs
 */

export const STRIPE_PRICING = {
  free: {
    name: "Free",
    productId: "prod_Tyo8p400WELYbS",
    priceId: "price_1T0qVrAjAqXCmw11H7YF3dtr",
    amount: 0,
    currency: "usd",
    interval: null,
  },
  starter: {
    name: "Starter",
    productId: "prod_Tyo9bhELY4pjtg",
    priceId: "price_1T0qWrAjAqXCmw11aVyutKra",
    amount: 900, // $9.00 in cents
    currency: "usd",
    interval: "month",
  },
  professional: {
    name: "Professional",
    productId: "prod_Tyo9hR9AZd0tzL",
    priceId: "price_1T0qXaAjAqXCmw11UfYRoBnf",
    amount: 2900, // $29.00 in cents
    currency: "usd",
    interval: "month",
  },
};

export type StripePricingTier = keyof typeof STRIPE_PRICING;

export function getStripePriceId(tier: StripePricingTier): string {
  return STRIPE_PRICING[tier].priceId;
}

export function getStripeProductId(tier: StripePricingTier): string {
  return STRIPE_PRICING[tier].productId;
}

export function getStripePricingInfo(tier: StripePricingTier) {
  return STRIPE_PRICING[tier];
}
