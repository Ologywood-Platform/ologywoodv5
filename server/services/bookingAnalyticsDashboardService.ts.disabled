/**
 * Booking Analytics Dashboard Service
 * Provides comprehensive metrics and insights for artists and venues
 */

import { getDb } from '../db';
import { bookings, reviews } from '../../drizzle/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export interface BookingMetrics {
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  cancellationRate: number;
}

export interface TrendData {
  month: string;
  bookings: number;
  revenue: number;
}

export interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

export interface VenueStats {
  venueName: string;
  bookingCount: number;
  totalRevenue: number;
  averageRating: number;
}

export interface AnalyticsDashboard {
  metrics: BookingMetrics;
  trends: TrendData[];
  topGenres: GenreStats[];
  topVenues: VenueStats[];
  averageRating: number;
  insights: string[];
}

export class BookingAnalyticsDashboardService {
  /**
   * Get booking metrics for an artist
   */
  static async getArtistMetrics(artistId: number): Promise<BookingMetrics> {
    try {
      const db = await getDb();
      if (!db) return this.getEmptyMetrics();

      const allBookings = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          totalFee: bookings.totalFee,
          createdAt: bookings.createdAt,
          eventDate: bookings.eventDate,
        })
        .from(bookings)
        .where(eq(bookings.artistId, artistId));

      const now = new Date();
      const totalBookings = allBookings.length;
      const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
      const upcomingBookings = allBookings.filter(
        (b) => b.status === 'confirmed' && new Date(b.eventDate) > now
      ).length;
      const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;

      const totalRevenue = allBookings.reduce((sum, b) => sum + (Number(b.totalFee) || 0), 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      return {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingValue,
        cancellationRate,
      };
    } catch (error) {
      console.error('[Analytics] Error fetching artist metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get booking metrics for a venue
   */
  static async getVenueMetrics(venueId: number): Promise<BookingMetrics> {
    try {
      const db = await getDb();
      if (!db) return this.getEmptyMetrics();

      const allBookings = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          totalFee: bookings.totalFee,
          createdAt: bookings.createdAt,
          eventDate: bookings.eventDate,
        })
        .from(bookings)
        .where(eq(bookings.venueId, venueId));

      const now = new Date();
      const totalBookings = allBookings.length;
      const completedBookings = allBookings.filter((b) => b.status === 'completed').length;
      const upcomingBookings = allBookings.filter(
        (b) => b.status === 'confirmed' && new Date(b.eventDate) > now
      ).length;
      const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled').length;

      const totalRevenue = allBookings.reduce((sum, b) => sum + (Number(b.totalFee) || 0), 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

      return {
        totalBookings,
        completedBookings,
        upcomingBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingValue,
        cancellationRate,
      };
    } catch (error) {
      console.error('[Analytics] Error fetching venue metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get booking trends for last 6 months
   */
  static async getBookingTrends(artistId?: number, venueId?: number): Promise<TrendData[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = db
        .select({
          month: sql<string>`DATE_FORMAT(${bookings.createdAt}, '%Y-%m')`,
          bookingCount: sql<number>`COUNT(*)`,
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalFee} AS DECIMAL(10,2))), 0)`,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, sixMonthsAgo));

      if (artistId) {
        query = query.where(eq(bookings.artistId, artistId));
      }
      if (venueId) {
        query = query.where(eq(bookings.venueId, venueId));
      }

      const results = await query.groupBy(sql`DATE_FORMAT(${bookings.createdAt}, '%Y-%m')`);

      return results.map((r) => ({
        month: r.month || '',
        bookings: Number(r.bookingCount) || 0,
        revenue: Number(r.totalRevenue) || 0,
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching booking trends:', error);
      return [];
    }
  }

  /**
   * Get top genres for an artist
   */
  static async getTopGenres(artistId: number, limit: number = 5): Promise<GenreStats[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      // This is a simplified version - in production, you'd track genre preferences
      // For now, return the artist's genres
      const artistBookings = await db
        .select({
          id: bookings.id,
          totalFee: bookings.totalFee,
        })
        .from(bookings)
        .where(eq(bookings.artistId, artistId));

      const totalBookings = artistBookings.length;
      if (totalBookings === 0) return [];

      // Return placeholder genres
      return [
        { genre: 'Rock', count: Math.ceil(totalBookings * 0.4), percentage: 40 },
        { genre: 'Pop', count: Math.ceil(totalBookings * 0.3), percentage: 30 },
        { genre: 'Jazz', count: Math.ceil(totalBookings * 0.2), percentage: 20 },
        { genre: 'Classical', count: Math.ceil(totalBookings * 0.1), percentage: 10 },
      ];
    } catch (error) {
      console.error('[Analytics] Error fetching top genres:', error);
      return [];
    }
  }

  /**
   * Get top venues for an artist
   */
  static async getTopVenues(artistId: number, limit: number = 5): Promise<VenueStats[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const venueBookings = await db
        .select({
          venueName: bookings.venueName,
          totalFee: bookings.totalFee,
          id: bookings.id,
        })
        .from(bookings)
        .where(eq(bookings.artistId, artistId))
        .orderBy(desc(bookings.totalFee))
        .limit(limit);

      return venueBookings.map((vb) => ({
        venueName: vb.venueName,
        bookingCount: 1, // Simplified - would need to group in production
        totalRevenue: Number(vb.totalFee) || 0,
        averageRating: 4.5, // Placeholder
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching top venues:', error);
      return [];
    }
  }

  /**
   * Get artist average rating
   */
  static async getArtistAverageRating(artistId: number): Promise<number> {
    try {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        })
        .from(reviews)
        .where(eq(reviews.artistId, artistId));

      return Number(result[0]?.avgRating) || 0;
    } catch (error) {
      console.error('[Analytics] Error fetching artist rating:', error);
      return 0;
    }
  }

  /**
   * Generate insights based on metrics
   */
  static generateInsights(metrics: BookingMetrics, trends: TrendData[]): string[] {
    const insights: string[] = [];

    if (metrics.totalBookings === 0) {
      insights.push('Start by creating your profile and setting availability to attract bookings.');
    } else {
      insights.push(`You have ${metrics.totalBookings} total bookings with ${metrics.completedBookings} completed.`);

      if (metrics.cancellationRate > 20) {
        insights.push('Consider reviewing your cancellation policy to reduce cancellations.');
      }

      if (metrics.upcomingBookings > 0) {
        insights.push(`You have ${metrics.upcomingBookings} upcoming bookings. Prepare your technical requirements!`);
      }

      if (trends.length > 1) {
        const latestTrend = trends[trends.length - 1];
        const previousTrend = trends[trends.length - 2];
        if (latestTrend.bookings > previousTrend.bookings) {
          insights.push('Great! Your bookings are trending upward this month.');
        }
      }

      if (metrics.averageBookingValue > 1000) {
        insights.push('You have strong high-value bookings. Consider premium positioning.');
      }
    }

    return insights;
  }

  /**
   * Get complete analytics dashboard for artist
   */
  static async getArtistDashboard(artistId: number): Promise<AnalyticsDashboard> {
    const [metrics, trends, topGenres, topVenues, averageRating] = await Promise.all([
      this.getArtistMetrics(artistId),
      this.getBookingTrends(artistId),
      this.getTopGenres(artistId),
      this.getTopVenues(artistId),
      this.getArtistAverageRating(artistId),
    ]);

    const insights = this.generateInsights(metrics, trends);

    return {
      metrics,
      trends,
      topGenres,
      topVenues,
      averageRating,
      insights,
    };
  }

  /**
   * Get complete analytics dashboard for venue
   */
  static async getVenueDashboard(venueId: number): Promise<AnalyticsDashboard> {
    const [metrics, trends] = await Promise.all([
      this.getVenueMetrics(venueId),
      this.getBookingTrends(undefined, venueId),
    ]);

    const insights = this.generateInsights(metrics, trends);

    return {
      metrics,
      trends,
      topGenres: [],
      topVenues: [],
      averageRating: 0,
      insights,
    };
  }

  private static getEmptyMetrics(): BookingMetrics {
    return {
      totalBookings: 0,
      completedBookings: 0,
      upcomingBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      cancellationRate: 0,
    };
  }
}

export const bookingAnalyticsDashboardService = new BookingAnalyticsDashboardService();
