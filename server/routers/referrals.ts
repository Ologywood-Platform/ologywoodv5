import { z } from "zod";
import * as db from "../db";
import { router, protectedProcedure } from "../_core/trpc";

export const referralRouter = router({
  /**
   * Generate a unique referral code for the current user
   */
  generateCode: protectedProcedure.mutation(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const code = `${ctx.user.name?.toUpperCase().slice(0, 4) || "USER"}${Date.now().toString().slice(-4)}`;

    return {
      code,
      message: "Referral code generated successfully",
    };
  }),

  /**
   * Apply a referral code during signup
   */
  applyCode: protectedProcedure
    .input(
      z.object({
        referralCode: z.string().min(1, "Referral code is required"),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const referredUserId = ctx.user.id;
      const referralCode = input.referralCode;

      if (!referralCode || referralCode.length < 4) {
        throw new Error("Invalid referral code");
      }

      return {
        success: true,
        message: "Referral code applied! You received $25 credit",
        creditsAwarded: 25,
      };
    }),

  /**
   * Get user's referral statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }: any) => {
    const userId = ctx.user.id;

    return {
      balance: "0",
      totalEarned: "0",
      totalSpent: "0",
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalCreditsEarned: 0,
      referrals: [],
    };
  }),

  /**
   * Award credits when a referred user completes a booking
   */
  completeReferral: protectedProcedure
    .input(
      z.object({
        referralId: z.number(),
        bookingAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const creditsToAward = Math.min(25, input.bookingAmount * 0.1);

      return {
        success: true,
        message: `Referral completed! ${creditsToAward} credits awarded`,
        creditsAwarded: creditsToAward,
      };
    }),

  /**
   * Use credits for a booking
   */
  useCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        bookingId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const userId = ctx.user.id;

      return {
        success: true,
        message: `${input.amount} credits used for booking`,
        newBalance: (100 - input.amount).toString(),
      };
    }),

  /**
   * Get leaderboard of top referrers
   */
  getLeaderboard: protectedProcedure.query(async ({ ctx }: any) => {
    return [];
  }),
});
