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
import { artistProfiles, merchItems, stripeConnectAccounts, venueProfiles } from "../../drizzle/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { storagePut } from "../storage";
import { getUserSubscription, PRICING_TIERS, type PricingTier } from "../services/pricingTierService";
import { ensureMerchItemsSchema } from "../services/merchSchemaService";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES_PER_ITEM = 2;

const variantsSchema = z.array(z.object({
  name: z.string().min(1).max(50),
  options: z.array(z.string().min(1).max(50)).min(1).max(20),
})).max(3).default([]);

const optionalUrlSchema = z.string().url().max(2048).optional().or(z.literal(""));

function toPublicSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

async function assertNativeSellingReady(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [account] = await db.select().from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.artistId, userId)).limit(1);
  if (!account || account.status !== "active" || !account.chargesEnabled || !account.payoutsEnabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Connect and finish setting up payouts before publishing merch sold through OlogyWood.",
    });
  }
}

function validateSellingConfiguration(input: {
  sellingMethod: "ologywood" | "external";
  externalUrl?: string | null;
  priceInCents?: number | null;
  trackInventory: boolean;
  inventoryQuantity?: number | null;
  shippingAvailable: boolean;
  pickupAvailable: boolean;
}) {
  if (input.sellingMethod === "external" && !input.externalUrl?.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Add your external store link, or choose Sell through OlogyWood." });
  }
  if (input.sellingMethod === "ologywood") {
    if (!input.priceInCents || input.priceInCents < 50) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a price of at least $0.50 for OlogyWood checkout." });
    }
    if (!input.shippingAvailable && !input.pickupAvailable) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Choose shipping, local pickup, or both." });
    }
    if (input.trackInventory && input.inventoryQuantity == null) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Enter the available quantity when inventory tracking is enabled." });
    }
  }
}

function normalizeLegacyMerchItem(item: any) {
  return {
    ...item,
    sellingMethod: "external" as const,
    priceInCents: null,
    variants: [],
    trackInventory: false,
    inventoryQuantity: null,
    shippingAvailable: false,
    pickupAvailable: false,
    shippingAmountCents: 0,
    fulfillmentTime: null,
  };
}

export const merchRouter = router({
  /**
   * Public: Get one active merch item with seller context for its shareable page.
   */
  getPublicItem: publicProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      let item: any = null;
      try {
        [item] = await db
          .select()
          .from(merchItems)
          .where(and(eq(merchItems.id, input.itemId), eq(merchItems.isActive, true)))
          .limit(1);
      } catch (error: any) {
        const cause = error?.cause as { code?: string } | undefined;
        if (cause?.code !== "ER_BAD_FIELD_ERROR") throw error;

        const [legacyRows] = await db.execute(sql`
          SELECT id, userId, userType, title, description, priceDisplay,
                 externalUrl, imageUrls, sortOrder, isActive, createdAt, updatedAt
          FROM merch_items
          WHERE id = ${input.itemId} AND isActive = TRUE
          LIMIT 1
        `) as any;
        const legacyItem = (legacyRows as any[])[0];
        if (legacyItem) {
          item = normalizeLegacyMerchItem(legacyItem);
        }
      }

      if (!item) return null;

      if (item.userType === "venue") {
        const [venue] = await db
          .select({
            name: venueProfiles.organizationName,
            profilePhotoUrl: venueProfiles.profilePhotoUrl,
          })
          .from(venueProfiles)
          .where(eq(venueProfiles.userId, item.userId))
          .limit(1);
        const sellerName = venue?.name || "OlogyWood Venue";
        return {
          ...item,
          sellerName,
          sellerProfilePhotoUrl: venue?.profilePhotoUrl || null,
          sellerProfileUrl: `/venue/${toPublicSlug(sellerName)}`,
        };
      }

      const [artist] = await db
        .select({
          name: artistProfiles.artistName,
          profilePhotoUrl: artistProfiles.profilePhotoUrl,
        })
        .from(artistProfiles)
        .where(eq(artistProfiles.userId, item.userId))
        .limit(1);
      const sellerName = artist?.name || "OlogyWood Creator";
      return {
        ...item,
        sellerName,
        sellerProfilePhotoUrl: artist?.profilePhotoUrl || null,
        sellerProfileUrl: `/artist/${toPublicSlug(sellerName)}`,
      };
    }),

  /**
   * List current user's merch items (for management)
   */
  myItems: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await ensureMerchItemsSchema(db);

    const userType = ctx.user.role === "venue" ? "venue" : "artist";
    try {
      return await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)))
        .orderBy(asc(merchItems.sortOrder));
    } catch (error: any) {
      const cause = error?.cause as { code?: string } | undefined;
      if (cause?.code !== "ER_BAD_FIELD_ERROR") throw error;

      const [legacyRows] = await db.execute(sql`
        SELECT id, userId, userType, title, description, priceDisplay,
               externalUrl, imageUrls, sortOrder, isActive, createdAt, updatedAt
        FROM merch_items
        WHERE userId = ${ctx.user.id} AND userType = ${userType}
        ORDER BY sortOrder ASC
      `) as any;

      return (legacyRows as any[]).map(normalizeLegacyMerchItem);
    }
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

    const [catalog] = await db
      .select({ currentCount: sql<number>`COUNT(*)` })
      .from(merchItems)
      .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)));

    const currentCount = Number(catalog?.currentCount ?? 0);

    return {
      currentCount,
      maxItems: tier.maxMerchItems,
      tierName: tier.name,
      canAdd: currentCount < tier.maxMerchItems,
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
        sellingMethod: z.enum(["ologywood", "external"]).default("external"),
        priceDisplay: z.string().max(50).optional(),
        priceInCents: z.number().int().min(50).max(10_000_000).optional(),
        externalUrl: optionalUrlSchema,
        variants: variantsSchema,
        trackInventory: z.boolean().default(false),
        inventoryQuantity: z.number().int().min(0).max(1_000_000).optional(),
        shippingAvailable: z.boolean().default(true),
        pickupAvailable: z.boolean().default(false),
        shippingAmountCents: z.number().int().min(0).max(1_000_000).default(0),
        fulfillmentTime: z.string().max(100).optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await ensureMerchItemsSchema(db);

      // Check tier limit
      const subscription = await getUserSubscription(ctx.user.id);
      const tier = PRICING_TIERS[subscription.tier as PricingTier];
      const userType = ctx.user.role === "venue" ? "venue" : "artist";

      validateSellingConfiguration(input);
      if (input.sellingMethod === "ologywood" && input.isActive) {
        await assertNativeSellingReady(ctx.user.id);
      }

      // First-item creation only needs the current count and highest sort value.
      // Avoid coupling this check to every merchandise column in the schema.
      const [catalog] = await db
        .select({
          currentCount: sql<number>`COUNT(*)`,
          maxSortOrder: sql<number>`COALESCE(MAX(${merchItems.sortOrder}), 0)`,
        })
        .from(merchItems)
        .where(and(eq(merchItems.userId, ctx.user.id), eq(merchItems.userType, userType)));

      const currentCount = Number(catalog?.currentCount ?? 0);

      if (currentCount >= tier.maxMerchItems) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: tier.maxMerchItems === 0
            ? "Merch/Shop is available on Starter and Professional plans. Upgrade to add items."
            : `You've reached your limit of ${tier.maxMerchItems} items. Upgrade to Professional for up to 15 items.`,
        });
      }

      const nextSortOrder = Number(catalog?.maxSortOrder ?? 0) + 1;

      const result = await db.insert(merchItems).values({
        userId: ctx.user.id,
        userType,
        title: input.title,
        description: input.description || null,
        sellingMethod: input.sellingMethod,
        priceDisplay: input.sellingMethod === "ologywood"
          ? `$${((input.priceInCents || 0) / 100).toFixed(2)}`
          : input.priceDisplay?.trim() || "See store",
        priceInCents: input.sellingMethod === "ologywood" ? input.priceInCents : null,
        externalUrl: input.sellingMethod === "external" ? input.externalUrl?.trim() || null : null,
        imageUrls: [],
        variants: input.sellingMethod === "ologywood" ? input.variants : [],
        trackInventory: input.sellingMethod === "ologywood" ? input.trackInventory : false,
        inventoryQuantity: input.sellingMethod === "ologywood" && input.trackInventory ? input.inventoryQuantity : null,
        shippingAvailable: input.sellingMethod === "ologywood" ? input.shippingAvailable : false,
        pickupAvailable: input.sellingMethod === "ologywood" ? input.pickupAvailable : false,
        shippingAmountCents: input.sellingMethod === "ologywood" && input.shippingAvailable ? input.shippingAmountCents : 0,
        fulfillmentTime: input.sellingMethod === "ologywood" ? input.fulfillmentTime?.trim() || null : null,
        sortOrder: nextSortOrder,
        isActive: input.isActive,
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
        sellingMethod: z.enum(["ologywood", "external"]).optional(),
        priceDisplay: z.string().min(1).max(50).optional(),
        priceInCents: z.number().int().min(50).max(10_000_000).optional().nullable(),
        externalUrl: optionalUrlSchema,
        variants: variantsSchema.optional(),
        trackInventory: z.boolean().optional(),
        inventoryQuantity: z.number().int().min(0).max(1_000_000).optional().nullable(),
        shippingAvailable: z.boolean().optional(),
        pickupAvailable: z.boolean().optional(),
        shippingAmountCents: z.number().int().min(0).max(1_000_000).optional(),
        fulfillmentTime: z.string().max(100).optional().nullable(),
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

      const merged = {
        sellingMethod: input.sellingMethod ?? item.sellingMethod,
        externalUrl: input.externalUrl !== undefined ? input.externalUrl : item.externalUrl,
        priceInCents: input.priceInCents !== undefined ? input.priceInCents : item.priceInCents,
        trackInventory: input.trackInventory ?? item.trackInventory,
        inventoryQuantity: input.inventoryQuantity !== undefined ? input.inventoryQuantity : item.inventoryQuantity,
        shippingAvailable: input.shippingAvailable ?? item.shippingAvailable,
        pickupAvailable: input.pickupAvailable ?? item.pickupAvailable,
      };
      validateSellingConfiguration(merged);
      const willBeActive = input.isActive ?? item.isActive;
      if (merged.sellingMethod === "ologywood" && willBeActive) {
        await assertNativeSellingReady(ctx.user.id);
      }

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.sellingMethod !== undefined) updates.sellingMethod = input.sellingMethod;
      if (input.priceDisplay !== undefined) updates.priceDisplay = input.priceDisplay;
      if (input.priceInCents !== undefined) updates.priceInCents = input.priceInCents;
      if (input.externalUrl !== undefined) updates.externalUrl = input.externalUrl.trim() || null;
      if (input.variants !== undefined) updates.variants = input.variants;
      if (input.trackInventory !== undefined) updates.trackInventory = input.trackInventory;
      if (input.inventoryQuantity !== undefined) updates.inventoryQuantity = input.inventoryQuantity;
      if (input.shippingAvailable !== undefined) updates.shippingAvailable = input.shippingAvailable;
      if (input.pickupAvailable !== undefined) updates.pickupAvailable = input.pickupAvailable;
      if (input.shippingAmountCents !== undefined) updates.shippingAmountCents = input.shippingAmountCents;
      if (input.fulfillmentTime !== undefined) updates.fulfillmentTime = input.fulfillmentTime?.trim() || null;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      if (merged.sellingMethod === "ologywood") {
        updates.priceDisplay = `$${((merged.priceInCents || 0) / 100).toFixed(2)}`;
        updates.externalUrl = null;
      } else if (input.sellingMethod === "external") {
        updates.priceInCents = null;
        updates.variants = [];
        updates.trackInventory = false;
        updates.inventoryQuantity = null;
        updates.shippingAvailable = false;
        updates.pickupAvailable = false;
        updates.shippingAmountCents = 0;
        updates.fulfillmentTime = null;
      }

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

      try {
        return await db
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
      } catch (error: any) {
        const cause = error?.cause as { code?: string; message?: string } | undefined;
        if (cause?.code !== 'ER_BAD_FIELD_ERROR') throw error;

        // Backward-compatible read for legacy preview databases. Production uses
        // the full hybrid schema, but old items should remain publicly visible
        // while a preview environment is awaiting its managed schema refresh.
        const [legacyRows] = await db.execute(sql`
          SELECT id, userId, userType, title, description, priceDisplay,
                 externalUrl, imageUrls, sortOrder, isActive, createdAt, updatedAt
          FROM merch_items
          WHERE userId = ${input.userId}
            AND userType = ${input.userType}
            AND isActive = TRUE
          ORDER BY sortOrder ASC
        `) as any;

        return (legacyRows as any[]).map(normalizeLegacyMerchItem);
      }
    }),
});
