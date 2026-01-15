interface SearchFilters {
  genres?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number; // in miles
  };
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: {
    startDate?: string;
    endDate?: string;
  };
  minRating?: number;
  minReviews?: number;
  performanceMetrics?: {
    minCompletionRate?: number;
    minRepeatRate?: number;
  };
  verified?: boolean;
  sortBy?: 'rating' | 'price' | 'reviews' | 'popularity' | 'newest';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: number;
  name: string;
  genre: string[];
  location: string;
  priceRange: { min: number; max: number };
  rating: number;
  reviewCount: number;
  verified: boolean;
  completionRate: number;
  repeatRate: number;
  profileImage?: string;
  availability: {
    nextAvailable: string;
    blockedDates: string[];
  };
  matchScore: number; // 0-100
}

interface SavedSearch {
  id: number;
  userId: number;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  updatedAt: Date;
}

// Mock artist data for search
const mockArtists = [
  {
    id: 1,
    name: 'The Jazz Collective',
    genres: ['Jazz', 'Blues'],
    location: 'New York, NY',
    priceRange: { min: 1000, max: 3000 },
    rating: 4.8,
    reviewCount: 45,
    verified: true,
    completionRate: 98,
    repeatRate: 65,
    availability: { nextAvailable: '2026-02-01', blockedDates: [] },
  },
  {
    id: 2,
    name: 'Electric Dreams',
    genres: ['Electronic', 'Indie'],
    location: 'Los Angeles, CA',
    priceRange: { min: 800, max: 2500 },
    rating: 4.6,
    reviewCount: 32,
    verified: true,
    completionRate: 95,
    repeatRate: 58,
    availability: { nextAvailable: '2026-01-25', blockedDates: [] },
  },
  {
    id: 3,
    name: 'Soul Singers',
    genres: ['Soul', 'R&B'],
    location: 'Chicago, IL',
    priceRange: { min: 1200, max: 3500 },
    rating: 4.7,
    reviewCount: 28,
    verified: true,
    completionRate: 96,
    repeatRate: 62,
    availability: { nextAvailable: '2026-02-10', blockedDates: [] },
  },
];

const savedSearches: Map<number, SavedSearch> = new Map();
let searchIdCounter = 1;

export function searchArtists(filters: SearchFilters): SearchResult[] {
  let results = mockArtists.map(artist => ({
    ...artist,
    genre: artist.genres,
    matchScore: calculateMatchScore(artist, filters),
  }));

  // Apply filters
  if (filters.genres && filters.genres.length > 0) {
    results = results.filter(artist =>
      artist.genres.some(g => filters.genres!.includes(g))
    );
  }

  if (filters.priceRange) {
    results = results.filter(
      artist =>
        artist.priceRange.min >= filters.priceRange!.min &&
        artist.priceRange.max <= filters.priceRange!.max
    );
  }

  if (filters.minRating) {
    results = results.filter(artist => artist.rating >= filters.minRating!);
  }

  if (filters.minReviews) {
    results = results.filter(artist => artist.reviewCount >= filters.minReviews!);
  }

  if (filters.performanceMetrics) {
    if (filters.performanceMetrics.minCompletionRate) {
      results = results.filter(
        artist => artist.completionRate >= filters.performanceMetrics!.minCompletionRate!
      );
    }
    if (filters.performanceMetrics.minRepeatRate) {
      results = results.filter(
        artist => artist.repeatRate >= filters.performanceMetrics!.minRepeatRate!
      );
    }
  }

  if (filters.verified !== undefined) {
    results = results.filter(artist => artist.verified === filters.verified);
  }

  // Sort results
  const sortBy = filters.sortBy || 'matchScore';
  const sortOrder = filters.sortOrder || 'desc';

  results.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'rating':
        compareValue = a.rating - b.rating;
        break;
      case 'price':
        compareValue = a.priceRange.min - b.priceRange.min;
        break;
      case 'reviews':
        compareValue = a.reviewCount - b.reviewCount;
        break;
      case 'popularity':
        compareValue = a.repeatRate - b.repeatRate;
        break;
      default:
        compareValue = a.matchScore - b.matchScore;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  return results.slice(offset, offset + limit);
}

function calculateMatchScore(artist: any, filters: SearchFilters): number {
  let score = 50; // Base score

  // Genre match (up to 20 points)
  if (filters.genres && filters.genres.length > 0) {
    const genreMatches = artist.genres.filter((g: string) =>
      filters.genres!.includes(g)
    ).length;
    score += (genreMatches / artist.genres.length) * 20;
  }

  // Price match (up to 15 points)
  if (filters.priceRange) {
    const priceInRange =
      artist.priceRange.min >= filters.priceRange.min &&
      artist.priceRange.max <= filters.priceRange.max;
    if (priceInRange) score += 15;
  }

  // Rating match (up to 15 points)
  if (filters.minRating) {
    const ratingBonus = Math.min((artist.rating / 5) * 15, 15);
    score += ratingBonus;
  }

  return Math.min(score, 100);
}

export function getSearchStats(): {
  totalSearches: number;
  averageResultsPerSearch: number;
  mostPopularGenre: string;
  mostPopularLocation: string;
} {
  return {
    totalSearches: 1250,
    averageResultsPerSearch: 8.5,
    mostPopularGenre: 'Jazz',
    mostPopularLocation: 'New York, NY',
  };
}

export function saveSearch(
  userId: number,
  name: string,
  filters: SearchFilters
): SavedSearch {
  const search: SavedSearch = {
    id: searchIdCounter++,
    userId,
    name,
    filters,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  savedSearches.set(search.id, search);
  console.log(`[Search] Saved search #${search.id} for user ${userId}`);

  return search;
}

export function getSavedSearches(userId: number): SavedSearch[] {
  return Array.from(savedSearches.values()).filter(s => s.userId === userId);
}

export function getSavedSearch(searchId: number): SavedSearch | undefined {
  return savedSearches.get(searchId);
}

export function updateSavedSearch(
  searchId: number,
  name: string,
  filters: SearchFilters
): SavedSearch | undefined {
  const search = savedSearches.get(searchId);
  if (!search) return undefined;

  search.name = name;
  search.filters = filters;
  search.updatedAt = new Date();

  console.log(`[Search] Updated saved search #${searchId}`);
  return search;
}

export function deleteSavedSearch(searchId: number): boolean {
  const deleted = savedSearches.delete(searchId);
  if (deleted) {
    console.log(`[Search] Deleted saved search #${searchId}`);
  }
  return deleted;
}

export function getSearchSuggestions(query: string): {
  genres: string[];
  locations: string[];
  artists: string[];
} {
  const genres = ['Jazz', 'Blues', 'Electronic', 'Indie', 'Soul', 'R&B', 'Rock', 'Pop'];
  const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Nashville, TN'];
  const artists = mockArtists.map(a => a.name);

  return {
    genres: genres.filter(g => g.toLowerCase().includes(query.toLowerCase())),
    locations: locations.filter(l => l.toLowerCase().includes(query.toLowerCase())),
    artists: artists.filter(a => a.toLowerCase().includes(query.toLowerCase())),
  };
}

export function getPopularSearches(): { query: string; count: number }[] {
  return [
    { query: 'Jazz', count: 245 },
    { query: 'New York', count: 189 },
    { query: 'Under $1000', count: 156 },
    { query: 'Verified Artists', count: 134 },
    { query: 'High Rating', count: 98 },
  ];
}
