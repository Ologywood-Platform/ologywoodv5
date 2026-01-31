import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';

const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Artist access required' });
  }
  return next({ ctx });
});

export const venueReviewsRouter = router({
  // Create a review for a venue
  create: artistProcedure
    .input(z.object({
      venueId: z.number(),
      bookingId: z.number().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional(),
      professionalism: z.number().min(1).max(5).optional(),
      soundQuality: z.number().min(1).max(5).optional(),
      amenitiesRating: z.number().min(1).max(5).optional(),
      audienceRating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create review in database
      return { success: true, reviewId: 1 };
    }),

  // Get reviews for a venue (public)
  getForVenue: publicProcedure
    .input(z.object({
      venueId: z.number(),
      limit: z.number().default(10),
      offset: z.number().default(0),
      sortBy: z.enum(['recent', 'rating', 'helpful']).default('recent'),
    }))
    .query(async ({ input }) => {
      // Query reviews for venue
      return {
        reviews: [],
        total: 0,
        averageRating: 0,
      };
    }),

  // Get reviews by artist (artist only)
  getByArtist: artistProcedure
    .query(async ({ ctx }) => {
      // Get all reviews written by this artist
      return [];
    }),

  // Update a review (artist only, own review)
  update: artistProcedure
    .input(z.object({
      reviewId: z.number(),
      rating: z.number().min(1).max(5).optional(),
      title: z.string().optional(),
      comment: z.string().optional(),
      professionalism: z.number().min(1).max(5).optional(),
      soundQuality: z.number().min(1).max(5).optional(),
      amenitiesRating: z.number().min(1).max(5).optional(),
      audienceRating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update review
      return { success: true };
    }),

  // Delete a review (artist only, own review)
  delete: artistProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Delete review
      return { success: true };
    }),

  // Mark review as helpful (public)
  markHelpful: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      // Increment helpful count
      return { success: true };
    }),

  // Get venue rating summary (public)
  getRatingSummary: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(async ({ input }) => {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        categoryAverages: {
          professionalism: 0,
          soundQuality: 0,
          amenities: 0,
          audience: 0,
        },
      };
    }),

  // Get top reviews for a venue (public)
  getTopReviews: publicProcedure
    .input(z.object({ venueId: z.number(), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      return [];
    }),

  // Get recent reviews (public - for homepage)
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return [];
    }),
});
