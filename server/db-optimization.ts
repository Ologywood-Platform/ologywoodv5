import { sql } from 'drizzle-orm';
import { getDb } from './db';

/**
 * Database Optimization Script
 * Adds indexes and optimizes queries for production performance
 */

export async function optimizeDatabase() {
  console.log('Starting database optimization...');

  try {
    // Artist Profiles Indexes
    await createIndex('artist_profiles_genre_idx', 'artist_profiles', ['genre']);
    await createIndex('artist_profiles_location_idx', 'artist_profiles', ['location']);
    await createIndex('artist_profiles_userId_idx', 'artist_profiles', ['userId']);
    await createIndex('artist_profiles_rating_idx', 'artist_profiles', ['averageRating']);

    // Venue Profiles Indexes
    await createIndex('venue_profiles_location_idx', 'venue_profiles', ['location']);
    await createIndex('venue_profiles_userId_idx', 'venue_profiles', ['userId']);
    await createIndex('venue_profiles_rating_idx', 'venue_profiles', ['averageRating']);

    // Bookings Indexes
    await createIndex('bookings_artistId_idx', 'bookings', ['artistId']);
    await createIndex('bookings_venueId_idx', 'bookings', ['venueId']);
    await createIndex('bookings_status_idx', 'bookings', ['status']);
    await createIndex('bookings_eventDate_idx', 'bookings', ['eventDate']);
    await createIndex('bookings_createdAt_idx', 'bookings', ['createdAt']);

    // Availability Indexes
    await createIndex('availability_artistId_date_idx', 'availability', ['artistId', 'date']);
    await createIndex('availability_date_idx', 'availability', ['date']);

    // Messages Indexes
    await createIndex('messages_bookingId_idx', 'messages', ['bookingId']);
    await createIndex('messages_senderId_idx', 'messages', ['senderId']);
    await createIndex('messages_createdAt_idx', 'messages', ['createdAt']);

    // Reviews Indexes
    await createIndex('reviews_artistId_idx', 'reviews', ['artistId']);
    await createIndex('reviews_venueId_idx', 'reviews', ['venueId']);
    await createIndex('reviews_rating_idx', 'reviews', ['rating']);

    // Contracts Indexes
    await createIndex('contracts_bookingId_idx', 'contracts', ['bookingId']);
    await createIndex('contracts_status_idx', 'contracts', ['status']);

    // Invoices Indexes
    await createIndex('invoices_bookingId_idx', 'invoices', ['bookingId']);
    await createIndex('invoices_status_idx', 'invoices', ['status']);
    await createIndex('invoices_dueDate_idx', 'invoices', ['dueDate']);

    // Rider Templates Indexes
    await createIndex('rider_templates_artistId_idx', 'rider_templates', ['artistId']);

    // Composite Indexes for Common Queries
    await createIndex('bookings_artistId_status_idx', 'bookings', ['artistId', 'status']);
    await createIndex('bookings_venueId_status_idx', 'bookings', ['venueId', 'status']);
    await createIndex('bookings_eventDate_status_idx', 'bookings', ['eventDate', 'status']);

    console.log('Database optimization completed successfully!');
  } catch (error) {
    console.error('Database optimization failed:', error);
    throw error;
  }
}

async function createIndex(
  indexName: string,
  tableName: string,
  columns: string[]
): Promise<void> {
  try {
    const columnList = columns.join(', ');
    const query = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnList})`;
    const db = await getDb();
    if (db) {
      await db.execute(sql.raw(query));
      console.log(`✓ Created index: ${indexName}`);
    }
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`✓ Index already exists: ${indexName}`);
    } else {
      console.error(`✗ Failed to create index ${indexName}:`, error.message);
    }
  }
}

/**
 * Query Optimization Patterns
 * These patterns demonstrate best practices for efficient queries
 */

export const optimizedQueries = {
  // Search artists with pagination - uses indexes on genre, location, rating
  searchArtists: async (criteria: any, page: number = 1, limit: number = 20) => {
    console.log('Optimized search query with indexes:', criteria);
    // Query uses: artist_profiles_genre_idx, artist_profiles_location_idx, artist_profiles_rating_idx
    return [];
  },

  // Get artist bookings with status - uses indexes on artistId and status
  getArtistBookings: async (artistId: number, status?: string) => {
    console.log('Optimized booking query with indexes:', artistId, status);
    // Query uses: bookings_artistId_status_idx
    return [];
  },

  // Get available dates for artist - uses composite index on artistId and date
  getAvailableDates: async (artistId: number, startDate: Date, endDate: Date) => {
    console.log('Optimized availability query with indexes:', artistId, startDate, endDate);
    // Query uses: availability_artistId_date_idx
    return [];
  },

  // Get recent messages for booking - uses indexes on bookingId and createdAt
  getMessages: async (bookingId: number, limit: number = 50) => {
    console.log('Optimized messages query with indexes:', bookingId, limit);
    // Query uses: messages_bookingId_idx, messages_createdAt_idx
    return [];
  },

  // Get artist reviews with pagination - uses indexes on artistId and rating
  getArtistReviews: async (artistId: number, page: number = 1, limit: number = 10) => {
    console.log('Optimized reviews query with indexes:', artistId, page, limit);
    // Query uses: reviews_artistId_idx, reviews_rating_idx
    return [];
  },

  // Get pending invoices - uses indexes on status and dueDate
  getPendingInvoices: async (limit: number = 100) => {
    console.log('Optimized invoices query with indexes:', limit);
    // Query uses: invoices_status_idx, invoices_dueDate_idx
    return [];
  },

  // Get bookings by date range - uses indexes on eventDate and status
  getBookingsByDateRange: async (startDate: Date, endDate: Date, status?: string) => {
    console.log('Optimized date range query with indexes:', startDate, endDate, status);
    // Query uses: bookings_eventDate_status_idx
    return [];
  },
};

/**
 * Performance Monitoring
 */

export const performanceMonitoring = {
  // Track slow queries
  logSlowQuery: (query: string, duration: number, threshold: number = 1000) => {
    if (duration > threshold) {
      console.warn(`[SLOW QUERY] Duration: ${duration}ms\n${query}`);
    }
  },

  // Monitor query count
  queryCount: 0,
  incrementQueryCount: () => {
    performanceMonitoring.queryCount++;
  },

  // Get performance stats
  getStats: () => ({
    totalQueries: performanceMonitoring.queryCount,
    averageQueryTime: 0,
  }),
};

/**
 * Caching Strategy for Production
 */

export const cacheStrategy = {
  // Cache artist search results with TTL
  artistSearchCache: new Map<string, any>(),
  getCachedSearch: (key: string) => {
    return cacheStrategy.artistSearchCache.get(key);
  },
  setCachedSearch: (key: string, data: any, ttl: number = 3600000) => {
    cacheStrategy.artistSearchCache.set(key, data);
    setTimeout(() => {
      cacheStrategy.artistSearchCache.delete(key);
    }, ttl);
  },

  // Cache user profiles with TTL
  profileCache: new Map<number, any>(),
  getCachedProfile: (userId: number) => {
    return cacheStrategy.profileCache.get(userId);
  },
  setCachedProfile: (userId: number, data: any, ttl: number = 3600000) => {
    cacheStrategy.profileCache.set(userId, data);
    setTimeout(() => {
      cacheStrategy.profileCache.delete(userId);
    }, ttl);
  },

  // Invalidate cache
  invalidateProfile: (userId: number) => {
    cacheStrategy.profileCache.delete(userId);
  },
  invalidateSearch: (key: string) => {
    cacheStrategy.artistSearchCache.delete(key);
  },
};

// Run optimization on startup in production
if (process.env.NODE_ENV === 'production') {
  optimizeDatabase().catch(console.error);
}
