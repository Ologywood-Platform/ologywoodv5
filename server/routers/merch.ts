/**
 * Merch / Shop Router
 * Artists: "Merch" — sell physical/digital products
 * Venues: "Shop & Offers" — branded items, gift cards, VIP packages
 * 
 * Tier-gated: Free = 0 items, Starter = 6 items, Professional = 15 items
 * Images: max 2 per item, 2MB each, JPEG/PNG/WebP only
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { merchItems } from "../../drizzle/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { storagePut } from "../storage";
import { getUserSubscription, PRICING_TIERS, type PricingTier } from "../services/pricingTierService";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES_PER_ITEM = 2;

export const merchRouter = router({
  /**
   * List current user's merch items (for management)
   */
  myItems: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const userType = ctx.user.role === "venue" ? "venue" : "artist";
    const items = await db
      .select()
      .from(merchItems)
      .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)))
      .orderBy(asc(merchItems.sortOrder));

    return items;
  }),

  /**
   * Get merch limit info for current user
   */
  getLimitInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const subscription = await getUserSubscription(ctx.user.id);
    const tier = PRICING_TIERS[subscription.tier as PricingTier];
    const userType = ctx.user.role === "venue" ? "venue" : "artist";

    const items = await db
      .select()
      .from(merchItems)
      .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)));

    return {
      currentCount: items.length,
      maxItems: tier.maxMerchItems,
      tierName: tier.name,
      canAdd: items.length < tier.maxMerchItems,
    };
  }),

  /**
   * Create a new merch item
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        priceDisplay: z.string().min(1).max(50),
        externalUrl: z.string().url().max(2048),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check tier limit
      const subscription = await getUserSubscription(ctx.user.id);
      const tier = PRICING_TIERS[subscription.tier as PricingTier];
      const userType = ctx.user.role === "venue" ? "venue" : "artist";

      const existing = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)));

      if (existing.length >= tier.maxMerchItems) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: tier.maxMerchItems === 0
            ? "Merch/Shop is available on Starter and Professional plans. Upgrade to add items."
            : `You've reached your limit of ${tier.maxMerchItems} items. Upgrade to Professional for up to 15 items.`,
        });
      }

      // Get next sort order
      const maxSort = existing.length > 0 ? Math.max(...existing.map((i) => i.sortOrder)) : 0;

      const result = await db.insert(merchItems).values({
        userId: ctx.user.id,
        userType,
        title: input.title,
        description: input.description || null,
        priceDisplay: input.priceDisplay,
        externalUrl: input.externalUrl,
        imageUrls: [],
        sortOrder: maxSort + 1,
      });

      return { success: true, id: (result as any)[0]?.insertId || (result as any).insertId };
    }),

  /**
   * Update a merch item
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(500).optional(),
        priceDisplay: z.string().min(1).max(50).optional(),
        externalUrl: z.string().url().max(2048).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [item] = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.id, input.id), eq(merchItems.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.priceDisplay !== undefined) updates.priceDisplay = input.priceDisplay;
      if (input.externalUrl !== undefined) updates.externalUrl = input.externalUrl;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      await db.update(merchItems).set(updates).where(eq(merchItems.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a merch item
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [item] = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.id, input.id), eq(merchItems.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      await db.delete(merchItems).where(eq(merchItems.id, input.id));

      return { success: true };
    }),

  /**
   * Upload an image for a merch item (max 2 per item, 2MB, JPEG/PNG/WebP)
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        fileData: z.string(), // base64
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only JPEG, PNG, and WebP images are allowed.",
        });
      }

      // Verify ownership
      const [item] = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.id, input.itemId), eq(merchItems.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      // Check image count limit
      const currentImages = (item.imageUrls as string[]) || [];
      if (currentImages.length >= MAX_IMAGES_PER_ITEM) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum ${MAX_IMAGES_PER_ITEM} images per item. Delete an existing image first.`,
        });
      }

      // Decode and validate size
      const base64Data = input.fileData.split(",")[1] || input.fileData;
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image must be under 2MB. Please compress or resize your image.",
        });
      }

      // Upload to S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileExtension = input.fileName.split(".").pop() || "jpg";
      const fileKey = `merch/${ctx.user.id}/${input.itemId}/${timestamp}-${randomSuffix}.${fileExtension}`;

      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Update imageUrls array
      const updatedImages = [...currentImages, url];
      await db.update(merchItems).set({ imageUrls: updatedImages }).where(eq(merchItems.id, input.itemId));

      return { success: true, url, totalImages: updatedImages.length };
    }),

  /**
   * Delete an image from a merch item
   */
  deleteImage: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        imageUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ownership
      const [item] = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.id, input.itemId), eq(merchItems.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      const currentImages = (item.imageUrls as string[]) || [];
      const updatedImages = currentImages.filter((url) => url !== input.imageUrl);

      await db.update(merchItems).set({ imageUrls: updatedImages }).where(eq(merchItems.id, input.itemId));

      return { success: true, totalImages: updatedImages.length };
    }),

  /**
   * Reorder merch items
   */
  reorder: protectedProcedure
    .input(
      z.object({
        itemIds: z.array(z.number().int().positive()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Update sort order for each item
      for (let i = 0; i < input.itemIds.length; i++) {
        await db
          .update(merchItems)
          .set({ sortOrder: i + 1 })
          .where(and(eq(merchItems.id, input.itemIds[i]), eq(merchItems.userId, ctx.user.id)));
      }

      return { success: true };
    }),

  /**
   * Public: Get merch items for a user (for profile display)
   */
  getPublicItems: publicProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        userType: z.enum(["artist", "venue"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const items = await db
        .select()
        .from(merchItems)
        .where(
          and(
            eq(merchItems.userId, input.userId),
            eq(merchItems.userType, input.userType),
            eq(merchItems.isActive, true)
          )
        )
        .orderBy(asc(merchItems.sortOrder));

      return items;
    }),
});
