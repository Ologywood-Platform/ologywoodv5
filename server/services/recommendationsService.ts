import { getDb } from "../db";
import { artistProfiles, bookings, reviews, favorites, follows } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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
 * Disabled: This service has schema mismatches with the bookings table
 * The bookings table does not have a genre field - genres are stored in artist_profiles
 * This service needs to be refactored to properly join tables
 * 
 * Considers:
 * 1. User's booking history (genres, locations, price ranges)
 * 2. User's followed artists (similar artists)
 * 3. User's favorites (genre preferences)
 * 4. Popular artists (high ratings, many followers)
 * 5. New artists (recently joined, not yet discovered)
 */
// export async function getSmartRecommendations(
//   userId: number,
//   limit_count: number = 10
// ): Promise<RecommendedArtist[]> {
//   const database = await getDb();
//   if (!database) return [];
//   // Implementation disabled due to schema mismatches
//   return [];
// }

/**
 * Get trending artists based on recent bookings and high ratings
 * Disabled: This service has schema mismatches with the bookings table
 */
// export async function getTrendingArtists(limit_count: number = 5): Promise<RecommendedArtist[]> {
//   const database = await getDb();
//   if (!database) return [];
//   // Implementation disabled due to schema mismatches
//   return [];
// }
