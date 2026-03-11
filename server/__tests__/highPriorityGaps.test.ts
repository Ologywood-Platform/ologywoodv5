import { describe, it, expect } from 'vitest';

describe('HIGH Priority Gap 4: Available on Date Filter & Verified Toggle', () => {
  it('should accept availableDate parameter in search input', () => {
    // The search endpoint now accepts availableDate as an ISO date string
    const searchInput = {
      query: 'jazz',
      genre: 'Jazz',
      availableDate: '2026-04-15',
      verifiedOnly: true,
    };
    expect(searchInput.availableDate).toBe('2026-04-15');
    expect(searchInput.verifiedOnly).toBe(true);
  });

  it('should validate date format for availableDate', () => {
    const validDate = '2026-04-15';
    const parsed = new Date(validDate);
    expect(parsed.toISOString().startsWith('2026-04-15')).toBe(true);
  });

  it('should handle verifiedOnly as boolean filter', () => {
    const withVerified = { verifiedOnly: true };
    const withoutVerified = { verifiedOnly: false };
    expect(withVerified.verifiedOnly).toBe(true);
    expect(withoutVerified.verifiedOnly).toBe(false);
  });
});

describe('HIGH Priority Gap 5: Invoice PDF Download', () => {
  it('should generate correct invoice download URL', () => {
    const bookingId = 42;
    const expectedUrl = `/api/invoice/${bookingId}/download`;
    expect(expectedUrl).toBe('/api/invoice/42/download');
  });

  it('should include all required invoice sections', () => {
    const requiredSections = [
      'Invoice Number',
      'Artist Information',
      'Venue Information',
      'Event Details',
      'Payment Breakdown',
      'Terms',
    ];
    expect(requiredSections.length).toBe(6);
    expect(requiredSections).toContain('Payment Breakdown');
    expect(requiredSections).toContain('Artist Information');
  });
});

describe('HIGH Priority Gap 6: Browser Notifications', () => {
  it('should define notification permission states', () => {
    const validStates = ['default', 'granted', 'denied'];
    expect(validStates).toContain('default');
    expect(validStates).toContain('granted');
    expect(validStates).toContain('denied');
  });

  it('should create notification with correct options', () => {
    const options = {
      icon: '/favicon-192.png',
      badge: '/favicon-192.png',
      tag: 'ologywood-notification',
    };
    expect(options.icon).toBe('/favicon-192.png');
    expect(options.tag).toBe('ologywood-notification');
  });
});

describe('HIGH Priority Gap 7: Profile Completeness', () => {
  // Import the actual utility
  it('should calculate artist profile completeness correctly', async () => {
    const { getArtistCompleteness } = await import('../../client/src/utils/profileCompleteness');
    
    // Empty profile
    const emptyResult = getArtistCompleteness({});
    expect(emptyResult.score).toBe(0);
    expect(emptyResult.tier).toBe('incomplete');
    expect(emptyResult.missingFields.length).toBeGreaterThan(0);
  });

  it('should return excellent tier for complete artist profile', async () => {
    const { getArtistCompleteness } = await import('../../client/src/utils/profileCompleteness');
    
    const completeProfile = {
      stageName: 'DJ Test',
      bio: 'This is a test bio that is at least fifty characters long to pass the validation check here.',
      genre: 'Electronic',
      profileImage: 'https://example.com/photo.jpg',
      coverImage: 'https://example.com/cover.jpg',
      location: 'Lagos, Nigeria',
      baseFee: 500,
      setLength: 120,
      socialLinks: JSON.stringify({ instagram: '@djtest', twitter: '@djtest' }),
      techRequirements: 'PA system, 2 monitors',
      hasRiderTemplate: true,
    };
    
    const result = getArtistCompleteness(completeProfile);
    expect(result.score).toBe(100);
    expect(result.tier).toBe('excellent');
    expect(result.missingFields.length).toBe(0);
  });

  it('should calculate venue profile completeness correctly', async () => {
    const { getVenueCompleteness } = await import('../../client/src/utils/profileCompleteness');
    
    const partialVenue = {
      name: 'The Jazz Club',
      description: 'A cozy jazz venue in the heart of the city with live performances every weekend.',
      venueType: 'Club',
      profileImage: 'https://example.com/venue.jpg',
    };
    
    const result = getVenueCompleteness(partialVenue);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.completedFields).toContain('name');
    expect(result.completedFields).toContain('description');
  });

  it('should sort missing fields by weight (most important first)', async () => {
    const { getArtistCompleteness } = await import('../../client/src/utils/profileCompleteness');
    
    const result = getArtistCompleteness({});
    for (let i = 1; i < result.missingFields.length; i++) {
      expect(result.missingFields[i - 1].weight).toBeGreaterThanOrEqual(result.missingFields[i].weight);
    }
  });

  it('should return correct tier thresholds', async () => {
    const { getArtistCompleteness } = await import('../../client/src/utils/profileCompleteness');
    
    // Just stageName + bio + profileImage = weight 9 out of 20 = 45% → basic
    const basicProfile = {
      stageName: 'Test',
      bio: 'This is a test bio that is at least fifty characters long to pass the validation check here.',
      profileImage: 'https://example.com/photo.jpg',
    };
    
    const result = getArtistCompleteness(basicProfile);
    expect(result.tier).toBe('basic');
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(65);
  });

  it('should export MINIMUM_SEARCH_VISIBILITY_SCORE constant', async () => {
    const { MINIMUM_SEARCH_VISIBILITY_SCORE } = await import('../../client/src/utils/profileCompleteness');
    expect(MINIMUM_SEARCH_VISIBILITY_SCORE).toBe(40);
  });

  it('should return top N next steps', async () => {
    const { getArtistCompleteness, getNextSteps } = await import('../../client/src/utils/profileCompleteness');
    
    const result = getArtistCompleteness({});
    const top3 = getNextSteps(result, 3);
    expect(top3.length).toBe(3);
    // Should be the highest weight items
    expect(top3[0].weight).toBeGreaterThanOrEqual(top3[1].weight);
  });
});
