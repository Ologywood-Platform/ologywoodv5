import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import {
  FanEmailConsentConflictError,
  FanEmailConsentEligibilityError,
  getFanEmailConsent,
  getFanUnsubscribeStatus,
  setFanEmailConsent,
  unsubscribeFanByToken,
  FAN_EMAIL_UNSUBSCRIBE_SCOPE,
} from "../services/fanEmailConsentService";

export const emailPreferencesRouter = router({
  // Get current user's email preferences
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      let prefs = await db.getEmailPreferences(ctx.user.id);
      
      // If preferences don't exist, create default ones
      if (!prefs) {
        prefs = await db.createEmailPreferences(ctx.user.id);
      }
      
      if (!prefs) throw new Error('Email preferences could not be loaded');
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
        fanUpdates: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // updateEmailPreferences now returns the updated preferences
        const updated = await db.updateEmailPreferences(ctx.user.id, input);
        
        if (!updated) throw new Error('Email preference change could not be confirmed');
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
        fanUpdates: false,
      });
      
      if (!updated) throw new Error('Email opt-out could not be confirmed');
      return { success: true, message: "Unsubscribed from all emails", unsubscribedAt: updated.unsubscribedAt };
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
        fanUpdates: true,
      });
      
      if (!updated) throw new Error('Email preference restoration could not be confirmed');
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

  /** Explicit permission is per creator; a follow alone is never consent. */
  getFanConsent: protectedProcedure
    .input(z.object({ creatorId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => getFanEmailConsent(ctx.user.id, input.creatorId)),

  setFanConsent: protectedProcedure
    .input(z.object({
      creatorId: z.number().int().positive(),
      optIn: z.boolean(),
      expectedRevision: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await setFanEmailConsent(ctx.user.id, input.creatorId, {
          optIn: input.optIn,
          expectedRevision: input.expectedRevision,
        });
      } catch (error) {
        if (error instanceof FanEmailConsentConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: error.message });
        }
        if (error instanceof FanEmailConsentEligibilityError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to change creator email consent" });
      }
    }),

  /** Public and deliberately generic: no user, email, creator, or title leaks. */
  getFanUnsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1).max(2048) }))
    .query(async ({ input }) => {
      const status = await getFanUnsubscribeStatus(input.token);
      return status.valid
        ? { valid: true, scope: FAN_EMAIL_UNSUBSCRIBE_SCOPE }
        : { valid: false };
    }),

  /** No sign-in is required because a current HMAC scoped capability authorizes it. */
  unsubscribeFan: publicProcedure
    .input(z.object({ token: z.string().min(1).max(2048) }))
    .mutation(async ({ input }) => {
      const success = await unsubscribeFanByToken(input.token);
      if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Unsubscribe link is invalid or expired" });
      return { success: true, scope: FAN_EMAIL_UNSUBSCRIBE_SCOPE };
    }),
});
