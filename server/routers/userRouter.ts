import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * User router - handles user profile and account management
 */
export const userRouter = router({
  /**
   * Get current user's profile (protected - requires authentication)
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    
    // Get base user info
    const userInfo = {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSignedIn: user.lastSignedIn,
    };

    // If user is an artist, get their artist profile
    if (user.role === 'artist') {
      const artistProfile = await db.getArtistProfileByUserId(user.id);
      return {
        ...userInfo,
        artistProfile: artistProfile || null,
      };
    }

    // If user is a venue, get their venue profile
    if (user.role === 'venue') {
      const venueProfile = await db.getVenueProfileByUserId(user.id);
      return {
        ...userInfo,
        venueProfile: venueProfile || null,
      };
    }

    // Regular user - no additional profile
    return userInfo;
  }),

  /**
   * Get user by ID (public - for viewing other users' public profiles)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.id);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Return only public information
      return {
        id: user.id,
        name: user.name,
        role: user.role,
      };
    }),

  /**
   * Update user profile information
   */
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, input);
      const updatedUser = await db.getUserById(ctx.user.id);
      if (!updatedUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return updatedUser;
    }),

  /**
   * Check if user has completed profile setup
   */
  isProfileComplete: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    if (user.role === 'artist') {
      const artistProfile = await db.getArtistProfileByUserId(user.id);
      return {
        complete: !!artistProfile && !!artistProfile.artistName,
        role: 'artist',
        profileExists: !!artistProfile,
      };
    }

    if (user.role === 'venue') {
      const venueProfile = await db.getVenueProfileByUserId(user.id);
      return {
        complete: !!venueProfile && !!venueProfile.organizationName,
        role: 'venue',
        profileExists: !!venueProfile,
      };
    }

    return {
      complete: false,
      role: 'user',
      profileExists: false,
    };
  }),

  /**
   * Get user's role
   */
  getRole: protectedProcedure.query(async ({ ctx }) => {
    return {
      role: ctx.user.role,
      id: ctx.user.id,
    };
  }),
});
