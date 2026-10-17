/**
 * Artist Updates Router
 * tRPC endpoints for the "Send Update" feature.
 * Paid-tier artists can compose and send custom email blasts to their fan list.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { hasFeatureAccess } from "../services/pricingTierService";
import * as artistUpdateService from "../services/artistUpdateService";
import { TRPCError } from "@trpc/server";
import { assertFanEmailCreator } from '../services/fanEmailAccessService';
import { getEligibleFanEmailCount } from '../services/fanEmailConsentService';

export const artistUpdatesRouter = router({
  /**
   * Check if the artist can send an update (rate limit check)
   */
  canSend: protectedProcedure.query(async ({ ctx }: any) => {
    await assertFanEmailCreator(ctx.user.id);

    // Check paid tier access (uses riderBuilder as the feature gate for starter+)
    const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
    if (!hasAccess) {
      return {
        canSend: false,
        hasAccess: false,
        eligibleCount: 0,
        message: "Upgrade to Starter tier or higher to send updates to your fans",
      };
    }

    const [rateCheck, eligibleTotal] = await Promise.all([
      artistUpdateService.canSendUpdate(ctx.user.id), getEligibleFanEmailCount(ctx.user.id),
    ]);
    const eligibleCount = Math.min(eligibleTotal, 10000);
    return {
      canSend: rateCheck.allowed && eligibleCount > 0,
      eligibleCount,
      eligibleTotal,
      recipientLimit: 10000,
      hasAccess: true,
      nextAllowedAt: rateCheck.nextAllowedAt?.toISOString() || null,
      lastSentAt: rateCheck.lastSentAt?.toISOString() || null,
      message: !eligibleCount ? "No eligible opted-in fans yet." : rateCheck.allowed ? null : "You can send one update per day. Try again later.",
    };
  }),

  /**
   * Send an update email blast to all fans
   */
  send: protectedProcedure
    .input(
      z.object({
        subject: z.string().trim().min(1, "Subject is required").max(200, "Subject too long"),
        body: z.string().trim().min(1, "Body is required").max(5000, "Body too long (max 5000 characters)"),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      await assertFanEmailCreator(ctx.user.id);

      // Check paid tier
      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Upgrade to Starter tier or higher to send updates",
        });
      }

      // Check rate limit
      const rateCheck = await artistUpdateService.canSendUpdate(ctx.user.id);
      if (!rateCheck.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You can only send one update per day. Try again later.",
        });
      }

      // Send the update
      const result = await artistUpdateService.sendArtistUpdate(
        ctx.user.id,
        input.subject,
        input.body
      );

      return {
        success: true,
        updateId: result.updateId,
        recipientCount: result.recipientCount,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        skippedCount: result.skippedCount,
      };
    }),

  /**
   * Get update history for the current artist
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }: any) => {
      await assertFanEmailCreator(ctx.user.id);

      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        return { updates: [], hasAccess: false };
      }

      const updates = await artistUpdateService.getUpdateHistory(
        ctx.user.id,
        input.limit,
        input.offset
      );

      return {
        updates: updates.map((u) => ({
          id: u.id,
          subject: u.subject,
          body: u.body,
          recipientCount: u.recipientCount,
          sentCount: u.sentCount,
          failedCount: u.failedCount,
          skippedCount: Math.max(0, u.recipientCount - u.sentCount - u.failedCount),
          status: u.status,
          sentAt: u.sentAt.toISOString(),
        })),
        hasAccess: true,
      };
    }),
});
