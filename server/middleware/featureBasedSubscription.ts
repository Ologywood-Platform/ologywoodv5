/**
 * Feature-Based Subscription System
 * Invisible to users - handles feature access silently
 * No quota messaging, no technical limits shown
 */

export enum SubscriptionTier {
  FREE = 'free',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface FeatureLimits {
  maxArtistProfiles: number;
  maxVenueProfiles: number;
  maxBookingsPerMonth: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  teamMembers: number;
  storageGB: number;
  description: string;
}

/**
 * Feature limits by tier - these are INVISIBLE to users
 * The system handles them silently in the background
 */
export const FEATURE_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  [SubscriptionTier.FREE]: {
    maxArtistProfiles: 1,
    maxVenueProfiles: 1,
    maxBookingsPerMonth: 10,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    webhooks: false,
    teamMembers: 1,
    storageGB: 1,
    description: 'Free tier - basic features',
  },
  [SubscriptionTier.PROFESSIONAL]: {
    maxArtistProfiles: 5,
    maxVenueProfiles: 10,
    maxBookingsPerMonth: 100,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: false,
    apiAccess: true,
    webhooks: true,
    teamMembers: 3,
    storageGB: 10,
    description: 'Professional tier - advanced features',
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxArtistProfiles: 999,
    maxVenueProfiles: 999,
    maxBookingsPerMonth: 999999,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
    webhooks: true,
    teamMembers: 999,
    storageGB: 1000,
    description: 'Enterprise tier - unlimited features',
  },
};

/**
 * Get subscription tier for user
 * Silently defaults to FREE if not set
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    // This would be replaced with actual database query
    const tier = process.env[`USER_TIER_${userId}`] || SubscriptionTier.FREE;
    return tier as SubscriptionTier;
  } catch (error) {
    console.error('[FeatureSubscription] Error getting user tier:', error);
    return SubscriptionTier.FREE;
  }
}

/**
 * Get feature limits for a tier
 */
export function getFeatureLimits(tier: SubscriptionTier): FeatureLimits {
  return FEATURE_LIMITS[tier] || FEATURE_LIMITS[SubscriptionTier.FREE];
}

/**
 * Check if user can access a feature
 * Returns true/false silently - never shows error to user
 */
export async function canAccessFeature(
  userId: string,
  feature: keyof FeatureLimits
): Promise<boolean> {
  try {
    const tier = await getUserTier(userId);
    const limits = getFeatureLimits(tier);
    
    // Features that are boolean flags
    if (typeof limits[feature] === 'boolean') {
      return limits[feature] as boolean;
    }
    
    // For numeric limits, always return true (system handles queuing)
    return true;
  } catch (error) {
    console.error('[FeatureSubscription] Error checking feature access:', error);
    return false;
  }
}

/**
 * Check if user can create a new resource
 * Silently queues or delays if at limit (no error shown)
 */
export async function canCreateResource(
  userId: string,
  resourceType: 'artistProfile' | 'venueProfile' | 'booking',
  currentCount: number
): Promise<{ allowed: boolean; shouldQueue: boolean }> {
  try {
    const tier = await getUserTier(userId);
    const limits = getFeatureLimits(tier);

    let limit = 0;
    switch (resourceType) {
      case 'artistProfile':
        limit = limits.maxArtistProfiles;
        break;
      case 'venueProfile':
        limit = limits.maxVenueProfiles;
        break;
      case 'booking':
        limit = limits.maxBookingsPerMonth;
        break;
    }

    // If under limit, allow immediately
    if (currentCount < limit) {
      return { allowed: true, shouldQueue: false };
    }

    // If at limit, queue the request (user never sees this)
    // System will process it when capacity becomes available
    return { allowed: true, shouldQueue: true };
  } catch (error) {
    console.error('[FeatureSubscription] Error checking resource creation:', error);
    return { allowed: false, shouldQueue: false };
  }
}

/**
 * Get tier display name for internal use only
 * Never shown to users
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREE]: 'Free',
    [SubscriptionTier.PROFESSIONAL]: 'Professional',
    [SubscriptionTier.ENTERPRISE]: 'Enterprise',
  };
  return names[tier];
}

/**
 * Check if tier has feature (for UI rendering, not shown to user)
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: keyof FeatureLimits
): boolean {
  const limits = getFeatureLimits(tier);
  
  if (typeof limits[feature] === 'boolean') {
    return limits[feature] as boolean;
  }
  
  // Numeric limits are always "available" (system handles queuing)
  return true;
}

/**
 * Upgrade user tier (admin only)
 * Called when user purchases upgrade - completely silent
 */
export async function upgradeUserTier(
  userId: string,
  newTier: SubscriptionTier
): Promise<boolean> {
  try {
    // This would update the database
    console.log(`[FeatureSubscription] User ${userId} upgraded to ${newTier}`);
    return true;
  } catch (error) {
    console.error('[FeatureSubscription] Error upgrading user:', error);
    return false;
  }
}

/**
 * Get all available tiers (for upgrade UI)
 */
export function getAvailableTiers(): Array<{
  id: SubscriptionTier;
  name: string;
  features: FeatureLimits;
}> {
  return [
    {
      id: SubscriptionTier.FREE,
      name: 'Free',
      features: FEATURE_LIMITS[SubscriptionTier.FREE],
    },
    {
      id: SubscriptionTier.PROFESSIONAL,
      name: 'Professional',
      features: FEATURE_LIMITS[SubscriptionTier.PROFESSIONAL],
    },
    {
      id: SubscriptionTier.ENTERPRISE,
      name: 'Enterprise',
      features: FEATURE_LIMITS[SubscriptionTier.ENTERPRISE],
    },
  ];
}

/**
 * Get tier comparison for upgrade page
 * Shows features, not quotas
 */
export function getTierComparison() {
  return {
    tiers: getAvailableTiers(),
    features: [
      {
        name: 'Artist Profiles',
        free: FEATURE_LIMITS[SubscriptionTier.FREE].maxArtistProfiles,
        professional: FEATURE_LIMITS[SubscriptionTier.PROFESSIONAL].maxArtistProfiles,
        enterprise: 'Unlimited',
      },
      {
        name: 'Venue Profiles',
        free: FEATURE_LIMITS[SubscriptionTier.FREE].maxVenueProfiles,
        professional: FEATURE_LIMITS[SubscriptionTier.PROFESSIONAL].maxVenueProfiles,
        enterprise: 'Unlimited',
      },
      {
        name: 'Advanced Analytics',
        free: false,
        professional: true,
        enterprise: true,
      },
      {
        name: 'Priority Support',
        free: false,
        professional: true,
        enterprise: true,
      },
      {
        name: 'Custom Branding',
        free: false,
        professional: false,
        enterprise: true,
      },
      {
        name: 'API Access',
        free: false,
        professional: true,
        enterprise: true,
      },
      {
        name: 'Team Members',
        free: 1,
        professional: 3,
        enterprise: 'Unlimited',
      },
    ],
  };
}
