import { router, protectedProcedure } from "../_core/trpc";
import { paymentAnalyticsService } from "../services/paymentAnalyticsService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const paymentAnalyticsRouter = router({
  /**
   * Get revenue trends over time
   */
  getRevenueTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["day", "week", "month"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only admins can view all analytics
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await paymentAnalyticsService.getRevenueTrends(input.startDate, input.endDate, input.groupBy);
    }),

  /**
   * Get top artists by revenue
   */
  getTopArtists: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await paymentAnalyticsService.getTopArtistsByRevenue(input.limit, input.startDate, input.endDate);
    }),

  /**
   * Get top venues by spending
   */
  getTopVenues: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await paymentAnalyticsService.getTopVenuesBySpending(input.limit, input.startDate, input.endDate);
    }),

  /**
   * Get total revenue statistics
   */
  getTotalStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await paymentAnalyticsService.getTotalRevenueStats(input.startDate, input.endDate);
    }),

  /**
   * Get artist revenue details
   */
  getArtistDetail: protectedProcedure
    .input(
      z.object({
        artistId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Artists can only view their own data
      if (ctx.user.role === "artist" && ctx.user.id !== input.artistId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Can only view your own analytics" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "artist") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      return await paymentAnalyticsService.getArtistRevenueDetail(input.artistId, input.startDate, input.endDate);
    }),

  /**
   * Export analytics data (CSV)
   */
  exportData: protectedProcedure
    .input(
      z.object({
        type: z.enum(["revenue_trends", "top_artists", "top_venues"]),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      // Generate CSV data
      let csvData = "";

      if (input.type === "revenue_trends") {
        const trends = await paymentAnalyticsService.getRevenueTrends(input.startDate, input.endDate, "month");
        csvData = "Period,Amount,Transaction Count\n";
        trends.forEach((trend) => {
          csvData += `${trend.period},${trend.amount},${trend.transactionCount}\n`;
        });
      } else if (input.type === "top_artists") {
        const artists = await paymentAnalyticsService.getTopArtistsByRevenue(100, input.startDate, input.endDate);
        csvData = "Artist Name,Total Revenue,Booking Count,Average Booking Value\n";
        artists.forEach((artist) => {
          csvData += `${artist.artistName},${artist.totalRevenue},${artist.bookingCount},${artist.averageBookingValue}\n`;
        });
      } else if (input.type === "top_venues") {
        const venues = await paymentAnalyticsService.getTopVenuesBySpending(100, input.startDate, input.endDate);
        csvData = "Venue Name,Total Spent,Booking Count,Average Booking Cost\n";
        venues.forEach((venue) => {
          csvData += `${venue.venueName},${venue.totalSpent},${venue.bookingCount},${venue.averageBookingCost}\n`;
        });
      }

      return {
        success: true,
        data: csvData,
        filename: `analytics_${input.type}_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
});
