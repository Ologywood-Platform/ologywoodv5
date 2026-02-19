import { createClient } from 'redis';

// Initialize Redis client
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
  password: process.env.REDIS_PASSWORD,
});

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisClient.on('ready', () => {
  console.log('[Redis] Ready to accept commands');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('[Redis] Failed to connect:', err);
});

/**
 * Cache service for storing and retrieving data from Redis
 */
export const cacheService = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with optional expiration
   */
  async set<T>(key: string, value: T, expirationSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await redisClient.setEx(key, expirationSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      return await redisClient.del(keys);
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  },

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      await redisClient.flushDb();
      return true;
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
      return false;
    }
  },

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expirationSeconds: number = 3600
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached) {
        console.log(`[Cache] Hit: ${key}`);
        return cached;
      }

      // Cache miss - fetch data
      console.log(`[Cache] Miss: ${key}`);
      const data = await fetchFn();

      // Store in cache
      await this.set(key, data, expirationSeconds);

      return data;
    } catch (error) {
      console.error(`[Cache] Error in getOrSet for ${key}:`, error);
      // On error, fetch without caching
      return fetchFn();
    }
  },

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, amount);
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Get client for advanced operations
   */
  getClient() {
    return redisClient;
  },

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return redisClient.isOpen;
  },
};

export default cacheService;
