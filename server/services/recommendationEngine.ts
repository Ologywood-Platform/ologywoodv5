import { getDb } from "../db";
import { artistProfiles, reviews } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ArtistSimilarity {
  artistId: number;
  artistName: string;
  similarity: number;
  matchReasons: string[];
  averageRating: number;
}

export class RecommendationEngine {
  /**
   * Calculate similarity score between two artists
   */
  private static calculateSimilarity(
    artist1: any,
    artist2: any,
    artist1Reviews: any[],
    artist2Reviews: any[]
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Genre similarity (40 points max)
    const genres1 = Array.isArray(artist1.genre) ? artist1.genre : [];
    const genres2 = Array.isArray(artist2.genre) ? artist2.genre : [];
    const commonGenres = genres1.filter((g: string) => genres2.includes(g));
    if (commonGenres.length > 0) {
      const genreSimilarity = (commonGenres.length / Math.max(genres1.length, genres2.length)) * 40;
      score += genreSimilarity;
      reasons.push(`Shared genres: ${commonGenres.join(", ")}`);
    }

    // Fee range similarity (30 points max)
    if (artist1.feeRangeMin && artist1.feeRangeMax && artist2.feeRangeMin && artist2.feeRangeMax) {
      const range1 = artist1.feeRangeMax - artist1.feeRangeMin;
      const range2 = artist2.feeRangeMax - artist2.feeRangeMin;
      const midpoint1 = artist1.feeRangeMin + range1 / 2;
      const midpoint2 = artist2.feeRangeMin + range2 / 2;
      const maxMidpoint = Math.max(midpoint1, midpoint2);
      const feeDifference = Math.abs(midpoint1 - midpoint2);
      const feePercentageDiff = (feeDifference / maxMidpoint) * 100;
      const feeSimilarity = Math.max(0, 30 - (feePercentageDiff / 10));
      score += feeSimilarity;
      if (feeSimilarity > 15) {
        reasons.push("Similar fee range");
      }
    }

    // Party size similarity (20 points max)
    if (artist1.touringPartySize && artist2.touringPartySize) {
      const sizeDiff = Math.abs(artist1.touringPartySize - artist2.touringPartySize);
      const partySimilarity = Math.max(0, 20 - sizeDiff * 2);
      score += partySimilarity;
      if (partySimilarity > 10) {
        reasons.push("Similar touring party size");
      }
    }

    // Rating similarity (10 points max)
    if (artist1Reviews.length > 0 && artist2Reviews.length > 0) {
      const avg1 = artist1Reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / artist1Reviews.length;
      const avg2 = artist2Reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / artist2Reviews.length;
      const ratingDiff = Math.abs(avg1 - avg2);
      const ratingSimilarity = Math.max(0, 10 - ratingDiff * 2);
      score += ratingSimilarity;
      if (ratingSimilarity > 5) {
        reasons.push("Similar quality ratings");
      }
    }

    return { score: Math.round(score), reasons };
  }

  /**
   * Get recommended artists similar to a given artist
   */
  static async getRecommendedArtists(
    artistId: number,
    limit: number = 5
  ): Promise<ArtistSimilarity[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      // Get the reference artist
      const referenceArtist = await db
        .select()
        .from(artistProfiles)
        .where(eq(artistProfiles.id, artistId));

      if (referenceArtist.length === 0) return [];

      const artist = referenceArtist[0];

      // Get all other artists
      const allArtists = await db.select().from(artistProfiles);
      const otherArtists = allArtists.filter((a: any) => a.id !== artistId);

      // Calculate similarity for each artist
      const similarities: ArtistSimilarity[] = [];

      for (const otherArtist of otherArtists) {
        // Get reviews for both artists
        const artistReviews = await db
          .select()
          .from(reviews)
          .where(eq(reviews.artistId, artist.id));

        const otherReviews = await db
          .select()
          .from(reviews)
          .where(eq(reviews.artistId, otherArtist.id));

        const { score, reasons } = this.calculateSimilarity(
          artist,
          otherArtist,
          artistReviews,
          otherReviews
        );

        if (score > 0) {
          const avgRating = otherReviews.length > 0
            ? otherReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / otherReviews.length
            : 0;

          similarities.push({
            artistId: otherArtist.id,
            artistName: otherArtist.artistName,
            similarity: score,
            matchReasons: reasons,
            averageRating: Math.round(avgRating * 10) / 10,
          });
        }
      }

      // Sort by similarity score and return top N
      return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
    } catch (error) {
      console.error("Error getting recommended artists:", error);
      return [];
    }
  }

  /**
   * Get artists by genre preference
   */
  static async getArtistsByGenre(genres: string[], limit: number = 5): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const allArtists = await db.select().from(artistProfiles);

      const matchedArtists = allArtists
        .filter((artist: any) => {
          const artistGenres = Array.isArray(artist.genre) ? artist.genre : [];
          return artistGenres.some((g: string) => genres.includes(g));
        })
        .slice(0, limit);

      return matchedArtists;
    } catch (error) {
      console.error("Error getting artists by genre:", error);
      return [];
    }
  }

  /**
   * Get top-rated artists
   */
  static async getTopRatedArtists(limit: number = 5): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const allArtists = await db.select().from(artistProfiles);

      const artistsWithRatings = await Promise.all(
        allArtists.map(async (artist: any) => {
          const artistReviews = await db
            .select()
            .from(reviews)
            .where(eq(reviews.artistId, artist.id));

          const avgRating = artistReviews.length > 0
            ? artistReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / artistReviews.length
            : 0;

          return { ...artist, averageRating: avgRating, reviewCount: artistReviews.length };
        })
      );

      return artistsWithRatings
        .filter((a: any) => a.reviewCount > 0)
        .sort((a: any, b: any) => b.averageRating - a.averageRating)
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting top-rated artists:", error);
      return [];
    }
  }

  /**
   * Get artists in the same fee range
   */
  static async getArtistsByFeeRange(
    minFee: number,
    maxFee: number,
    limit: number = 5
  ): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const allArtists = await db.select().from(artistProfiles);

      const matchedArtists = allArtists
        .filter((artist: any) => {
          if (!artist.feeRangeMin || !artist.feeRangeMax) return false;
          // Check if there's overlap in fee ranges
          return artist.feeRangeMin <= maxFee && artist.feeRangeMax >= minFee;
        })
        .slice(0, limit);

      return matchedArtists;
    } catch (error) {
      console.error("Error getting artists by fee range:", error);
      return [];
    }
  }
}
