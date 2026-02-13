import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { venueProfiles, venueReviews } from '../../drizzle/schema';
import { eq, like, and, gte, lte, desc } from 'drizzle-orm';

export const venueRouter = router({
  /**
   * Search venues with filters
   * Public endpoint - anyone can search venues
   * Future: Can be restricted to artists only via role check
   */
  search: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        searchQuery: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const conditions = [];

        // Only show listed venues
        conditions.push(eq(venueProfiles.isListed, true));

        // Search by name or bio
        if (input.searchQuery) {
          conditions.push(
            like(venueProfiles.organizationName, `%${input.searchQuery}%`)
          );
        }

        // Filter by location
        if (input.location) {
          conditions.push(like(venueProfiles.location, `%${input.location}%`));
        }



        const venues = await db
          .select()
          .from(venueProfiles)
          .where(and(...conditions))
          .limit(input.limit)
          .offset(input.offset);

        return venues.map((venue) => ({
          id: venue.id,
          organizationName: venue.organizationName,
          location: venue.location,
          bio: venue.bio,
          contactPhone: venue.contactPhone,
        }));
      } catch (error) {
        console.error('[Venue Search] Error searching venues:', error);
        throw error;
      }
    }),

  /**
   * Get single venue details
   * Public endpoint
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const venue = await db
          .select()
          .from(venueProfiles)
          .where(eq(venueProfiles.id, input.id))
          .limit(1);

        if (!venue.length) {
          throw new Error('Venue not found');
        }

        const venueData = venue[0];

        // Get reviews for this venue
        const reviews = await db
          .select()
          .from(venueReviews)
          .where(eq(venueReviews.venueId, input.id));

        return {
          id: venueData.id,
          organizationName: venueData.organizationName,
          location: venueData.location,
          bio: venueData.bio,
          contactPhone: venueData.contactPhone,
          reviews: reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          })),
        };
      } catch (error) {
        console.error('[Venue Details] Error fetching venue:', error);
        throw error;
      }
    }),

  /**
   * Get featured/top-rated venues
   * Public endpoint
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().default(6) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const venues = await db
          .select()
          .from(venueProfiles)
          .where(eq(venueProfiles.isListed, true))
          .orderBy(desc(venueProfiles.averageRating))
          .limit(input.limit);

        return venues.map((venue) => ({
          id: venue.id,
          organizationName: venue.organizationName,
          location: venue.location,
          bio: venue.bio,
          contactPhone: venue.contactPhone,
        }));
      } catch (error) {
        console.error('[Featured Venues] Error fetching featured venues:', error);
        throw error;
      }
    }),

  /**
   * Get venues by location
   * Public endpoint
   */
  getByLocation: publicProcedure
    .input(z.object({ location: z.string(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const venues = await db
          .select()
          .from(venueProfiles)
          .where(
            and(
              eq(venueProfiles.isListed, true),
              like(venueProfiles.location, `%${input.location}%`)
            )
          )
          .limit(input.limit);

        return venues.map((venue) => ({
          id: venue.id,
          organizationName: venue.organizationName,
          location: venue.location,
          bio: venue.bio,
          contactPhone: venue.contactPhone,
        }));
      } catch (error) {
        console.error('[Venues by Location] Error fetching venues:', error);
        throw error;
      }
    }),

  /**
   * Get all venue types (for filtering)
   * Public endpoint
   */
  getVenueTypes: publicProcedure.query(async () => {
    return [
      'Club',
      'Theater',
      'Hall',
      'Outdoor',
      'Restaurant',
      'Bar',
      'Festival',
      'Arena',
      'Studio',
      'Other',
    ];
  }),


});
