import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  subscribeToAvailabilityAlerts,
  unsubscribeFromAvailabilityAlerts,
  getUserAlertSubscriptions,
  getArtistSubscriberCount,
  sendAvailabilityAlerts,
} from "../services/availabilityAlertsService";

export const availabilityAlertsRouter = router({
  // Subscribe to availability alerts for an artist
  subscribe: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await subscribeToAvailabilityAlerts(ctx.user.id, input.artistId);
        return { success: true, subscription: result };
      } catch (error: any) {
        throw new Error(error.message || "Failed to subscribe to alerts");
      }
    }),

  // Unsubscribe from availability alerts
  unsubscribe: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await unsubscribeFromAvailabilityAlerts(ctx.user.id, input.artistId);
        return { success: true };
      } catch (error: any) {
        throw new Error(error.message || "Failed to unsubscribe from alerts");
      }
    }),

  // Get user's alert subscriptions
  getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscriptions = await getUserAlertSubscriptions(ctx.user.id);
      return subscriptions;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch subscriptions");
    }
  }),

  // Get subscriber count for an artist
  getSubscriberCount: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .query(async ({ input }) => {
      try {
        const count = await getArtistSubscriberCount(input.artistId);
        return { count };
      } catch (error: any) {
        throw new Error(error.message || "Failed to fetch subscriber count");
      }
    }),

  // Check if user is subscribed to an artist
  isSubscribed: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const subscriptions = await getUserAlertSubscriptions(ctx.user.id);
        const isSubscribed = subscriptions.some((sub) => sub.artistId === input.artistId);
        return { isSubscribed };
      } catch (error: any) {
        throw new Error(error.message || "Failed to check subscription status");
      }
    }),

  // Send availability alerts (admin only - triggered when artist adds availability)
  sendAlerts: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is the artist or admin
      if (ctx.user.id !== input.artistId && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      try {
        await sendAvailabilityAlerts(input.artistId);
        return { success: true, message: "Alerts sent to all subscribers" };
      } catch (error: any) {
        throw new Error(error.message || "Failed to send alerts");
      }
    }),
});
