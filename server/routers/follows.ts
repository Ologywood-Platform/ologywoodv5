/**
 * Follows Router
 * TRPC endpoints for follow/unfollow operations
 * Follow is free for all users. Fan email list access requires paid tier.
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as followService from "../services/followService";
import { hasFeatureAccess } from "../services/pricingTierService";
import * as db from "../db";
import { TRPCError } from '@trpc/server';
import { assertFanEmailCreator } from '../services/fanEmailAccessService';
import { getFanEmailConsent, setFanEmailConsent, getEligibleFanEmailCount, FanEmailConsentConflictError, FanEmailConsentEligibilityError } from '../services/fanEmailConsentService';
import { fanEmailCsvCell } from '../services/fanEmailFormatting';

const safeUserId = z.number().int().safe().positive();
const listLimit = z.number().int().min(1).max(100);
const listOffset = z.number().int().min(0).max(1_000_000);
const recommendationLimit = z.number().int().min(1).max(50);

export const followsRouter = router({
  /**
   * Follow an artist or venue (free for all logged-in users)
   */
  follow: protectedProcedure
    .input(
      z.object({
        followingId: safeUserId,
        followingType: z.enum(["artist", "venue"]),
      }).strict()
    )
    .mutation(async ({ ctx, input }: any) => {
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
        followingId: safeUserId,
        followingType: z.enum(["artist", "venue"]),
      }).strict()
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

  // Email permission belongs to the signed-in fan, not a creator or purchaser.
  getEmailConsent: protectedProcedure
    .input(z.object({ followingId: z.number().int().positive() }).strict())
    .query(({ ctx, input }) => getFanEmailConsent(ctx.user.id, input.followingId)),
  setEmailConsent: protectedProcedure
    .input(z.object({ followingId: safeUserId, optIn: z.boolean(), expectedRevision: z.number().int().min(0).max(1_000_000_000) }).strict())
    .mutation(async ({ ctx, input }) => {
      try { return await setFanEmailConsent(ctx.user.id, input.followingId, { optIn: input.optIn, expectedRevision: input.expectedRevision }); }
      catch (error) {
        if (error instanceof FanEmailConsentConflictError) throw new TRPCError({ code: 'CONFLICT', message: error.message });
        if (error instanceof FanEmailConsentEligibilityError) throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email permission could not be saved. Please try again.' });
      }
    }),

  /**
   * Get follow statistics for a user (public - no auth required for follower count)
   */
  getStats: publicProcedure
    .input(z.object({ userId: safeUserId }).strict())
    .query(async ({ ctx, input }: any) => {
      const currentUserId = ctx.user?.id;
      const stats = await followService.getFollowStats(input.userId, currentUserId);
      return stats;
    }),

  /**
   * Get list of users that a user is following
   */
  getFollowing: protectedProcedure
    .input(
      z.object({
        userId: safeUserId,
        limit: listLimit.default(50),
        offset: listOffset.default(0),
      }).strict()
    )
    .query(async ({ ctx, input }: any) => {
      if (input.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Open your own following list." });
      const following = await followService.getFollowing(
        input.userId,
        input.limit,
        input.offset
      );
      return following;
    }),

  /**
   * Get list of followers for a user (names only, no emails)
   */
  getFollowers: protectedProcedure
    .input(
      z.object({
        userId: safeUserId,
        limit: listLimit.default(50),
        offset: listOffset.default(0),
      }).strict()
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
   * Get fan email list for an artist (PAID TIER ONLY)
   * Returns full fan details including emails for artists on paid tiers
   */
  getFanEmails: protectedProcedure
    .input(
      z.object({
        limit: listLimit.default(100),
        offset: listOffset.default(0),
      }).strict()
    )
    .query(async ({ ctx, input }: any) => {
      await assertFanEmailCreator(ctx.user.id);

      // Check tier access - requires paid tier
      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        return {
          fans: [],
          totalCount: await followService.getFollowerCount(ctx.user.id),
          eligibleCount: 0,
          hasAccess: false,
          message: "Upgrade to STARTER tier or higher to access your fan email list",
        };
      }

      const fans = await followService.getFanEmailList(
        ctx.user.id,
        input.limit,
        input.offset
      );
      const totalCount = await followService.getFollowerCount(ctx.user.id);
      const eligibleCount = await getEligibleFanEmailCount(ctx.user.id);

      return {
        fans,
        totalCount,
        eligibleCount,
        hasAccess: true,
        message: null,
      };
    }),

  /**
   * Export fan email list as CSV (PAID TIER ONLY)
   */
  exportFanEmails: protectedProcedure
    .query(async ({ ctx }: any) => {
      await assertFanEmailCreator(ctx.user.id);

      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Starter tier or higher to export fan emails." });
      }

      const fans = await followService.getFanEmailList(ctx.user.id, 10000, 0);
      const eligibleCount = await getEligibleFanEmailCount(ctx.user.id);
      const csvHeader = 'Name,Email,Followed At\r\n';
      const csvRows = fans.map(f => [f.name || 'Fan', f.email, f.followedAt.toISOString()].map(fanEmailCsvCell).join(',')).join('\r\n');

      return {
        csv: csvHeader + csvRows,
        filename: `ologywood-fans-${new Date().toISOString().split('T')[0]}.csv`,
        totalCount: fans.length,
        truncated: eligibleCount > fans.length,
      };
    }),

  /**
   * Get follow recommendations for current user
   */
  getRecommendations: protectedProcedure
    .input(z.object({ limit: recommendationLimit.default(10) }).strict())
    .query(async ({ ctx, input }: any) => {
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
        followingId: safeUserId,
        followingType: z.enum(["artist", "venue"]).optional(),
      }).strict()
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
    .input(z.object({ userId: safeUserId }).strict())
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
        limit: recommendationLimit.default(10),
      }).strict()
    )
    .query(async ({ input }: any) => {
      const trending = await followService.getTrendingUsers(
        input.followingType,
        input.limit
      );
      return trending;
    }),

  /**
   * Get suggested artists with enriched profile data.
   * For logged-in users: personalized recommendations based on mutual follows,
   * falling back to all artists if no recommendations exist.
   * For logged-out users: returns all artists sorted by name.
   * Always excludes artists the current user already follows.
   */
  getSuggestedArtists: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(24).default(8) }).strict().optional().default({ limit: 8 }))
    .query(async ({ ctx, input }: any) => {
      const currentUserId = ctx.user?.id;
      const limit = input?.limit ?? 8;

      // Get all artist profiles
      const allArtists = await db.getAllArtists();
      if (!allArtists || allArtists.length === 0) return [];

      // Get IDs the user already follows (so we can exclude them)
      let followingIds = new Set<number>();
      if (currentUserId) {
        try {
          const userFollowing = await followService.getFollowing(currentUserId, 1000, 0);
          followingIds = new Set(userFollowing.map((f: any) => f.id));
        } catch (_) { /* ignore */ }
      }

      // Try personalized recommendations first (logged-in users only)
      let recommendedUserIds: number[] = [];
      if (currentUserId) {
        try {
          const recs = await followService.getFollowRecommendations(currentUserId, limit);
          recommendedUserIds = recs.map(r => r.id);
        } catch (_) { /* ignore */ }
      }

      // Build the candidate list first, then fetch follower counts in one grouped query.
      // Priority remains: personalized recommendations first, random fallback second.
      const artistsByUserId = new Map(allArtists.map((artist: any) => [artist.userId, artist]));
      const addedUserIds = new Set<number>();
      const candidates: Array<{ artist: any; isRecommended: boolean }> = [];

      const addCandidate = (artist: any, isRecommended: boolean) => {
        const userId = artist.userId;
        if (followingIds.has(userId) || addedUserIds.has(userId)) return;
        if (currentUserId && userId === currentUserId) return;
        addedUserIds.add(userId);
        candidates.push({ artist, isRecommended });
      };

      for (const recUserId of recommendedUserIds) {
        const artist = artistsByUserId.get(recUserId);
        if (artist) addCandidate(artist, true);
        if (candidates.length >= limit) break;
      }

      if (candidates.length < limit) {
        const remaining = allArtists
          .filter((artist: any) => !addedUserIds.has(artist.userId))
          .sort(() => Math.random() - 0.5);
        for (const artist of remaining) {
          addCandidate(artist, false);
          if (candidates.length >= limit) break;
        }
      }

      let followerCounts = new Map<number, number>();
      try {
        followerCounts = await followService.getFollowerCounts(candidates.map(({ artist }) => artist.userId));
      } catch (_) { /* keep zero counts if the aggregate is unavailable */ }

      return candidates.map(({ artist, isRecommended }) => ({
        id: artist.id,
        userId: artist.userId,
        artistName: artist.artistName || 'Unknown',
        genres: Array.isArray(artist.genre) ? artist.genre : [],
        location: artist.location || null,
        profilePhotoUrl: artist.profilePhotoUrl || null,
        followerCount: followerCounts.get(artist.userId) ?? 0,
        isRecommended,
      }));
    }),
});
