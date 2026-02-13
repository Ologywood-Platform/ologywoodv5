import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { follows } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const followsRouter = router({
  // Follow an artist or venue
  follow: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      
      // Check if already following
      const existing = await database
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.followingId),
            eq(follows.followingType, input.followingType)
          )
        );

      if (existing.length > 0) {
        throw new Error("Already following this artist");
      }

      // Create follow
      const result = await database.insert(follows).values({
        followerId: ctx.user.id,
        followingId: input.followingId,
        followingType: input.followingType,
      });

      return { success: true, followId: result.insertId };
    }),

  // Unfollow an artist or venue
  unfollow: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      
      await database
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.followingId),
            eq(follows.followingType, input.followingType)
          )
        );

      return { success: true };
    }),

  // Get user's followed artists
  getFollowedArtists: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    
    const followedArtists = await database
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, ctx.user.id),
          eq(follows.followingType, "artist")
        )
      );

    return followedArtists;
  }),

  // Get user's followed venues
  getFollowedVenues: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    
    const followedVenues = await database
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, ctx.user.id),
          eq(follows.followingType, "venue")
        )
      );

    return followedVenues;
  }),

  // Check if user is following an artist/venue
  isFollowing: protectedProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      
      const result = await database
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.followingId),
            eq(follows.followingType, input.followingType)
          )
        );

      return result.length > 0;
    }),

  // Get followers count for an artist/venue
  getFollowersCount: publicProcedure
    .input(
      z.object({
        followingId: z.number(),
        followingType: z.enum(["artist", "venue"]),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      
      const result = await database
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followingId, input.followingId),
            eq(follows.followingType, input.followingType)
          )
        );

      return result.length;
    }),
});
