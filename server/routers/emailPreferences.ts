import { router, protectedProcedure } from "../_core/trpc";
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
      
      return prefs;
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
        const updated = await db.updateEmailPreferences(ctx.user.id, input);
        
        if (!updated) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update email preferences",
          });
        }
        
        return updated;
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
      const updated = await db.updateEmailPreferences(ctx.user.id, {
        frequency: "never",
        bookingUpdates: false,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: false,
        reminders: false,
      });
      
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe from emails",
        });
      }
      
      return updated;
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
      const updated = await db.updateEmailPreferences(ctx.user.id, {
        frequency: "weekly",
        bookingUpdates: true,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      });
      
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resubscribe to emails",
        });
      }
      
      return updated;
    } catch (error) {
      console.error("Error resubscribing to emails:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to resubscribe to emails",
      });
    }
  }),
});
