/**
 * Follows Router
 * TRPC endpoints for follow/unfollow operations
 * Premium feature for STARTER and PROFESSIONAL tiers
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as followService from "../services/followService";
import { hasFeatureAccess } from "../services/pricingTierService";

export const followsRouter = router({
  /**
   * Follow an artist or venue
   */
  follow: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      // Check tier access
      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Follow feature requires STARTER tier or higher");
      }

      const success = await followService.followUser(
        ctx.user.id,
        input.followingId,
        input.followingType
      );

      if (!success) {
        throw new Error("Already following this user");
      }

      return { success: true };
    }),

  /**
   * Unfollow an artist or venue
   */
  unfollow: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const success = await followService.unfollowUser(
        ctx.user.id,
        input.followingId,
        input.followingType
      );

      if (!success) {
        throw new Error("Not following this user");
      }

      return { success: true };
    }),

  /**
   * Get follow statistics for a user
   */
  getStats: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const stats = await followService.getFollowStats(input.userId, ctx.user.id);
      return stats;
    }),

  /**
   * Get list of users that a user is following
   */
  getFollowing: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }: any) => {
      const following = await followService.getFollowing(
        input.userId,
        input.limit,
        input.offset
      );
      return following;
    }),

  /**
   * Get list of followers for a user
   */
  getFollowers: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }: any) => {
      const followers = await followService.getFollowers(
        input.userId,
        input.limit,
        input.offset
      );
      return followers;
    }),

  /**
   * Get follow recommendations for current user
   */
  getRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }: any) => {
      // Check tier access
      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        return []; // Return empty for free tier
      }

      const recommendations = await followService.getFollowRecommendations(
        ctx.user.id,
        input.limit
      );
      return recommendations;
    }),

  /**
   * Check if user is following another user
   */
  isFollowing: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]).optional(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const following = await followService.isFollowing(
        ctx.user.id,
        input.followingId,
        input.followingType
      );
      return { isFollowing: following };
    }),

  /**
   * Get mutual followers between two users
   */
  getMutualFollowers: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const mutualCount = await followService.getMutualFollowers(
        ctx.user.id,
        input.userId
      );
      return { mutualFollowers: mutualCount };
    }),

  /**
   * Get trending artists or venues
   */
  getTrending: protectedProcedure
    .input(
      z.object({
        followingType: z.enum(["artist", "venue"]),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }: any) => {
      const trending = await followService.getTrendingUsers(
        input.followingType,
        input.limit
      );
      return trending;
    }),
});
