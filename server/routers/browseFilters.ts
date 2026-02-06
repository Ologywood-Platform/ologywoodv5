import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { artistProfiles, follows } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export const browseFiltersRouter = router({
  // Get artists filtered by following status
  getFollowingArtists: protectedProcedure
    .input(
      z.object({
        showFollowingOnly: z.boolean().default(false),
        genre: z.string().optional(),
        location: z.string().optional(),
        minRating: z.number().optional(),
        maxPrice: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) return [];

      // Get user's followed artists
      const followedArtists = await database
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingType, "artist")
          )
        );

      const followedArtistIds = followedArtists.map((f) => f.followingId);

      // Get all artists
      let artists = await database.select().from(artistProfiles);

      // Filter by following status if requested
      if (input.showFollowingOnly && followedArtistIds.length > 0) {
        artists = artists.filter((a) => followedArtistIds.includes(a.id));
      }

      // Apply other filters
      if (input.genre) {
        artists = artists.filter((a) =>
          a.genre?.some((g) => g.toLowerCase().includes(input.genre!.toLowerCase()))
        );
      }

      if (input.location) {
        artists = artists.filter((a) =>
          a.location?.toLowerCase().includes(input.location!.toLowerCase())
        );
      }

      if (input.minRating) {
        artists = artists.filter((a) => (a.rating || 0) >= input.minRating!);
      }

      if (input.maxPrice) {
        artists = artists.filter((a) => (a.feeRangeMax || 0) <= input.maxPrice!);
      }

      // Add following status to each artist
      return artists.map((artist) => ({
        ...artist,
        isFollowing: followedArtistIds.includes(artist.id),
      }));
    }),

  // Get browse filter options
  getFilterOptions: publicProcedure.query(async () => {
    const database = await getDb();
    if (!database) return { genres: [], locations: [] };

    const artists = await database.select().from(artistProfiles);

    // Extract unique genres
    const genresSet = new Set<string>();
    artists.forEach((a) => {
      a.genre?.forEach((g) => genresSet.add(g));
    });

    // Extract unique locations
    const locationsSet = new Set<string>();
    artists.forEach((a) => {
      if (a.location) locationsSet.add(a.location);
    });

    return {
      genres: Array.from(genresSet).sort(),
      locations: Array.from(locationsSet).sort(),
    };
  }),

  // Get following count for browse page
  getFollowingCount: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return 0;

    const followedArtists = await database
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, ctx.user.id),
          eq(follows.followingType, "artist")
        )
      );

    return followedArtists.length;
  }),
});
