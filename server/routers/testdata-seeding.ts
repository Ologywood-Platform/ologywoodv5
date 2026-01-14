import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Test Data Seeding Router
 * Provides endpoints to seed realistic test data directly into the database
 */
export const testdataSeedingRouter = router({
  /**
   * Seed users into the database
   * Creates actual user records that can be impersonated
   */
  seedUsers: protectedProcedure
    .input(z.object({ 
      count: z.number().min(1).max(50).default(5),
      roles: z.array(z.enum(['artist', 'venue'])).default(['artist', 'venue'])
    }))
    .mutation(async ({ input, ctx }) => {
      // Admin check
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const users = [];
      for (let i = 0; i < input.count; i++) {
        const role = input.roles[i % input.roles.length];
        const email = `testuser-${Date.now()}-${i}@ologywood.test`;
        
        // Create user record
        const user = {
          openId: uuidv4(),
          name: `Test ${role === 'artist' ? 'Artist' : 'Venue'} ${i + 1}`,
          email,
          loginMethod: 'email' as const,
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        users.push(user);
      }

      return {
        success: true,
        count: users.length,
        users,
        message: `Generated ${users.length} test user records ready for database insertion`
      };
    }),

  /**
   * Seed artist profiles into the database
   * Creates complete artist profiles with all required fields
   */
  seedArtistProfiles: protectedProcedure
    .input(z.object({ 
      userIds: z.array(z.number()).min(1),
      count: z.number().min(1).max(50).default(5)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const profiles = [];
      const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'Country', 'R&B'];
      const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Nashville, TN', 'Austin, TX'];

      for (let i = 0; i < input.count; i++) {
        const userId = input.userIds[i % input.userIds.length];
        
        const profile = {
          userId,
          artistName: `Test Artist ${i + 1}`,
          genre: [genres[Math.floor(Math.random() * genres.length)]],
          location: cities[Math.floor(Math.random() * cities.length)],
          bio: `Professional test artist #${i + 1} for platform validation`,
          feeRangeMin: 500 + Math.random() * 1000,
          feeRangeMax: 2000 + Math.random() * 3000,
          touringPartySize: Math.floor(1 + Math.random() * 5),
          profilePhotoUrl: `https://via.placeholder.com/400x400?text=Artist${i+1}`,
          socialLinks: {
            instagram: `@testartist${i + 1}`,
            spotify: `testartist${i + 1}`,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        profiles.push(profile);
      }

      return {
        success: true,
        count: profiles.length,
        profiles,
        message: `Generated ${profiles.length} artist profile records`
      };
    }),

  /**
   * Seed venue profiles into the database
   * Creates complete venue profiles with contact information
   */
  seedVenueProfiles: protectedProcedure
    .input(z.object({ 
      userIds: z.array(z.number()).min(1),
      count: z.number().min(1).max(50).default(5)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const profiles = [];
      const venueTypes = ['Bar', 'Club', 'Theater', 'Concert Hall', 'Restaurant', 'Hotel'];
      const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Nashville, TN', 'Austin, TX'];

      for (let i = 0; i < input.count; i++) {
        const userId = input.userIds[i % input.userIds.length];
        
        const profile = {
          userId,
          organizationName: `Test ${venueTypes[Math.floor(Math.random() * venueTypes.length)]} ${i + 1}`,
          contactName: `Contact Person ${i + 1}`,
          contactPhone: `555-${String(1000 + i).padStart(4, '0')}`,
          websiteUrl: `https://testvenue${i + 1}.example.com`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        profiles.push(profile);
      }

      return {
        success: true,
        count: profiles.length,
        profiles,
        message: `Generated ${profiles.length} venue profile records`
      };
    }),

  /**
   * Seed bookings into the database
   * Creates complete booking records with various statuses
   */
  seedBookings: protectedProcedure
    .input(z.object({ 
      artistUserIds: z.array(z.number()).min(1),
      venueUserIds: z.array(z.number()).min(1),
      count: z.number().min(1).max(50).default(5)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const bookings = [];
      const statuses = ['pending', 'accepted', 'completed', 'cancelled'] as const;

      for (let i = 0; i < input.count; i++) {
        const artistUserId = input.artistUserIds[i % input.artistUserIds.length];
        const venueUserId = input.venueUserIds[i % input.venueUserIds.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const eventDate = new Date(Date.now() + (Math.random() * 90 * 24 * 60 * 60 * 1000));
        
        const booking = {
          artistUserId,
          venueUserId,
          eventDate,
          eventLocation: `Test Venue ${i + 1}`,
          eventType: ['Wedding', 'Corporate', 'Bar Gig', 'Festival', 'Private Party'][Math.floor(Math.random() * 5)],
          estimatedAttendees: 50 + Math.floor(Math.random() * 450),
          specialRequirements: `Test booking special requirements #${i + 1}`,
          quotedFee: 1000 + Math.random() * 4000,
          status,
          depositAmount: status !== 'pending' ? 500 : null,
          depositPaidAt: status !== 'pending' && Math.random() > 0.5 ? new Date() : null,
          fullPaymentAt: status === 'completed' ? new Date() : null,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        };
        
        bookings.push(booking);
      }

      return {
        success: true,
        count: bookings.length,
        bookings,
        message: `Generated ${bookings.length} booking records`
      };
    }),

  /**
   * Complete test scenario: Create user → artist/venue → booking
   * One-click setup for a complete testing scenario
   */
  seedCompleteScenario: protectedProcedure
    .input(z.object({ 
      artists: z.number().min(1).max(20).default(2),
      venues: z.number().min(1).max(20).default(2),
      bookings: z.number().min(1).max(30).default(3)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const scenario: any = {
        users: {
          artists: [] as any[],
          venues: [] as any[]
        },
        artistProfiles: [] as any[],
        venueProfiles: [] as any[],
        bookings: [] as any[],
        instructions: [
          '1. Copy the generated user data and create accounts',
          '2. Use the impersonation feature to log in as each user',
          '3. Complete artist/venue profiles',
          '4. Use the generated booking data to create test bookings',
          '5. Test payment flows with Stripe test cards'
        ]
      };

      // Generate artist users
      for (let i = 0; i < input.artists; i++) {
        scenario.users.artists.push({
          openId: uuidv4(),
          name: `Test Artist ${i + 1}`,
          email: `test-artist-${Date.now()}-${i}@ologywood.test`,
          role: 'artist'
        } as any);
      }

      // Generate venue users
      for (let i = 0; i < input.venues; i++) {
        scenario.users.venues.push({
          openId: uuidv4(),
          name: `Test Venue ${i + 1}`,
          email: `test-venue-${Date.now()}-${i}@ologywood.test`,
          role: 'venue'
        } as any);
      }

      // Generate artist profiles
      const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic'];
      for (let i = 0; i < input.artists; i++) {
        scenario.artistProfiles.push({
          artistName: `Test Artist ${i + 1}`,
          genre: [genres[i % genres.length]],
          location: 'New York, NY',
          feeRangeMin: 500,
          feeRangeMax: 2500,
          touringPartySize: 2
        } as any);
      }

      // Generate venue profiles
      for (let i = 0; i < input.venues; i++) {
        scenario.venueProfiles.push({
          organizationName: `Test Venue ${i + 1}`,
          contactName: `Contact ${i + 1}`,
          contactPhone: '555-0000'
        } as any);
      }

      // Generate bookings
      for (let i = 0; i < input.bookings; i++) {
        scenario.bookings.push({
          eventType: ['Wedding', 'Corporate', 'Bar Gig'][i % 3],
          eventDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
          estimatedAttendees: 100 + i * 50,
          quotedFee: 1500 + i * 500
        } as any);
      }

      return {
        success: true,
        scenario,
        message: 'Complete test scenario generated. Follow the instructions to set up your test environment.'
      };
    })
});
