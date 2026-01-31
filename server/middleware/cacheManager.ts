/**
 * Cache Manager Service
 * Provides in-memory caching for frequently accessed endpoints
 * In production, consider using Redis for distributed caching
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
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize cache with automatic cleanup
   */
  init(cleanupIntervalMs: number = 60000) {
    this.startCleanup(cleanupIntervalMs);
    console.log('[Cache] Manager initialized with cleanup interval:', cleanupIntervalMs, 'ms');
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Delete multiple cache entries by pattern
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
    console.log('[Cache] All cache cleared');
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
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
          cleaned++;
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));
      this.stats.size = this.cache.size;

      if (cleaned > 0) {
        console.log(`[Cache] Cleaned up ${cleaned} expired entries (${this.cache.size} remaining)`);
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
   * Destroy cache manager
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache middleware for Express
 * Usage: app.get('/api/endpoint', cacheMiddleware('5m'), handler)
 */
export function cacheMiddleware(ttl: string = '5m') {
  const ttlMs = parseTTL(ttl);

  return (req: any, res: any, next: any) => {
    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Try to get from cache
    const cached = cacheManager.get(res.locals.cacheKey || cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data: any) {
      res.set('X-Cache', 'MISS');
      cacheManager.set(cacheKey, data, ttlMs);
      return originalJson(data);
    };

    next();
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
