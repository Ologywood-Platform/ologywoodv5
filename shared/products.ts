/**
 * Stripe product and price configuration for Ologywood subscriptions
 */

export const SUBSCRIPTION_PRODUCTS = {
  ARTIST_BASIC: {
    name: "Artist Basic Plan",
    description: "Access to the Ologywood platform for performing artists",
    priceMonthly: 2900, // $29.00 in cents
    currency: "usd",
    interval: "month",
    trialDays: 14,
    features: [
      "Create and manage artist profile",
      "Upload photos and media",
      "Manage availability calendar",
      "Create rider templates",
      "Receive and manage booking requests",
      "In-platform messaging with venues",
    ],
  },
} as const;

export type SubscriptionProductKey = keyof typeof SUBSCRIPTION_PRODUCTS;
