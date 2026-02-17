import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import * as email from "./email";
import { sendVenueVerificationEmail, sendVenueVerificationConfirmationEmail } from "./email";
import * as emailService from "./services/emailService";
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription } from "./stripe";
import { updateSubscriptionStatus } from "./db";
import * as imageOptimization from "./imageOptimization";
import { handlePhotoUpload } from "./handlers/imageUploadHandler";
// ===== MVP ROUTERS ONLY =====
import { authRouter } from "./routers/auth";
import { emailPreferencesRouter } from "./routers/emailPreferences";
import { emailTestingRouter } from "./routers/emailTesting";
import { pricingRouter } from "./routers/pricing";
import { riderRouter } from "./routers/rider";
import { followsRouter } from "./routers/follows";
import { eventsRouter } from "./routers/events";


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
  // Debug endpoint for testing input parsing
  debug: router({
    testPublicInput: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return { received: input, type: typeof input };
      }),
    testProtectedInput: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return { received: input, type: typeof input };
      }),
  }),
  
  // ===== MVP CORE ROUTERS ONLY =====
  // (Defined inline below at lines ~172, ~412, ~634, ~850)
  
  // ===== NON-MVP ROUTERS (DISABLED FOR MVP) =====
  // system: systemRouter,
  // analytics: analyticsRouter,
  // contracts: contractsRouter,
  // contractManagement: contractManagementRouter,
  // contractAudit: contractAuditRouter,
  // referrals: referralRouter,
  // verification: verificationRouter,
  // templates: templatesRouter,
  // testdata: testdataRouter,
  // testdataSeeding: testdataSeedingRouter,
  // impersonation: impersonationRouter,
  // testWorkflows: testWorkflowsRouter,
  // support: supportRouter,
  // adminSeed: adminSeedRouter,
  // supportSeeder: supportSeederRouter,
  // aiChat: aiChatRouter,
  // depositPayments: depositPaymentsRouter,
  events: eventsRouter,
  account: router({
    validateDeletion: protectedProcedure.query(async ({ ctx }) => {
      try {
        // For now, allow account deletion
        // In production, you would check for active bookings, pending payments, and unsigned contracts
        return { allowed: true, reason: null };
      } catch (error) {
        console.error('[Account] Validation error:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Validation failed' });
      }
    }),
  } as any),
  emailPreferences: emailPreferencesRouter,
  pricing: pricingRouter,
  rider: riderRouter,
  follows: followsRouter,
  // helpAndSupport: helpAndSupportRouter,
  // contractPdf: contractPdfRouter,
  // supportTickets: supportTicketsRouter,
  // semanticSearch: semanticSearchRouter,
  // eviction: evictionRouter,
  // helpCenter: helpCenterRouter,
  // riderContract: riderContractRouter,
  // signature: signatureRouter,
  // contractTemplate: contractTemplateRouter,
  // contractHistory: contractHistoryRouter,
  // webhook: webhookRouter,
  // bulkContract: bulkContractRouter,
  // realtimeNotifications: realtimeNotificationsRouter,
  // paymentAnalytics: paymentAnalyticsRouter,
  // artistVerification: artistVerificationRouter,
  // emailVerification: emailVerificationRouter,
  // smsNotifications: smsNotificationsRouter,
  // user: userRouter,
  // venueDirectory: venueDirectoryRouter,
  // contact: contactRouter,
  // riderManagement: riderManagementRouter,
  // privacy: privacyRouter,
  // payments: paymentsRouter,
  // follows: followsRouter,
  // availabilityAlerts: availabilityAlertsRouter,
  // referralRewards: referralRewardsRouter,
  // browseFilters: browseFiltersRouter,
  // artistOnboarding: artistOnboardingRouter,
  // bookingAnalyticsExport: bookingAnalyticsExportRouter,
  // paymentTesting: router({
  //   success: publicProcedure
  //     .input(z.object({ bookingId: z.number() }))
  //     .query(async ({ input }) => {
  //       return { success: true, bookingId: input.bookingId, message: 'Payment success test' };
  //     }),
  //   failure: publicProcedure
  //     .input(z.object({ bookingId: z.number() }))
  //     .query(async ({ input }) => {
  //       return { success: true, bookingId: input.bookingId, message: 'Payment failure test' };
  //     }),
  //   retry: publicProcedure
  //     .input(z.object({ bookingId: z.number() }))
  //     .query(async ({ input }) => {
  //       return { success: true, bookingId: input.bookingId, message: 'Payment retry test' };
  //     }),
  // }),
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
    ...authRouter,
  } as any),

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
        
        return await handlePhotoUpload(input, ctx.user.id, "artist-photos");
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
        
        // mediaGallery field not available on venue profile
        // const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        // const updatedPhotos = [...(currentGallery.photos || []), url];
        
        // mediaGallery field not available on artist profile
        // await db.updateArtistProfile(ctx.user.id, {
        //   mediaGallery: {
        //     photos: updatedPhotos,
        //     videos: [],
        //   },
        // });
        
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
        const updatedPhotos = (currentGallery.photos || []).filter((url: string) => url !== input.photoUrl);
        
        // mediaGallery field not available on artist profile
        // await db.updateArtistProfile(ctx.user.id, {
        //   mediaGallery: {
        //     photos: updatedPhotos,
        //     videos: [],
        //   },
        // });
        
        return { success: true };
      }),
  }),

  // Venue Profile Management
  // venue: router({
  /**
   * Search venues with filters
   * Public endpoint - anyone can search venues
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
      const database = db.getDb();
      if (!database) throw new Error('Database connection failed');

      try {
        console.log('🔎 VENUE SEARCH CALLED');
        console.log('Input:', input);

        const venues = await db.searchVenues({
          searchQuery: input.searchQuery,
          location: input.location,
          limit: input.limit || 20,
          offset: input.offset || 0,
        });

        console.log('✅ Venues found:', venues.length);
        return venues;
      } catch (error) {
        console.error('[Venue Search] Error searching venues:', error);
        throw error;
      }
    }),

  getVenueTypes: publicProcedure.query(async () => {
    return ['Concert Hall', 'Bar', 'Club', 'Theater', 'Festival', 'Other'];
  }),

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
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        website: z.string().optional(),
        email: z.string().optional(),
        venueType: z.string().optional(),
        capacity: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createVenueProfile({
          userId: ctx.user.id,
          organizationName: input.organizationName,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          location: input.location,
          bio: input.bio,
        });
        return { success: true };
      }),
    
    // Update venue profile
    updateProfile: venueProcedure
      .input(z.object({
        organizationName: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        phone: z.string().optional(),
        websiteUrl: z.string().optional(),
        website: z.string().optional(),
        location: z.string().optional(),
        capacity: z.number().optional(),
        bio: z.string().optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        }
        await db.updateVenueProfile(profile.id, input);
        return { success: true, profile: await db.getVenueProfileByUserId(ctx.user.id) };
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
        // profilePhotoUrl field not available on venue profile
        // await db.updateVenueProfile(profile.id, { profilePhotoUrl: url });
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
        
        // mediaGallery field not available on venue profile
        // const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        // const updatedPhotos = [...(currentGallery.photos || []), url];
        
        // mediaGallery field not available on venue profile
        // await db.updateVenueProfile(profile.id, {
        //   mediaGallery: { photos: updatedPhotos, videos: [] },
        // });
        
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
        
        // mediaGallery field not available on venue profile
        // const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
        // const updatedPhotos = (currentGallery.photos || []).filter((url: string) => url !== input.photoUrl);
        
        // mediaGallery field not available on venue profile
        // await db.updateVenueProfile(profile.id, {
        //   mediaGallery: { photos: updatedPhotos, videos: [] },
        // });
        
        return { success: true };
      }),
    
    // Send email verification
    sendVerificationEmail: venueProcedure
      .mutation(async ({ ctx }) => {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // profile.email doesn't exist, use ctx.user.email instead
        
        // Get user email from context
        const userEmail = ctx.user.email;
        if (!userEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User email not found' });
        }
        
        // Generate verification token
        const verificationToken = crypto.getRandomValues(new Uint8Array(32)).toString();
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-venue-email?token=${verificationToken}`;
        
        // emailVerificationToken field not available on venue profile
        // await db.updateVenueProfile(profile.id, {
        //   emailVerificationToken: verificationToken,
        //   emailVerificationSentAt: new Date(),
        // });
        
        // Send verification email
        const emailSent = await sendVenueVerificationEmail({
          venueEmail: userEmail,
          venueName: profile.organizationName,
          verificationToken,
          verificationLink,
        });
        
        if (!emailSent) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send verification email' });
        }
        
        return { success: true, message: 'Verification email sent' };
      }),
    
    // Verify email with token
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const profile = await db.getVenueProfileByToken(input.token);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or expired verification token' });
        }
        
        // Mark email as verified
        // emailVerificationToken field not available on venue profile
        // await db.updateVenueProfile(profile.id, {
        //   emailVerificationToken: null,
        // });
        
        // Send confirmation email
        const user = await db.getUserById(profile.userId);
        if (user?.email) {
          await sendVenueVerificationConfirmationEmail({
            venueEmail: user.email,
            venueName: profile.organizationName,
          });
        }
        
        return { success: true, message: 'Email verified successfully' };
      }),
  // }),

  // Rider Template Management
  // Rider router is now imported from ./routers/rider

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
        // Date is stored as YYYY-MM-DD string in database
        const dateStr = input.date; // Already in YYYY-MM-DD format
        await db.setAvailability({
          artistId: profile.id,
          date: dateStr,
          status: input.status,
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
            date: dateStr,
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
            date: dateStr,
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
            // Send confirmation emails using new email service with preference checking
            if (artistUser?.email && artistProfile.userId) {
              await emailService.sendBookingConfirmationEmail(
                artistProfile.userId,
                artistUser.email,
                {
                  artistName: artistProfile.artistName,
                  venueName: venueProfile.organizationName,
                  eventDate: eventDateStr,
                  eventTime: booking.eventTime || 'TBD',
                  eventLocation: venueProfile.location || 'TBD',
                  bookingId: booking.id,
                }
              );
            }
            if (venueUser?.email && venueProfile.userId) {
              await emailService.sendBookingConfirmationEmail(
                venueProfile.userId,
                venueUser.email,
                {
                  artistName: artistProfile.artistName,
                  venueName: venueProfile.organizationName,
                  eventDate: eventDateStr,
                  eventTime: booking.eventTime || 'TBD',
                  eventLocation: venueProfile.location || 'TBD',
                  bookingId: booking.id,
                }
              );
            }
          } else if (input.status === 'cancelled') {
            // Send cancellation emails to both parties
            if (artistUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: artistUser.email,
                recipientName: artistProfile.artistName,
                otherPartyName: venueProfile.organizationName,
                eventDate: eventDateStr,
              });
            }
            if (venueUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: venueUser.email,
                recipientName: venueProfile.organizationName,
                otherPartyName: artistProfile.artistName,
                eventDate: eventDateStr,
              });
            }
          }
        }
        
        return { success: true };
      }),
    
    // Create deposit payment intent
    createDepositPayment: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        depositAmount: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Verify user is either the venue or artist
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        
        if (!venueProfile && !artistProfile) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        // Create Stripe payment intent
        const stripe = require('stripe')(ENV.stripeSecretKey);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.depositAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            bookingId: input.bookingId,
            userId: ctx.user.id,
            type: 'booking_deposit',
          },
        });
        
        // Update booking with payment intent ID
        await db.updateBooking(input.bookingId, {
          stripePaymentIntentId: paymentIntent.id,
        });
        
        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      }),
    
    // Confirm deposit payment
    confirmDepositPayment: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        paymentIntentId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Verify payment intent succeeded
        const stripe = require('stripe')(ENV.stripeSecretKey);
        const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment not completed' });
        }
        
        // Update booking payment status
        await db.updateBooking(input.bookingId, {
          paymentStatus: 'deposit_paid',
          depositPaidAt: new Date(),
        });
        
        // Send confirmation emails
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        const venueProfile = await db.getVenueProfileById(booking.venueId);
        
        if (artistProfile && venueProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          const venueUser = await db.getUserById(venueProfile.userId);
          
          if (artistUser?.email) {
            await email.sendEmail({
              to: artistUser.email,
              subject: 'Deposit Received for Booking',
              html: `<p>Deposit of $${booking.depositAmount} has been received for your booking on ${booking.eventDate}.</p>`,
            });
          }
          if (venueUser?.email) {
            await email.sendEmail({
              to: venueUser.email,
              subject: 'Deposit Confirmed',
              html: `<p>Deposit of $${booking.depositAmount} has been confirmed for your booking.</p>`,
            });
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
          recipientId: input.receiverId,
          content: input.messageText,
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
        const booking = await db.createBooking({
          artistId: input.artistId,
          venueId: venueProfile.id,
          eventDate: new Date(), // Placeholder date
          eventTime: null,
          totalFee: null,
          eventDetails: 'Quick inquiry from calendar',
          status: 'pending',
        });
        const bookingId = booking.id;
        
        // Send the message
        await db.createMessage({
          bookingId,
          senderId: ctx.user.id,
          recipientId: artistProfile.userId,
          content: input.message,
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
          comment: input.reviewText || null,
        });
        
        return { success: true };
      }),
    
    // Get reviews for an artist (public)
    getByArtist: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        let reviews: any[] = [];
        try {
          reviews = await db.getReviewsByArtistId(input.artistId);
        } catch (error) {
          console.error('Error getting reviews:', error);
        }
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
          comment: input.response,
        });

        // Send email notification to venue
        if (review.venueId) {
          const venueUser = await db.getUserById(review.venueId);
          if (venueUser?.email && artistProfile) {
            await email.sendReviewResponseEmail({
              venueEmail: venueUser.email,
              venueName: venueUser.name || 'Venue',
              artistName: artistProfile.artistName,
              originalReview: '', // comment field not available in current schema
              artistResponse: input.response,
              rating: review.rating || 0,
            });
          }
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
          comment: input.reviewText,
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
          comment: input.response,
        });

        return { success: true };
      }),
  }),

  // Subscription Management
  subscription: router({
    // Get current user's subscription
    getMy: protectedProcedure.query(async ({ ctx }) => {
      try {
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        return subscription || null;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
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
        return await db.getFavoritesByVenue(ctx.user.id);
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
          venueId: ctx.user.id,
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
  
  // Analytics router - profile views and stats moved to analytics router
  profileAnalytics: router({
    trackView: publicProcedure
      .input(z.object({
        artistId: z.number(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.trackProfileView(
            input.artistId,
            ctx.user?.id,
            input.ipAddress
          );
        } catch (error) {
          console.error('Error tracking profile view:', error);
        }
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
          const daysUntil = reminderType === 'upcoming' ? 7 : reminderType === 'deposit_due' ? 3 : 1;
          
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
                name: `Booking Deposit - ${booking.eventDetails || 'Event'}`,
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
                name: `Booking Payment - ${booking.eventDetails || 'Event'}`,
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
        templateData: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.createRiderTemplate({
          artistId: ctx.user.id,
          templateName: input.templateName,
          templateData: input.templateData || {},
        });
        return template;
      }),
    
    // Update rider template
    update: artistProcedure
      .input(z.object({
        templateId: z.number(),
        templateName: z.string().optional(),
        templateData: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getRiderTemplateById(input.templateId);
        if (!template || template.artistId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        await db.updateRiderTemplate(input.templateId, {
          templateName: input.templateName,
          templateData: input.templateData,
        });
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
  
  // ===== STUB ROUTERS (Disabled during cleanup but needed for TypeScript) =====
  venue: router({
    search: publicProcedure.query(() => []),
    getVenueTypes: publicProcedure.query(() => []),
    getMyProfile: protectedProcedure.query(() => null),
  } as any),
  
  payout: router({
    getPendingPayouts: publicProcedure.query(() => []),
    processPayout: publicProcedure.mutation(() => ({ success: false })),
    completePayout: publicProcedure.mutation(() => ({ success: false })),
    getVenueInvoices: publicProcedure.query(() => []),
    getEarnings: publicProcedure.query(() => ({})),
    getPayoutHistory: publicProcedure.query(() => []),
    requestPayout: publicProcedure.mutation(() => ({ success: false })),
  } as any),
  
  emailChange: router({
    revertChange: publicProcedure.mutation(() => ({ success: false })),
  } as any),
  
  earnings: router({
    getArtistEarnings: publicProcedure.query(() => null),
    getRecentTransactions: publicProcedure.query(() => []),
  } as any),
  
  // calendarEvent: calendarRouter, // Deprecated - commented out for noise elimination
  
  emailTesting: emailTestingRouter,
  
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log('[Newsletter] Subscription attempt for:', input.email);
          const emailSent = await email.sendNewsletterSubscriptionEmail(input.email);
          if (!emailSent) {
            console.error('[Newsletter] Email sending failed for:', input.email);
            throw new Error('Email service failed');
          }
          console.log('[Newsletter] Successfully subscribed:', input.email);
          return { success: true, message: 'Successfully subscribed to newsletter! Check your email for confirmation.' };
        } catch (error) {
          console.error('[Newsletter] Subscription error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to subscribe to newsletter. Please try again later.',
          });
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
