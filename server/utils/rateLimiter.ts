/**
 * In-memory rate limiter with sliding window.
 * Tracks requests per key (IP, email, etc.) and blocks when limit is exceeded.
 * Automatically cleans up expired entries to prevent memory leaks.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** How often to run cleanup of expired entries (ms). Defaults to 60s. */
  cleanupIntervalMs?: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;

    // Periodic cleanup to prevent memory leaks from abandoned keys
    const cleanupInterval = options.cleanupIntervalMs ?? 60_000;
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    // Allow the process to exit even if the timer is still running
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Check if a request is allowed for the given key.
   * Returns { allowed, remaining, retryAfterMs }
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      // Calculate when the earliest request in the window expires
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = oldestInWindow + this.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(retryAfterMs, 0),
      };
    }

    // Allow the request
    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      retryAfterMs: 0,
    };
  }

  /** Remove all expired entries to free memory */
  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, entry] of this.store) {
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /** Manually reset a key (useful for testing) */
  reset(key: string) {
    this.store.delete(key);
  }

  /** Clear all entries and stop cleanup timer */
  destroy() {
    this.store.clear();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Get current store size (for monitoring) */
  get size() {
    return this.store.size;
  }
}

/**
 * Pre-configured rate limiters for different use cases.
 * Each limiter tracks by key (IP, email, etc.) with a sliding window.
 */

/** Contact form: 3 submissions per 15 minutes */
export const contactFormLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});

/** Newsletter subscribe: 5 attempts per 15 minutes */
export const newsletterLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/** Auth signup: 5 attempts per 15 minutes */
export const signupLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/** Auth login: 10 attempts per 15 minutes per IP */
export const loginLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});

/** Auth login per-email: 5 attempts per 15 minutes (prevents credential stuffing on single account) */
export const loginEmailLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/** Resend confirmation email: 3 attempts per 15 minutes */
export const resendEmailLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});

/** Email testing: 5 attempts per 15 minutes */
export const emailTestingLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

// Forgot password: 3 requests per 15 min per IP/email
export const forgotPasswordLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
});
