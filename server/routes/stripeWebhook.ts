import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db';
import { bookings, artistPayouts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const stripeWebhookRouter = express.Router();

/**
 * Stripe Webhook Handler
 * Processes payment events and updates booking/payout status
 */
stripeWebhookRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith('evt_test_')) {
      console.log('[Webhook] Test event detected, returning verification response');
      return res.json({ verified: true });
    }

    const db = await getDb();
    if (!db) {
      console.error('[Webhook] Database connection failed');
      return res.status(500).json({ error: 'Database connection failed' });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);

          // Update booking payment status
          if (paymentIntent.metadata?.bookingId) {
            const bookingId = parseInt(paymentIntent.metadata.bookingId);
            await db
              .update(bookings)
              .set({
                paymentStatus: 'fully_paid',
                stripePaymentIntentId: paymentIntent.id,
              })
              .where(eq(bookings.id, bookingId));

            console.log(`[Webhook] Updated booking ${bookingId} to fully_paid`);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);

          if (paymentIntent.metadata?.bookingId) {
            const bookingId = parseInt(paymentIntent.metadata.bookingId);
            await db
              .update(bookings)
              .set({
                paymentStatus: 'unpaid',
              })
              .where(eq(bookings.id, bookingId));

            console.log(`[Webhook] Updated booking ${bookingId} to unpaid`);
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          console.log(`[Webhook] Charge refunded: ${charge.id}`);

          if (charge.payment_intent && typeof charge.payment_intent === 'string') {
            // Find booking with this payment intent
            const bookingResults = await db
              .select()
              .from(bookings)
              .where(eq(bookings.stripePaymentIntentId, charge.payment_intent))
              .limit(1);

            if (bookingResults.length > 0) {
              const booking = bookingResults[0];
              await db
                .update(bookings)
                .set({
                  paymentStatus: 'refunded',
                  stripeRefundId: charge.id,
                })
                .where(eq(bookings.id, booking.id));

              console.log(`[Webhook] Updated booking ${booking.id} to refunded`);
            }
          }
          break;
        }

        case 'payout.paid': {
          const payout = event.data.object as Stripe.Payout;
          console.log(`[Webhook] Payout paid: ${payout.id}`);

          // Record payout in database
          if (payout.metadata?.artistId) {
            const artistId = parseInt(payout.metadata.artistId);
            await db.insert(artistPayouts).values({
              artistId,
              stripePayoutId: payout.id,
              amount: (payout.amount / 100).toString(), // Convert from cents
              status: 'completed',
              paidAt: new Date(payout.arrival_date * 1000),
            });

            console.log(`[Webhook] Recorded payout for artist ${artistId}`);
          }
          break;
        }

        case 'payout.failed': {
          const payout = event.data.object as Stripe.Payout;
          console.log(`[Webhook] Payout failed: ${payout.id}`);

          if (payout.metadata?.artistId) {
            const artistId = parseInt(payout.metadata.artistId);
            await db.insert(artistPayouts).values({
              artistId,
              stripePayoutId: payout.id,
              amount: (payout.amount / 100).toString(),
              status: 'failed',
              failureReason: payout.failure_reason || 'Unknown',
            });

            console.log(`[Webhook] Recorded failed payout for artist ${artistId}`);
          }
          break;
        }

        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          console.log(`[Webhook] Stripe Connect account updated: ${account.id}`);
          // Stripe Connect account status updated
          // This is handled by the stripeConnectService
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      // Return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      console.error('[Webhook] Error processing event:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

export default stripeWebhookRouter;
