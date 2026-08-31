import type { Request, Response } from 'express';
import Stripe from 'stripe';
import * as db from '../db';
import * as email from '../email';
import { buildMerchOrderNotification } from '../utils/merchCommerce';
import { formatDateOnly } from '../../shared/dateOnly';
import { getEmailLogoImage } from '../../shared/emailBranding';

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

  // Release purchases and ticket purchases use different metadata patterns
  const isReleasePurchase = !!session.metadata?.releaseId;
  const isTicketPurchase = session.metadata?.type === 'ticket_purchase';
  const isMerchPurchase = session.metadata?.type === 'merch_purchase';
  if (!userId && !isReleasePurchase && !isTicketPurchase && !isMerchPurchase) {
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
      
      // Record artist earnings when payment is fully paid
      if (paymentStatus === 'fully_paid') {
        try {
          const booking = await db.getBookingById(parseInt(bookingId));
          if (booking && booking.totalFee) {
            const { artistEarnings } = await import('../../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            const database = await db.getDb();
            if (database) {
              // Check if earnings already recorded for this booking (idempotency)
              const [existing] = await database.select().from(artistEarnings)
                .where(eq(artistEarnings.bookingId, parseInt(bookingId))).limit(1);
              if (!existing) {
                const grossAmount = Number(booking.totalFee);
                const fee = Math.max(0.01, grossAmount * 0.01); // 1% platform fee
                const netAmount = grossAmount - fee;
                await database.insert(artistEarnings).values({
                  artistId: booking.artistId,
                  bookingId: parseInt(bookingId),
                  grossAmount: grossAmount.toFixed(2),
                  platformFee: fee.toFixed(2),
                  netAmount: netAmount.toFixed(2),
                  status: 'pending',
                });
                console.log(`[Stripe Webhook] Artist earnings recorded: booking=${bookingId}, gross=$${grossAmount.toFixed(2)}, net=$${netAmount.toFixed(2)}`);
              }
            }
          }
        } catch (earningsErr) {
          console.error('[Stripe Webhook] Error recording artist earnings:', earningsErr);
        }
      }
      
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
                ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
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
  } else if (isTicketPurchase) {
    // Handle ticket purchase checkout
    await handleTicketPurchaseCompleted(session);
  } else if (isMerchPurchase) {
    await handleMerchPurchaseCompleted(session);
  } else if (subscriptionId && userId) {
    // Handle subscription checkout
    // Determine tier from session metadata
    const { SUBSCRIPTION_PRODUCTS } = await import('../../shared/products');
    const planMetadata = session.metadata?.plan;
    let tier: 'free' | 'starter' | 'professional' | 'enterprise' = 'professional';
    if (planMetadata === 'ARTIST_STARTER') {
      tier = 'starter';
    } else if (planMetadata === 'ARTIST_ENTERPRISE') {
      tier = 'enterprise';
    }
    
    // Update or create subscription record with tier
    await db.upsertSubscription({
      userId: parseInt(userId),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      tier,
      status: 'trialing', // Will be updated by subscription.created/updated event
    });
    console.log(`[Stripe Webhook] Subscription checkout completed: user=${userId}, tier=${tier}, subscriptionId=${subscriptionId}`);
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

  // Determine tier from plan metadata or price lookup key
  const { SUBSCRIPTION_PRODUCTS } = await import('../../shared/products');
  const planMetadata = subscription.metadata?.plan;
  const lookupKey = subData.items?.data?.[0]?.price?.lookup_key;
  const priceAmount = subData.items?.data?.[0]?.price?.unit_amount;
  
  let tier: 'free' | 'starter' | 'professional' | 'enterprise' = 'professional'; // default
  if (planMetadata === 'ARTIST_STARTER' || 
      lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
      lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey ||
      priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly ||
      priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly) {
    tier = 'starter';
  } else if (planMetadata === 'ARTIST_ENTERPRISE' || 
             lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.lookupKey ||
             lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.yearlyLookupKey ||
             priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceMonthly ||
             priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceYearly) {
    tier = 'enterprise';
  } else if (planMetadata === 'ARTIST_PROFESSIONAL' || 
             lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.lookupKey ||
             lookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.yearlyLookupKey ||
             priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly ||
             priceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceYearly) {
    tier = 'professional';
  }
  
  console.log(`[Stripe Webhook] Resolved tier: ${tier} (metadata: ${planMetadata}, lookupKey: ${lookupKey}, price: ${priceAmount})`);

  await db.upsertSubscription({
    userId: parseInt(userId),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status,
    tier,
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
      const emailLookupKey = subData.items?.data?.[0]?.price?.lookup_key;
      const emailInterval = subData.items?.data?.[0]?.price?.recurring?.interval;
      let planName = 'Professional Plan';
      let planPrice = '$29/month';
      let features = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.features as unknown as string[];

      if (emailLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
          emailLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey ||
          subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly ||
          subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly) {
        planName = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.name;
        planPrice = emailInterval === 'year' 
          ? `$${SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly / 100}/year`
          : `$${SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly / 100}/month`;
        features = SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.features as unknown as string[];
      } else if (emailLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.lookupKey ||
          emailLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.yearlyLookupKey ||
          subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceMonthly ||
          subData.items?.data?.[0]?.price?.unit_amount === SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceYearly) {
        planName = SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.name;
        planPrice = emailInterval === 'year'
          ? `$${SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceYearly / 100}/year`
          : `$${SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.priceMonthly / 100}/month`;
        features = SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE.features as unknown as string[];
      } else {
        planName = SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.name;
        planPrice = emailInterval === 'year'
          ? `$${SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceYearly / 100}/year`
          : `$${SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL.priceMonthly / 100}/month`;
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
    const delLookupKey = subData.items?.data?.[0]?.price?.lookup_key;
    const delPriceAmount = subData.items?.data?.[0]?.price?.unit_amount;
    let planName = 'your plan';
    if (delLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.lookupKey ||
        delLookupKey === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.yearlyLookupKey ||
        delPriceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceMonthly ||
        delPriceAmount === SUBSCRIPTION_PRODUCTS.ARTIST_STARTER.priceYearly) {
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
  // Handle tips separately
  if (paymentIntent.metadata?.type === 'tip') {
    await handleTipSucceeded(paymentIntent);
    return;
  }

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
  if (paymentIntent.metadata?.type === 'merch_purchase' && paymentIntent.metadata?.orderId) {
    const database = await db.getDb();
    if (!database) return;
    const { merchOrders } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    await database.update(merchOrders).set({
      paymentStatus: 'failed',
      status: 'cancelled',
      stripePaymentIntentId: paymentIntent.id,
    }).where(eq(merchOrders.id, parseInt(paymentIntent.metadata.orderId)));
    return;
  }

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
  if (!charge.refunded) {
    console.log(`[Stripe Webhook] Partial refund recorded for charge ${charge.id}; merch order remains paid until fully refunded`);
    return;
  }

  console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);
  const database = await db.getDb();
  if (!database) return;

  const { bookDownloadAccess, merchItems, merchOrderItems, merchOrders } = await import('../../drizzle/schema');
  const { and, eq, ne, sql } = await import('drizzle-orm');
  const [merchOrder] = await database.select().from(merchOrders)
    .where(eq(merchOrders.stripePaymentIntentId, paymentIntentId)).limit(1);
  if (merchOrder) {
    await database.transaction(async (tx) => {
      const updateResult = await tx.update(merchOrders).set({
        paymentStatus: 'refunded',
        status: 'refunded',
      }).where(and(
        eq(merchOrders.id, merchOrder.id),
        ne(merchOrders.paymentStatus, 'refunded'),
      ));
      const affectedRows = Number((updateResult as any)?.[0]?.affectedRows ?? 0);
      if (affectedRows > 0) {
        const orderItems = await tx.select().from(merchOrderItems)
          .where(eq(merchOrderItems.orderId, merchOrder.id));
        for (const orderItem of orderItems) {
          await tx.update(merchItems).set({
            inventoryQuantity: sql`COALESCE(${merchItems.inventoryQuantity}, 0) + ${orderItem.quantity}`,
          }).where(and(
            eq(merchItems.id, orderItem.merchItemId),
            eq(merchItems.trackInventory, true),
          ));
        }
      }
      await tx.update(bookDownloadAccess).set({ status: 'refunded' })
        .where(eq(bookDownloadAccess.orderId, merchOrder.id));
    });
    return;
  }
  
  const { bookings } = await import('../../drizzle/schema');
  
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

// ==================== NATIVE MERCH PURCHASE WEBHOOK HANDLER ====================

async function handleMerchPurchaseCompleted(session: Stripe.Checkout.Session) {
  const orderId = Number(session.metadata?.orderId || 0);
  if (!orderId) {
    console.error('[Stripe Webhook] Missing orderId for merch purchase');
    return;
  }

  const database = await db.getDb();
  if (!database) return;
  const { bookDownloadAccess, merchItems, merchOrderItems, merchOrders, notifications } = await import('../../drizzle/schema');
  const { ensureMerchItemsSchema } = await import('../services/merchSchemaService');
  const { and, eq, ne, sql } = await import('drizzle-orm');
  await ensureMerchItemsSchema(database);

  const [order] = await database.select().from(merchOrders)
    .where(eq(merchOrders.id, orderId)).limit(1);
  if (!order) {
    console.error(`[Stripe Webhook] Merch order ${orderId} not found`);
    return;
  }
  if (order.paymentStatus === 'paid') {
    console.log(`[Stripe Webhook] Merch order ${order.orderNumber} already processed, skipping`);
    return;
  }

  let purchasedItems: Array<{ title: string; quantity: number; selectedVariants: Record<string, string> | null }> = [];
  let processed = false;
  await database.transaction(async (tx) => {
    const updateResult = await tx.update(merchOrders).set({
      paymentStatus: 'paid',
      status: order.fulfillmentMethod === 'digital' ? 'completed' : 'new',
      stripePaymentIntentId: session.payment_intent as string || null,
      paidAt: new Date(),
    }).where(and(
      eq(merchOrders.id, orderId),
      ne(merchOrders.paymentStatus, 'paid'),
    ));

    const affectedRows = Number((updateResult as any)?.[0]?.affectedRows ?? 0);
    if (affectedRows === 0) return;
    processed = true;

    const orderItems = await tx.select().from(merchOrderItems)
      .where(eq(merchOrderItems.orderId, orderId));
    purchasedItems = orderItems.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      selectedVariants: item.selectedVariants as Record<string, string> | null,
    }));
    for (const orderItem of orderItems) {
      const [sourceItem] = await tx.select().from(merchItems)
        .where(eq(merchItems.id, orderItem.merchItemId)).limit(1);
      const isDigitalBook = sourceItem?.productCategory === 'book'
        && sourceItem.bookFormat === 'ebook'
        && Boolean(sourceItem.ebookFileKey)
        && Boolean(sourceItem.ebookRightsConfirmed);

      if (isDigitalBook) {
        await tx.insert(bookDownloadAccess).values({
          orderId,
          orderItemId: orderItem.id,
          merchItemId: orderItem.merchItemId,
          buyerUserId: order.buyerUserId,
          buyerEmail: order.buyerEmail.toLowerCase(),
          maxDownloads: 5,
        }).onDuplicateKeyUpdate({
          set: {
            buyerUserId: order.buyerUserId,
            buyerEmail: order.buyerEmail.toLowerCase(),
          },
        });
      }

      await tx.update(merchItems).set({
        inventoryQuantity: sql`GREATEST(COALESCE(${merchItems.inventoryQuantity}, 0) - ${orderItem.quantity}, 0)`,
      }).where(and(
        eq(merchItems.id, orderItem.merchItemId),
        eq(merchItems.trackInventory, true),
      ));
    }

    const notification = buildMerchOrderNotification({
      orderNumber: order.orderNumber,
      buyerName: order.buyerName,
      totalCents: order.totalCents,
      fulfillmentMethod: order.fulfillmentMethod,
      itemCount: orderItems.reduce((total, item) => total + item.quantity, 0),
    });
    await tx.insert(notifications).values({
      userId: order.sellerUserId,
      ...notification,
    });
  });

  if (!processed) {
    console.log(`[Stripe Webhook] Merch order ${order.orderNumber} already processed concurrently, skipping`);
    return;
  }

  console.log(`[Stripe Webhook] Merch order paid: ${order.orderNumber}`);

  try {
    const sellerUser = await db.getUserById(order.sellerUserId);
    let sellerName = sellerUser?.name || 'Creator';
    if (order.sellerType === 'venue') {
      const venue = await db.getVenueProfileByUserId(order.sellerUserId);
      sellerName = venue?.organizationName || sellerName;
    } else {
      const artist = await db.getArtistProfileByUserId(order.sellerUserId);
      sellerName = artist?.artistName || sellerName;
    }

    const [firstOrderItem] = await database.select().from(merchOrderItems)
      .where(eq(merchOrderItems.orderId, orderId)).limit(1);
    let fulfillmentTime: string | null = null;
    if (firstOrderItem) {
      const [sourceItem] = await database.select().from(merchItems)
        .where(eq(merchItems.id, firstOrderItem.merchItemId)).limit(1);
      fulfillmentTime = sourceItem?.fulfillmentTime || null;
    }

    await email.sendMerchOrderConfirmationEmail({
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      sellerName,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      fulfillmentMethod: order.fulfillmentMethod,
      fulfillmentTime,
      items: purchasedItems,
    });

    if (sellerUser?.email) {
      await email.sendMerchNewOrderEmail({
        sellerEmail: sellerUser.email,
        sellerName,
        buyerName: order.buyerName,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        fulfillmentMethod: order.fulfillmentMethod,
        items: purchasedItems,
      });
    }
  } catch (emailError) {
    console.error('[Stripe Webhook] Failed to send merch order emails:', emailError);
  }
}


// ==================== TICKET PURCHASE WEBHOOK HANDLER ====================

async function handleTicketPurchaseCompleted(session: Stripe.Checkout.Session) {
  const { getDb } = await import('../db');
  const { ticketOrders, ticketItems, ticketTiers } = await import('../../drizzle/schema');
  const { eq, sql } = await import('drizzle-orm');
  const { randomUUID } = await import('crypto');

  const orderId = session.metadata?.orderId;
  const orderNumber = session.metadata?.orderNumber;
  const eventId = session.metadata?.eventId;
  const items = session.metadata?.items ? JSON.parse(session.metadata.items) : [];

  if (!orderId || !eventId) {
    console.error('[Stripe Webhook] Missing orderId or eventId in ticket purchase metadata');
    return;
  }

  console.log(`[Stripe Webhook] Processing ticket purchase: order ${orderNumber} for event ${eventId}`);

  const database = await getDb();
  if (!database) {
    console.error('[Stripe Webhook] Database not available for ticket purchase');
    return;
  }

  try {
    // Update order status to completed
    await database.update(ticketOrders).set({
      status: 'completed',
      stripePaymentIntentId: session.payment_intent as string || null,
    }).where(eq(ticketOrders.id, parseInt(orderId)));

    // Create individual ticket items and update tier sold counts
    for (const item of items) {
      const tierId = item.tierId;
      const quantity = item.quantity;

      // Get the tier to snapshot the price
      const [tier] = await database.select().from(ticketTiers).where(eq(ticketTiers.id, tierId)).limit(1);
      if (!tier) {
        console.error(`[Stripe Webhook] Tier ${tierId} not found for ticket creation`);
        continue;
      }

      // Create individual tickets with unique codes
      for (let i = 0; i < quantity; i++) {
        await database.insert(ticketItems).values({
          orderId: parseInt(orderId),
          tierId,
          eventId: parseInt(eventId),
          ticketCode: randomUUID(),
          attendeeName: session.metadata?.customer_name || session.customer_details?.name || null,
          attendeeEmail: session.customer_details?.email || session.metadata?.customer_email || null,
          status: 'valid',
          price: tier.price,
        });
      }

      // Update quantity sold on the tier
      await database.update(ticketTiers).set({
        quantitySold: sql`${ticketTiers.quantitySold} + ${quantity}`,
      }).where(eq(ticketTiers.id, tierId));
    }

    console.log(`[Stripe Webhook] Ticket purchase completed: order ${orderNumber}, ${items.reduce((sum: number, i: any) => sum + i.quantity, 0)} tickets created`);

    // Send ticket confirmation email
    try {
      await sendTicketConfirmationEmail({
        orderNumber: orderNumber || '',
        buyerEmail: session.customer_details?.email || session.metadata?.customer_email || '',
        buyerName: session.metadata?.customer_name || session.customer_details?.name || 'Guest',
        eventId: parseInt(eventId),
        totalAmount: session.amount_total || 0,
        orderId: parseInt(orderId),
      });
    } catch (emailErr) {
      console.error('[Stripe Webhook] Failed to send ticket confirmation email:', emailErr);
      // Don't throw - email failure shouldn't block ticket creation
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing ticket purchase:', error);
    throw error;
  }
}

/**
 * Send ticket confirmation email with ticket details and QR code link
 */
async function sendTicketConfirmationEmail(params: {
  orderNumber: string;
  buyerEmail: string;
  buyerName: string;
  eventId: number;
  totalAmount: number;
  orderId: number;
}) {
  const { sendEmail } = await import('../email');
  const { ENV } = await import('../_core/env');
  const { getDb } = await import('../db');
  const { events, ticketItems, ticketTiers } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  const database = await getDb();
  if (!database) return;

  // Get event details
  const [event] = await database.select().from(events).where(eq(events.id, params.eventId)).limit(1);
  if (!event) return;

  // Get artist sponsors for the event (event.artistId is profile ID)
  const { artistProfiles, sponsorSlots } = await import('../../drizzle/schema');
  const { and: andOp } = await import('drizzle-orm');
  let sponsorHtml = '';
  try {
    const [profile] = await database.select({ userId: artistProfiles.userId }).from(artistProfiles).where(eq(artistProfiles.id, event.artistId)).limit(1);
    if (profile) {
      const sponsors = await database.select({
        sponsorName: sponsorSlots.sponsorName,
        sponsorLogoUrl: sponsorSlots.sponsorLogoUrl,
        sponsorWebsite: sponsorSlots.sponsorWebsite,
      }).from(sponsorSlots).where(andOp(eq(sponsorSlots.artistId, profile.userId), eq(sponsorSlots.isActive, true))).orderBy(sponsorSlots.displayOrder);
      if (sponsors.length > 0) {
        const logos = sponsors.map(s => {
          const logo = s.sponsorLogoUrl ? `<img src="${s.sponsorLogoUrl}" alt="${s.sponsorName}" style="height: 32px; max-width: 100px; object-fit: contain; margin: 0 8px;" />` : `<span style="font-size: 12px; color: #6b7280; margin: 0 8px;">${s.sponsorName}</span>`;
          return s.sponsorWebsite ? `<a href="${s.sponsorWebsite}" target="_blank" style="text-decoration: none;">${logo}</a>` : logo;
        }).join('');
        sponsorHtml = `
          <div style="text-align: center; margin: 20px 0; padding: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Sponsored By</p>
            <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px;">${logos}</div>
          </div>
        `;
      }
    }
  } catch (e) {
    // Non-critical: skip sponsors if lookup fails
  }

  // Get tickets for this order
  const tickets = await database.select().from(ticketItems).where(eq(ticketItems.orderId, params.orderId));
  
  // Get tier names
  const tierIds = [...new Set(tickets.map(t => t.tierId))];
  const tiers: Record<number, string> = {};
  for (const tierId of tierIds) {
    const [tier] = await database.select().from(ticketTiers).where(eq(ticketTiers.id, tierId)).limit(1);
    if (tier) tiers[tierId] = tier.name;
  }

  const eventDate = formatDateOnly(event.eventDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const confirmationUrl = `${ENV.baseUrl}/tickets/confirmation/${params.orderNumber}`;

  const ticketRows = tickets.map(t => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${tiers[t.tierId] || 'Ticket'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-family: monospace;">${t.ticketCode.substring(0, 8).toUpperCase()}...</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right;">$${(t.price / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Ologywood</h1>
      </div>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; margin-bottom: 8px;">🎫</div>
        <h2 style="margin: 0; color: #166534; font-size: 20px;">You're In!</h2>
        <p style="color: #15803d; margin: 8px 0 0; font-size: 14px;">Your tickets have been confirmed</p>
      </div>
      <p style="color: #333; font-size: 15px;">Hi ${params.buyerName},</p>
      <p style="color: #333; font-size: 15px;">Your tickets for <strong>${event.eventTitle}</strong> are confirmed! Here are your details:</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Event</td><td style="padding: 6px 0; color: #111; font-weight: bold;">${event.eventTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Date</td><td style="padding: 6px 0; color: #111;">${eventDate}${event.eventTime ? ` at ${event.eventTime}` : ''}</td></tr>
          ${event.location ? `<tr><td style="padding: 6px 0; color: #6b7280;">Location</td><td style="padding: 6px 0; color: #111;">${event.location}</td></tr>` : ''}
          <tr><td style="padding: 6px 0; color: #6b7280;">Order #</td><td style="padding: 6px 0; color: #111;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Total</td><td style="padding: 6px 0; color: #111; font-weight: bold;">$${(params.totalAmount / 100).toFixed(2)}</td></tr>
        </table>
      </div>
      <h3 style="color: #333; font-size: 16px; margin: 24px 0 12px;">Your Tickets (${tickets.length})</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Tier</th>
            <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Code</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${ticketRows}</tbody>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmationUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Tickets & QR Codes</a>
      </div>
      <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 8px; color: #92400e; font-size: 14px;">Important</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px;">
          <li>Show your QR code at the venue entrance for check-in</li>
          <li>Each ticket has a unique code — screenshot or save this email</li>
          <li>You can transfer tickets to friends from the confirmation page</li>
        </ul>
      </div>
      ${sponsorHtml}
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(params.buyerEmail)}&type=ticket" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">Ologywood — Book Talented Artists for Your Events</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: params.buyerEmail,
    subject: `🎫 Your tickets for ${event.eventTitle} — Order #${params.orderNumber}`,
    html,
  });

  console.log(`[TicketEmail] Confirmation sent to ${params.buyerEmail} for order ${params.orderNumber}`);
}

/**
 * Handle successful tip payment — record in artist_earnings and notify artist
 */
async function handleTipSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const artistId = paymentIntent.metadata?.artistId;
  const artistUserId = paymentIntent.metadata?.artistUserId;
  const tipperName = paymentIntent.metadata?.tipperName || 'Anonymous';
  const tipMessage = paymentIntent.metadata?.message || '';

  if (!artistId || !artistUserId) {
    console.error('[Stripe Webhook] Tip payment missing artistId or artistUserId metadata');
    return;
  }

  const amount = paymentIntent.amount / 100;
  console.log(`[Stripe Webhook] Tip of $${amount.toFixed(2)} received for artist ${artistId} from ${tipperName}`);

  const database = await db.getDb();
  if (!database) return;

  const { artistEarnings, artistProfiles } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  // Record the tip as an earning (no platform fee — 100% to artist)
  try {
    await database.insert(artistEarnings).values({
      artistId: parseInt(artistId),
      bookingId: -Math.abs(parseInt(paymentIntent.id.replace(/\D/g, '').slice(0, 9)) || Date.now()),
      grossAmount: amount.toFixed(2),
      platformFee: '0.00',
      netAmount: amount.toFixed(2),
      status: 'completed',
    });
    console.log(`[Stripe Webhook] Tip earning recorded for artist ${artistId}: $${amount.toFixed(2)}`);
  } catch (err) {
    console.warn('[Stripe Webhook] Could not insert tip earning (may be duplicate):', err);
  }

  // Send notification email to the artist
  try {
    const [artistProfile] = await database
      .select()
      .from(artistProfiles)
      .where(eq(artistProfiles.id, parseInt(artistId)))
      .limit(1);

    if (artistProfile) {
      const artistUser = await db.getUserById(artistProfile.userId);
      if (artistUser?.email) {
        await email.sendEmail({
          to: artistUser.email,
          subject: `You received a $${amount.toFixed(2)} tip!`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Ologywood</h1></div>
            <div style="background: #f5f3ff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">&hearts;</div>
              <h2 style="margin: 0; color: #5b21b6; font-size: 22px;">You received a tip!</h2>
              <p style="color: #7c3aed; font-size: 32px; font-weight: bold; margin: 12px 0;">$${amount.toFixed(2)}</p>
              <p style="color: #6d28d9; margin: 0; font-size: 14px;">From: ${tipperName}</p>
              ${tipMessage ? `<p style="color: #4c1d95; margin: 12px 0 0; font-style: italic; font-size: 14px;">&ldquo;${tipMessage}&rdquo;</p>` : ''}
            </div>
            <p style="color: #333; font-size: 15px;">Hi ${artistProfile.artistName},</p>
            <p style="color: #333; font-size: 15px;">Someone just showed their appreciation by sending you a tip through Ologywood. The full amount has been sent directly to your connected Stripe account &mdash; no platform fees.</p>
            <div style="text-align: center; margin: 24px 0;"><a href="https://www.ologywood.com/earnings" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Earnings</a></div>
            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">Keep making great music!</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;"><p style="color: #9ca3af; font-size: 11px;">Ologywood &mdash; Book Talented Artists for Your Events</p></div>
          </div>`,
        });
        console.log(`[Stripe Webhook] Tip notification email sent to ${artistUser.email}`);
      }
    }
  } catch (emailErr) {
    console.error('[Stripe Webhook] Error sending tip notification email:', emailErr);
  }
}
