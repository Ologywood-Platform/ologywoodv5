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
        venueType: z.string().optional(),
        minCapacity: z.number().optional(),
        maxCapacity: z.number().optional(),
        minRating: z.number().optional(),
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

        // Filter by venue type
        if (input.venueType) {
          conditions.push(eq(venueProfiles.venueType, input.venueType));
        }

        // Filter by capacity
        if (input.minCapacity) {
          conditions.push(gte(venueProfiles.capacity, input.minCapacity));
        }
        if (input.maxCapacity) {
          conditions.push(lte(venueProfiles.capacity, input.maxCapacity));
        }

        // Filter by rating
        if (input.minRating) {
          conditions.push(gte(venueProfiles.averageRating, input.minRating));
        }

        const venues = await db
          .select()
          .from(venueProfiles)
          .where(and(...conditions))
          .orderBy(desc(venueProfiles.averageRating))
          .limit(input.limit)
          .offset(input.offset);

        return venues.map((venue) => ({
          id: venue.id,
          organizationName: venue.organizationName,
          location: venue.location,
          venueType: venue.venueType,
          capacity: venue.capacity,
          amenities: venue.amenities || [],
          profilePhotoUrl: venue.profilePhotoUrl,
          averageRating: Number(venue.averageRating) || 0,
          reviewCount: venue.reviewCount || 0,
          bio: venue.bio,
          website: venue.website,
          contactPhone: venue.contactPhone,
          email: venue.email,
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
          venueType: venueData.venueType,
          capacity: venueData.capacity,
          amenities: venueData.amenities || [],
          profilePhotoUrl: venueData.profilePhotoUrl,
          mediaGallery: venueData.mediaGallery,
          averageRating: Number(venueData.averageRating) || 0,
          reviewCount: venueData.reviewCount || 0,
          bio: venueData.bio,
          website: venueData.website,
          contactPhone: venueData.contactPhone,
          email: venueData.email,
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
          venueType: venue.venueType,
          capacity: venue.capacity,
          amenities: venue.amenities || [],
          profilePhotoUrl: venue.profilePhotoUrl,
          averageRating: Number(venue.averageRating) || 0,
          reviewCount: venue.reviewCount || 0,
          bio: venue.bio,
          website: venue.website,
          contactPhone: venue.contactPhone,
          email: venue.email,
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
          .orderBy(desc(venueProfiles.averageRating))
          .limit(input.limit);

        return venues.map((venue) => ({
          id: venue.id,
          organizationName: venue.organizationName,
          location: venue.location,
          venueType: venue.venueType,
          capacity: venue.capacity,
          amenities: venue.amenities || [],
          profilePhotoUrl: venue.profilePhotoUrl,
          averageRating: Number(venue.averageRating) || 0,
          reviewCount: venue.reviewCount || 0,
          bio: venue.bio,
          website: venue.website,
          contactPhone: venue.contactPhone,
          email: venue.email,
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

  /**
   * Increment venue listing views
   * Public endpoint - tracks analytics
   */
  incrementViews: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error('Database connection failed');

      try {
        const venue = await db
          .select()
          .from(venueProfiles)
          .where(eq(venueProfiles.id, input.venueId))
          .limit(1);

        if (!venue.length) {
          throw new Error('Venue not found');
        }

        const currentViews = venue[0].listingViews || 0;

        await db
          .update(venueProfiles)
          .set({ listingViews: currentViews + 1 })
          .where(eq(venueProfiles.id, input.venueId));

        return { success: true };
      } catch (error) {
        console.error('[Increment Views] Error:', error);
        // Don't throw - this is just analytics
        return { success: false };
      }
    }),
});
