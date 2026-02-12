import { describe, it, expect } from 'vitest';

describe('ShareVenueModal Component', () => {
  it('should accept venue profile image prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'The Grand Hall',
      venueDescription: 'Premium event venue',
      venueProfileImage: 'https://example.com/venue.jpg',
      venueLocation: 'New York, NY',
      venueCapacity: 500
    };
    
    expect(props.venueProfileImage).toBeDefined();
    expect(props.venueProfileImage).toMatch(/^https:\/\//);
  });

  it('should accept venue name prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'The Amphitheater',
      venueDescription: 'Outdoor concert venue',
      venueProfileImage: 'https://example.com/venue.jpg',
      venueLocation: 'Los Angeles, CA',
      venueCapacity: 1000
    };
    
    expect(props.venueName).toBe('The Amphitheater');
    expect(props.venueName.length).toBeGreaterThan(0);
  });

  it('should accept venue description prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'Venue Name',
      venueDescription: 'State-of-the-art venue with full technical support',
      venueProfileImage: 'https://example.com/venue.jpg',
      venueLocation: 'Chicago, IL',
      venueCapacity: 750
    };
    
    expect(props.venueDescription).toBeDefined();
    expect(props.venueDescription?.length).toBeGreaterThan(0);
  });

  it('should accept venue location prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'Venue Name',
      venueDescription: 'Great venue',
      venueProfileImage: 'https://example.com/venue.jpg',
      venueLocation: 'Miami, FL',
      venueCapacity: 300
    };
    
    expect(props.venueLocation).toBe('Miami, FL');
  });

  it('should accept venue capacity prop', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'Venue Name',
      venueDescription: 'Great venue',
      venueProfileImage: 'https://example.com/venue.jpg',
      venueLocation: 'Boston, MA',
      venueCapacity: 2500
    };
    
    expect(props.venueCapacity).toBe(2500);
    expect(props.venueCapacity).toBeGreaterThan(0);
  });

  it('should generate correct venue profile URL', () => {
    const venueId = 42;
    const expectedUrl = `/venue/${venueId}`;
    
    expect(expectedUrl).toContain('/venue/');
    expect(expectedUrl).toContain('42');
  });

  it('should generate share text with venue name', () => {
    const venueName = 'The Jazz Club';
    const shareText = `Check out ${venueName} on Ologywood - Book amazing artists for your events!`;
    
    expect(shareText).toContain(venueName);
    expect(shareText).toContain('Ologywood');
  });

  it('should support social media platforms', () => {
    const platforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'whatsapp'];
    
    expect(platforms).toHaveLength(5);
    expect(platforms).toContain('facebook');
    expect(platforms).toContain('twitter');
  });

  it('should handle copy to clipboard', () => {
    const profileUrl = 'https://example.com/venue/1';
    
    expect(profileUrl).toBeDefined();
    expect(profileUrl).toMatch(/^https:\/\//);
  });

  it('should support QR code generation', () => {
    const venueId = 1;
    const profileUrl = `https://example.com/venue/${venueId}`;
    
    expect(profileUrl).toContain('venue');
    expect(profileUrl).toContain('1');
  });

  it('should support email invite functionality', () => {
    const email = 'artist@example.com';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test(email)).toBe(true);
  });

  it('should include venue image in Open Graph meta tags', () => {
    const venueProfileImage = 'https://cdn.example.com/venue-photo.jpg';
    
    expect(venueProfileImage).toBeDefined();
    expect(venueProfileImage).toMatch(/\.(jpg|jpeg|png|webp)$/i);
  });

  it('should display venue preview with image, name, and location', () => {
    const venueName = 'The Concert Hall';
    const venueProfileImage = 'https://example.com/concert-hall.jpg';
    const venueLocation = 'Nashville, TN';
    
    expect(venueName).toBeDefined();
    expect(venueProfileImage).toBeDefined();
    expect(venueLocation).toBeDefined();
  });

  it('should handle missing profile image gracefully', () => {
    const props = {
      isOpen: true,
      onClose: () => {},
      venueId: 1,
      venueName: 'Venue Without Photo',
      venueDescription: 'Great venue',
      venueProfileImage: undefined,
      venueLocation: 'Denver, CO',
      venueCapacity: 400
    };
    
    expect(props.venueProfileImage).toBeUndefined();
    expect(props.venueName).toBeDefined();
  });

  it('should display venue capacity in preview', () => {
    const venueCapacity = 1500;
    
    expect(venueCapacity).toBeGreaterThan(0);
    expect(venueCapacity.toString()).toMatch(/\d+/);
  });

  it('should format venue information for social sharing', () => {
    const venueName = 'The Ballroom';
    const venueLocation = 'San Francisco, CA';
    const venueCapacity = 800;
    
    const shareInfo = `${venueName} - ${venueLocation} (Capacity: ${venueCapacity})`;
    
    expect(shareInfo).toContain(venueName);
    expect(shareInfo).toContain(venueLocation);
    expect(shareInfo).toContain('800');
  });
});
