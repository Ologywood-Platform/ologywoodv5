import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { 
  users, artistProfiles, venueProfiles, bookings, 
  availability, favorites, riderTemplates, bookingTemplates,
  reviews, contracts, messages, subscriptions
} from '../drizzle/schema';

/**
 * Database Schema Validation Tests
 * Ensures that database functions use correct column names matching the actual schema
 * This prevents runtime errors from schema mismatches
 */

describe('Database Schema Validation', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
  });

  describe('Favorites Table Schema', () => {
    it('should have venueId column (not userId)', async () => {
      const columns = favorites._.columns;
      expect(columns).toHaveProperty('venueId');
      expect(columns).not.toHaveProperty('userId');
    });

    it('should have artistId and createdAt columns', async () => {
      const columns = favorites._.columns;
      expect(columns).toHaveProperty('artistId');
      expect(columns).toHaveProperty('createdAt');
    });
  });

  describe('Booking Templates Table Schema', () => {
    it('should have venueId column', async () => {
      const columns = bookingTemplates._.columns;
      expect(columns).toHaveProperty('venueId');
    });

    it('should NOT have userId column', async () => {
      const columns = bookingTemplates._.columns;
      expect(columns).not.toHaveProperty('userId');
    });
  });

  describe('Artist Profiles Table Schema', () => {
    it('should have userId column', async () => {
      const columns = artistProfiles._.columns;
      expect(columns).toHaveProperty('userId');
    });

    it('should have artistName column', async () => {
      const columns = artistProfiles._.columns;
      expect(columns).toHaveProperty('artistName');
    });
  });

  describe('Venue Profiles Table Schema', () => {
    it('should have userId column', async () => {
      const columns = venueProfiles._.columns;
      expect(columns).toHaveProperty('userId');
    });

    it('should have organizationName column', async () => {
      const columns = venueProfiles._.columns;
      expect(columns).toHaveProperty('organizationName');
    });
  });

  describe('Bookings Table Schema', () => {
    it('should have artistId and venueId columns', async () => {
      const columns = bookings._.columns;
      expect(columns).toHaveProperty('artistId');
      expect(columns).toHaveProperty('venueId');
    });

    it('should have status column', async () => {
      const columns = bookings._.columns;
      expect(columns).toHaveProperty('status');
    });
  });

  describe('Availability Table Schema', () => {
    it('should have artistId column', async () => {
      const columns = availability._.columns;
      expect(columns).toHaveProperty('artistId');
    });

    it('should have date and status columns', async () => {
      const columns = availability._.columns;
      expect(columns).toHaveProperty('date');
      expect(columns).toHaveProperty('status');
    });
  });

  describe('Rider Templates Table Schema', () => {
    it('should have artistId column', async () => {
      const columns = riderTemplates._.columns;
      expect(columns).toHaveProperty('artistId');
    });

    it('should have templateName column', async () => {
      const columns = riderTemplates._.columns;
      expect(columns).toHaveProperty('templateName');
    });
  });

  describe('Reviews Table Schema', () => {
    it('should have artistId, venueId, and bookingId columns', async () => {
      const columns = reviews._.columns;
      expect(columns).toHaveProperty('artistId');
      expect(columns).toHaveProperty('venueId');
      expect(columns).toHaveProperty('bookingId');
    });
  });

  describe('Contracts Table Schema', () => {
    it('should have bookingId and artistId columns', async () => {
      const columns = contracts._.columns;
      expect(columns).toHaveProperty('bookingId');
      expect(columns).toHaveProperty('artistId');
    });
  });

  describe('Messages Table Schema', () => {
    it('should have bookingId column', async () => {
      const columns = messages._.columns;
      expect(columns).toHaveProperty('bookingId');
    });
  });

  describe('Subscriptions Table Schema', () => {
    it('should have userId column', async () => {
      const columns = subscriptions._.columns;
      expect(columns).toHaveProperty('userId');
    });
  });

  describe('Users Table Schema', () => {
    it('should have email and role columns', async () => {
      const columns = users._.columns;
      expect(columns).toHaveProperty('email');
      expect(columns).toHaveProperty('role');
    });
  });
});
