import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "../db";
import { ologyLiveExperiences, ologyLiveBookings, ologyLiveTimeSlots } from "../../drizzle/schema";
import { stripe } from "../stripe";
import { ENV } from "../_core/env";

// Platform revenue share: 15% to Ologywood, 85% to talent
const PLATFORM_FEE_PERCENT = 15;

// Helper: check if user is talent (artist role)
const talentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Talent access required' });
  }
  return next({ ctx });
});

const experienceInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  duration: z.number().min(15).max(180), // 15 min to 3 hours
  price: z.number().min(0.5).max(10000), // $0.50 to $10,000
  capacityType: z.enum(["one_on_one", "small_group", "broadcast"]),
  maxAttendees: z.number().min(1).max(1000).optional(),
  platform: z.string().min(1).max(50),
  platformLink: z.string().max(512).optional(),
  linkSentAfterBooking: z.boolean().optional(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).max(10).optional(),
  coverImageUrl: z.string().max(512).optional(),
  recurringSchedule: z.any().optional(),
});

export const ologyLiveRouter = router({
  // ===== TALENT: Experience Management =====

  createExperience: talentProcedure
    .input(experienceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Set maxAttendees based on capacity type
      let maxAttendees = input.maxAttendees || 1;
      if (input.capacityType === 'one_on_one') maxAttendees = 1;
      if (input.capacityType === 'small_group' && maxAttendees < 2) maxAttendees = 2;
      if (input.capacityType === 'broadcast' && !input.maxAttendees) maxAttendees = 100;

      const [experience] = await db.insert(ologyLiveExperiences).values({
        talentId: ctx.user.id,
        title: input.title,
        description: input.description || null,
        duration: input.duration,
        price: String(input.price),
        capacityType: input.capacityType,
        maxAttendees,
        platform: input.platform,
        platformLink: input.platformLink || null,
        linkSentAfterBooking: input.linkSentAfterBooking || false,
        category: input.category,
        tags: input.tags || null,
        coverImageUrl: input.coverImageUrl || null,
        recurringSchedule: input.recurringSchedule || null,
      }).$returningId();

      return { id: experience.id };
    }),

  updateExperience: talentProcedure
    .input(z.object({ id: z.number() }).merge(experienceInputSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Verify ownership
      const [existing] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.id), eq(ologyLiveExperiences.talentId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });

      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.duration !== undefined) updates.duration = input.duration;
      if (input.price !== undefined) updates.price = String(input.price);
      if (input.capacityType !== undefined) updates.capacityType = input.capacityType;
      if (input.maxAttendees !== undefined) updates.maxAttendees = input.maxAttendees;
      if (input.platform !== undefined) updates.platform = input.platform;
      if (input.platformLink !== undefined) updates.platformLink = input.platformLink;
      if (input.linkSentAfterBooking !== undefined) updates.linkSentAfterBooking = input.linkSentAfterBooking;
      if (input.category !== undefined) updates.category = input.category;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.coverImageUrl !== undefined) updates.coverImageUrl = input.coverImageUrl;
      if (input.recurringSchedule !== undefined) updates.recurringSchedule = input.recurringSchedule;

      await db.update(ologyLiveExperiences).set(updates)
        .where(eq(ologyLiveExperiences.id, input.id));

      return { success: true };
    }),

  toggleActive: talentProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [existing] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.id), eq(ologyLiveExperiences.talentId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });

      await db.update(ologyLiveExperiences).set({ isActive: input.isActive })
        .where(eq(ologyLiveExperiences.id, input.id));

      return { success: true };
    }),

  deleteExperience: talentProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [existing] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.id), eq(ologyLiveExperiences.talentId, ctx.user.id)));
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });

      // Check for pending bookings
      const [pendingCount] = await db.select({ count: sql<number>`count(*)` })
        .from(ologyLiveBookings)
        .where(and(
          eq(ologyLiveBookings.experienceId, input.id),
          sql`${ologyLiveBookings.status} IN ('pending', 'confirmed')`
        ));
      if (pendingCount && Number(pendingCount.count) > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete experience with pending bookings. Cancel them first or deactivate instead.' });
      }

      await db.delete(ologyLiveExperiences).where(eq(ologyLiveExperiences.id, input.id));
      return { success: true };
    }),

  getMyExperiences: talentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return await db.select().from(ologyLiveExperiences)
      .where(eq(ologyLiveExperiences.talentId, ctx.user.id))
      .orderBy(desc(ologyLiveExperiences.createdAt));
  }),

  getMyBookingsAsTalent: talentProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const conditions = [eq(ologyLiveBookings.talentId, ctx.user.id)];
      if (input?.status) {
        conditions.push(eq(ologyLiveBookings.status, input.status as any));
      }
      return await db.select().from(ologyLiveBookings)
        .where(and(...conditions))
        .orderBy(desc(ologyLiveBookings.scheduledAt));
    }),

  // ===== TALENT: Time Slot Management =====

  addTimeSlot: talentProcedure
    .input(z.object({
      experienceId: z.number(),
      startTime: z.string(), // ISO date string
      endTime: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Verify experience ownership
      const [exp] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.experienceId), eq(ologyLiveExperiences.talentId, ctx.user.id)));
      if (!exp) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });

      const [slot] = await db.insert(ologyLiveTimeSlots).values({
        experienceId: input.experienceId,
        talentId: ctx.user.id,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        spotsTotal: exp.maxAttendees || 1,
        spotsTaken: 0,
        isAvailable: true,
      }).$returningId();

      return { id: slot.id };
    }),

  removeTimeSlot: talentProcedure
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [slot] = await db.select().from(ologyLiveTimeSlots)
        .where(and(eq(ologyLiveTimeSlots.id, input.slotId), eq(ologyLiveTimeSlots.talentId, ctx.user.id)));
      if (!slot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Time slot not found' });

      if (slot.spotsTaken > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot remove a slot with existing bookings' });
      }

      await db.delete(ologyLiveTimeSlots).where(eq(ologyLiveTimeSlots.id, input.slotId));
      return { success: true };
    }),

  getMyTimeSlots: talentProcedure
    .input(z.object({ experienceId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const conditions = [eq(ologyLiveTimeSlots.talentId, ctx.user.id)];
      if (input?.experienceId) {
        conditions.push(eq(ologyLiveTimeSlots.experienceId, input.experienceId));
      }
      return await db.select().from(ologyLiveTimeSlots)
        .where(and(...conditions))
        .orderBy(asc(ologyLiveTimeSlots.startTime));
    }),

  // ===== FAN: Browse & Book =====

  getTalentExperiences: publicProcedure
    .input(z.object({ talentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(ologyLiveExperiences)
        .where(and(
          eq(ologyLiveExperiences.talentId, input.talentId),
          eq(ologyLiveExperiences.isActive, true)
        ))
        .orderBy(asc(ologyLiveExperiences.createdAt));
    }),

  getExperienceById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [exp] = await db.select().from(ologyLiveExperiences)
        .where(eq(ologyLiveExperiences.id, input.id));
      if (!exp) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });
      return exp;
    }),

  getAvailableSlots: publicProcedure
    .input(z.object({ experienceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(ologyLiveTimeSlots)
        .where(and(
          eq(ologyLiveTimeSlots.experienceId, input.experienceId),
          eq(ologyLiveTimeSlots.isAvailable, true),
          gte(ologyLiveTimeSlots.startTime, new Date())
        ))
        .orderBy(asc(ologyLiveTimeSlots.startTime));
    }),

  bookExperience: protectedProcedure
    .input(z.object({
      experienceId: z.number(),
      slotId: z.number(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get experience
      const [experience] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.experienceId), eq(ologyLiveExperiences.isActive, true)));
      if (!experience) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found or inactive' });

      // Can't book your own experience
      if (experience.talentId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot book your own experience' });
      }

      // Get and validate slot
      const [slot] = await db.select().from(ologyLiveTimeSlots)
        .where(and(
          eq(ologyLiveTimeSlots.id, input.slotId),
          eq(ologyLiveTimeSlots.experienceId, input.experienceId),
          eq(ologyLiveTimeSlots.isAvailable, true)
        ));
      if (!slot) throw new TRPCError({ code: 'NOT_FOUND', message: 'Time slot not available' });

      // Check capacity
      if (slot.spotsTaken >= slot.spotsTotal) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This time slot is fully booked' });
      }

      const price = parseFloat(experience.price);
      const platformFee = price * (PLATFORM_FEE_PERCENT / 100);

      // Create Stripe Payment Intent
      let paymentIntentId: string | null = null;
      if (stripe && price > 0) {
        const baseUrl = ENV.baseUrl || 'https://www.ologywood.com';
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(price * 100),
              product_data: {
                name: `Ology Live: ${experience.title}`,
                description: `${experience.duration} min session on ${experience.platform}`,
              },
            },
            quantity: 1,
          }],
          success_url: `${baseUrl}/ology-live/booking-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/ology-live/booking-cancelled`,
          metadata: {
            type: 'ology_live_booking',
            experienceId: String(experience.id),
            slotId: String(slot.id),
            fanId: String(ctx.user.id),
            talentId: String(experience.talentId),
          },
        });

        // Create the booking record
        const [booking] = await db.insert(ologyLiveBookings).values({
          experienceId: experience.id,
          fanId: ctx.user.id,
          talentId: experience.talentId,
          scheduledAt: slot.startTime,
          duration: experience.duration,
          amount: String(price),
          platformFee: String(platformFee),
          stripePaymentIntentId: session.id,
          platform: experience.platform,
          joinLink: experience.linkSentAfterBooking ? null : experience.platformLink,
          notes: input.notes || null,
        }).$returningId();

        // Update slot capacity
        await db.update(ologyLiveTimeSlots).set({
          spotsTaken: slot.spotsTaken + 1,
          isAvailable: (slot.spotsTaken + 1) < slot.spotsTotal,
        }).where(eq(ologyLiveTimeSlots.id, slot.id));

        return { bookingId: booking.id, checkoutUrl: session.url };
      }

      // Free experience (no payment needed)
      const [booking] = await db.insert(ologyLiveBookings).values({
        experienceId: experience.id,
        fanId: ctx.user.id,
        talentId: experience.talentId,
        scheduledAt: slot.startTime,
        duration: experience.duration,
        amount: "0",
        platformFee: "0",
        paymentStatus: "paid",
        status: "confirmed",
        platform: experience.platform,
        joinLink: experience.linkSentAfterBooking ? null : experience.platformLink,
        notes: input.notes || null,
      }).$returningId();

      // Update slot capacity
      await db.update(ologyLiveTimeSlots).set({
        spotsTaken: slot.spotsTaken + 1,
        isAvailable: (slot.spotsTaken + 1) < slot.spotsTotal,
      }).where(eq(ologyLiveTimeSlots.id, slot.id));

      return { bookingId: booking.id, checkoutUrl: null };
    }),

  getMyBookingsAsFan: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return await db.select().from(ologyLiveBookings)
      .where(eq(ologyLiveBookings.fanId, ctx.user.id))
      .orderBy(desc(ologyLiveBookings.scheduledAt));
  }),

  cancelBooking: protectedProcedure
    .input(z.object({ bookingId: z.number(), reason: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [booking] = await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId));
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });

      // Only fan or talent can cancel
      const isFan = booking.fanId === ctx.user.id;
      const isTalent = booking.talentId === ctx.user.id;
      if (!isFan && !isTalent && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' });
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking cannot be cancelled in its current state' });
      }

      await db.update(ologyLiveBookings).set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: isFan ? 'fan' : 'talent',
        cancellationReason: input.reason || null,
      }).where(eq(ologyLiveBookings.id, input.bookingId));

      // Free up the slot
      const [slot] = await db.select().from(ologyLiveTimeSlots)
        .where(and(
          eq(ologyLiveTimeSlots.experienceId, booking.experienceId),
          eq(ologyLiveTimeSlots.startTime, booking.scheduledAt)
        ));
      if (slot) {
        await db.update(ologyLiveTimeSlots).set({
          spotsTaken: Math.max(0, slot.spotsTaken - 1),
          isAvailable: true,
        }).where(eq(ologyLiveTimeSlots.id, slot.id));
      }

      return { success: true };
    }),

  confirmBooking: talentProcedure
    .input(z.object({ bookingId: z.number(), joinLink: z.string().max(512).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [booking] = await db.select().from(ologyLiveBookings)
        .where(and(eq(ologyLiveBookings.id, input.bookingId), eq(ologyLiveBookings.talentId, ctx.user.id)));
      if (!booking) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });

      const updates: any = { status: 'confirmed' };
      if (input.joinLink) updates.joinLink = input.joinLink;

      await db.update(ologyLiveBookings).set(updates)
        .where(eq(ologyLiveBookings.id, input.bookingId));

      return { success: true };
    }),

  // ===== PUBLIC: Browse All Experiences =====

  browseExperiences: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      capacityType: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(ologyLiveExperiences.isActive, true)];
      if (input?.category) {
        conditions.push(eq(ologyLiveExperiences.category, input.category));
      }
      if (input?.capacityType) {
        conditions.push(eq(ologyLiveExperiences.capacityType, input.capacityType as any));
      }
      return await db.select().from(ologyLiveExperiences)
        .where(and(...conditions))
        .orderBy(desc(ologyLiveExperiences.createdAt))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);
    }),
});
