import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { scheduleTimingSchema, scheduleDateSchema, scheduleTimezoneSchema, addCalendarDays } from "../shared/schedule";
import { scheduleRouter } from "./routers/schedule";
import { checkBookingScheduleRequest, confirmScheduledBooking, cancelScheduledBooking, setScheduledAvailability, deleteScheduledAvailability } from "./services/bookingScheduleService";
import { ensureScheduleSchema } from "./services/scheduleSchemaService";
import * as db from "./db";
import * as schema from "../drizzle/schema";
import { eq, gte, and } from "drizzle-orm";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import * as email from "./email";
import { sendVenueVerificationEmail, sendVenueVerificationConfirmationEmail } from "./email";
import * as emailService from "./services/emailService";
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription, stripe } from "./stripe";
import { updateSubscriptionStatus } from "./db";
import { trustedCheckoutOrigin } from './services/trustedOrigin';
import * as imageOptimization from "./imageOptimization";
import { handlePhotoUpload } from "./handlers/imageUploadHandler";
// ===== MVP ROUTERS ONLY =====
import { authRouter } from "./routers/auth";
import { emailPreferencesRouter } from "./routers/emailPreferences";
import { emailTestingRouter } from "./routers/emailTesting";
import { pricingRouter } from "./routers/pricing";
import { riderRouter } from "./routers/rider";
import { riderContractRouter } from "./routers/riderContract";
import { bookingRiderDocumentsRouter } from "./routers/bookingRiderDocuments";
import { riderDocumentsRouter } from "./routers/riderDocuments";
import { venueContractRouter } from "./routers/venueContract";
import { followsRouter } from "./routers/follows";
import { eventsRouter } from "./routers/events";
import { adminRouter } from "./routers/admin";
import { payoutRouter } from "./routers/payout";
import { venueRouter } from "./routers/venue";
import { notifyFansProfileUpdate } from "./services/fanNotificationService";
import { ensureVideoPortfolioSchema } from './services/videoPortfolioSchemaService';
import { parsePortfolioVideoUrl, PORTFOLIO_VIDEO_URL_HELP } from '../shared/videoPortfolio';
import { videoPortfolioManagementRouter } from './routers/videoPortfolioManagement';
import { TALENT_TYPE_VALUES } from '../shared/talentTypes';
import { artistUpdatesRouter } from "./routers/artistUpdates";
import { releaseRouter } from "./routers/release";
import { releaseOrderRouter } from "./routers/releaseOrder";
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
import { merchOrdersRouter } from "./routers/merchOrders";
import { projectPreviewsRouter } from "./routers/projectPreviews";
import { teamRouter } from "./routers/team";
import { tipRouter } from "./routers/tip";
import { promoteRouter } from "./routers/promote";
import { fanClubRouter } from "./routers/fanClub";
import { aiChatRouter } from "./routers/aiChat";
import { contractAnalyzerRouter } from "./routers/contractAnalyzer";
import { ologyLiveRouter } from "./routers/ologyLive";
import { ologyLivePhase2Router } from "./routers/ologyLivePhase2";
import { sandboxPostRouter } from "./routers/sandboxPost";
import { nilComplianceRouter } from "./routers/nilCompliance";
import { discoverySearchRouter } from "./routers/discoverySearch";
import { complimentaryAccessRouter } from './routers/complimentaryAccess';
import { newsletterLimiter } from "./utils/rateLimiter";
import * as notif from "./services/notificationService";
import { isPlatformOwner } from './services/platformOwnerAccess';


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

const artistProfileId = z.number().int().safe().positive();
const artistName = z.string().trim().min(1).max(200);
const artistShortText = z.string().trim().max(500);
const artistBio = z.string().trim().max(10_000);
const artistUrl = z.string().trim().max(2_048).refine((value) => value === '' || /^https?:\/\//i.test(value), 'URL must use HTTP(S)');
const artistOptionalUrl = artistUrl.optional().or(z.literal(''));
const artistRequiredUrl = z.string().trim().min(1).max(2_048).url().refine((value) => /^https?:\/\//i.test(value), 'URL must use HTTP(S)');
const artistGenres = z.array(z.string().trim().min(1).max(100)).max(20);
const artistFee = z.number().finite().min(0).max(10_000_000);
const artistPartySize = z.number().int().min(1).max(100);
const artistImageMime = z.string().trim().refine((value) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(value), 'Unsupported image format');
const artistVideoMime = z.string().trim().refine((value) => ['video/mp4', 'video/quicktime', 'video/webm'].includes(value), 'Unsupported video format');
const artistFileName = z.string().trim().min(1).max(255).regex(/^[^/\\]+$/, 'Invalid filename');
const artistBase64Data = z.string().min(1).max(700_000_000);
const artistSocialLinks = z.object({
  instagram: artistOptionalUrl,
  facebook: artistOptionalUrl,
  youtube: artistOptionalUrl,
  spotify: artistOptionalUrl,
  twitter: artistOptionalUrl,
  appleMusic: artistOptionalUrl,
  tidal: artistOptionalUrl,
  soundcloud: artistOptionalUrl,
  otherStreaming: artistOptionalUrl,
}).strict();
const artistTipLinks = z.object({
  cashapp: artistShortText.optional(),
  venmo: artistShortText.optional(),
  paypal: artistShortText.optional(),
  zelle: artistShortText.optional(),
}).strict();
const artistSearchInput = z.object({
  genre: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  location: z.string().trim().max(200).optional(),
  city: z.string().trim().max(200).optional(),
  state: z.string().trim().max(100).optional(),
  region: z.string().trim().max(200).optional(),
  minFee: z.number().finite().min(0).max(10_000_000).optional(),
  maxFee: z.number().finite().min(0).max(10_000_000).optional(),
  availableFrom: scheduleDateSchema.optional(),
  availableTo: scheduleDateSchema.optional(),
  availableDate: scheduleDateSchema.optional(),
  verifiedOnly: z.boolean().optional(),
}).strict().superRefine((input, refinement) => {
  if (input.minFee !== undefined && input.maxFee !== undefined && input.minFee > input.maxFee) {
    refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['maxFee'], message: 'Maximum fee must be at least the minimum fee' });
  }
  if (input.availableFrom && input.availableTo && input.availableFrom > input.availableTo) {
    refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['availableTo'], message: 'Available-to date must not be before available-from date' });
  }
});
const artistStats = z.array(z.object({
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().max(200),
}).strict()).max(8);
const artistAchievements = z.array(z.object({
  title: z.string().trim().min(1).max(200),
  year: z.string().trim().max(20).optional(),
  description: z.string().trim().max(1_000).optional(),
}).strict()).max(20);
const artistNilDeals = z.array(z.object({
  brand: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1_000).optional(),
  logoUrl: artistOptionalUrl,
  active: z.boolean().optional(),
}).strict()).max(20);
const portfolioVideoCategory = z.enum(['highlights', 'training', 'game_day', 'behind_the_scenes', 'live_performance', 'studio', 'music_video', 'other']);
const portfolioVideoDuration = z.number().finite().min(0).max(300).optional();
const portfolioSortOrder = z.number().int().min(0).max(99).optional();

function decodeArtistBase64(fileData: string, mimeType: string, maxBytes: number): Buffer {
  const dataUrl = fileData.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (dataUrl && dataUrl[1].toLowerCase() !== mimeType.toLowerCase()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'File MIME type does not match the data URL.' });
  }
  const base64 = (dataUrl ? dataUrl[2] : fileData).replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid base64 file data.' });
  }
  const decodedSize = Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (decodedSize < 1 || decodedSize > maxBytes) {
    throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: `File must be no larger than ${Math.floor(maxBytes / (1024 * 1024))} MB.` });
  }
  return Buffer.from(base64, 'base64');
}

const videoExtensionByMime: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};
const bookingDate = z.string().trim().min(10).max(64).refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid event date');
const bookingEventTime = z.string().trim().max(32).optional();
const bookingMoney = z.number().finite().min(0).max(100_000_000);
const bookingName = z.string().trim().min(1).max(255);
const bookingText = z.string().trim().max(10_000).optional();
const bookingAddress = z.string().trim().max(1_000).optional();
const bookingPhone = z.string().trim().max(50).optional();
const bookingEmail = z.string().trim().toLowerCase().email().max(320);
const reviewRating = z.number().int().min(1).max(5);
const reviewTitle = z.string().trim().min(1).max(200);
const reviewBody = z.string().trim().max(2_000).optional();
const reviewResponse = z.string().trim().min(1).max(2_000);
const subscriptionReturnUrl = z.string().trim().max(2_048).url().refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'Return URL must use HTTP(S)');
const favoriteArtistId = z.number().int().safe().positive();
const bookingIdInput = z.number().int().safe().positive();
const bookingTemplateId = z.number().int().safe().positive();
const bookingTemplateName = z.string().trim().min(1).max(255);
const bookingTemplateText = z.string().trim().max(10_000).optional();
const bookingTemplateMoney = z.number().finite().min(0).max(100_000_000).optional();
const bookingCalendarRange = z.object({
  startDate: scheduleDateSchema,
  endDate: scheduleDateSchema,
}).strict().refine(({ startDate, endDate }) => startDate <= endDate, 'End date must not be before start date');
const legacyRiderTemplateId = z.number().int().safe().positive();
const legacyRiderTemplateName = z.string().trim().min(1).max(200);
const legacyRiderTemplateData = z.record(z.string().trim().min(1).max(100), z.unknown()).superRefine((value, refinement) => {
  if (Object.keys(value).length > 100) {
    refinement.addIssue({ code: z.ZodIssueCode.custom, message: 'Template data has too many fields' });
  }
  try {
    if (JSON.stringify(value).length > 500_000) {
      refinement.addIssue({ code: z.ZodIssueCode.custom, message: 'Template data is too large' });
    }
  } catch {
    refinement.addIssue({ code: z.ZodIssueCode.custom, message: 'Template data is invalid' });
  }
});

async function isBookingParty(user: { id: number; role: string }, booking: { venueId: number; artistId: number; bookingSource?: string | null }): Promise<boolean> {
  if (user.role === 'admin') return true;
  const venueProfile = await db.getVenueProfileByUserId(user.id);
  const artistProfile = await db.getArtistProfileByUserId(user.id);
  return Boolean(
    (venueProfile && booking.venueId === venueProfile.id)
    || (artistProfile && booking.artistId === artistProfile.id)
    || (booking.bookingSource === 'client_booking' && booking.venueId === user.id)
  );
}

function toPublicReview(review: any) {
  if (!review) return null;
  return {
    id: review.id,
    artistId: review.artistId,
    venueId: review.venueId,
    rating: review.rating,
    comment: review.comment,
    reviewText: review.reviewText ?? review.comment,
    professionalismRating: review.professionalismRating,
    soundQualityRating: review.soundQualityRating,
    greenRoomRating: review.greenRoomRating,
    paymentTimelinessRating: review.paymentTimelinessRating,
    reliabilityRating: review.reliabilityRating,
    stagePresenceRating: review.stagePresenceRating,
    crowdEngagementRating: review.crowdEngagementRating,
    artistResponse: review.artistResponse,
    venueResponse: review.venueResponse,
    respondedAt: review.respondedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

// Complimentary owner access is an entitlement, never a paid Stripe subscription.
const paidSubscriptionProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const subscription = await db.getSubscriptionByUserId(ctx.user.id);
  if (subscription?.isComplimentary) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: subscription.accessSource === 'platform_owner'
        ? 'Your complimentary Enterprise owner access needs no paid subscription. Existing billing records are unchanged.'
        : 'Your complimentary plan access needs no paid subscription while the grant is active. Existing billing records are unchanged.',
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // Debug endpoint for testing input parsing
  debug: router({
    testPublicInput: adminProcedure
      .input(z.object({ id: z.number().int().safe().positive() }).strict())
      .query(async ({ input }) => {
        return { received: input, type: typeof input };
      }),
    testProtectedInput: adminProcedure
      .input(z.object({ id: z.number().int().safe().positive() }).strict())
      .query(async ({ input }) => {
        return { received: input, type: typeof input };
      }),
    testDatabase: adminProcedure.query(async () => {
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
  schedule: scheduleRouter,
  pricing: pricingRouter,
  rider: riderRouter,
  bookingRiderDocuments: bookingRiderDocumentsRouter,
  riderDocuments: riderDocumentsRouter,
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
  merch: merchRouter,
  merchOrders: merchOrdersRouter,
  sandboxPost: sandboxPostRouter,
  nilCompliance: nilComplianceRouter,
  discoverySearch: discoverySearchRouter,
  complimentaryAccess: complimentaryAccessRouter,
  releaseOrder: releaseOrderRouter,
  videoPortfolioManagement: videoPortfolioManagementRouter,

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
  contentRelease: releasesRouter,
  blog: blogRouter,
  stripeConnect: stripeConnectRouter,
  contact: contactRouter,
  auth: router({
    setUserRole: adminProcedure.input(z.object({ userId: z.number().int().safe().positive(), role: z.enum(['artist', 'venue']) }).strict()).mutation(async ({ input }) => {
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
        // Return only the account fields the client needs; never expose password,
        // email-verification, or provider-specific credential identifiers.
        const { passwordHash, id, openId, name, email, loginMethod, role, emailVerified, oauthProvider, avatarUrl, customAvatarUrl, createdAt, updatedAt, lastSignedIn } = userData as any;
        // Keep the visible admin flag aligned with the server-side owner policy.
        // This preserves owner access on deployments where OWNER_EMAIL is not set,
        // while ordinary artist accounts remain non-admin.
        const isAdmin = role === 'admin' || isPlatformOwner({ id, openId, email });
        return { id, openId, name, email, loginMethod, role, emailVerified, oauthProvider, avatarUrl, customAvatarUrl, createdAt, updatedAt, lastSignedIn, hasPassword: !!passwordHash, isAdmin: !!isAdmin };
      } catch (error) {
        console.error('[Auth.me] Error');
        const { passwordHash, id, openId, name, email, loginMethod, role, emailVerified, oauthProvider, avatarUrl, customAvatarUrl, createdAt, updatedAt, lastSignedIn } = opts.ctx.user as any;
        return { id, openId, name, email, loginMethod, role, emailVerified, oauthProvider, avatarUrl, customAvatarUrl, createdAt, updatedAt, lastSignedIn, hasPassword: !!passwordHash, isAdmin: false };
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
      .input(z.object({ id: artistProfileId }).strict())
      .query(async ({ input }) => {
        return (await db.getArtistProfileById(input.id)) ?? null;
      }),
    
    getProfileBySlug: publicProcedure
      .input(z.object({ slug: z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Invalid artist slug') }).strict())
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database) return null;
        const { artistProfiles } = await import('../drizzle/schema');
        const allArtists = await database
          .select({ id: artistProfiles.id, artistName: artistProfiles.artistName })
          .from(artistProfiles);
        const slug = input.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const found = allArtists.find(a => {
          const aSlug = a.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return aSlug === slug;
        });
        if (!found) return null;
        return (await db.getArtistProfileById(found.id)) ?? null;
      }),
    
       // Upload and set profile photo
    uploadProfilePhoto: artistProcedure
      .input(z.object({
        fileData: artistBase64Data,
        fileName: artistFileName,
        mimeType: artistImageMime,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const { url } = await handlePhotoUpload(input, ctx.user.id, 'artist-profile-photos');
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
        artistName: artistName.optional(),
        talentType: z.enum(TALENT_TYPE_VALUES).optional(),
        bio: artistBio.optional(),
        genre: artistGenres.optional(),
        location: artistShortText.optional(),
        city: artistShortText.optional(),
        state: artistShortText.optional(),
        country: artistShortText.optional(),
        feeRangeMin: artistFee.optional(),
        feeRangeMax: artistFee.optional(),
        touringPartySize: artistPartySize.optional(),
        sportCategory: artistShortText.nullable().optional(),
        sportPosition: artistShortText.nullable().optional(),
        sportTeam: artistShortText.nullable().optional(),
        athleteStats: artistStats.nullable().optional(),
        athleteAchievements: artistAchievements.nullable().optional(),
        nilDeals: artistNilDeals.nullable().optional(),
        websiteUrl: artistOptionalUrl.nullable().optional(),
        socialLinks: artistSocialLinks.optional(),
        tipLinks: artistTipLinks.optional(),
        profilePhotoUrl: artistOptionalUrl,
        crmSupporter: z.boolean().optional(),
      }).strict().superRefine((input, ctx) => {
        if (input.feeRangeMin !== undefined && input.feeRangeMax !== undefined && input.feeRangeMin > input.feeRangeMax) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['feeRangeMax'], message: 'Maximum fee must be at least the minimum fee' });
        }
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        await db.updateArtistProfile(profile.id, input);

        // Notify fans about profile update (fire-and-forget)
        const updateSummary = input.bio ? 'Updated their bio and profile info' 
          : input.genre ? 'Updated their creative specialties'
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
        fileData: artistBase64Data, // base64 encoded image
        fileName: artistFileName,
        mimeType: artistImageMime,
      }).strict())
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
        artistName,
        talentType: z.enum(TALENT_TYPE_VALUES).optional(),
        sportCategory: artistShortText.optional(),
        sportPosition: artistShortText.optional(),
        sportTeam: artistShortText.optional(),
        athleteStats: artistStats.optional(),
        athleteAchievements: artistAchievements.optional(),
        nilDeals: artistNilDeals.optional(),
        location: artistShortText.optional(),
        city: artistShortText.optional(),
        state: artistShortText.optional(),
        country: artistShortText.optional(),
        bio: artistBio.optional(),
        genre: artistGenres.optional(),
        feeRangeMin: artistFee.optional(),
        feeRangeMax: artistFee.optional(),
        touringPartySize: artistPartySize,
        websiteUrl: artistOptionalUrl,
        profilePhotoUrl: artistOptionalUrl,
        socialLinks: artistSocialLinks.optional(),
      }).strict().superRefine((input, ctx) => {
        if (input.feeRangeMin !== undefined && input.feeRangeMax !== undefined && input.feeRangeMin > input.feeRangeMax) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['feeRangeMax'], message: 'Maximum fee must be at least the minimum fee' });
        }
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
        artistName,
        bio: artistBio.optional(),
        genre: artistGenres.optional(),
        location: artistShortText.optional(),
        feeRangeMin: artistFee.optional(),
        feeRangeMax: artistFee.optional(),
        socialLinks: artistSocialLinks.optional(),
        profilePhotoUrl: artistOptionalUrl,
      }).strict().superRefine((input, ctx) => {
        if (input.feeRangeMin !== undefined && input.feeRangeMax !== undefined && input.feeRangeMin > input.feeRangeMax) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['feeRangeMax'], message: 'Maximum fee must be at least the minimum fee' });
        }
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
        fileName: artistFileName,
        fileData: artistBase64Data, // base64
        fileType: artistImageMime,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const buffer = decodeArtistBase64(input.fileData, input.fileType, 10 * 1024 * 1024);
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `artists/${ctx.user.id}/${Date.now()}-${randomSuffix}.${input.fileType.split('/')[1]}`;
        
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        return { url };
      }),
    
    // Search artists
    search: publicProcedure
      .input(artistSearchInput.optional().default({}))
      .query(async ({ input }) => {
        return await db.searchArtists(input || {});
      }),
    
    // Get distinct cities for autocomplete suggestions
    getCities: publicProcedure.query(async () => {
      const artists = await db.getAllArtists();
      const citySet = new Set<string>();
      for (const artist of artists) {
        if ((artist as any).city && (artist as any).city.trim()) {
          citySet.add((artist as any).city.trim());
        }
      }
      return Array.from(citySet).sort();
    }),

    // Get all artists
    getAll: publicProcedure.query(async () => {
      return await db.getAllArtists();
    }),
    
    // Add photo to gallery
    addGalleryPhoto: artistProcedure
      .input(z.object({
        fileData: artistBase64Data, // base64 encoded image
        fileName: artistFileName,
        mimeType: artistImageMime,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const buffer = decodeArtistBase64(input.fileData, input.mimeType, 10 * 1024 * 1024);
        
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
        photoUrl: artistUrl,
      }).strict())
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
        fileName: artistFileName,
        mimeType: artistVideoMime,
        fileSizeBytes: z.number().int().safe().min(1).max(500 * 1024 * 1024, 'Video file must be under 500MB'),
        durationSeconds: z.number().finite().min(0).max(300, 'Video must be 5 minutes or less'),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }

        // Check subscription tier from user_subscriptions table
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        const tier = subscription?.tier || 'free';
        if (tier !== 'professional' && tier !== 'starter' && tier !== 'enterprise') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Performance video upload requires a Starter or Professional subscription' });
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
        if (!allowedTypes.includes(input.mimeType)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only MP4, MOV, and WebM videos are allowed' });
        }

        const timestamp = Date.now();
        const ext = videoExtensionByMime[input.mimeType];
        const fileKey = `performance-videos/${ctx.user.id}/${timestamp}.${ext}`;

        return { fileKey, mimeType: input.mimeType, durationSeconds: input.durationSeconds };
      }),

    // Step 2: Upload the video file via server proxy to S3 (avoids base64, streams the file)
    uploadPerformanceVideo: artistProcedure
      .input(z.object({
        fileKey: z.string().trim().min(1).max(255).regex(/^performance-videos\/\d+\/\d+\.(?:mp4|mov|webm)$/),
        mimeType: artistVideoMime,
        durationSeconds: z.number().finite().min(0).max(300, 'Video must be 5 minutes or less'),
        fileData: artistBase64Data, // base64 encoded — kept as fallback for smaller files
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        if (!input.fileKey.startsWith(`performance-videos/${ctx.user.id}/`)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Upload key does not belong to this artist' });
        }

        // Upload to S3 via storage helper
        const buffer = decodeArtistBase64(input.fileData, input.mimeType, 500 * 1024 * 1024);
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

    // Add or replace the main Performance Video with a supported hosted URL.
    setPerformanceVideoByUrl: artistProcedure
      .input(z.object({ videoUrl: artistRequiredUrl }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        const tier = subscription?.tier || 'free';
        if (!['starter', 'professional', 'enterprise'].includes(tier)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Performance Video requires a Starter, Professional, or Enterprise subscription',
          });
        }
        const source = parsePortfolioVideoUrl(input.videoUrl);
        if (!source) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: PORTFOLIO_VIDEO_URL_HELP });
        }
        await db.updateArtistProfile(profile.id, {
          performanceVideoUrl: source.normalizedUrl,
          performanceVideoThumbnail: source.thumbnailUrl,
          performanceVideoStatus: 'approved',
          performanceVideoDuration: null,
          performanceVideoUploadedAt: new Date(),
          performanceVideoFlagCount: 0,
        } as any);
        return { success: true, url: source.normalizedUrl, kind: source.kind, status: 'approved' };
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
        artistProfileId,
        reason: z.enum(['inappropriate', 'copyright', 'spam', 'other']),
        details: z.string().trim().max(2_000).optional(),
      }).strict())
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
      .input(z.object({ artistProfileId }).strict())
      .query(async ({ ctx, input }) => {
        return await db.hasUserFlaggedVideo(input.artistProfileId, ctx.user.id);
      }),

    // === VIDEO PORTFOLIO (multi-video, up to 10 clips) ===
    getVideoPortfolio: publicProcedure
      .input(z.object({ artistProfileId }).strict())
      .query(async ({ input }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) return [];
        await ensureVideoPortfolioSchema(pool as any);
        const [rows] = await pool.execute(
          'SELECT * FROM video_portfolio WHERE artistProfileId = ? AND status = ? ORDER BY sortOrder ASC, createdAt DESC, id DESC',
          [input.artistProfileId, 'active']
        );
        return (rows as any[]) || [];
      }),

    getPortfolioVideo: publicProcedure
      .input(z.object({ videoId: artistProfileId }).strict())
      .query(async ({ input }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) return null;
        await ensureVideoPortfolioSchema(pool as any);
        const [rows] = await pool.execute(
          `SELECT vp.id, vp.artistProfileId, vp.title, vp.videoUrl, vp.thumbnailUrl,
                  vp.category, vp.duration, vp.createdAt, ap.artistName, ap.bio
           FROM video_portfolio vp
           INNER JOIN artist_profiles ap ON ap.id = vp.artistProfileId
           WHERE vp.id = ? AND vp.status = ?
           LIMIT 1`,
          [input.videoId, 'active'],
        );
        const video = (rows as any[])[0];
        if (!video) return null;
        const source = parsePortfolioVideoUrl(video.videoUrl);
        return {
          ...video,
          kind: source?.kind || 'direct',
          embedUrl: source?.embedUrl || null,
        };
      }),

    getMyVideoPortfolio: artistProcedure
      .input(z.object({ ownerAccountId: z.number().int().safe().positive() }).strict().optional())
      .query(async ({ ctx, input }) => {
        if (input && input.ownerAccountId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Video portfolio account does not match this session.' });
        }
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) return [];
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) return [];
        await ensureVideoPortfolioSchema(pool as any);
        const [rows] = await pool.execute(
          'SELECT * FROM video_portfolio WHERE artistProfileId = ? AND status != ? ORDER BY sortOrder ASC, createdAt DESC, id DESC',
          [profile.id, 'removed']
        );
        return (rows as any[]) || [];
      }),

    addPortfolioVideo: artistProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(255),
        videoUrl: artistRequiredUrl,
        thumbnailUrl: artistOptionalUrl,
        category: portfolioVideoCategory,
        duration: portfolioVideoDuration,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await ensureVideoPortfolioSchema(pool as any);
        const source = parsePortfolioVideoUrl(input.videoUrl);
        if (!source) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: PORTFOLIO_VIDEO_URL_HELP });
        }
        // Check limit (max 10)
        const [existing] = await pool.execute(
          'SELECT COUNT(*) as cnt FROM video_portfolio WHERE artistProfileId = ? AND status = ?',
          [profile.id, 'active']
        );
        const count = (existing as any[])[0]?.cnt || 0;
        if (count >= 10) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Maximum 10 videos allowed in your portfolio. Remove one to add another.' });
        }
        const [result] = await pool.execute(
          'INSERT INTO video_portfolio (artistProfileId, title, videoUrl, thumbnailUrl, category, duration, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [profile.id, input.title, source.normalizedUrl, input.thumbnailUrl || source.thumbnailUrl, input.category, input.duration || null, count]
        );
        return { success: true, id: (result as any).insertId };
      }),

    updatePortfolioVideo: artistProcedure
      .input(z.object({
        id: artistProfileId,
        title: z.string().trim().min(1).max(255).optional(),
        category: portfolioVideoCategory.optional(),
        sortOrder: portfolioSortOrder,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await ensureVideoPortfolioSchema(pool as any);
        // Verify ownership
        const [rows] = await pool.execute(
          'SELECT id FROM video_portfolio WHERE id = ? AND artistProfileId = ?',
          [input.id, profile.id]
        );
        if (!(rows as any[]).length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
        }
        const updates: string[] = [];
        const values: any[] = [];
        if (input.title) { updates.push('title = ?'); values.push(input.title); }
        if (input.category) { updates.push('category = ?'); values.push(input.category); }
        if (input.sortOrder !== undefined) { updates.push('sortOrder = ?'); values.push(input.sortOrder); }
        if (updates.length > 0) {
          values.push(input.id);
          await pool.execute(`UPDATE video_portfolio SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        return { success: true };
      }),

    removePortfolioVideo: artistProcedure
      .input(z.object({ id: artistProfileId }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await ensureVideoPortfolioSchema(pool as any);
        // Verify ownership
        const [rows] = await pool.execute(
          'SELECT id FROM video_portfolio WHERE id = ? AND artistProfileId = ?',
          [input.id, profile.id]
        );
        if (!(rows as any[]).length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video not found' });
        }
        await pool.execute('UPDATE video_portfolio SET status = ? WHERE id = ?', ['removed', input.id]);
        return { success: true };
      }),

    uploadPortfolioVideo: artistProcedure
      .input(z.object({
        title: z.string().trim().min(1).max(255),
        category: portfolioVideoCategory,
        fileName: artistFileName,
        mimeType: artistVideoMime,
        fileData: artistBase64Data, // base64
        duration: portfolioVideoDuration,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const { getPool } = await import('./db');
        const pool = getPool();
        if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await ensureVideoPortfolioSchema(pool as any);
        // Check limit
        const [existing] = await pool.execute(
          'SELECT COUNT(*) as cnt FROM video_portfolio WHERE artistProfileId = ? AND status = ?',
          [profile.id, 'active']
        );
        const count = (existing as any[])[0]?.cnt || 0;
        if (count >= 10) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Maximum 10 videos allowed. Remove one to add another.' });
        }
        // Validate file type
        const extension = videoExtensionByMime[input.mimeType];
        // Upload to S3
        const timestamp = Date.now();
        const fileKey = `video-portfolio/${ctx.user.id}/${timestamp}.${extension}`;
        const buffer = decodeArtistBase64(input.fileData, input.mimeType, 500 * 1024 * 1024);
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        // Insert into DB
        const [result] = await pool.execute(
          'INSERT INTO video_portfolio (artistProfileId, title, videoUrl, category, duration, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
          [profile.id, input.title, url, input.category, input.duration || null, count]
        );
        return { success: true, id: (result as any).insertId, url };
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
        artistId: artistProfileId,
        startDate: scheduleDateSchema.optional(),
        endDate: scheduleDateSchema.optional(),
      }).strict().superRefine((input, ctx) => {
        if (input.startDate && input.endDate && input.endDate < input.startDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date' });
        }
      }))
      .query(async ({ input }) => {
        return await db.getAvailabilityByArtistId(input.artistId);
      }),
    
    // Set availability (artist only)
    set: artistProcedure
      .input(z.object({
        date: scheduleDateSchema,
        timezone: scheduleTimezoneSchema.default("UTC"),
        status: z.enum(['available', 'booked', 'unavailable']),
        notes: z.string().trim().max(2_000).optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        // Date is stored as YYYY-MM-DD string in database
        const dateStr = input.date; // Already in YYYY-MM-DD format
        await setScheduledAvailability(ctx.user.id, profile.id, [dateStr], input.status, input.timezone);
        
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
      .input(z.object({ id: z.number().int().safe().positive() }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({code:'NOT_FOUND',message:'Artist profile not found'});
        await deleteScheduledAvailability(ctx.user.id, profile.id, [input.id]);
        return { success: true };
      }),

    // Set availability for a date range (artist only)
    setRange: artistProcedure
      .input(z.object({
        fromDate: scheduleDateSchema,
        toDate: scheduleDateSchema,
        status: z.enum(['available', 'booked', 'unavailable']),
        timezone: scheduleTimezoneSchema.default('UTC'),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        const dates: string[] = [];
        if (input.toDate < input.fromDate) throw new TRPCError({code:'BAD_REQUEST',message:'End date must be after start date'});
        for (let date = input.fromDate; date <= input.toDate; date = addCalendarDays(date, 1)) {
          dates.push(date);
          if (dates.length > 91) throw new TRPCError({code:'BAD_REQUEST',message:'Date range cannot exceed 90 days'});
        }
        await setScheduledAvailability(ctx.user.id, profile.id, dates, input.status, input.timezone);
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
        fromDate: scheduleDateSchema,
        toDate: scheduleDateSchema,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        // Get all availability entries for this artist in the date range
        const allAvailability = await db.getAvailabilityByArtistId(profile.id);
        if(input.toDate < input.fromDate || input.toDate > addCalendarDays(input.fromDate,90)) throw new TRPCError({code:'BAD_REQUEST',message:'Choose a valid range of at most 90 days.'});
        const entries = allAvailability.filter(entry => typeof entry.date === 'string' && entry.date >= input.fromDate && entry.date <= input.toDate);
        await deleteScheduledAvailability(ctx.user.id, profile.id, entries.map(entry => entry.id));
        const deletedCount = entries.length;
        return { success: true, datesRemoved: deletedCount };
      }),
  }),

  // Booking Management
  booking: router({
    // Create booking request (venue)
    create: venueProcedure
      .input(z.object({
        artistId: artistProfileId,
        eventDate: bookingDate,
        eventTime: bookingEventTime,
        schedule: scheduleTimingSchema.optional(),
        venueName: bookingName,
        venueAddress: bookingAddress,
        eventDetails: bookingText,
        totalFee: bookingMoney.optional(),
        depositAmount: bookingMoney.optional(),
        riderTemplateId: artistProfileId.optional(),
        // Door-split payment terms
        paymentTermsType: z.enum(['flat_guarantee', 'door_split', 'guarantee_vs_percentage']).optional(),
        doorSplitArtistPercent: z.number().finite().min(0).max(100).optional(),
        guaranteeAmount: bookingMoney.optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        await ensureScheduleSchema();
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }
        
        // Tier enforcement: check booking limit for free users
        const subscription = await db.getSubscriptionByUserId(ctx.user.id);
        const userTier = subscription?.tier || 'free';
        if (userTier === 'free') {
          const database = await db.getDb();
          if (database) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthlyBookings = await database.select().from(schema.bookings)
              .where(and(eq(schema.bookings.venueId, venueProfile.id), gte(schema.bookings.createdAt, startOfMonth)));
            if (monthlyBookings.length >= 2) {
              throw new TRPCError({ code: 'FORBIDDEN', message: 'Free plan is limited to 2 booking requests per month. Upgrade to Starter for unlimited bookings.' });
            }
          }
        }
        
        const scheduleFields = await checkBookingScheduleRequest({ artistId: input.artistId, venueId: venueProfile.id, eventDate: input.eventDate, schedule: input.schedule });
        
        const booking = await db.createBooking({
          ...scheduleFields,
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
            bookingId: booking.id,
            eventDate: new Date(input.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          }).catch(() => {});
        }
        
        return { success: true, bookingId: booking.id };
      }),
    
    // Create booking request (client/fan - anyone logged in)
    clientCreate: protectedProcedure
      .input(z.object({
        artistId: artistProfileId,
        eventDate: bookingDate,
        eventTime: bookingEventTime,
        schedule: scheduleTimingSchema.optional(),
        eventType: z.enum(['wedding', 'corporate', 'birthday', 'church', 'festival', 'house_party', 'restaurant', 'other']),
        venueName: bookingName,
        venueAddress: bookingAddress,
        eventDetails: bookingText,
        totalFee: bookingMoney.optional(),
        clientName: bookingName,
        clientEmail: bookingEmail,
        clientPhone: bookingPhone,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        await ensureScheduleSchema();
        const scheduleFields = await checkBookingScheduleRequest({ artistId: input.artistId, venueId: ctx.user.id, bookingSource: 'client_booking', eventDate: input.eventDate, schedule: input.schedule });
        
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
          ...scheduleFields,
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
        venueId: artistProfileId,
        eventName: bookingName,
        eventDate: bookingDate,
        eventTime: bookingEventTime,
        schedule: scheduleTimingSchema.optional(),
        message: bookingText,
        paymentTermsType: z.enum(['flat_guarantee', 'door_split', 'guarantee_vs_percentage']).optional(),
        proposedFee: bookingMoney.optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        await ensureScheduleSchema();
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

        const scheduleFields = await checkBookingScheduleRequest({ artistId: artistProfile.id, venueId: venueProfile.id, bookingSource: 'artist_request', eventDate: input.eventDate, schedule: input.schedule });

        // Create a booking for this performance request
        const booking = await db.createBooking({
          ...scheduleFields,
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
      .input(z.object({ id: z.number().int().safe().positive() }).strict())
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
        } else if (booking.bookingSource === 'client_booking' && booking.venueId === ctx.user.id) {
          bookingRole = 'venue';
        } else if (ctx.user.role === 'admin') {
          bookingRole = 'venue'; // Admins can act as venue for contract management
        }

        if (bookingRole === 'viewer') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking' });
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
        id: z.number().int().safe().positive(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Ownership check: verify the booking belongs to this artist
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile || booking.artistId !== artistProfile.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this booking' });
        }
        
        // Acceptance reserves only the actual interval; legacy untimed requests still reserve the whole day.
        if (input.status === 'confirmed') {
          const result = await confirmScheduledBooking(input.id, ctx.user.id, 'artist');
          if (!result.changed) return { success: true };
        } else if (input.status === 'cancelled') {
          const result = await cancelScheduledBooking(input.id, ctx.user.id, 'artist');
          if (!result.changed) return { success: true };
        } else {
          if (booking.status === 'cancelled' || booking.status === 'completed' || input.status === 'pending') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking cannot be moved back to a tentative state.' });
          }
          await db.updateBooking(input.id, { status: input.status });
        }

        // Send email notifications based on status change
        const bookingArtistProfile = await db.getArtistProfileById(booking.artistId);
        const bookingVenueProfile = await db.getVenueProfileById(booking.venueId);
        
        if (bookingArtistProfile && bookingVenueProfile) {
          const artistUser = await db.getUserById(bookingArtistProfile.userId);
          const venueUser = await db.getUserById(bookingVenueProfile.userId);
          const eventDateStr = booking.eventDate instanceof Date 
            ? booking.eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          
          if (input.status === 'confirmed') {
            // In-app notifications for confirmation
            if (bookingArtistProfile.userId) {
              notif.notifyBookingConfirmed({ recipientUserId: bookingArtistProfile.userId, otherPartyName: bookingVenueProfile.organizationName, bookingId: booking.id }).catch(() => {});
            }
            if (bookingVenueProfile.userId) {
              notif.notifyBookingConfirmed({ recipientUserId: bookingVenueProfile.userId, otherPartyName: bookingArtistProfile.artistName, bookingId: booking.id }).catch(() => {});
            }
            // Send confirmation emails using new email service with preference checking
            if (artistUser?.email && bookingArtistProfile.userId) {
              await emailService.sendBookingConfirmationEmail(
                bookingArtistProfile.userId,
                artistUser.email,
                {
                  artistName: bookingArtistProfile.artistName,
                  venueName: bookingVenueProfile.organizationName,
                  eventDate: eventDateStr,
                  eventTime: booking.eventTime || 'TBD',
                  eventLocation: bookingVenueProfile.location || 'TBD',
                  bookingId: booking.id,
                }
              );
            }
            if (venueUser?.email && bookingVenueProfile.userId) {
              await emailService.sendBookingConfirmationEmail(
                bookingVenueProfile.userId,
                venueUser.email,
                {
                  artistName: bookingArtistProfile.artistName,
                  venueName: bookingVenueProfile.organizationName,
                  eventDate: eventDateStr,
                  eventTime: booking.eventTime || 'TBD',
                  eventLocation: bookingVenueProfile.location || 'TBD',
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
                venueName: bookingVenueProfile.organizationName,
                artistName: bookingArtistProfile.artistName,
                eventDate: booking.eventDate instanceof Date ? booking.eventDate.toISOString() : booking.eventDate,
                bookingId: booking.id,
                paymentTermsType,
                doorSplitArtistPercent: (booking as any).doorSplitArtistPercent,
                guaranteeAmount: (booking as any).guaranteeAmount,
              }).catch((err) => console.error('[Email] Settlement reminder failed:', err));
            }
          } else if (input.status === 'cancelled') {
            // In-app notifications for cancellation
            if (bookingArtistProfile.userId) {
              notif.notifyBookingCancelled({ recipientUserId: bookingArtistProfile.userId, otherPartyName: bookingVenueProfile.organizationName, bookingId: booking.id, cancelledBy: 'Artist' }).catch(() => {});
            }
            if (bookingVenueProfile.userId) {
              notif.notifyBookingCancelled({ recipientUserId: bookingVenueProfile.userId, otherPartyName: bookingArtistProfile.artistName, bookingId: booking.id, cancelledBy: 'Artist' }).catch(() => {});
            }
            // Send cancellation emails to both parties
            if (artistUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: artistUser.email,
                recipientName: bookingArtistProfile.artistName,
                otherPartyName: bookingVenueProfile.organizationName,
                eventDate: eventDateStr,
              });
            }
            if (venueUser?.email) {
              await email.sendBookingCancellationEmail({
                recipientEmail: venueUser.email,
                recipientName: bookingVenueProfile.organizationName,
                otherPartyName: bookingArtistProfile.artistName,
                eventDate: eventDateStr,
              });
            }
          }
        }
        
        return { success: true };
      }),

    // Artist counter offer on a booking
    counterOffer: artistProcedure
      .input(z.object({
        bookingId: z.number().int().safe().positive(),
        counterAmount: bookingMoney,
        message: z.string().trim().max(500).optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        if (booking.artistId !== profile.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your booking' });
        await db.updateBooking(input.bookingId, {
          counterOfferAmount: String(input.counterAmount),
          counterOfferMessage: input.message || null,
          counterOfferAt: new Date(),
          counterOfferBy: 'artist',
        } as any);
        return { success: true };
      }),

    // Venue respond to booking (accept/decline)
    venueRespond: venueProcedure
      .input(z.object({
        id: z.number().int().safe().positive(),
        status: z.enum(['confirmed', 'cancelled']),
      }).strict())
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
        
        if (booking.bookingSource === 'client_booking') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This request does not belong to this venue profile.' });
        }
        const transition = input.status === 'confirmed'
          ? await confirmScheduledBooking(input.id, ctx.user.id, 'venue')
          : await cancelScheduledBooking(input.id, ctx.user.id, 'venue');
        if (!transition.changed) return { success: true };

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
      .input(z.object({ artistId: artistProfileId }).strict())
      .mutation(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        await db.saveArtist(venueProfile.id, input.artistId);
        return { success: true };
      }),

    unsaveArtist: venueProcedure
      .input(z.object({ artistId: artistProfileId }).strict())
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
      .input(z.object({ artistId: artistProfileId }).strict())
      .query(async ({ ctx, input }) => {
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) return { saved: false };
        const isSaved = await db.isArtistSaved(venueProfile.id, input.artistId);
        return { saved: isSaved };
      }),

    // Post-show settlement — venue enters door revenue and calculates artist payout
    settleBooking: venueProcedure
      .input(z.object({
        bookingId: z.number().int().safe().positive(),
        doorRevenue: bookingMoney,
        attendance: z.number().int().min(0).max(1_000_000).optional(),
        settlementNotes: z.string().trim().max(2_000).optional(),
      }).strict())
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
        bookingId: z.number().int().safe().positive(),
        depositAmount: z.number().finite().positive().max(1_000_000),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        // Verify user is either the venue or artist
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        
        const isBookingParty = ctx.user.role === 'admin'
          || Boolean(venueProfile && booking.venueId === venueProfile.id)
          || Boolean(artistProfile && booking.artistId === artistProfile.id)
          || (booking.bookingSource === 'client_booking' && booking.venueId === ctx.user.id);
        if (!isBookingParty) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        if (booking.status === 'cancelled' || booking.status === 'completed' || booking.paymentStatus === 'refunded') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking is not accepting a deposit' });
        }
        const agreedDeposit = booking.depositAmount ? Number(booking.depositAmount) : null;
        if (agreedDeposit !== null && Number.isFinite(agreedDeposit) && input.depositAmount !== agreedDeposit) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Deposit must match the agreed booking deposit' });
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
        bookingId: z.number().int().safe().positive(),
        paymentIntentId: z.string().trim().regex(/^pi_[A-Za-z0-9]+$/, 'Invalid payment intent ID'),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        
        const currentVenueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const currentArtistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const isBookingParty = ctx.user.role === 'admin'
          || Boolean(currentVenueProfile && booking.venueId === currentVenueProfile.id)
          || Boolean(currentArtistProfile && booking.artistId === currentArtistProfile.id)
          || (booking.bookingSource === 'client_booking' && booking.venueId === ctx.user.id);
        if (!isBookingParty) throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        if (booking.stripePaymentIntentId !== input.paymentIntentId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment intent does not belong to this booking' });
        }

        // Verify payment intent succeeded and is the one created for this booking.
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded' || paymentIntent.metadata?.bookingId !== String(input.bookingId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment not completed' });
        }
        const agreedDeposit = booking.depositAmount ? Number(booking.depositAmount) : null;
        const expectedDepositCents = agreedDeposit !== null && Number.isFinite(agreedDeposit)
          ? Math.round(agreedDeposit * 100)
          : null;
        if (expectedDepositCents !== null && (typeof paymentIntent.amount_received !== 'number' || paymentIntent.amount_received < expectedDepositCents)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment amount is below the agreed deposit' });
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
        bookingId: z.number().int().safe().positive(),
        riderTemplateId: z.number().int().safe().positive(),
      }).strict())
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
      .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) return null;

        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtistParty = artistProfile && booking.artistId === artistProfile.id;
        const isVenueParty = venueProfile && booking.venueId === venueProfile.id;
        if (!isArtistParty && !isVenueParty && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking rider' });
        }
        
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
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .query(async ({ ctx, input }) => {
        // Ownership check: verify user is a party to this booking
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtistParty = artistProfile && booking.artistId === artistProfile.id;
        const isVenueParty = venueProfile && booking.venueId === venueProfile.id;
        const isAdmin = ctx.user.role === 'admin';
        if (!isArtistParty && !isVenueParty && !isAdmin) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking\'s messages' });
        }
        return await db.getMessagesByBookingId(input.bookingId);
      }),
    
    // Send message
    send: protectedProcedure
      .input(z.object({
        bookingId: bookingIdInput,
        receiverId: z.number().int().safe().positive(),
        messageText: z.string().trim().min(1).max(5_000),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        // Ownership check: verify user is a party to this booking
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtistParty = artistProfile && booking.artistId === artistProfile.id;
        const isVenueParty = venueProfile && booking.venueId === venueProfile.id;
        if (!isArtistParty && !isVenueParty) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to send messages for this booking' });
        }
        const bookingVenueProfile = isArtistParty ? await db.getVenueProfileById(booking.venueId) : null;
        const bookingArtistProfile = isVenueParty ? await db.getArtistProfileById(booking.artistId) : null;
        const allowedRecipientIds = [
          bookingVenueProfile?.userId,
          bookingArtistProfile?.userId,
        ].filter((id): id is number => typeof id === 'number');
        if (!allowedRecipientIds.includes(input.receiverId)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Messages can only be sent to the other booking participant' });
        }
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
        bookingId: bookingIdInput,
        receiverId: z.number().int().safe().positive(),
        riderTemplateId: legacyRiderTemplateId,
        riderTemplateName: legacyRiderTemplateName,
        riderTemplateData: legacyRiderTemplateData,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        // Ownership check: verify user is a party to this booking
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtistParty = artistProfile && booking.artistId === artistProfile.id;
        const isVenueParty = venueProfile && booking.venueId === venueProfile.id;
        if (!isArtistParty && !isVenueParty) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to send messages for this booking' });
        }
        const bookingVenueProfile = isArtistParty ? await db.getVenueProfileById(booking.venueId) : null;
        const bookingArtistProfile = isVenueParty ? await db.getArtistProfileById(booking.artistId) : null;
        const allowedRecipientIds = [
          bookingVenueProfile?.userId,
          bookingArtistProfile?.userId,
        ].filter((id): id is number => typeof id === 'number');
        if (!allowedRecipientIds.includes(input.receiverId)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Messages can only be sent to the other booking participant' });
        }
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
      .input(z.object({ id: z.number().int().safe().positive() }).strict())
      .mutation(async ({ ctx, input }) => {
        const message = await db.getMessageById(input.id);
        if (!message) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
        }
        if (message.recipientId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the message recipient can mark it as read' });
        }
        await db.markMessageAsRead(input.id);
        return { success: true };
      }),
    
    // Mark all messages in a booking as read
    markBookingAsRead: protectedProcedure
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isArtistParty = artistProfile && booking.artistId === artistProfile.id;
        const isVenueParty = venueProfile && booking.venueId === venueProfile.id;
        if (!isArtistParty && !isVenueParty && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking\'s messages' });
        }
        await db.markMessagesAsRead(input.bookingId, ctx.user.id);
        return { success: true };
      }),
    
    // Get unread message count for a specific booking
    getUnreadCount: protectedProcedure
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const isParty = (artistProfile && booking.artistId === artistProfile.id)
          || (venueProfile && booking.venueId === venueProfile.id)
          || ctx.user.role === 'admin';
        if (!isParty) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking\'s messages' });
        }
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
        artistId: artistProfileId,
        message: z.string().trim().min(1).max(5_000),
      }).strict())
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
        bookingId: z.number().int().safe().positive(),
        artistId: artistProfileId,
        rating: reviewRating,
        reviewText: reviewBody,
      }).strict())
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
        if (booking.venueId !== venueProfile.id || booking.artistId !== input.artistId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only review an artist from your completed booking' });
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
        artistId: artistProfileId,
        rating: reviewRating,
        title: reviewTitle,
        reviewText: z.string().trim().min(1).max(2_000),
      }).strict())
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
        
        // A profile review is still attributed to the submitting venue.
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!venueProfile) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only venues can leave profile reviews' });
        }
        
        await db.createReview({
          bookingId: null as any,
          artistId: input.artistId,
          venueId: venueProfile.id,
          reviewerUserId: ctx.user.id,
          rating: input.rating,
          comment: `${input.title}\n\n${input.reviewText}`,
        });
        // In-app notification to artist
        const reviewedArtistProfile = await db.getArtistProfileById(input.artistId);
        if (reviewedArtistProfile) {
          notif.notifyNewReview({
            recipientUserId: reviewedArtistProfile.userId,
            reviewerName: venueProfile.organizationName || 'A venue',
            rating: input.rating,
          }).catch(() => {});
        }
        
        return { success: true };
      }),

    // Get reviews for an artist (public)
    getByArtist: publicProcedure
      .input(z.object({ artistId: artistProfileId }).strict())
      .query(async ({ input }) => {
        let reviews: any[] = [];
        try {
          reviews = await db.getReviewsByArtistId(input.artistId);
        } catch (error) {
          console.error('Error getting artist reviews');
        }
        return (reviews || []).map(toPublicReview).filter((review): review is NonNullable<typeof review> => review !== null);
      }),
    
    // Get review for a specific booking
    getByBooking: publicProcedure
      .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
      .query(async ({ input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || booking.status !== 'completed') return null;
        const review = await db.getReviewByBookingId(input.bookingId);
        return toPublicReview(review);
      }),
    
    // Get average rating for an artist
    getAverageRating: publicProcedure
      .input(z.object({ artistId: artistProfileId }).strict())
      .query(async ({ input }) => {
        const rating = await db.getAverageRatingForArtist(input.artistId);
        return rating || { averageRating: 0, reviewCount: 0 };
      }),

    // Respond to a review (artist only)
    respondToReview: artistProcedure
      .input(z.object({
        reviewId: z.number().int().safe().positive(),
        response: reviewResponse,
      }).strict())
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
        bookingId: z.number().int().safe().positive(),
        venueId: artistProfileId,
        rating: reviewRating,
        professionalismRating: reviewRating.optional(),
        soundQualityRating: reviewRating.optional(),
        greenRoomRating: reviewRating.optional(),
        paymentTimelinessRating: reviewRating.optional(),
        reviewText: reviewBody,
      }).strict())
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
        if (booking.artistId !== artistProfile.id || booking.venueId !== input.venueId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only review a venue from your completed booking' });
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
      .input(z.object({ venueId: artistProfileId }).strict())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
          const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
          const hasCompletedBooking = artistProfile
            ? (await db.getBookingsByArtistId(artistProfile.id)).some((booking) => booking.venueId === input.venueId && booking.status === 'completed')
            : false;
          if ((!venueProfile || venueProfile.id !== input.venueId) && !hasCompletedBooking) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view these venue reviews' });
          }
        }
        const reviews = await db.getVenueReviewsByVenueId(input.venueId);
        return (reviews || []).map(toPublicReview).filter((review): review is NonNullable<typeof review> => review !== null);
      }),
    
    // Get venue review by booking ID
    getByBooking: protectedProcedure
      .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || !(await isBookingParty(ctx.user, booking))) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view this booking review' });
        }
        const review = await db.getVenueReviewByBookingId(input.bookingId);
        return toPublicReview(review);
      }),
    
    // Get average rating for venue
    getAverageRating: protectedProcedure
      .input(z.object({ venueId: artistProfileId }).strict())
      .query(async ({ input }) => {
        const rating = await db.getAverageRatingForVenue(input.venueId);
        return rating || { averageRating: 0, reviewCount: 0 };
      }),
    
    // Venue responds to review
    respondToReview: venueProcedure
      .input(z.object({
        reviewId: z.number().int().safe().positive(),
        response: reviewResponse,
      }).strict())
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
        bookingId: z.number().int().safe().positive(),
        artistId: artistProfileId,
        rating: reviewRating,
        reliabilityRating: reviewRating.optional(),
        stagePresenceRating: reviewRating.optional(),
        crowdEngagementRating: reviewRating.optional(),
        professionalismRating: reviewRating.optional(),
        reviewText: reviewBody,
      }).strict())
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
        if (booking.venueId !== venueProfile.id || booking.artistId !== input.artistId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only review an artist from your completed booking' });
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
      .input(z.object({ artistId: artistProfileId }).strict())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
          const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
          const hasCompletedBooking = venueProfile
            ? (await db.getBookingsByVenueId(venueProfile.id)).some((booking) => booking.artistId === input.artistId && booking.status === 'completed')
            : false;
          if ((!artistProfile || artistProfile.id !== input.artistId) && !hasCompletedBooking) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view these artist reviews' });
          }
        }
        const reviews = await db.getArtistReviewsByArtistId(input.artistId);
        return (reviews || []).map(toPublicReview).filter((review): review is NonNullable<typeof review> => review !== null);
      }),

    // Get artist review by booking ID
    getByBooking: protectedProcedure
      .input(z.object({ bookingId: z.number().int().safe().positive() }).strict())
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking || !(await isBookingParty(ctx.user, booking))) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view this booking review' });
        }
        return toPublicReview(await db.getArtistReviewByBookingId(input.bookingId));
      }),

    // Get average rating for artist (public so profile pages can show it)
    getAverageRating: publicProcedure
      .input(z.object({ artistId: artistProfileId }).strict())
      .query(async ({ input }) => {
        return await db.getAverageRatingForArtist(input.artistId);
      }),

    // Artist responds to review
    respondToReview: artistProcedure
      .input(z.object({
        reviewId: z.number().int().safe().positive(),
        response: reviewResponse,
      }).strict())
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
    createCheckoutSession: paidSubscriptionProcedure
      .input(z.object({
        successUrl: subscriptionReturnUrl,
        cancelUrl: subscriptionReturnUrl,
        plan: z.enum(['starter', 'professional', 'enterprise']).optional().default('professional'),
        interval: z.enum(['month', 'year']).optional().default('month'),
        useCredits: z.boolean().optional().default(false),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const { getOrCreateStripeCustomer, createSubscriptionCheckoutSession, stripe: stripeClient } = await import('./stripe');
        const { SUBSCRIPTION_PRODUCTS } = await import('../shared/products');
        const origin = trustedCheckoutOrigin(process.env.BASE_URL, (ctx.req as any)?.headers?.origin);
        const isApprovedReturnUrl = (value: string) => {
          try {
            const parsed = new URL(value);
            return parsed.origin === origin && !parsed.username && !parsed.password;
          } catch {
            return false;
          }
        };
        if (!isApprovedReturnUrl(input.successUrl) || !isApprovedReturnUrl(input.cancelUrl)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Checkout return URLs must use the approved application origin' });
        }
        
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

            const selectedProduct = input.plan === 'starter'
              ? SUBSCRIPTION_PRODUCTS.ARTIST_STARTER
              : input.plan === 'enterprise'
                ? SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE
                : SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL;
            const planTotalCents = input.interval === 'year'
              ? selectedProduct.priceYearly
              : selectedProduct.priceMonthly;
            const amountOff = Math.min(Math.round(balance * 100), planTotalCents);
            if (amountOff > 0) {
              // Create a one-time Stripe coupon for the credit amount (in cents)
              const coupon = await stripeClient.coupons.create({
                amount_off: amountOff,
                currency: 'usd',
                duration: 'once',
                  name: `Referral Credit ($${(amountOff / 100).toFixed(2)})`,
                metadata: {
                  userId: ctx.user.id.toString(),
                  type: 'referral_credit',
                },
              });
              couponId = coupon.id;

              // Record the credit redemption
              await database.insert(referralCredits).values({
                userId: ctx.user.id,
                amount: String(amountOff / 100),
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
      const subscription = await db.getBillingSubscriptionByUserId(ctx.user.id);
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
      const subscription = await db.getBillingSubscriptionByUserId(ctx.user.id);
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
    reactivate: paidSubscriptionProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getBillingSubscriptionByUserId(ctx.user.id);
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
      const subscription = await db.getBillingSubscriptionByUserId(ctx.user.id);
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
    resume: paidSubscriptionProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getBillingSubscriptionByUserId(ctx.user.id);
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
        console.log('[SyncFromStripe] Starting subscription sync');
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

        const customers = await stripe.customers.list({ email: ctx.user.email, limit: 1 });
        console.log('[SyncFromStripe] Found customers:', customers.data.length);
        if (customers.data.length === 0) {
          console.log('[SyncFromStripe] No customer found, returning error');
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No Stripe customer found for your email. Please try upgrading again.' });
        }

        const customerId = customers.data[0].id;

        // Get subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'all',
          limit: 5,
          expand: ['data.items.data.price'],
        });
        console.log('[SyncFromStripe] Found subscriptions:', subscriptions.data.length, subscriptions.data.map(s => ({ status: s.status })));

        if (subscriptions.data.length === 0) {
          console.log('[SyncFromStripe] No subscriptions found');
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No subscription found in Stripe for your account.' });
        }

        const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
          || subscriptions.data[0];
        console.log('[SyncFromStripe] Using subscription status:', activeSub.status);

        // Determine tier
        const priceItem = (activeSub as any).items?.data?.[0]?.price;
        const priceAmount = priceItem?.unit_amount;
        const lookupKey = priceItem?.lookup_key;
        const planMetadata = activeSub.metadata?.plan;

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

        console.log('[SyncFromStripe] Upserting subscription:', { tier, status, currentPeriodEnd });

        // Upsert using the top-level db import
        await db.upsertSubscription({
          userId: ctx.user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: activeSub.id,
          tier,
          status,
          currentPeriodEnd,
        });

        console.log('[SyncFromStripe] Sync succeeded');
        return { success: true, tier, status };
      }),
  }),
  
  // Favorites router
  favorite: router({
    add: venueProcedure
      .input(z.object({ artistId: favoriteArtistId }).strict())
      .mutation(async ({ ctx, input }) => {
        return await db.addFavorite(ctx.user.id, input.artistId);
      }),
    
    remove: venueProcedure
      .input(z.object({ artistId: favoriteArtistId }).strict())
      .mutation(async ({ ctx, input }) => {
        await db.removeFavorite(ctx.user.id, input.artistId);
        return { success: true };
      }),
    
    getMyFavorites: venueProcedure
      .query(async ({ ctx }) => {
        return await db.getFavoritesByVenue(ctx.user.id);
      }),
    
    isFavorited: venueProcedure
      .input(z.object({ artistId: favoriteArtistId }).strict())
      .query(async ({ ctx, input }) => {
        return await db.isFavorited(ctx.user.id, input.artistId);
      }),
    
    getCount: publicProcedure
      .input(z.object({ artistId: favoriteArtistId }).strict())
      .query(async ({ input }) => {
        return await db.getFavoriteCount(input.artistId);
      }),
  }),
  
  // Booking template router
  bookingTemplate: router({
    create: venueProcedure
      .input(z.object({
        templateName: bookingTemplateName,
        eventDetails: bookingTemplateText,
        totalFee: bookingTemplateMoney,
        depositAmount: bookingTemplateMoney,
        venueName: z.string().trim().max(255).optional(),
        venueAddress: z.string().trim().max(1_000).optional(),
        venueCapacity: z.number().int().min(1).max(1_000_000).optional(),
        eventType: z.string().trim().max(100).optional(),
        budgetMin: bookingTemplateMoney,
        budgetMax: bookingTemplateMoney,
        standardRequirements: bookingTemplateText,
        additionalNotes: bookingTemplateText,
      }).strict().superRefine((input, refinement) => {
        if (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) {
          refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['budgetMax'], message: 'Budget maximum must be at least the budget minimum' });
        }
        if (input.totalFee !== undefined && input.depositAmount !== undefined && input.depositAmount > input.totalFee) {
          refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['depositAmount'], message: 'Deposit cannot exceed total fee' });
        }
      }))
      .mutation(async ({ ctx, input }) => {
        const { templateName, eventDetails, totalFee, depositAmount, venueName, venueAddress, venueCapacity, eventType, budgetMin, budgetMax, standardRequirements, additionalNotes } = input;
        const legacyDetails = [
          eventDetails,
          venueName && `Venue: ${venueName}`,
          venueAddress && `Address: ${venueAddress}`,
          venueCapacity !== undefined && `Capacity: ${venueCapacity}`,
          eventType && `Event type: ${eventType}`,
          budgetMin !== undefined && `Budget minimum: ${budgetMin}`,
          budgetMax !== undefined && `Budget maximum: ${budgetMax}`,
          standardRequirements && `Requirements: ${standardRequirements}`,
          additionalNotes && `Additional notes: ${additionalNotes}`,
        ].filter(Boolean).join('\n');
        return await db.createBookingTemplate({
          venueId: ctx.user.id,
          templateName,
          eventDetails: legacyDetails || null,
          totalFee: totalFee !== undefined ? String(totalFee) : budgetMax !== undefined ? String(budgetMax) : null,
          depositAmount: depositAmount !== undefined ? String(depositAmount) : null,
        });
      }),
    
    getMyTemplates: venueProcedure
      .query(async ({ ctx }) => {
        return await db.getBookingTemplatesByUserId(ctx.user.id);
      }),
    
    getById: venueProcedure
      .input(z.object({ id: bookingTemplateId }).strict())
      .query(async ({ ctx, input }) => {
        const template = await db.getBookingTemplateById(input.id);
        if (!template || (ctx.user.role !== 'admin' && template.venueId !== ctx.user.id)) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking template not found' });
        }
        return template;
      }),
    
    update: venueProcedure
      .input(z.object({
        id: bookingTemplateId,
        templateName: bookingTemplateName.optional(),
        eventDetails: bookingTemplateText,
        totalFee: bookingTemplateMoney,
        depositAmount: bookingTemplateMoney,
        venueName: z.string().trim().max(255).optional(),
        venueAddress: z.string().trim().max(1_000).optional(),
        venueCapacity: z.number().int().min(1).max(1_000_000).optional(),
        eventType: z.string().trim().max(100).optional(),
        budgetMin: bookingTemplateMoney,
        budgetMax: bookingTemplateMoney,
        standardRequirements: bookingTemplateText,
        additionalNotes: bookingTemplateText,
      }).strict().superRefine((input, refinement) => {
        if (input.budgetMin !== undefined && input.budgetMax !== undefined && input.budgetMin > input.budgetMax) {
          refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['budgetMax'], message: 'Budget maximum must be at least the budget minimum' });
        }
        if (input.totalFee !== undefined && input.depositAmount !== undefined && input.depositAmount > input.totalFee) {
          refinement.addIssue({ code: z.ZodIssueCode.custom, path: ['depositAmount'], message: 'Deposit cannot exceed total fee' });
        }
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getBookingTemplateById(input.id);
        if (!existing || (ctx.user.role !== 'admin' && existing.venueId !== ctx.user.id)) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking template not found' });
        }
        const { id, templateName, eventDetails, totalFee, depositAmount, venueName, venueAddress, venueCapacity, eventType, budgetMin, budgetMax, standardRequirements, additionalNotes } = input;
        const legacyDetails = [
          eventDetails,
          venueName && `Venue: ${venueName}`,
          venueAddress && `Address: ${venueAddress}`,
          venueCapacity !== undefined && `Capacity: ${venueCapacity}`,
          eventType && `Event type: ${eventType}`,
          budgetMin !== undefined && `Budget minimum: ${budgetMin}`,
          budgetMax !== undefined && `Budget maximum: ${budgetMax}`,
          standardRequirements && `Requirements: ${standardRequirements}`,
          additionalNotes && `Additional notes: ${additionalNotes}`,
        ].filter(Boolean).join('\n');
        const updates: Partial<schema.InsertBookingTemplate> = {};
        if (templateName !== undefined) updates.templateName = templateName;
        if (legacyDetails) updates.eventDetails = legacyDetails;
        if (totalFee !== undefined || budgetMax !== undefined) updates.totalFee = String(totalFee ?? budgetMax);
        if (depositAmount !== undefined) updates.depositAmount = String(depositAmount);
        await db.updateBookingTemplate(id, updates);
        return { success: true };
      }),
    
    delete: venueProcedure
      .input(z.object({ id: bookingTemplateId }).strict())
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getBookingTemplateById(input.id);
        if (!existing || (ctx.user.role !== 'admin' && existing.venueId !== ctx.user.id)) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking template not found' });
        }
        await db.deleteBookingTemplate(input.id);
        return { success: true };
      }),
  }),
  
  // Analytics router - profile views and stats moved to analytics router
  profileAnalytics: router({
    trackView: publicProcedure
      .input(z.object({ artistId: artistProfileId }).strict())
      .mutation(async ({ input }) => {
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
      .input(z.object({ days: z.number().int().min(1).max(365).optional() }).strict())
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
      .input(z.object({ months: z.number().int().min(1).max(120).optional() }).strict())
      .query(async ({ ctx, input }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        return await db.getRevenueByMonth(profile.id, input.months);
      }),

    getRevenueSummary: artistProcedure
      .query(async ({ ctx }) => {
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
        }
        return await db.getArtistRevenueSummary(profile.id);
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
    checkAndSend: adminProcedure
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
      .input(bookingCalendarRange)
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
      .input(bookingCalendarRange)
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
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (ctx.user.role !== 'admin' && (!venueProfile || booking.venueId !== venueProfile.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        if (booking.status === 'cancelled' || booking.status === 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking is not accepting a deposit' });
        }
        
        // Calculate deposit: use stored amount or default to 50% of total fee
        const depositAmount = booking.depositAmount 
          ? Number(booking.depositAmount) 
          : booking.totalFee 
            ? Math.round(Number(booking.totalFee) / 2 * 100) / 100 
            : null;
        
        if (!depositAmount || depositAmount <= 0 || !Number.isFinite(depositAmount) || depositAmount > 100_000_000) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No deposit amount could be determined. Please set a total fee for this booking.' });
        }
        
        // Create Stripe checkout session with Connect routing
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = trustedCheckoutOrigin(process.env.BASE_URL, ctx.req.headers.origin);
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
                description: (booking.eventDetails || 'Event booking deposit').slice(0, 2_000),
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
            platformFeePercent: '1',
            platformFeeClassification: 'technology_marketplace_service',
            athleteAgentFeeIncluded: 'false',
          },
        };

        // Route payment to artist's connected Stripe account if available
        if (connectAccountId) {
          sessionParams.payment_intent_data = {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: connectAccountId },
          };
          console.log(`[DepositCheckout] Using Stripe Connect, fee: ${platformFeeCents}c`);
        } else {
          console.log('[DepositCheckout] No connected artist account; payment goes to platform');
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Create checkout session for full payment
    createFullPaymentCheckout: venueProcedure
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (ctx.user.role !== 'admin' && (!venueProfile || booking.venueId !== venueProfile.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        if (booking.status === 'cancelled') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking is cancelled' });
        }
        
        if (!booking.totalFee) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No total fee set' });
        }
        
        // Calculate remaining amount if deposit already paid
        const remainingAmount = booking.paymentStatus === 'deposit_paid' 
          ? Number(booking.totalFee) - Number(booking.depositAmount || 0)
          : Number(booking.totalFee);
        if (!Number.isFinite(remainingAmount) || remainingAmount <= 0 || remainingAmount > 100_000_000) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Remaining payment amount is invalid' });
        }
        
        if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe is not configured' });
        const origin = trustedCheckoutOrigin(process.env.BASE_URL, ctx.req.headers.origin);
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
                description: (booking.eventDetails || 'Event booking payment').slice(0, 2_000),
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
            platformFeePercent: '1',
            platformFeeClassification: 'technology_marketplace_service',
            athleteAgentFeeIncluded: 'false',
          },
        };

        // Route payment to artist's connected Stripe account if available
        if (connectAccountId) {
          sessionParams.payment_intent_data = {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: connectAccountId },
          };
          console.log(`[FullPaymentCheckout] Using Stripe Connect, fee: ${platformFeeCents}c`);
        } else {
          console.log('[FullPaymentCheckout] No connected artist account; payment goes to platform');
        }

        const session = await stripe.checkout.sessions.create(sessionParams);
        
        return { sessionId: session.id, url: session.url };
      }),
    
    // Verify payment after returning from Stripe checkout (webhook fallback)
    verifyPayment: protectedProcedure
      .input(z.object({
        bookingId: bookingIdInput,
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const isBookingParty = ctx.user.role === 'admin'
          || Boolean(venueProfile && booking.venueId === venueProfile.id)
          || Boolean(artistProfile && booking.artistId === artistProfile.id);
        if (!isBookingParty) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
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
          const totalFeeCents = booking.totalFee && Number.isFinite(Number(booking.totalFee))
            ? Math.round(Number(booking.totalFee) * 100)
            : null;
          const depositCents = booking.depositAmount && Number.isFinite(Number(booking.depositAmount))
            ? Math.round(Number(booking.depositAmount) * 100)
            : null;
          const remainingCents = totalFeeCents === null
            ? null
            : Math.max(0, totalFeeCents - (depositCents || 0));
          const bookingSessions = sessions.data.filter((s) => {
            if (s.metadata?.bookingId !== input.bookingId.toString() || s.payment_status !== 'paid') return false;
            const sessionAmount = s.amount_total;
            const paymentType = s.metadata?.paymentType;
            const expected = paymentType === 'deposit'
              ? depositCents
              : paymentType === 'final_payment'
                ? remainingCents
                : totalFeeCents;
            return typeof sessionAmount === 'number' && sessionAmount > 0 && (expected === null || sessionAmount >= expected);
          });
          
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
      .input(z.object({ bookingId: bookingIdInput }).strict())
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (ctx.user.role !== 'admin'
          && !((venueProfile && booking.venueId === venueProfile.id) || (artistProfile && booking.artistId === artistProfile.id))) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        // Return empty payment history for now
        return [];
      }),
    
    // Request refund
    requestRefund: venueProcedure
      .input(z.object({
        bookingId: bookingIdInput,
        reason: z.string().trim().max(1_000).optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
        if (ctx.user.role !== 'admin' && (!venueProfile || booking.venueId !== venueProfile.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized for this booking' });
        }
        if (booking.paymentStatus === 'refunded') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking has already been refunded' });
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
      .input(z.object({ id: legacyRiderTemplateId }).strict())
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
        templateName: legacyRiderTemplateName,
        templateData: legacyRiderTemplateData.optional(),
      }).strict())
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
        templateId: legacyRiderTemplateId,
        templateName: legacyRiderTemplateName.optional(),
        templateData: legacyRiderTemplateData.optional(),
      }).strict())
      .mutation(async ({ ctx, input }) => {
        const template = await db.getRiderTemplateById(input.templateId);
        if (!template || template.artistId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        const updates: { templateName?: string; templateData?: Record<string, unknown> } = {};
        if (input.templateName !== undefined) updates.templateName = input.templateName;
        if (input.templateData !== undefined) updates.templateData = input.templateData;
        await db.updateRiderTemplate(input.templateId, updates);
        return { success: true };
      }),
    
    // Delete rider template
    delete: artistProcedure
      .input(z.object({ id: legacyRiderTemplateId }).strict())
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
        email: z.string().trim().toLowerCase().email('Invalid email address').max(320),
        name: z.string().trim().max(200).optional(),
        source: z.string().trim().max(100).optional(),
      }).strict())
      .mutation(async ({ input, ctx }) => {
        // Rate limit by IP
        const clientIp = ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
          || ctx.req?.socket?.remoteAddress || 'unknown';
        const ipCheck = await newsletterLimiter.checkAsync(`ip:${clientIp}`);
        if (!ipCheck.allowed) {
          const retryMinutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Too many subscription attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
          });
        }
        // Rate limit by email
        const emailCheck = await newsletterLimiter.checkAsync(`email:${input.email.toLowerCase()}`);
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
             console.error('[Newsletter] Email sending failed');
            throw new Error('Email service failed');
          }
          return { success: true, message: 'Successfully subscribed to newsletter! Check your email for confirmation.' };
         } catch (error) {
           console.error('[Newsletter] Subscription error');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to subscribe to newsletter. Please try again later.',
          });
        }
      }),
  }),
  
  admin: adminRouter,
  dispute: disputeRouter,
  projectPreviews: projectPreviewsRouter,
  team: teamRouter,
  tip: tipRouter,
  promote: promoteRouter,
  fanClub: fanClubRouter,
  aiChat: aiChatRouter,
  contractAnalyzer: contractAnalyzerRouter,
  ologyLive: ologyLiveRouter,
  ologyLivePhase2: ologyLivePhase2Router,
});
export type AppRouter = typeof appRouter;
import { releasesRouter } from "./routers/releases";
