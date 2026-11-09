import { getDefaultStripeApiKey } from '../services/stripeWebhookMode';
/**
 * Booking Checkout Route — handles deposit and final payment for bookings.
 * 
 * Payment flow:
 * 1. Venue requests booking → status: pending, paymentStatus: unpaid
 * 2. Artist accepts → status: confirmed (but still unpaid)
 * 3. Venue pays 50% deposit → paymentStatus: deposit_paid
 * 4. Venue pays remaining 50% → paymentStatus: fully_paid
 * 
 * Uses Stripe Connect to route payments to the artist's connected account.
 * Platform takes 1% fee via application_fee_amount.
 */

import { Router } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db';
import { bookings, stripeConnectAccounts, artistProfiles } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { positiveRouteId } from './routeInput';
import { trustedCheckoutOrigin } from '../services/trustedOrigin';

const stripe = new Stripe(getDefaultStripeApiKey(), {
  apiVersion: '2025-12-15.clover',
});

const PLATFORM_FEE_PERCENT = 1; // 1% platform fee

function parseUsdCents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amountCents = Math.round(Number(text) * 100);
  return Number.isSafeInteger(amountCents) && amountCents >= 0 && amountCents <= 100_000_000
    ? amountCents
    : null;
}

const bookingCheckoutRouter = Router();

/**
 * POST /api/booking-checkout
 * Creates a Stripe Checkout session for booking deposit or final payment.
 * 
 * Body: { bookingId: number, paymentType: 'deposit' | 'final' }
 */
bookingCheckoutRouter.post('/api/booking-checkout', async (req, res) => {
  try {
    const { bookingId: rawBookingId, paymentType } = req.body;
    const bookingId = positiveRouteId(rawBookingId);

    if (bookingId === null || (paymentType !== 'deposit' && paymentType !== 'final')) {
      return res.status(400).json({ error: 'Missing bookingId or invalid paymentType (deposit|final)' });
    }

    // Get the user from session
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Fetch the booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify the user is the venue/client for this booking
    // For client bookings, venueId stores the client's user ID
    if (booking.venueId !== userId) {
      return res.status(403).json({ error: 'Only the booking owner can make payments for this booking' });
    }

    // Validate booking status
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled booking' });
    }

    const totalFeeCents = parseUsdCents(booking.totalFee);
    if (totalFeeCents === null || totalFeeCents < 50) {
      return res.status(400).json({ error: 'Booking fee must be at least $0.50' });
    }

    // Calculate deposit (50%) and remaining amounts
    const depositCents = Math.round(totalFeeCents / 2);
    const remainingCents = totalFeeCents - depositCents;

    // Determine the amount based on payment type
    let amountCents: number;
    let description: string;

    if (paymentType === 'deposit') {
      if (booking.paymentStatus !== 'unpaid') {
        return res.status(400).json({ error: 'Deposit has already been paid' });
      }
      amountCents = depositCents;
      description = `Booking #${bookingId} — 50% Deposit`;
    } else {
      // final payment
      if (booking.paymentStatus !== 'deposit_paid') {
        return res.status(400).json({ error: 'Deposit must be paid before final payment' });
      }
      amountCents = remainingCents;
      description = `Booking #${bookingId} — Final Payment (Remaining Balance)`;
    }

    // Calculate platform fee (1%)
    const platformFeeCents = Math.max(1, Math.round(amountCents * PLATFORM_FEE_PERCENT / 100));

    // Look up the artist's userId from their profile (booking.artistId is the profile ID)
    const [artistProfile] = await db
      .select()
      .from(artistProfiles)
      .where(eq(artistProfiles.id, booking.artistId))
      .limit(1);

    // Look up the artist's Stripe Connect account using their userId
    let connectAccount = null;
    if (artistProfile) {
      const [account] = await db
        .select()
        .from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, artistProfile.userId))
        .limit(1);
      connectAccount = account || null;
    }

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
            description: `Event Date: ${new Date(booking.eventDate).toLocaleDateString()} · Ologywood 1% technology marketplace service fee is deducted from the talent payout; representative fees are separate`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      metadata: {
        bookingId: bookingId.toString(),
        paymentType,
        venueId: userId.toString(),
        artistId: booking.artistId.toString(),
        platformFeeAmount: platformFeeCents.toString(),
        platformFeePercent: String(PLATFORM_FEE_PERCENT),
        platformFeeClassification: 'technology_marketplace_service',
        athleteAgentFeeIncluded: 'false',
      },
      client_reference_id: userId.toString(),
      success_url: `${trustedCheckoutOrigin(process.env.BASE_URL, req.headers.origin)}/booking/${bookingId}?payment=success&type=${paymentType}`,
      cancel_url: `${trustedCheckoutOrigin(process.env.BASE_URL, req.headers.origin)}/booking/${bookingId}?payment=cancelled`,
      allow_promotion_codes: true,
    };

    // If artist has a connected Stripe account with charges enabled, use Connect
    if (connectAccount && connectAccount.chargesEnabled && connectAccount.stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: connectAccount.stripeAccountId,
        },
      };
      console.log(`[BookingCheckout] Using Stripe Connect with platform fee ${platformFeeCents} cents`);
    } else {
      console.log('[BookingCheckout] No active Connect account; payment goes to platform');
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[BookingCheckout] Created ${paymentType} checkout session`);

    return res.json({ url: session.url });
  } catch (error: any) {
    console.error('[BookingCheckout] Error:', { error: error instanceof Error ? error.name : 'UnknownError' });
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * GET /api/booking-payment-status/:bookingId
 * Returns the payment status and amounts for a booking.
 */
bookingCheckoutRouter.get('/api/booking-payment-status/:bookingId', async (req, res) => {
  try {
    const bookingId = positiveRouteId(req.params.bookingId);
    if (bookingId === null) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const [artistProfile] = await db
      .select({ userId: artistProfiles.userId })
      .from(artistProfiles)
      .where(eq(artistProfiles.id, booking.artistId))
      .limit(1);
    const isVenue = booking.venueId === userId;
    const isArtist = artistProfile?.userId === userId;

    // Only venue or artist can view payment status.
    if (!isVenue && !isArtist) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    const totalFeeCents = parseUsdCents(booking.totalFee);
    if (totalFeeCents === null) {
      return res.status(500).json({ error: 'Booking fee is invalid' });
    }
    const totalFee = totalFeeCents / 100;
    const depositAmount = Math.round(totalFee / 2 * 100) / 100;
    const remainingAmount = Math.round((totalFee - depositAmount) * 100) / 100;

    return res.json({
      bookingId: booking.id,
      totalFee,
      depositAmount,
      remainingAmount,
      paymentStatus: booking.paymentStatus,
      depositPaidAt: booking.depositPaidAt,
      finalPaidAt: booking.finalPaidAt,
      status: booking.status,
      isVenue,
      isArtist,
    });
  } catch (error: any) {
    console.error('[BookingPaymentStatus] Error:', { error: error instanceof Error ? error.name : 'UnknownError' });
    return res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default bookingCheckoutRouter;
