import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserSubscription,
  hasFeatureAccess,
  canCreateBooking,
  getCurrentMonthBookingCount,
  getTierInfo,
  getAllTiers,
  PRICING_TIERS,
} from "../services/pricingTierService";
import { getStripePriceId, STRIPE_PRICING } from "../config/stripePricing";

export const pricingRouter = router({
  /**
   * Get current user's subscription tier and usage
   */
  getCurrentTier: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getUserSubscription(ctx.user.id);
    const bookingCount = await getCurrentMonthBookingCount(ctx.user.id);
    const tier = PRICING_TIERS[subscription.tier as keyof typeof PRICING_TIERS];

    return {
      tier: subscription.tier,
      tierName: tier.name,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      bookingUsage: {
        current: bookingCount,
        limit: tier.bookingsPerMonth === Infinity ? null : tier.bookingsPerMonth,
        remaining:
          tier.bookingsPerMonth === Infinity
            ? null
            : Math.max(0, tier.bookingsPerMonth - bookingCount),
      },
      features: tier.features,
    };
  }),

  /**
   * Check if user can create a booking
   */
  canCreateBooking: protectedProcedure.query(async ({ ctx }) => {
    return await canCreateBooking(ctx.user.id);
  }),

  /**
   * Get all pricing tiers for pricing page
   */
  getAllTiers: publicProcedure.query(async () => {
    return Object.entries(PRICING_TIERS).map(([key, tier]) => ({
      id: key,
      name: tier.name,
      price: tier.price,
      bookingsPerMonth: tier.bookingsPerMonth,
      features: tier.features,
      stripePriceId: getStripePriceId(key as keyof typeof STRIPE_PRICING),
    }));
  }),

  /**
   * Check feature access
   */
  hasFeature: protectedProcedure
    .input(z.object({ feature: z.string() }))
    .query(async ({ ctx, input }) => {
      return await hasFeatureAccess(
        ctx.user.id,
        input.feature as any
      );
    }),

  /**
   * Get tier comparison data
   */
  getTierComparison: publicProcedure.query(async () => {
    const features = [
      "basicProfile",
      "messaging",
      "bookingCalendar",
      "paymentProcessing",
      "advancedProfile",
      "prioritySupport",
      "analytics",
      "riderBuilder",
      "contractTemplates",
      "paymentHistory",
      "bulkMessaging",
      "featuredProfile",
      "customBranding",
    ];

    return {
      features,
      tiers: Object.entries(PRICING_TIERS).map(([key, tier]) => ({
        id: key,
        name: tier.name,
        price: tier.price,
        bookingsPerMonth: tier.bookingsPerMonth,
        stripePriceId: getStripePriceId(key as keyof typeof STRIPE_PRICING),
        features: features.reduce(
          (acc, feature) => {
            acc[feature] = tier.features[feature as keyof typeof tier.features] || false;
            return acc;
          },
          {} as Record<string, boolean>
        ),
      })),
    };
  }),

  /**
   * Get current booking usage
   */
  getBookingUsage: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getUserSubscription(ctx.user.id);
    const tier = PRICING_TIERS[subscription.tier as keyof typeof PRICING_TIERS];
    const current = await getCurrentMonthBookingCount(ctx.user.id);

    return {
      current,
      limit: tier.bookingsPerMonth,
      unlimited: tier.bookingsPerMonth === Infinity,
      percentUsed:
        tier.bookingsPerMonth === Infinity
          ? 0
          : Math.round((current / tier.bookingsPerMonth) * 100),
    };
  }),
});
