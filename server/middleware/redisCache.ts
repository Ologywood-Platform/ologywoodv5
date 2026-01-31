/**
 * Redis Cache Adapter
 * Provides distributed caching for multi-instance deployments
 * Falls back to in-memory cache if Redis is unavailable
 */

import { cacheManager } from './cacheManager';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
}

let redisClient: any = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('[Redis] REDIS_URL not configured, using in-memory cache');
    return false;
  }

  try {
    // Dynamic import to avoid hard dependency
    const redis = await import('redis');
    redisClient = redis.createClient({ url: redisUrl });
    
    redisClient.on('error', (err: any) => {
      console.error('[Redis] Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    isRedisAvailable = true;
    console.log('[Redis] Cache initialized');
    return true;
  } catch (error) {
    console.warn('[Redis] Not available, falling back to in-memory cache:', error);
    isRedisAvailable = false;
    return false;
  }
}

/**
 * Get value from Redis or in-memory cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable || !redisClient) {
    return cacheManager.get<T>(key);
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error('[Redis] Get error:', error);
    // Fall back to in-memory cache
    return cacheManager.get<T>(key);
  }
}

/**
 * Set value in Redis and in-memory cache
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  // Always set in memory cache
  cacheManager.set(key, value, ttlSeconds * 1000);

  if (!isRedisAvailable || !redisClient) {
    return;
  }

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('[Redis] Set error:', error);
    // Silently fail - in-memory cache is still valid
  }
}

/**
 * Delete value from Redis and in-memory cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  const memoryDeleted = cacheManager.delete(key);

  if (!isRedisAvailable || !redisClient) {
    return memoryDeleted;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] Delete error:', error);
    return memoryDeleted;
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachedPattern(pattern: string | RegExp): Promise<number> {
  const memoryDeleted = cacheManager.deletePattern(pattern);

  if (!isRedisAvailable || !redisClient) {
    return memoryDeleted;
  }

  try {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keys = await redisClient.keys(regex.source);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (error) {
    console.error('[Redis] Pattern delete error:', error);
    return memoryDeleted;
  }
}

/**
 * Clear all cache
 */
export async function clearAllCached(): Promise<void> {
  cacheManager.clear();

  if (!isRedisAvailable || !redisClient) {
    return;
  }

  try {
    await redisClient.flushDb();
    console.log('[Redis] Cache cleared');
  } catch (error) {
    console.error('[Redis] Clear error:', error);
  }
}

/**
 * Get Redis connection status
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    redis: isRedisAvailable,
    memory: cacheManager.getStats(),
  };
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Connection closed');
    } catch (error) {
      console.error('[Redis] Error closing connection:', error);
    }
    redisClient = null;
    isRedisAvailable = false;
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('[Redis] Shutting down...');
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Redis] Shutting down...');
  await closeRedis();
  process.exit(0);
});
