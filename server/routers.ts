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
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription, stripe } from "./stripe";
import { updateSubscriptionStatus } from "./db";
import * as imageOptimization from "./imageOptimization";
import { handlePhotoUpload } from "./handlers/imageUploadHandler";
// ===== MVP ROUTERS ONLY =====
import { authRouter } from "./routers/auth";
import { emailPreferencesRouter } from "./routers/emailPreferences";
import { emailTestingRouter } from "./routers/emailTesting";
import { pricingRouter } from "./routers/pricing";
import { riderRouter } from "./routers/rider";
import { riderContractRouter } from "./routers/riderContract";
import { venueContractRouter } from "./routers/venueContract";
import { followsRouter } from "./routers/follows";
import { eventsRouter } from "./routers/events";
import { adminRouter } from "./routers/admin";
import { payoutRouter } from "./routers/payout";
import { venueRouter } from "./routers/venue";
import { notifyFansProfileUpdate } from "./services/fanNotificationService";
import { artistUpdatesRouter } from "./routers/artistUpdates";
import { releaseRouter } from "./routers/release";
import { blogRouter } from "./routers/blog";
import { stripeConnectRouter } from "./routers/stripeConnect";
import { contactRouter } from "./routers/contact";
import { notificationsRouter } from "./routers/notifications";
import { disputeRouter } from "./routers/dispute";
import { ticketingRouter } from "./routers/ticketing";
import { touringRouter } from "./routers/touring";
import { referralRouter } from "./routers/referral";
import { sponsorRouter } from "./routers/sponsor";
import { venueSponsorRouter } from "./routers/venueSponsor";
import { merchRouter } from "./routers/merch";
import { projectPreviewsRouter } from "./routers/projectPreviews";
import { teamRouter } from "./routers/team";
import { tipRouter } from "./routers/tip";
import { fanClubRouter } from "./routers/fanClub";
import { newsletterLimiter } from "./utils/rateLimiter";
import * as notif from "./services/notificationService";


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
    testDatabase: publicProcedure.query(async () => {
      try {
        const database = await db.getDb();
        if (!database) {
          return { 
            status: "error", 
            message: "Database not initialized",
            databaseUrlSet: !!process.env.DATABASE_URL
          };
        }
        
        const artists = await db.getAllArtists();
        return { 
          status: "success", 
          message: "Database connection working",
          artistCount: artists.length,
          databaseUrlSet: !!process.env.DATABASE_URL
        };
      } catch (error: any) {
        return { 
          status: "error", 
          message: error.message,
          code: error.code,
          databaseUrlSet: !!process.env.DATABASE_URL
        };
      }
    }),
  }),
  
  // ===== MVP CORE ROUTERS ONLY =====
  // (Defined inline below at lines ~172, ~412, ~634, ~850)
  
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
  notifications: notificationsRouter,
  pricing: pricingRouter,
  rider: riderRouter,
  follows: followsRouter,
  artistUpdates: artistUpdatesRouter,
  payout: payoutRouter,
  riderContract: riderContractRouter,
  venueContract: venueContractRouter,
  ticketing: ticketingRouter,
  touring: touringRouter,
  referral: referralRouter,
  sponsor: sponsorRouter,
  venueSponsor: venueSponsorRouter,

  // Contract dashboard - list all contracts for the current user
  contractDashboard: router({
    getMyContracts: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const role = ctx.user.role;

      let contractsList: any[] = [];

      if (role === 'artist' || role === 'admin') {
        const artistProfile = await db.getArtistProfileByUserId(userId);
        if (artistProfile) {
          contractsList = await db.getContractsByArtistId(artistProfile.id);
        }
      }

      if (role === 'venue' || role === 'admin') {
        const venueProfile = await db.getVenueProfileByUserId(userId);
        if (venueProfile) {
          const venueContracts = await db.getContractsByVenueId(venueProfile.id);
          // Merge without duplicates
          const existingIds = new Set(contractsList.map(c => c.id));
          for (const vc of venueContracts) {
            if (!existingIds.has(vc.id)) contractsList.push(vc);
          }
        }
      }

      // Enrich each contract with booking, signature, and party info
      const enriched = await Promise.all(
        contractsList.map(async (contract) => {
          const booking = await db.getBookingById(contract.bookingId);
          const sigs = await db.getSignaturesByContractId(contract.id);
          const artistSig = sigs.find(s => s.signerRole === 'artist');
          const venueSig = sigs.find(s => s.signerRole === 'venue');

          // Get party names
          let artistName = 'Unknown Artist';
          let venueName = 'Unknown Venue';
          let riderTemplateName = 'Performance Rider';

          const artistProf = await db.getArtistProfileById(contract.artistId);
          if (artistProf) artistName = artistProf.artistName || artistName;

          const venueProf = await db.getVenueProfileById(contract.venueId);
          if (venueProf) venueName = venueProf.organizationName || venueName;

          // Get rider template name
          if (booking?.riderTemplateId) {
            try {
              const tmpl = await db.getRiderTemplateById(booking.riderTemplateId);
              if (tmpl) riderTemplateName = tmpl.templateName || riderTemplateName;
            } catch (_) { /* fallback */ }
          }

          return {
            id: contract.id,
            bookingId: contract.bookingId,
            status: contract.status,
            createdAt: contract.createdAt,
            updatedAt: contract.updatedAt,
            artistName,
            venueName,
            riderTemplateName,
            eventDate: booking?.eventDate || null,
            eventDetails: booking?.eventDetails || null,
            totalFee: booking?.totalFee || null,
            bookingStatus: booking?.status || null,
            artistSigned: !!artistSig,
            artistSignedAt: artistSig?.signedAt || null,
            artistSignerName: artistSig?.signerName || null,
            venueSigned: !!venueSig,
            venueSignedAt: venueSig?.signedAt || null,
            venueSignerName: venueSig?.signerName || null,
          };
        })
      );

      // Sort by most recent first
      enriched.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Also fetch venue contracts
      let venueContractsList: any[] = [];
      try {
        if (role === 'venue' || role === 'admin') {
          const venueProfile = await db.getVenueProfileByUserId(userId);
          if (venueProfile) {
            venueContractsList = await db.getVenueContractsByVenueId(venueProfile.id);
          }
        }
        if (role === 'artist' || role === 'admin') {
          const artistProfile = await db.getArtistProfileByUserId(userId);
          if (artistProfile) {
            const artistVenueContracts = await db.getVenueContractsByArtistId(artistProfile.id);
            const existingVcIds = new Set(venueContractsList.map(c => c.id));
            for (const vc of artistVenueContracts) {
              if (!existingVcIds.has(vc.id)) venueContractsList.push(vc);
            }
          }
        }
      } catch (_) { /* venue_contracts table may not exist yet */ }

      const enrichedVenueContracts = await Promise.all(
        venueContractsList.map(async (vc) => {
          const booking = await db.getBookingById(vc.bookingId);
          let artistName = 'Unknown Artist';
          let venueName = 'Unknown Venue';
          const artistProf = await db.getArtistProfileById(vc.artistId);
          if (artistProf) artistName = artistProf.artistName || artistName;
          const venueProf = await db.getVenueProfileById(vc.venueId);
          if (venueProf) venueName = venueProf.organizationName || venueName;

          return {
            id: vc.id,
            bookingId: vc.bookingId,
            status: vc.status,
            createdAt: vc.createdAt,
            updatedAt: vc.updatedAt,
            artistName,
            venueName,
            riderTemplateName: vc.title || 'Venue Agreement',
            eventDate: booking?.eventDate || null,
            eventDetails: booking?.eventDetails || null,
            totalFee: booking?.totalFee || null,
            bookingStatus: booking?.status || null,
            artistSigned: !!vc.artistSignedAt,
            artistSignedAt: vc.artistSignedAt || null,
            artistSignerName: vc.artistSignerName || null,
            venueSigned: !!vc.venueSignedAt,
            venueSignedAt: vc.venueSignedAt || null,
            venueSignerName: vc.venueSignerName || null,
            contractSource: 'venue' as const,
          };
        })
      );

      // Mark rider contracts with source
      const riderWithSource = enriched.map(c => ({ ...c, contractSource: 'rider' as const }));

      // Merge and sort all contracts
      const allContracts = [...riderWithSource, ...enrichedVenueContracts];
      allContracts.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      return allContracts;
    }),
  }),

  release: releaseRouter,
  blog: blogRouter,
  stripeConnect: stripeConnectRouter,
  contact: contactRouter,
  auth: router({
    setUserRole: publicProcedure.input(z.object({ userId: z.number(), role: z.enum(['artist', 'venue']) })).mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      try {
        let userData: any = opts.ctx.user;
        // Fetch fresh user data from DB
        if (opts.ctx.user.openId) {
          const freshUser = await db.getUserByOpenId(opts.ctx.user.openId);
          userData = freshUser || opts.ctx.user;
        } else if (opts.ctx.user.id) {
          const freshUser = await db.getUserById(opts.ctx.user.id);
          userData = freshUser || opts.ctx.user;
        }
        // Add hasPassword flag and strip passwordHash for security
        const { passwordHash, ...safeUser } = userData as any;
        return { ...safeUser, hasPassword: !!passwordHash };
      } catch (error) {
        console.error('[Auth.me] Error:', error);
        const { passwordHash, ...safeUser } = opts.ctx.user as any;
        return { ...safeUser, hasPassword: !!passwordHash };
      }
    }),
    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateRole: protectedProcedure
      .input(z.object({ role: z.enum(['artist', 'venue', 'fan']) }))
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
      return (await db.getArtistProfileByUserId(ctx.user.id)) ?? null;
    }),
    
    // Get any artist profile by ID (public)
    getProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return (await db.getArtistProfileById(input.id)) ?? null;
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
        websiteUrl: z.string().nullable().optional(),
        socialLinks: z.object({
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          youtube: z.string().optional(),
          spotify: z.string().optional(),
          twitter: z.string().optional(),
          appleMusic: z.string().optional(),
          tidal: z.string().optional(),
          soundcloud: z.string().optional(),
          otherStreaming: z.string().optional(),
        }).optional(),
        tipLinks: z.object({
          cashapp: z.string().optional(),
          venmo: z.string().optional(),
          paypal: z.string().optional(),
          zelle: z.string().optional(),
        }).optional(),
        profilePhotoUrl: z.string().optional(),
        crmSupporter: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.updateArtistProfile(profile.id, input);

        // Notify fans about profile update (fire-and-forget)
        const updateSummary = input.bio ? 'Updated their bio and profile info' 
          : input.genre ? 'Updated their music genres'
          : input.profilePhotoUrl ? 'Updated their profile photo'
          : 'Updated their profile';
        notifyFansProfileUpdate(ctx.user.id, {
          updateType: input.bio ? 'bio' : input.profilePhotoUrl ? 'photos' : 'general',
          summary: updateSummary,
        }).catch(err => console.error('[Artist] Fan notification failed:', err));

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
        // Upload and optimize the photo
        const result = await handlePhotoUpload(input, ctx.user.id, "artist-photos");
        
        // Also save the URL to the artist profile in the database
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (profile) {
          await db.updateArtistProfile(profile.id, { profilePhotoUrl: result.url });
        }
        
        return result;
      }),

    // Create artist profile
    createProfile: artistProcedure
      .input(z.object({
        artistName: z.string(),
        talentType: z.enum(['artist', 'athlete', 'creator']).optional().default('artist'),
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
          appleMusic: z.string().optional(),
          tidal: z.string().optional(),
          soundcloud: z.string().optional(),
          otherStreaming: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Block profile creation if email is not verified
        if (!ctx.user.emailVerified) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Please verify your email address before creating a profile. Check your inbox for the verification link.',
          });
        }
        // Check if user already has an artist profile
        const existing = await db.getArtistProfileByUserId(ctx.user.id);
        if (existing) {
          // Return the existing profile instead of creating a duplicate
          return existing;
        }
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
        availableFrom: z.string().optional(),
        availableTo: z.string().optional(),
        availableDate: z.string().optional(),
        verifiedOnly: z.boolean().optional(),
      }).optional().default({}))
      .query(async ({ input }) => {
        return await db.searchArtists(input || {});
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

    // ===== PERFORMANCE VIDEO ENDPOINTS =====

    // Step 1: Get a server-side upload URL for the video (validates tier, returns upload details)
    getVideoUploadUrl: artistProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number().max(500 * 1024 * 1024, 'Video file must be under 500MB'),
        durationSeconds: z.number().max(300, 'Video must be 5 minutes or less'),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }

        // Check subscription tier from user_subscriptions table
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        const tier = subscription?.tier || 'free';
        if (tier !== 'professional' && tier !== 'starter') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Performance video upload requires a Starter or Professional subscription' });
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
        if (!allowedTypes.includes(input.mimeType)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only MP4, MOV, and WebM videos are allowed' });
        }

        const timestamp = Date.now();
        const ext = input.fileName.split('.').pop() || 'mp4';
        const fileKey = `performance-videos/${ctx.user.id}/${timestamp}.${ext}`;

        return { fileKey, mimeType: input.mimeType, durationSeconds: input.durationSeconds };
      }),

    // Step 2: Upload the video file via server proxy to S3 (avoids base64, streams the file)
    uploadPerformanceVideo: artistProcedure
      .input(z.object({
        fileKey: z.string(),
        mimeType: z.string(),
        durationSeconds: z.number().max(300, 'Video must be 5 minutes or less'),
        fileData: z.string(), // base64 encoded — kept as fallback for smaller files
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }

        // Upload to S3 via storage helper
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        const { url } = await storagePut(input.fileKey, buffer, input.mimeType);

        // Update artist profile
        await db.updateArtistProfile(profile.id, {
          performanceVideoUrl: url,
          performanceVideoStatus: 'pending',
          performanceVideoDuration: input.durationSeconds,
          performanceVideoUploadedAt: new Date(),
        } as any);

        // Add to moderation queue
        await db.createVideoModerationEntry({
          artistProfileId: profile.id,
          artistUserId: ctx.user.id,
          videoUrl: url,
          durationSeconds: input.durationSeconds,
          status: 'pending',
        });

        return { success: true, url, status: 'pending' };
      }),

    // Delete performance video
    deletePerformanceVideo: artistProcedure
      .mutation(async ({ ctx }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }

        await db.updateArtistProfile(profile.id, {
          performanceVideoUrl: null,
          performanceVideoThumbnail: null,
          performanceVideoStatus: null,
          performanceVideoDuration: null,
          performanceVideoUploadedAt: null,
        } as any);

        return { success: true };
      }),

    // Get performance video status
    getPerformanceVideoStatus: artistProcedure
      .query(async ({ ctx }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) return null;
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        const tier = subscription?.tier || 'free';
        return {
          url: profile.performanceVideoUrl,
          thumbnail: profile.performanceVideoThumbnail,
          status: profile.performanceVideoStatus,
          duration: profile.performanceVideoDuration,
          uploadedAt: profile.performanceVideoUploadedAt,
          tier: tier,
        };
      }),
    // Report/flag a performance video (any logged-in user)
    reportVideo: protectedProcedure
      .input(z.object({
        artistProfileId: z.number(),
        reason: z.enum(['inappropriate', 'copyright', 'spam', 'other']),
        details: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Can't flag your own video
        const myProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (myProfile && myProfile.id === input.artistProfileId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot report your own video' });
        }
        try {
          const result = await db.flagVideo(input.artistProfileId, ctx.user.id, input.reason, input.details);
          return result;
        } catch (err: any) {
          if (err.message === 'You have already reported this video') {
            throw new TRPCError({ code: 'CONFLICT', message: err.message });
          }
          throw err;
        }
      }),

    // Check if current user has already flagged a video
    hasUserFlaggedVideo: protectedProcedure
      .input(z.object({ artistProfileId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.hasUserFlaggedVideo(input.artistProfileId, ctx.user.id);
      }),
  }),

  // Venue Profile Management is now handled by venueRouter (imported above)

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
        return await db.getAvailabilityByArtistId(input.artistId);
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
            const venueUser = await db.getUserById(venue.userId);
            if (venueUser && venueUser.email) {
              await email.sendAvailabilityUpdateNotification(
                venueUser.email,
                venue.organizationName || 'Venue',
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

    // Set availability for a date range (artist only)
    setRange: artistProcedure
      .input(z.object({
        fromDate: z.string(),
        toDate: z.string(),
        status: z.enum(['available', 'booked', 'unavailable']),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        // Generate all dates in range
        const dates: string[] = [];
        const start = new Date(input.fromDate + 'T00:00:00');
        const end = new Date(input.toDate + 'T00:00:00');
        if (end < start) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'End date must be after start date' });
        }
        // Limit range to 90 days max
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 90) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Date range cannot exceed 90 days' });
        }
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        // Set availability for each date
        for (const dateStr of dates) {
          await db.setAvailability({
            artistId: profile.id,
            date: dateStr,
            status: input.status,
          });
        }
        // Send notifications to venues who favorited this artist (only for available)
        if (input.status === 'available') {
          const venues = await db.getVenuesWhoFavoritedArtist(profile.id);
          for (const venue of venues) {
            const venueUser = await db.getUserById(venue.userId);
            if (venueUser && venueUser.email) {
              await email.sendAvailabilityUpdateNotification(
                venueUser.email,
                venue.organizationName || 'Venue',
                profile.artistName,
                profile.id,
                dates
              );
            }
          }
        }
        return { success: true, datesSet: dates.length };
      }),

    // Delete availability for a date range (artist only)
    deleteRange: artistProcedure
      .input(z.object({
        fromDate: z.string(),
        toDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        // Get all availability entries for this artist in the date range
        const allAvailability = await db.getAvailabilityByArtistId(profile.id);
        const start = new Date(input.fromDate + 'T00:00:00');
        const end = new Date(input.toDate + 'T00:00:00');
        let deletedCount = 0;
        for (const avail of allAvailability) {
          const aDate = new Date((typeof avail.date === 'string' ? avail.date : new Date(avail.date).toISOString().split('T')[0]) + 'T00:00:00');
          if (aDate >= start && aDate <= end) {
            await db.deleteAvailability(avail.id);
            deletedCount++;
          }
        }
        return { success: true, datesRemoved: deletedCount };
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
        riderTemplateId: z.number().optional(),
        // Door-split payment terms
        paymentTermsType: z.enum(['flat_guarantee', 'door_split', 'guarantee_vs_percentage']).optional(),
        doorSplitArtistPercent: z.number().min(0).max(100).optional(),
        guaranteeAmount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // Check if artist is available on this date
        const avail = await db.getAvailabilityForDate(input.artistId, new Date(input.eventDate));
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
          riderTemplateId: input.riderTemplateId,
          riderStatus: input.riderTemplateId ? 'pending' : undefined,
          paymentTermsType: input.paymentTermsType || 'flat_guarantee',
          doorSplitArtistPercent: input.doorSplitArtistPercent,
          guaranteeAmount: input.guaranteeAmount?.toString(),
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
        
        // In-app notification to artist
        if (artistProfile) {
          notif.notifyBookingRequest({
            artistUserId: artistProfile.userId,
            venueName: input.venueName,
            bookingId: 0, // We don't have the ID from createBooking return
            eventDate: new Date(input.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          }).catch(() => {});
        }
        
        return { success: true };
      }),
    
    // Create booking request (client/fan - anyone logged in)
    clientCreate: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        eventDate: z.string(),
        eventTime: z.string().optional(),
        eventType: z.enum(['wedding', 'corporate', 'birthday', 'church', 'festival', 'house_party', 'restaurant', 'other']),
        venueName: z.string().min(1),
        venueAddress: z.string().optional(),
        eventDetails: z.string().optional(),
        totalFee: z.number().optional(),
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        clientPhone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if artist is available on this date
        const avail = await db.getAvailabilityForDate(input.artistId, new Date(input.eventDate));
        if (avail && avail.status !== 'available') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Artist is not available on this date' });
        }
        
        // Check if artist has a default rider template to auto-attach
        let defaultRiderId: number | undefined;
        try {
          const artistProfile = await db.getArtistProfileById(input.artistId);
          if (artistProfile) {
            const { getDefaultRiderForArtist } = await import('./services/riderTemplateService');
            const defaultRider = await getDefaultRiderForArtist(artistProfile.userId);
            if (defaultRider) defaultRiderId = defaultRider.id;
          }
        } catch (_) { /* fallback: no auto-attach */ }

        const booking = await db.createBooking({
          artistId: input.artistId,
          venueId: ctx.user.id, // Use the client's user ID as the booker
          eventDate: new Date(input.eventDate),
          eventTime: input.eventTime,
          eventDetails: input.eventDetails,
          totalFee: input.totalFee?.toString(),
          status: 'pending',
          eventType: input.eventType,
          bookingSource: 'client_booking',
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          riderTemplateId: defaultRiderId,
          riderStatus: defaultRiderId ? 'pending' : undefined,
        });
        
        const formattedDate = new Date(input.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const addressParts = input.venueAddress;
        
        // Send enhanced email notification to artist
        const artistProfile = await db.getArtistProfileById(input.artistId);
        if (artistProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          if (artistUser?.email) {
            await email.sendClientBookingNotificationToArtist({
              artistEmail: artistUser.email,
              artistName: artistProfile.artistName,
              clientName: input.clientName,
              clientEmail: input.clientEmail,
              bookingId: booking.id,
              eventType: input.eventType,
              eventDate: formattedDate,
              eventTime: input.eventTime,
              venueName: input.venueName,
              venueAddress: addressParts,
              totalFee: input.totalFee,
              eventDetails: input.eventDetails,
            }).catch((err) => console.error('[ClientBooking] Artist email failed:', err));
          }
          
          // In-app notification to artist
          notif.notifyBookingRequest({
            artistUserId: artistProfile.userId,
            venueName: `${input.clientName} (${input.eventType.replace('_', ' ')})`,
            bookingId: booking.id,
            eventDate: formattedDate,
          }).catch(() => {});
        }
        
        // Send confirmation email to the client who booked
        email.sendClientBookingConfirmationEmail({
          clientEmail: input.clientEmail,
          clientName: input.clientName,
          artistName: artistProfile?.artistName || 'Artist',
          artistId: input.artistId,
          bookingId: booking.id,
          eventType: input.eventType,
          eventDate: formattedDate,
          eventTime: input.eventTime,
          venueName: input.venueName,
          venueAddress: addressParts,
          totalFee: input.totalFee,
          eventDetails: input.eventDetails,
        }).catch((err) => console.error('[ClientBooking] Client confirmation email failed:', err));
        
        return { success: true, bookingId: booking.id };
      }),

    // Artist requests to perform at a venue
    requestToPerform: artistProcedure
      .input(z.object({
        venueId: z.number(),
        eventName: z.string().min(1),
        eventDate: z.string(),
        eventTime: z.string().optional(),
        message: z.string().optional(),
        paymentTermsType: z.enum(['flat_guarantee', 'door_split', 'guarantee_vs_percentage']).optional(),
        proposedFee: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the artist's profile
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Artist profile not found' });
        }

        // Get the venue profile
        const venueProfile = await db.getVenueProfileById(input.venueId);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue not found' });
        }

        // Check if the requested date is blocked (explicit or recurring)
        const dateBlockStatus = await db.isDateBlockedForVenue(venueProfile.id, input.eventDate);
        if (dateBlockStatus.blocked) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `This venue is unavailable on the selected date (${dateBlockStatus.reason}). Please choose a different date.` });
        }

        const formattedDate = new Date(input.eventDate).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });

        // Auto-attach artist's default rider template if available
        let defaultRiderId: number | undefined;
        try {
          const { getDefaultRiderForArtist } = await import('./services/riderTemplateService');
          const defaultRider = await getDefaultRiderForArtist(ctx.user.id);
          if (defaultRider) defaultRiderId = defaultRider.id;
        } catch (_) { /* fallback: no auto-attach */ }

        // Create a booking for this performance request
        const booking = await db.createBooking({
          artistId: artistProfile.id,
          venueId: venueProfile.id,
          eventDate: new Date(input.eventDate),
          eventTime: input.eventTime || null,
          eventDetails: input.eventName,
          totalFee: input.proposedFee?.toString() || null,
          status: 'pending',
          bookingSource: 'artist_request',
          riderTemplateId: defaultRiderId,
          riderStatus: defaultRiderId ? 'pending' : undefined,
        });

        // Send in-app notification to venue owner
        const artistName = artistProfile.artistName || 'An artist';
        await notif.notifyPerformanceRequest({
          venueUserId: venueProfile.userId,
          artistName,
          eventName: input.eventName,
          eventDate: formattedDate,
          actionUrl: `/bookings/${booking.id}`,
        });

        // Send email to venue owner
        const venueUser = await db.getUserById(venueProfile.userId);
        if (venueUser?.email) {
          email.sendPerformanceRequestEmail({
            venueEmail: venueUser.email,
            venueName: venueProfile.organizationName || 'Venue',
            artistName,
            eventName: input.eventName,
            eventDate: input.eventDate,
            eventTime: input.eventTime,
            message: input.message,
            paymentTermsType: input.paymentTermsType,
            proposedFee: input.proposedFee,
          }).catch((err) => console.error('[RequestToPerform] Email failed:', err));
        }

        return { success: true, bookingId: booking.id };
      }),

    // Get bookings created by current user as a client (non-venue bookings)
    getMyClientBookings: protectedProcedure.query(async ({ ctx }) => {
      const allBookings = await db.getBookingsByVenueId(ctx.user.id);
      // Filter to only client bookings (bookingSource = client_booking) or all if user is not a venue
      const clientBookings = allBookings.filter(b => b.bookingSource === 'client_booking');
      // Enrich with artist info
      const enriched = await Promise.all(
        clientBookings.map(async (booking) => {
          let artistName = `Artist #${booking.artistId}`;
          let artistPhoto: string | null = null;
          try {
            const artistProfile = await db.getArtistProfileById(booking.artistId);
            if (artistProfile) {
              artistName = artistProfile.artistName || artistName;
              artistPhoto = artistProfile.profilePhotoUrl || null;
            }
          } catch (_) { /* fallback */ }
          return { ...booking, artistName, artistPhoto };
        })
      );
      return enriched;
    }),

    // Get booking by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) return null;

        // Determine the user's role relative to this specific booking
        // A user may have both artist and venue profiles, so we check which one matches
        let bookingRole: 'venue' | 'artist' | 'viewer' = 'viewer';
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (venueProfile && booking.venueId === venueProfile.id) {
          bookingRole = 'venue';
        } else if (artistProfile && booking.artistId === artistProfile.id) {
          bookingRole = 'artist';
        } else if (ctx.user.role === 'admin') {
          bookingRole = 'venue'; // Admins can act as venue for contract management
        }

        return { ...booking, bookingRole };
      }),
    
    // Get bookings for current artist
    getMyArtistBookings: artistProcedure.query(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) return [];
      const bookings = await db.getBookingsByArtistId(profile.id);
      if (!bookings || bookings.length === 0) return [];
      // Enrich bookings with venue name and photo
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          let venueName = `Venue #${booking.venueId}`;
          let venuePhoto: string | null = null;
          try {
            const venueProfile = await db.getVenueProfileById(booking.venueId);
            if (venueProfile) {
              venueName = venueProfile.organizationName || venueName;
              venuePhoto = venueProfile.profilePhotoUrl || null;
            }
          } catch (_) { /* fallback to default */ }
          return { ...booking, venueName, venuePhoto };
        })
      );
      return enrichedBookings;
    }),
    
    // Get bookings for current venue
    getMyVenueBookings: venueProcedure.query(async ({ ctx }) => {
      const profile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!profile) return [];
      const bookings = await db.getBookingsByVenueId(profile.id);
      if (!bookings || bookings.length === 0) return [];
      // Enrich bookings with artist name and rider message flag
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          // Resolve artist name
          let artistName = `Artist #${booking.artistId}`;
          let artistPhoto: string | null = null;
          try {
            const artistProfile = await db.getArtistProfileById(booking.artistId);
            if (artistProfile) {
              artistName = artistProfile.artistName || artistName;
              artistPhoto = artistProfile.profilePhotoUrl || null;
            }
          } catch (_) { /* fallback to default */ }
          // Check for rider messages
          const msgs = await db.getMessagesByBookingId(booking.id);
          const hasRiderMessage = msgs.some((m) => m.messageType === 'rider');
          return { ...booking, artistName, artistPhoto, hasRiderMessage };
        })
      );
      return enrichedBookings;
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
        
        // If cancelling, handle refunds and mark date as available
        if (input.status === 'cancelled') {
          if (booking.status === 'confirmed') {
            const dateStr = booking.eventDate instanceof Date 
              ? booking.eventDate.toISOString().split('T')[0] 
              : booking.eventDate;
            await db.setAvailability({
              artistId: booking.artistId,
              date: dateStr,
              status: 'available',
            });
          }
          
          // Use cancellation service for refund handling
          const { cancelBooking } = await import('./services/bookingCancellation');
          const result = await cancelBooking(input.id, 'artist');
          // cancelBooking already updates the booking status
        } else {
          await db.updateBooking(input.id, { status: input.status });
        }
        
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
            // In-app notifications for confirmation
            if (artistProfile.userId) {
              notif.notifyBookingConfirmed({ recipientUserId: artistProfile.userId, otherPartyName: venueProfile.organizationName, bookingId: booking.id }).catch(() => {});
            }
            if (venueProfile.userId) {
              notif.notifyBookingConfirmed({ recipientUserId: venueProfile.userId, otherPartyName: artistProfile.artistName, bookingId: booking.id }).catch(() => {});
            }
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
          } else if (input.status === 'completed') {
            // Send settlement reminder to venue if door-split or guarantee-vs-percentage
            const paymentTermsType = (booking as any).paymentTermsType || 'flat_guarantee';
            if (paymentTermsType !== 'flat_guarantee' && venueUser?.email) {
              email.sendSettlementReminderEmail({
                venueEmail: venueUser.email,
                venueName: venueProfile.organizationName,
                artistName: artistProfile.artistName,
                eventDate: booking.eventDate instanceof Date ? booking.eventDate.toISOString() : booking.eventDate,
                bookingId: booking.id,
                paymentTermsType,
                doorSplitArtistPercent: (booking as any).doorSplitArtistPercent,
                guaranteeAmount: (booking as any).guaranteeAmount,
              }).catch((err) => console.error('[Email] Settlement reminder failed:', err));
            }
          } else if (input.status === 'cancelled') {
            // In-app notifications for cancellation
            if (artistProfile.userId) {
              notif.notifyBookingCancelled({ recipientUserId: artistProfile.userId, otherPartyName: venueProfile.organizationName, bookingId: booking.id, cancelledBy: 'Artist' }).catch(() => {});
            }
            if (venueProfile.userId) {
              notif.notifyBookingCancelled({ recipientUserId: venueProfile.userId, otherPartyName: artistProfile.artistName, bookingId: booking.id, cancelledBy: 'Artist' }).catch(() => {});
            }
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

    // Venue respond to booking (accept/decline)
    venueRespond: venueProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['confirmed', 'cancelled']),
      }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Verify this booking belongs to this venue
        if (booking.venueId !== venueProfile.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
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
          await db.updateBooking(input.id, { status: input.status });
        }
        
        // If cancelling, handle refunds via cancellation service
        if (input.status === 'cancelled') {
          if (booking.status === 'confirmed') {
            const dateStr = booking.eventDate instanceof Date 
              ? booking.eventDate.toISOString().split('T')[0] 
              : booking.eventDate;
            await db.setAvailability({
              artistId: booking.artistId,
              date: dateStr,
              status: 'available',
            });
          }
          const { cancelBooking } = await import('./services/bookingCancellation');
          await cancelBooking(input.id, 'venue');
        }
        
        // Send email notifications
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        if (artistProfile && venueProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          const venueUser = await db.getUserById(venueProfile.userId);
          const eventDateStr = booking.eventDate instanceof Date 
            ? booking.eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          if (input.status === 'confirmed') {
            // In-app notification
            notif.notifyBookingConfirmed({ recipientUserId: artistProfile.userId, otherPartyName: venueProfile.organizationName, bookingId: booking.id }).catch(() => {});
            notif.notifyBookingConfirmed({ recipientUserId: venueProfile.userId, otherPartyName: artistProfile.artistName, bookingId: booking.id }).catch(() => {});
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
          } else if (input.status === 'cancelled') {
            // In-app notification
            notif.notifyBookingCancelled({ recipientUserId: artistProfile.userId, otherPartyName: venueProfile.organizationName, bookingId: booking.id, cancelledBy: venueProfile.organizationName }).catch(() => {});
            if (artistUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: artistUser.email,
                recipientName: artistProfile.artistName,
                otherPartyName: venueProfile.organizationName,
                eventDate: eventDateStr,
              });
            }
          }
        }
        
        return { success: true };
      }),
    
    // Saved/Favorited Artists
    saveArtist: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        await db.saveArtist(venueProfile.id, input.artistId);
        return { success: true };
      }),

    unsaveArtist: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        await db.unsaveArtist(venueProfile.id, input.artistId);
        return { success: true };
      }),

    getSavedArtists: venueProcedure.query(async ({ ctx }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) return [];
      
      // Get saved artists from saved_artists table
      const saved = await db.getSavedArtistsByVenueId(venueProfile.id);
      const enrichedSaved = await Promise.all(
        saved.map(async (s) => {
          const artist = await db.getArtistProfileById(s.artistId);
          return artist ? { ...s, artist, source: 'saved' as const } : null;
        })
      );
      
      // Also get followed artists from follows table
      const { getFollowing } = await import('./services/followService');
      const followedUsers = await getFollowing(ctx.user.id, 100, 0);
      const followedArtists = followedUsers
        .filter((f: any) => f.role === 'artist' && f.profileId)
        .map((f: any) => ({
          id: f.id,
          artistId: f.profileId,
          source: 'followed' as const,
        }));
      
      // Enrich followed artists with full profile data (skip duplicates already in saved)
      const savedArtistIds = new Set(saved.map(s => s.artistId));
      const enrichedFollowed = await Promise.all(
        followedArtists
          .filter((f: any) => !savedArtistIds.has(f.artistId))
          .map(async (f: any) => {
            const artist = await db.getArtistProfileById(f.artistId);
            return artist ? { ...f, artist, source: 'followed' as const } : null;
          })
      );
      
      return [...enrichedSaved.filter(Boolean), ...enrichedFollowed.filter(Boolean)];
    }),

    isArtistSaved: venueProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) return { saved: false };
        const isSaved = await db.isArtistSaved(venueProfile.id, input.artistId);
        return { saved: isSaved };
      }),

    // Post-show settlement — venue enters door revenue and calculates artist payout
    settleBooking: venueProcedure
      .input(z.object({
        bookingId: z.number(),
        doorRevenue: z.number().min(0),
        attendance: z.number().int().min(0).optional(),
        settlementNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        if (booking.venueId !== venueProfile.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        if (booking.status !== 'confirmed' && booking.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only settle confirmed or completed bookings' });
        }

        // Calculate settlement amount based on payment terms
        let settlementAmount = 0;
        const termsType = booking.paymentTermsType || 'flat_guarantee';
        const doorRevenue = input.doorRevenue;

        if (termsType === 'flat_guarantee') {
          // Flat guarantee = totalFee (already agreed upon)
          settlementAmount = parseFloat(booking.totalFee || '0');
        } else if (termsType === 'door_split') {
          // Door split = doorRevenue * artistPercent
          const artistPercent = (booking.doorSplitArtistPercent || 80) / 100;
          settlementAmount = doorRevenue * artistPercent;
        } else if (termsType === 'guarantee_vs_percentage') {
          // Guarantee vs percentage = MAX(guarantee, doorRevenue * artistPercent)
          const guarantee = parseFloat(booking.guaranteeAmount || '0');
          const artistPercent = (booking.doorSplitArtistPercent || 80) / 100;
          const doorPayout = doorRevenue * artistPercent;
          settlementAmount = Math.max(guarantee, doorPayout);
        }

        await db.updateBooking(input.bookingId, {
          doorRevenue: doorRevenue.toString(),
          attendance: input.attendance,
          settlementAmount: settlementAmount.toFixed(2),
          settlementNotes: input.settlementNotes,
          settledAt: new Date(),
          status: 'completed',
        });

        return {
          success: true,
          settlement: {
            termsType,
            doorRevenue,
            artistPercent: booking.doorSplitArtistPercent || (termsType === 'flat_guarantee' ? null : 80),
            guarantee: booking.guaranteeAmount ? parseFloat(booking.guaranteeAmount) : null,
            calculatedPayout: settlementAmount,
            attendance: input.attendance,
          },
        };
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
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.depositAmount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            bookingId: String(input.bookingId),
            userId: String(ctx.user.id),
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
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
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
    
    // Attach rider template to an existing booking
    attachRider: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        riderTemplateId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Verify user is involved in this booking
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtist = artistProfile && booking.artistId === artistProfile.id;
        const isVenue = venueProfile && booking.venueId === venueProfile.id;
        if (!isArtist && !isVenue) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        
        await db.updateBooking(input.bookingId, {
          riderTemplateId: input.riderTemplateId,
          riderStatus: 'pending',
        });
        
        return { success: true };
      }),
    
    // Get rider for a booking
    getRider: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) return null;
        
        if (!booking.riderTemplateId) return null;
        
        const { getRiderTemplate } = await import('./services/riderTemplateService');
        const template = await getRiderTemplate(booking.riderTemplateId);
        return template || null;
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
        // In-app notification to recipient
        const senderUser = await db.getUserById(ctx.user.id);
        const senderName = senderUser?.name || senderUser?.email || 'Someone';
        notif.notifyNewMessage({
          recipientUserId: input.receiverId,
          senderName,
          preview: input.messageText,
          bookingId: input.bookingId,
        }).catch(() => {});
        return { success: true };
      }),
    
    // Send rider template as a message
    sendRider: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        receiverId: z.number(),
        riderTemplateId: z.number(),
        riderTemplateName: z.string(),
        riderTemplateData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          bookingId: input.bookingId,
          senderId: ctx.user.id,
          recipientId: input.receiverId,
          content: `📋 Rider: ${input.riderTemplateName}`,
          messageType: 'rider',
          metadata: {
            riderTemplateId: input.riderTemplateId,
            riderTemplateName: input.riderTemplateName,
            riderTemplateData: input.riderTemplateData,
          },
        });

        // Auto-attach riderTemplateId to booking for contract signing
        await db.updateBooking(input.bookingId, {
          riderTemplateId: input.riderTemplateId,
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
        await db.markMessagesAsRead(input.bookingId);
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
        // In-app notification to artist
        const reviewedArtist = await db.getArtistProfileById(input.artistId);
        if (reviewedArtist) {
          notif.notifyNewReview({
            recipientUserId: reviewedArtist.userId,
            reviewerName: venueProfile.organizationName || 'A venue',
            rating: input.rating,
            bookingId: input.bookingId,
          }).catch(() => {});
        }
        
        return { success: true };
      }),
    
    // Create review from artist profile page (venue only, no booking required)
    createFromProfile: venueProcedure
      .input(z.object({
        artistId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().min(1).max(200),
        reviewText: z.string().min(1).max(2000),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if artist exists
        const artist = await db.getArtistProfileById(input.artistId);
        if (!artist) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist not found' });
        }
        
        // Check if this user already reviewed this artist (without a booking)
        const existingReviews = await db.getReviewsByArtistId(input.artistId);
        const alreadyReviewed = existingReviews.find(
          (r: any) => r.reviewerUserId === ctx.user.id && !r.bookingId
        );
        if (alreadyReviewed) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already reviewed this artist' });
        }
        
        // Try to get venue profile for venueId, but don't require it
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        
        await db.createReview({
          bookingId: null as any,
          artistId: input.artistId,
          venueId: venueProfile?.id || null as any,
          reviewerUserId: ctx.user.id,
          rating: input.rating,
          comment: `${input.title}\n\n${input.reviewText}`,
        });
        // In-app notification to artist
        const reviewedArtistProfile = await db.getArtistProfileById(input.artistId);
        if (reviewedArtistProfile) {
          notif.notifyNewReview({
            recipientUserId: reviewedArtistProfile.userId,
            reviewerName: venueProfile?.organizationName || 'A venue',
            rating: input.rating,
          }).catch(() => {});
        }
        
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
              artistProfileId: artistProfile.id,
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
        professionalismRating: z.number().min(1).max(5).optional(),
        soundQualityRating: z.number().min(1).max(5).optional(),
        greenRoomRating: z.number().min(1).max(5).optional(),
        paymentTimelinessRating: z.number().min(1).max(5).optional(),
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
          professionalismRating: input.professionalismRating,
          soundQualityRating: input.soundQualityRating,
          greenRoomRating: input.greenRoomRating,
          paymentTimelinessRating: input.paymentTimelinessRating,
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

  // Artist Review Management (venues rate artists)
  artistReview: router({
    // Create artist review (venue only, for completed bookings)
    create: venueProcedure
      .input(z.object({
        bookingId: z.number(),
        artistId: z.number(),
        rating: z.number().min(1).max(5),
        reliabilityRating: z.number().min(1).max(5).optional(),
        stagePresenceRating: z.number().min(1).max(5).optional(),
        crowdEngagementRating: z.number().min(1).max(5).optional(),
        professionalismRating: z.number().min(1).max(5).optional(),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        if (booking.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Can only review completed bookings' });
        }
        const existingReview = await db.getArtistReviewByBookingId(input.bookingId);
        if (existingReview) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Review already exists for this booking' });
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only venues can leave artist reviews' });
        }
        await db.createArtistReview({
          bookingId: input.bookingId,
          venueId: venueProfile.id,
          artistId: input.artistId,
          rating: input.rating,
          reliabilityRating: input.reliabilityRating,
          stagePresenceRating: input.stagePresenceRating,
          crowdEngagementRating: input.crowdEngagementRating,
          professionalismRating: input.professionalismRating,
          comment: input.reviewText,
        });
        // Send notification to artist
        const artistProfile = await db.getArtistProfileById(input.artistId);
        if (artistProfile) {
          const artistUser = await db.getUserById(artistProfile.userId);
          if (artistUser?.email) {
            await email.sendArtistReviewNotificationEmail({
              artistEmail: artistUser.email,
              artistName: artistProfile.artistName,
              venueName: venueProfile.organizationName,
              reviewText: input.reviewText || '',
              rating: input.rating,
              artistProfileUrl: `https://ologywood.com/artist/${input.artistId}`,
            });
          }
        }
        return { success: true };
      }),

    // Get artist reviews by artist ID
    getByArtist: protectedProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getArtistReviewsByArtistId(input.artistId);
      }),

    // Get artist review by booking ID
    getByBooking: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getArtistReviewByBookingId(input.bookingId) || null;
      }),

    // Get average rating for artist (public so profile pages can show it)
    getAverageRating: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAverageRatingForArtist(input.artistId);
      }),

    // Artist responds to review
    respondToReview: artistProcedure
      .input(z.object({
        reviewId: z.number(),
        response: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        const review = await db.getArtistReviewById(input.reviewId);
        if (!review) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || artistProfile.id !== review.artistId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only respond to reviews for your own profile' });
        }
        await db.updateArtistReview(input.reviewId, { artistResponse: input.response, respondedAt: new Date() });
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
        plan: z.enum(['starter', 'professional', 'enterprise']).optional().default('professional'),
        interval: z.enum(['month', 'year']).optional().default('month'),
        useCredits: z.boolean().optional().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateStripeCustomer, createSubscriptionCheckoutSession, stripe: stripeClient } = await import('./stripe');
        
        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer({
          email: ctx.user.email || '',
          name: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
        });

        let couponId: string | undefined;

        // If user wants to apply referral credits, create a Stripe coupon
        if (input.useCredits && stripeClient) {
          const { referralCredits } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          const { getDb: getDatabase } = await import('./db');
            const database = await getDatabase();
          if (database) {
            // Calculate available credit balance
            const credits = await database
              .select()
              .from(referralCredits)
              .where(eq(referralCredits.userId, ctx.user.id));
            
            const earned = credits
              .filter((c: any) => c.type === 'earned')
              .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
            const redeemed = credits
              .filter((c: any) => c.type === 'redeemed')
              .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
            const balance = earned - redeemed;

            if (balance > 0) {
              // Create a one-time Stripe coupon for the credit amount (in cents)
              const amountOff = Math.round(balance * 100);
              const coupon = await stripeClient.coupons.create({
                amount_off: amountOff,
                currency: 'usd',
                duration: 'once',
                name: `Referral Credit ($${balance.toFixed(2)})`,
                metadata: {
                  userId: ctx.user.id.toString(),
                  type: 'referral_credit',
                },
              });
              couponId = coupon.id;

              // Record the credit redemption
              await database.insert(referralCredits).values({
                userId: ctx.user.id,
                amount: String(balance),
                type: 'redeemed',
                description: `Applied $${balance.toFixed(2)} credit to subscription checkout`,
              });
            }
          }
        }

        // Create checkout session for the selected plan and interval
        const checkoutUrl = await createSubscriptionCheckoutSession({
          customerId,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          plan: input.plan,
          interval: input.interval,
          couponId,
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
      const { cancelSubscription, getSubscriptionStatus } = await import('./stripe');
      const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');

      // Get plan details before cancelling
      let planName = 'your plan';
      let endDate = '';
      try {
        const status = await getSubscriptionStatus(subscription.stripeSubscriptionId);
        if (status) {
          endDate = status.currentPeriodEnd
            ? new Date(status.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          // Determine plan from price amount
          if (status.priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly) {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
          } else {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
          }
        }
      } catch (e) {
        console.error('[Subscription] Error fetching status for cancel email:', e);
      }

      await cancelSubscription(subscription.stripeSubscriptionId);

      // Send cancellation confirmation email
      if (ctx.user.email) {
        email.sendSubscriptionCanceledEmail({
          artistEmail: ctx.user.email,
          artistName: ctx.user.name || 'Artist',
          planName,
          endDate: endDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        }).catch(err => console.error('[Subscription] Cancel email failed:', err));
      }

      return { success: true };
    }),

    // Reactivate subscription
    reactivate: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      const { reactivateSubscription, getSubscriptionStatus } = await import('./stripe');
      const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');

      await reactivateSubscription(subscription.stripeSubscriptionId);

      // Get plan details after reactivation for the email
      let planName = 'your plan';
      let planPrice = '';
      let nextBillingDate = '';
      try {
        const status = await getSubscriptionStatus(subscription.stripeSubscriptionId);
        if (status) {
          nextBillingDate = status.currentPeriodEnd
            ? new Date(status.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          if (status.priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly) {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
            planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly / 100}/month`;
          } else {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
            planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly / 100}/month`;
          }
        }
      } catch (e) {
        console.error('[Subscription] Error fetching status for reactivate email:', e);
      }

      // Send reactivation confirmation email
      if (ctx.user.email) {
        email.sendSubscriptionReactivatedEmail({
          artistEmail: ctx.user.email,
          artistName: ctx.user.name || 'Artist',
          planName,
          planPrice,
          nextBillingDate,
        }).catch(err => console.error('[Subscription] Reactivate email failed:', err));
      }

      return { success: true };
    }),

    // Pause subscription (90-day max)
    pause: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      if (subscription.status === 'paused') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subscription is already paused' });
      }
      if (subscription.status === 'cancelled') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot pause a cancelled subscription' });
      }

      const { pauseSubscription, getSubscriptionStatus } = await import('./stripe');
      const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');

      // Pause billing in Stripe
      await pauseSubscription(subscription.stripeSubscriptionId);

      // Calculate 90-day expiration
      const now = new Date();
      const pauseExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Update local subscription record
      await db.upsertSubscription({
        userId: ctx.user.id,
        status: 'paused',
        pausedAt: now,
        pauseExpiresAt,
      });

      // Determine plan name for email
      let planName = 'your plan';
      try {
        const status = await getSubscriptionStatus(subscription.stripeSubscriptionId);
        if (status) {
          if (status.priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly) {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
          } else {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
          }
        }
      } catch (e) {
        console.error('[Subscription] Error fetching status for pause email:', e);
      }

      // Send pause confirmation email
      const resumeDateStr = pauseExpiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (ctx.user.email) {
        email.sendSubscriptionPausedEmail({
          artistEmail: ctx.user.email,
          artistName: ctx.user.name || 'Artist',
          planName,
          resumeDate: resumeDateStr,
        }).catch(err => console.error('[Subscription] Pause email failed:', err));
      }

      return { success: true, pauseExpiresAt };
    }),

    // Resume a paused subscription
    resume: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getSubscriptionByUserId(ctx.user.id);
      if (!subscription?.stripeSubscriptionId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }
      if (subscription.status !== 'paused') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Subscription is not paused' });
      }

      const { resumeSubscription, getSubscriptionStatus } = await import('./stripe');
      const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');

      // Resume billing in Stripe
      await resumeSubscription(subscription.stripeSubscriptionId);

      // Update local subscription record
      await db.upsertSubscription({
        userId: ctx.user.id,
        status: 'active',
        pausedAt: null,
        pauseExpiresAt: null,
      });

      // Get plan details for email
      let planName = 'your plan';
      let planPrice = '';
      let nextBillingDate = '';
      try {
        const status = await getSubscriptionStatus(subscription.stripeSubscriptionId);
        if (status) {
          nextBillingDate = status.currentPeriodEnd
            ? new Date(status.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          if (status.priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly) {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
            planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly / 100}/month`;
          } else {
            planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
            planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly / 100}/month`;
          }
        }
      } catch (e) {
        console.error('[Subscription] Error fetching status for resume email:', e);
      }

      // Send resume confirmation email
      if (ctx.user.email) {
        email.sendSubscriptionResumedEmail({
          artistEmail: ctx.user.email,
          artistName: ctx.user.name || 'Artist',
          planName,
          planPrice,
          nextBillingDate,
        }).catch(err => console.error('[Subscription] Resume email failed:', err));
      }

      return { success: true };
    }),

    // Self-service: sync subscription from Stripe (when webhook missed)
    syncFromStripe: protectedProcedure
      .mutation(async ({ ctx }) => {
        console.log('[SyncFromStripe] Starting sync for user:', ctx.user.id, ctx.user.email);
        const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');
        const { stripe: stripeClient } = await import('./stripe');

        if (!stripeClient) {
          console.error('[SyncFromStripe] Stripe not configured');
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        }

        const stripe = stripeClient;

        // Find Stripe customer by email
        if (!ctx.user.email) {
          console.error('[SyncFromStripe] No email on account');
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No email on account' });
        }

        console.log('[SyncFromStripe] Searching Stripe for customer with email:', ctx.user.email);
        const customers = await stripe.customers.list({ email: ctx.user.email, limit: 1 });
        console.log('[SyncFromStripe] Found customers:', customers.data.length);
        if (customers.data.length === 0) {
          console.log('[SyncFromStripe] No customer found, returning error');
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No Stripe customer found for your email. Please try upgrading again.' });
        }

        const customerId = customers.data[0].id;
        console.log('[SyncFromStripe] Customer ID:', customerId);

        // Get subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 5,
          expand: ['data.items.data.price'],
        });
        console.log('[SyncFromStripe] Found subscriptions:', subscriptions.data.length, subscriptions.data.map(s => ({ id: s.id, status: s.status })));

        if (subscriptions.data.length === 0) {
          console.log('[SyncFromStripe] No subscriptions found');
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No subscription found in Stripe for your account.' });
        }

        const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
          || subscriptions.data[0];
        console.log('[SyncFromStripe] Using subscription:', activeSub.id, 'status:', activeSub.status);

        // Determine tier
        const priceItem = (activeSub as any).items?.data?.[0]?.price;
        const priceAmount = priceItem?.unit_amount;
        const lookupKey = priceItem?.lookup_key;
        const planMetadata = activeSub.metadata?.plan;
        console.log('[SyncFromStripe] Price info:', { priceAmount, lookupKey, planMetadata });

        let tier: 'free' | 'starter' | 'professional' | 'enterprise' = 'professional';
        if (planMetadata === 'ARTIST_ENTERPRISE' ||
            lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.lookupKey ||
            lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.yearlyLookupKey ||
            priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceMonthly ||
            priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceYearly) {
          tier = 'enterprise';
        } else if (planMetadata === 'ARTIST_STARTER' ||
            lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
            lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey ||
            priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly ||
            priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly) {
          tier = 'starter';
        }

        // Map status
        let status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused' = 'active';
        if (activeSub.status === 'trialing') status = 'trialing';
        else if (activeSub.status === 'past_due') status = 'past_due';
        else if (activeSub.status === 'canceled') status = 'cancelled';
        else if (activeSub.status === 'paused') status = 'paused';

        const currentPeriodEnd = (activeSub as any).current_period_end
          ? new Date((activeSub as any).current_period_end * 1000)
          : undefined;

        console.log('[SyncFromStripe] Upserting subscription:', { userId: ctx.user.id, tier, status, currentPeriodEnd });

        // Upsert using the top-level db import
        await db.upsertSubscription({
          userId: ctx.user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: activeSub.id,
          tier,
          status,
          currentPeriodEnd,
        });

        console.log('[SyncFromStripe] Success! Tier:', tier, 'Status:', status);
        return { success: true, tier, status };
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
          await db.trackProfileView({
            artistId: input.artistId,
            viewedAt: new Date()
          });
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
        return await db.getProfileViewCount(profile.id);
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

    getCalendarFeedUrl: artistProcedure
      .query(async ({ ctx }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const { generateCalendarToken } = await import('./routes/calendarFeed');
        const token = generateCalendarToken(profile.id);
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        return {
          feedUrl: `${baseUrl}/api/calendar/${profile.id}/bookings.ics?token=${token}`,
          artistId: profile.id,
          token,
        };
      }),

    getGoogleCalendarStatus: artistProcedure.query(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
      }
      const status = await db.getGoogleCalendarStatus(profile.id);
      return status;
    }),

    syncGoogleCalendar: artistProcedure.mutation(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
      }
      const { syncGoogleCalendarForArtist } = await import('./routes/googleCalendarSync');
      const result = await syncGoogleCalendarForArtist(profile.id);
      if (result.error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }
      return { synced: result.synced };
    }),

    disconnectGoogleCalendar: artistProcedure.mutation(async ({ ctx }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
      }
      await db.disconnectGoogleCalendar(profile.id);
      return { success: true };
    }),
  }),
  
  // Reminders router (for testing/manual trigger)
  reminders: router({
    checkAndSend: publicProcedure
      .mutation(async () => {
        // This endpoint can be called manually or by a cron job
        const bookingsNeedingReminders = await db.getBookingsNeedingReminders();
        
        for (const booking of bookingsNeedingReminders) {
          const eventDate = new Date(booking.eventDate);
          const today = new Date();
          const daysUntil = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
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
            // venueAddress removed - not in booking schema
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
          
          await db.markReminderSent(booking.id);
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
        
        // Get availability for favorited artists
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
        
        // Calculate deposit: use stored amount or default to 50% of total fee
        const depositAmount = booking.depositAmount 
          ? Number(booking.depositAmount) 
          : booking.totalFee 
            ? Math.round(Number(booking.totalFee) / 2 * 100) / 100 
            : null;
        
        if (!depositAmount || depositAmount <= 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No deposit amount could be determined. Please set a total fee for this booking.' });
        }
        
        // Create Stripe checkout session with Connect routing
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = ctx.req.headers.origin || process.env.BASE_URL || '';
        const amountCents = Math.round(depositAmount * 100);
        const platformFeeCents = Math.max(1, Math.round(amountCents * 0.01)); // 1% platform fee

        // Look up artist's connected Stripe account
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        let connectAccountId: string | null = null;
        if (artistProfile) {
          const database = await db.getDb();
          if (database) {
            const { stripeConnectAccounts } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            const [account] = await database
              .select()
              .from(stripeConnectAccounts)
              .where(eq(stripeConnectAccounts.artistId, artistProfile.userId))
              .limit(1);
            if (account && account.status === 'active' && account.chargesEnabled) {
              connectAccountId = account.stripeAccountId;
            }
          }
        }

        const sessionParams: any = {
          payment_method_types: ['card'],
          customer_email: ctx.user.email || undefined,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Booking Deposit - ${booking.eventDetails || 'Event'}`,
                description: booking.eventDetails || 'Event booking deposit',
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          }],
          mode: 'payment',
          allow_promotion_codes: true,
          client_reference_id: ctx.user.id.toString(),
          success_url: `${origin}/booking/${input.bookingId}?payment=success`,
          cancel_url: `${origin}/booking/${input.bookingId}?payment=cancelled`,
          metadata: {
            bookingId: input.bookingId.toString(),
            paymentType: 'deposit',
            userId: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
            platformFeeAmount: platformFeeCents.toString(),
          },
        };

        // Route payment to artist's connected Stripe account if available
        if (connectAccountId) {
          sessionParams.payment_intent_data = {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: connectAccountId },
          };
          console.log(`[DepositCheckout] Using Stripe Connect: ${connectAccountId}, fee: ${platformFeeCents}c`);
        } else {
          console.log(`[DepositCheckout] No Connect account for artist ${booking.artistId}, payment goes to platform`);
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        
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
        
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = ctx.req.headers.origin || process.env.BASE_URL || '';
        const amountCents = Math.round(remainingAmount * 100);
        const platformFeeCents = Math.max(1, Math.round(amountCents * 0.01)); // 1% platform fee

        // Look up artist's connected Stripe account
        const artistProfile = await db.getArtistProfileById(booking.artistId);
        let connectAccountId: string | null = null;
        if (artistProfile) {
          const database = await db.getDb();
          if (database) {
            const { stripeConnectAccounts } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            const [account] = await database
              .select()
              .from(stripeConnectAccounts)
              .where(eq(stripeConnectAccounts.artistId, artistProfile.userId))
              .limit(1);
            if (account && account.status === 'active' && account.chargesEnabled) {
              connectAccountId = account.stripeAccountId;
            }
          }
        }

        const sessionParams: any = {
          payment_method_types: ['card'],
          customer_email: ctx.user.email || undefined,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Remaining Balance - ${booking.eventDetails || 'Event'}`,
                description: booking.eventDetails || 'Event booking payment',
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          }],
          mode: 'payment',
          allow_promotion_codes: true,
          client_reference_id: ctx.user.id.toString(),
          success_url: `${origin}/booking/${input.bookingId}?payment=success`,
          cancel_url: `${origin}/booking/${input.bookingId}?payment=cancelled`,
          metadata: {
            bookingId: input.bookingId.toString(),
            paymentType: 'final_payment',
            userId: ctx.user.id.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
            platformFeeAmount: platformFeeCents.toString(),
          },
        };

        // Route payment to artist's connected Stripe account if available
        if (connectAccountId) {
          sessionParams.payment_intent_data = {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: connectAccountId },
          };
          console.log(`[FullPaymentCheckout] Using Stripe Connect: ${connectAccountId}, fee: ${platformFeeCents}c`);
        } else {
          console.log(`[FullPaymentCheckout] No Connect account for artist ${booking.artistId}, payment goes to platform`);
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Verify payment after returning from Stripe checkout (webhook fallback)
    verifyPayment: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // If fully paid, nothing more to do
        if (booking.paymentStatus === 'fully_paid') {
          return { status: 'fully_paid', updated: false };
        }
        
        // Check Stripe for recent completed checkout sessions for this booking
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        
        try {
          const sessions = await stripe.checkout.sessions.list({
            limit: 10,
          });
          
          // Find ALL completed sessions for this booking (sorted newest first by Stripe)
          const bookingSessions = sessions.data.filter(
            (s) => s.metadata?.bookingId === input.bookingId.toString() && s.payment_status === 'paid'
          );
          
          if (bookingSessions.length === 0) {
            return { status: booking.paymentStatus || 'unpaid', updated: false };
          }
          
          // Check for final_payment session first (most recent sessions come first)
          const finalSession = bookingSessions.find(s => s.metadata?.paymentType === 'final_payment');
          const depositSession = bookingSessions.find(s => s.metadata?.paymentType === 'deposit');
          
          // If we have a final payment and booking is deposit_paid or has a deposit session, mark fully paid
          if (finalSession && (booking.paymentStatus === 'deposit_paid' || depositSession)) {
            await db.updateBookingPaymentStatus(
              input.bookingId, 
              'fully_paid', 
              finalSession.id, 
              'final_payment'
            );
            return { status: 'fully_paid', updated: true };
          }
          
          // If we have a deposit session and booking is unpaid, mark deposit paid
          if (depositSession && booking.paymentStatus === 'unpaid') {
            await db.updateBookingPaymentStatus(
              input.bookingId, 
              'deposit_paid', 
              depositSession.id, 
              'deposit'
            );
            
            // Store the deposit amount if not already set
            if (!booking.depositAmount) {
              const depositAmount = (depositSession.amount_total || 0) / 100;
              await db.updateBooking(input.bookingId, { depositAmount: depositAmount.toString() });
            }
            
            return { status: 'deposit_paid', updated: true };
          }
          
          // If we have a full payment (no type specified) and booking is unpaid
          const fullPaymentSession = bookingSessions.find(s => !s.metadata?.paymentType);
          if (fullPaymentSession && booking.paymentStatus === 'unpaid') {
            await db.updateBookingPaymentStatus(
              input.bookingId, 
              'fully_paid', 
              fullPaymentSession.id, 
              'full'
            );
            return { status: 'fully_paid', updated: true };
          }
          
          return { status: booking.paymentStatus || 'unpaid', updated: false };
        } catch (error) {
          console.error('[Payment Verify] Error checking Stripe sessions:', error);
          return { status: booking.paymentStatus || 'unpaid', updated: false };
        }
      }),
    
    // Get payment history
    getHistory: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        // Return empty payment history for now
        return [];
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
        
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          reason: 'requested_by_customer' as const,
          metadata: {
            bookingId: String(input.bookingId),
            reason: input.reason || '',
          },
        });
        
        // Record refund in database
        await db.updateBooking(input.bookingId, {
          stripeRefundId: refund.id,
          paymentStatus: 'refunded',
          status: 'cancelled',
        });
        
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
  
  // ===== VENUE ROUTER =====
  venue: venueRouter,

  
  emailChange: router({
    revertChange: publicProcedure.mutation(() => ({ success: false })),
  } as any),
  
  emailTesting: emailTestingRouter,
  
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email('Invalid email address'),
        name: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit by IP
        const clientIp = ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
          || ctx.req?.socket?.remoteAddress || 'unknown';
        const ipCheck = newsletterLimiter.check(`ip:${clientIp}`);
        if (!ipCheck.allowed) {
          const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Too many subscription attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
          });
        }
        // Rate limit by email
        const emailCheck = newsletterLimiter.check(`email:${input.email.toLowerCase()}`);
        if (!emailCheck.allowed) {
          const retryMinutes = Math.ceil(emailCheck.retryAfterMs / 60_000);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `This email has already been submitted recently. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
          });
        }
        try {
          const emailSent = await email.sendNewsletterSubscriptionEmail(input.email);
          if (!emailSent) {
            console.error('[Newsletter] Email sending failed for:', input.email);
            throw new Error('Email service failed');
          }
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
  
  admin: adminRouter,
  dispute: disputeRouter,
  merch: merchRouter,
  projectPreviews: projectPreviewsRouter,
  team: teamRouter,
  tip: tipRouter,
  fanClub: fanClubRouter,
});
export type AppRouter = typeof appRouter;
