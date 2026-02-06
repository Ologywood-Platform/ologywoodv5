import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getBookingAnalytics,
  generateCSV,
  generatePDFHTML,
} from "../services/bookingAnalyticsExportService";

export const bookingAnalyticsExportRouter = router({
  // Get analytics data
  getAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const analytics = await getBookingAnalytics(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
        return analytics;
      } catch (error: any) {
        throw new Error(error.message || "Failed to fetch analytics");
      }
    }),

  // Export as CSV
  exportCSV: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const analytics = await getBookingAnalytics(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
        const csv = generateCSV(analytics);
        return {
          success: true,
          data: csv,
          filename: `booking-analytics-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error: any) {
        throw new Error(error.message || "Failed to export CSV");
      }
    }),

  // Export as PDF (returns HTML)
  exportPDF: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const analytics = await getBookingAnalytics(
          ctx.user.id,
          input.startDate,
          input.endDate
        );
        const html = generatePDFHTML(analytics);
        return {
          success: true,
          data: html,
          filename: `booking-analytics-${new Date().toISOString().split("T")[0]}.pdf`,
        };
      } catch (error: any) {
        throw new Error(error.message || "Failed to export PDF");
      }
    }),
});
