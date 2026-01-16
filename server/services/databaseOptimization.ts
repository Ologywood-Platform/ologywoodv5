/**
 * Database Optimization Service
 * Implements query optimization, indexing, caching, and connection pooling
 */

import NodeCache from 'node-cache';

/**
 * Query cache with TTL support
 */
export class QueryCache {
  private cache: NodeCache;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(stdTTL: number = 300, checkperiod: number = 60) {
    this.cache = new NodeCache({ stdTTL, checkperiod });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    return value;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl !== undefined ? ttl : 300);
    this.stats.sets++;
  }

  /**
   * Delete cached value
   */
  del(key: string): void {
    this.cache.del(key);
    this.stats.deletes++;
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      keys: this.cache.keys().length,
    };
  }
}

/**
 * Database indexes configuration
 */
export const databaseIndexes = {
  users: [
    { column: 'email', unique: true },
    { column: 'id', unique: true },
    { column: 'role' },
    { column: 'createdAt' },
  ],
  contracts: [
    { column: 'id', unique: true },
    { column: 'artistId' },
    { column: 'venueId' },
    { column: 'bookingId' },
    { column: 'status' },
    { column: 'createdAt' },
    { column: 'signedAt' },
  ],
  bookings: [
    { column: 'id', unique: true },
    { column: 'artistId' },
    { column: 'venueId' },
    { column: 'status' },
    { column: 'eventDate' },
    { column: 'createdAt' },
  ],
  signatures: [
    { column: 'id', unique: true },
    { column: 'contractId' },
    { column: 'userId' },
    { column: 'signedAt' },
    { column: 'certificateNumber', unique: true },
  ],
  supportTickets: [
    { column: 'id', unique: true },
    { column: 'userId' },
    { column: 'status' },
    { column: 'priority' },
    { column: 'createdAt' },
    { column: 'updatedAt' },
  ],
  helpArticles: [
    { column: 'id', unique: true },
    { column: 'category' },
    { column: 'views' },
    { column: 'createdAt' },
  ],
  payments: [
    { column: 'id', unique: true },
    { column: 'userId' },
    { column: 'bookingId' },
    { column: 'status' },
    { column: 'createdAt' },
  ],
};

/**
 * Query optimization strategies
 */
export const queryOptimizations = {
  /**
   * Optimize user queries
   */
  users: {
    getById: {
      cache: true,
      ttl: 3600, // 1 hour
      indexes: ['id'],
    },
    getByEmail: {
      cache: true,
      ttl: 3600,
      indexes: ['email'],
    },
    listByRole: {
      cache: true,
      ttl: 1800, // 30 minutes
      indexes: ['role', 'createdAt'],
      limit: 1000,
    },
  },

  /**
   * Optimize contract queries
   */
  contracts: {
    getById: {
      cache: true,
      ttl: 3600,
      indexes: ['id'],
    },
    getByArtist: {
      cache: true,
      ttl: 1800,
      indexes: ['artistId', 'createdAt'],
    },
    getByVenue: {
      cache: true,
      ttl: 1800,
      indexes: ['venueId', 'createdAt'],
    },
    getByStatus: {
      cache: true,
      ttl: 900, // 15 minutes
      indexes: ['status', 'createdAt'],
    },
  },

  /**
   * Optimize booking queries
   */
  bookings: {
    getById: {
      cache: true,
      ttl: 3600,
      indexes: ['id'],
    },
    getByArtist: {
      cache: true,
      ttl: 1800,
      indexes: ['artistId', 'eventDate'],
    },
    getByVenue: {
      cache: true,
      ttl: 1800,
      indexes: ['venueId', 'eventDate'],
    },
    getUpcoming: {
      cache: true,
      ttl: 300, // 5 minutes
      indexes: ['eventDate'],
    },
  },

  /**
   * Optimize signature queries
   */
  signatures: {
    getById: {
      cache: true,
      ttl: 3600,
      indexes: ['id'],
    },
    getByContract: {
      cache: true,
      ttl: 3600,
      indexes: ['contractId'],
    },
    getByCertificate: {
      cache: true,
      ttl: 3600,
      indexes: ['certificateNumber'],
    },
  },

  /**
   * Optimize support ticket queries
   */
  supportTickets: {
    getById: {
      cache: true,
      ttl: 1800,
      indexes: ['id'],
    },
    getByUser: {
      cache: true,
      ttl: 900,
      indexes: ['userId', 'createdAt'],
    },
    getByStatus: {
      cache: true,
      ttl: 600, // 10 minutes
      indexes: ['status', 'priority'],
    },
  },
};

/**
 * Connection pool configuration
 */
export const connectionPoolConfig = {
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
};

/**
 * Database optimization recommendations
 */
export const optimizationRecommendations = {
  indexes: [
    'Create indexes on frequently queried columns (id, email, status, dates)',
    'Create composite indexes for common WHERE + ORDER BY combinations',
    'Monitor index usage and remove unused indexes',
    'Rebuild fragmented indexes periodically',
  ],
  queries: [
    'Use SELECT specific columns instead of SELECT *',
    'Use LIMIT to restrict result sets',
    'Use pagination for large datasets',
    'Avoid N+1 queries with proper joins',
    'Use prepared statements to prevent SQL injection',
  ],
  caching: [
    'Cache frequently accessed data (user profiles, settings)',
    'Use short TTLs for data that changes frequently',
    'Implement cache invalidation on data updates',
    'Monitor cache hit rates and adjust TTLs',
  ],
  connections: [
    'Use connection pooling to reuse connections',
    'Set appropriate pool size based on workload',
    'Monitor connection usage and adjust limits',
    'Close idle connections to free resources',
  ],
  monitoring: [
    'Monitor slow queries (> 1 second)',
    'Track query execution times',
    'Monitor connection pool utilization',
    'Set up alerts for performance degradation',
  ],
};

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  queryCount: number;
  totalQueryTime: number;
  averageQueryTime: number;
  slowQueryCount: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  lastUpdated: Date;
}

/**
 * Database optimization service
 */
export class DatabaseOptimizationService {
  private queryCache: QueryCache;
  private metrics: PerformanceMetrics;

  constructor() {
    this.queryCache = new QueryCache(300, 60);
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      slowQueryCount: 0,
      cacheHitRate: 0,
      connectionPoolUtilization: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get query cache
   */
  getQueryCache(): QueryCache {
    return this.queryCache;
  }

  /**
   * Track query execution
   */
  trackQuery(queryTime: number): void {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += queryTime;
    this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.queryCount;

    if (queryTime > 1000) {
      this.metrics.slowQueryCount++;
    }

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const cacheStats = this.queryCache.getStats();
    return {
      ...this.metrics,
      cacheHitRate: cacheStats.hitRate,
    };
  }

  /**
   * Get optimization recommendations based on metrics
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.slowQueryCount > metrics.queryCount * 0.1) {
      suggestions.push('High number of slow queries detected. Review query optimization.');
    }

    if (metrics.cacheHitRate < 0.5) {
      suggestions.push('Low cache hit rate. Consider increasing cache TTL or caching more queries.');
    }

    if (metrics.averageQueryTime > 100) {
      suggestions.push('High average query time. Review database indexes and query plans.');
    }

    return suggestions;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      slowQueryCount: 0,
      cacheHitRate: 0,
      connectionPoolUtilization: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * SQL index creation statements
 */
export const indexCreationSQL = {
  users: [
    'CREATE UNIQUE INDEX idx_users_email ON users(email);',
    'CREATE INDEX idx_users_role ON users(role);',
    'CREATE INDEX idx_users_created_at ON users(created_at);',
  ],
  contracts: [
    'CREATE UNIQUE INDEX idx_contracts_id ON contracts(id);',
    'CREATE INDEX idx_contracts_artist_id ON contracts(artist_id);',
    'CREATE INDEX idx_contracts_venue_id ON contracts(venue_id);',
    'CREATE INDEX idx_contracts_status ON contracts(status);',
    'CREATE INDEX idx_contracts_created_at ON contracts(created_at);',
    'CREATE INDEX idx_contracts_signed_at ON contracts(signed_at);',
  ],
  bookings: [
    'CREATE UNIQUE INDEX idx_bookings_id ON bookings(id);',
    'CREATE INDEX idx_bookings_artist_id ON bookings(artist_id);',
    'CREATE INDEX idx_bookings_venue_id ON bookings(venue_id);',
    'CREATE INDEX idx_bookings_status ON bookings(status);',
    'CREATE INDEX idx_bookings_event_date ON bookings(event_date);',
  ],
  signatures: [
    'CREATE UNIQUE INDEX idx_signatures_id ON signatures(id);',
    'CREATE INDEX idx_signatures_contract_id ON signatures(contract_id);',
    'CREATE UNIQUE INDEX idx_signatures_certificate ON signatures(certificate_number);',
  ],
};
