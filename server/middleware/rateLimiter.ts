/**
 * Unified Rate Limiting System
 * Supports both basic rate limiting and subscription-tier-based limits
 * Replaces both rateLimiter.ts and tieredRateLimiter.ts
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ============= SUBSCRIPTION TIER DEFINITIONS =============

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

// ============= BASIC RATE LIMIT CONFIGURATION =============

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
}

/**
 * Default rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Moderate limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 requests per 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  // Very generous limits for API endpoints (production ready)
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000, // 10000 requests per minute
    message: 'Too many requests. Please slow down.',
  },
  // Generous limits for public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5000, // 5000 requests per minute
    message: 'Rate limit exceeded. Please try again later.',
  },
  // Generous limits for sensitive operations
  sensitive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute
    message: 'Too many requests for this operation. Please try again later.',
  },
};

// ============= IN-MEMORY STORAGE =============

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// ============= BASIC RATE LIMITING FUNCTIONS =============

/**
 * Extract client identifier from request
 */
function getClientKey(req: Request): string {
  // Try to use user ID if authenticated
  if ((req as any).user?.id) {
    return `user:${(req as any).user.id}`;
  }

  // Fall back to IP address
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Create a basic rate limiting middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting if configured
    if (config.skip && config.skip(req)) {
      return next();
    }

    // Generate unique key for this client
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getClientKey(req);

    // Get current rate limit data
    const now = Date.now();
    let data = rateLimitStore.get(key);

    // Reset if window has expired
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, data);
    }

    // Increment request count
    data.count++;

    // Set rate limit headers
    const remaining = Math.max(0, config.maxRequests - data.count);
    const resetTime = Math.ceil((data.resetTime - now) / 1000);

    res.set('X-RateLimit-Limit', config.maxRequests.toString());
    res.set('X-RateLimit-Remaining', remaining.toString());
    res.set('X-RateLimit-Reset', resetTime.toString());

    // Check if limit exceeded
    if (data.count > config.maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message || 'Too many requests. Please try again later.',
        retryAfter: resetTime,
      });
      return;
    }

    next();
  };
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(req: Request, config: RateLimitConfig) {
  const key = config.keyGenerator
    ? config.keyGenerator(req)
    : getClientKey(req);

  const data = rateLimitStore.get(key);
  const now = Date.now();

  if (!data || now > data.resetTime) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    count: data.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - data.count),
    resetTime: data.resetTime,
  };
}

/**
 * Reset rate limit for a specific client
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits() {
  rateLimitStore.clear();
}

/**
 * Cleanup expired entries from rate limit store periodically
 */
export function startRateLimitCleanup(intervalMs: number = 60000) {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    const keysToDelete: string[] = [];

    rateLimitStore.forEach((data, key) => {
      if (now > data.resetTime) {
        keysToDelete.push(key);
        cleaned++;
      }
    });

    keysToDelete.forEach(key => rateLimitStore.delete(key));

    if (cleaned > 0) {
    }
  }, intervalMs);
}

// ============= TIERED RATE LIMITING FUNCTIONS =============

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
    console.error('[RateLimit] Error getting user tier:', error);
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
      console.error('[RateLimit] Middleware error:', error);
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
      console.error('[RateLimit] TRPC middleware error:', error);
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
