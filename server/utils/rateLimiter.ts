import { createClient } from 'redis';

/**
 * In-memory rate limiter with an optional Redis-backed sliding window.
 * `check()` remains synchronous for isolated/local callers. Production routes
 * use `checkAsync()`, which atomically checks a shared Redis sorted set when
 * REDIS_URL or REDIS_HOST is configured and safely falls back to local state.
 */
interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  cleanupIntervalMs?: number;
  namespace?: string;
}

type SharedRedisClient = ReturnType<typeof createClient>;

const REDIS_WINDOW_SCRIPT = `
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local maxRequests = tonumber(ARGV[3])
  local windowStart = now - windowMs
  redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, windowStart)
  local count = redis.call('ZCARD', KEYS[1])
  if count >= maxRequests then
    local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
    local retryAfterMs = 0
    if oldest[2] then
      retryAfterMs = tonumber(oldest[2]) + windowMs - now
    end
    redis.call('PEXPIRE', KEYS[1], windowMs)
    return { 0, 0, math.max(retryAfterMs, 0) }
  end
  redis.call('ZADD', KEYS[1], now, ARGV[4])
  redis.call('PEXPIRE', KEYS[1], windowMs)
  return { 1, maxRequests - count - 1, 0 }
`;

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  private namespace: string;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private sharedClient: SharedRedisClient | null = null;
  private sharedConnectPromise: Promise<SharedRedisClient | null> | null = null;
  private sharedRetryAfter = 0;
  private sharedFailureLogged = false;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.namespace = options.namespace ?? `local-${Math.random().toString(36).slice(2, 10)}`;
    const cleanupInterval = options.cleanupIntervalMs ?? 60_000;
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);
    if (entry.timestamps.length >= this.maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(oldestInWindow + this.windowMs - now, 0) };
    }
    entry.timestamps.push(now);
    return { allowed: true, remaining: this.maxRequests - entry.timestamps.length, retryAfterMs: 0 };
  }

  /** Atomically use Redis when configured; otherwise use the local limiter. */
  async checkAsync(key: string): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
    const client = await this.getSharedClient();
    if (!client) return this.check(key);
    const now = Date.now();
    const redisKey = `ologywood:rate-limit:${this.namespace}:${key}`;
    const member = `${now}-${Math.random().toString(36).slice(2, 14)}`;
    try {
      const result = (await client.eval(REDIS_WINDOW_SCRIPT, {
        keys: [redisKey],
        arguments: [String(now), String(this.windowMs), String(this.maxRequests), member],
      })) as [number, number, number];
      return {
        allowed: Number(result[0]) === 1,
        remaining: Math.max(Number(result[1]) || 0, 0),
        retryAfterMs: Math.max(Number(result[2]) || 0, 0),
      };
    } catch {
      this.markSharedFailure();
      return this.check(key);
    }
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, entry] of this.store) {
      entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > windowStart);
      if (entry.timestamps.length === 0) this.store.delete(key);
    }
  }

  reset(key: string) {
    this.store.delete(key);
  }

  destroy() {
    this.store.clear();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    if (this.sharedClient?.isOpen) this.sharedClient.destroy();
    this.sharedClient = null;
    this.sharedConnectPromise = null;
  }

  get size() {
    return this.store.size;
  }

  private hasSharedConfiguration() {
    return Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
  }

  private async getSharedClient(): Promise<SharedRedisClient | null> {
    if (!this.hasSharedConfiguration() || Date.now() < this.sharedRetryAfter) return null;
    if (this.sharedClient?.isReady) return this.sharedClient;
    if (this.sharedConnectPromise) return this.sharedConnectPromise;

    this.sharedConnectPromise = (async () => {
      try {
        const client = process.env.REDIS_URL
          ? createClient({ url: process.env.REDIS_URL })
          : createClient({
              socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT || 6379) },
              password: process.env.REDIS_PASSWORD,
            });
        client.on('error', () => this.markSharedFailure());
        await client.connect();
        this.sharedClient = client;
        this.sharedRetryAfter = 0;
        return client;
      } catch {
        this.markSharedFailure();
        return null;
      } finally {
        this.sharedConnectPromise = null;
      }
    })();
    return this.sharedConnectPromise;
  }

  private markSharedFailure() {
    this.sharedRetryAfter = Date.now() + 5_000;
    if (!this.sharedFailureLogged) {
      this.sharedFailureLogged = true;
      console.warn(`[Rate Limiter] Shared store unavailable for ${this.namespace}; using local fallback`);
    }
  }
}

export const contactFormLimiter = new RateLimiter({ maxRequests: 3, windowMs: 15 * 60 * 1000, namespace: 'contact' });
export const newsletterLimiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000, namespace: 'newsletter' });
export const signupLimiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000, namespace: 'signup' });
export const loginLimiter = new RateLimiter({ maxRequests: 10, windowMs: 15 * 60 * 1000, namespace: 'login-ip' });
export const loginEmailLimiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000, namespace: 'login-email' });
export const resendEmailLimiter = new RateLimiter({ maxRequests: 3, windowMs: 15 * 60 * 1000, namespace: 'resend-email' });
export const emailTestingLimiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000, namespace: 'email-testing' });
export const aiChatLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60 * 1000, namespace: 'ai-chat' });
export const contractAnalyzerLimiter = new RateLimiter({ maxRequests: 6, windowMs: 15 * 60 * 1000, namespace: 'contract-analyzer' });
export const forgotPasswordLimiter = new RateLimiter({ maxRequests: 10, windowMs: 15 * 60 * 1000, namespace: 'forgot-password' });
