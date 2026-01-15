import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import * as email from "./email";
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription } from "./stripe";
import { updateSubscriptionStatus } from "./db";
import { contractsRouter } from "./routers/contracts";
import { referralRouter } from "./routers/referrals";
import { verificationRouter } from "./routers/verification";
import { templatesRouter } from "./routers/templates";
import { testdataRouter } from "./routers/testdata";
import { testdataSeedingRouter } from "./routers/testdata-seeding";
import { impersonationRouter } from "./routers/impersonation";
import { testWorkflowsRouter } from "./routers/test-workflows";

// Helper to check if user is an artist
const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Artist access required' });
  }
  return next({ ctx });
});

// Helper to check if user is a venue
const venueProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Venue access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  contracts: contractsRouter,
  referrals: referralRouter,
  verification: verificationRouter,
  templates: templatesRouter,
  testdata: testdataRouter,
  testdataSeeding: testdataSeedingRouter,
  impersonation: impersonationRouter,
  testWorkflows: testWorkflowsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateRole: protectedProcedure
      .input(z.object({ role: z.enum(['artist', 'venue']) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(ctx.user.id, input.role);
        return { role: input.role };
      }),
  }),

  // Artist Profile Management
  artist: router({
    // Get current artist's profile
    getMyProfile: artistProcedure.query(async ({ ctx }) => {
      return await db.getArtistProfileByUserId(ctx.user.id);
    }),
    
    // Get any artist profile by ID (public)
    getProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getArtistProfileById(input.id);
      }),
    
       // Upload and set profile photo
    uploadProfilePhoto: artistProcedure
      .input(z.object({
        fileData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `artist-profile-photos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.updateArtistProfile(profile.id, { profilePhotoUrl: url });
        return { url, success: true };
      }),
    
    // Update artist profile information
    updateProfile: artistProcedure
      .input(z.object({
        artistName: z.string().min(1).optional(),
        bio: z.string().optional(),
        genre: z.array(z.string()).optional(),
        location: z.string().optional(),
        feeRangeMin: z.number().optional(),
        feeRangeMax: z.number().optional(),
        touringPartySize: z.number().optional(),
        socialLinks: z.object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          youtube: z.string().optional(),
          spotify: z.string().optional(),
          twitter: z.string().optional(),
        }).optional(),
        profilePhotoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.updateArtistProfile(profile.id, input);
        return { success: true, profile: await db.getArtistProfileById(profile.id) };
      }),
    
    // Upload profile photo
    uploadPhoto: artistProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `artist-photos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url };
      }),

    // Create artist profile
    createProfile: artistProcedure
      .input(z.object({
        artistName: z.string(),
        location: z.string().optional(),
        bio: z.string().optional(),
        genre: z.array(z.string()).optional(),
        feeRangeMin: z.number().optional(),
        feeRangeMax: z.number().optional(),
        touringPartySize: z.number(),
        websiteUrl: z.string().optional(),
        profilePhotoUrl: z.string().optional(),
        socialLinks: z.object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          youtube: z.string().optional(),
          spotify: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.createArtistProfile({
          userId: ctx.user.id,
          ...input,
        });
        return profile;
      }),
    
    // Create artist profile
    create: protectedProcedure
      .input(z.object({
        artistName: z.string().min(1),
        bio: z.string().optional(),
        genre: z.array(z.string()).optional(),
        location: z.string().optional(),
        feeRangeMin: z.number().optional(),
        feeRangeMax: z.number().optional(),
        socialLinks: z.any().optional(),
        profilePhotoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Note: Profile creation is allowed without subscription for onboarding
        // Subscription will be required for receiving bookings
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        }
        await db.updateArtistProfile(profile.id, input);
        return { success: true };
      }),
    
    // Upload media (profile photo or gallery)
    uploadMedia: artistProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        fileType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `artists/${ctx.user.id}/${input.fileName}-${randomSuffix}`;
        
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        return { url };
      }),
    
    // Search artists
    search: publicProcedure
      .input(z.object({
        genre: z.array(z.string()).optional(),
        location: z.string().optional(),
        minFee: z.number().optional(),
        maxFee: z.number().optional(),
        availableFrom: z.string().optional(), // ISO date string
        availableTo: z.string().optional(), // ISO date string
      }))
      .query(async ({ input }) => {
        return await db.searchArtists(input);
      }),
    
    // Get all artists
    getAll: publicProcedure.query(async () => {
      return await db.getAllArtists();
    }),
    
    // Add photo to gallery
    addGalleryPhoto: artistProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `artist-gallery/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Get current profile
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        
        // Add photo to gallery
        const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        const updatedPhotos = [...(currentGallery.photos || []), url];
        
        await db.updateArtistProfile(ctx.user.id, {
          mediaGallery: {
            photos: updatedPhotos,
            videos: currentGallery.videos || [],
          },
        });
        
        return { url };
      }),
    
    // Remove photo from gallery
    removeGalleryPhoto: artistProcedure
      .input(z.object({
        photoUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        
        const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        const updatedPhotos = (currentGallery.photos || []).filter(url => url !== input.photoUrl);
        
        await db.updateArtistProfile(ctx.user.id, {
          mediaGallery: {
            photos: updatedPhotos,
            videos: currentGallery.videos || [],
          },
        });
        
        return { success: true };
      }),
  }),

  // Venue Profile Management
  venue: router({
    // Get current venue's profile
    getMyProfile: venueProcedure.query(async ({ ctx }) => {
      return await db.getVenueProfileByUserId(ctx.user.id);
    }),
    
    // Get venue profile by ID (public)
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVenueProfileById(input.id);
      }),
    
    // Create venue profile
    createProfile: venueProcedure
      .input(z.object({
        organizationName: z.string().min(1),
        contactName: z.string().min(1),
        contactPhone: z.string().optional(),
        websiteUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createVenueProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    // Update venue profile
    updateProfile: venueProcedure
      .input(z.object({
        organizationName: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        websiteUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        }
        await db.updateVenueProfile(profile.id, input);
        return { success: true };
      }),
    
    // Upload and set profile photo
    uploadProfilePhoto: venueProcedure
      .input(z.object({
        fileData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `venue-profile-photos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        await db.updateVenueProfile(profile.id, { profilePhotoUrl: url });
        return { url, success: true };
      }),
    
    // Add photo to gallery
    addGalleryPhoto: venueProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded image
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `venue-gallery/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Get current profile
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // Add photo to gallery
        const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        const updatedPhotos = [...(currentGallery.photos || []), url];
        
        await db.updateVenueProfile(profile.id, {
          mediaGallery: {
            photos: updatedPhotos,
            videos: currentGallery.videos || [],
          },
        });
        
        return { url };
      }),
    
    // Remove photo from gallery
    removeGalleryPhoto: venueProcedure
      .input(z.object({
        photoUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        const updatedPhotos = (currentGallery.photos || []).filter(url => url !== input.photoUrl);
        
        await db.updateVenueProfile(profile.id, {
          mediaGallery: {
            photos: updatedPhotos,
            videos: currentGallery.videos || [],
          },
        });
        
        return { success: true };
      }),
  }),

  // Rider Template Management
  rider: router({
    // Get all templates for current artist
    getMyTemplates: artistProcedure.query(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return await db.getRiderTemplatesByArtistId(profile.id);
    }),
    
    // Get single template
    getTemplate: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiderTemplateById(input.id);
      }),
    
    // Get templates for a specific artist (public)
    getForArtist: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRiderTemplatesByArtistId(input.artistId);
      }),
    
    // Create template
    create: artistProcedure
      .input(z.object({
        templateName: z.string().min(1),
        technicalRequirements: z.object({
          stageWidth: z.string().optional(),
          stageDepth: z.string().optional(),
          soundSystem: z.string().optional(),
          lighting: z.string().optional(),
          backline: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        hospitalityRequirements: z.object({
          dressingRooms: z.string().optional(),
          catering: z.string().optional(),
          beverages: z.string().optional(),
          accommodation: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        financialTerms: z.object({
          depositAmount: z.string().optional(),
          paymentMethod: z.string().optional(),
          cancellationPolicy: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.createRiderTemplate({
          artistId: profile.id,
          ...input,
        });
        return { success: true };
      }),
    
    // Update template
    update: artistProcedure
      .input(z.object({
        id: z.number(),
        templateName: z.string().optional(),
        technicalRequirements: z.object({
          stageWidth: z.string().optional(),
          stageDepth: z.string().optional(),
          soundSystem: z.string().optional(),
          lighting: z.string().optional(),
          backline: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        hospitalityRequirements: z.object({
          dressingRooms: z.string().optional(),
          catering: z.string().optional(),
          beverages: z.string().optional(),
          accommodation: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        financialTerms: z.object({
          depositAmount: z.string().optional(),
          paymentMethod: z.string().optional(),
          cancellationPolicy: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateRiderTemplate(id, updates);
        return { success: true };
      }),
    
    // Delete template
    delete: artistProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRiderTemplate(input.id);
        return { success: true };
      }),
  }),

  // Availability Management
  availability: router({
    // Get availability for an artist
    getForArtist: publicProcedure
      .input(z.object({
        artistId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAvailabilityByArtistId(input.artistId, input.startDate, input.endDate);
      }),
    
    // Set availability (artist only)
    set: artistProcedure
      .input(z.object({
        date: z.string(),
        status: z.enum(['available', 'booked', 'unavailable']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.setAvailability({
          artistId: profile.id,
          date: new Date(input.date),
          status: input.status,
          notes: input.notes,
        });
        
        // Send notifications to venues who favorited this artist (only for new availability)
        if (input.status === 'available') {
          const venues = await db.getVenuesWhoFavoritedArtist(profile.id);
          for (const venue of venues) {
            if (venue.email) {
              await email.sendAvailabilityUpdateNotification(
                venue.email,
                venue.organizationName || venue.name || 'Venue',
                profile.artistName,
                profile.id,
                [input.date]
              );
            }
          }
        }
        
        return { success: true };
      }),
    
    // Delete availability
    delete: artistProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAvailability(input.id);
        return { success: true };
      }),
  }),

  // Booking Management
  booking: router({
    // Create booking request (venue)
    create: venueProcedure
      .input(z.object({
        artistId: z.number(),
        eventDate: z.string(),
        eventTime: z.string().optional(),
        venueName: z.string().min(1),
        venueAddress: z.string().optional(),
        eventDetails: z.string().optional(),
        totalFee: z.number().optional(),
        depositAmount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // Check if artist is available on this date
        const avail = await db.getAvailabilityForDate(input.artistId, input.eventDate);
        if (avail && avail.status !== 'available') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Artist is not available on this date' });
        }
        
        await db.createBooking({
          artistId: input.artistId,
          venueId: venueProfile.id,
          eventDate: new Date(input.eventDate),
          eventTime: input.eventTime,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          eventDetails: input.eventDetails,
          totalFee: input.totalFee?.toString(),
          depositAmount: input.depositAmount?.toString(),
          status: 'pending',
        });
        
        // Send email notification to artist
        const artistProfile = await db.getArtistProfileById(input.artistId);
        if (artistProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          if (artistUser?.email) {
            await email.sendBookingRequestEmail({
              artistEmail: artistUser.email,
              artistName: artistProfile.artistName,
              venueName: input.venueName,
              eventDate: new Date(input.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              eventDetails: input.eventDetails,
            });
          }
        }
        
        return { success: true };
      }),
    
    // Get booking by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        return booking || null;
      }),
    
    // Get bookings for current artist
    getMyArtistBookings: artistProcedure.query(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) return [];
      const bookings = await db.getBookingsByArtistId(profile.id);
      return bookings || [];
    }),
    
    // Get bookings for current venue
    getMyVenueBookings: venueProcedure.query(async ({ ctx }) => {
      const profile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!profile) return [];
      const bookings = await db.getBookingsByVenueId(profile.id);
      return bookings || [];
    }),
    
    // Update booking status (artist)
    updateStatus: artistProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
      }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // If confirming, mark date as booked
        if (input.status === 'confirmed') {
          const dateStr = booking.eventDate instanceof Date 
            ? booking.eventDate.toISOString().split('T')[0] 
            : booking.eventDate;
          await db.setAvailability({
            artistId: booking.artistId,
            date: new Date(dateStr),
            status: 'booked',
          });
        }
        
        // If cancelling from confirmed, mark as available again
        if (input.status === 'cancelled' && booking.status === 'confirmed') {
          const dateStr = booking.eventDate instanceof Date 
            ? booking.eventDate.toISOString().split('T')[0] 
            : booking.eventDate;
          await db.setAvailability({
            artistId: booking.artistId,
            date: new Date(dateStr),
            status: 'available',
          });
        }
        
        await db.updateBooking(input.id, { status: input.status });
        
        // Send email notifications based on status change
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        const venueProfile = await db.getVenueProfileById(booking.venueId);
        
        if (artistProfile && venueProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          const venueUser = await db.getUserById(venueProfile.userId);
          const eventDateStr = booking.eventDate instanceof Date 
            ? booking.eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          if (input.status === 'confirmed') {
            // Send confirmation emails to both parties
            if (artistUser?.email) {
              await email.sendBookingConfirmationEmail({
                recipientEmail: artistUser.email,
                recipientName: artistProfile.artistName,
                otherPartyName: venueProfile.organizationName,
                eventDate: eventDateStr,
                venueName: booking.venueName,
                venueAddress: booking.venueAddress || undefined,
              });
            }
            if (venueUser?.email) {
              await email.sendBookingConfirmationEmail({
                recipientEmail: venueUser.email,
                recipientName: venueProfile.organizationName,
                otherPartyName: artistProfile.artistName,
                eventDate: eventDateStr,
                venueName: booking.venueName,
                venueAddress: booking.venueAddress || undefined,
              });
            }
          } else if (input.status === 'cancelled') {
            // Send cancellation emails to both parties
            if (artistUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: artistUser.email,
                recipientName: artistProfile.artistName,
                otherPartyName: venueProfile.organizationName,
                eventDate: eventDateStr,
                venueName: booking.venueName,
              });
            }
            if (venueUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: venueUser.email,
                recipientName: venueProfile.organizationName,
                otherPartyName: artistProfile.artistName,
                eventDate: eventDateStr,
                venueName: booking.venueName,
              });
            }
          }
        }
        
        return { success: true };
      }),
  }),

  // Messaging
  message: router({
    // Get messages for a booking
    getForBooking: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMessagesByBookingId(input.bookingId);
      }),
    
    // Send message
    send: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        receiverId: z.number(),
        messageText: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          bookingId: input.bookingId,
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          messageText: input.messageText,
        });
        return { success: true };
      }),
    
    // Mark message as read
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.id);
        return { success: true };
      }),
    
    // Mark all messages in a booking as read
    markBookingAsRead: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markMessagesAsRead(input.bookingId, ctx.user.id);
        return { success: true };
      }),
    
    // Get unread message count for a specific booking
    getUnreadCount: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const count = await db.getUnreadMessageCountByBooking(input.bookingId, ctx.user.id);
        return { count };
      }),
    
    // Get total unread message count for current user
    getTotalUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await db.getTotalUnreadMessageCount(ctx.user.id);
        return { count };
      }),
    
    // Send quick message from calendar (creates booking if needed)
    sendQuickMessage: venueProcedure
      .input(z.object({
        artistId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get venue profile
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // Get artist profile to find user ID
        const artistProfile = await db.getArtistProfileById(input.artistId);
        if (!artistProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist not found' });
        }
        
        // Create a pending booking for this conversation
        const bookingId = await db.createBooking({
          artistId: input.artistId,
          venueId: venueProfile.id,
          status: 'pending',
          eventDate: new Date(), // Placeholder date
          eventTime: null,
          venueName: venueProfile.organizationName,
          venueAddress: null,
          totalFee: null,
          eventDetails: 'Quick inquiry from calendar',
        });
        
        // Send the message
        await db.createMessage({
          bookingId,
          senderId: ctx.user.id,
          receiverId: artistProfile.userId,
          messageText: input.message,
        });
        
        return { bookingId, success: true };
      }),
  }),

  // Review Management
  review: router({
    // Create review (venue only, for completed bookings)
    create: venueProcedure
      .input(z.object({
        bookingId: z.number(),
        artistId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if booking exists and is completed
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        if (booking.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only review completed bookings' });
        }
        
        // Check if review already exists
        const existingReview = await db.getReviewByBookingId(input.bookingId);
        if (existingReview) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Review already exists for this booking' });
        }
        
        // Get venue profile to get venueId
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only venues can leave reviews' });
        }
        
        await db.createReview({
          bookingId: input.bookingId,
          artistId: input.artistId,
          venueId: venueProfile.id,
          rating: input.rating,
          reviewText: input.reviewText || null,
        });
        
        return { success: true };
      }),
    
    // Get reviews for an artist (public)
    getByArtist: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        const reviews = await db.getReviewsByArtistId(input.artistId);
        return reviews || [];
      }),
    
    // Get review for a specific booking
    getByBooking: publicProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        const review = await db.getReviewByBookingId(input.bookingId);
        return review || null;
      }),
    
    // Get average rating for an artist
    getAverageRating: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        const rating = await db.getAverageRatingForArtist(input.artistId);
        return rating || { averageRating: 0, reviewCount: 0 };
      }),

    // Respond to a review (artist only)
    respondToReview: artistProcedure
      .input(z.object({
        reviewId: z.number(),
        response: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get the review
        const review = await db.getReviewById(input.reviewId);
        if (!review) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
        }

        // Verify the user is the artist who received this review
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || artistProfile.id !== review.artistId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only respond to reviews for your own artist profile' });
        }

        // Update the review with the artist's response
        await db.updateReview(input.reviewId, {
          artistResponse: input.response,
          respondedAt: new Date(),
        });

        // Send email notification to venue
        const venueUser = await db.getUserById(review.venueId);
        if (venueUser?.email && artistProfile) {
          await email.sendReviewResponseEmail({
            venueEmail: venueUser.email,
            venueName: venueUser.name || 'Venue',
            artistName: artistProfile.artistName,
            originalReview: review.reviewText || '',
            artistResponse: input.response,
            rating: review.rating,
          });
        }

        return { success: true };
      }),
  }),

  // Venue Review Management
  venueReview: router({
    // Create venue review (artist only, for completed bookings)
    create: artistProcedure
      .input(z.object({
        bookingId: z.number(),
        venueId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if booking exists and is completed
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        if (booking.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only review completed bookings' });
        }
        
        // Check if review already exists
        const existingReview = await db.getVenueReviewByBookingId(input.bookingId);
        if (existingReview) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Review already exists for this booking' });
        }
        
        // Get artist profile to get artistId
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only artists can leave venue reviews' });
        }
        
        await db.createVenueReview({
          bookingId: input.bookingId,
          venueId: input.venueId,
          artistId: artistProfile.id,
          rating: input.rating,
          reviewText: input.reviewText,
        });
        
        // Send email notification to venue
        const venueProfile = await db.getVenueProfileById(input.venueId);
        if (venueProfile) {
          const venueUser = await db.getUserById(venueProfile.userId);
          if (venueUser?.email) {
            await email.sendVenueReviewNotificationEmail({
              venueEmail: venueUser.email,
              venueName: venueProfile.organizationName,
              artistName: artistProfile.artistName,
              reviewText: input.reviewText || '',
              rating: input.rating,
              venueProfileUrl: `https://ologywood.com/venue/${input.venueId}`,
            });
          }
        }
        
        return { success: true };
      }),
    
    // Get venue reviews by venue ID
    getByVenue: protectedProcedure
      .input(z.object({ venueId: z.number() }))
      .query(async ({ input }) => {
        const reviews = await db.getVenueReviewsByVenueId(input.venueId);
        return reviews || [];
      }),
    
    // Get venue review by booking ID
    getByBooking: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        const review = await db.getVenueReviewByBookingId(input.bookingId);
        return review || null;
      }),
    
    // Get average rating for venue
    getAverageRating: protectedProcedure
      .input(z.object({ venueId: z.number() }))
      .query(async ({ input }) => {
        const rating = await db.getAverageRatingForVenue(input.venueId);
        return rating || { averageRating: 0, reviewCount: 0 };
      }),
    
    // Venue responds to review
    respondToReview: venueProcedure
      .input(z.object({
        reviewId: z.number(),
        response: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get the review
        const review = await db.getVenueReviewById(input.reviewId);
        if (!review) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
        }

        // Verify the user is the venue who received this review
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile || venueProfile.id !== review.venueId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only respond to reviews for your own venue profile' });
        }

        // Update the review with the venue's response
        await db.updateVenueReview(input.reviewId, {
          venueResponse: input.response,
          respondedAt: new Date(),
        });

        return { success: true };
      }),
  }),

  // Subscription Management
  subscription: router({
    // Get current user's subscription
    getMy: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      return subscription || null;
    }),

    // Create checkout session for subscription
    createCheckoutSession: protectedProcedure
      .input(z.object({
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateStripeCustomer, createSubscriptionCheckoutSession } = await import('./stripe');
        
        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer({
          email: ctx.user.email || '',
          name: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
        });

        // Create checkout session
        const checkoutUrl = await createSubscriptionCheckoutSession({
          customerId,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        return { checkoutUrl };
      }),

    // Get subscription status from Stripe
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        return null;
      }

      try {
        return await getSubscriptionStatus(subscription.stripeSubscriptionId);
      } catch (err) {
        return null;
      }
    }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      const { cancelSubscription } = await import('./stripe');
      await cancelSubscription(subscription.stripeSubscriptionId);
      return { success: true };
    }),

    // Reactivate subscription
    reactivate: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      const { reactivateSubscription } = await import('./stripe');
      await reactivateSubscription(subscription.stripeSubscriptionId);
      return { success: true };
    }),
  }),
  
  // Favorites router
  favorite: router({
    add: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.addFavorite(ctx.user.id, input.artistId);
      }),
    
    remove: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.artistId);
        return { success: true };
      }),
    
    getMyFavorites: venueProcedure
      .query(async ({ ctx }) => {
        return await db.getFavoritesByUser(ctx.user.id);
      }),
    
    isFavorited: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isFavorited(ctx.user.id, input.artistId);
      }),
    
    getCount: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFavoriteCount(input.artistId);
      }),
  }),
  
  // Booking template router
  bookingTemplate: router({
    create: venueProcedure
      .input(z.object({
        templateName: z.string(),
        venueName: z.string().optional(),
        venueAddress: z.string().optional(),
        venueCapacity: z.number().optional(),
        eventType: z.string().optional(),
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        standardRequirements: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBookingTemplate({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    getMyTemplates: venueProcedure
      .query(async ({ ctx }) => {
        return await db.getBookingTemplatesByUserId(ctx.user.id);
      }),
    
    getById: venueProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getBookingTemplateById(input.id);
      }),
    
    update: venueProcedure
      .input(z.object({
        id: z.number(),
        templateName: z.string().optional(),
        venueName: z.string().optional(),
        venueAddress: z.string().optional(),
        venueCapacity: z.number().optional(),
        eventType: z.string().optional(),
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        standardRequirements: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateBookingTemplate(id, updates);
        return { success: true };
      }),
    
    delete: venueProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBookingTemplate(input.id);
        return { success: true };
      }),
  }),
  
  // Analytics router
  analytics: router({
    trackView: publicProcedure
      .input(z.object({
        artistId: z.number(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.trackProfileView(
          input.artistId,
          ctx.user?.id,
          input.ipAddress
        );
        return { success: true };
      }),
    
    getProfileViews: artistProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        return await db.getProfileViewCount(profile.id, input.days);
      }),
    
    getBookingStats: artistProcedure
      .query(async ({ ctx }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        return await db.getBookingStats(profile.id);
      }),
    
    getRevenueByMonth: artistProcedure
      .input(z.object({ months: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        return await db.getRevenueByMonth(profile.id, input.months);
      }),
  }),
  
  // Reminders router (for testing/manual trigger)
  reminders: router({
    checkAndSend: publicProcedure
      .mutation(async () => {
        // This endpoint can be called manually or by a cron job
        const bookingsNeedingReminders = await db.getBookingsNeedingReminders();
        
        for (const { booking, reminderType } of bookingsNeedingReminders) {
          const daysUntil = reminderType === '7_days' ? 7 : reminderType === '3_days' ? 3 : 1;
          
          const artist = await db.getArtistProfileById(booking.artistId);
          const venue = await db.getVenueProfileById(booking.venueId);
          
          if (!artist || !venue) continue;
          
          const artistUser = await db.getUserById(artist.userId);
          const venueUser = await db.getUserById(venue.userId);
          
          if (!artistUser || !venueUser || !artistUser.email || !venueUser.email || !artistUser.name || !venueUser.name) continue;
          
          const bookingDetails = {
            artistName: artist.artistName || artistUser.name,
            venueName: venue.organizationName,
            eventDate: booking.eventDate!,
            eventTime: booking.eventTime || undefined,
            venueAddress: booking.venueAddress || undefined,
            totalFee: typeof booking.totalFee === 'number' ? booking.totalFee : undefined,
            eventDetails: booking.eventDetails || undefined,
          };
          
          // Send to both artist and venue
          await email.sendBookingReminder(
            artistUser.email,
            artistUser.name,
            bookingDetails,
            daysUntil,
            true
          );
          
          await email.sendBookingReminder(
            venueUser.email,
            venueUser.name,
            bookingDetails,
            daysUntil,
            false
          );
          
          await db.markReminderSent(booking.id, reminderType);
        }
        
        return { sent: bookingsNeedingReminders.length };
      }),
  }),
  
  // Calendar router
  calendar: router({
    getVenueBookings: venueProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        
        return await db.getVenueBookingsByDateRange(profile.id, startDate, endDate);
      }),
    
    getFavoritedArtistsAvailability: venueProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        
        return await db.getFavoritedArtistsAvailability(ctx.user.id, startDate, endDate);
      }),
  }),
  
  // Payment Management
  payment: router({
    // Create checkout session for deposit
    createDepositCheckout: venueProcedure
      .input(z.object({
        bookingId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        if (!booking.depositAmount) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No deposit amount set' });
        }
        
        // Create Stripe checkout session
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Booking Deposit - ${booking.venueName}`,
                description: booking.eventDetails || 'Event booking deposit',
              },
              unit_amount: Math.round(Number(booking.depositAmount) * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${process.env.VITE_APP_URL}/booking/${input.bookingId}?payment=success`,
          cancel_url: `${process.env.VITE_APP_URL}/booking/${input.bookingId}?payment=cancelled`,
          metadata: {
            bookingId: input.bookingId,
            type: 'deposit',
          },
        });
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Create checkout session for full payment
    createFullPaymentCheckout: venueProcedure
      .input(z.object({
        bookingId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        if (!booking.totalFee) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No total fee set' });
        }
        
        // Calculate remaining amount if deposit already paid
        const remainingAmount = booking.paymentStatus === 'deposit_paid' 
          ? Number(booking.totalFee) - Number(booking.depositAmount || 0)
          : Number(booking.totalFee);
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Booking Payment - ${booking.venueName}`,
                description: booking.eventDetails || 'Event booking payment',
              },
              unit_amount: Math.round(remainingAmount * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${process.env.VITE_APP_URL}/booking/${input.bookingId}?payment=success`,
          cancel_url: `${process.env.VITE_APP_URL}/booking/${input.bookingId}?payment=cancelled`,
          metadata: {
            bookingId: input.bookingId,
            type: 'full_payment',
          },
        });
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Get payment history
    getHistory: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentHistory(input.bookingId);
      }),
    
    // Request refund
    requestRefund: venueProcedure
      .input(z.object({
        bookingId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        if (!booking.stripePaymentIntentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No payment to refund' });
        }
        
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          reason: 'requested_by_customer',
          metadata: {
            bookingId: input.bookingId,
            reason: input.reason,
          },
        });
        
        await db.recordRefund(input.bookingId, refund.id);
        
        return { refundId: refund.id, success: true };
       }),
  }),
  
  // Rider Template Management
  riderTemplate: router({
    // List all rider templates for current artist
    list: artistProcedure.query(async ({ ctx }) => {
      return await db.getRiderTemplatesByArtistId(ctx.user.id);
    }),
    
    // Get specific rider template
    get: artistProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const template = await db.getRiderTemplateById(input.id);
        if (!template || template.artistId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        return template;
      }),
    
    // Create new rider template
    create: artistProcedure
      .input(z.object({
        templateName: z.string().min(1),
        technicalRequirements: z.object({
          stageWidth: z.string().optional(),
          stageDepth: z.string().optional(),
          soundSystem: z.string().optional(),
          lighting: z.string().optional(),
          backline: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        hospitalityRequirements: z.object({
          dressingRooms: z.string().optional(),
          catering: z.string().optional(),
          beverages: z.string().optional(),
          accommodation: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        financialTerms: z.object({
          depositAmount: z.string().optional(),
          paymentMethod: z.string().optional(),
          cancellationPolicy: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.createRiderTemplate({
          artistId: ctx.user.id,
          ...input,
        });
        return template;
      }),
    
    // Update rider template
    update: artistProcedure
      .input(z.object({
        id: z.number(),
        templateName: z.string().optional(),
        technicalRequirements: z.object({
          stageWidth: z.string().optional(),
          stageDepth: z.string().optional(),
          soundSystem: z.string().optional(),
          lighting: z.string().optional(),
          backline: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        hospitalityRequirements: z.object({
          dressingRooms: z.string().optional(),
          catering: z.string().optional(),
          beverages: z.string().optional(),
          accommodation: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
        financialTerms: z.object({
          depositAmount: z.string().optional(),
          paymentMethod: z.string().optional(),
          cancellationPolicy: z.string().optional(),
          other: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getRiderTemplateById(input.id);
        if (!template || template.artistId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        const { id, ...updates } = input;
        await db.updateRiderTemplate(id, updates);
        return { success: true };
      }),
    
    // Delete rider template
    delete: artistProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getRiderTemplateById(input.id);
        if (!template || template.artistId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        await db.deleteRiderTemplate(input.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
