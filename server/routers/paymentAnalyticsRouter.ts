import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const paymentAnalyticsRouter = router({
  getRevenueTrends: publicProcedure.input(z.object({ startDate: z.date(), endDate: z.date(), groupBy: z.enum(["day", "week", "month"]).default("month") })).query(async () => []),
  getTopArtists: publicProcedure.input(z.object({ limit: z.number().default(10), startDate: z.date().optional(), endDate: z.date().optional() })).query(async () => []),
  getTopVenues: publicProcedure.input(z.object({ limit: z.number().default(10), startDate: z.date().optional(), endDate: z.date().optional() })).query(async () => []),
  getTotalStats: publicProcedure.input(z.object({ startDate: z.date().optional(), endDate: z.date().optional() })).query(async () => ({})),
  getArtistDetail: publicProcedure.input(z.object({ artistId: z.string(), startDate: z.date().optional(), endDate: z.date().optional() })).query(async () => ({})),
  exportData: publicProcedure.input(z.object({ type: z.enum(["revenue_trends", "top_artists", "top_venues"]), startDate: z.date(), endDate: z.date() })).query(async () => ({ success: true, data: "", filename: "" })),
});
