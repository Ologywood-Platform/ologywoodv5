import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import Stripe from 'stripe';
import { ENV } from '../_core/env';
import { getDb } from '../db';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(ENV.stripeSecretKey || '');

// Validation schemas
const createCheckoutSessionSchema = z.object({
  bookingId: z.number(),
  amount: z.number().min(50, 'Minimum amount is $0.50'),
  currency: z.string().default('usd'),
  artistName: z.string(),
  venueName: z.string(),
  eventDate: z.string(),
});

const handleWebhookSchema = z.object({
  signature: z.string(),
  body: z.string(),
});

export const paymentsRouter = router({
  // Create checkout session for booking
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ENV.stripeSecretKey) {
          throw new Error('Stripe is not configured');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Verify booking exists and belongs to user
        const booking = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, input.bookingId))
          .limit(1);

        if (booking.length === 0) {
          throw new Error('Booking not found');
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: input.currency,
                product_data: {
                  name: `Booking: ${input.artistName || input.venueName}`,
                  description: `Event on ${input.eventDate}`,
                },
                unit_amount: Math.round(input.amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          client_reference_id: input.bookingId.toString(),
          metadata: {
            bookingId: input.bookingId.toString(),
            userId: ctx.user.id.toString(),
            artistName: input.artistName,
            venueName: input.venueName,
            eventDate: input.eventDate,
            userEmail: ctx.user.email,
          },
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-status?success=true&bookingId=${input.bookingId}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-status?cancelled=true`,
          allow_promotion_codes: true,
        });

        return {
          success: true,
          sessionId: session.id,
          checkoutUrl: session.url,
          message: 'Checkout session created successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create checkout session');
      }
    }),

  // Get payment intent status
  getPaymentStatus: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get booking details
        const booking = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, input.bookingId))
          .limit(1);

        if (booking.length === 0) {
          throw new Error('Booking not found');
        }

        return {
          success: true,
          bookingId: input.bookingId,
          status: booking[0]?.status,
          message: 'Payment status retrieved',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to get payment status');
      }
    }),

  // Confirm payment and update booking
  confirmPayment: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ENV.stripeSecretKey) {
          throw new Error('Stripe is not configured');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        if (session.payment_status !== 'paid') {
          return {
            success: false,
            message: 'Payment not completed',
          };
        }

        // Update booking status to confirmed
        await db.update(bookings).set({
          status: 'confirmed',
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        return {
          success: true,
          message: 'Payment confirmed and booking updated',
          bookingId: input.bookingId,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to confirm payment');
      }
    }),

  // Get booking payment history
  getPaymentHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get user's bookings with payment info
        const userBookings = await db
          .select()
          .from(bookings)
          .limit(10);

        return {
          success: true,
          payments: userBookings.map(b => ({
            id: b.id,
            status: b.status,
            amount: b.totalFee,
            date: b.eventDate,
            description: `Booking #${b.id}`,
          })),
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to get payment history');
      }
    }),

  // Create refund
  createRefund: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ENV.stripeSecretKey) {
          throw new Error('Stripe is not configured');
        }

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Get booking
        const booking = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, input.bookingId))
          .limit(1);

        if (booking.length === 0) {
          throw new Error('Booking not found');
        }

        // Update booking status to cancelled
        await db.update(bookings).set({
          status: 'cancelled',
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        return {
          success: true,
          message: 'Refund initiated and booking cancelled',
          bookingId: input.bookingId,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to create refund');
      }
    }),

  // Handle Stripe webhook
  handleWebhook: publicProcedure
    .input(handleWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (!ENV.stripeWebhookSecret) {
          throw new Error('Webhook secret not configured');
        }

        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
          input.body,
          input.signature,
          ENV.stripeWebhookSecret
        );

        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        // Handle different event types
        switch (event.type) {
          case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.metadata?.bookingId) {
              const bookingId = parseInt(session.metadata.bookingId);
              await db.update(bookings).set({
                status: 'confirmed',
                updatedAt: new Date(),
              }).where(eq(bookings.id, bookingId));
            }
            break;

          case 'charge.refunded':
            const charge = event.data.object as Stripe.Charge;
            if (charge.metadata?.bookingId) {
              const bookingId = parseInt(charge.metadata.bookingId);
              await db.update(bookings).set({
                status: 'cancelled',
                updatedAt: new Date(),
              }).where(eq(bookings.id, bookingId));
            }
            break;

          case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object);
            break;
        }

        return {
          success: true,
          message: 'Webhook processed successfully',
        };
      } catch (error) {
        console.error('Webhook error:', error);
        throw new Error(error instanceof Error ? error.message : 'Webhook processing failed');
      }
    }),
});
