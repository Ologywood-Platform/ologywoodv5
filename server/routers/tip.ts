/**
 * Tip Router - Stripe-powered tipping for artists
 * 100% of tips go to the artist (no platform fee)
 */
import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { stripeConnectAccounts, artistProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const tipRouter = router({
  /**
   * Check if an artist can receive tips (has active Stripe Connect)
   */
  canReceiveTips: publicProcedure
    .input(z.object({ artistId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { canReceive: false };

      const [artist] = await db
        .select({ userId: artistProfiles.userId, artistName: artistProfiles.artistName })
        .from(artistProfiles)
        .where(eq(artistProfiles.id, input.artistId))
        .limit(1);

      if (!artist) return { canReceive: false };

      const [account] = await db
        .select()
        .from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, artist.userId))
        .limit(1);

      if (!account || account.status !== 'active' || !account.chargesEnabled) {
        return { canReceive: false };
      }

      return { canReceive: true, artistName: artist.artistName };
    }),

  /**
   * Create a Stripe Payment Intent for tipping an artist
   * No platform fee — 100% goes to the artist
   */
  createTipPayment: publicProcedure
    .input(z.object({
      artistId: z.number(),
      amount: z.number().min(100).max(50000),
      tipperName: z.string().optional(),
      message: z.string().max(200).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [artist] = await db
        .select({ userId: artistProfiles.userId, artistName: artistProfiles.artistName })
        .from(artistProfiles)
        .where(eq(artistProfiles.id, input.artistId))
        .limit(1);

      if (!artist) throw new Error('Artist not found');

      const [account] = await db
        .select()
        .from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, artist.userId))
        .limit(1);

      if (!account || account.status !== 'active' || !account.chargesEnabled) {
        throw new Error('Artist is not set up to receive tips. They need to connect their Stripe account first.');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.amount,
        currency: 'usd',
        transfer_data: {
          destination: account.stripeAccountId,
        },
        metadata: {
          type: 'tip',
          artistId: input.artistId.toString(),
          artistUserId: artist.userId.toString(),
          artistName: artist.artistName,
          tipperName: input.tipperName || 'Anonymous',
          message: input.message || '',
        },
        description: `Tip for ${artist.artistName}`,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),
});
