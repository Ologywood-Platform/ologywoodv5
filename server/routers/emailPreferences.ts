import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const emailPreferencesRouter = router({
  // Get current user's email preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      let prefs = await db.getEmailPreferences(ctx.user.id);
      
      // If preferences don't exist, create default ones
      if (!prefs) {
        prefs = await db.createEmailPreferences(ctx.user.id);
      }
      
      // Always return a valid object (never null/undefined for React Query)
      return prefs || {
        userId: ctx.user.id,
        frequency: 'weekly' as const,
        bookingUpdates: true,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      };
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch email preferences",
      });
    }
  }),

  // Update email preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        frequency: z.enum(["daily", "weekly", "never"]).optional(),
        bookingUpdates: z.boolean().optional(),
        newOpportunities: z.boolean().optional(),
        platformNews: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        reminders: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // updateEmailPreferences now returns the updated preferences
        const updated = await db.updateEmailPreferences(ctx.user.id, input);
        
        return updated || {
          userId: ctx.user.id,
          frequency: 'weekly' as const,
          bookingUpdates: true,
          newOpportunities: true,
          platformNews: false,
          weeklyDigest: true,
          reminders: true,
        };
      } catch (error) {
        console.error("Error updating email preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update email preferences",
        });
      }
    }),

  // Unsubscribe from all emails
  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.updateEmailPreferences(ctx.user.id, {
        frequency: "never",
        bookingUpdates: false,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: false,
        reminders: false,
      });
      
      return { success: true, message: "Unsubscribed from all emails" };
    } catch (error) {
      console.error("Error unsubscribing from all emails:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to unsubscribe from emails",
      });
    }
  }),

  // Resubscribe to emails
  resubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.updateEmailPreferences(ctx.user.id, {
        frequency: "weekly",
        bookingUpdates: true,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      });
      
      return { success: true, message: "Resubscribed to emails" };
    } catch (error) {
      console.error("Error resubscribing to emails:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to resubscribe to emails",
      });
    }
  }),

  // Submit unsubscribe feedback
  submitUnsubscribeFeedback: protectedProcedure
    .input(
      z.object({
        reason: z.string().min(1).max(100),
        comment: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.insertUnsubscribeFeedback({
          userId: ctx.user.id,
          email: ctx.user.email || null,
          reason: input.reason,
          comment: input.comment || null,
        });
        return { success: true, message: "Thank you for your feedback" };
      } catch (error) {
        console.error("Error saving unsubscribe feedback:", error);
        // Don't throw — feedback is best-effort, don't block the user
        return { success: false, message: "Could not save feedback" };
      }
    }),

  // Delete email preferences (for account cleanup)
  deletePreferences: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.deleteEmailPreferences(ctx.user.id);
      return { success: true, message: "Email preferences deleted" };
    } catch (error) {
      console.error("Error deleting email preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete email preferences",
      });
    }
  }),
});
