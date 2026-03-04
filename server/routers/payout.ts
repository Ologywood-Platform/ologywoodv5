import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { artistEarnings, artistPayouts } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export const payoutRouter = router({
  getPayouts: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) return [];

    const payouts = await db
      .select()
      .from(artistPayouts)
      .where(eq(artistPayouts.artistId, ctx.user.id));

    return payouts;
  }),

  getEarnings: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      return {
        completedEarnings: 0,
        recentEarnings: [],
        pendingEarnings: 0,
        paidOutEarnings: 0,
        totalEarnings: 0,
      };
    }

    // Get earnings from the artist_earnings table
    const earnings = await db
      .select()
      .from(artistEarnings)
      .where(eq(artistEarnings.artistId, ctx.user.id));

    let completedEarnings = 0;
    let pendingEarnings = 0;
    let paidOutEarnings = 0;

    for (const e of earnings) {
      const net = parseFloat(e.netAmount as string) || 0;
      if (e.status === 'completed') completedEarnings += net;
      else if (e.status === 'pending') pendingEarnings += net;
      else if (e.status === 'paid_out') paidOutEarnings += net;
    }

    const totalEarnings = completedEarnings + pendingEarnings + paidOutEarnings;

    const recentEarnings = earnings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        amount: parseFloat(e.netAmount as string) || 0,
        date: e.createdAt,
        bookingId: e.bookingId,
        status: e.status,
      }));

    return {
      completedEarnings,
      recentEarnings,
      pendingEarnings,
      paidOutEarnings,
      totalEarnings,
    };
  }),

  getPayoutHistory: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) return [];

    const payouts = await db
      .select()
      .from(artistPayouts)
      .where(eq(artistPayouts.artistId, ctx.user.id));

    return payouts;
  }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        payoutMethod: z.enum(['bank_transfer', 'stripe_connect', 'manual']),
        bankAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create a payout request in the database
      await db.insert(artistPayouts).values({
        artistId: ctx.user.id,
        amount: input.amount.toFixed(2),
        currency: 'USD',
        status: 'pending',
        payoutMethod: input.payoutMethod,
        bankAccountId: input.bankAccountId ? parseInt(input.bankAccountId) : null,
        notes: 'Payout request via dashboard',
      });

      return { success: true, message: 'Payout request submitted' };
    }),

  processPayout: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(artistPayouts)
        .set({ status: 'processing', processedAt: new Date() })
        .where(eq(artistPayouts.id, input.payoutId));

      return { success: true, message: 'Payout processing started' };
    }),

  completePayout: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(artistPayouts)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(artistPayouts.id, input.payoutId));

      return { success: true, message: 'Payout completed' };
    }),
});
