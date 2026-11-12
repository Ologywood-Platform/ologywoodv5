import { getDefaultStripeApiKey } from '../services/stripeWebhookMode';
import Stripe from 'stripe';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import * as email from '../email';
import {
  calculateMerchOrderAmounts,
  canTransitionMerchOrder,
  createMerchOrderNumber,
  getInvalidMerchVariant,
} from '../utils/merchCommerce';
import {
  bookDownloadAccess,
  merchItems,
  merchOrderItems,
  merchOrders,
  stripeConnectAccounts,
} from '../../drizzle/schema';
import { isEbook } from '../../shared/bookCommerce';
import { ensureMerchItemsSchema } from '../services/merchSchemaService';
import { createPurchaseFanEmailOptInMetadata } from '../services/purchaseFanEmailService';

const stripe = new Stripe(getDefaultStripeApiKey(), {
  apiVersion: '2025-12-15.clover',
});

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(30),
  country: z.string().trim().min(2).max(120),
}).strict();

const selectedVariantsSchema = z.record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(50))
  .refine((variants) => Object.keys(variants).length <= 3, 'Too many selected variants')
  .default({});

const orderStatusSchema = z.enum([
  'new',
  'confirmed',
  'preparing',
  'shipped',
  'ready_for_pickup',
  'completed',
  'cancelled',
]);

const expectedFulfillmentDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, 'Expected fulfillment date must be a valid calendar date.');

const sellerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'venue') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Seller access required' });
  }
  return next({ ctx });
});

function isLegacyMerchSchemaError(error: unknown): boolean {
  const cause = (error as any)?.cause as { code?: string } | undefined;
  return cause?.code === 'ER_NO_SUCH_TABLE' || cause?.code === 'ER_BAD_FIELD_ERROR';
}

async function getSellerPayoutAccount(sellerUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

  const [account] = await db
    .select()
    .from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.artistId, sellerUserId))
    .limit(1);

  if (!account || account.status !== 'active' || !account.chargesEnabled || !account.payoutsEnabled) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'This creator is not ready to accept payments yet. Please try again later.',
    });
  }

  try {
    const liveAccount = await stripe.accounts.retrieve(account.stripeAccountId);
    if (!liveAccount.charges_enabled || !liveAccount.payouts_enabled) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'This creator is still completing payment setup. Please try again later.',
      });
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'The creator payment account could not be verified. Please try again later.',
    });
  }

  return account;
}

export const merchOrdersRouter = router({
  /** Create a Stripe Checkout session for one native OlogyWood merch item. */
  createCheckout: publicProcedure
    .input(z.object({
      merchItemId: z.number().int().safe().positive(),
      quantity: z.number().int().min(1).max(10).default(1),
      selectedVariants: selectedVariantsSchema,
      buyerName: z.string().trim().min(1).max(255),
      buyerEmail: z.string().trim().email().max(320),
      buyerPhone: z.string().trim().max(30).optional(),
      fulfillmentMethod: z.enum(['shipping', 'pickup', 'digital']),
      shippingAddress: addressSchema.optional(),
      customerNote: z.string().trim().max(500).optional(),
      fanEmailOptIn: z.boolean().default(false),
      preorderDateAcknowledged: z.boolean().default(false),
      fulfillmentDateUpdatesOptIn: z.boolean().default(false),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      await ensureMerchItemsSchema(db);

      const [item] = await db
        .select()
        .from(merchItems)
        .where(and(eq(merchItems.id, input.merchItemId), eq(merchItems.isActive, true)))
        .limit(1);

      if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Merch item not found' });
      if (item.sellingMethod !== 'ologywood' || !item.priceInCents || item.priceInCents < 50) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This item is not available for OlogyWood checkout.' });
      }
      const unitPriceCents = item.priceInCents;
      const digitalDelivery = item.productCategory === 'book' && isEbook(item.bookFormat);
      if (digitalDelivery && (!item.ebookFileKey || !item.ebookRightsConfirmed)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This eBook is not ready for purchase yet.' });
      }
      if (digitalDelivery && !ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in before purchasing an eBook so your secure access can be attached to your account.' });
      }
      if (!digitalDelivery && item.isPreOrder && !input.preorderDateAcknowledged) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Please acknowledge that the preorder estimate may change before continuing.' });
      }
      if (ctx.user?.id === item.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot purchase your own product.' });
      }

      const variants = (item.variants || []) as Array<{ name: string; options: string[] }>;
      const invalidVariant = digitalDelivery ? null : getInvalidMerchVariant(variants, input.selectedVariants);
      if (invalidVariant) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Please choose a valid ${invalidVariant}.` });
      }

      if (digitalDelivery) {
        if (input.fulfillmentMethod !== 'digital') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'eBooks use secure digital delivery.' });
        }
        if (input.quantity !== 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'eBooks can be purchased one at a time.' });
        }
      } else if (input.fulfillmentMethod === 'digital') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Choose shipping or pickup for this physical item.' });
      } else if (input.fulfillmentMethod === 'shipping') {
        if (!item.shippingAvailable) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Shipping is not available for this item.' });
        }
        if (!input.shippingAddress) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A shipping address is required.' });
        }
      } else if (!item.pickupAvailable) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pickup is not available for this item.' });
      }

      if (!digitalDelivery && item.trackInventory && (item.inventoryQuantity ?? 0) < input.quantity) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This item does not have enough inventory for that quantity.' });
      }

      const payoutAccount = await getSellerPayoutAccount(item.userId);
      const { subtotalCents, shippingCents, totalCents, platformFeeCents, sellerNetCents } = calculateMerchOrderAmounts({
        priceInCents: unitPriceCents,
        quantity: input.quantity,
        shippingAmountCents: item.shippingAmountCents,
        fulfillmentMethod: digitalDelivery ? 'digital' : input.fulfillmentMethod,
      });
      const orderNumber = createMerchOrderNumber();

      let orderId = 0;
      await db.transaction(async (tx) => {
        const insertResult = await tx.insert(merchOrders).values({
          orderNumber,
          sellerUserId: item.userId,
          sellerType: item.userType,
          buyerUserId: ctx.user?.id || null,
          buyerEmail: input.buyerEmail.toLowerCase(),
          buyerName: input.buyerName.trim(),
          buyerPhone: input.buyerPhone?.trim() || null,
          fulfillmentMethod: digitalDelivery ? 'digital' : input.fulfillmentMethod,
          expectedFulfillmentDate: !digitalDelivery && item.isPreOrder ? item.expectedFulfillmentDate || null : null,
          preorderDateAcknowledged: !digitalDelivery && item.isPreOrder && input.preorderDateAcknowledged,
          fulfillmentDateUpdatesOptIn: !digitalDelivery && item.isPreOrder && input.fulfillmentDateUpdatesOptIn,
          shippingAddress: !digitalDelivery && input.fulfillmentMethod === 'shipping' ? input.shippingAddress : null,
          paymentStatus: 'pending',
          status: 'new',
          subtotalCents,
          shippingCents,
          totalCents,
          platformFeeCents,
          sellerNetCents,
          customerNote: input.customerNote?.trim() || null,
        });
        orderId = Number((insertResult as any)[0]?.insertId || (insertResult as any).insertId);
        if (!orderId) throw new Error('Failed to create merch order');

        await tx.insert(merchOrderItems).values({
          orderId,
          merchItemId: item.id,
          title: item.title,
          imageUrl: item.imageUrls?.[0] || null,
          selectedVariants: digitalDelivery ? {} : input.selectedVariants,
          quantity: input.quantity,
          unitPriceCents,
          lineTotalCents: subtotalCents,
        });
      });

      const baseUrl = process.env.BASE_URL || 'https://www.ologywood.com';
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        quantity: digitalDelivery ? 1 : input.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: unitPriceCents,
          product_data: {
            name: item.title,
            description: item.description?.slice(0, 500) || undefined,
            images: item.imageUrls?.[0] ? [item.imageUrls[0]] : undefined,
            metadata: {
              merchItemId: String(item.id),
              productCategory: item.productCategory,
              bookFormat: item.bookFormat || '',
            },
          },
        },
      }];

      if (shippingCents > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: shippingCents,
            product_data: { name: 'Shipping' },
          },
        });
      }

      const fanEmailMetadata = await createPurchaseFanEmailOptInMetadata({
        creatorUserId: item.userType === 'artist' ? item.userId : null,
        buyerUserId: ctx.user?.id,
        optIn: item.userType === 'artist' && input.fanEmailOptIn === true,
        purchaseId: `merch:${orderId}`,
      });
      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: input.buyerEmail.toLowerCase(),
          line_items: lineItems,
          phone_number_collection: { enabled: true },
          billing_address_collection: 'auto',
          success_url: `${baseUrl}/merch-orders/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/merch-orders?checkout=cancelled`,
          metadata: {
            type: 'merch_purchase',
            orderId: String(orderId),
            orderNumber,
            sellerUserId: String(item.userId),
            merchItemId: String(item.id),
            buyerUserId: String(ctx.user?.id || ''),
            ...fanEmailMetadata,
          },
          payment_intent_data: {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: payoutAccount.stripeAccountId },
            metadata: {
              type: 'merch_purchase',
              orderId: String(orderId),
              orderNumber,
              buyerUserId: String(ctx.user?.id || ''),
              ...fanEmailMetadata,
            },
          },
        }, { idempotencyKey: `merch_checkout_${orderNumber}` });

        await db
          .update(merchOrders)
          .set({ stripeCheckoutSessionId: session.id })
          .where(eq(merchOrders.id, orderId));

        return { checkoutUrl: session.url, orderNumber };
      } catch (error) {
        await db.transaction(async (tx) => {
          await tx.delete(merchOrderItems).where(eq(merchOrderItems.orderId, orderId));
          await tx.delete(merchOrders).where(eq(merchOrders.id, orderId));
        });
        console.error('[Merch Checkout] Failed to create Stripe session:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to start checkout. Please try again.' });
      }
    }),

  /** Limited success-page data, accessible only with the unguessable Stripe session ID. */
  getCheckoutResult: publicProcedure
    .input(z.object({ sessionId: z.string().trim().max(255).regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/, 'Invalid Stripe checkout session ID') }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      let order;
      try {
        [order] = await db.select().from(merchOrders)
          .where(eq(merchOrders.stripeCheckoutSessionId, input.sessionId)).limit(1);
      } catch (error) {
        if (isLegacyMerchSchemaError(error)) return null;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load checkout result.' });
      }
      if (!order) return null;
      let items;
      try {
        items = await db.select().from(merchOrderItems)
          .where(eq(merchOrderItems.orderId, order.id));
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load checkout items.' });
      }
      return {
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
        totalCents: order.totalCents,
        fulfillmentMethod: order.fulfillmentMethod,
        items: items.map((item) => ({
          title: item.title,
          imageUrl: item.imageUrl,
          selectedVariants: item.selectedVariants,
          quantity: item.quantity,
        })),
      };
    }),

  /** Authenticated buyer order history. */
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    await ensureMerchItemsSchema(db);
    let orders;
    try {
      orders = await db.select().from(merchOrders)
        .where(eq(merchOrders.buyerUserId, ctx.user.id)).orderBy(desc(merchOrders.createdAt));
    } catch (error) {
      if (isLegacyMerchSchemaError(error)) return [];
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load your merch orders.' });
    }
    const result = [];
    for (const order of orders) {
      const items = await db.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
      const accessRecords = order.paymentStatus === 'paid'
        ? await db.select({
            id: bookDownloadAccess.id,
            orderItemId: bookDownloadAccess.orderItemId,
            downloadCount: bookDownloadAccess.downloadCount,
            maxDownloads: bookDownloadAccess.maxDownloads,
          }).from(bookDownloadAccess).where(eq(bookDownloadAccess.orderId, order.id))
        : [];
      result.push({
        ...order,
        items: items.map((item) => ({
          ...item,
          downloadAccess: accessRecords.find((access) => access.orderItemId === item.id) || null,
        })),
      });
    }
    return result;
  }),

  /** Creator order-management list. */
  sellerOrders: sellerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    let orders;
    try {
      orders = await db.select().from(merchOrders)
        .where(and(
          eq(merchOrders.sellerUserId, ctx.user.id),
          inArray(merchOrders.paymentStatus, ['paid', 'refunded']),
        ))
        .orderBy(desc(merchOrders.createdAt));
    } catch (error) {
      if (isLegacyMerchSchemaError(error)) return [];
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unable to load seller orders.' });
    }
    const result = [];
    for (const order of orders) {
      const items = await db.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
      result.push({ ...order, items });
    }
    return result;
  }),

  /** Creator fulfillment updates with guarded status transitions. */
  updateFulfillment: sellerProcedure
    .input(z.object({
      orderId: z.number().int().safe().positive(),
      status: orderStatusSchema,
      expectedFulfillmentDate: expectedFulfillmentDateSchema.optional().nullable(),
      trackingNumber: z.string().trim().max(255).optional(),
      trackingCarrier: z.string().trim().max(100).optional(),
      trackingUrl: z.string().url().max(2048).optional().or(z.literal('')),
      pickupNotes: z.string().trim().max(1000).optional(),
      fulfillmentNotes: z.string().trim().max(1000).optional(),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const [order] = await db.select().from(merchOrders)
        .where(and(eq(merchOrders.id, input.orderId), eq(merchOrders.sellerUserId, ctx.user.id))).limit(1);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      if (order.paymentStatus !== 'paid') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only paid orders can be fulfilled.' });
      }
      const dateChanged = input.expectedFulfillmentDate !== undefined && input.expectedFulfillmentDate !== order.expectedFulfillmentDate;
      if (input.status !== order.status && !canTransitionMerchOrder(order.status, input.status, order.fulfillmentMethod)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Order cannot move from ${order.status} to ${input.status}.` });
      }
      if (input.status === order.status && !dateChanged) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Choose a new status or expected fulfillment date.' });
      }
      if (input.status === 'ready_for_pickup' && !input.pickupNotes?.trim() && !order.pickupNotes) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add pickup details so the buyer knows where and when to collect the order.' });
      }

      await db.update(merchOrders).set({
        status: input.status,
        expectedFulfillmentDate: input.expectedFulfillmentDate === undefined ? order.expectedFulfillmentDate : input.expectedFulfillmentDate,
        trackingNumber: input.trackingNumber?.trim() || order.trackingNumber,
        trackingCarrier: input.trackingCarrier?.trim() || order.trackingCarrier,
        trackingUrl: input.trackingUrl?.trim() || order.trackingUrl,
        pickupNotes: input.pickupNotes?.trim() || order.pickupNotes,
        fulfillmentNotes: input.fulfillmentNotes?.trim() || order.fulfillmentNotes,
        fulfilledAt: input.status === 'completed' ? new Date() : order.fulfilledAt,
      }).where(eq(merchOrders.id, order.id));

      if (input.status !== order.status || (dateChanged && order.fulfillmentDateUpdatesOptIn)) {
        try {
          await email.sendMerchOrderStatusEmail({
            buyerEmail: order.buyerEmail,
            buyerName: order.buyerName,
            orderNumber: order.orderNumber,
            status: input.status,
            trackingNumber: input.trackingNumber?.trim() || order.trackingNumber,
            trackingCarrier: input.trackingCarrier?.trim() || order.trackingCarrier,
            trackingUrl: input.trackingUrl?.trim() || order.trackingUrl,
            pickupNotes: input.pickupNotes?.trim() || order.pickupNotes,
            fulfillmentNotes: input.fulfillmentNotes?.trim() || order.fulfillmentNotes,
            expectedFulfillmentDate: input.expectedFulfillmentDate === undefined ? order.expectedFulfillmentDate : input.expectedFulfillmentDate,
            dateUpdate: dateChanged && order.fulfillmentDateUpdatesOptIn,
          });
        } catch (error) {
          console.error('[Merch Orders] Failed to send status email:', { kind: error instanceof Error ? error.name : 'UnknownError' });
        }
      }

      return { success: true };
    }),
});
