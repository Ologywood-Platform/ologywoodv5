/**
 * Release Router — White Label Release feature
 * tRPC endpoints for managing single-track releases.
 * Gated behind paid subscription tiers (Starter: 2 active, Professional: unlimited).
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { hasFeatureAccess, canCreateRelease, getUserSubscription, PRICING_TIERS, type PricingTier } from "../services/pricingTierService";
import { sendArtistUpdate } from "../services/artistUpdateService";
import { storageGet } from "../storage";

// Helper to resolve S3 keys to presigned URLs for a release
async function withUrls(release: any) {
  const result = { ...release, coverArtUrl: null as string | null, previewUrl: null as string | null, audioUrl: null as string | null };
  try {
    if (release.coverArtKey) {
      const { url } = await storageGet(release.coverArtKey);
      result.coverArtUrl = url;
    }
    if (release.previewFileKey) {
      const { url } = await storageGet(release.previewFileKey);
      result.previewUrl = url;
    }
    if (release.audioFileKey) {
      const { url } = await storageGet(release.audioFileKey);
      result.audioUrl = url;
    }
  } catch (e) {
    console.error("[Release] Failed to resolve S3 URLs:", e);
  }
  return result;
}

// Helper to check if user is an artist
const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "artist" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Artist access required" });
  }
  return next({ ctx });
});

export const releaseRouter = router({
  /**
   * Check if artist can create a new release (tier gating).
   */
  canCreate: artistProcedure.query(async ({ ctx }) => {
    const hasAccess = await hasFeatureAccess(ctx.user.id, "whiteLabel");
    if (!hasAccess) {
      return {
        allowed: false,
        hasAccess: false,
        message: "Upgrade to Starter or Professional to sell music through White Label Release.",
        maxAllowed: 0,
        currentCount: 0,
      };
    }

    const profile = await db.getArtistProfileByUserId(ctx.user.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
    }

    const activeCount = await db.getActiveReleaseCount(profile.id);
    const result = await canCreateRelease(ctx.user.id, activeCount);
    return { ...result, hasAccess: true };
  }),

  /**
   * Create a new release (draft).
   */
  create: artistProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required").max(255),
        description: z.string().max(2000).optional(),
        genre: z.string().max(100).optional(),
        audioFileKey: z.string().min(1, "Audio file is required"),
        previewFileKey: z.string().optional(),
        coverArtKey: z.string().min(1, "Cover art is required"),
        durationSeconds: z.number().int().nonnegative().default(0),
        fileFormat: z.string().max(10),
        fileSizeBytes: z.number().int().nonnegative().default(0),
        priceInCents: z.number().int().min(50, "Minimum price is $0.50"),
        currency: z.string().default("usd"),
        allowPayWhatYouWant: z.boolean().default(false),
        rightsCertified: z.boolean(),
        rightsCertifiedAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify artist profile
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      // Check tier access
      const hasAccess = await hasFeatureAccess(ctx.user.id, "whiteLabel");
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Upgrade to Starter or Professional to create releases.",
        });
      }

      // Check release limit
      const activeCount = await db.getActiveReleaseCount(profile.id);
      const canCreate = await canCreateRelease(ctx.user.id, activeCount);
      if (!canCreate.allowed) {
        throw new TRPCError({ code: "FORBIDDEN", message: canCreate.reason });
      }

      // Verify rights certification
      if (!input.rightsCertified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must certify that you own the rights to this music.",
        });
      }

      // Check pay-what-you-want is only for Professional tier
      if (input.allowPayWhatYouWant) {
        const hasAdvanced = await hasFeatureAccess(ctx.user.id, "whiteLabelAdvanced");
        if (!hasAdvanced) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Pay-what-you-want pricing is available on the Professional plan.",
          });
        }
      }

      const release = await db.createRelease({
        artistId: profile.id,
        title: input.title,
        description: input.description || null,
        genre: input.genre || null,
        audioFileKey: input.audioFileKey,
        previewFileKey: input.previewFileKey || null,
        coverArtKey: input.coverArtKey,
        durationSeconds: input.durationSeconds,
        fileFormat: input.fileFormat,
        fileSizeBytes: input.fileSizeBytes,
        priceInCents: input.priceInCents,
        currency: input.currency,
        allowPayWhatYouWant: input.allowPayWhatYouWant,
        rightsCertified: true,
        rightsCertifiedAt: new Date(),
        status: "draft",
      });

      return release;
    }),

  /**
   * Update a draft release.
   */
  update: artistProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        genre: z.string().max(100).optional(),
        audioFileKey: z.string().optional(),
        previewFileKey: z.string().optional(),
        coverArtKey: z.string().optional(),
        durationSeconds: z.number().int().positive().optional(),
        fileFormat: z.string().max(10).optional(),
        fileSizeBytes: z.number().int().positive().optional(),
        priceInCents: z.number().int().min(50).optional(),
        allowPayWhatYouWant: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      const release = await db.getReleaseById(input.id);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      if (release.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft releases can be edited. Unpublish first to make changes.",
        });
      }

      // Check pay-what-you-want tier gating
      if (input.allowPayWhatYouWant) {
        const hasAdvanced = await hasFeatureAccess(ctx.user.id, "whiteLabelAdvanced");
        if (!hasAdvanced) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Pay-what-you-want pricing is available on the Professional plan.",
          });
        }
      }

      const { id, ...updateData } = input;
      const updated = await db.updateRelease(id, updateData as any);
      return updated;
    }),

  /**
   * Publish a draft release (makes it visible on profile and purchasable).
   */
  publish: artistProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      const release = await db.getReleaseById(input.id);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      if (release.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft releases can be published.",
        });
      }

      if (!release.rightsCertified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must certify rights before publishing.",
        });
      }

      const updated = await db.updateRelease(input.id, {
        status: "published",
        publishedAt: new Date(),
      });

      // Notify followers about the new release (fire-and-forget)
      try {
        const artistName = profile.artistName || "An artist you follow";
        await sendArtistUpdate(
          ctx.user.id,
          `New Release: ${release.title}`,
          `${artistName} just released a new single "${release.title}"${release.genre ? ` (${release.genre})` : ""}! Check it out on their profile and support their music.\n\nPrice: $${(release.priceInCents / 100).toFixed(2)}`
        );
      } catch (e) {
        // Don't fail the publish if notification fails
        console.error("[Release] Failed to notify followers:", e);
      }

      return updated;
    }),

  /**
   * Unpublish a release (returns to draft, removes from profile).
   */
  unpublish: artistProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      const release = await db.getReleaseById(input.id);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      if (release.status !== "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only published releases can be unpublished.",
        });
      }

      const updated = await db.updateRelease(input.id, {
        status: "draft",
        publishedAt: null,
      });

      return updated;
    }),

  /**
   * Archive a release (soft delete — keeps purchase records intact).
   */
  archive: artistProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      const release = await db.getReleaseById(input.id);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      const updated = await db.updateRelease(input.id, { status: "archived" });
      return updated;
    }),

  /**
   * Delete a draft release (hard delete — only for drafts with no sales).
   */
  delete: artistProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      const release = await db.getReleaseById(input.id);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      if (release.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft releases can be deleted. Archive published releases instead.",
        });
      }

      if (release.totalSales > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a release with existing sales. Archive it instead.",
        });
      }

      await db.deleteRelease(input.id);
      return { success: true };
    }),

  /**
   * Get all releases for the current artist (dashboard view).
   */
  getMyReleases: artistProcedure.query(async ({ ctx }) => {
    const profile = await db.getArtistProfileByUserId(ctx.user.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
    }

    const releases = await db.getReleasesByArtistId(profile.id);
    return await Promise.all(releases.map(withUrls));
  }),

  /**
   * Get a single release by ID (for editing or detail view).
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const release = await db.getReleaseById(input.id);
      if (!release) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }
      return await withUrls(release);
    }),

  /**
   * Get published releases for an artist (public profile view).
   */
  getByArtist: publicProcedure
    .input(z.object({ artistId: z.number() }))
    .query(async ({ input }) => {
      const releases = await db.getPublishedReleasesByArtistId(input.artistId);
      return await Promise.all(releases.map(withUrls));
    }),

  /**
   * Get sales stats for the current artist.
   */
  getSalesStats: artistProcedure.query(async ({ ctx }) => {
    const profile = await db.getArtistProfileByUserId(ctx.user.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
    }

    return await db.getArtistReleaseSalesStats(profile.id);
  }),

  /**
   * Get purchases for a specific release (artist sales view).
   */
  getPurchases: artistProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const profile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found" });
      }

      // Verify the release belongs to this artist
      const release = await db.getReleaseById(input.releaseId);
      if (!release || release.artistId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found" });
      }

      return await db.getPurchasesByReleaseId(input.releaseId);
    }),
});
