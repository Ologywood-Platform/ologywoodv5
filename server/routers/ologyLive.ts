import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { ologyLiveExperiences, ologyLiveBookings, ologyLiveTimeSlots } from '../../drizzle/schema';
import { stripe } from '../stripe';
import { ENV } from '../_core/env';
import { reconcileOlogyLiveReservations } from '../services/ologyLiveCheckoutService';
import {
  LiveScheduleError,
  assertLiveIntervalAvailable,
  createRecurringLiveSlots,
  findSlotForBooking,
  getLiveBookingParticipants,
  getLockedExperience,
  getLockedLiveBookingForParticipants,
  getLockedLiveSlot,
  insertLiveSlot,
  isLiveActive,
  liveSlotInterval,
  parseManualLiveInterval,
  syncLiveSlotCapacity,
  withLockedLiveTalent,
  type LiveExperienceRow,
  type LiveScheduleConnection,
  type LiveSlotRow,
  type RecurringLiveSchedule,
} from '../services/ologyLiveScheduleService';

// Platform revenue share: 15% to Ologywood, 85% to talent. These values are
// part of issued Checkout metadata and must not be changed by scheduling work.
const PLATFORM_FEE_PERCENT = 15;

const talentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Ology Live is for every platform creator with the existing talent role;
  // NIL/athlete eligibility is intentionally owned by its separate flow.
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Talent access required' });
  }
  return next({ ctx });
});

const experienceInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().max(2000).optional(),
  duration: z.number().int().min(15).max(180),
  price: z.number().min(0).max(10000),
  capacityType: z.enum(['one_on_one', 'small_group', 'broadcast']),
  maxAttendees: z.number().int().min(1).max(1000).optional(),
  platform: z.string().trim().min(1).max(50),
  platformLink: z.string().max(512).optional(),
  linkSentAfterBooking: z.boolean().optional(),
  category: z.string().trim().min(1).max(50),
  tags: z.array(z.string()).max(10).optional(),
  coverImageUrl: z.string().max(512).optional(),
  recurringSchedule: z.unknown().optional(),
});

const recurringScheduleSchema = z.object({
  dayOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59),
  timezone: z.string().max(100).default('America/New_York'),
  weeksAhead: z.number().int().min(1).max(8).default(4),
});

function asTrpc(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof LiveScheduleError) {
    const code = error.kind === 'not_found' ? 'NOT_FOUND'
      : error.kind === 'conflict' ? 'CONFLICT'
        : error.kind === 'capacity' || error.kind === 'duplicate' || error.kind === 'validation' ? 'BAD_REQUEST'
          : 'INTERNAL_SERVER_ERROR';
    throw new TRPCError({ code, message: error.message });
  }
  throw error;
}

function truthy(value: unknown): boolean {
  return value === true || value === 1;
}

function normalizedCapacity(input: Pick<z.infer<typeof experienceInputSchema>, 'capacityType' | 'maxAttendees'>): number {
  if (input.capacityType === 'one_on_one') return 1;
  if (input.capacityType === 'small_group') return Math.max(2, input.maxAttendees ?? 2);
  return input.maxAttendees ?? 100;
}

async function sqlRows<T>(conn: LiveScheduleConnection, statement: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await conn.execute(statement, values);
  return result as T[];
}

async function sqlWrite(conn: LiveScheduleConnection, statement: string, values: unknown[] = []): Promise<{ insertId?: number; affectedRows?: number }> {
  const [result] = await conn.execute(statement, values);
  return result as { insertId?: number; affectedRows?: number };
}

async function requireLiveExperience(conn: LiveScheduleConnection, id: number, talentId: number): Promise<LiveExperienceRow> {
  const experience = await getLockedExperience(conn, id, talentId);
  if (!experience) throw new LiveScheduleError('Experience not found.', 'not_found');
  return experience;
}

async function cancelUnlinkedReservation(talentId: number, bookingId: number): Promise<void> {
  const participants = await getLiveBookingParticipants(bookingId);
  if (!participants) return;
  if (participants.talentId !== talentId) throw new LiveScheduleError('This reservation changed. Please refresh and try again.', 'conflict');
  await withLockedLiveTalent(talentId, async conn => {
    const booking = await getLockedLiveBookingForParticipants(conn, bookingId, participants);
    if (!booking || booking.status !== 'pending' || booking.paymentStatus !== 'unpaid' || booking.stripePaymentIntentId) return;
    await sqlWrite(conn,
      "UPDATE ology_live_bookings SET status='cancelled', cancelledAt=UTC_TIMESTAMP(), cancelledBy='system', cancellationReason=? WHERE id=? AND status='pending' AND paymentStatus='unpaid' AND stripePaymentIntentId IS NULL",
      ['Checkout could not be created; reservation released.', bookingId],
    );
    const slot = await findSlotForBooking(conn, booking);
    const experience = await requireLiveExperience(conn, booking.experienceId, talentId);
    if (slot) await syncLiveSlotCapacity(conn, slot, isLiveActive(experience.isActive));
  }, [participants.fanId]);
}

export const ologyLiveRouter = router({
  // ===== TALENT: Experience Management =====
  createExperience: talentProcedure.input(experienceInputSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const [experience] = await db.insert(ologyLiveExperiences).values({
      talentId: ctx.user.id,
      title: input.title,
      description: input.description || null,
      duration: input.duration,
      price: String(input.price),
      capacityType: input.capacityType,
      maxAttendees: normalizedCapacity(input),
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
      const [existing] = await db.select().from(ologyLiveExperiences)
        .where(and(eq(ologyLiveExperiences.id, input.id), eq(ologyLiveExperiences.talentId, ctx.user.id))).limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });
      const updates: Record<string, unknown> = {};
      for (const key of ['title', 'description', 'duration', 'platform', 'platformLink', 'linkSentAfterBooking', 'category', 'tags', 'coverImageUrl', 'recurringSchedule'] as const) {
        if (input[key] !== undefined) updates[key] = input[key] ?? null;
      }
      if (input.price !== undefined) updates.price = String(input.price);
      if (input.capacityType !== undefined) updates.capacityType = input.capacityType;
      if (input.maxAttendees !== undefined || input.capacityType !== undefined) {
        updates.maxAttendees = normalizedCapacity({
          capacityType: input.capacityType ?? existing.capacityType,
          maxAttendees: input.maxAttendees ?? existing.maxAttendees ?? undefined,
        });
      }
      await db.update(ologyLiveExperiences).set(updates).where(eq(ologyLiveExperiences.id, input.id));
      return { success: true };
    }),

  toggleActive: talentProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const experience = await requireLiveExperience(conn, input.id, ctx.user.id);
        if (input.isActive && !isLiveActive(experience.isActive)) {
          // Make this experience visible to the shared engine inside this
          // transaction. Every own slot is then independently checked with
          // only itself excluded; sibling slots and other experiences remain
          // conflict candidates. A failure rolls this update back.
          await sqlWrite(conn, 'UPDATE ology_live_experiences SET isActive=1 WHERE id=? AND talentId=?', [input.id, ctx.user.id]);
          const slots = await sqlRows<LiveSlotRow>(conn,
            'SELECT * FROM ology_live_time_slots WHERE experienceId=? AND talentId=? ORDER BY startTime,id FOR UPDATE',
            [input.id, ctx.user.id],
          );
          for (const slot of slots) {
            await assertLiveIntervalAvailable(conn, ctx.user.id, liveSlotInterval(slot), { liveSlotId: slot.id });
          }
        }
        await sqlWrite(conn, 'UPDATE ology_live_experiences SET isActive=? WHERE id=? AND talentId=?', [input.isActive ? 1 : 0, input.id, ctx.user.id]);
        // Pausing never makes capacity available; reactivation recomputes the true receipt count.
        const slots = await sqlRows<LiveSlotRow>(conn, 'SELECT * FROM ology_live_time_slots WHERE experienceId=? AND talentId=? FOR UPDATE', [input.id, ctx.user.id]);
        for (const slot of slots) await syncLiveSlotCapacity(conn, slot, input.isActive);
        return { success: true };
      });
    } catch (error) { return asTrpc(error); }
  }),

  deleteExperience: talentProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        await requireLiveExperience(conn, input.id, ctx.user.id);
        const active = await sqlRows<{ count: number | string }>(conn,
          "SELECT COUNT(*) AS count FROM ology_live_bookings WHERE experienceId=? AND status IN ('pending','confirmed') FOR UPDATE", [input.id]);
        if (Number(active[0]?.count || 0) > 0) {
          throw new LiveScheduleError('Cannot delete an experience with pending or confirmed bookings. Cancel them first or deactivate instead.');
        }
        await sqlWrite(conn, 'DELETE FROM ology_live_time_slots WHERE experienceId=? AND talentId=?', [input.id, ctx.user.id]);
        await sqlWrite(conn, 'DELETE FROM ology_live_experiences WHERE id=? AND talentId=?', [input.id, ctx.user.id]);
        return { success: true };
      });
    } catch (error) { return asTrpc(error); }
  }),

  getMyExperiences: talentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return db.select().from(ologyLiveExperiences).where(eq(ologyLiveExperiences.talentId, ctx.user.id)).orderBy(desc(ologyLiveExperiences.createdAt));
  }),

  getMyBookingsAsTalent: talentProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    await reconcileOlogyLiveReservations({ userId: ctx.user.id });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const conditions = [eq(ologyLiveBookings.talentId, ctx.user.id)];
    if (input?.status) conditions.push(eq(ologyLiveBookings.status, input.status as never));
    return db.select().from(ologyLiveBookings).where(and(...conditions)).orderBy(desc(ologyLiveBookings.scheduledAt));
  }),

  // ===== TALENT: Time Slot Management =====
  addTimeSlot: talentProcedure.input(z.object({
    experienceId: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    scheduleTimezone: z.string().max(100).optional(),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const experience = await requireLiveExperience(conn, input.experienceId, ctx.user.id);
        const interval = parseManualLiveInterval(input, Number(experience.duration));
        await assertLiveIntervalAvailable(conn, ctx.user.id, interval);
        const id = await insertLiveSlot(conn, {
          experienceId: experience.id,
          talentId: ctx.user.id,
          interval,
          spotsTotal: Math.max(1, Number(experience.maxAttendees || 1)),
        });
        return { id };
      });
    } catch (error) { return asTrpc(error); }
  }),

  removeTimeSlot: talentProcedure.input(z.object({ slotId: z.number() })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const slot = await getLockedLiveSlot(conn, input.slotId, ctx.user.id);
        if (!slot) throw new LiveScheduleError('Time slot not found.', 'not_found');
        const active = await sqlRows<{ count: number | string }>(conn,
          "SELECT COUNT(*) AS count FROM ology_live_bookings WHERE experienceId=? AND scheduledAt=? AND status IN ('pending','confirmed') FOR UPDATE",
          [slot.experienceId, slot.startTime],
        );
        if (Number(active[0]?.count || 0) > 0) throw new LiveScheduleError('Cannot remove a slot with pending or confirmed bookings.');
        await sqlWrite(conn, 'DELETE FROM ology_live_time_slots WHERE id=? AND talentId=?', [slot.id, ctx.user.id]);
        return { success: true };
      });
    } catch (error) { return asTrpc(error); }
  }),

  getMyTimeSlots: talentProcedure.input(z.object({ experienceId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const conditions = [eq(ologyLiveTimeSlots.talentId, ctx.user.id)];
    if (input?.experienceId) conditions.push(eq(ologyLiveTimeSlots.experienceId, input.experienceId));
    return db.select().from(ologyLiveTimeSlots).where(and(...conditions)).orderBy(asc(ologyLiveTimeSlots.startTime));
  }),

  // ===== FAN: Browse & Book =====
  getTalentExperiences: publicProcedure.input(z.object({ talentId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(ologyLiveExperiences).where(and(eq(ologyLiveExperiences.talentId, input.talentId), eq(ologyLiveExperiences.isActive, true))).orderBy(asc(ologyLiveExperiences.createdAt));
  }),

  getExperienceById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const [experience] = await db.select().from(ologyLiveExperiences).where(eq(ologyLiveExperiences.id, input.id)).limit(1);
    if (!experience) throw new TRPCError({ code: 'NOT_FOUND', message: 'Experience not found' });
    return experience;
  }),

  getAvailableSlots: publicProcedure.input(z.object({ experienceId: z.number() })).query(async ({ input }) => {
    await reconcileOlogyLiveReservations({ experienceId: input.experienceId });
    const db = await getDb();
    if (!db) return [];
    return db.select().from(ologyLiveTimeSlots).where(and(
      eq(ologyLiveTimeSlots.experienceId, input.experienceId),
      eq(ologyLiveTimeSlots.isAvailable, true),
      gte(ologyLiveTimeSlots.startTime, new Date()),
    )).orderBy(asc(ologyLiveTimeSlots.startTime));
  }),

  bookExperience: protectedProcedure.input(z.object({
    experienceId: z.number(),
    slotId: z.number(),
    notes: z.string().max(500).optional(),
  })).mutation(async ({ ctx, input }) => {
    let reservation: { bookingId: number; talentId: number; price: number; experience: LiveExperienceRow; slot: LiveSlotRow };
    try {
      reservation = await withLockedLiveTalentForReservation(input.experienceId, input.slotId, ctx.user.id, input.notes || null);
    } catch (error) { return asTrpc(error); }

    if (reservation.price === 0) return { bookingId: reservation.bookingId, checkoutUrl: null };
    if (!stripe) {
      // This branch is normally reached before a reservation is made, but it is
      // deliberately retained as a fail-closed guard if configuration changes.
      await cancelUnlinkedReservation(reservation.talentId, reservation.bookingId);
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Payments are temporarily unavailable; this paid session was not booked.' });
    }

    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
    try {
      const baseUrl = ENV.baseUrl || 'https://www.ologywood.com';
      const platformFee = reservation.price * (PLATFORM_FEE_PERCENT / 100);
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(reservation.price * 100),
            product_data: {
              name: `Ology Live: ${reservation.experience.title}`,
              description: `${reservation.experience.duration} min session on ${reservation.experience.platform} · Includes a 15% Ologywood technology marketplace service fee deducted from talent earnings; representative fees are separate`,
            },
          }, quantity: 1,
        }],
        success_url: `${baseUrl}/ology-live/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/ology-live/booking-cancelled`,
        metadata: {
          type: 'ology_live_booking',
          experienceId: String(reservation.experience.id),
          slotId: String(reservation.slot.id),
          fanId: String(ctx.user.id),
          talentId: String(reservation.talentId),
          bookingId: String(reservation.bookingId),
          platformFeeAmount: String(Math.round(platformFee * 100)),
          platformFeePercent: String(PLATFORM_FEE_PERCENT),
          platformFeeClassification: 'technology_marketplace_service',
          athleteAgentFeeIncluded: 'false',
        },
        payment_intent_data: { metadata: {
          type: 'ology_live_booking',
          bookingId: String(reservation.bookingId),
          fanId: String(ctx.user.id),
          talentId: String(reservation.talentId),
          experienceId: String(reservation.experience.id),
          slotId: String(reservation.slot.id),
        } },
      });
      if (!session.id || !session.url) throw new Error('Stripe did not return a checkout session.');
    } catch (error) {
      await cancelUnlinkedReservation(reservation.talentId, reservation.bookingId);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Checkout could not be created; your reservation was released. Please try again.' });
    }

    const attached = await withLockedLiveTalent(reservation.talentId, async conn => {
      const booking = await getLockedLiveBookingForParticipants(conn, reservation.bookingId, { talentId: reservation.talentId, fanId: ctx.user.id });
      if (!booking || booking.status !== 'pending') return false;
      // A verified completion may win the attach race; never overwrite its binding or expire a paid session.
      if (booking.stripePaymentIntentId === session.id) return true;
      if (booking.paymentStatus !== 'unpaid' || booking.stripePaymentIntentId) return false;
      const write = await sqlWrite(conn,
        "UPDATE ology_live_bookings SET stripePaymentIntentId=? WHERE id=? AND status='pending' AND paymentStatus='unpaid' AND stripePaymentIntentId IS NULL",
        [session.id, reservation.bookingId],
      );
      return Number(write.affectedRows || 0) === 1;
    }, [ctx.user.id]);
    if (!attached) {
      try { await stripe.checkout.sessions.expire(session.id); } catch { /* Do not expose an unlinked checkout. */ }
      throw new TRPCError({ code: 'CONFLICT', message: 'This reservation changed before checkout was ready. Please choose a slot again.' });
    }
    return { bookingId: reservation.bookingId, checkoutUrl: session.url };
  }),

  getMyBookingsAsFan: protectedProcedure.query(async ({ ctx }) => {
    await reconcileOlogyLiveReservations({ userId: ctx.user.id });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    return db.select().from(ologyLiveBookings).where(eq(ologyLiveBookings.fanId, ctx.user.id)).orderBy(desc(ologyLiveBookings.scheduledAt));
  }),

  cancelBooking: protectedProcedure.input(z.object({ bookingId: z.number(), reason: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
    let participants: Awaited<ReturnType<typeof getLiveBookingParticipants>>;
    try { participants = await getLiveBookingParticipants(input.bookingId); } catch (error) { return asTrpc(error); }
    if (!participants) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
    const selectedParticipants = participants;
    try {
      return await withLockedLiveTalent(selectedParticipants.talentId, async conn => {
        const booking = await getLockedLiveBookingForParticipants(conn, input.bookingId, selectedParticipants);
        if (!booking) throw new LiveScheduleError('Booking not found.', 'not_found');
        const isFan = booking.fanId === ctx.user.id;
        const isTalent = booking.talentId === ctx.user.id;
        if (!isFan && !isTalent && ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to cancel this booking' });
        if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show') {
          throw new LiveScheduleError('Booking cannot be cancelled in its current state.');
        }
        await sqlWrite(conn,
          "UPDATE ology_live_bookings SET status='cancelled', cancelledAt=UTC_TIMESTAMP(), cancelledBy=?, cancellationReason=? WHERE id=? AND status IN ('pending','confirmed')",
          [isFan ? 'fan' : 'talent', input.reason || null, booking.id],
        );
        const slot = await findSlotForBooking(conn, booking);
        const experience = await requireLiveExperience(conn, booking.experienceId, booking.talentId);
        if (slot) await syncLiveSlotCapacity(conn, slot, isLiveActive(experience.isActive));
        return { success: true };
      }, [selectedParticipants.fanId]);
    } catch (error) { return asTrpc(error); }
  }),

  confirmBooking: talentProcedure.input(z.object({ bookingId: z.number(), joinLink: z.string().max(512).optional() })).mutation(async ({ ctx, input }) => {
    try {
      const participants = await getLiveBookingParticipants(input.bookingId);
      if (!participants || participants.talentId !== ctx.user.id) throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found.' });
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const booking = await getLockedLiveBookingForParticipants(conn, input.bookingId, participants);
        if (!booking || booking.talentId !== ctx.user.id) throw new LiveScheduleError('Booking not found.', 'not_found');
        if (booking.status !== 'pending') throw new LiveScheduleError('Only a pending booking can be confirmed.');
        if (booking.paymentStatus !== 'paid') throw new LiveScheduleError('Payment must be verified before this reservation can be confirmed.');
        const experience = await requireLiveExperience(conn, booking.experienceId, ctx.user.id);
        const slot = await findSlotForBooking(conn, booking);
        if (!slot) throw new LiveScheduleError('The booked slot no longer exists.');
        // A group participant is allowed in the booked slot, but confirmation
        // cannot override a later ordinary/private/other-Live conflict.
        await assertLiveIntervalAvailable(conn, ctx.user.id, liveSlotInterval(slot), { liveSlotId: slot.id }, [booking.fanId]);
        const values: unknown[] = [];
        let statement = "UPDATE ology_live_bookings SET status='confirmed'";
        if (input.joinLink) { statement += ', joinLink=?'; values.push(input.joinLink); }
        statement += " WHERE id=? AND talentId=? AND status='pending' AND paymentStatus='paid'";
        values.push(booking.id, ctx.user.id);
        const write = await sqlWrite(conn, statement, values);
        if (Number(write.affectedRows || 0) !== 1) throw new LiveScheduleError('Booking changed before it could be confirmed.');
        await syncLiveSlotCapacity(conn, slot, isLiveActive(experience.isActive));
        return { success: true };
      }, [participants.fanId]);
    } catch (error) { return asTrpc(error); }
  }),

  // ===== PUBLIC: Browse All Experiences =====
  browseExperiences: publicProcedure.input(z.object({
    category: z.string().optional(), capacityType: z.string().optional(),
    limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq(ologyLiveExperiences.isActive, true)];
    if (input?.category) conditions.push(eq(ologyLiveExperiences.category, input.category));
    if (input?.capacityType) conditions.push(eq(ologyLiveExperiences.capacityType, input.capacityType as never));
    return db.select().from(ologyLiveExperiences).where(and(...conditions)).orderBy(desc(ologyLiveExperiences.createdAt)).limit(input?.limit || 20).offset(input?.offset || 0);
  }),

  // ===== RECURRING AVAILABILITY =====
  setRecurringSchedule: talentProcedure.input(z.object({ experienceId: z.number(), schedule: recurringScheduleSchema })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const experience = await requireLiveExperience(conn, input.experienceId, ctx.user.id);
        await sqlWrite(conn, 'UPDATE ology_live_experiences SET recurringSchedule=? WHERE id=? AND talentId=?', [JSON.stringify(input.schedule), input.experienceId, ctx.user.id]);
        const outcome = await createRecurringLiveSlots(conn, experience, input.schedule as RecurringLiveSchedule);
        return { success: true, ...outcome };
      });
    } catch (error) { return asTrpc(error); }
  }),

  // Explicit user action only; no worker, startup, or cron invokes recurrence.
  regenerateSlots: talentProcedure.input(z.object({ experienceId: z.number() })).mutation(async ({ ctx, input }) => {
    try {
      return await withLockedLiveTalent(ctx.user.id, async conn => {
        const experience = await requireLiveExperience(conn, input.experienceId, ctx.user.id);
        if (!experience.recurringSchedule) throw new LiveScheduleError('No recurring schedule set.');
        let schedule: RecurringLiveSchedule;
        try {
          schedule = (typeof experience.recurringSchedule === 'string' ? JSON.parse(experience.recurringSchedule) : experience.recurringSchedule) as RecurringLiveSchedule;
        } catch { throw new LiveScheduleError('The saved recurring schedule is invalid.'); }
        const validated = recurringScheduleSchema.parse(schedule) as RecurringLiveSchedule;
        const outcome = await createRecurringLiveSlots(conn, experience, validated);
        return { success: true, ...outcome };
      });
    } catch (error) { return asTrpc(error); }
  }),
});

/** Reserve capacity and create the receipt inside one talent schedule lock. */
async function withLockedLiveTalentForReservation(
  experienceId: number,
  slotId: number,
  fanId: number,
  notes: string | null,
): Promise<{ bookingId: number; talentId: number; price: number; experience: LiveExperienceRow; slot: LiveSlotRow }> {
  // Lookup merely selects which deterministic owner row will be locked. Every
  // authorization, capacity, conflict, and write below is repeated in that lock.
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  await reconcileOlogyLiveReservations({ experienceId });
  const [outside] = await db.select({ talentId: ologyLiveExperiences.talentId }).from(ologyLiveExperiences)
    .where(eq(ologyLiveExperiences.id, experienceId)).limit(1);
  if (!outside) throw new LiveScheduleError('Experience not found or inactive.', 'not_found');

  return withLockedLiveTalent(outside.talentId, async conn => {
    const experience = await requireLiveExperience(conn, experienceId, outside.talentId);
    if (!isLiveActive(experience.isActive)) throw new LiveScheduleError('Experience not found or inactive.', 'not_found');
    if (experience.talentId === fanId) throw new LiveScheduleError('You cannot book your own experience.');
    const price = Number(experience.price);
    if (!Number.isFinite(price) || price < 0) throw new LiveScheduleError('This experience has an invalid price.');
    if (price > 0 && !stripe) throw new LiveScheduleError('Payments are temporarily unavailable; this paid session was not booked.');

    const slot = await getLockedLiveSlot(conn, slotId, experience.talentId, experience.id);
    if (!slot || !truthy(slot.isAvailable)) throw new LiveScheduleError('Time slot not available.', 'not_found');
    if (new Date(slot.startTime).getTime() <= Date.now()) throw new LiveScheduleError('Time slot is no longer available.');
    const existing = await sqlRows<{ id: number }>(conn,
      "SELECT id FROM ology_live_bookings WHERE experienceId=? AND fanId=? AND scheduledAt=? AND status IN ('pending','confirmed') FOR UPDATE",
      [experience.id, fanId, slot.startTime],
    );
    if (existing.length) throw new LiveScheduleError('You already hold a booking for this time slot.', 'duplicate');
    const countRows = await sqlRows<{ count: number | string }>(conn,
      "SELECT COUNT(*) AS count FROM ology_live_bookings WHERE experienceId=? AND scheduledAt=? AND status IN ('pending','confirmed') FOR UPDATE",
      [experience.id, slot.startTime],
    );
    if (Number(countRows[0]?.count || 0) >= Number(slot.spotsTotal)) throw new LiveScheduleError('This time slot is fully booked.', 'capacity');
    await assertLiveIntervalAvailable(conn, experience.talentId, liveSlotInterval(slot), { liveSlotId: slot.id }, [fanId]);

    const platformFee = price * (PLATFORM_FEE_PERCENT / 100);
    const write = await sqlWrite(conn,
      "INSERT INTO ology_live_bookings (experienceId,fanId,talentId,scheduledAt,duration,status,amount,platformFee,paymentStatus,platform,joinLink,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [experience.id, fanId, experience.talentId, slot.startTime, experience.duration, price === 0 ? 'confirmed' : 'pending', String(price), String(platformFee), price === 0 ? 'paid' : 'unpaid', experience.platform, truthy(experience.linkSentAfterBooking) ? null : experience.platformLink, notes],
    );
    if (!write.insertId) throw new Error('Booking reservation was not created.');
    await syncLiveSlotCapacity(conn, slot, true);
    return { bookingId: Number(write.insertId), talentId: experience.talentId, price, experience, slot };
  }, [fanId]);
}
