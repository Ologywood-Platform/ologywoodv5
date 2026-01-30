import { Router, Request, Response } from 'express';
import { db } from '../db';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

/**
 * Payment Success Handler
 * Called after successful Stripe checkout
 */
router.get('/success/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const sessionId = req.query.session_id as string;

    if (!bookingId || !sessionId) {
      return res.status(400).json({ error: 'Missing booking ID or session ID' });
    }

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.redirect(`/payment/failure/${bookingId}?reason=payment_not_completed`);
    }

    // Update booking with payment information
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(bookingId, 10)))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking status to confirmed
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        stripePaymentIntentId: session.payment_intent as string,
      })
      .where(eq(bookings.id, parseInt(bookingId, 10)));

    // Redirect to success page
    res.redirect(`/payment/success/${bookingId}`);
  } catch (error) {
    console.error('Payment success handler error:', error);
    res.status(500).json({ error: 'Failed to process payment success' });
  }
});

/**
 * Payment Failure Handler
 * Called after failed or cancelled Stripe checkout
 */
router.get('/failure/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const reason = (req.query.reason as string) || 'payment_declined';

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing booking ID' });
    }

    // Verify booking exists
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(bookingId, 10)))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Redirect to failure page with reason
    res.redirect(`/payment/failure/${bookingId}?reason=${reason}`);
  } catch (error) {
    console.error('Payment failure handler error:', error);
    res.status(500).json({ error: 'Failed to process payment failure' });
  }
});

/**
 * Retry Payment Handler
 * Initiates a new Stripe checkout session for failed payments
 */
router.post('/retry/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body;

    if (!bookingId || !userId) {
      return res.status(400).json({ error: 'Missing booking ID or user ID' });
    }

    // Get booking details
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(bookingId, 10)))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Create new Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booking Deposit - Event ${bookingData.eventDate}`,
              description: `Deposit for artist booking on ${new Date(bookingData.eventDate).toLocaleDateString()}`,
            },
            unit_amount: Math.round((bookingData.depositAmount || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure/${bookingId}?reason=user_cancelled`,
      customer_email: req.body.email,
      metadata: {
        bookingId: bookingId.toString(),
        userId: userId.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Retry payment handler error:', error);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

/**
 * Payment Status Check
 * Returns current payment status for a booking
 */
router.get('/status/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing booking ID' });
    }

    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(bookingId, 10)))
      .limit(1);

    if (!booking || booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Get payment intent details if available
    let paymentStatus = 'pending';
    if (bookingData.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          bookingData.stripePaymentIntentId as string
        );
        paymentStatus = paymentIntent.status;
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
      }
    }

    res.json({
      bookingId: bookingData.id,
      status: bookingData.status,
      paymentStatus,
      depositAmount: bookingData.depositAmount,
      totalFee: bookingData.totalFee,
      depositPaidAt: bookingData.depositPaidAt,
      fullPaymentPaidAt: bookingData.fullPaymentPaidAt,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment status' });
  }
});

export default router;
