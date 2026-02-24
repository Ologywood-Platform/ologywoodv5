/**
 * Unified Cache Manager Service
 * Supports Redis for distributed caching with in-memory fallback
 * Replaces cacheManager.ts, redisCache.ts, and trpcCache.ts
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  redisEnabled: boolean;
}

export class UnifiedCacheManager {
  private inMemoryCache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, redisEnabled: false };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private redisClient: any = null;
  private isRedisAvailable = false;

  /**
   * Initialize cache with Redis support and automatic cleanup
   */
  async init(cleanupIntervalMs: number = 60000): Promise<void> {
    // Try to initialize Redis
    await this.initializeRedis();
    
    // Start cleanup
    this.startCleanup(cleanupIntervalMs);
    
    const cacheType = this.isRedisAvailable ? 'Redis + In-Memory' : 'In-Memory';
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return;
    }

    try {
      // Dynamic import to avoid hard dependency
      // @ts-ignore - redis module is optional
      const redis = await import('redis').catch(() => null);
      if (!redis) {
        return;
      }

      this.redisClient = (redis as any).createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err: any) => {
        console.error('[Cache] Redis error:', err);
        this.isRedisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        this.isRedisAvailable = true;
        this.stats.redisEnabled = true;
      });

      await this.redisClient.connect();
      this.isRedisAvailable = true;
      this.stats.redisEnabled = true;
    } catch (error) {
      console.warn('[Cache] Redis not available, using in-memory cache:', error);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get value from cache (Redis or in-memory)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first if available
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('[Cache] Redis get error:', error);
        // Fall through to in-memory cache
      }
    }

    // Fall back to in-memory cache
    const entry = this.inMemoryCache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.inMemoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    // Set in Redis if available
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      } catch (error) {
        console.error('[Cache] Redis set error:', error);
        // Fall through to in-memory cache
      }
    }

    // Always set in in-memory cache as fallback
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    };

    this.inMemoryCache.set(key, entry);
    this.stats.size = this.inMemoryCache.size;
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    // Delete from Redis if available
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const result = await this.redisClient.del(key);
        deleted = result > 0;
      } catch (error) {
        console.error('[Cache] Redis delete error:', error);
      }
    }

    // Delete from in-memory cache
    const inMemoryDeleted = this.inMemoryCache.delete(key);
    this.stats.size = this.inMemoryCache.size;

    return deleted || inMemoryDeleted;
  }

  /**
   * Delete multiple cache entries by pattern
   */
  async deletePattern(pattern: string | RegExp): Promise<number> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;

    // Delete from Redis if available
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern instanceof RegExp ? '*' : pattern);
        if (keys && keys.length > 0) {
          deleted += await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.error('[Cache] Redis pattern delete error:', error);
      }
    }

    // Delete from in-memory cache
    for (const key of this.inMemoryCache.keys()) {
      if (regex.test(key)) {
        this.inMemoryCache.delete(key);
        deleted++;
      }
    }

    this.stats.size = this.inMemoryCache.size;
    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear Redis if available
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.flushDb();
      } catch (error) {
        console.error('[Cache] Redis clear error:', error);
      }
    }

    // Clear in-memory cache
    this.inMemoryCache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, redisEnabled: this.stats.redisEnabled };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total === 0 ? '0%' : ((this.stats.hits / total) * 100).toFixed(2) + '%';

    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();
      let cleaned = 0;
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.inMemoryCache.entries()) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
          cleaned++;
        }
      }

      keysToDelete.forEach(key => this.inMemoryCache.delete(key));
      this.stats.size = this.inMemoryCache.size;

      if (cleaned > 0) {
      }
    }, intervalMs);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache manager and close Redis connection
   */
  async destroy(): Promise<void> {
    this.stopCleanup();
    
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (error) {
        console.error('[Cache] Error closing Redis connection:', error);
      }
    }

    await this.clear();
  }
}

// Export singleton instance
export const cacheManager = new UnifiedCacheManager();

/**
 * Cache middleware for Express
 * Usage: app.get('/api/endpoint', cacheMiddleware('5m'), handler)
 */
export function cacheMiddleware(ttl: string = '5m') {
  const ttlMs = parseTTL(ttl);

  return async (req: any, res: any, next: any) => {
    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Try to get from cache
    const cached = await cacheManager.get(res.locals.cacheKey || cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = async function (data: any) {
      res.set('X-Cache', 'MISS');
      await cacheManager.set(cacheKey, data, ttlMs);
      return originalJson(data);
    };

    next();
  };
}

/**
 * tRPC middleware for caching
 * Usage: t.procedure.use(trpcCacheMiddleware('5m')).query(...)
 */
export function trpcCacheMiddleware(ttl: string = '5m') {
  const ttlMs = parseTTL(ttl);

  return async (opts: any) => {
    const { next, path, input } = opts;
    const cacheKey = `trpc:${path}:${JSON.stringify(input)}`;

    // Try to get from cache
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Call the next middleware/resolver
    const result = await next();

    // Cache the result
    await cacheManager.set(cacheKey, result, ttlMs);

    return result;
  };
}

/**
 * Parse TTL string to milliseconds
 * Examples: '5m', '30s', '1h', '2d'
 */
function parseTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}. Use format like "5m", "30s", "1h", "2d"`);
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return num * (multipliers[unit] || 1000);
}
