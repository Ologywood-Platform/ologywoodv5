import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sponsorSlots, sponsorAnalytics, mediaKits, artistProfiles } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import { getUserSubscription } from "../services/pricingTierService";
import type { SponsorSlot, SponsorAnalytic, MediaKit } from "../../drizzle/schema";

const MAX_SPONSOR_SLOTS = 5;
const safeId = z.number().int().safe().positive();
const sponsorUrl = z.string().trim().url().max(512).refine((value) => /^https?:\/\//i.test(value), 'Only HTTP(S) URLs are allowed');
const sponsorDate = z.string().trim().min(1).max(40).refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date');
const optionalSponsorDate = sponsorDate.optional().nullable();

function validateDateRange(startDate?: string | null, endDate?: string | null) {
  if (startDate && endDate && new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sponsor end date must be on or after the start date.' });
  }
}

/**
 * Verify the user has an enterprise subscription
 */
async function requireEnterprise(userId: number) {
  const subscription = await getUserSubscription(userId);
  if (subscription.tier !== 'enterprise') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Enterprise subscription required. Upgrade to Enterprise to access Sponsor features.',
    });
  }
}

export const sponsorRouter = router({
  // ─── SPONSOR SLOTS CRUD ───────────────────────────────────────────

  /**
   * Get all sponsor slots for the current artist
   */
  getMySponsors: protectedProcedure.query(async ({ ctx }) => {
    await requireEnterprise(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const slots = await db
      .select()
      .from(sponsorSlots)
      .where(eq(sponsorSlots.artistId, ctx.user.id))
      .orderBy(sponsorSlots.displayOrder);

    return slots;
  }),

  /**
   * Get active sponsors for a public artist profile (no auth required)
   */
  getPublicSponsors: publicProcedure
    .input(z.object({ artistId: safeId }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const slots = await db
        .select({
          id: sponsorSlots.id,
          sponsorName: sponsorSlots.sponsorName,
          sponsorLogoUrl: sponsorSlots.sponsorLogoUrl,
          sponsorWebsite: sponsorSlots.sponsorWebsite,
          sponsorDescription: sponsorSlots.sponsorDescription,
          displayOrder: sponsorSlots.displayOrder,
        })
        .from(sponsorSlots)
        .where(and(
          eq(sponsorSlots.artistId, input.artistId),
          eq(sponsorSlots.isActive, true),
        ))
        .orderBy(sponsorSlots.displayOrder);

      return slots;
    }),

  /**
   * Get active sponsors by artist profile ID (for event pages where we have profileId not userId)
   */
  getPublicSponsorsByProfileId: publicProcedure
    .input(z.object({ profileId: safeId }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Resolve profile ID to user ID
      const [profile] = await db
        .select({ userId: artistProfiles.userId })
        .from(artistProfiles)
        .where(eq(artistProfiles.id, input.profileId))
        .limit(1);

      if (!profile) return [];

      const slots = await db
        .select({
          id: sponsorSlots.id,
          sponsorName: sponsorSlots.sponsorName,
          sponsorLogoUrl: sponsorSlots.sponsorLogoUrl,
          sponsorWebsite: sponsorSlots.sponsorWebsite,
          sponsorDescription: sponsorSlots.sponsorDescription,
          displayOrder: sponsorSlots.displayOrder,
        })
        .from(sponsorSlots)
        .where(and(
          eq(sponsorSlots.artistId, profile.userId),
          eq(sponsorSlots.isActive, true),
        ))
        .orderBy(sponsorSlots.displayOrder);

      return slots;
    }),

  /**
   * Create a new sponsor slot
   */
  create: protectedProcedure
    .input(z.object({
      sponsorName: z.string().trim().min(1).max(200),
      sponsorLogoUrl: sponsorUrl,
      sponsorWebsite: sponsorUrl.optional(),
      sponsorDescription: z.string().trim().max(500).optional(),
      startDate: sponsorDate.optional(),
      endDate: sponsorDate.optional(),
    }).strict().superRefine((value, ctx) => {
      if (value.startDate && value.endDate && new Date(value.startDate).getTime() > new Date(value.endDate).getTime()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Sponsor end date must be on or after the start date.' });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      validateDateRange(input.startDate, input.endDate);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Check slot limit
      const existing = await db
        .select({ count: count() })
        .from(sponsorSlots)
        .where(eq(sponsorSlots.artistId, ctx.user.id));

      if ((existing[0]?.count || 0) >= MAX_SPONSOR_SLOTS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum ${MAX_SPONSOR_SLOTS} sponsor slots allowed. Remove an existing sponsor to add a new one.`,
        });
      }

      // Get next display order
      const maxOrder = await db
        .select({ max: sql<number>`COALESCE(MAX(${sponsorSlots.displayOrder}), 0)` })
        .from(sponsorSlots)
        .where(eq(sponsorSlots.artistId, ctx.user.id));

      const result = await db.insert(sponsorSlots).values({
        artistId: ctx.user.id,
        sponsorName: input.sponsorName,
        sponsorLogoUrl: input.sponsorLogoUrl,
        sponsorWebsite: input.sponsorWebsite || null,
        sponsorDescription: input.sponsorDescription || null,
        displayOrder: (maxOrder[0]?.max || 0) + 1,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      });

      return { id: result[0].insertId, message: 'Sponsor added successfully' };
    }),

  /**
   * Update a sponsor slot
   */
  update: protectedProcedure
    .input(z.object({
      id: safeId,
      sponsorName: z.string().trim().min(1).max(200).optional(),
      sponsorLogoUrl: sponsorUrl.optional(),
      sponsorWebsite: sponsorUrl.optional().nullable(),
      sponsorDescription: z.string().trim().max(500).optional().nullable(),
      isActive: z.boolean().optional(),
      displayOrder: z.number().int().min(1).max(MAX_SPONSOR_SLOTS).optional(),
      startDate: optionalSponsorDate,
      endDate: optionalSponsorDate,
    }).strict().superRefine((value, ctx) => {
      if (value.startDate && value.endDate && new Date(value.startDate).getTime() > new Date(value.endDate).getTime()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Sponsor end date must be on or after the start date.' });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      validateDateRange(input.startDate, input.endDate);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify ownership
      const existing = await db
        .select()
        .from(sponsorSlots)
        .where(and(eq(sponsorSlots.id, input.id), eq(sponsorSlots.artistId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sponsor not found' });
      }

      const updateData: any = {};
      if (input.sponsorName !== undefined) updateData.sponsorName = input.sponsorName;
      if (input.sponsorLogoUrl !== undefined) updateData.sponsorLogoUrl = input.sponsorLogoUrl;
      if (input.sponsorWebsite !== undefined) updateData.sponsorWebsite = input.sponsorWebsite;
      if (input.sponsorDescription !== undefined) updateData.sponsorDescription = input.sponsorDescription;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
      if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate) : null;
      if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;

      await db.update(sponsorSlots)
        .set(updateData)
        .where(eq(sponsorSlots.id, input.id));

      return { message: 'Sponsor updated successfully' };
    }),

  /**
   * Delete a sponsor slot
   */
  delete: protectedProcedure
    .input(z.object({ id: safeId }).strict())
    .mutation(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Verify ownership
      const existing = await db
        .select()
        .from(sponsorSlots)
        .where(and(eq(sponsorSlots.id, input.id), eq(sponsorSlots.artistId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sponsor not found' });
      }

      // Delete analytics for this slot
      await db.delete(sponsorAnalytics).where(eq(sponsorAnalytics.sponsorSlotId, input.id));
      // Delete the slot
      await db.delete(sponsorSlots).where(eq(sponsorSlots.id, input.id));

      return { message: 'Sponsor removed successfully' };
    }),

  /**
   * Reorder sponsor slots
   */
  reorder: protectedProcedure
    .input(z.object({
      orderedIds: z.array(safeId).max(MAX_SPONSOR_SLOTS).refine((ids) => new Set(ids).size === ids.length, 'Duplicate sponsor IDs are not allowed'),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Update each slot's display order
      for (let i = 0; i < input.orderedIds.length; i++) {
        await db.update(sponsorSlots)
          .set({ displayOrder: i + 1 })
          .where(and(eq(sponsorSlots.id, input.orderedIds[i]), eq(sponsorSlots.artistId, ctx.user.id)));
      }

      return { message: 'Sponsors reordered successfully' };
    }),

  // ─── SPONSOR ANALYTICS ────────────────────────────────────────────

  /**
   * Record a sponsor impression or click (public, called from profile views)
   */
  trackEvent: publicProcedure
    .input(z.object({
      sponsorSlotId: safeId,
      artistId: safeId.optional(),
      artistProfileId: safeId.optional(),
      eventType: z.enum(['impression', 'click']),
      source: z.enum(['profile', 'event', 'ticket_confirmation', 'media_kit']).default('profile'),
    }).strict().refine((value) => Boolean(value.artistId) !== Boolean(value.artistProfileId), 'Provide exactly one artist identifier'))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const artistId = input.artistId ?? (await db
        .select({ userId: artistProfiles.userId })
        .from(artistProfiles)
        .where(eq(artistProfiles.id, input.artistProfileId!))
        .limit(1))[0]?.userId;
      if (!artistId) return { success: false };

      const [slot] = await db
        .select({ id: sponsorSlots.id })
        .from(sponsorSlots)
        .where(and(
          eq(sponsorSlots.id, input.sponsorSlotId),
          eq(sponsorSlots.artistId, artistId),
          eq(sponsorSlots.isActive, true),
        ))
        .limit(1);
      if (!slot) return { success: false };

      await db.insert(sponsorAnalytics).values({
        sponsorSlotId: input.sponsorSlotId,
        artistId,
        eventType: input.eventType,
        source: input.source,
      });

      return { success: true };
    }),

  /**
   * Get sponsor analytics summary for the current artist
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      days: z.number().int().min(1).max(365).optional().default(30),
    }).strict())
    .query(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get per-sponsor stats
      const stats = await db
        .select({
          sponsorSlotId: sponsorAnalytics.sponsorSlotId,
          eventType: sponsorAnalytics.eventType,
          count: count(),
        })
        .from(sponsorAnalytics)
        .where(and(
          eq(sponsorAnalytics.artistId, ctx.user.id),
          gte(sponsorAnalytics.eventDate, startDate),
        ))
        .groupBy(sponsorAnalytics.sponsorSlotId, sponsorAnalytics.eventType);

      // Get sponsor names for the stats
      const slots = await db
        .select({ id: sponsorSlots.id, sponsorName: sponsorSlots.sponsorName, sponsorLogoUrl: sponsorSlots.sponsorLogoUrl })
        .from(sponsorSlots)
        .where(eq(sponsorSlots.artistId, ctx.user.id));

      // Aggregate into a clean response
      const sponsorStats = slots.map(slot => {
        const impressions = stats.find(s => s.sponsorSlotId === slot.id && s.eventType === 'impression')?.count || 0;
        const clicks = stats.find(s => s.sponsorSlotId === slot.id && s.eventType === 'click')?.count || 0;
        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';
        return {
          sponsorId: slot.id,
          sponsorName: slot.sponsorName,
          sponsorLogoUrl: slot.sponsorLogoUrl,
          impressions,
          clicks,
          ctr: parseFloat(ctr),
        };
      });

      const totalImpressions = sponsorStats.reduce((sum, s) => sum + s.impressions, 0);
      const totalClicks = sponsorStats.reduce((sum, s) => sum + s.clicks, 0);
      const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

      return {
        period: `${input.days} days`,
        totalImpressions,
        totalClicks,
        overallCtr: parseFloat(overallCtr),
        sponsors: sponsorStats,
      };
    }),

  // ─── MEDIA KIT ────────────────────────────────────────────────────

  /**
   * Get or create media kit for the current artist
   */
  getMyMediaKit: protectedProcedure.query(async ({ ctx }) => {
    await requireEnterprise(ctx.user.id);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    const existing = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.artistId, ctx.user.id))
      .limit(1);

    if (existing.length > 0) return existing[0];

    // Auto-create a blank media kit
    await db.insert(mediaKits).values({
      artistId: ctx.user.id,
      isPublic: false,
    });

    const created = await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.artistId, ctx.user.id))
      .limit(1);

    return created[0] || null;
  }),

  /**
   * Get public media kit for an artist (if they've made it public)
   */
  getPublicMediaKit: publicProcedure
    .input(z.object({ artistId: safeId }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const kit = await db
        .select()
        .from(mediaKits)
        .where(and(eq(mediaKits.artistId, input.artistId), eq(mediaKits.isPublic, true)))
        .limit(1);

      return kit[0] || null;
    }),

  /**
   * Update media kit
   */
  updateMediaKit: protectedProcedure
    .input(z.object({
      bio: z.string().trim().max(2000).optional().nullable(),
      pressPhotos: z.array(sponsorUrl).max(10).optional(),
      socialStats: z.array(z.object({
        platform: z.string().trim().min(1).max(50),
        followers: z.number().int().min(0).max(2_000_000_000),
        url: sponsorUrl,
      }).strict()).max(10).optional(),
      achievements: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
      genres: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
      monthlyListeners: z.number().int().min(0).max(2_000_000_000).optional().nullable(),
      totalStreams: z.number().int().min(0).max(2_000_000_000).optional().nullable(),
      averageEventAttendance: z.number().int().min(0).max(2_000_000_000).optional().nullable(),
      contactEmail: z.string().trim().email().max(320).optional().nullable(),
      managementContact: z.string().trim().max(320).optional().nullable(),
      bookingContact: z.string().trim().max(320).optional().nullable(),
      isPublic: z.boolean().optional(),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      await requireEnterprise(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const updateData: any = { lastGeneratedAt: new Date() };
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.pressPhotos !== undefined) updateData.pressPhotos = input.pressPhotos;
      if (input.socialStats !== undefined) updateData.socialStats = input.socialStats;
      if (input.achievements !== undefined) updateData.achievements = input.achievements;
      if (input.genres !== undefined) updateData.genres = input.genres;
      if (input.monthlyListeners !== undefined) updateData.monthlyListeners = input.monthlyListeners;
      if (input.totalStreams !== undefined) updateData.totalStreams = input.totalStreams;
      if (input.averageEventAttendance !== undefined) updateData.averageEventAttendance = input.averageEventAttendance;
      if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
      if (input.managementContact !== undefined) updateData.managementContact = input.managementContact;
      if (input.bookingContact !== undefined) updateData.bookingContact = input.bookingContact;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

      await db.update(mediaKits)
        .set(updateData)
        .where(eq(mediaKits.artistId, ctx.user.id));

      return { message: 'Media kit updated successfully' };
    }),
});
