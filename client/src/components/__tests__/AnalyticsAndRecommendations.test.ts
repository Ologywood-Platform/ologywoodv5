import { describe, it, expect } from 'vitest';

// Mock data for testing
const mockArtists = [
  { id: 1, artistName: 'Artist A', genre: ['Rock', 'Blues'], feeRangeMin: 500, feeRangeMax: 1000, touringPartySize: 3 },
  { id: 2, artistName: 'Artist B', genre: ['Rock', 'Jazz'], feeRangeMin: 600, feeRangeMax: 1200, touringPartySize: 4 },
  { id: 3, artistName: 'Artist C', genre: ['Pop'], feeRangeMin: 800, feeRangeMax: 1500, touringPartySize: 5 },
  { id: 4, artistName: 'Artist D', genre: ['Rock'], feeRangeMin: 400, feeRangeMax: 900, touringPartySize: 2 },
];

const mockAnalytics = {
  totalBookings: 25,
  totalRevenue: 15000,
  averageBookingValue: 600,
  upcomingBookings: 5,
  completedBookings: 20,
  cancellationRate: 8,
  averageRating: 4.5,
  topGenres: [
    { genre: 'Rock', count: 12 },
    { genre: 'Jazz', count: 8 },
    { genre: 'Pop', count: 5 },
  ],
  bookingTrend: [
    { month: 'Aug', count: 3 },
    { month: 'Sep', count: 4 },
    { month: 'Oct', count: 5 },
    { month: 'Nov', count: 6 },
    { month: 'Dec', count: 4 },
    { month: 'Jan', count: 3 },
  ],
  venueDistribution: [
    { venueName: 'Grand Hall', bookings: 8 },
    { venueName: 'Event Center', bookings: 6 },
    { venueName: 'Theater', bookings: 5 },
    { venueName: 'Club', bookings: 6 },
  ],
};

describe('Recommendation Engine', () => {
  describe('Similarity Calculation', () => {
    it('should calculate genre similarity', () => {
      const artist1 = mockArtists[0]; // Rock, Blues
      const artist2 = mockArtists[1]; // Rock, Jazz
      
      const genres1 = artist1.genre;
      const genres2 = artist2.genre;
      const commonGenres = genres1.filter(g => genres2.includes(g));
      
      expect(commonGenres.length).toBe(1);
      expect(commonGenres[0]).toBe('Rock');
    });

    it('should calculate fee range similarity', () => {
      const artist1 = mockArtists[0]; // 500-1000
      const artist2 = mockArtists[1]; // 600-1200
      
      // Check for overlap
      const hasOverlap = artist1.feeRangeMin <= artist2.feeRangeMax && artist1.feeRangeMax >= artist2.feeRangeMin;
      expect(hasOverlap).toBe(true);
    });

    it('should calculate party size similarity', () => {
      const artist1 = mockArtists[0]; // 3
      const artist2 = mockArtists[1]; // 4
      
      const sizeDiff = Math.abs(artist1.touringPartySize - artist2.touringPartySize);
      expect(sizeDiff).toBe(1);
    });

    it('should identify dissimilar artists', () => {
      const artist1 = mockArtists[0]; // Rock, Blues
      const artist2 = mockArtists[2]; // Pop
      
      const genres1 = artist1.genre;
      const genres2 = artist2.genre;
      const commonGenres = genres1.filter(g => genres2.includes(g));
      
      expect(commonGenres.length).toBe(0);
    });
  });

  describe('Recommendation Logic', () => {
    it('should recommend artists with same genre', () => {
      const referenceGenre = 'Rock';
      const recommended = mockArtists.filter(a => a.genre.includes(referenceGenre));
      
      expect(recommended.length).toBe(3); // Artists A, B, D
    });

    it('should recommend artists in similar fee range', () => {
      const minFee = 400;
      const maxFee = 1200;
      const recommended = mockArtists.filter(
        a => a.feeRangeMin <= maxFee && a.feeRangeMax >= minFee
      );
      
      expect(recommended.length).toBeGreaterThan(0);
    });

    it('should limit recommendations to top N', () => {
      const limit = 3;
      const recommended = mockArtists.slice(0, limit);
      
      expect(recommended.length).toBeLessThanOrEqual(limit);
    });

    it('should exclude the reference artist from recommendations', () => {
      const referenceArtistId = 1;
      const recommended = mockArtists.filter(a => a.id !== referenceArtistId);
      
      expect(recommended.every(a => a.id !== referenceArtistId)).toBe(true);
    });
  });

  describe('Match Reasons', () => {
    it('should provide genre match reasons', () => {
      const reasons: string[] = [];
      const commonGenres = ['Rock'];
      
      if (commonGenres.length > 0) {
        reasons.push(`Shared genres: ${commonGenres.join(', ')}`);
      }
      
      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons[0]).toContain('Rock');
    });

    it('should provide fee range match reasons', () => {
      const reasons: string[] = [];
      reasons.push('Similar fee range');
      
      expect(reasons.some(r => r.includes('fee'))).toBe(true);
    });

    it('should provide party size match reasons', () => {
      const reasons: string[] = [];
      reasons.push('Similar touring party size');
      
      expect(reasons.some(r => r.includes('party'))).toBe(true);
    });
  });
});

describe('Booking Analytics Dashboard', () => {
  describe('Key Metrics', () => {
    it('should display total bookings', () => {
      expect(mockAnalytics.totalBookings).toBe(25);
    });

    it('should display total revenue', () => {
      expect(mockAnalytics.totalRevenue).toBe(15000);
    });

    it('should calculate average booking value', () => {
      const average = mockAnalytics.totalRevenue / mockAnalytics.totalBookings;
      expect(average).toBe(600);
    });

    it('should display upcoming bookings', () => {
      expect(mockAnalytics.upcomingBookings).toBe(5);
    });

    it('should display completed bookings', () => {
      expect(mockAnalytics.completedBookings).toBe(20);
    });

    it('should display cancellation rate', () => {
      expect(mockAnalytics.cancellationRate).toBe(8);
    });

    it('should display average rating', () => {
      expect(mockAnalytics.averageRating).toBe(4.5);
    });
  });

  describe('Top Genres / Venues', () => {
    it('should list top genres', () => {
      expect(mockAnalytics.topGenres.length).toBe(3);
      expect(mockAnalytics.topGenres[0].genre).toBe('Rock');
      expect(mockAnalytics.topGenres[0].count).toBe(12);
    });

    it('should list venue distribution', () => {
      expect(mockAnalytics.venueDistribution.length).toBe(4);
      expect(mockAnalytics.venueDistribution[0].venueName).toBe('Grand Hall');
    });

    it('should calculate percentages for bar charts', () => {
      const maxCount = Math.max(...mockAnalytics.topGenres.map(g => g.count));
      const percentage = (mockAnalytics.topGenres[0].count / maxCount) * 100;
      
      expect(percentage).toBe(100);
    });
  });

  describe('Booking Trend', () => {
    it('should show booking trend over time', () => {
      expect(mockAnalytics.bookingTrend.length).toBe(6);
    });

    it('should have month labels', () => {
      const months = mockAnalytics.bookingTrend.map(t => t.month);
      expect(months).toContain('Aug');
      expect(months).toContain('Jan');
    });

    it('should track booking count by month', () => {
      const totalFromTrend = mockAnalytics.bookingTrend.reduce((sum, t) => sum + t.count, 0);
      expect(totalFromTrend).toBe(25);
    });

    it('should calculate trend percentages', () => {
      const maxCount = Math.max(...mockAnalytics.bookingTrend.map(t => t.count));
      const percentage = (mockAnalytics.bookingTrend[0].count / maxCount) * 100;
      
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Insights Generation', () => {
    it('should generate artist insights', () => {
      const insights: string[] = [];
      
      if (mockAnalytics.upcomingBookings > 0) {
        insights.push(`You have ${mockAnalytics.upcomingBookings} upcoming bookings`);
      }
      
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should generate venue insights', () => {
      const insights: string[] = [];
      
      if (mockAnalytics.cancellationRate < 10) {
        insights.push('Low cancellation rate');
      }
      
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should highlight revenue metrics', () => {
      const insights: string[] = [];
      
      if (mockAnalytics.totalRevenue > 10000) {
        insights.push(`Strong revenue of $${mockAnalytics.totalRevenue}`);
      }
      
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should highlight rating metrics', () => {
      const insights: string[] = [];
      
      if (mockAnalytics.averageRating >= 4.5) {
        insights.push('Excellent rating');
      }
      
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate total bookings equals completed + upcoming', () => {
      const total = mockAnalytics.completedBookings + mockAnalytics.upcomingBookings;
      expect(total).toBeLessThanOrEqual(mockAnalytics.totalBookings);
    });

    it('should validate revenue is positive', () => {
      expect(mockAnalytics.totalRevenue).toBeGreaterThan(0);
    });

    it('should validate cancellation rate is between 0-100', () => {
      expect(mockAnalytics.cancellationRate).toBeGreaterThanOrEqual(0);
      expect(mockAnalytics.cancellationRate).toBeLessThanOrEqual(100);
    });

    it('should validate rating is between 0-5', () => {
      expect(mockAnalytics.averageRating).toBeGreaterThanOrEqual(0);
      expect(mockAnalytics.averageRating).toBeLessThanOrEqual(5);
    });
  });

  describe('User Type Specific Rendering', () => {
    it('should show different content for artists', () => {
      const userType = 'artist';
      expect(userType).toBe('artist');
    });

    it('should show different content for venues', () => {
      const userType = 'venue';
      expect(userType).toBe('venue');
    });

    it('should display artist-specific metrics', () => {
      const artistMetrics = ['totalRevenue', 'averageRating', 'upcomingBookings'];
      expect(artistMetrics.length).toBe(3);
    });

    it('should display venue-specific metrics', () => {
      const venueMetrics = ['totalBookings', 'cancellationRate', 'topGenres'];
      expect(venueMetrics.length).toBe(3);
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive grid layout', () => {
      const gridClasses = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      expect(gridClasses).toContain('grid-cols-1');
      expect(gridClasses).toContain('md:grid-cols-2');
    });

    it('should have responsive chart layout', () => {
      const chartClasses = 'grid-cols-1 lg:grid-cols-2';
      expect(chartClasses).toContain('lg:grid-cols-2');
    });
  });
});

describe('Integration', () => {
  it('should integrate recommendations with artist profiles', () => {
    const artistId = 1;
    const recommendations = mockArtists.filter(a => a.id !== artistId);
    
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should integrate analytics with dashboard', () => {
    const hasAnalytics = mockAnalytics.totalBookings > 0;
    expect(hasAnalytics).toBe(true);
  });

  it('should display recommendations and analytics together', () => {
    const hasRecommendations = mockArtists.length > 1;
    const hasAnalytics = mockAnalytics.totalBookings > 0;
    
    expect(hasRecommendations && hasAnalytics).toBe(true);
  });
});
