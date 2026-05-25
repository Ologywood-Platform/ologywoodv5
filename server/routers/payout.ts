import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { artistEarnings, artistPayouts, bookings } from '../../drizzle/schema';
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import * as db from '../db';

export const payoutRouter = router({
  getPayouts: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await getDb();
    if (!database) return [];

    const payouts = await database
      .select()
      .from(artistPayouts)
      .where(eq(artistPayouts.artistId, ctx.user.id));

    return payouts;
  }),

  getEarnings: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await getDb();
    if (!database) {
      return {
        completedEarnings: 0,
        recentEarnings: [],
        pendingEarnings: 0,
        paidOutEarnings: 0,
        totalEarnings: 0,
      };
    }

    // Get earnings from the artist_earnings table
    const earnings = await database
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

  /**
   * Detailed earnings breakdown with per-booking revenue, door split calculations,
   * monthly/quarterly summaries
   */
  getEarningsBreakdown: protectedProcedure
    .input(z.object({
      period: z.enum(['all', 'month', 'quarter', 'year']).default('all'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        return { bookingEarnings: [], monthlySummary: [], quarterlySummary: [], totals: { gross: 0, platformFee: 0, net: 0, bookingCount: 0 } };
      }

      const period = input?.period || 'all';
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        return { bookingEarnings: [], monthlySummary: [], quarterlySummary: [], totals: { gross: 0, platformFee: 0, net: 0, bookingCount: 0 } };
      }

      // Get all bookings for this artist that have financial data
      const artistBookings = await database.select().from(bookings)
        .where(eq(bookings.artistId, artistProfile.id))
        .orderBy(desc(bookings.eventDate));

      // Filter by period
      const now = new Date();
      let startDate: Date | null = null;
      if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'quarter') {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
      } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      const filteredBookings = startDate
        ? artistBookings.filter(b => new Date(b.eventDate) >= startDate!)
        : artistBookings;

      // Calculate per-booking earnings with door split details
      const bookingEarnings = await Promise.all(
        filteredBookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .map(async (b) => {
            const venueProfile = await db.getVenueProfileById(b.venueId);
            const venueName = venueProfile?.organizationName || `Venue #${b.venueId}`;

            // Calculate earnings based on payment terms
            let grossAmount = 0;
            let doorSplitDetails: { type: string; artistPercent?: number; doorRevenue?: number; guarantee?: number } | null = null;

            const termsType = b.paymentTermsType || 'flat_guarantee';

            if (termsType === 'flat_guarantee') {
              grossAmount = parseFloat(b.totalFee as string || '0');
              doorSplitDetails = { type: 'Flat Guarantee' };
            } else if (termsType === 'door_split') {
              const artistPercent = b.doorSplitArtistPercent || 80;
              const doorRevenue = parseFloat(b.doorRevenue as string || '0');
              grossAmount = doorRevenue > 0 ? doorRevenue * (artistPercent / 100) : parseFloat(b.totalFee as string || '0');
              doorSplitDetails = { type: 'Door Split', artistPercent, doorRevenue };
            } else if (termsType === 'guarantee_vs_percentage') {
              const guarantee = parseFloat(b.guaranteeAmount as string || '0');
              const artistPercent = b.doorSplitArtistPercent || 80;
              const doorRevenue = parseFloat(b.doorRevenue as string || '0');
              const doorAmount = doorRevenue * (artistPercent / 100);
              grossAmount = Math.max(guarantee, doorAmount) || parseFloat(b.totalFee as string || '0');
              doorSplitDetails = { type: 'Guarantee vs %', artistPercent, doorRevenue, guarantee };
            }

            // Use settlement amount if available
            if (b.settlementAmount) {
              grossAmount = parseFloat(b.settlementAmount as string);
            }

            const platformFee = grossAmount * 0.01; // 1% platform fee
            const netAmount = grossAmount - platformFee;

            return {
              bookingId: b.id,
              eventDate: b.eventDate,
              eventDetails: b.eventDetails || 'Event',
              venueName,
              status: b.status,
              paymentStatus: b.paymentStatus,
              paymentTermsType: termsType,
              doorSplitDetails,
              grossAmount: Math.round(grossAmount * 100) / 100,
              platformFee: Math.round(platformFee * 100) / 100,
              netAmount: Math.round(netAmount * 100) / 100,
              attendance: b.attendance,
              settledAt: b.settledAt,
            };
          })
      );

      // Monthly summary
      const monthlyMap: Record<string, { gross: number; platformFee: number; net: number; count: number }> = {};
      for (const e of bookingEarnings) {
        const monthKey = new Date(e.eventDate).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { gross: 0, platformFee: 0, net: 0, count: 0 };
        }
        monthlyMap[monthKey].gross += e.grossAmount;
        monthlyMap[monthKey].platformFee += e.platformFee;
        monthlyMap[monthKey].net += e.netAmount;
        monthlyMap[monthKey].count += 1;
      }
      const monthlySummary = Object.entries(monthlyMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, data]) => ({ month, ...data }));

      // Quarterly summary
      const quarterlyMap: Record<string, { gross: number; platformFee: number; net: number; count: number }> = {};
      for (const e of bookingEarnings) {
        const d = new Date(e.eventDate);
        const q = Math.floor(d.getMonth() / 3) + 1;
        const quarterKey = `${d.getFullYear()}-Q${q}`;
        if (!quarterlyMap[quarterKey]) {
          quarterlyMap[quarterKey] = { gross: 0, platformFee: 0, net: 0, count: 0 };
        }
        quarterlyMap[quarterKey].gross += e.grossAmount;
        quarterlyMap[quarterKey].platformFee += e.platformFee;
        quarterlyMap[quarterKey].net += e.netAmount;
        quarterlyMap[quarterKey].count += 1;
      }
      const quarterlySummary = Object.entries(quarterlyMap)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([quarter, data]) => ({ quarter, ...data }));

      // Totals
      const totals = {
        gross: bookingEarnings.reduce((sum, e) => sum + e.grossAmount, 0),
        platformFee: bookingEarnings.reduce((sum, e) => sum + e.platformFee, 0),
        net: bookingEarnings.reduce((sum, e) => sum + e.netAmount, 0),
        bookingCount: bookingEarnings.length,
      };

      return { bookingEarnings, monthlySummary, quarterlySummary, totals };
    }),

  getPayoutHistory: protectedProcedure.query(async ({ ctx }: any) => {
    const database = await getDb();
    if (!database) return [];

    const payouts = await database
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
      const database = await getDb();
      if (!database) throw new Error('Database not available');

      // Create a payout request in the database
      await database.insert(artistPayouts).values({
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
      const database = await getDb();
      if (!database) throw new Error('Database not available');

      await database
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
      const database = await getDb();
      if (!database) throw new Error('Database not available');

      await database
        .update(artistPayouts)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(artistPayouts.id, input.payoutId));

      return { success: true, message: 'Payout completed' };
    }),
});
