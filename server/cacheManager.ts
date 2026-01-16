/**
 * Simple in-memory cache manager for frequently accessed data
 * In production, consider using Redis for distributed caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * Get a value from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear a specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache key generators for common queries
 */
export const cacheKeys = {
  userProfile: (userId: number) => `user:${userId}:profile`,
  artistProfile: (artistId: number) => `artist:${artistId}:profile`,
  venueProfile: (venueId: number) => `venue:${venueId}:profile`,
  artistReviews: (artistId: number) => `artist:${artistId}:reviews`,
  venueReviews: (venueId: number) => `venue:${venueId}:reviews`,
  subscription: (userId: number) => `user:${userId}:subscription`,
  bookings: (userId: number) => `user:${userId}:bookings`,
  availability: (artistId: number) => `artist:${artistId}:availability`,
  riderTemplates: (artistId: number) => `artist:${artistId}:riders`,
};

/**
 * Decorator for caching function results
 */
export function cacheable<T>(
  keyGenerator: (...args: any[]) => string,
  ttlSeconds: number = 300
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<T> {
      const cacheKey = keyGenerator(...args);
      const cached = cacheManager.get<T>(cacheKey);

      if (cached !== null) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return cached;
      }

      console.log(`[CACHE MISS] ${cacheKey}`);
      const result = await originalMethod.apply(this, args);
      cacheManager.set(cacheKey, result, ttlSeconds);
      return result;
    };

    return descriptor;
  };
}
