import { describe, it, expect } from 'vitest';
import * as db from './db';

/**
 * Test suite for genre parsing consistency in retrieval functions
 * Verifies that genre is always returned as an array from database queries
 */
describe('Artist Profile Genre Parsing', () => {
  describe('Retrieval Functions Return Consistent Format', () => {
    it('searchArtists should return genre as array for all artists', async () => {
      const results = await db.searchArtists({});

      // Verify all results have genre as array
      results.forEach(artist => {
        expect(Array.isArray(artist.genre)).toBe(true);
        expect(artist.genre).not.toBeNull();
      });
    });

    it('getAllArtists should return genre as array for all artists', async () => {
      const results = await db.getAllArtists();

      // Verify all results have genre as array
      results.forEach(artist => {
        expect(Array.isArray(artist.genre)).toBe(true);
        expect(artist.genre).not.toBeNull();
      });
    });

    it('searchArtists results should have valid genre strings', async () => {
      const results = await db.searchArtists({});

      // Verify genre contains valid strings
      results.forEach(artist => {
        if (artist.genre && artist.genre.length > 0) {
          artist.genre.forEach(genre => {
            expect(typeof genre).toBe('string');
            expect(genre.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('getAllArtists results should have valid genre strings', async () => {
      const results = await db.getAllArtists();

      // Verify genre contains valid strings
      results.forEach(artist => {
        if (artist.genre && artist.genre.length > 0) {
          artist.genre.forEach(genre => {
            expect(typeof genre).toBe('string');
            expect(genre.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('Genre Filtering Works Correctly', () => {
    it('should filter artists by genre and return genre as array', async () => {
      // Get all artists first to find available genres
      const allArtists = await db.getAllArtists();
      
      if (allArtists.length > 0 && allArtists[0].genre && allArtists[0].genre.length > 0) {
        const testGenre = allArtists[0].genre[0];
        
        // Search for artists with this genre
        const results = await db.searchArtists({
          genre: [testGenre]
        });

        // All results should have genre as array
        results.forEach(artist => {
          expect(Array.isArray(artist.genre)).toBe(true);
          expect(artist.genre.some(g => g.toLowerCase() === testGenre.toLowerCase())).toBe(true);
        });
      }
    });

    it('should handle multiple genre filters and return genre as array', async () => {
      // Get all artists first
      const allArtists = await db.getAllArtists();
      
      if (allArtists.length > 0) {
        const genres = allArtists
          .flatMap(a => a.genre || [])
          .filter((g, i, arr) => arr.indexOf(g) === i)
          .slice(0, 2);
        
        if (genres.length > 0) {
          const results = await db.searchArtists({
            genre: genres
          });

          // All results should have genre as array
          results.forEach(artist => {
            expect(Array.isArray(artist.genre)).toBe(true);
          });
        }
      }
    });
  });

  describe('Genre Display Compatibility', () => {
    it('genre should be joinable to string for display', async () => {
      const results = await db.searchArtists({});

      // Verify genre can be joined for display
      results.forEach(artist => {
        const displayText = Array.isArray(artist.genre) 
          ? artist.genre.join(', ') 
          : artist.genre;
        
        expect(typeof displayText).toBe('string');
      });
    });

    it('genre should not display as [object Object]', async () => {
      const results = await db.searchArtists({});

      results.forEach(artist => {
        const displayText = Array.isArray(artist.genre) 
          ? artist.genre.join(', ') 
          : String(artist.genre);
        
        expect(displayText).not.toContain('[object Object]');
      });
    });
  });
});
