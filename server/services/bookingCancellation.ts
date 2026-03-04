/**
 * Booking Cancellation Service
 * 
 * Cancellation rules:
 * - Venue cancels before deposit: No charge, booking cancelled
 * - Venue cancels after deposit: Artist keeps deposit (non-refundable), remaining balance cancelled
 * - Artist cancels before deposit: No charge, booking cancelled
 * - Artist cancels after deposit: Full refund to venue via Stripe
 * - Artist cancels after full payment: Full refund to venue via Stripe
 */

import Stripe from 'stripe';
import { getDb } from '../db';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  refundId?: string;
  message: string;
}

export async function cancelBooking(
  bookingId: number,
  cancelledBy: 'artist' | 'venue',
  reason?: string
): Promise<CancellationResult> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Booking is already cancelled');
  }

  const paymentStatus = booking.paymentStatus;
  let refundAmount = 0;
  let refundId: string | undefined;
  let message = '';

  // Determine if a refund is needed
  if (cancelledBy === 'artist') {
    // Artist cancels → venue gets full refund of whatever they paid
    if (paymentStatus === 'deposit_paid') {
      // Refund the deposit
      const depositCents = Math.round(parseFloat(booking.totalFee || '0') / 2 * 100);
      if (booking.stripeDepositPaymentIntentId) {
        try {
          // Get the checkout session to find the payment intent
          const sessions = await stripe.checkout.sessions.list({
            limit: 1,
          });
          // Use the stored payment intent ID for refund
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripeDepositPaymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              bookingId: bookingId.toString(),
              cancelledBy: 'artist',
              reason: reason || 'Artist cancelled booking',
            },
          });
          refundId = refund.id;
          refundAmount = depositCents / 100;
          message = `Booking cancelled by artist. Deposit of $${refundAmount.toFixed(2)} refunded to venue.`;
        } catch (err: any) {
          console.error('[Cancellation] Refund failed:', err.message);
          message = `Booking cancelled by artist. Automatic refund failed — manual refund may be needed.`;
        }
      } else {
        message = 'Booking cancelled by artist. No payment to refund.';
      }
    } else if (paymentStatus === 'fully_paid') {
      // Refund everything
      const totalCents = Math.round(parseFloat(booking.totalFee || '0') * 100);
      const refundPromises = [];

      if (booking.stripeDepositPaymentIntentId) {
        refundPromises.push(
          stripe.refunds.create({
            payment_intent: booking.stripeDepositPaymentIntentId,
            reason: 'requested_by_customer',
            metadata: { bookingId: bookingId.toString(), cancelledBy: 'artist' },
          }).catch(err => console.error('[Cancellation] Deposit refund failed:', err.message))
        );
      }
      if (booking.stripeFinalPaymentIntentId) {
        refundPromises.push(
          stripe.refunds.create({
            payment_intent: booking.stripeFinalPaymentIntentId,
            reason: 'requested_by_customer',
            metadata: { bookingId: bookingId.toString(), cancelledBy: 'artist' },
          }).catch(err => console.error('[Cancellation] Final payment refund failed:', err.message))
        );
      }

      await Promise.all(refundPromises);
      refundAmount = totalCents / 100;
      message = `Booking cancelled by artist. Full refund of $${refundAmount.toFixed(2)} issued to venue.`;
    } else {
      message = 'Booking cancelled by artist. No payment was made.';
    }
  } else {
    // Venue cancels
    if (paymentStatus === 'deposit_paid' || paymentStatus === 'fully_paid') {
      // Venue forfeits deposit — artist keeps it
      message = 'Booking cancelled by venue. Deposit is non-refundable and retained by the artist.';
      
      // If fully paid, refund only the final payment (not the deposit)
      if (paymentStatus === 'fully_paid' && booking.stripeFinalPaymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripeFinalPaymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
              bookingId: bookingId.toString(),
              cancelledBy: 'venue',
              reason: reason || 'Venue cancelled booking',
            },
          });
          refundId = refund.id;
          const remainingCents = Math.round(parseFloat(booking.totalFee || '0') / 2 * 100);
          refundAmount = remainingCents / 100;
          message = `Booking cancelled by venue. Deposit retained by artist. Remaining balance of $${refundAmount.toFixed(2)} refunded.`;
        } catch (err: any) {
          console.error('[Cancellation] Final payment refund failed:', err.message);
        }
      }
    } else {
      message = 'Booking cancelled by venue. No payment was made.';
    }
  }

  // Update booking status
  const updateData: any = {
    status: 'cancelled',
    paymentStatus: refundAmount > 0 ? 'refunded' : paymentStatus,
    cancelledAt: new Date(),
    cancelledBy,
    cancellationReason: reason || `Cancelled by ${cancelledBy}`,
  };

  if (refundId) {
    updateData.stripeRefundId = refundId;
  }

  await db.update(bookings).set(updateData).where(eq(bookings.id, bookingId));

  console.log(`[Cancellation] Booking #${bookingId} cancelled by ${cancelledBy}. ${message}`);

  return {
    success: true,
    refundAmount: refundAmount > 0 ? refundAmount : undefined,
    refundId,
    message,
  };
}
