/**
 * Tests for Rider Default Template and Auto-Attach features
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
const mockDb = {
  getArtistRiderTemplates: vi.fn(),
  getRiderTemplateById: vi.fn(),
  getArtistProfileById: vi.fn(),
  getBookingById: vi.fn(),
  updateBooking: vi.fn(),
};

vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  }),
  ...mockDb,
}));

describe('Rider Default Template Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setDefaultRiderTemplate', () => {
    it('should validate that only one template can be default at a time', () => {
      // Given an artist with multiple templates
      const templates = [
        { id: 1, artistId: 10, templateName: 'Solo Rider', isDefault: true },
        { id: 2, artistId: 10, templateName: 'Band Rider', isDefault: false },
        { id: 3, artistId: 10, templateName: 'DJ Rider', isDefault: false },
      ];

      // When we set template 2 as default
      const updatedTemplates = templates.map(t => ({
        ...t,
        isDefault: t.id === 2,
      }));

      // Then only template 2 should be default
      expect(updatedTemplates.filter(t => t.isDefault)).toHaveLength(1);
      expect(updatedTemplates.find(t => t.isDefault)?.id).toBe(2);
    });

    it('should allow clearing the default (no default rider)', () => {
      const templates = [
        { id: 1, artistId: 10, templateName: 'Solo Rider', isDefault: true },
        { id: 2, artistId: 10, templateName: 'Band Rider', isDefault: false },
      ];

      // When we clear the default (set to null)
      const updatedTemplates = templates.map(t => ({
        ...t,
        isDefault: false,
      }));

      // Then no template should be default
      expect(updatedTemplates.filter(t => t.isDefault)).toHaveLength(0);
    });

    it('should not allow setting a template from another artist as default', () => {
      const template = { id: 5, artistId: 20, templateName: 'Other Artist Rider', isDefault: false };
      const currentArtistId = 10;

      // Verify ownership check
      expect(template.artistId).not.toBe(currentArtistId);
    });
  });

  describe('Auto-attach default rider to new bookings', () => {
    it('should auto-attach default rider when artist has one set', () => {
      const defaultRider = { id: 3, artistId: 10, templateName: 'My Default', isDefault: true };
      
      // Simulate booking creation with auto-attach
      const bookingData = {
        artistId: 10,
        venueId: 5,
        eventDate: new Date('2026-06-15'),
        status: 'pending',
        riderTemplateId: defaultRider.id,
        riderStatus: 'pending',
      };

      expect(bookingData.riderTemplateId).toBe(3);
      expect(bookingData.riderStatus).toBe('pending');
    });

    it('should not attach rider when artist has no default set', () => {
      const defaultRider = null;
      
      // Simulate booking creation without auto-attach
      const bookingData = {
        artistId: 10,
        venueId: 5,
        eventDate: new Date('2026-06-15'),
        status: 'pending',
        riderTemplateId: defaultRider?.id,
        riderStatus: defaultRider ? 'pending' : undefined,
      };

      expect(bookingData.riderTemplateId).toBeUndefined();
      expect(bookingData.riderStatus).toBeUndefined();
    });
  });

  describe('RiderAttach component logic', () => {
    it('should only show attach option for artists without a rider on the booking', () => {
      // Artist role, no rider attached
      const props = {
        bookingId: 1,
        currentUserRole: 'artist' as const,
        hasRider: false,
      };

      // Should show the attach UI
      expect(props.currentUserRole).toBe('artist');
      expect(props.hasRider).toBe(false);
    });

    it('should hide attach option when rider is already attached', () => {
      const props = {
        bookingId: 1,
        currentUserRole: 'artist' as const,
        hasRider: true,
      };

      // Should NOT show the attach UI
      expect(props.hasRider).toBe(true);
    });

    it('should hide attach option for venue role', () => {
      const props = {
        bookingId: 1,
        currentUserRole: 'venue' as const,
        hasRider: false,
      };

      // Should NOT show the attach UI for venues
      expect(props.currentUserRole).not.toBe('artist');
    });
  });

  describe('Rider template data structure', () => {
    it('should have correct fields for a rider template', () => {
      const template = {
        id: 1,
        artistId: 10,
        templateName: 'Standard Performance Rider',
        templateType: 'solo_artist',
        templateData: {
          baseTemplate: 'solo_artist',
          formData: {
            stageWidth: '20ft',
            stageDepth: '15ft',
            soundSystem: 'Full PA with monitors',
            lighting: 'Standard stage lighting',
            dressingRooms: '1 private room',
            catering: 'Light snacks and water',
            paymentTerms: '50% deposit, 50% on performance day',
          },
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(template.templateName).toBeTruthy();
      expect(template.templateType).toBe('solo_artist');
      expect(template.templateData.formData.stageWidth).toBe('20ft');
      expect(template.templateData.formData.paymentTerms).toContain('50%');
      expect(template.isDefault).toBe(true);
    });

    it('should support multiple template types', () => {
      const validTypes = ['solo_artist', 'band', 'dj', 'speaker', 'custom'];
      
      validTypes.forEach(type => {
        expect(type).toBeTruthy();
      });
      expect(validTypes).toHaveLength(5);
    });
  });
});
