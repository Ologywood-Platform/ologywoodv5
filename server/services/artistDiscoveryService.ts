/**
 * Artist Discovery & Recommendations Service
 * Provides featured artists, trending genres, and new artists for homepage discovery
 */

import { getDb } from '../db';
import { artistProfiles, reviews } from '../../drizzle/schema';
import { eq, desc, gte, sql } from 'drizzle-orm';

export interface DiscoveryArtist {
  id: number;
  artistName: string;
  genre: string[];
  profilePhotoUrl?: string;
  feeRangeMin?: number;
  feeRangeMax?: number;
  averageRating: number;
  reviewCount: number;
  location?: string;
  badge?: 'featured' | 'trending' | 'new';
}

export interface DiscoverySection {
  title: string;
  description: string;
  artists: DiscoveryArtist[];
  viewMoreUrl: string;
}

export class ArtistDiscoveryService {
  /**
   * Get featured artists (highest rated with recent bookings)
   */
  static async getFeaturedArtists(limit: number = 6): Promise<DiscoveryArtist[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const artists = await db
        .select({
          id: artistProfiles.id,
          artistName: artistProfiles.artistName,
          genre: artistProfiles.genre,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
          feeRangeMin: artistProfiles.feeRangeMin,
          feeRangeMax: artistProfiles.feeRangeMax,
          location: artistProfiles.location,
          averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(artistProfiles)
        .leftJoin(reviews, eq(reviews.artistId, artistProfiles.id))
        .groupBy(artistProfiles.id)
        .orderBy(desc(sql`COALESCE(AVG(${reviews.rating}), 0)`))
        .limit(limit);

      return artists.map((a) => ({
        ...a,
        genre: a.genre || [],
        averageRating: Number(a.averageRating) || 0,
        reviewCount: Number(a.reviewCount) || 0,
        badge: 'featured' as const,
      }));
    } catch (error) {
      console.error('[Discovery] Error fetching featured artists:', error);
      return [];
    }
  }

  /**
   * Get trending artists (most booked recently)
   */
  static async getTrendingArtists(limit: number = 6): Promise<DiscoveryArtist[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      // Get artists with most recent bookings
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const artists = await db
        .select({
          id: artistProfiles.id,
          artistName: artistProfiles.artistName,
          genre: artistProfiles.genre,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
          feeRangeMin: artistProfiles.feeRangeMin,
          feeRangeMax: artistProfiles.feeRangeMax,
          location: artistProfiles.location,
          averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(artistProfiles)
        .leftJoin(reviews, eq(reviews.artistId, artistProfiles.id))
        .groupBy(artistProfiles.id)
        .orderBy(desc(sql`COUNT(${reviews.id})`))
        .limit(limit);

      return artists.map((a) => ({
        ...a,
        genre: a.genre || [],
        averageRating: Number(a.averageRating) || 0,
        reviewCount: Number(a.reviewCount) || 0,
        badge: 'trending' as const,
      }));
    } catch (error) {
      console.error('[Discovery] Error fetching trending artists:', error);
      return [];
    }
  }

  /**
   * Get new artists (recently joined)
   */
  static async getNewArtists(limit: number = 6): Promise<DiscoveryArtist[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const artists = await db
        .select({
          id: artistProfiles.id,
          artistName: artistProfiles.artistName,
          genre: artistProfiles.genre,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
          feeRangeMin: artistProfiles.feeRangeMin,
          feeRangeMax: artistProfiles.feeRangeMax,
          location: artistProfiles.location,
          averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(artistProfiles)
        .leftJoin(reviews, eq(reviews.artistId, artistProfiles.id))
        .groupBy(artistProfiles.id)
        .orderBy(desc(artistProfiles.createdAt))
        .limit(limit);

      return artists.map((a) => ({
        ...a,
        genre: a.genre || [],
        averageRating: Number(a.averageRating) || 0,
        reviewCount: Number(a.reviewCount) || 0,
        badge: 'new' as const,
      }));
    } catch (error) {
      console.error('[Discovery] Error fetching new artists:', error);
      return [];
    }
  }

  /**
   * Get artists by genre
   */
  static async getArtistsByGenre(genre: string, limit: number = 6): Promise<DiscoveryArtist[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const artists = await db
        .select({
          id: artistProfiles.id,
          artistName: artistProfiles.artistName,
          genre: artistProfiles.genre,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
          feeRangeMin: artistProfiles.feeRangeMin,
          feeRangeMax: artistProfiles.feeRangeMax,
          location: artistProfiles.location,
          averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(artistProfiles)
        .leftJoin(reviews, eq(reviews.artistId, artistProfiles.id))
        .groupBy(artistProfiles.id)
        .orderBy(desc(sql`COALESCE(AVG(${reviews.rating}), 0)`))
        .limit(limit);

      // Filter by genre (since JSON filtering is complex in SQL)
      return artists
        .filter((a) => a.genre && a.genre.includes(genre))
        .map((a) => ({
          ...a,
          genre: a.genre || [],
          averageRating: Number(a.averageRating) || 0,
          reviewCount: Number(a.reviewCount) || 0,
        }));
    } catch (error) {
      console.error('[Discovery] Error fetching artists by genre:', error);
      return [];
    }
  }

  /**
   * Get all discovery sections for homepage
   */
  static async getHomepageDiscovery(): Promise<DiscoverySection[]> {
    const [featured, trending, newArtists] = await Promise.all([
      this.getFeaturedArtists(6),
      this.getTrendingArtists(6),
      this.getNewArtists(6),
    ]);

    return [
      {
        title: 'Featured Artists',
        description: 'Top-rated performers ready to book',
        artists: featured,
        viewMoreUrl: '/search?sort=rating',
      },
      {
        title: 'Trending Now',
        description: 'Most booked artists this month',
        artists: trending,
        viewMoreUrl: '/search?sort=trending',
      },
      {
        title: 'New on Ologywood',
        description: 'Fresh talent joining our platform',
        artists: newArtists,
        viewMoreUrl: '/search?sort=newest',
      },
    ];
  }

  /**
   * Get popular genres
   */
  static async getPopularGenres(limit: number = 8): Promise<{ genre: string; count: number }[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const artists = await db.select({ genre: artistProfiles.genre }).from(artistProfiles);

      // Count genre occurrences
      const genreCount: { [key: string]: number } = {};
      artists.forEach((artist) => {
        if (artist.genre && Array.isArray(artist.genre)) {
          artist.genre.forEach((g: string) => {
            genreCount[g] = (genreCount[g] || 0) + 1;
          });
        }
      });

      return Object.entries(genreCount)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('[Discovery] Error fetching popular genres:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: number,
    userGenres: string[],
    limit: number = 6
  ): Promise<DiscoveryArtist[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const artists = await db
        .select({
          id: artistProfiles.id,
          artistName: artistProfiles.artistName,
          genre: artistProfiles.genre,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
          feeRangeMin: artistProfiles.feeRangeMin,
          feeRangeMax: artistProfiles.feeRangeMax,
          location: artistProfiles.location,
          averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          reviewCount: sql<number>`COUNT(${reviews.id})`,
        })
        .from(artistProfiles)
        .leftJoin(reviews, eq(reviews.artistId, artistProfiles.id))
        .groupBy(artistProfiles.id)
        .orderBy(desc(sql`COALESCE(AVG(${reviews.rating}), 0)`))
        .limit(limit * 2); // Get more to filter

      // Filter by matching genres
      return artists
        .filter((a) => {
          if (!a.genre || !Array.isArray(a.genre)) return false;
          return a.genre.some((g: string) => userGenres.includes(g));
        })
        .slice(0, limit)
        .map((a) => ({
          ...a,
          genre: a.genre || [],
          averageRating: Number(a.averageRating) || 0,
          reviewCount: Number(a.reviewCount) || 0,
        }));
    } catch (error) {
      console.error('[Discovery] Error fetching personalized recommendations:', error);
      return [];
    }
  }
}

export const artistDiscoveryService = new ArtistDiscoveryService();
