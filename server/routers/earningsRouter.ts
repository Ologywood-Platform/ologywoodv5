import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { bookings, artistPayouts } from '../../drizzle/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export const earningsRouter = router({
  /**
   * Get artist earnings summary
   * Returns total, pending, completed, and paid out earnings
   */
  getArtistEarnings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('Unauthorized');

    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const artistId = ctx.user.id;

      // Get all bookings for this artist
      const allBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.artistId, artistId));

      // Calculate earnings by status
      let totalEarnings = 0;
      let pendingEarnings = 0;
      let completedEarnings = 0;
      let paidOutEarnings = 0;

      for (const booking of allBookings) {
        const fee = parseFloat(booking.totalFee?.toString() || '0');
        const platformFee = fee * 0.01; // 1% platform fee
        const artistEarning = fee - platformFee;

        totalEarnings += artistEarning;

        if (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'deposit_paid') {
          pendingEarnings += artistEarning;
        } else if (booking.paymentStatus === 'fully_paid') {
          completedEarnings += artistEarning;
        } else if (booking.paymentStatus === 'refunded') {
          // Don't count refunded earnings
        }
      }

      // Get paid out earnings from artist_payouts
      const payouts = await db
        .select()
        .from(artistPayouts)
        .where(and(eq(artistPayouts.artistId, artistId), eq(artistPayouts.status, 'completed')));

      for (const payout of payouts) {
        paidOutEarnings += parseFloat(payout.amount?.toString() || '0');
      }

      return {
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        completedEarnings: parseFloat(completedEarnings.toFixed(2)),
        paidOutEarnings: parseFloat(paidOutEarnings.toFixed(2)),
      };
    } catch (error: any) {
      console.error('Error getting artist earnings:', error);
      throw new Error(error.message || 'Failed to fetch earnings');
    }
  }),

  /**
   * Get recent transactions for artist
   * Returns list of recent bookings with payment status
   */
  getRecentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');

      try {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const artistId = ctx.user.id;

        // Get recent bookings
        const recentBookings = await db
          .select()
          .from(bookings)
          .where(eq(bookings.artistId, artistId))
          .orderBy(desc(bookings.eventDate))
          .limit(input.limit);

        // Format transactions
        const transactions = recentBookings.map((booking) => {
          const fee = parseFloat(booking.totalFee?.toString() || '0');
          const platformFee = fee * 0.01;
          const artistEarning = fee - platformFee;

          return {
            bookingId: booking.id,
            venueName: 'Venue', // This would need to be joined with venue data in real implementation
            eventDate: booking.eventDate,
            amount: artistEarning,
            totalFee: fee,
            platformFee,
            status: booking.paymentStatus,
            eventDetails: booking.eventDetails,
          };
        });

        return transactions;
      } catch (error: any) {
        console.error('Error getting recent transactions:', error);
        throw new Error(error.message || 'Failed to fetch transactions');
      }
    }),

  /**
   * Get Stripe Connect status for artist
   */
  getConnectStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('Unauthorized');

    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const { stripeConnectAccounts } = await import('../../drizzle/schema');
      const accounts = await db
        .select()
        .from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, ctx.user.id))
        .limit(1);

      if (accounts.length === 0) {
        return {
          isConnected: false,
          stripeAccountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
        };
      }

      const account = accounts[0];
      return {
        isConnected: account.status === 'active',
        stripeAccountId: account.stripeAccountId,
        chargesEnabled: account.chargesEnabled,
        payoutsEnabled: account.payoutsEnabled,
      };
    } catch (error: any) {
      console.error('Error getting Stripe Connect status:', error);
      return {
        isConnected: false,
        stripeAccountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
      };
    }
  }),

  /**
   * Get onboarding link for Stripe Connect
   */
  getOnboardingLink: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('Unauthorized');

    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-12-15.clover',
      });

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const { stripeConnectAccounts } = await import('../../drizzle/schema');
      const accounts = await db
        .select()
        .from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, ctx.user.id))
        .limit(1);

      if (accounts.length === 0) {
        throw new Error('No Stripe Connect account found');
      }

      const account = accounts[0];
      const link = await stripe.accountLinks.create({
        account: account.stripeAccountId,
        type: 'account_onboarding',
        refresh_url: `${process.env.BASE_URL || 'http://localhost:3000'}/earnings?refresh=true`,
        return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/earnings?connected=true`,
      });

      return link.url;
    } catch (error: any) {
      console.error('Error getting onboarding link:', error);
      throw new Error(error.message || 'Failed to get onboarding link');
    }
  }),
});
