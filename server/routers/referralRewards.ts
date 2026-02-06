import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  awardReferralCredits,
  getArtistRewardsStats,
  redeemCredits,
  getArtistCredits,
} from "../services/referralRewardsService";

export const referralRewardsRouter = router({
  // Get artist's rewards statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await getArtistRewardsStats(ctx.user.id);
      return stats;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch rewards stats");
    }
  }),

  // Get artist's current credit balance
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const credits = await getArtistCredits(ctx.user.id);
      return { credits };
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch credits");
    }
  }),

  // Redeem credits (artist only)
  redeemCredits: protectedProcedure
    .input(z.object({ creditsToRedeem: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "artist") {
          throw new Error("Only artists can redeem credits");
        }

        const result = await redeemCredits(ctx.user.id, input.creditsToRedeem);
        return result;
      } catch (error: any) {
        throw new Error(error.message || "Failed to redeem credits");
      }
    }),

  // Award credits when follower books (internal use)
  awardCredits: protectedProcedure
    .input(
      z.object({
        artistId: z.number(),
        bookingId: z.number(),
        followerId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Only allow if user is admin or the artist
        if (ctx.user.id !== input.artistId && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const reward = await awardReferralCredits(
          input.artistId,
          input.bookingId,
          input.followerId
        );
        return { success: true, reward };
      } catch (error: any) {
        throw new Error(error.message || "Failed to award credits");
      }
    }),
});
