import Stripe from 'stripe';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
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
  merchItems,
  merchOrderItems,
  merchOrders,
  stripeConnectAccounts,
} from '../../drizzle/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const addressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(30),
  country: z.string().min(2).max(120),
});

const selectedVariantsSchema = z.record(z.string(), z.string()).default({});

const orderStatusSchema = z.enum([
  'new',
  'confirmed',
  'preparing',
  'shipped',
  'ready_for_pickup',
  'completed',
  'cancelled',
]);

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
      merchItemId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(10).default(1),
      selectedVariants: selectedVariantsSchema,
      buyerName: z.string().min(1).max(255),
      buyerEmail: z.string().email().max(320),
      buyerPhone: z.string().max(30).optional(),
      fulfillmentMethod: z.enum(['shipping', 'pickup']),
      shippingAddress: addressSchema.optional(),
      customerNote: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

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
      if (ctx.user?.id === item.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot purchase your own merch item.' });
      }

      const variants = (item.variants || []) as Array<{ name: string; options: string[] }>;
      const invalidVariant = getInvalidMerchVariant(variants, input.selectedVariants);
      if (invalidVariant) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Please choose a valid ${invalidVariant}.` });
      }

      if (input.fulfillmentMethod === 'shipping') {
        if (!item.shippingAvailable) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Shipping is not available for this item.' });
        }
        if (!input.shippingAddress) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A shipping address is required.' });
        }
      } else if (!item.pickupAvailable) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pickup is not available for this item.' });
      }

      if (item.trackInventory && (item.inventoryQuantity ?? 0) < input.quantity) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This item does not have enough inventory for that quantity.' });
      }

      const payoutAccount = await getSellerPayoutAccount(item.userId);
      const { subtotalCents, shippingCents, totalCents, platformFeeCents, sellerNetCents } = calculateMerchOrderAmounts({
        priceInCents: unitPriceCents,
        quantity: input.quantity,
        shippingAmountCents: item.shippingAmountCents,
        fulfillmentMethod: input.fulfillmentMethod,
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
          fulfillmentMethod: input.fulfillmentMethod,
          shippingAddress: input.fulfillmentMethod === 'shipping' ? input.shippingAddress : null,
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
          selectedVariants: input.selectedVariants,
          quantity: input.quantity,
          unitPriceCents,
          lineTotalCents: subtotalCents,
        });
      });

      const baseUrl = process.env.BASE_URL || 'https://www.ologywood.com';
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
        quantity: input.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: unitPriceCents,
          product_data: {
            name: item.title,
            description: item.description?.slice(0, 500) || undefined,
            images: item.imageUrls?.[0] ? [item.imageUrls[0]] : undefined,
            metadata: { merchItemId: String(item.id) },
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
          },
          payment_intent_data: {
            application_fee_amount: platformFeeCents,
            transfer_data: { destination: payoutAccount.stripeAccountId },
            metadata: {
              type: 'merch_purchase',
              orderId: String(orderId),
              orderNumber,
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
    .input(z.object({ sessionId: z.string().min(10).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const [order] = await db.select().from(merchOrders)
        .where(eq(merchOrders.stripeCheckoutSessionId, input.sessionId)).limit(1);
      if (!order) return null;
      const items = await db.select().from(merchOrderItems)
        .where(eq(merchOrderItems.orderId, order.id));
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
    const orders = await db.select().from(merchOrders)
      .where(eq(merchOrders.buyerUserId, ctx.user.id)).orderBy(desc(merchOrders.createdAt));
    const result = [];
    for (const order of orders) {
      const items = await db.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
      result.push({ ...order, items });
    }
    return result;
  }),

  /** Creator order-management list. */
  sellerOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    const orders = await db.select().from(merchOrders)
      .where(and(eq(merchOrders.sellerUserId, ctx.user.id), eq(merchOrders.paymentStatus, 'paid')))
      .orderBy(desc(merchOrders.createdAt));
    const result = [];
    for (const order of orders) {
      const items = await db.select().from(merchOrderItems).where(eq(merchOrderItems.orderId, order.id));
      result.push({ ...order, items });
    }
    return result;
  }),

  /** Creator fulfillment updates with guarded status transitions. */
  updateFulfillment: protectedProcedure
    .input(z.object({
      orderId: z.number().int().positive(),
      status: orderStatusSchema,
      trackingNumber: z.string().max(255).optional(),
      trackingCarrier: z.string().max(100).optional(),
      trackingUrl: z.string().url().max(2048).optional().or(z.literal('')),
      pickupNotes: z.string().max(1000).optional(),
      fulfillmentNotes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const [order] = await db.select().from(merchOrders)
        .where(and(eq(merchOrders.id, input.orderId), eq(merchOrders.sellerUserId, ctx.user.id))).limit(1);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      if (order.paymentStatus !== 'paid') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only paid orders can be fulfilled.' });
      }
      if (!canTransitionMerchOrder(order.status, input.status, order.fulfillmentMethod)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Order cannot move from ${order.status} to ${input.status}.` });
      }
      if (input.status === 'ready_for_pickup' && !input.pickupNotes?.trim() && !order.pickupNotes) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add pickup details so the buyer knows where and when to collect the order.' });
      }

      await db.update(merchOrders).set({
        status: input.status,
        trackingNumber: input.trackingNumber?.trim() || order.trackingNumber,
        trackingCarrier: input.trackingCarrier?.trim() || order.trackingCarrier,
        trackingUrl: input.trackingUrl?.trim() || order.trackingUrl,
        pickupNotes: input.pickupNotes?.trim() || order.pickupNotes,
        fulfillmentNotes: input.fulfillmentNotes?.trim() || order.fulfillmentNotes,
        fulfilledAt: input.status === 'completed' ? new Date() : order.fulfilledAt,
      }).where(eq(merchOrders.id, order.id));

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
        });
      } catch (error) {
        console.error('[Merch Orders] Failed to send status email:', error);
      }

      return { success: true };
    }),
});
