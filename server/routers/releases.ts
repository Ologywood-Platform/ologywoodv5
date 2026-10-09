/**
 * Releases Router - Content Release System
 * Handles CRUD for creator content releases and access control.
 * OlogyWood is the business platform - content lives wherever the creator chooses.
 */
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { contentReleases as releases, contentReleasePurchases as releasePurchases, artistProfiles, fanClubMemberships } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  aiDisclosureInputShape,
  EMPTY_AI_DISCLOSURE_DB,
  normalizeAiDisclosure,
} from "../services/aiReleaseDisclosure";
import { ensureContentReleaseSchema } from "../services/contentReleaseSchemaService";
import { CONTENT_RELEASE_TYPES, CONTENT_RELEASE_SAVE_ERROR } from "../../shared/contentReleaseTypes";
import { CONTENT_RELEASE_COVER_MAX_BYTES, CONTENT_RELEASE_COVER_MIME_TYPES, CONTENT_RELEASE_COVER_UPLOAD_ERROR } from "../../shared/contentReleaseCover";
import { prepareContentReleaseCover } from "../services/contentReleaseCoverService";
import { storagePut } from "../storage";
import { randomUUID } from "node:crypto";
import { RateLimiter } from "../utils/rateLimiter";

import { createContentReleaseCheckout } from "../services/contentReleaseCommerceService";
import { contentReleasePublicView, isVerifiedContentPurchase } from "../../shared/contentReleaseCommerce";

export const contentReleaseCoverLimiter = new RateLimiter({maxRequests:10, windowMs:60_000});

// Release type options
export const RELEASE_TYPES = CONTENT_RELEASE_TYPES;

async function getReleaseDb() {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  await ensureContentReleaseSchema(database);
  return database;
}

function safeReleaseError(path: string, error: TRPCError): never {
  // Record only the operation and driver code, never SQL or creator input.
  const cause = error.cause as { code?: string; cause?: { code?: string } } | undefined;
  console.error('[ContentRelease] Operation failed', { path, code: cause?.code ?? cause?.cause?.code ?? error.code });
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: path.endsWith('uploadCoverArt') ? CONTENT_RELEASE_COVER_UPLOAD_ERROR : path.endsWith('purchase') ? 'We could not start checkout. No access was granted. Please try again.' : CONTENT_RELEASE_SAVE_ERROR });
}

const releaseProtectedProcedure = protectedProcedure.use(async ({ next, path }) => {
  const result = await next();
  if (!result.ok && result.error.code === 'INTERNAL_SERVER_ERROR') safeReleaseError(path, result.error);
  return result;
});

const releasePublicProcedure = publicProcedure.use(async ({ next, path }) => {
  const result = await next();
  if (!result.ok && result.error.code === 'INTERNAL_SERVER_ERROR') safeReleaseError(path, result.error);
  return result;
});

// Hosting platform options
export const HOSTING_PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple_podcasts', label: 'Apple Podcasts' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'personal_website', label: 'Personal Website' },
  { value: 'other', label: 'Other' },
] as const;

// Access model options
export const ACCESS_MODELS = [
  { value: 'free', label: 'Free', icon: '✅', description: 'Anyone can access' },
  { value: 'ticketed', label: 'Ticket Required', icon: '🎟', description: 'One-time purchase to access' },
  { value: 'fan_club_only', label: 'Fan Club Members Only', icon: '⭐', description: 'Only your fan club members can access' },
  { value: 'pay_what_you_want', label: 'Pay What You Want', icon: '💰', description: 'Fans choose their price (with optional minimum)' },
  { value: 'unlock_after_purchase', label: 'Unlock After Purchase', icon: '🔓', description: 'Locked until purchased' },
] as const;

const createReleaseInput = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  releaseType: z.string().min(1).max(50),
  genre: z.string().max(100).optional(),
  duration: z.string().max(50).optional(),
  thumbnailUrl: z.string().max(4096).refine(value => {
    if (!value || value.startsWith('/manus-storage/')) return true;
    try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
  }, 'Please use a valid uploaded cover-art URL.').optional(),
  trailerUrl: z.string().optional(),
  hostingPlatform: z.string().min(1).max(50),
  contentUrl: z.string().url(),
  accessModel: z.string().max(50).default('free'),
  price: z.number().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  premiereDate: z.string().optional(), // ISO date string
  isPublished: z.boolean().default(false),
  includesLiveQA: z.boolean().default(false),
  includesBonusContent: z.boolean().default(false),
  bonusContentDescription: z.string().optional(),
  ...aiDisclosureInputShape,
});

// Create defaults must not run during an unrelated partial edit.
const updateReleaseInput = createReleaseInput.partial().extend({
  id: z.number(),
  accessModel: z.string().max(50).optional(),
  isPublished: z.boolean().optional(),
  includesLiveQA: z.boolean().optional(),
  includesBonusContent: z.boolean().optional(),
});

export const releasesRouter = router({
  // Upload only stores a new image. Save/Create explicitly attaches it to a release.
  uploadCoverArt: releaseProtectedProcedure
    .input(z.object({
      fileData: z.string().min(1).max(Math.ceil(CONTENT_RELEASE_COVER_MAX_BYTES / 3) * 4 + 64),
      mimeType: z.enum(CONTENT_RELEASE_COVER_MIME_TYPES),
      releaseId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ctx, input}) => {
      if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') throw new TRPCError({code:'FORBIDDEN', message:'Creator access required.'});
      if (!contentReleaseCoverLimiter.check(String(ctx.user.id)).allowed) throw new TRPCError({code:'TOO_MANY_REQUESTS', message:'Too many cover uploads. Please wait a minute and try again.'});
      const database = await getReleaseDb();
      const [profile] = await database.select().from(artistProfiles).where(eq(artistProfiles.userId, ctx.user.id)).limit(1);
      if (!profile) throw new TRPCError({code:'NOT_FOUND', message:'Artist profile not found'});
      if (input.releaseId !== undefined) {
        const [owned] = await database.select().from(releases).where(and(eq(releases.id, input.releaseId), eq(releases.userId, ctx.user.id))).limit(1);
        if (!owned) throw new TRPCError({code:'NOT_FOUND', message:'Release not found'});
      } else {
        const { getSubscriptionByUserId } = await import('../db');
        const subscription = await getSubscriptionByUserId(ctx.user.id);
        const tier = subscription?.tier || 'free';
        if (tier === 'free') throw new TRPCError({code:'FORBIDDEN', message:'Content Releases require a Starter plan or higher.'});
        if (tier === 'starter') {
          const existing = await database.select({id:releases.id}).from(releases).where(eq(releases.userId, ctx.user.id));
          if (existing.length >= 2) throw new TRPCError({code:'FORBIDDEN', message:'Starter plan is limited to 2 releases. Edit an existing release or upgrade to Professional.'});
        }
      }
      const image = await prepareContentReleaseCover(input.fileData, input.mimeType);
      const key = `content-release-covers/${ctx.user.id}/${randomUUID()}.webp`;
      const uploaded = await storagePut(key, image.data, image.mimeType);
      return {url:uploaded.url, width:image.width, height:image.height};
    }),

  // Get all releases for the current artist (dashboard)
  myReleases: releaseProtectedProcedure.query(async ({ ctx }) => {
    const database = await getReleaseDb();
    if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const results = await database.select().from(releases)
      .where(eq(releases.userId, ctx.user.id))
      .orderBy(desc(releases.createdAt));
    return results;
  }),

  // Create a new release
  create: releaseProtectedProcedure
    .input(createReleaseInput)
    .mutation(async ({ ctx, input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get artist profile
      const [profile] = await database.select().from(artistProfiles)
        .where(eq(artistProfiles.userId, ctx.user.id))
        .limit(1);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
      }

      // Tier enforcement: check release limit
      const { getSubscriptionByUserId } = await import("../db");
      const subscription = await getSubscriptionByUserId(ctx.user.id);
      const userTier = subscription?.tier || "free";
      if (userTier === "free") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Content Releases require a Starter plan or higher. Please upgrade your subscription." });
      }
      if (userTier === "starter") {
        const existingReleases = await database.select().from(releases)
          .where(eq(releases.userId, ctx.user.id));
        if (existingReleases.length >= 2) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Starter plan is limited to 2 releases. Upgrade to Professional for unlimited releases." });
        }
      }

      const aiDisclosure = normalizeAiDisclosure(input) ?? EMPTY_AI_DISCLOSURE_DB;
      const result = await database.insert(releases).values({
        artistProfileId: profile.id,
        userId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        releaseType: input.releaseType,
        genre: input.genre || null,
        duration: input.duration || null,
        thumbnailUrl: input.thumbnailUrl || null,
        trailerUrl: input.trailerUrl || null,
        hostingPlatform: input.hostingPlatform,
        contentUrl: input.contentUrl,
        accessModel: input.accessModel,
        price: input.price ? input.price.toFixed(2) : null,
        minPrice: input.minPrice ? input.minPrice.toFixed(2) : null,
        premiereDate: input.premiereDate ? new Date(input.premiereDate) : null,
        isPublished: input.isPublished,
        includesLiveQA: input.includesLiveQA,
        includesBonusContent: input.includesBonusContent,
        bonusContentDescription: input.bonusContentDescription || null,
        ...aiDisclosure,
      });

      const insertId = (result as any)[0].insertId;
      const [created] = await database.select().from(releases).where(eq(releases.id, insertId));
      return created;
    }),

  // Update a release
  update: releaseProtectedProcedure
    .input(updateReleaseInput)
    .mutation(async ({ ctx, input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const { id, ...data } = input;
      const [existing] = await database.select().from(releases)
        .where(and(eq(releases.id, id), eq(releases.userId, ctx.user.id)));
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Release not found' });
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.releaseType !== undefined) updateData.releaseType = data.releaseType;
      if (data.genre !== undefined) updateData.genre = data.genre || null;
      if (data.duration !== undefined) updateData.duration = data.duration || null;
      if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl || null;
      if (data.trailerUrl !== undefined) updateData.trailerUrl = data.trailerUrl || null;
      if (data.hostingPlatform !== undefined) updateData.hostingPlatform = data.hostingPlatform;
      if (data.contentUrl !== undefined) updateData.contentUrl = data.contentUrl;
      if (data.accessModel !== undefined) updateData.accessModel = data.accessModel;
      if (data.price !== undefined) updateData.price = data.price ? data.price.toFixed(2) : null;
      if (data.minPrice !== undefined) updateData.minPrice = data.minPrice ? data.minPrice.toFixed(2) : null;
      if (data.premiereDate !== undefined) updateData.premiereDate = data.premiereDate ? new Date(data.premiereDate) : null;
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
      if (data.includesLiveQA !== undefined) updateData.includesLiveQA = data.includesLiveQA;
      if (data.includesBonusContent !== undefined) updateData.includesBonusContent = data.includesBonusContent;
      if (data.bonusContentDescription !== undefined) updateData.bonusContentDescription = data.bonusContentDescription || null;
      const aiDisclosure = normalizeAiDisclosure(data, existing);
      if (aiDisclosure) Object.assign(updateData, aiDisclosure);

      await database.update(releases).set(updateData).where(eq(releases.id, id));
      const [updated] = await database.select().from(releases).where(eq(releases.id, id));
      return updated;
    }),

  // Delete a release
  delete: releaseProtectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [existing] = await database.select().from(releases)
        .where(and(eq(releases.id, input.id), eq(releases.userId, ctx.user.id)));
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Release not found' });
      }

      await database.delete(releasePurchases).where(eq(releasePurchases.releaseId, input.id));
      await database.delete(releases).where(eq(releases.id, input.id));
      return { success: true };
    }),

  // Get a single release by ID (public - for viewing)
  getById: releasePublicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [release] = await database.select().from(releases)
        .where(and(eq(releases.id, input.id), eq(releases.isPublished, true)));
      if (!release) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Release not found' });
      }

      // Increment view count
      await database.update(releases)
        .set({ viewCount: sql`${releases.viewCount} + 1` })
        .where(eq(releases.id, input.id));

      // Get artist info
      const [artist] = await database.select().from(artistProfiles)
        .where(eq(artistProfiles.id, release.artistProfileId));

      return { ...contentReleasePublicView(release, ctx.user?.id), artist };
    }),

  // Get all published releases for an artist (public profile)
  getByArtist: releasePublicProcedure
    .input(z.object({ artistProfileId: z.number() }))
    .query(async ({ input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const results = await database.select().from(releases)
        .where(and(
          eq(releases.artistProfileId, input.artistProfileId),
          eq(releases.isPublished, true)
        ))
        .orderBy(desc(releases.createdAt));
      return results.map(release => contentReleasePublicView(release));
    }),

  // Check if current user has access to a release
  checkAccess: releaseProtectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getReleaseDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [release] = await database.select().from(releases)
        .where(eq(releases.id, input.releaseId));
      if (!release) return { hasAccess: false, reason: 'not_found' };

      // Creator always has access to their own releases
      if (release.userId === ctx.user.id) return { hasAccess: true, reason: 'owner', contentUrl: release.contentUrl };
      if (!release.isPublished) return {hasAccess:false,reason:'not_found'};

      // Free releases are always accessible
      if (release.accessModel === 'free') return { hasAccess: true, reason: 'free', contentUrl:release.contentUrl };

      // Check if user has purchased
      const [purchase] = await database.select().from(releasePurchases)
        .where(and(
          eq(releasePurchases.releaseId, input.releaseId),
          eq(releasePurchases.userId, ctx.user.id)
        ));
      if (isVerifiedContentPurchase(purchase)) return { hasAccess: true, reason: 'purchased', contentUrl:release.contentUrl };

      // Fan club only - check if user is an active fan club member
      if (release.accessModel === 'fan_club_only') {
        const artistProfile = await database.select().from(artistProfiles)
          .where(eq(artistProfiles.id, release.artistProfileId)).limit(1);
        if (artistProfile.length > 0) {
          const [membership] = await database.select().from(fanClubMemberships)
            .where(and(
              eq(fanClubMemberships.fanUserId, ctx.user.id),
              eq(fanClubMemberships.talentUserId, artistProfile[0].userId)
            ));
          if (membership && membership.status === 'active') return { hasAccess: true, reason: 'fan_club_member', contentUrl:release.contentUrl };
        }
      }

      return { hasAccess: false, reason: 'payment_required' };
    }),

  // Starting Checkout never creates a paid entitlement. Verified Stripe fulfillment does.
  purchase: releaseProtectedProcedure
    .input(z.object({releaseId:z.number().int().positive(),amount:z.number().finite().min(0)}))
    .mutation(({ctx,input}) => createContentReleaseCheckout(ctx.user,input)),

  myPurchases: releaseProtectedProcedure.query(async ({ctx})=>{
    const database=await getReleaseDb();
    const rows=await database.select({purchase:releasePurchases,release:releases}).from(releasePurchases)
      .innerJoin(releases,eq(releases.id,releasePurchases.releaseId))
      .where(eq(releasePurchases.userId,ctx.user.id)).orderBy(desc(releasePurchases.createdAt));
    return rows.filter(row=>isVerifiedContentPurchase(row.purchase)).map(({purchase,release})=>({
      id:purchase.id,releaseId:release.id,title:release.title,releaseType:release.releaseType,hostingPlatform:release.hostingPlatform,
      thumbnailUrl:release.thumbnailUrl,artistProfileId:release.artistProfileId,amountPaid:purchase.amountPaid,
      createdAt:purchase.createdAt,isPublished:release.isPublished,
    }));
  }),

  // Get release options (types, platforms, access models)
  getOptions: releasePublicProcedure.query(() => {
    return {
      releaseTypes: RELEASE_TYPES,
      hostingPlatforms: HOSTING_PLATFORMS,
      accessModels: ACCESS_MODELS,
    };
  }),
});
