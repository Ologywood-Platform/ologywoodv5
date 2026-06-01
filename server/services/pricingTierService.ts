import { getDb } from "../db";
import { userSubscriptions, bookingUsage } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Pricing tier definitions and feature access
 */
export const PRICING_TIERS = {
  free: {
    name: "Free",
    price: 0,
    bookingsPerMonth: 2,
    maxActiveReleases: 0,
    maxMerchItems: 0,
    maxProjectPreviews: 0,
    maxTracksPerProject: 0,
    maxSnippetSeconds: 0,
    features: {
      basicProfile: true,
      messaging: true,
      bookingCalendar: true,
      paymentProcessing: true,
      emailSupport: true,
      mobileResponsive: true,
      advancedProfile: false,
      prioritySupport: false,
      analytics: false,
      riderBuilder: false,
      contractTemplates: false,
      paymentHistory: false,
      bulkMessaging: false,
      featuredProfile: false,
      customBranding: false,
      whiteLabel: false,
      whiteLabelAdvanced: false,
    },
  },
  starter: {
    name: "Starter",
    price: 9,
    bookingsPerMonth: Infinity,
    maxActiveReleases: 2,
    maxMerchItems: 6,
    maxProjectPreviews: 1,
    maxTracksPerProject: 6,
    maxSnippetSeconds: 30,
    features: {
      basicProfile: true,
      messaging: true,
      bookingCalendar: true,
      paymentProcessing: true,
      emailSupport: true,
      mobileResponsive: true,
      advancedProfile: false,
      prioritySupport: false,
      analytics: false,
      riderBuilder: true,
      contractTemplates: false,
      paymentHistory: false,
      bulkMessaging: false,
      featuredProfile: false,
      customBranding: false,
      whiteLabel: true,
      whiteLabelAdvanced: true,
    },
  },
  professional: {
    name: "Professional",
    price: 29,
    bookingsPerMonth: Infinity,
    maxActiveReleases: Infinity,
    maxMerchItems: 15,
    maxProjectPreviews: 3,
    maxTracksPerProject: 12,
    maxSnippetSeconds: 60,
    features: {
      basicProfile: true,
      messaging: true,
      bookingCalendar: true,
      paymentProcessing: true,
      emailSupport: true,
      mobileResponsive: true,
      advancedProfile: true,
      prioritySupport: true,
      analytics: true,
      riderBuilder: true,
      contractTemplates: true,
      paymentHistory: true,
      bulkMessaging: true,
      featuredProfile: true,
      customBranding: true,
      whiteLabel: true,
      whiteLabelAdvanced: true,
    },
  },
};

export type PricingTier = keyof typeof PRICING_TIERS;
export type FeatureKey = keyof (typeof PRICING_TIERS)["free"]["features"];

/**
 * Get or create user subscription
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const subscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (subscription.length > 0) {
    return subscription[0];
  }

  // Create default free subscription
  const newSubscription = await db!.insert(userSubscriptions).values({
    userId,
    tier: "free",
    status: "active",
  });

  return {
    id: (newSubscription as any).insertId || 0,
    userId,
    tier: "free" as PricingTier,
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: number,
  feature: FeatureKey
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];
  return tier.features[feature] || false;
}

/**
 * Get current month booking count for user
 */
export async function getCurrentMonthBookingCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await db
    .select()
    .from(bookingUsage)
    .where(and(eq(bookingUsage.userId, userId), eq(bookingUsage.month, month)))
    .limit(1);

  return usage.length > 0 ? usage[0].bookingCount : 0;
}

/**
 * Increment booking count for current month
 */
export async function incrementBookingCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const existing = await db
    .select()
    .from(bookingUsage)
    .where(and(eq(bookingUsage.userId, userId), eq(bookingUsage.month, month)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(bookingUsage)
      .set({ bookingCount: existing[0].bookingCount + 1 })
      .where(eq(bookingUsage.id, existing[0].id));
  } else {
    await db.insert(bookingUsage).values({
      userId,
      month,
      bookingCount: 1,
    });
  }
}

/**
 * Check if user can create a new booking based on tier limits
 */
export async function canCreateBooking(userId: number): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];

  if (tier.bookingsPerMonth === Infinity) {
    return { allowed: true };
  }

  const currentCount = await getCurrentMonthBookingCount(userId);
  const remaining = tier.bookingsPerMonth - currentCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `You've reached your monthly booking limit of ${tier.bookingsPerMonth}. Upgrade to ${tier.name === "Free" ? "Starter" : "Professional"} for unlimited bookings.`,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Upgrade user to a new tier
 */
export async function upgradeTier(
  userId: number,
  newTier: PricingTier,
  stripeData?: {
    customerId: string;
    subscriptionId: string;
    priceId: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const subscription = await getUserSubscription(userId);

  await db
    .update(userSubscriptions)
    .set({
      tier: newTier,
      status: "active",
      stripeCustomerId: stripeData?.customerId,
      stripeSubscriptionId: stripeData?.subscriptionId,
      stripePriceId: stripeData?.priceId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));
}

/**
 * Set trial for beta users (first 20)
 */
export async function setTrialForBetaUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const trialEndsAt = new Date();
  trialEndsAt.setMonth(trialEndsAt.getMonth() + 3); // 3 months

  await db
    .update(userSubscriptions)
    .set({
      tier: "professional",
      status: "trialing",
      trialEndsAt,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));
}

/**
 * Get tier info
 */
export function getTierInfo(tier: PricingTier) {
  return PRICING_TIERS[tier];
}

/**
 * Get all tiers for pricing page
 */
export function getAllTiers() {
  return PRICING_TIERS;
}


/**
 * Check if user can create a new release based on tier limits.
 * Free: 0 releases, Starter: 2 active, Professional: unlimited.
 */
export async function canCreateRelease(userId: number, currentActiveCount: number): Promise<{
  allowed: boolean;
  reason?: string;
  maxAllowed: number;
  currentCount: number;
}> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];
  const maxAllowed = tier.maxActiveReleases;

  if (maxAllowed === 0) {
    return {
      allowed: false,
      reason: "Upgrade to Starter or Professional to sell music through White Label Release.",
      maxAllowed: 0,
      currentCount: currentActiveCount,
    };
  }

  if (maxAllowed === Infinity) {
    return { allowed: true, maxAllowed: Infinity, currentCount: currentActiveCount };
  }

  if (currentActiveCount >= maxAllowed) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${maxAllowed} active releases on the ${tier.name} plan. Upgrade to Professional for unlimited releases.`,
      maxAllowed,
      currentCount: currentActiveCount,
    };
  }

  return { allowed: true, maxAllowed, currentCount: currentActiveCount };
}


/**
 * Check if user can create a new project preview based on tier limits.
 * Free: 0, Starter: 1, Professional: 3.
 */
export async function canCreateProjectPreview(userId: number, currentCount: number): Promise<{
  allowed: boolean;
  reason?: string;
  maxAllowed: number;
  currentCount: number;
}> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];
  const maxAllowed = tier.maxProjectPreviews;

  if (maxAllowed === 0) {
    return {
      allowed: false,
      reason: "Upgrade to Starter or Professional to create Project Previews.",
      maxAllowed: 0,
      currentCount,
    };
  }

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${maxAllowed} project preview${maxAllowed > 1 ? 's' : ''} on the ${tier.name} plan. Upgrade to Professional for up to 3 projects.`,
      maxAllowed,
      currentCount,
    };
  }

  return { allowed: true, maxAllowed, currentCount };
}

/**
 * Get the max tracks per project for a user's tier.
 */
export async function getMaxTracksPerProject(userId: number): Promise<number> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];
  return tier.maxTracksPerProject;
}

/**
 * Get the max snippet seconds for a user's tier.
 */
export async function getMaxSnippetSeconds(userId: number): Promise<number> {
  const subscription = await getUserSubscription(userId);
  const tier = PRICING_TIERS[subscription.tier as PricingTier];
  return tier.maxSnippetSeconds;
}
