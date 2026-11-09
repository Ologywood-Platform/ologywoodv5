import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { RateLimiter } from "../utils/rateLimiter";
import {
  FanEmailConsentConflictError,
  FanEmailConsentEligibilityError,
  getFanEmailConsent,
  getFanUnsubscribeStatus,
  setFanEmailConsent,
  unsubscribeFanByToken,
  FAN_EMAIL_UNSUBSCRIBE_SCOPE,
} from "../services/fanEmailConsentService";

const creatorIdSchema = z.number().int().safe().positive();
const fanUnsubscribeToken = z.string().trim().min(20).max(512).regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u, 'Invalid unsubscribe token');
const publicUnsubscribeLimiter = new RateLimiter({ maxRequests: 60, windowMs: 60 * 1000, namespace: 'public-unsubscribe' });

function clientIp(ctx: { req?: { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } } }): string {
  return ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
    || ctx.req?.socket?.remoteAddress || 'unknown';
}

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
      console.error("Error fetching email preferences");
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
      }).strict().refine((input) => Object.keys(input).length > 0, 'At least one preference is required')
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // updateEmailPreferences now returns the updated preferences
        const updated = await db.updateEmailPreferences(ctx.user.id, input);
        
        if (!updated) throw new Error('Email preference change could not be confirmed');
        return updated;
      } catch (error) {
      console.error("Error updating email preferences");
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
      console.error("Error unsubscribing from all emails");
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
      console.error("Error resubscribing to emails", error instanceof Error ? error.constructor.name : typeof error);
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
        reason: z.string().trim().min(1).max(100),
        comment: z.string().trim().max(500).optional(),
      }).strict()
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
        console.error("Error saving unsubscribe feedback");
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
      console.error("Error deleting email preferences");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete email preferences",
      });
      }
    }),

  /** Explicit permission is per creator; a follow alone is never consent. */
  getFanConsent: protectedProcedure
    .input(z.object({ creatorId: creatorIdSchema }).strict())
    .query(async ({ ctx, input }) => getFanEmailConsent(ctx.user.id, input.creatorId)),

  setFanConsent: protectedProcedure
    .input(z.object({
      creatorId: creatorIdSchema,
      optIn: z.boolean(),
      expectedRevision: z.number().int().safe().min(0).max(1_000_000_000),
    }).strict())
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
    .input(z.object({ token: fanUnsubscribeToken }).strict())
    .query(async ({ input, ctx }) => {
      if (!(await publicUnsubscribeLimiter.checkAsync(`ip:${clientIp(ctx)}`)).allowed) return { valid: false };
      const status = await getFanUnsubscribeStatus(input.token);
      return status.valid
        ? { valid: true, scope: FAN_EMAIL_UNSUBSCRIBE_SCOPE }
        : { valid: false };
    }),

  /** No sign-in is required because a current HMAC scoped capability authorizes it. */
  unsubscribeFan: publicProcedure
    .input(z.object({ token: fanUnsubscribeToken }).strict())
    .mutation(async ({ input, ctx }) => {
      if (!(await publicUnsubscribeLimiter.checkAsync(`ip:${clientIp(ctx)}`)).allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please try again later" });
      }
      const success = await unsubscribeFanByToken(input.token);
      if (!success) throw new TRPCError({ code: "NOT_FOUND", message: "Unsubscribe link is invalid or expired" });
      return { success: true, scope: FAN_EMAIL_UNSUBSCRIBE_SCOPE };
    }),
});
