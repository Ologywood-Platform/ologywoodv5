import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import type { TicketTier, TicketOrder, TicketItem } from '../../drizzle/schema';
import { ticketTiers, ticketOrders, ticketItems, events, ticketPromoCodes, ticketTransfers } from '../../drizzle/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { stripe } from '../stripe';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';

async function getDatabase() {
  const instance = await getDb();
  if (!instance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
  return instance;
}

// Generate a human-readable order number like "OLG-20260503-A1B2"
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OLG-${dateStr}-${random}`;
}

// Input schemas
const createTierSchema = z.object({
  eventId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().int().min(0), // in cents, 0 = free
  quantity: z.number().int().min(1),
  maxPerOrder: z.number().int().min(1).max(50).default(10),
  salesStartDate: z.date().optional(),
  salesEndDate: z.date().optional(),
  sortOrder: z.number().int().default(0),
});

const updateTierSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
  maxPerOrder: z.number().int().min(1).max(50).optional(),
  salesStartDate: z.date().nullable().optional(),
  salesEndDate: z.date().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const purchaseSchema = z.object({
  eventId: z.number().int().positive(),
  items: z.array(z.object({
    tierId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(50),
  })).min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  buyerPhone: z.string().optional(),
});

export const ticketingRouter = router({
  // ==================== TIER MANAGEMENT (Event Organizers) ====================

  // Create a ticket tier for an event
  createTier: protectedProcedure
    .input(createTierSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify the user owns this event (is the artist who created it)
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      // Check ownership - get artist profile for this user
      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only add tickets to your own events' });
      }

      const [tier] = await (await getDatabase()).insert(ticketTiers).values({
        eventId: input.eventId,
        name: input.name,
        description: input.description || null,
        price: input.price,
        quantity: input.quantity,
        maxPerOrder: input.maxPerOrder,
        salesStartDate: input.salesStartDate || null,
        salesEndDate: input.salesEndDate || null,
        sortOrder: input.sortOrder,
      }).$returningId();

      return { success: true, tierId: tier.id };
    }),

  // Update a ticket tier
  updateTier: protectedProcedure
    .input(updateTierSchema)
    .mutation(async ({ input, ctx }) => {
      const [tier] = await (await getDatabase()).select().from(ticketTiers).where(eq(ticketTiers.id, input.id)).limit(1);
      if (!tier) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket tier not found' });

      // Verify ownership
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, tier.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit tickets for your own events' });
      }

      // Don't allow reducing quantity below sold amount
      if (input.quantity !== undefined && input.quantity < tier.quantitySold) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Cannot reduce quantity below ${tier.quantitySold} (already sold)` });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price;
      if (input.quantity !== undefined) updateData.quantity = input.quantity;
      if (input.maxPerOrder !== undefined) updateData.maxPerOrder = input.maxPerOrder;
      if (input.salesStartDate !== undefined) updateData.salesStartDate = input.salesStartDate;
      if (input.salesEndDate !== undefined) updateData.salesEndDate = input.salesEndDate;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await (await getDatabase()).update(ticketTiers).set(updateData).where(eq(ticketTiers.id, input.id));
      return { success: true };
    }),

  // Delete a ticket tier (only if no tickets sold)
  deleteTier: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const [tier] = await (await getDatabase()).select().from(ticketTiers).where(eq(ticketTiers.id, input.id)).limit(1);
      if (!tier) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket tier not found' });

      if (tier.quantitySold > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete a tier with sold tickets. Deactivate it instead.' });
      }

      // Verify ownership
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, tier.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete tickets for your own events' });
      }

      await (await getDatabase()).delete(ticketTiers).where(eq(ticketTiers.id, input.id));
      return { success: true };
    }),

  // Get all tiers for an event (public - for ticket purchase page)
  getTiers: publicProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const tiers = await (await getDatabase()).select().from(ticketTiers)
        .where(and(eq(ticketTiers.eventId, input.eventId), eq(ticketTiers.isActive, true)))
        .orderBy(asc(ticketTiers.sortOrder), asc(ticketTiers.price));

      return tiers.map(tier => ({
        ...tier,
        available: tier.quantity - tier.quantitySold,
        isSoldOut: tier.quantitySold >= tier.quantity,
        isOnSale: (!tier.salesStartDate || new Date(tier.salesStartDate) <= new Date()) &&
                  (!tier.salesEndDate || new Date(tier.salesEndDate) >= new Date()),
      }));
    }),

  // Get all tiers for management (includes inactive, sold counts)
  getManagementTiers: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      // Verify ownership
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const tiers = await (await getDatabase()).select().from(ticketTiers)
        .where(eq(ticketTiers.eventId, input.eventId))
        .orderBy(asc(ticketTiers.sortOrder), asc(ticketTiers.price));

      return tiers;
    }),

  // ==================== TICKET PURCHASE ====================

  // Create a Stripe Checkout Session for ticket purchase
  createCheckout: publicProcedure
    .input(purchaseSchema)
    .mutation(async ({ input, ctx }) => {
      if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment system not configured' });

      // Validate event exists and is public
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
      if (!event.isPublic) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tickets not available for this event' });

      // Validate all tiers and check availability
      const tierIds = input.items.map(i => i.tierId);
      const tiers = await (await getDatabase()).select().from(ticketTiers)
        .where(and(eq(ticketTiers.eventId, input.eventId), eq(ticketTiers.isActive, true)));

      const tierMap = new Map<number, TicketTier>(tiers.map((t: TicketTier) => [t.id, t]));
      let totalAmount = 0;
      let totalTickets = 0;
      const lineItems: any[] = [];

      for (const item of input.items) {
        const tier = tierMap.get(item.tierId);
        if (!tier) throw new TRPCError({ code: 'NOT_FOUND', message: `Ticket tier ${item.tierId} not found` });

        const available = tier.quantity - tier.quantitySold;
        if (item.quantity > available) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Only ${available} tickets available for "${tier.name}"` });
        }
        if (item.quantity > tier.maxPerOrder) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Maximum ${tier.maxPerOrder} tickets per order for "${tier.name}"` });
        }

        // Check if on sale
        const now = new Date();
        if (tier.salesStartDate && new Date(tier.salesStartDate) > now) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `"${tier.name}" tickets are not yet on sale` });
        }
        if (tier.salesEndDate && new Date(tier.salesEndDate) < now) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `"${tier.name}" ticket sales have ended` });
        }

        totalAmount += tier.price * item.quantity;
        totalTickets += item.quantity;

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${event.eventTitle} - ${tier.name}`,
              description: tier.description || `Ticket for ${event.eventTitle}`,
            },
            unit_amount: tier.price,
          },
          quantity: item.quantity,
        });
      }

      // Platform fee: $0.99 per ticket
      const platformFee = totalTickets * 99; // 99 cents per ticket

      // Add platform fee as a line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Service Fee',
            description: `Platform service fee ($0.99 × ${totalTickets} ticket${totalTickets > 1 ? 's' : ''})`,
          },
          unit_amount: platformFee,
        },
        quantity: 1,
      });

      // Create order record
      const orderNumber = generateOrderNumber();
      const buyerEmail = input.buyerEmail || (ctx.user as any)?.email || '';
      const buyerName = input.buyerName || (ctx.user as any)?.name || '';

      const [order] = await (await getDatabase()).insert(ticketOrders).values({
        eventId: input.eventId,
        buyerUserId: (ctx.user as any)?.id || null,
        buyerEmail,
        buyerName,
        buyerPhone: input.buyerPhone || null,
        status: 'pending',
        totalAmount: totalAmount + platformFee,
        platformFee,
        orderNumber,
      }).$returningId();

      // Create Stripe Checkout Session
      const origin = (ctx.req as any)?.headers?.origin || process.env.BASE_URL || 'https://www.ologywood.com';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        customer_email: buyerEmail || undefined,
        metadata: {
          type: 'ticket_purchase',
          orderId: order.id.toString(),
          orderNumber,
          eventId: input.eventId.toString(),
          eventTitle: event.eventTitle,
          totalTickets: totalTickets.toString(),
          items: JSON.stringify(input.items),
          buyerUserId: (ctx.user as any)?.id?.toString() || '',
        },
        success_url: `${origin}/tickets/confirmation/${orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/events/${input.eventId}?checkout=cancelled`,
        allow_promotion_codes: true,
      });

      // Update order with Stripe session ID
      await (await getDatabase()).update(ticketOrders)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(ticketOrders.id, order.id));

      return {
        checkoutUrl: session.url,
        orderNumber,
        orderId: order.id,
      };
    }),

  // ==================== ORDER QUERIES ====================

  // Get order by order number (for confirmation page)
  getOrderByNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const [order] = await (await getDatabase()).select().from(ticketOrders)
        .where(eq(ticketOrders.orderNumber, input.orderNumber)).limit(1);
      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });

      // Get ticket items
      const items = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.orderId, order.id));

      // Get tier names
      const tierIds: number[] = items.map((i: TicketItem) => i.tierId).filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);
      const tiers = tierIds.length > 0
        ? await (await getDatabase()).select().from(ticketTiers).where(sql`${ticketTiers.id} IN (${sql.join(tierIds.map(id => sql`${id}`), sql`, `)})`)
        : [];
      const tierMap = new Map<number, TicketTier>(tiers.map((t: TicketTier) => [t.id, t]));

      // Get event details
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, order.eventId)).limit(1);

      return {
        ...order,
        items: items.map((item: TicketItem) => ({
          ...item,
          tierName: tierMap.get(item.tierId)?.name || 'Unknown',
        })),
        event: event ? {
          id: event.id,
          title: event.eventTitle,
          date: event.eventDate,
          time: event.eventTime,
          location: event.location,
          coverImageUrl: event.coverImageUrl,
        } : null,
      };
    }),

  // Get my tickets (for logged-in users)
  getMyTickets: protectedProcedure
    .input(z.object({
      status: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
    }))
    .query(async ({ input, ctx }) => {
      const orders = await (await getDatabase()).select().from(ticketOrders)
        .where(and(
          eq(ticketOrders.buyerUserId, ctx.user.id),
          eq(ticketOrders.status, 'completed'),
        ))
        .orderBy(desc(ticketOrders.createdAt));

      // Enrich with event data
      const enrichedOrders = await Promise.all(orders.map(async (order: TicketOrder) => {
        const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, order.eventId)).limit(1);
        const items = await (await getDatabase()).select().from(ticketItems).where(eq(ticketItems.orderId, order.id));
        const tierIds: number[] = items.map((i: TicketItem) => i.tierId).filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);
        const tiers = tierIds.length > 0
          ? await (await getDatabase()).select().from(ticketTiers).where(sql`${ticketTiers.id} IN (${sql.join(tierIds.map(id => sql`${id}`), sql`, `)})`)
          : [];
        const tierMap = new Map<number, TicketTier>(tiers.map((t: TicketTier) => [t.id, t]));

        return {
          ...order,
          event: event ? {
            id: event.id,
            title: event.eventTitle,
            date: event.eventDate,
            time: event.eventTime,
            location: event.location,
            coverImageUrl: event.coverImageUrl,
          } : null,
          items: items.map((item: TicketItem) => ({
            ...item,
            tierName: tierMap.get(item.tierId)?.name || 'Unknown',
          })),
          ticketCount: items.length,
        };
      }));

      // Filter by upcoming/past
      if (input.status === 'upcoming') {
        const now = new Date();
        return enrichedOrders.filter((o: any) => o.event && new Date(o.event.date) >= now);
      } else if (input.status === 'past') {
        const now = new Date();
        return enrichedOrders.filter((o: any) => o.event && new Date(o.event.date) < now);
      }
      return enrichedOrders;
    }),

  // ==================== EVENT SALES DASHBOARD (for event organizers) ====================

  // Get sales summary for an event
  getSalesSummary: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      // Verify ownership
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Get all tiers with sales data
      const tiers = await (await getDatabase()).select().from(ticketTiers)
        .where(eq(ticketTiers.eventId, input.eventId))
        .orderBy(asc(ticketTiers.sortOrder));

      // Get completed orders
      const orders = await (await getDatabase()).select().from(ticketOrders)
        .where(and(eq(ticketOrders.eventId, input.eventId), eq(ticketOrders.status, 'completed')))
        .orderBy(desc(ticketOrders.createdAt));

      const totalRevenue = orders.reduce((sum: number, o: TicketOrder) => sum + o.totalAmount - o.platformFee, 0);
      const totalFees = orders.reduce((sum: number, o: TicketOrder) => sum + o.platformFee, 0);
      const totalTicketsSold = tiers.reduce((sum: number, t: TicketTier) => sum + t.quantitySold, 0);
      const totalCapacity = tiers.reduce((sum: number, t: TicketTier) => sum + t.quantity, 0);

      return {
        event: {
          id: event.id,
          title: event.eventTitle,
          date: event.eventDate,
          location: event.location,
        },
        tiers: tiers.map((t: TicketTier) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          quantity: t.quantity,
          sold: t.quantitySold,
          revenue: t.quantitySold * t.price,
          isActive: t.isActive,
        })),
        summary: {
          totalRevenue, // Revenue going to artist (minus platform fee)
          totalFees,
          totalTicketsSold,
          totalCapacity,
          percentSold: totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0,
          orderCount: orders.length,
        },
        recentOrders: orders.slice(0, 20).map((o: TicketOrder) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          buyerName: o.buyerName,
          buyerEmail: o.buyerEmail,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
        })),
      };
    }),

  // ==================== TICKET VALIDATION (Check-in) ====================

  // Validate a ticket by code (QR scan)
  validateTicket: protectedProcedure
    .input(z.object({ ticketCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [ticket] = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.ticketCode, input.ticketCode)).limit(1);

      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid ticket code' });

      // Verify the scanner has permission (event owner)
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the event organizer can validate tickets' });
      }

      if (ticket.status === 'used') {
        return {
          valid: false,
          message: `Ticket already used at ${ticket.checkedInAt?.toLocaleString()}`,
          ticket,
        };
      }

      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        return {
          valid: false,
          message: `Ticket has been ${ticket.status}`,
          ticket,
        };
      }

      // Mark as used
      await (await getDatabase()).update(ticketItems).set({
        status: 'used',
        checkedInAt: new Date(),
        checkedInBy: ctx.user.id,
      }).where(eq(ticketItems.id, ticket.id));

      // Get tier name
      const [tier] = await (await getDatabase()).select().from(ticketTiers).where(eq(ticketTiers.id, ticket.tierId)).limit(1);

      return {
        valid: true,
        message: 'Ticket validated successfully!',
        ticket: {
          ...ticket,
          tierName: tier?.name || 'Unknown',
          attendeeName: ticket.attendeeName,
        },
      };
    }),

  // Get check-in stats for an event
  getCheckInStats: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const allTickets = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.eventId, input.eventId));

      const total = allTickets.length;
      const checkedIn = allTickets.filter((t: TicketItem) => t.status === 'used').length;
      const valid = allTickets.filter((t: TicketItem) => t.status === 'valid').length;

      return {
        total,
        checkedIn,
        remaining: valid,
        percentCheckedIn: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      };
    }),

  // Check if an event has ticketing enabled
  hasTicketing: publicProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const tiers = await (await getDatabase()).select().from(ticketTiers)
        .where(and(eq(ticketTiers.eventId, input.eventId), eq(ticketTiers.isActive, true)))
        .limit(1);
      return { enabled: tiers.length > 0 };
    }),

  // ==================== PROMO CODES ====================

  // Create a promo code for an event
  createPromoCode: protectedProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      code: z.string().min(2).max(50).transform(v => v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().int().positive(), // percentage (1-100) or cents
      maxUses: z.number().int().positive().optional(),
      minTickets: z.number().int().min(1).default(1),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the event organizer can create promo codes' });
      }

      if (input.discountType === 'percentage' && input.discountValue > 100) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Percentage discount cannot exceed 100%' });
      }

      // Check for duplicate code on this event
      const existing = await (await getDatabase()).select().from(ticketPromoCodes)
        .where(and(eq(ticketPromoCodes.eventId, input.eventId), eq(ticketPromoCodes.code, input.code)))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Promo code "${input.code}" already exists for this event` });
      }

      const [promo] = await (await getDatabase()).insert(ticketPromoCodes).values({
        eventId: input.eventId,
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxUses: input.maxUses || null,
        minTickets: input.minTickets,
        expiresAt: input.expiresAt || null,
      }).$returningId();

      return { success: true, promoId: promo.id };
    }),

  // Get promo codes for an event (organizer only)
  getPromoCodes: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return await (await getDatabase()).select().from(ticketPromoCodes)
        .where(eq(ticketPromoCodes.eventId, input.eventId))
        .orderBy(desc(ticketPromoCodes.createdAt));
    }),

  // Delete a promo code
  deletePromoCode: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const [promo] = await (await getDatabase()).select().from(ticketPromoCodes).where(eq(ticketPromoCodes.id, input.id)).limit(1);
      if (!promo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Promo code not found' });

      const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, promo.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });

      const { getArtistProfileByUserId } = await import('../db');
      const artistProfile = await getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile || artistProfile.id !== event.artistId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await (await getDatabase()).delete(ticketPromoCodes).where(eq(ticketPromoCodes.id, input.id));
      return { success: true };
    }),

  // Validate a promo code (public - for buyers)
  validatePromoCode: publicProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      code: z.string().transform(v => v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
      ticketCount: z.number().int().min(1),
    }))
    .query(async ({ input }) => {
      const [promo] = await (await getDatabase()).select().from(ticketPromoCodes)
        .where(and(
          eq(ticketPromoCodes.eventId, input.eventId),
          eq(ticketPromoCodes.code, input.code),
          eq(ticketPromoCodes.isActive, true),
        ))
        .limit(1);

      if (!promo) return { valid: false, message: 'Invalid promo code' };

      // Check max uses
      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        return { valid: false, message: 'This promo code has reached its usage limit' };
      }

      // Check expiry
      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return { valid: false, message: 'This promo code has expired' };
      }

      // Check minimum tickets
      if (input.ticketCount < promo.minTickets) {
        return { valid: false, message: `Minimum ${promo.minTickets} tickets required for this promo code` };
      }

      return {
        valid: true,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        code: promo.code,
        message: promo.discountType === 'percentage'
          ? `${promo.discountValue}% off applied!`
          : `$${(promo.discountValue / 100).toFixed(2)} off applied!`,
      };
    }),

  // ==================== TICKET TRANSFERS ====================

  // Initiate a ticket transfer
  transferTicket: protectedProcedure
    .input(z.object({
      ticketItemId: z.number().int().positive(),
      toEmail: z.string().email(),
      toName: z.string().min(1).max(255).optional(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [ticket] = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.id, input.ticketItemId)).limit(1);
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });

      // Verify ownership - ticket must belong to the current user's order
      const [order] = await (await getDatabase()).select().from(ticketOrders)
        .where(eq(ticketOrders.id, ticket.orderId)).limit(1);
      if (!order || order.buyerUserId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only transfer your own tickets' });
      }

      if (ticket.status !== 'valid') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Cannot transfer a ticket that is ${ticket.status}` });
      }

      // Check for existing pending transfer
      const existingTransfer = await (await getDatabase()).select().from(ticketTransfers)
        .where(and(
          eq(ticketTransfers.ticketItemId, input.ticketItemId),
          eq(ticketTransfers.status, 'pending'),
        )).limit(1);
      if (existingTransfer.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This ticket already has a pending transfer. Cancel it first.' });
      }

      const transferCode = randomUUID();
      const [transfer] = await (await getDatabase()).insert(ticketTransfers).values({
        ticketItemId: input.ticketItemId,
        fromEmail: order.buyerEmail,
        toEmail: input.toEmail,
        toName: input.toName || null,
        message: input.message || null,
        transferCode,
      }).$returningId();

      // Send transfer email
      try {
        const { sendEmail } = await import('../email');
        const { ENV } = await import('../_core/env');
        const [event] = await (await getDatabase()).select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
        const [tier] = await (await getDatabase()).select().from(ticketTiers).where(eq(ticketTiers.id, ticket.tierId)).limit(1);
        const acceptUrl = `${ENV.baseUrl}/tickets/accept/${transferCode}`;
        const senderName = order.buyerName || order.buyerEmail;
        const eventTitle = event?.eventTitle || 'an event';
        const eventDate = event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Ologywood</h1>
            </div>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 36px; margin-bottom: 8px;">\uD83C\uDF81</div>
              <h2 style="margin: 0; color: #1e40af; font-size: 20px;">You've Got a Ticket!</h2>
              <p style="color: #2563eb; margin: 8px 0 0; font-size: 14px;">${senderName} sent you a ticket</p>
            </div>
            ${input.message ? `<div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #7c3aed;"><p style="color: #333; font-size: 14px; margin: 0; font-style: italic;">&ldquo;${input.message}&rdquo;</p></div>` : ''}
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #6b7280; width: 100px;">Event</td><td style="padding: 6px 0; color: #111; font-weight: bold;">${eventTitle}</td></tr>
                <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; color: #111;">${eventDate}</td></tr>
                ${event?.location ? `<tr><td style="padding: 6px 0; color: #6b7280;">Location</td><td style="padding: 6px 0; color: #111;">${event.location}</td></tr>` : ''}
                <tr><td style="padding: 6px 0; color: #6b7280;">Ticket</td><td style="padding: 6px 0; color: #111;">${tier?.name || 'General'}</td></tr>
              </table>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Accept Ticket</a>
            </div>
            <p style="color: #6b7280; font-size: 13px; text-align: center;">This link will expire when the event starts. If you don't want this ticket, simply ignore this email.</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(input.toEmail)}&type=ticket" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
                <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">Ologywood \u2014 Book Talented Artists for Your Events</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: input.toEmail,
          subject: `\uD83C\uDF81 ${senderName} sent you a ticket to ${eventTitle}!`,
          html,
        });
      } catch (emailErr) {
        console.error('[Transfer] Failed to send transfer email:', emailErr);
      }

      return { success: true, transferId: transfer.id, transferCode };
    }),

  // Accept a ticket transfer
  acceptTransfer: publicProcedure
    .input(z.object({ transferCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [transfer] = await (await getDatabase()).select().from(ticketTransfers)
        .where(eq(ticketTransfers.transferCode, input.transferCode)).limit(1);
      if (!transfer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Transfer not found' });

      if (transfer.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `This transfer has already been ${transfer.status}` });
      }

      // Update the ticket with new attendee info
      await (await getDatabase()).update(ticketItems).set({
        attendeeEmail: transfer.toEmail,
        attendeeName: transfer.toName || null,
      }).where(eq(ticketItems.id, transfer.ticketItemId));

      // Mark transfer as accepted
      await (await getDatabase()).update(ticketTransfers).set({
        status: 'accepted',
        acceptedAt: new Date(),
      }).where(eq(ticketTransfers.id, transfer.id));

      // Get ticket details for the response
      const [ticket] = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.id, transfer.ticketItemId)).limit(1);
      const [event] = ticket
        ? await (await getDatabase()).select().from(events).where(eq(events.id, ticket.eventId)).limit(1)
        : [null];

      return {
        success: true,
        ticket: ticket ? {
          ticketCode: ticket.ticketCode,
          eventTitle: event?.eventTitle || 'Unknown Event',
          eventDate: event?.eventDate,
          location: event?.location,
        } : null,
      };
    }),

  // Cancel a pending transfer
  cancelTransfer: protectedProcedure
    .input(z.object({ transferId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const [transfer] = await (await getDatabase()).select().from(ticketTransfers)
        .where(eq(ticketTransfers.id, input.transferId)).limit(1);
      if (!transfer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Transfer not found' });

      // Verify the sender is the one cancelling
      const [ticket] = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.id, transfer.ticketItemId)).limit(1);
      if (!ticket) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });

      const [order] = await (await getDatabase()).select().from(ticketOrders)
        .where(eq(ticketOrders.id, ticket.orderId)).limit(1);
      if (!order || order.buyerUserId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the original ticket holder can cancel a transfer' });
      }

      if (transfer.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Cannot cancel a transfer that is ${transfer.status}` });
      }

      await (await getDatabase()).update(ticketTransfers).set({
        status: 'cancelled',
      }).where(eq(ticketTransfers.id, input.transferId));

      return { success: true };
    }),

  // Get pending transfers for a ticket
  getTransferStatus: protectedProcedure
    .input(z.object({ ticketItemId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const transfers = await (await getDatabase()).select().from(ticketTransfers)
        .where(eq(ticketTransfers.ticketItemId, input.ticketItemId))
        .orderBy(desc(ticketTransfers.createdAt));

      return transfers;
    }),

  // Get transfer details by code (for accept page)
  getTransferByCode: publicProcedure
    .input(z.object({ transferCode: z.string() }))
    .query(async ({ input }) => {
      const [transfer] = await (await getDatabase()).select().from(ticketTransfers)
        .where(eq(ticketTransfers.transferCode, input.transferCode)).limit(1);
      if (!transfer) throw new TRPCError({ code: 'NOT_FOUND', message: 'Transfer not found' });

      const [ticket] = await (await getDatabase()).select().from(ticketItems)
        .where(eq(ticketItems.id, transfer.ticketItemId)).limit(1);
      const [event] = ticket
        ? await (await getDatabase()).select().from(events).where(eq(events.id, ticket.eventId)).limit(1)
        : [null];
      const [tier] = ticket
        ? await (await getDatabase()).select().from(ticketTiers).where(eq(ticketTiers.id, ticket.tierId)).limit(1)
        : [null];

      return {
        ...transfer,
        event: event ? {
          title: event.eventTitle,
          date: event.eventDate,
          time: event.eventTime,
          location: event.location,
          coverImageUrl: event.coverImageUrl,
        } : null,
        tierName: tier?.name || 'General',
      };
    }),
});
