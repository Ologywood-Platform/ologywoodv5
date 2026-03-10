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
  const paymentType = session.metadata?.paymentType; // 'deposit', 'final_payment', or undefined for full payment
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const platformFeeAmount = session.metadata?.platformFeeAmount ? parseInt(session.metadata.platformFeeAmount) : 0;

  // Release purchases use buyerUserId, not userId — don't bail early for those
  const isReleasePurchase = !!session.metadata?.releaseId;
  if (!userId && !isReleasePurchase) {
    console.error('[Stripe Webhook] No userId in session metadata');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for user ${userId || session.metadata?.buyerUserId || 'guest'}`);

  // If this is a booking payment
  if (bookingId) {
    console.log(`[Stripe Webhook] Processing booking payment for booking ${bookingId} (type: ${paymentType || 'full'})`);
    
    try {
      // Determine payment status based on payment type
      let paymentStatus = 'fully_paid'; // Default for full payment
      
      if (paymentType === 'deposit') {
        paymentStatus = 'deposit_paid';
        console.log(`[Stripe Webhook] Deposit paid for booking ${bookingId}`);
      } else if (paymentType === 'final_payment') {
        paymentStatus = 'fully_paid';
        console.log(`[Stripe Webhook] Final payment completed for booking ${bookingId}`);
      }
      
      // Update booking payment status with payment type for proper tracking
      await db.updateBookingPaymentStatus(parseInt(bookingId), paymentStatus, session.id, paymentType || undefined);
      
      // Log platform fee collection
      if (platformFeeAmount > 0) {
        console.log(`[Stripe Webhook] Platform fee collected: $${(platformFeeAmount / 100).toFixed(2)} for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error processing booking payment:', error);
    }
  } else if (session.metadata?.releaseId) {
    // Handle release purchase checkout
    const releaseId = parseInt(session.metadata.releaseId);
    console.log(`[Stripe Webhook] Processing release purchase for release ${releaseId}`);

    try {
      // Check idempotency — don't process the same session twice
      const existingPurchase = await db.getPurchaseBySessionId(session.id);
      if (existingPurchase) {
        console.log(`[Stripe Webhook] Purchase already recorded for session ${session.id}, skipping`);
        return;
      }

      const release = await db.getReleaseById(releaseId);
      if (!release) {
        console.error(`[Stripe Webhook] Release ${releaseId} not found`);
        return;
      }

      const amountPaid = session.amount_total || release.priceInCents;
      const platformFeeCents = Math.max(1, Math.round(amountPaid * 0.01)); // 1% fee, minimum 1 cent

      // Create purchase record
      await db.createReleasePurchase({
        releaseId,
        buyerEmail: session.customer_details?.email || session.metadata?.buyerEmail || 'unknown',
        buyerName: session.customer_details?.name || session.metadata?.buyerName || null,
        buyerUserId: session.metadata?.buyerUserId ? parseInt(session.metadata.buyerUserId) : null,
        stripeCheckoutSessionId: session.id,
        amountPaidCents: amountPaid,
        platformFeeCents,
        artistNetCents: amountPaid - platformFeeCents,
      });

      // Increment sales counters on the release
      await db.incrementReleaseSales(releaseId, amountPaid);

      console.log(`[Stripe Webhook] Release purchase recorded: release=${releaseId}, amount=$${(amountPaid / 100).toFixed(2)}, fee=$${(platformFeeCents / 100).toFixed(2)}`);

      // Send purchase confirmation email to buyer
      try {
        const buyerEmail = session.customer_details?.email || session.metadata?.buyerEmail;
        const artistProfile = await db.getArtistProfileById(release.artistId);
        if (buyerEmail && artistProfile) {
          const baseUrl = process.env.BASE_URL || 'https://www.ologywood.com';
          const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(buyerEmail)}&type=purchase`;
          await email.sendEmail({
            to: buyerEmail,
            subject: `Purchase Confirmed — "${release.title}" by ${artistProfile.artistName}`,
            html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Purchase Confirmed!</h1>
              </div>
              <div style="padding: 30px 24px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">You purchased <strong>"${release.title}"</strong> by <strong>${artistProfile.artistName}</strong> for <strong>$${(amountPaid / 100).toFixed(2)}</strong>.</p>
                
                <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
                  <p style="color: #374151; margin: 0 0 8px 0; font-size: 14px;"><strong>How to download your track:</strong></p>
                  <ol style="color: #374151; margin: 0; padding-left: 20px; font-size: 14px;">
                    <li style="margin-bottom: 4px;">Click the button below to go to My Purchases</li>
                    <li style="margin-bottom: 4px;">Find your release and click the Download button</li>
                    <li>You have up to 5 downloads available</li>
                  </ol>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/my-purchases" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Download Your Track</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">You can also re-download anytime from <a href="${baseUrl}/my-purchases" style="color: #6D28D9; text-decoration: none;">My Purchases</a> (click "Purchases" in the navigation bar).</p>
              </div>
              <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 0 0 10px 0;">Thank you for supporting independent artists on Ologywood!</p>
                <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                  <a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Unsubscribe</a> | 
                  <a href="${baseUrl}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
                  <a href="${baseUrl}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0; text-align: center;">&copy; 2026 Ologywood. All rights reserved.</p>
              </div>
            </div>`,
          });
          console.log(`[Stripe Webhook] Purchase confirmation email sent to ${buyerEmail}`);
        }
      } catch (emailErr) {
        console.error('[Stripe Webhook] Error sending purchase confirmation email:', emailErr);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Error processing release purchase:', error);
    }
  } else if (subscriptionId && userId) {
    // Handle subscription checkout
    // Update or create subscription record
    await db.upsertSubscription({
      userId: parseInt(userId),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
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
    status,
    currentPeriodEnd,
  });
  
  // Send email for new subscriptions
  if (subscription.status === 'trialing' || subscription.status === 'active') {
    const user = await db.getUserById(parseInt(userId)) as any;
    if (user?.email) {
      const subData = subscription as any;
      const trialEndDate = subData.trial_end 
        ? new Date(subData.trial_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : undefined;

      // Determine plan from price
      const { SUBSCRIPTION_PRODUCTS } = await import('../../shared/products');
      const priceId = subData.items?.data?.[0]?.price?.id;
      const lookupKey = subData.items?.data?.[0]?.price?.lookup_key;
      let planName = 'Professional Plan';
      let planPrice = '$29/month';
      let features = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.features as unknown as string[];

      if (lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
          (subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly)) {
        planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
        planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly / 100}/month`;
        features = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.features as unknown as string[];
      } else {
        planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
        planPrice = `$${SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly / 100}/month`;
        features = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.features as unknown as string[];
      }

      await email.sendSubscriptionCreatedEmail({
        artistEmail: user.email,
        artistName: user.name || 'Artist',
        planName,
        planPrice,
        features,
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
  
  // Send cancellation email with plan details
  const user = await db.getUserById(parseInt(userId)) as any;
  if (user?.email) {
    const subData = subscription as any;
    const endDate = subData.current_period_end 
      ? new Date(subData.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Determine plan name from price
    const { SUBSCRIPTION_PRODUCTS } = await import('../../shared/products');
    const lookupKey = subData.items?.data?.[0]?.price?.lookup_key;
    let planName = 'your plan';
    if (lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
        (subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly)) {
      planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
    } else {
      planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
    }

    await email.sendSubscriptionCanceledEmail({
      artistEmail: user.email,
      artistName: user.name || 'Artist',
      planName,
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

  // Send payment receipt email
  try {
    const booking = await db.getBookingById(parseInt(bookingId));
    if (booking) {
      const artistProfile = await db.getArtistProfileById(booking.artistId);
      const venueProfile = await db.getVenueProfileById(booking.venueId);
      if (artistProfile && venueProfile) {
        const venueUser = await db.getUserById(venueProfile.userId);
        const eventDateStr = booking.eventDate instanceof Date
          ? booking.eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const amount = paymentIntent.amount / 100;
        const paymentType = paymentIntent.metadata?.paymentType === 'deposit' ? 'deposit' as const : 'full_payment' as const;
        
        if (venueUser?.email) {
          await email.sendPaymentReceipt(
            venueUser.email,
            venueProfile.organizationName,
            artistProfile.artistName,
            amount,
            paymentType,
            eventDateStr,
            paymentIntent.id
          );
        }
        // Also notify artist that payment was received
        const artistUser = await db.getUserById(artistProfile.userId);
        if (artistUser?.email) {
          await email.sendPaymentReceipt(
            artistUser.email,
            venueProfile.organizationName,
            artistProfile.artistName,
            amount,
            paymentType,
            eventDateStr,
            paymentIntent.id
          );
        }
      }
    }
  } catch (emailErr) {
    console.error('[Stripe Webhook] Error sending payment receipt email:', emailErr);
  }
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
    const booking = bookingResults[0];
    await database
      .update(bookings)
      .set({
        paymentStatus: 'refunded',
        stripeRefundId: charge.id,
      })
      .where(eq(bookings.id, booking.id));

    // Send refund notification email
    try {
      const artistProfile = await db.getArtistProfileById(booking.artistId);
      const venueProfile = await db.getVenueProfileById(booking.venueId);
      if (artistProfile && venueProfile) {
        const venueUser = await db.getUserById(venueProfile.userId);
        const refundAmount = (charge.amount_refunded || charge.amount) / 100;
        if (venueUser?.email) {
          await email.sendRefundNotification(
            venueUser.email,
            venueProfile.organizationName,
            artistProfile.artistName,
            refundAmount,
            'Booking refund processed'
          );
        }
        const artistUser = await db.getUserById(artistProfile.userId);
        if (artistUser?.email) {
          await email.sendRefundNotification(
            artistUser.email,
            venueProfile.organizationName,
            artistProfile.artistName,
            refundAmount,
            'Booking refund processed'
          );
        }
      }
    } catch (emailErr) {
      console.error('[Stripe Webhook] Error sending refund notification email:', emailErr);
    }
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
