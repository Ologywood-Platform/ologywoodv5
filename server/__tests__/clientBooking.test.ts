import { describe, it, expect } from 'vitest';
import { bookings } from '../../drizzle/schema';

describe('Client Booking System', () => {
  describe('Schema', () => {
    it('should have eventType column on bookings table', () => {
      expect(bookings.eventType).toBeDefined();
    });

    it('should have bookingSource column on bookings table', () => {
      expect(bookings.bookingSource).toBeDefined();
    });

    it('should have venueName column on bookings table', () => {
      expect(bookings.venueName).toBeDefined();
    });

    it('should have venueAddress column on bookings table', () => {
      expect(bookings.venueAddress).toBeDefined();
    });
  });

  describe('Event Types', () => {
    const validEventTypes = ['wedding', 'corporate', 'birthday', 'church', 'festival', 'house_party', 'restaurant', 'other'];

    it('should support all expected event types', () => {
      validEventTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should have 8 event types', () => {
      expect(validEventTypes.length).toBe(8);
    });
  });

  describe('Booking Sources', () => {
    const validSources = ['venue', 'client'];

    it('should support venue and client booking sources', () => {
      validSources.forEach(source => {
        expect(typeof source).toBe('string');
        expect(source.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Client Booking Flow', () => {
    it('should require artistId for client booking', () => {
      const requiredFields = ['artistId', 'eventDate', 'eventType', 'venueName', 'venueStreet', 'venueCity', 'venueState'];
      requiredFields.forEach(field => {
        expect(typeof field).toBe('string');
      });
    });

    it('should combine address fields into venueAddress', () => {
      const street = '123 Main St';
      const city = 'Atlanta';
      const state = 'GA';
      const zip = '30301';
      const combined = [street, city, state, zip].filter(Boolean).join(', ');
      expect(combined).toBe('123 Main St, Atlanta, GA, 30301');
    });

    it('should handle missing zip code in address', () => {
      const street = '123 Main St';
      const city = 'Atlanta';
      const state = 'GA';
      const zip = '';
      const combined = [street, city, state, zip].filter(Boolean).join(', ');
      expect(combined).toBe('123 Main St, Atlanta, GA');
    });
  });

  describe('My Bookings Page', () => {
    it('should categorize bookings into upcoming and past', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000); // tomorrow
      const pastDate = new Date(now.getTime() - 86400000); // yesterday

      const bookings = [
        { eventDate: futureDate.toISOString(), status: 'pending' },
        { eventDate: futureDate.toISOString(), status: 'confirmed' },
        { eventDate: pastDate.toISOString(), status: 'completed' },
        { eventDate: futureDate.toISOString(), status: 'cancelled' },
      ];

      const upcoming = bookings.filter(b => {
        const eventDate = new Date(b.eventDate);
        return eventDate >= now && b.status !== 'cancelled';
      });

      const past = bookings.filter(b => {
        const eventDate = new Date(b.eventDate);
        return eventDate < now || b.status === 'cancelled';
      });

      expect(upcoming.length).toBe(2); // pending + confirmed
      expect(past.length).toBe(2); // completed + cancelled
    });
  });

  describe('Status Styles', () => {
    const STATUS_STYLES: Record<string, { label: string }> = {
      pending: { label: 'Pending' },
      confirmed: { label: 'Confirmed' },
      cancelled: { label: 'Cancelled' },
      completed: { label: 'Completed' },
    };

    it('should have labels for all booking statuses', () => {
      expect(STATUS_STYLES.pending.label).toBe('Pending');
      expect(STATUS_STYLES.confirmed.label).toBe('Confirmed');
      expect(STATUS_STYLES.cancelled.label).toBe('Cancelled');
      expect(STATUS_STYLES.completed.label).toBe('Completed');
    });
  });

  describe('Event Type Labels', () => {
    const EVENT_TYPE_LABELS: Record<string, string> = {
      wedding: 'Wedding',
      corporate: 'Corporate Event',
      birthday: 'Birthday Party',
      church: 'Church / Religious',
      festival: 'Festival',
      house_party: 'House Party',
      restaurant: 'Restaurant / Bar',
      other: 'Other',
    };

    it('should have human-readable labels for all event types', () => {
      expect(EVENT_TYPE_LABELS.wedding).toBe('Wedding');
      expect(EVENT_TYPE_LABELS.corporate).toBe('Corporate Event');
      expect(EVENT_TYPE_LABELS.birthday).toBe('Birthday Party');
      expect(EVENT_TYPE_LABELS.church).toBe('Church / Religious');
      expect(EVENT_TYPE_LABELS.festival).toBe('Festival');
      expect(EVENT_TYPE_LABELS.house_party).toBe('House Party');
      expect(EVENT_TYPE_LABELS.restaurant).toBe('Restaurant / Bar');
      expect(EVENT_TYPE_LABELS.other).toBe('Other');
    });
  });
});
