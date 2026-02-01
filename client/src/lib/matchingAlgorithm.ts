/**
 * Smart Matching Algorithm
 * Matches artists with venues based on multiple factors
 */

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  location: { lat: number; lng: number };
  capacity: { min: number; max: number };
  rate: number;
  rating: number;
  bookingsCompleted: number;
  averageRating: number;
  responseTime: number; // in hours
  availability: string[]; // dates available
}

export interface Venue {
  id: string;
  name: string;
  genres: string[];
  location: { lat: number; lng: number };
  capacity: number;
  budget: number;
  rating: number;
  bookingsCompleted: number;
  averageRating: number;
  responseTime: number; // in hours
  upcomingEvents: string[]; // dates with events
}

export interface MatchScore {
  artistId: string;
  venueId: string;
  score: number; // 0-100
  breakdown: {
    genreMatch: number;
    locationMatch: number;
    capacityMatch: number;
    budgetMatch: number;
    ratingMatch: number;
    availabilityMatch: number;
  };
  recommendation: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate genre compatibility score (0-100)
 */
function calculateGenreMatch(artistGenres: string[], venueGenres: string[]): number {
  if (artistGenres.length === 0 || venueGenres.length === 0) return 50;

  const commonGenres = artistGenres.filter(g => venueGenres.includes(g));
  const matchPercentage = (commonGenres.length / Math.max(artistGenres.length, venueGenres.length)) * 100;

  return Math.min(100, matchPercentage + (commonGenres.length > 0 ? 20 : 0));
}

/**
 * Calculate location compatibility score (0-100)
 * Closer = higher score
 */
function calculateLocationMatch(
  artistLat: number,
  artistLng: number,
  venueLat: number,
  venueLng: number
): number {
  const distance = calculateDistance(artistLat, artistLng, venueLat, venueLng);

  // Scoring: 0 miles = 100, 100 miles = 50, 500+ miles = 0
  if (distance <= 10) return 100;
  if (distance <= 50) return 80;
  if (distance <= 100) return 60;
  if (distance <= 250) return 40;
  if (distance <= 500) return 20;
  return 0;
}

/**
 * Calculate capacity compatibility score (0-100)
 */
function calculateCapacityMatch(artistCapacity: { min: number; max: number }, venueCapacity: number): number {
  // Check if venue capacity falls within artist's comfort zone
  if (venueCapacity >= artistCapacity.min && venueCapacity <= artistCapacity.max) {
    return 100;
  }

  // Partial match if slightly outside range
  if (venueCapacity > artistCapacity.max && venueCapacity <= artistCapacity.max * 1.2) {
    return 80;
  }
  if (venueCapacity < artistCapacity.min && venueCapacity >= artistCapacity.min * 0.8) {
    return 80;
  }

  // Poor match if significantly outside range
  if (venueCapacity > artistCapacity.max * 1.5 || venueCapacity < artistCapacity.min * 0.5) {
    return 20;
  }

  return 50;
}

/**
 * Calculate budget compatibility score (0-100)
 */
function calculateBudgetMatch(artistRate: number, venueBudget: number): number {
  // Budget should be at least 80% of artist rate
  const ratio = venueBudget / artistRate;

  if (ratio >= 1) return 100; // Budget exceeds rate
  if (ratio >= 0.9) return 90;
  if (ratio >= 0.8) return 80;
  if (ratio >= 0.7) return 60;
  if (ratio >= 0.5) return 40;
  return 0; // Budget too low
}

/**
 * Calculate rating compatibility score (0-100)
 */
function calculateRatingMatch(artistRating: number, venueRating: number): number {
  // Both high ratings = good match
  if (artistRating >= 4.5 && venueRating >= 4.5) return 100;
  if (artistRating >= 4 && venueRating >= 4) return 90;
  if (artistRating >= 3.5 && venueRating >= 3.5) return 80;
  if (artistRating >= 3 && venueRating >= 3) return 70;

  // One low rating = lower score
  if (artistRating < 3 || venueRating < 3) return 40;

  return 60;
}

/**
 * Calculate availability compatibility score (0-100)
 */
function calculateAvailabilityMatch(artistAvailability: string[], venueUpcomingEvents: string[]): number {
  if (artistAvailability.length === 0 || venueUpcomingEvents.length === 0) return 50;

  const commonDates = artistAvailability.filter(date => venueUpcomingEvents.includes(date));
  const matchPercentage = (commonDates.length / venueUpcomingEvents.length) * 100;

  return Math.min(100, matchPercentage + (commonDates.length > 0 ? 20 : 0));
}

/**
 * Main matching function - calculates match score between artist and venue
 */
export function calculateMatchScore(artist: Artist, venue: Venue): MatchScore {
  const breakdown = {
    genreMatch: calculateGenreMatch(artist.genres, venue.genres),
    locationMatch: calculateLocationMatch(
      artist.location.lat,
      artist.location.lng,
      venue.location.lat,
      venue.location.lng
    ),
    capacityMatch: calculateCapacityMatch(artist.capacity, venue.capacity),
    budgetMatch: calculateBudgetMatch(artist.rate, venue.budget),
    ratingMatch: calculateRatingMatch(artist.averageRating, venue.averageRating),
    availabilityMatch: calculateAvailabilityMatch(artist.availability, venue.upcomingEvents)
  };

  // Weighted scoring
  const weights = {
    genreMatch: 0.25,
    locationMatch: 0.20,
    capacityMatch: 0.20,
    budgetMatch: 0.15,
    ratingMatch: 0.15,
    availabilityMatch: 0.05
  };

  const totalScore =
    breakdown.genreMatch * weights.genreMatch +
    breakdown.locationMatch * weights.locationMatch +
    breakdown.capacityMatch * weights.capacityMatch +
    breakdown.budgetMatch * weights.budgetMatch +
    breakdown.ratingMatch * weights.ratingMatch +
    breakdown.availabilityMatch * weights.availabilityMatch;

  // Generate recommendation
  let recommendation = '';
  if (totalScore >= 80) {
    recommendation = '🌟 Excellent match! This booking has high potential.';
  } else if (totalScore >= 60) {
    recommendation = '👍 Good match. Consider reaching out.';
  } else if (totalScore >= 40) {
    recommendation = '⚠️ Fair match. May require negotiation.';
  } else {
    recommendation = '❌ Poor match. Consider other options.';
  }

  return {
    artistId: artist.id,
    venueId: venue.id,
    score: Math.round(totalScore),
    breakdown,
    recommendation
  };
}

/**
 * Find best matches for an artist from a list of venues
 */
export function findBestVenueMatches(artist: Artist, venues: Venue[], limit: number = 10): MatchScore[] {
  const matches = venues.map(venue => calculateMatchScore(artist, venue));

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find best matches for a venue from a list of artists
 */
export function findBestArtistMatches(venue: Venue, artists: Artist[], limit: number = 10): MatchScore[] {
  const matches = artists.map(artist => calculateMatchScore(artist, venue));

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get match quality label
 */
export function getMatchQualityLabel(score: number): string {
  if (score >= 90) return 'Perfect';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 40) return 'Moderate';
  if (score >= 30) return 'Poor';
  return 'Very Poor';
}

/**
 * Get match quality color
 */
export function getMatchQualityColor(score: number): string {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#3b82f6'; // blue
  if (score >= 40) return '#f59e0b'; // amber
  return '#ef4444'; // red
}
