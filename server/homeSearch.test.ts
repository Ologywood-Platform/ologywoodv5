import { describe, it, expect } from 'vitest';

/**
 * Tests for the Home page search dropdown and Browse page query param support.
 * Covers: filtering logic, URL encoding, keyboard navigation edge cases.
 */

// ─── Artist filtering logic (mirrors ArtistSearchDropdown) ────────────────────

describe('Home Search - Artist Filtering Logic', () => {
  const mockArtists = [
    { id: 1, artistName: 'The Amazing Band', genre: ['Rock', 'Alternative'], location: 'New York, NY', profilePhotoUrl: null },
    { id: 2, artistName: 'Jazz Trio', genre: ['Jazz', 'Blues'], location: 'Chicago, IL', profilePhotoUrl: null },
    { id: 3, artistName: 'DJ Spark', genre: ['Electronic', 'House'], location: 'Miami, FL', profilePhotoUrl: null },
    { id: 4, artistName: 'Classical Strings', genre: ['Classical'], location: 'Boston, MA', profilePhotoUrl: null },
    { id: 5, artistName: 'Rock Legends', genre: ['Rock', 'Classic Rock'], location: 'Los Angeles, CA', profilePhotoUrl: null },
    { id: 6, artistName: 'Country Roads', genre: ['Country'], location: 'Nashville, TN', profilePhotoUrl: null },
    { id: 7, artistName: 'NYC Blues Band', genre: ['Blues'], location: 'New York, NY', profilePhotoUrl: null },
  ];

  function filterArtists(artists: typeof mockArtists, query: string, maxResults = 5) {
    if (query.trim().length === 0) return [];
    const q = query.toLowerCase();
    return artists
      .filter((artist) =>
        artist.artistName.toLowerCase().includes(q) ||
        (artist.location?.toLowerCase().includes(q)) ||
        (Array.isArray(artist.genre) && artist.genre.some((g: string) => g.toLowerCase().includes(q)))
      )
      .slice(0, maxResults);
  }

  it('returns empty array for empty query', () => {
    expect(filterArtists(mockArtists, '')).toEqual([]);
    expect(filterArtists(mockArtists, '   ')).toEqual([]);
  });

  it('matches by artist name (case-insensitive)', () => {
    const results = filterArtists(mockArtists, 'jazz');
    expect(results).toHaveLength(1);
    expect(results[0].artistName).toBe('Jazz Trio');
  });

  it('matches by genre', () => {
    const results = filterArtists(mockArtists, 'rock');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some(a => a.artistName === 'The Amazing Band')).toBe(true);
    expect(results.some(a => a.artistName === 'Rock Legends')).toBe(true);
  });

  it('matches by location', () => {
    const results = filterArtists(mockArtists, 'new york');
    expect(results).toHaveLength(2);
    expect(results.every(a => a.location === 'New York, NY')).toBe(true);
  });

  it('limits results to maxResults', () => {
    const results = filterArtists(mockArtists, 'a', 3); // 'a' matches many artists
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('defaults maxResults to 5', () => {
    // 'a' appears in many artist names/genres/locations
    const results = filterArtists(mockArtists, 'a');
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('matches partial strings', () => {
    const results = filterArtists(mockArtists, 'amaz');
    expect(results).toHaveLength(1);
    expect(results[0].artistName).toBe('The Amazing Band');
  });

  it('returns no results for non-matching query', () => {
    const results = filterArtists(mockArtists, 'zzzznonexistent');
    expect(results).toHaveLength(0);
  });
});

// ─── Browse page query param parsing ──────────────────────────────────────────

describe('Home Search - Browse Page Query Param', () => {
  it('parses query param from URL search string', () => {
    const searchString = '?q=jazz+trio';
    const params = new URLSearchParams(searchString);
    expect(params.get('q')).toBe('jazz trio');
  });

  it('handles encoded special characters', () => {
    const searchString = '?q=rock%20%26%20roll';
    const params = new URLSearchParams(searchString);
    expect(params.get('q')).toBe('rock & roll');
  });

  it('returns null for missing query param', () => {
    const searchString = '';
    const params = new URLSearchParams(searchString);
    expect(params.get('q')).toBeNull();
  });

  it('handles empty query param', () => {
    const searchString = '?q=';
    const params = new URLSearchParams(searchString);
    expect(params.get('q')).toBe('');
  });
});

// ─── URL construction for navigation ──────────────────────────────────────────

describe('Home Search - Navigation URL Construction', () => {
  it('builds correct Browse URL with query', () => {
    const query = 'jazz trio';
    const url = `/browse?q=${encodeURIComponent(query.trim())}`;
    expect(url).toBe('/browse?q=jazz%20trio');
  });

  it('trims whitespace before encoding', () => {
    const query = '  rock  ';
    const url = `/browse?q=${encodeURIComponent(query.trim())}`;
    expect(url).toBe('/browse?q=rock');
  });

  it('builds correct artist profile URL', () => {
    const artistId = 42;
    const url = `/artist/${artistId}`;
    expect(url).toBe('/artist/42');
  });

  it('handles special characters in query', () => {
    const query = "rock & roll's best";
    const url = `/browse?q=${encodeURIComponent(query.trim())}`;
    expect(url).toContain('rock');
    // Verify it can be decoded back
    const decoded = decodeURIComponent(url.split('q=')[1]);
    expect(decoded).toBe("rock & roll's best");
  });
});

// ─── Keyboard navigation index logic ──────────────────────────────────────────

describe('Home Search - Keyboard Navigation', () => {
  it('wraps around from last item to first on ArrowDown', () => {
    const totalItems = 6; // 5 results + 1 "see all"
    let index = 5; // last item
    index = (index + 1) % totalItems;
    expect(index).toBe(0);
  });

  it('wraps around from first item to last on ArrowUp', () => {
    const totalItems = 6;
    let index = 0;
    index = (index - 1 + totalItems) % totalItems;
    expect(index).toBe(5);
  });

  it('increments normally in the middle', () => {
    const totalItems = 6;
    let index = 2;
    index = (index + 1) % totalItems;
    expect(index).toBe(3);
  });

  it('decrements normally in the middle', () => {
    const totalItems = 6;
    let index = 3;
    index = (index - 1 + totalItems) % totalItems;
    expect(index).toBe(2);
  });

  it('last index is the "See all results" item', () => {
    const filteredLength = 5;
    const seeAllIndex = filteredLength; // 0-indexed, so index 5 = 6th item
    expect(seeAllIndex).toBe(5);
  });
});
