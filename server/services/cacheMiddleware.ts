import { cacheService } from './cache';

/**
 * Cache middleware for TRPC procedures
 * Wraps a procedure to add caching capability
 */
export function withCache<T>(
  key: string,
  ttl: number = 3600
) {
  return {
    key,
    ttl,
    async getCached(): Promise<T | null> {
      return cacheService.get<T>(key);
    },
    async setCached(value: T): Promise<boolean> {
      return cacheService.set<T>(key, value, ttl);
    },
    async invalidate(): Promise<boolean> {
      return cacheService.delete(key);
    },
  };
}

/**
 * Cache invalidation patterns
 */
export const CACHE_PATTERNS = {
  ARTISTS: 'artists:*',
  ARTIST_DETAIL: (id: number) => `artist:${id}:*`,
  BOOKINGS: 'bookings:*',
  BOOKING_DETAIL: (id: number) => `booking:${id}:*`,
  VENUES: 'venues:*',
  VENUE_DETAIL: (id: number) => `venue:${id}:*`,
  RIDERS: 'riders:*',
  RIDER_DETAIL: (id: number) => `rider:${id}:*`,
  MESSAGES: 'messages:*',
  REVIEWS: 'reviews:*',
};

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  return cacheService.deletePattern(pattern);
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const client = cacheService.getClient();
  if (!client.isOpen) {
    return { connected: false, status: 'disconnected' };
  }

  try {
    const info = await client.info('stats');
    return {
      connected: true,
      status: 'connected',
      info,
    };
  } catch (error) {
    console.error('[Cache] Error getting stats:', error);
    return { connected: false, status: 'error', error };
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<boolean> {
  return cacheService.clear();
}

export default {
  withCache,
  CACHE_PATTERNS,
  invalidateCachePattern,
  getCacheStats,
  clearAllCache,
};
