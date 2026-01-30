import { getDb } from "./db";
import { reviews, venueReviews } from "@/drizzle/schema";
import { eq, avg } from "drizzle-orm";

/**
 * Get all reviews for an artist
 */
export async function getArtistReviews(artistId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const artistReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.artistId, artistId));

    return artistReviews || [];
  } catch (error) {
    console.error("Error fetching artist reviews:", error);
    return [];
  }
}

/**
 * Get average rating for an artist
 */
export async function getArtistAverageRating(artistId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ avgRating: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.artistId, artistId));

    return result[0]?.avgRating ? parseFloat(result[0].avgRating.toString()) : 0;
  } catch (error) {
    console.error("Error calculating average rating:", error);
    return 0;
  }
}

/**
 * Create a review for an artist
 */
export async function createArtistReview(
  bookingId: number,
  artistId: number,
  venueId: number,
  rating: number,
  comment?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const result = await db.insert(reviews).values({
      bookingId,
      artistId,
      venueId,
      rating,
      comment: comment || null,
    });

    return result;
  } catch (error) {
    console.error("Error creating artist review:", error);
    throw error;
  }
}

/**
 * Get all reviews for a venue
 */
export async function getVenueReviews(venueId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const venueReviewsList = await db
      .select()
      .from(venueReviews)
      .where(eq(venueReviews.venueId, venueId));

    return venueReviewsList || [];
  } catch (error) {
    console.error("Error fetching venue reviews:", error);
    return [];
  }
}

/**
 * Get average rating for a venue
 */
export async function getVenueAverageRating(venueId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ avgRating: avg(venueReviews.rating) })
      .from(venueReviews)
      .where(eq(venueReviews.venueId, venueId));

    return result[0]?.avgRating ? parseFloat(result[0].avgRating.toString()) : 0;
  } catch (error) {
    console.error("Error calculating venue average rating:", error);
    return 0;
  }
}

/**
 * Create a review for a venue
 */
export async function createVenueReview(
  bookingId: number,
  venueId: number,
  artistId: number,
  rating: number,
  comment?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const result = await db.insert(venueReviews).values({
      bookingId,
      venueId,
      artistId,
      rating,
      comment: comment || null,
    });

    return result;
  } catch (error) {
    console.error("Error creating venue review:", error);
    throw error;
  }
}

/**
 * Get rating statistics for an artist
 */
export async function getArtistRatingStats(artistId: number) {
  const db = await getDb();
  if (!db) return { average: 0, total: 0, distribution: {} };

  try {
    const allReviews = await getArtistReviews(artistId);
    const average = await getArtistAverageRating(artistId);

    // Calculate distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((review) => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });

    return {
      average,
      total: allReviews.length,
      distribution,
    };
  } catch (error) {
    console.error("Error getting artist rating stats:", error);
    return { average: 0, total: 0, distribution: {} };
  }
}

/**
 * Check if a venue has already reviewed an artist for a specific booking
 */
export async function hasVenueReviewedArtist(
  bookingId: number,
  venueId: number,
  artistId: number
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await db
      .select()
      .from(reviews)
      .where(
        eq(reviews.bookingId, bookingId) &&
        eq(reviews.venueId, venueId) &&
        eq(reviews.artistId, artistId)
      );

    return existing.length > 0;
  } catch (error) {
    console.error("Error checking if venue reviewed artist:", error);
    return false;
  }
}

/**
 * Check if an artist has already reviewed a venue for a specific booking
 */
export async function hasArtistReviewedVenue(
  bookingId: number,
  venueId: number,
  artistId: number
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await db
      .select()
      .from(venueReviews)
      .where(
        eq(venueReviews.bookingId, bookingId) &&
        eq(venueReviews.venueId, venueId) &&
        eq(venueReviews.artistId, artistId)
      );

    return existing.length > 0;
  } catch (error) {
    console.error("Error checking if artist reviewed venue:", error);
    return false;
  }
}
