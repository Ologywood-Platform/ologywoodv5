/**
 * TRPC Caching Middleware
 * Automatically caches TRPC query responses based on endpoint configuration
 */

import { cacheManager } from './cacheManager';

export interface CacheConfig {
  enabled: boolean;
  ttlMs: number;
  keyPrefix?: string;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Artist endpoints
  'artist.getAll': {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'artist:getAll',
  },
  'artist.search': {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'artist:search',
  },
  'artist.getById': {
    enabled: true,
    ttlMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: 'artist:getById',
  },

  // Venue endpoints
  'venueDirectory.getAll': {
    enabled: true,
    ttlMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: 'venue:getAll',
  },
  'venueDirectory.getById': {
    enabled: true,
    ttlMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: 'venue:getById',
  },
  'venueDirectory.search': {
    enabled: true,
    ttlMs: 10 * 60 * 1000, // 10 minutes
    keyPrefix: 'venue:search',
  },

  // Auth endpoints (shorter cache)
  'auth.me': {
    enabled: true,
    ttlMs: 1 * 60 * 1000, // 1 minute
    keyPrefix: 'auth:me',
  },

  // Booking endpoints
  'booking.getAll': {
    enabled: true,
    ttlMs: 2 * 60 * 1000, // 2 minutes
    keyPrefix: 'booking:getAll',
  },

  // Review endpoints
  'venueReviews.getByVenue': {
    enabled: true,
    ttlMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'reviews:venue',
  },
};

/**
 * Generate cache key for TRPC endpoint
 */
export function generateCacheKey(endpoint: string, input?: any): string {
  const config = CACHE_CONFIGS[endpoint];
  if (!config) {
    return '';
  }

  let key = config.keyPrefix || endpoint;

  // Add input to key if provided
  if (input) {
    const inputStr = JSON.stringify(input);
    const hash = hashString(inputStr);
    key += `:${hash}`;
  }

  return key;
}

/**
 * Simple hash function for input objects
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get cache configuration for endpoint
 */
export function getCacheConfig(endpoint: string): CacheConfig | null {
  return CACHE_CONFIGS[endpoint] || null;
}

/**
 * Check if endpoint should be cached
 */
export function shouldCache(endpoint: string): boolean {
  const config = getCacheConfig(endpoint);
  return config?.enabled ?? false;
}

/**
 * Get cached response for endpoint
 */
export function getCachedResponse<T>(endpoint: string, input?: any): T | null {
  if (!shouldCache(endpoint)) {
    return null;
  }

  const key = generateCacheKey(endpoint, input);
  if (!key) {
    return null;
  }

  return cacheManager.get<T>(key);
}

/**
 * Cache response for endpoint
 */
export function cacheResponse<T>(endpoint: string, input: any, data: T): void {
  if (!shouldCache(endpoint)) {
    return;
  }

  const config = getCacheConfig(endpoint);
  if (!config) {
    return;
  }

  const key = generateCacheKey(endpoint, input);
  if (!key) {
    return;
  }

  cacheManager.set(key, data, config.ttlMs);
}

/**
 * Invalidate cache for endpoint
 */
export function invalidateCache(endpoint: string, input?: any): boolean {
  if (!shouldCache(endpoint)) {
    return false;
  }

  const key = generateCacheKey(endpoint, input);
  if (!key) {
    return false;
  }

  return cacheManager.delete(key);
}

/**
 * Invalidate all cache for endpoint pattern
 */
export function invalidateCachePattern(pattern: string | RegExp): number {
  return cacheManager.deletePattern(pattern);
}

/**
 * Clear all TRPC cache
 */
export function clearAllCache(): void {
  cacheManager.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheManager.getStats();
}

/**
 * Print cache statistics to console
 */
export function printCacheStats(): void {
  const stats = getCacheStats();
  console.log('[TRPC Cache] Statistics:', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hitRate,
    cachedItems: stats.size,
  });
}
