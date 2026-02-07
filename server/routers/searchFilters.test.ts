import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';

describe('Search Filters - Artist Discovery', () => {
  // Test data setup
  const mockArtists = [
    {
      id: 1,
      userId: 1,
      artistName: 'The Velvet Collective',
      genre: ['Jazz', 'Soul', 'Blues'],
      location: 'New York, NY',
      bio: 'A sophisticated 5-piece jazz ensemble',
      feeRangeMin: 2000,
      feeRangeMax: 5000,
      touringPartySize: 5,
      profilePhotoUrl: 'https://example.com/photo1.jpg',
      mediaGallery: null,
      socialLinks: null,
      websiteUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      userId: 2,
      artistName: 'Luna Echo',
      genre: ['Indie', 'Pop', 'Electronic'],
      location: 'Los Angeles, CA',
      bio: 'Award-winning indie pop artist',
      feeRangeMin: 1500,
      feeRangeMax: 3500,
      touringPartySize: 3,
      profilePhotoUrl: 'https://example.com/photo2.jpg',
      mediaGallery: null,
      socialLinks: null,
      websiteUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      userId: 3,
      artistName: 'DJ Sonic Wave',
      genre: ['Electronic', 'House', 'Techno', 'Hip-Hop'],
      location: 'Miami, FL',
      bio: 'High-energy DJ with 15+ years of experience',
      feeRangeMin: 800,
      feeRangeMax: 2500,
      touringPartySize: 1,
      profilePhotoUrl: 'https://example.com/photo3.jpg',
      mediaGallery: null,
      socialLinks: null,
      websiteUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      userId: 4,
      artistName: 'Ologywood',
      genre: ['Rock', 'Pop', 'Soul'],
      location: 'Atlanta, GA',
      bio: 'Singer Performer',
      feeRangeMin: 500,
      feeRangeMax: 2500,
      touringPartySize: 1,
      profilePhotoUrl: 'https://example.com/photo4.jpg',
      mediaGallery: null,
      socialLinks: null,
      websiteUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('Genre Filter', () => {
    it('should filter artists by single genre', () => {
      const filters = { genre: ['Jazz'] };
      const filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('The Velvet Collective');
    });

    it('should filter artists by multiple genres (OR logic)', () => {
      const filters = { genre: ['Jazz', 'Electronic'] };
      const filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(3); // Jazz (1) + Electronic (2) = 3 artists
      expect(filtered.map(a => a.artistName)).toContain('The Velvet Collective');
      expect(filtered.map(a => a.artistName)).toContain('Luna Echo');
      expect(filtered.map(a => a.artistName)).toContain('DJ Sonic Wave');
    });

    it('should return all artists when no genre filter is applied', () => {
      const filters = {};
      const filtered = mockArtists.filter(a => {
        if (!filters.genre || filters.genre.length === 0) return true;
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(4);
    });

    it('should be case-insensitive', () => {
      const filters = { genre: ['jazz'] }; // lowercase
      const filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('The Velvet Collective');
    });
  });

  describe('Location Filter', () => {
    it('should filter artists by exact location match', () => {
      const filters = { location: 'New York' };
      const filtered = mockArtists.filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('The Velvet Collective');
    });

    it('should filter artists by partial location match', () => {
      const filters = { location: 'CA' };
      const filtered = mockArtists.filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('Luna Echo');
    });

    it('should be case-insensitive', () => {
      const filters = { location: 'los angeles' }; // lowercase
      const filtered = mockArtists.filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('Luna Echo');
    });

    it('should return all artists when no location filter is applied', () => {
      const filters = {};
      const filtered = mockArtists.filter(a => {
        if (!filters.location) return true;
        return a.location?.toLowerCase().includes(filters.location!.toLowerCase());
      });
      expect(filtered).toHaveLength(4);
    });
  });

  describe('Price Range Filter', () => {
    it('should filter artists by minimum fee', () => {
      const filters = { minFee: 1500 };
      const filtered = mockArtists.filter(a => 
        a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!
      );
      expect(filtered).toHaveLength(2); // Velvet Collective (2000) and Luna Echo (1500)
      expect(filtered.map(a => a.artistName)).toContain('The Velvet Collective');
      expect(filtered.map(a => a.artistName)).toContain('Luna Echo');
    });

    it('should filter artists by maximum fee', () => {
      const filters = { maxFee: 2500 };
      const filtered = mockArtists.filter(a => 
        a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee!
      );
      expect(filtered).toHaveLength(2); // DJ Sonic Wave (2500) and Ologywood (2500)
      expect(filtered.map(a => a.artistName)).toContain('DJ Sonic Wave');
      expect(filtered.map(a => a.artistName)).toContain('Ologywood');
    });

    it('should filter artists by price range (min and max)', () => {
      const filters = { minFee: 1000, maxFee: 3000 };
      const filtered = mockArtists.filter(a => {
        const meetsMin = a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!;
        const meetsMax = a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee!;
        return meetsMin && meetsMax;
      });
      expect(filtered).toHaveLength(0); // No artists meet both conditions with these ranges
    });

    it('should filter artists whose fee range overlaps with requested range', () => {
      const filters = { minFee: 1000, maxFee: 3000 };
      const filtered = mockArtists.filter(a => {
        // Artist is available if their max fee >= requested min AND their min fee <= requested max
        const meetsMin = a.feeRangeMax !== null && a.feeRangeMax >= filters.minFee!;
        const meetsMax = a.feeRangeMin !== null && a.feeRangeMin <= filters.maxFee!;
        return meetsMin && meetsMax;
      });
      expect(filtered).toHaveLength(4); // All artists have overlapping fee ranges
    });

    it('should return all artists when no price filter is applied', () => {
      const filters = {};
      const filtered = mockArtists.filter(a => {
        if (filters.minFee === undefined && filters.maxFee === undefined) return true;
        const meetsMin = filters.minFee === undefined || (a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee);
        const meetsMax = filters.maxFee === undefined || (a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee);
        return meetsMin && meetsMax;
      });
      expect(filtered).toHaveLength(4);
    });
  });

  describe('Combined Filters', () => {
    it('should apply genre AND location filters together', () => {
      const filters = { genre: ['Jazz'], location: 'New York' };
      let filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      filtered = filtered.filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].artistName).toBe('The Velvet Collective');
    });

    it('should apply genre AND price filters together', () => {
      const filters = { genre: ['Electronic'], minFee: 1000 };
      let filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      filtered = filtered.filter(a => 
        a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!
      );
      expect(filtered).toHaveLength(1); // Luna Echo (Electronic, 1500 min fee)
      expect(filtered[0].artistName).toBe('Luna Echo');
    });

    it('should apply all filters together', () => {
      const filters = { 
        genre: ['Electronic', 'Jazz'], 
        location: 'New York',
        minFee: 1500,
        maxFee: 5000
      };
      
      let filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      
      filtered = filtered.filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      
      filtered = filtered.filter(a => {
        const meetsMin = a.feeRangeMin !== null && a.feeRangeMin >= filters.minFee!;
        const meetsMax = a.feeRangeMax !== null && a.feeRangeMax <= filters.maxFee!;
        return meetsMin && meetsMax;
      });
      
      expect(filtered).toHaveLength(1); // Only The Velvet Collective matches all criteria
      expect(filtered[0].artistName).toBe('The Velvet Collective');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty genre array', () => {
      const filters = { genre: [] };
      const filtered = mockArtists.filter(a => {
        if (!filters.genre || filters.genre.length === 0) return true;
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(4);
    });

    it('should handle artists with no genres', () => {
      const artistNoGenre = { ...mockArtists[0], genre: [] };
      const filters = { genre: ['Jazz'] };
      const filtered = [artistNoGenre].filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(0);
    });

    it('should handle non-existent genre filter', () => {
      const filters = { genre: ['NonExistentGenre'] };
      const filtered = mockArtists.filter(a => {
        const artistGenres = Array.isArray(a.genre) ? a.genre : [];
        return filters.genre!.some(selectedGenre => 
          artistGenres.some(g => g?.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      expect(filtered).toHaveLength(0);
    });

    it('should handle null location', () => {
      const artistNoLocation = { ...mockArtists[0], location: null };
      const filters = { location: 'New York' };
      const filtered = [artistNoLocation].filter(a => 
        a.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
      expect(filtered).toHaveLength(0);
    });
  });
});
