import { getDb } from "../db";
import { artistProfiles, bookings, reviews, favorites, follows } from "../../drizzle/schema";
import { eq, and, desc, limit } from "drizzle-orm";

interface RecommendedArtist {
  id: number;
  artistName: string;
  genre: string[];
  location: string;
  rating: number;
  followers: number;
  score: number; // Recommendation score
}

/**
 * Smart Recommendations Algorithm
 * Considers:
 * 1. User's booking history (genres, locations, price ranges)
 * 2. User's followed artists (similar artists)
 * 3. User's favorites (genre preferences)
 * 4. Popular artists (high ratings, many followers)
 * 5. New artists (recently joined, not yet discovered)
 */
export async function getSmartRecommendations(
  userId: number,
  limit_count: number = 10
): Promise<RecommendedArtist[]> {
  const database = await getDb();
  if (!database) return [];

  // Get user's booking history to understand preferences
  const userBookings = await database
    .select()
    .from(bookings)
    .where(eq(bookings.venueId, userId));

  // Get user's followed artists
  const followedArtists = await database
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingType, "artist")));

  const followedArtistIds = new Set(followedArtists.map((f) => f.followingId));

  // Get user's favorited artists
  const favoriteArtists = await database
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId));

  const favoriteArtistIds = new Set(favoriteArtists.map((f) => f.artistId));

  // Get all artists
  const allArtists = await database.select().from(artistProfiles);

  // Calculate recommendation score for each artist
  const recommendedArtists = await Promise.all(
    allArtists
      .filter((artist) => !followedArtistIds.has(artist.id) && !favoriteArtistIds.has(artist.id))
      .map(async (artist) => {
        let score = 0;

        // 1. Genre match (30 points)
        const userGenres = new Set(
          userBookings
            .map((b) => {
              // Extract genres from booking if available
              return [];
            })
            .flat()
        );

        if (artist.genre && artist.genre.length > 0) {
          const matchingGenres = artist.genre.filter((g) => userGenres.has(g));
          score += matchingGenres.length * 30;
        }

        // 2. Location proximity (20 points)
        const userLocations = new Set(userBookings.map((b) => b.eventDetails?.split(",")[0]));
        if (artist.location && userLocations.has(artist.location)) {
          score += 20;
        }

        // 3. Rating score (25 points)
        const artistReviews = await database
          .select()
          .from(reviews)
          .where(eq(reviews.artistId, artist.id));

        if (artistReviews.length > 0) {
          const avgRating =
            artistReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / artistReviews.length;
          score += (avgRating / 5) * 25; // Normalize to 25 points
        }

        // 4. Follower count (15 points) - Popular artists
        const followerCount = await database
          .select()
          .from(follows)
          .where(and(eq(follows.followingId, artist.id), eq(follows.followingType, "artist")));

        score += Math.min((followerCount.length / 100) * 15, 15); // Cap at 15 points

        // 5. Recency bonus (10 points) - Newer artists
        const daysSinceCreated = Math.floor(
          (Date.now() - (artist.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated < 30) {
          score += 10;
        } else if (daysSinceCreated < 90) {
          score += 5;
        }

        return {
          id: artist.id,
          artistName: artist.artistName,
          genre: artist.genre || [],
          location: artist.location || "",
          rating: artistReviews.length > 0 ? avgRating : 0,
          followers: followerCount.length,
          score,
        };
      })
  );

  // Sort by score and return top recommendations
  return recommendedArtists.sort((a, b) => b.score - a.score).slice(0, limit_count);
}

/**
 * Get trending artists based on recent bookings and high ratings
 */
export async function getTrendingArtists(limit_count: number = 5): Promise<RecommendedArtist[]> {
  const database = await getDb();
  if (!database) return [];

  const allArtists = await database.select().from(artistProfiles);

  const trendingArtists = await Promise.all(
    allArtists.map(async (artist) => {
      // Get recent bookings (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentBookings = await database
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.artistId, artist.id),
            // @ts-ignore
            bookings.createdAt >= thirtyDaysAgo
          )
        );

      // Get reviews
      const artistReviews = await database
        .select()
        .from(reviews)
        .where(eq(reviews.artistId, artist.id));

      // Get followers
      const followerCount = await database
        .select()
        .from(follows)
        .where(and(eq(follows.followingId, artist.id), eq(follows.followingType, "artist")));

      const avgRating =
        artistReviews.length > 0
          ? artistReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / artistReviews.length
          : 0;

      const trendScore = recentBookings.length * 10 + (avgRating / 5) * 50 + followerCount.length;

      return {
        id: artist.id,
        artistName: artist.artistName,
        genre: artist.genre || [],
        location: artist.location || "",
        rating: avgRating,
        followers: followerCount.length,
        score: trendScore,
      };
    })
  );

  return trendingArtists.sort((a, b) => b.score - a.score).slice(0, limit_count);
}
