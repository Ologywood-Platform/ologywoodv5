import { Request, Response, NextFunction } from 'express';

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configuration
 */
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

/**
 * Create a rate limiting middleware
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
      console.log(`[RateLimit] Cleaned up ${cleaned} expired entries`);
    }
  }, intervalMs);
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
