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

  // ============= TRACK REVIEW ENDPOINTS =============

  /**
   * Get reviews for a release (public).
   * Returns reviews with reviewer info and aggregate stats.
   */
  getReviews: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(async ({ input }) => {
      const [reviews, stats] = await Promise.all([
        db.getReviewsByReleaseId(input.releaseId),
        db.getReleaseReviewStats(input.releaseId),
      ]);

      // Enrich reviews with user info
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          const user = await db.getUserById(review.userId);
          return {
            ...review,
            reviewerName: user?.name || user?.email?.split('@')[0] || 'Anonymous',
          };
        })
      );

      return {
        reviews: enrichedReviews,
        avgRating: Math.round(stats.avgRating * 10) / 10,
        reviewCount: stats.reviewCount,
      };
    }),

  /**
   * Check if the current user can review a release (has purchased + hasn't reviewed yet).
   */
  canReview: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasPurchased = await db.hasUserPurchasedRelease(ctx.user.id, input.releaseId);
      if (!hasPurchased) {
        return { canReview: false, reason: 'purchase_required', existingReview: null };
      }

      const existingReview = await db.getUserReviewForRelease(ctx.user.id, input.releaseId);
      if (existingReview) {
        return { canReview: false, reason: 'already_reviewed', existingReview };
      }

      return { canReview: true, reason: null, existingReview: null };
    }),

  /**
   * Create a review (purchase-gated, one per user per release).
   */
  createReview: protectedProcedure
    .input(
      z.object({
        releaseId: z.number(),
        rating: z.number().int().min(1).max(5),
        reviewText: z.string().max(280).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify purchase
      const hasPurchased = await db.hasUserPurchasedRelease(ctx.user.id, input.releaseId);
      if (!hasPurchased) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must purchase this release before leaving a review.',
        });
      }

      // Check for existing review
      const existing = await db.getUserReviewForRelease(ctx.user.id, input.releaseId);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reviewed this release.',
        });
      }

      const review = await db.createTrackReview({
        releaseId: input.releaseId,
        userId: ctx.user.id,
        rating: input.rating,
        reviewText: input.reviewText,
      });

      return review;
    }),

  /**
   * Update your own review.
   */
  updateReview: protectedProcedure
    .input(
      z.object({
        reviewId: z.number(),
        rating: z.number().int().min(1).max(5).optional(),
        reviewText: z.string().max(280).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await db.getTrackReviewById(input.reviewId);
      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
      }
      if (review.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own reviews' });
      }

      const updateData: { rating?: number; reviewText?: string } = {};
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.reviewText !== undefined) updateData.reviewText = input.reviewText;

      await db.updateTrackReview(input.reviewId, updateData);
      return await db.getTrackReviewById(input.reviewId);
    }),

  /**
   * Delete your own review (or artist can delete reviews on their releases).
   */
  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const review = await db.getTrackReviewById(input.reviewId);
      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
      }

      // Allow deletion by the reviewer or the release artist
      if (review.userId !== ctx.user.id) {
        // Check if the current user is the artist who owns this release
        const profile = await db.getArtistProfileByUserId(ctx.user.id);
        const release = await db.getReleaseById(review.releaseId);
        if (!profile || !release || release.artistId !== profile.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own reviews' });
        }
      }

      await db.deleteTrackReview(input.reviewId);
      return { success: true };
    }),

  /**
   * Get all purchases for the current user (My Purchases page).
   */
  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    const purchases = await db.getUserPurchases(ctx.user.id);
    // Resolve cover art URLs for each release
    const results = await Promise.all(
      purchases.map(async (p) => {
        let coverArtUrl: string | null = null;
        if (p.release?.coverArtKey) {
          try {
            const { url } = await storageGet(p.release.coverArtKey);
            coverArtUrl = url;
          } catch {}
        }
        return {
          id: p.id,
          releaseId: p.releaseId,
          amountPaidCents: p.amountPaidCents,
          downloadCount: p.downloadCount,
          maxDownloads: p.maxDownloads,
          purchasedAt: p.purchasedAt,
          release: p.release ? {
            title: p.release.title,
            artistId: p.release.artistId,
            genre: p.release.genre,
            fileFormat: p.release.fileFormat,
            durationSeconds: p.release.durationSeconds,
            coverArtUrl,
          } : null,
        };
      })
    );
    return results;
  }),

  /**
   * Get purchase details by Stripe session ID (for success page).
   */
  purchaseBySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const purchase = await db.getPurchaseBySessionIdWithRelease(input.sessionId);
      if (!purchase) return null;
      // Verify ownership
      if (purchase.buyerUserId !== ctx.user.id && purchase.buyerEmail?.toLowerCase() !== ctx.user.email?.toLowerCase()) {
        return null;
      }
      let coverArtUrl: string | null = null;
      if (purchase.release?.coverArtKey) {
        try {
          const { url } = await storageGet(purchase.release.coverArtKey);
          coverArtUrl = url;
        } catch {}
      }
      return {
        id: purchase.id,
        releaseId: purchase.releaseId,
        amountPaidCents: purchase.amountPaidCents,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        purchasedAt: purchase.purchasedAt,
        release: purchase.release ? {
          title: purchase.release.title,
          artistId: purchase.release.artistId,
          genre: purchase.release.genre,
          fileFormat: purchase.release.fileFormat,
          durationSeconds: purchase.release.durationSeconds,
          coverArtUrl,
        } : null,
      };
    }),
});
