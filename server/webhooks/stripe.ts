import type { Request, Response } from 'express';
import Stripe from 'stripe';
import * as db from '../db';
import * as email from '../email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Stripe Webhook] No signature found');
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Stripe Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutPaid(payout);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        await handlePayoutFailed(payout);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const bookingId = session.metadata?.bookingId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const platformFeeAmount = session.metadata?.platformFeeAmount ? parseInt(session.metadata.platformFeeAmount) : 0;

  if (!userId) {
    console.error('[Stripe Webhook] No userId in session metadata');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}`);

  // If this is a booking payment
  if (bookingId) {
    console.log(`[Stripe Webhook] Processing booking payment for booking ${bookingId}`);
    
    try {
      // Update booking payment status
      await db.updateBookingPaymentStatus(parseInt(bookingId), 'fully_paid', session.id);
      
      // Log platform fee collection
      if (platformFeeAmount > 0) {
        console.log(`[Stripe Webhook] Platform fee collected: $${(platformFeeAmount / 100).toFixed(2)} for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error processing booking payment:', error);
    }
  } else if (subscriptionId) {
    // Handle subscription checkout
    // Update or create subscription record
    await db.upsertSubscription({
      userId: parseInt(userId),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      planType: 'basic',
      status: 'trialing', // Will be updated by subscription.created event
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('[Stripe Webhook] No userId in subscription metadata');
    return;
  }

  console.log(`[Stripe Webhook] Subscription ${subscription.status} for user ${userId}`);

  const status = mapStripeStatus(subscription.status);
  const subData = subscription as any;
  const currentPeriodEnd = subData.current_period_end ? new Date(subData.current_period_end * 1000) : undefined;

  await db.upsertSubscription({
    userId: parseInt(userId),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    planType: 'basic',
    status,
    currentPeriodEnd,
  });
  
  // Send email for new subscriptions
  if (subscription.status === 'trialing' || subscription.status === 'active') {
    const user = await db.getUserById(parseInt(userId));
    if (user?.email) {
      const subData = subscription as any;
      const trialEndDate = subData.trial_end 
        ? new Date(subData.trial_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : undefined;
      await email.sendSubscriptionCreatedEmail({
        artistEmail: user.email,
        artistName: user.name || 'Artist',
        trialEndDate,
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('[Stripe Webhook] No userId in subscription metadata');
    return;
  }

  console.log(`[Stripe Webhook] Subscription deleted for user ${userId}`);

  await db.updateSubscriptionStatus(parseInt(userId), 'cancelled');
  
  // Send cancellation email
  const user = await db.getUserById(parseInt(userId));
  if (user?.email) {
    const subData = subscription as any;
    const endDate = subData.current_period_end 
      ? new Date(subData.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    await email.sendSubscriptionCanceledEmail({
      artistEmail: user.email,
      artistName: user.name || 'Artist',
      endDate,
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | undefined;
  
  if (subscriptionId) {
    console.log(`[Stripe Webhook] Invoice paid for subscription ${subscriptionId}`);
    // Subscription status will be updated by subscription.updated event
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | undefined;
  const customerId = invoice.customer as string;

  if (subscriptionId) {
    console.log(`[Stripe Webhook] Payment failed for subscription ${subscriptionId}`);
    
    // Get subscription to find userId
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (userId) {
      await db.updateSubscriptionStatus(parseInt(userId), 'past_due');
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) return;

  console.log(`[Stripe Webhook] Payment succeeded for booking ${bookingId}`);
  // Update booking payment status
  const database = await db.getDb();
  if (!database) return;
  
  const { bookings } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  await database
    .update(bookings)
    .set({
      paymentStatus: 'fully_paid',
      stripePaymentIntentId: paymentIntent.id,
    })
    .where(eq(bookings.id, parseInt(bookingId)));
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) return;

  console.log(`[Stripe Webhook] Payment failed for booking ${bookingId}`);
  const database = await db.getDb();
  if (!database) return;
  
  const { bookings } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  await database
    .update(bookings)
    .set({ paymentStatus: 'unpaid' })
    .where(eq(bookings.id, parseInt(bookingId)));
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string | null;
  if (!paymentIntentId) return;

  console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);
  const database = await db.getDb();
  if (!database) return;
  
  const { bookings } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const bookingResults = await database
    .select()
    .from(bookings)
    .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  
  if (bookingResults.length > 0) {
    await database
      .update(bookings)
      .set({
        paymentStatus: 'refunded',
        stripeRefundId: charge.id,
      })
      .where(eq(bookings.id, bookingResults[0].id));
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const artistId = payout.metadata?.artistId;
  if (!artistId) return;

  console.log(`[Stripe Webhook] Payout paid for artist ${artistId}`);
  const database = await db.getDb();
  if (!database) return;
  
  const { artistPayouts } = await import('../../drizzle/schema');
  
  await database.insert(artistPayouts).values({
    artistId: parseInt(artistId),
    stripeTransferId: payout.id,
    amount: (payout.amount / 100).toString(),
    status: 'completed',
    payoutMethod: 'stripe_connect',
    completedAt: new Date(payout.arrival_date * 1000),
  });
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  const artistId = payout.metadata?.artistId;
  if (!artistId) return;

  console.log(`[Stripe Webhook] Payout failed for artist ${artistId}`);
  const database = await db.getDb();
  if (!database) return;
  
  const { artistPayouts } = await import('../../drizzle/schema');
  const payoutData = payout as any;
  
  await database.insert(artistPayouts).values({
    artistId: parseInt(artistId),
    stripeTransferId: payout.id,
    amount: (payout.amount / 100).toString(),
    status: 'failed',
    payoutMethod: 'stripe_connect',
    notes: payoutData.failure_reason || 'Unknown failure',
  });
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'inactive' | 'trialing' | 'canceled' | 'past_due' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    case 'incomplete':
    case 'paused':
    default:
      return 'inactive';
  }
}
