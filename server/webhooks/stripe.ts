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
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('[Stripe Webhook] No userId in session metadata');
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}`);

  // Update or create subscription record
  await db.upsertSubscription({
    userId: parseInt(userId),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    planType: 'basic',
    status: 'trialing', // Will be updated by subscription.created event
  });
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

  await db.updateSubscriptionStatus(parseInt(userId), 'canceled');
  
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
