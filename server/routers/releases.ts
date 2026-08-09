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

// Release type options
export const RELEASE_TYPES = [
  { value: 'movie', label: 'Movie' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'short_film', label: 'Short Film' },
  { value: 'web_series', label: 'Web Series' },
  { value: 'concert', label: 'Concert' },
  { value: 'livestream', label: 'Livestream' },
  { value: 'podcast_episode', label: 'Podcast Episode' },
  { value: 'album', label: 'Album' },
  { value: 'course', label: 'Course' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'interview', label: 'Interview' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes' },
  { value: 'other', label: 'Other' },
] as const;

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
  releaseType: z.string().min(1),
  genre: z.string().optional(),
  duration: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  hostingPlatform: z.string().min(1),
  contentUrl: z.string().url(),
  accessModel: z.string().default('free'),
  price: z.number().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  premiereDate: z.string().optional(), // ISO date string
  isPublished: z.boolean().default(false),
  includesLiveQA: z.boolean().default(false),
  includesBonusContent: z.boolean().default(false),
  bonusContentDescription: z.string().optional(),
});

export const releasesRouter = router({
  // Get all releases for the current artist (dashboard)
  myReleases: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const results = await database.select().from(releases)
      .where(eq(releases.userId, ctx.user.id))
      .orderBy(desc(releases.createdAt));
    return results;
  }),

  // Create a new release
  create: protectedProcedure
    .input(createReleaseInput)
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get artist profile
      const [profile] = await database.select().from(artistProfiles)
        .where(eq(artistProfiles.userId, ctx.user.id))
        .limit(1);
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Artist profile not found' });
      }

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
      });

      const insertId = (result as any)[0].insertId;
      const [created] = await database.select().from(releases).where(eq(releases.id, insertId));
      return created;
    }),

  // Update a release
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(createReleaseInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
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

      await database.update(releases).set(updateData).where(eq(releases.id, id));
      const [updated] = await database.select().from(releases).where(eq(releases.id, id));
      return updated;
    }),

  // Delete a release
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
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
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
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

      return { ...release, artist };
    }),

  // Get all published releases for an artist (public profile)
  getByArtist: publicProcedure
    .input(z.object({ artistProfileId: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const results = await database.select().from(releases)
        .where(and(
          eq(releases.artistProfileId, input.artistProfileId),
          eq(releases.isPublished, true)
        ))
        .orderBy(desc(releases.createdAt));
      return results;
    }),

  // Check if current user has access to a release
  checkAccess: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [release] = await database.select().from(releases)
        .where(eq(releases.id, input.releaseId));
      if (!release) return { hasAccess: false, reason: 'not_found' };

      // Creator always has access to their own releases
      if (release.userId === ctx.user.id) return { hasAccess: true, reason: 'owner' };

      // Free releases are always accessible
      if (release.accessModel === 'free') return { hasAccess: true, reason: 'free' };

      // Check if user has purchased
      const [purchase] = await database.select().from(releasePurchases)
        .where(and(
          eq(releasePurchases.releaseId, input.releaseId),
          eq(releasePurchases.userId, ctx.user.id)
        ));
      if (purchase) return { hasAccess: true, reason: 'purchased' };

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
          if (membership && membership.status === 'active') return { hasAccess: true, reason: 'fan_club_member' };
        }
      }

      return { hasAccess: false, reason: 'payment_required' };
    }),

  // Purchase/unlock a release
  purchase: protectedProcedure
    .input(z.object({
      releaseId: z.number(),
      amount: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [release] = await database.select().from(releases)
        .where(eq(releases.id, input.releaseId));
      if (!release) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Release not found' });
      }

      // Check if already purchased
      const [existingPurchase] = await database.select().from(releasePurchases)
        .where(and(
          eq(releasePurchases.releaseId, input.releaseId),
          eq(releasePurchases.userId, ctx.user.id)
        ));
      if (existingPurchase) {
        return { success: true, alreadyPurchased: true };
      }

      // Validate price
      if (release.accessModel === 'ticketed' || release.accessModel === 'unlock_after_purchase') {
        const requiredPrice = parseFloat(release.price || '0');
        if (input.amount < requiredPrice) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Minimum price is $${requiredPrice}` });
        }
      }
      if (release.accessModel === 'pay_what_you_want') {
        const minPrice = parseFloat(release.minPrice || '0');
        if (input.amount < minPrice) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Minimum price is $${minPrice}` });
        }
      }

      // Record purchase
      await database.insert(releasePurchases).values({
        releaseId: input.releaseId,
        userId: ctx.user.id,
        amountPaid: input.amount.toFixed(2),
      });

      // Update release stats
      await database.update(releases).set({
        purchaseCount: sql`${releases.purchaseCount} + 1`,
        revenue: sql`${releases.revenue} + ${input.amount.toFixed(2)}`,
      }).where(eq(releases.id, input.releaseId));

      return { success: true, alreadyPurchased: false };
    }),

  // Get release options (types, platforms, access models)
  getOptions: publicProcedure.query(() => {
    return {
      releaseTypes: RELEASE_TYPES,
      hostingPlatforms: HOSTING_PLATFORMS,
      accessModels: ACCESS_MODELS,
    };
  }),
});
