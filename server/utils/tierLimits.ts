/**
 * Subscription Tier Enforcement
 * Defines plan limits and provides helper functions for feature gating.
 * 
 * Tiers: free, starter, professional, enterprise
 */
import { TRPCError } from "@trpc/server";

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface TierLimits {
  bookingsPerMonth: number;       // Max booking requests per month
  maxReleases: number;            // Max active white-label releases
  riderBuilder: boolean;          // Access to Rider Builder & templates
  contracts: boolean;             // Access to Contracts & e-signatures
  advancedAnalytics: boolean;     // Access to advanced analytics dashboard
  prioritySupport: boolean;       // Priority support access
  sponsorShowcase: boolean;       // Sponsor Showcase feature
  sponsorAnalytics: boolean;      // Sponsor Analytics & CTR
  mediaKit: boolean;              // Auto-generated Media Kit
  brandedEvents: boolean;         // Branded event pages
  bulkMessaging: boolean;         // Bulk messaging feature
  fanEmailUpdates: boolean;       // Fan email list & Send Update
  unlimitedReleases: boolean;     // Unlimited content releases
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    bookingsPerMonth: 2,
    maxReleases: 0,
    riderBuilder: false,
    contracts: false,
    advancedAnalytics: false,
    prioritySupport: false,
    sponsorShowcase: false,
    sponsorAnalytics: false,
    mediaKit: false,
    brandedEvents: false,
    bulkMessaging: false,
    fanEmailUpdates: false,
    unlimitedReleases: false,
  },
  starter: {
    bookingsPerMonth: Infinity,
    maxReleases: 2,
    riderBuilder: true,
    contracts: false,
    advancedAnalytics: false,
    prioritySupport: false,
    sponsorShowcase: false,
    sponsorAnalytics: false,
    mediaKit: false,
    brandedEvents: false,
    bulkMessaging: false,
    fanEmailUpdates: true,
    unlimitedReleases: false,
  },
  professional: {
    bookingsPerMonth: Infinity,
    maxReleases: Infinity,
    riderBuilder: true,
    contracts: true,
    advancedAnalytics: true,
    prioritySupport: true,
    sponsorShowcase: false,
    sponsorAnalytics: false,
    mediaKit: false,
    brandedEvents: false,
    bulkMessaging: true,
    fanEmailUpdates: true,
    unlimitedReleases: true,
  },
  enterprise: {
    bookingsPerMonth: Infinity,
    maxReleases: Infinity,
    riderBuilder: true,
    contracts: true,
    advancedAnalytics: true,
    prioritySupport: true,
    sponsorShowcase: true,
    sponsorAnalytics: true,
    mediaKit: true,
    brandedEvents: true,
    bulkMessaging: true,
    fanEmailUpdates: true,
    unlimitedReleases: true,
  },
};

/**
 * Get the limits for a given tier (defaults to 'free' if unknown)
 */
export function getTierLimits(tier: string | null | undefined): TierLimits {
  const normalizedTier = (tier || 'free').toLowerCase() as SubscriptionTier;
  return TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;
}

/**
 * Check if a feature is available for the given tier.
 * Throws a TRPCError with FORBIDDEN code if not allowed.
 */
export function requireFeature(
  tier: string | null | undefined,
  feature: keyof TierLimits,
  featureLabel: string = 'This feature'
): void {
  const limits = getTierLimits(tier);
  const value = limits[feature];
  if (value === false || value === 0) {
    const requiredTier = getMinimumTierForFeature(feature);
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${featureLabel} requires a ${requiredTier} plan or higher. Please upgrade your subscription.`,
    });
  }
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: keyof TierLimits): string {
  const tiers: SubscriptionTier[] = ['free', 'starter', 'professional', 'enterprise'];
  for (const tier of tiers) {
    const value = TIER_LIMITS[tier][feature];
    if (value === true || (typeof value === 'number' && value > 0)) {
      return tier.charAt(0).toUpperCase() + tier.slice(1);
    }
  }
  return 'Enterprise';
}

/**
 * Check if the user has exceeded their booking limit for the current month
 */
export function checkBookingLimit(
  tier: string | null | undefined,
  currentMonthBookings: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(tier);
  const limit = limits.bookingsPerMonth;
  const allowed = currentMonthBookings < limit;
  const remaining = Math.max(0, limit - currentMonthBookings);
  return { allowed, limit, remaining };
}

/**
 * Check if the user has exceeded their release limit
 */
export function checkReleaseLimit(
  tier: string | null | undefined,
  currentReleaseCount: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(tier);
  const limit = limits.maxReleases;
  if (limits.unlimitedReleases) {
    return { allowed: true, limit: Infinity, remaining: Infinity };
  }
  const allowed = currentReleaseCount < limit;
  const remaining = Math.max(0, limit - currentReleaseCount);
  return { allowed, limit, remaining };
}
