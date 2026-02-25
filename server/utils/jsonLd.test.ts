import { describe, it, expect } from 'vitest';
import {
  generateArtistJsonLd,
  generateVenueJsonLd,
  generateEventJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  jsonLdToScriptTag,
} from './jsonLd';

describe('JSON-LD Structured Data Generators', () => {
  describe('generateArtistJsonLd', () => {
    it('should generate valid MusicGroup schema with all fields', () => {
      const artist = {
        id: 1,
        artistName: 'The Amazing Band',
        bio: 'A great band from LA.',
        genre: ['Rock', 'Alternative'],
        location: 'Los Angeles, CA',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        averageRating: '4.5',
        reviewCount: 12,
      };
      const result = generateArtistJsonLd(artist, 'https://www.ologywood.com') as any;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('MusicGroup');
      expect(result.name).toBe('The Amazing Band');
      expect(result.url).toBe('https://www.ologywood.com/artist/1');
      expect(result.description).toBe('A great band from LA.');
      expect(result.image).toBe('https://example.com/photo.jpg');
      expect(result.genre).toEqual(['Rock', 'Alternative']);
      expect(result.location['@type']).toBe('Place');
      expect(result.location.name).toBe('Los Angeles, CA');
      expect(result.aggregateRating.ratingValue).toBe('4.5');
      expect(result.aggregateRating.ratingCount).toBe(12);
      expect(result.memberOf.name).toBe('Ologywood');
    });

    it('should omit optional fields when not provided', () => {
      const artist = { id: 2, artistName: 'Solo Act' };
      const result = generateArtistJsonLd(artist) as any;

      expect(result.name).toBe('Solo Act');
      expect(result.description).toBeUndefined();
      expect(result.image).toBeUndefined();
      expect(result.genre).toBeUndefined();
      expect(result.location).toBeUndefined();
      expect(result.aggregateRating).toBeUndefined();
    });

    it('should not include aggregateRating when rating is 0', () => {
      const artist = { id: 3, artistName: 'New Artist', averageRating: '0', reviewCount: 0 };
      const result = generateArtistJsonLd(artist) as any;

      expect(result.aggregateRating).toBeUndefined();
    });

    it('should truncate long bios to 500 characters', () => {
      const longBio = 'A'.repeat(600);
      const artist = { id: 4, artistName: 'Verbose Artist', bio: longBio };
      const result = generateArtistJsonLd(artist) as any;

      expect(result.description.length).toBe(500);
    });
  });

  describe('generateVenueJsonLd', () => {
    it('should generate valid EventVenue schema with all fields', () => {
      const venue = {
        id: 1,
        organizationName: 'The Blue Room',
        bio: 'Intimate live music venue.',
        location: 'Los Angeles, CA',
        profilePhotoUrl: 'https://example.com/venue.jpg',
        venueType: 'Club',
        capacity: 300,
        averageRating: '4.8',
        reviewCount: 24,
      };
      const result = generateVenueJsonLd(venue, 'https://www.ologywood.com') as any;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('EventVenue');
      expect(result.name).toBe('The Blue Room');
      expect(result.url).toBe('https://www.ologywood.com/venue/1');
      expect(result.description).toBe('Intimate live music venue.');
      expect(result.address.addressLocality).toBe('Los Angeles, CA');
      expect(result.maximumAttendeeCapacity).toBe(300);
      expect(result.additionalType).toBe('Club');
      expect(result.aggregateRating.ratingValue).toBe('4.8');
    });

    it('should omit optional fields when not provided', () => {
      const venue = { id: 2, organizationName: 'Simple Venue' };
      const result = generateVenueJsonLd(venue) as any;

      expect(result.name).toBe('Simple Venue');
      expect(result.address).toBeUndefined();
      expect(result.maximumAttendeeCapacity).toBeUndefined();
      expect(result.aggregateRating).toBeUndefined();
    });
  });

  describe('generateEventJsonLd', () => {
    it('should generate valid Event schema with all fields', () => {
      const event = {
        id: 1,
        eventTitle: 'Summer Festival',
        description: 'A great summer event.',
        eventDate: '2026-06-15',
        eventTime: '18:00',
        eventEndTime: '23:00',
        location: 'Central Park, NY',
        eventType: 'festival',
        capacity: 500,
        rate: '50',
        artistName: 'The Amazing Band',
      };
      const result = generateEventJsonLd(event, 'https://www.ologywood.com') as any;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Event');
      expect(result.name).toBe('Summer Festival');
      expect(result.url).toBe('https://www.ologywood.com/events/1');
      expect(result.startDate).toBe('2026-06-15T18:00');
      expect(result.endDate).toBe('2026-06-15T23:00');
      expect(result.location.name).toBe('Central Park, NY');
      expect(result.performer.name).toBe('The Amazing Band');
      expect(result.offers.price).toBe('50');
      expect(result.maximumAttendeeCapacity).toBe(500);
    });

    it('should use date only when no time provided', () => {
      const event = { id: 2, eventTitle: 'Simple Event', eventDate: '2026-07-01' };
      const result = generateEventJsonLd(event) as any;

      expect(result.startDate).toBe('2026-07-01');
      expect(result.endDate).toBeUndefined();
    });

    it('should omit performer when no artist name', () => {
      const event = { id: 3, eventTitle: 'Open Mic Night' };
      const result = generateEventJsonLd(event) as any;

      expect(result.performer).toBeUndefined();
    });
  });

  describe('generateOrganizationJsonLd', () => {
    it('should generate valid Organization schema', () => {
      const result = generateOrganizationJsonLd('https://www.ologywood.com') as any;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Organization');
      expect(result.name).toBe('Ologywood');
      expect(result.url).toBe('https://www.ologywood.com');
      expect(result.logo).toBeDefined();
      expect(result.contactPoint.contactType).toBe('customer service');
    });
  });

  describe('generateWebSiteJsonLd', () => {
    it('should generate valid WebSite schema with SearchAction', () => {
      const result = generateWebSiteJsonLd('https://www.ologywood.com') as any;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('WebSite');
      expect(result.name).toBe('Ologywood');
      expect(result.potentialAction['@type']).toBe('SearchAction');
      expect(result.potentialAction.target.urlTemplate).toContain('/browse?search=');
    });
  });

  describe('jsonLdToScriptTag', () => {
    it('should generate a valid script tag', () => {
      const data = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Test' };
      const result = jsonLdToScriptTag(data);

      expect(result).toContain('<script type="application/ld+json">');
      expect(result).toContain('"@context":"https://schema.org"');
      expect(result).toContain('</script>');
    });

    it('should handle arrays of JSON-LD objects', () => {
      const data = [
        { '@type': 'Organization', name: 'Org' },
        { '@type': 'WebSite', name: 'Site' },
      ];
      const result = jsonLdToScriptTag(data);

      expect(result.match(/<script/g)?.length).toBe(2);
      expect(result).toContain('"Organization"');
      expect(result).toContain('"WebSite"');
    });
  });
});
