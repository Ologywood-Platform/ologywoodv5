import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

// Create role-specific procedures
const venueProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'venue') {
    throw new Error('Only venues can perform this action');
  }
  return next();
});

const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'artist') {
    throw new Error('Only artists can perform this action');
  }
  return next();
});

export const depositPaymentsRouter = router({
  /**
   * Create a deposit payment intent for a booking
   * Called by venue when confirming a booking request
   */
  createDepositPayment: venueProcedure
    .input(
      z.object({
        bookingId: z.number(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get booking details
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Verify venue owns this booking
        if (booking.venueId !== ctx.user.id) {
          throw new Error("Unauthorized: You do not own this booking");
        }

        // Get artist details for customer email
        const artist = await db.getArtistProfileById(booking.artistId);
        if (!artist) {
          throw new Error("Artist profile not found");
        }

        // Get artist user for email
        const artistUser = await db.getUserById(artist.userId);
        if (!artistUser) {
          throw new Error("Artist user not found");
        }

        // Convert amount to cents for Stripe
        const amountCents = Math.round(input.amount * 100);

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "usd",
          description: `Booking deposit for event on ${booking.eventDate}`,
          metadata: {
            bookingId: booking.id.toString(),
            venueId: ctx.user.id.toString(),
            artistId: booking.artistId.toString(),
            depositType: "booking_deposit",
          },
          customer_email: artistUser.email || undefined,
        });

        // Update booking with payment intent ID
        await db.updateBooking(booking.id, {
          stripePaymentIntentId: paymentIntent.id,
          depositAmount: input.amount,
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error: any) {
        console.error("[Deposit Payment] Error creating payment intent:", error);
        throw new Error(error.message || "Failed to create payment intent");
      }
    }),

  /**
   * Confirm deposit payment was successful
   * Called by webhook after Stripe confirms payment
   */
  confirmDepositPayment: publicProcedure
    .input(
      z.object({
        bookingId: z.number(),
        paymentIntentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get booking
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Verify payment intent matches
        if (booking.stripePaymentIntentId !== input.paymentIntentId) {
          throw new Error("Payment intent mismatch");
        }

        // Update booking payment status
        await db.updateBooking(booking.id, {
          paymentStatus: "deposit_paid",
          depositPaidAt: new Date(),
        });

        // Send confirmation email to both parties
        const artist = await db.getArtistProfileById(booking.artistId);
        const venue = await db.getVenueProfileById(booking.venueId);
        const artistUser = artist ? await db.getUserById(artist.userId) : null;
        const venueUser = venue ? await db.getUserById(venue.userId) : null;

        if (artistUser?.email && venueUser?.email) {
          // TODO: Send deposit confirmation emails
          console.log(`[Deposit Payment] Deposit confirmed for booking ${booking.id}`);
        }

        return { success: true, bookingId: booking.id };
      } catch (error: any) {
        console.error("[Deposit Payment] Error confirming payment:", error);
        throw new Error(error.message || "Failed to confirm payment");
      }
    }),

  /**
   * Get deposit payment status for a booking
   */
  getDepositStatus: publicProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
      try {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        return {
          bookingId: booking.id,
          paymentStatus: booking.paymentStatus,
          depositAmount: booking.depositAmount,
          depositPaidAt: booking.depositPaidAt,
          totalFee: booking.totalFee,
          remainingBalance: booking.totalFee
            ? booking.totalFee - (booking.depositAmount || 0)
            : null,
        };
      } catch (error: any) {
        console.error("[Deposit Payment] Error getting status:", error);
        throw new Error(error.message || "Failed to get payment status");
      }
    }),

  /**
   * Request full payment after event completion
   */
  requestFullPayment: venueProcedure
    .input(
      z.object({
        bookingId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }

        if (booking.venueId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        if (booking.paymentStatus !== "deposit_paid") {
          throw new Error("Booking is not in deposit_paid status");
        }

        const remainingBalance = booking.totalFee
          ? booking.totalFee - (booking.depositAmount || 0)
          : 0;

        // Create payment intent for remaining balance
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(remainingBalance * 100),
          currency: "usd",
          description: `Final payment for event on ${booking.eventDate}`,
          metadata: {
            bookingId: booking.id.toString(),
            venueId: ctx.user.id.toString(),
            artistId: booking.artistId.toString(),
            paymentType: "final_payment",
          },
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: remainingBalance,
        };
      } catch (error: any) {
        console.error("[Deposit Payment] Error requesting full payment:", error);
        throw new Error(error.message || "Failed to request payment");
      }
    }),
});
