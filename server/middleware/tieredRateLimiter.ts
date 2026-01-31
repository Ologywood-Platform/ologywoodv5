/**
 * Tiered Rate Limiting by Subscription Level
 * Implements Free, Basic, and Premium tier limits
 */

import { z } from 'zod';

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export interface TierLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  maxConcurrentRequests: number;
  apiCallsPerMonth: number;
  description: string;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    maxConcurrentRequests: 2,
    apiCallsPerMonth: 100000,
    description: 'Free tier - limited access',
  },
  [SubscriptionTier.BASIC]: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    maxConcurrentRequests: 10,
    apiCallsPerMonth: 1000000,
    description: 'Basic tier - standard access',
  },
  [SubscriptionTier.PREMIUM]: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    maxConcurrentRequests: 50,
    apiCallsPerMonth: 10000000,
    description: 'Premium tier - unlimited access',
  },
};

/**
 * Get subscription tier for user
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    // This would be replaced with actual database query
    // For now, return FREE tier by default
    const tier = process.env[`USER_TIER_${userId}`] || SubscriptionTier.FREE;
    return tier as SubscriptionTier;
  } catch (error) {
    console.error('[TieredRateLimit] Error getting user tier:', error);
    return SubscriptionTier.FREE;
  }
}

/**
 * Get rate limits for a tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS[SubscriptionTier.FREE];
}

/**
 * Track request count for user
 */
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export function trackRequest(userId: string): number {
  const now = Date.now();
  const key = `${userId}:${Math.floor(now / 60000)}`; // Per minute key

  const current = requestCounts.get(key) || { count: 0, timestamp: now };
  current.count++;

  requestCounts.set(key, current);

  // Cleanup old entries
  if (requestCounts.size > 10000) {
    const cutoff = now - 3600000; // 1 hour
    for (const [k, v] of requestCounts.entries()) {
      if (v.timestamp < cutoff) {
        requestCounts.delete(k);
      }
    }
  }

  return current.count;
}

/**
 * Check if user has exceeded rate limit
 */
export async function isRateLimited(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  const limits = getTierLimits(tier);
  const count = trackRequest(userId);

  return count > limits.requestsPerMinute;
}

/**
 * Get remaining requests for user
 */
export async function getRemainingRequests(userId: string): Promise<number> {
  const tier = await getUserTier(userId);
  const limits = getTierLimits(tier);
  const now = Date.now();
  const key = `${userId}:${Math.floor(now / 60000)}`;
  const current = requestCounts.get(key) || { count: 0, timestamp: now };

  return Math.max(0, limits.requestsPerMinute - current.count);
}

/**
 * Get rate limit headers for response
 */
export async function getRateLimitHeaders(userId: string): Promise<Record<string, string>> {
  const tier = await getUserTier(userId);
  const limits = getTierLimits(tier);
  const remaining = await getRemainingRequests(userId);

  return {
    'X-RateLimit-Limit': limits.requestsPerMinute.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + 60000) / 1000).toString(),
    'X-Subscription-Tier': tier,
  };
}

/**
 * Express middleware for tiered rate limiting
 */
export function tieredRateLimitMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id || req.ip;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const isLimited = await isRateLimited(userId);

      if (isLimited) {
        const headers = await getRateLimitHeaders(userId);
        return res.status(429).set(headers).json({
          error: 'Rate limit exceeded',
          tier: await getUserTier(userId),
          limits: getTierLimits(await getUserTier(userId)),
        });
      }

      // Add rate limit headers to response
      const headers = await getRateLimitHeaders(userId);
      Object.entries(headers).forEach(([key, value]) => {
        res.set(key, value);
      });

      next();
    } catch (error) {
      console.error('[TieredRateLimit] Middleware error:', error);
      next();
    }
  };
}

/**
 * TRPC middleware for tiered rate limiting
 */
export function tieredRateLimitTrpcMiddleware() {
  return async (opts: any) => {
    const { next, ctx } = opts;

    try {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new Error('User ID required for rate limiting');
      }

      const isLimited = await isRateLimited(userId);

      if (isLimited) {
        throw new Error('Rate limit exceeded');
      }

      return next();
    } catch (error) {
      console.error('[TieredRateLimit] TRPC middleware error:', error);
      throw error;
    }
  };
}

/**
 * Check upgrade eligibility
 */
export function shouldPromoteUpgrade(userId: string): boolean {
  const now = Date.now();
  const key = `${userId}:${Math.floor(now / 60000)}`;
  const current = requestCounts.get(key) || { count: 0, timestamp: now };

  // Suggest upgrade if user hits 80% of their limit
  return current.count > (TIER_LIMITS[SubscriptionTier.FREE].requestsPerMinute * 0.8);
}

/**
 * Get upgrade recommendation
 */
export async function getUpgradeRecommendation(userId: string): Promise<{
  currentTier: SubscriptionTier;
  recommendedTier: SubscriptionTier;
  reason: string;
} | null> {
  const currentTier = await getUserTier(userId);

  if (currentTier === SubscriptionTier.PREMIUM) {
    return null; // Already on highest tier
  }

  if (shouldPromoteUpgrade(userId)) {
    const nextTier = currentTier === SubscriptionTier.FREE ? SubscriptionTier.BASIC : SubscriptionTier.PREMIUM;
    return {
      currentTier,
      recommendedTier: nextTier,
      reason: `You're approaching your ${currentTier} tier limit. Upgrade to ${nextTier} for higher limits.`,
    };
  }

  return null;
}
