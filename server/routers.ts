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

      return enriched;
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
        }).optional(),
        tipLinks: z.object({
          cashapp: z.string().optional(),
          venmo: z.string().optional(),
          paypal: z.string().optional(),
          zelle: z.string().optional(),
        }).optional(),
        profilePhotoUrl: z.string().optional(),
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
        plan: z.enum(['starter', 'professional']).optional().default('professional'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateStripeCustomer, createSubscriptionCheckoutSession } = await import('./stripe');
        
        // Get or create Stripe customer
        const customerId = await getOrCreateStripeCustomer({
          email: ctx.user.email || '',
          name: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
        });

        // Create checkout session for the selected plan
        const checkoutUrl = await createSubscriptionCheckoutSession({
          customerId,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          userId: ctx.user.id.toString(),
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          plan: input.plan,
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
        
        // Create Stripe checkout session
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = ctx.req.headers.origin || process.env.BASE_URL || '';
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: ctx.user.email || undefined,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Booking Deposit - ${booking.eventDetails || 'Event'}`,
                description: booking.eventDetails || 'Event booking deposit',
              },
              unit_amount: Math.round(depositAmount * 100),
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
        
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = ctx.req.headers.origin || process.env.BASE_URL || '';
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: ctx.user.email || undefined,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Remaining Balance - ${booking.eventDetails || 'Event'}`,               description: booking.eventDetails || 'Event booking payment',
              },
              unit_amount: Math.round(remainingAmount * 100),
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
          },
        });
        
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
});
export type AppRouter = typeof appRouter;
