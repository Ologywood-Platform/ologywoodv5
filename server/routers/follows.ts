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

export const followsRouter = router({
  /**
   * Follow an artist or venue (free for all logged-in users)
   */
  follow: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
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
   * Get follow statistics for a user (public - no auth required for follower count)
   */
  getStats: publicProcedure
    .input(z.object({ userId: z.number() }))
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
   * Get list of followers for a user (names only, no emails)
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
   * Get fan email list for an artist (PAID TIER ONLY)
   * Returns full fan details including emails for artists on paid tiers
   */
  getFanEmails: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }: any) => {
      // Only artists can access their fan email list
      if (ctx.user.role !== "artist") {
        throw new Error("Only artists can access fan email lists");
      }

      // Check tier access - requires paid tier
      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        return {
          fans: [],
          totalCount: await followService.getFollowerCount(ctx.user.id),
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

      return {
        fans,
        totalCount,
        hasAccess: true,
        message: null,
      };
    }),

  /**
   * Export fan email list as CSV (PAID TIER ONLY)
   */
  exportFanEmails: protectedProcedure
    .query(async ({ ctx }: any) => {
      if (ctx.user.role !== "artist") {
        throw new Error("Only artists can export fan email lists");
      }

      const hasAccess = await hasFeatureAccess(ctx.user.id, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Upgrade to STARTER tier or higher to export fan emails");
      }

      const fans = await followService.getFanEmailList(ctx.user.id, 10000, 0);
      
      // Build CSV
      const csvHeader = "Name,Email,Followed At\n";
      const csvRows = fans.map(f => 
        `"${(f.name || '').replace(/"/g, '""')}","${f.email}","${f.followedAt.toISOString()}"`
      ).join("\n");

      return {
        csv: csvHeader + csvRows,
        filename: `ologywood-fans-${new Date().toISOString().split('T')[0]}.csv`,
        totalCount: fans.length,
      };
    }),

  /**
   * Get follow recommendations for current user
   */
  getRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
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

  /**
   * Get suggested artists with enriched profile data.
   * For logged-in users: personalized recommendations based on mutual follows,
   * falling back to all artists if no recommendations exist.
   * For logged-out users: returns all artists sorted by name.
   * Always excludes artists the current user already follows.
   */
  getSuggestedArtists: publicProcedure
    .input(z.object({ limit: z.number().default(8) }).optional().default({ limit: 8 }))
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

      // Build enriched artist list
      // Priority: recommended artists first, then remaining artists
      const enriched: any[] = [];
      const addedUserIds = new Set<number>();

      // Helper to enrich an artist profile
      const enrichArtist = async (artist: any, isRecommended: boolean) => {
        const userId = artist.userId;
        if (followingIds.has(userId) || addedUserIds.has(userId)) return null;
        // Don't suggest yourself
        if (currentUserId && userId === currentUserId) return null;
        addedUserIds.add(userId);

        let followerCount = 0;
        try {
          followerCount = await followService.getFollowerCount(userId);
        } catch (_) { /* ignore */ }

        return {
          id: artist.id,
          userId: artist.userId,
          artistName: artist.artistName || 'Unknown',
          genres: Array.isArray(artist.genre) ? artist.genre : [],
          location: artist.location || null,
          profilePhotoUrl: artist.profilePhotoUrl || null,
          followerCount,
          isRecommended,
        };
      };

      // Add recommended artists first
      for (const recUserId of recommendedUserIds) {
        const artist = allArtists.find((a: any) => a.userId === recUserId);
        if (artist) {
          const enrichedArtist = await enrichArtist(artist, true);
          if (enrichedArtist) enriched.push(enrichedArtist);
        }
        if (enriched.length >= limit) break;
      }

      // Fill remaining slots with other artists
      if (enriched.length < limit) {
        // Shuffle remaining artists for variety
        const remaining = allArtists
          .filter((a: any) => !addedUserIds.has(a.userId))
          .sort(() => Math.random() - 0.5);

        for (const artist of remaining) {
          const enrichedArtist = await enrichArtist(artist, false);
          if (enrichedArtist) enriched.push(enrichedArtist);
          if (enriched.length >= limit) break;
        }
      }

      return enriched;
    }),
});
