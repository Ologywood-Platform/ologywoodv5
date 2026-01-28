import { getDb } from "../db";
import { bookings, contracts, users } from "../../drizzle/schema";
import { eq, gte, lte, and } from "drizzle-orm";

export interface RevenueData {
  period: string;
  amount: number;
  transactionCount: number;
}

export interface ArtistRevenue {
  artistId: string;
  artistName: string;
  totalRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
}

export interface VenueRevenue {
  venueId: string;
  venueName: string;
  totalSpent: number;
  bookingCount: number;
  averageBookingCost: number;
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

class PaymentAnalyticsService {
  /**
   * Get revenue trends by time period
   */
  async getRevenueTrends(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month" = "month"): Promise<RevenueData[]> {
    const db = await getDb();
    if (!db) return [];
    
    // This would query the database for payment data
    // For now, returning mock structure
    const trends: RevenueData[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;

      if (groupBy === "day") {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (groupBy === "week") {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else {
        periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Query bookings in this period
      const bookingsInPeriod = await db
        .select()
        .from(bookings)
        .where(
          and(
            gte(bookings.eventDate, periodStart),
            lte(bookings.eventDate, periodEnd),
            eq(bookings.status, "completed")
          )
        );

      const totalAmount = bookingsInPeriod.reduce((sum, booking) => {
        const fee = typeof booking.fee === "number" ? booking.fee : 0;
        return sum + fee;
      }, 0);

      trends.push({
        period: this.formatPeriod(periodStart, groupBy),
        amount: totalAmount,
        transactionCount: bookingsInPeriod.length,
      });

      currentDate = periodEnd;
    }

    return trends;
  }

  /**
   * Get top artists by revenue
   */
  async getTopArtistsByRevenue(limit: number = 10, startDate?: Date, endDate?: Date): Promise<ArtistRevenue[]> {
    const artistRevenue = new Map<string, ArtistRevenue>();

    // Query all completed bookings
    let query = db.select().from(bookings).where(eq(bookings.status, "completed"));

    if (startDate && endDate) {
      query = db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.eventDate, startDate),
            lte(bookings.eventDate, endDate)
          )
        );
    }

    const completedBookings = await query;

    for (const booking of completedBookings) {
      const artistId = booking.artistId as string;
      const fee = typeof booking.fee === "number" ? booking.fee : 0;

      if (!artistRevenue.has(artistId)) {
        artistRevenue.set(artistId, {
          artistId,
          artistName: "", // Will be populated below
          totalRevenue: 0,
          bookingCount: 0,
          averageBookingValue: 0,
        });
      }

      const data = artistRevenue.get(artistId)!;
      data.totalRevenue += fee;
      data.bookingCount += 1;
      data.averageBookingValue = data.totalRevenue / data.bookingCount;
    }

    // Convert to array and sort
    let results = Array.from(artistRevenue.values());
    results.sort((a, b) => b.totalRevenue - a.totalRevenue);
    results = results.slice(0, limit);

    // Populate artist names
    for (const result of results) {
      const artist = await db.select().from(users).where(eq(users.id, result.artistId)).limit(1);
      if (artist.length > 0) {
        result.artistName = artist[0].name || "Unknown Artist";
      }
    }

    return results;
  }

  /**
   * Get top venues by spending
   */
  async getTopVenuesBySpending(limit: number = 10, startDate?: Date, endDate?: Date): Promise<VenueRevenue[]> {
    const venueSpending = new Map<string, VenueRevenue>();

    // Query all completed bookings
    let query = db.select().from(bookings).where(eq(bookings.status, "completed"));

    if (startDate && endDate) {
      query = db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.eventDate, startDate),
            lte(bookings.eventDate, endDate)
          )
        );
    }

    const completedBookings = await query;

    for (const booking of completedBookings) {
      const venueId = booking.venueId as string;
      const fee = typeof booking.fee === "number" ? booking.fee : 0;

      if (!venueSpending.has(venueId)) {
        venueSpending.set(venueId, {
          venueId,
          venueName: "",
          totalSpent: 0,
          bookingCount: 0,
          averageBookingCost: 0,
        });
      }

      const data = venueSpending.get(venueId)!;
      data.totalSpent += fee;
      data.bookingCount += 1;
      data.averageBookingCost = data.totalSpent / data.bookingCount;
    }

    // Convert to array and sort
    let results = Array.from(venueSpending.values());
    results.sort((a, b) => b.totalSpent - a.totalSpent);
    results = results.slice(0, limit);

    // Populate venue names
    for (const result of results) {
      const venue = await db.select().from(users).where(eq(users.id, result.venueId)).limit(1);
      if (venue.length > 0) {
        result.venueName = venue[0].name || "Unknown Venue";
      }
    }

    return results;
  }

  /**
   * Get total revenue statistics
   */
  async getTotalRevenueStats(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
    totalArtists: number;
    totalVenues: number;
  }> {
    let query = db.select().from(bookings).where(eq(bookings.status, "completed"));

    if (startDate && endDate) {
      query = db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            gte(bookings.eventDate, startDate),
            lte(bookings.eventDate, endDate)
          )
        );
    }

    const completedBookings = await query;

    const totalRevenue = completedBookings.reduce((sum: number, booking: any) => {
      const fee = typeof booking.fee === "number" ? booking.fee : 0;
      return sum + fee;
    }, 0);

    const artistIds = new Set(completedBookings.map((b) => b.artistId));
    const venueIds = new Set(completedBookings.map((b) => b.venueId));

    return {
      totalRevenue,
      totalBookings: completedBookings.length,
      averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
      totalArtists: artistIds.size,
      totalVenues: venueIds.size,
    };
  }

  /**
   * Get revenue by artist for a specific period
   */
  async getArtistRevenueDetail(artistId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    bookingCount: number;
    bookings: Array<{
      bookingId: string;
      venueId: string;
      eventDate: Date;
      fee: number;
    }>;
  }> {
    let query = db
      .select()
      .from(bookings)
      .where(and(eq(bookings.artistId, artistId), eq(bookings.status, "completed")));

    if (startDate && endDate) {
      query = db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.artistId, artistId),
            eq(bookings.status, "completed"),
            gte(bookings.eventDate, startDate),
            lte(bookings.eventDate, endDate)
          )
        );
    }

    const artistBookings = await query;

    const totalRevenue = artistBookings.reduce((sum: number, booking: any) => {
      const fee = typeof booking.fee === "number" ? booking.fee : 0;
      return sum + fee;
    }, 0);

    return {
      totalRevenue,
      bookingCount: artistBookings.length,
      bookings: artistBookings.map((b: any) => ({
        bookingId: b.id,
        venueId: b.venueId as string,
        eventDate: b.eventDate as Date,
        fee: typeof b.fee === "number" ? b.fee : 0,
      })),
    };
  }

  /**
   * Format period label
   */
  private formatPeriod(date: Date, groupBy: "day" | "week" | "month"): string {
    const options: Intl.DateTimeFormatOptions = {};

    if (groupBy === "day") {
      options.year = "numeric";
      options.month = "short";
      options.day = "numeric";
    } else if (groupBy === "week") {
      options.year = "numeric";
      options.month = "short";
      options.day = "numeric";
    } else {
      options.year = "numeric";
      options.month = "long";
    }

    return date.toLocaleDateString("en-US", options);
  }
}

export const paymentAnalyticsService = new PaymentAnalyticsService();
