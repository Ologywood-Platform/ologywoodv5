/**
 * Stripe Connect Router — handles artist Stripe Connect account management.
 * Artists connect their own Stripe accounts to receive payments directly.
 * Platform takes a fee via application_fee_amount on each transaction.
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import Stripe from 'stripe';
import { getDb } from '../db';
import { stripeConnectAccounts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export const stripeConnectRouter = router({
  /**
   * Get the current artist's Stripe Connect account status
   */
  getAccountStatus: protectedProcedure.query(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Look up the connect account by userId (artistId in the table maps to userId)
    const accounts = await db
      .select()
      .from(stripeConnectAccounts)
      .where(eq(stripeConnectAccounts.artistId, userId))
      .limit(1);

    if (!accounts.length) {
      return {
        connected: false,
        status: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        stripeAccountId: null,
        requiresAction: false,
      };
    }

    const account = accounts[0];

    // Fetch latest status from Stripe
    try {
      const stripeAccount = await stripe.accounts.retrieve(account.stripeAccountId);

      // Update local record if status changed
      const chargesEnabled = stripeAccount.charges_enabled || false;
      const payoutsEnabled = stripeAccount.payouts_enabled || false;
      const newStatus = chargesEnabled && payoutsEnabled ? 'active' : 'pending';

      if (
        account.chargesEnabled !== chargesEnabled ||
        account.payoutsEnabled !== payoutsEnabled ||
        account.status !== newStatus
      ) {
        const dbUpdate = await getDb();
        if (!dbUpdate) throw new Error('Database not available');
        await dbUpdate
          .update(stripeConnectAccounts)
          .set({
            chargesEnabled,
            payoutsEnabled,
            status: newStatus,
            verificationStatus: (stripeAccount as any).requirements?.currently_due?.length
              ? 'incomplete'
              : 'verified',
          })
          .where(eq(stripeConnectAccounts.id, account.id));
      }

      return {
        connected: true,
        status: newStatus,
        chargesEnabled,
        payoutsEnabled,
        stripeAccountId: account.stripeAccountId,
        requiresAction: (stripeAccount as any).requirements?.currently_due?.length > 0,
        currentlyDue: (stripeAccount as any).requirements?.currently_due || [],
      };
    } catch (error: any) {
      console.error('[Stripe Connect] Error fetching account:', error.message);
      return {
        connected: true,
        status: account.status,
        chargesEnabled: account.chargesEnabled,
        payoutsEnabled: account.payoutsEnabled,
        stripeAccountId: account.stripeAccountId,
        requiresAction: false,
      };
    }
  }),

  /**
   * Create a Stripe Connect Express account and return the onboarding URL
   */
  createAccount: protectedProcedure.mutation(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const userEmail = ctx.user.email;
    const userName = ctx.user.name;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Check if account already exists
    const existing = await db
      .select()
      .from(stripeConnectAccounts)
      .where(eq(stripeConnectAccounts.artistId, userId))
      .limit(1);

    if (existing.length && existing[0].stripeAccountId) {
      // Account exists — generate a new onboarding link to complete setup
      const accountLink = await stripe.accountLinks.create({
        account: existing[0].stripeAccountId,
        refresh_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=refresh`,
        return_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=connected`,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
        stripeAccountId: existing[0].stripeAccountId,
        isExisting: true,
      };
    }

    // Create a new Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: userEmail || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: userName || undefined,
        product_description: 'Artist receiving payments for music and performances via Ologywood',
      },
      metadata: {
        userId: userId.toString(),
        platform: 'ologywood',
      },
    });

    // Save to database
    await db!.insert(stripeConnectAccounts).values({
      artistId: userId,
      stripeAccountId: account.id,
      status: 'pending',
      chargesEnabled: false,
      payoutsEnabled: false,
      bankAccountVerified: false,
      verificationStatus: 'pending',
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=refresh`,
      return_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=connected`,
      type: 'account_onboarding',
    });

    console.log(`[Stripe Connect] Created account ${account.id} for user ${userId}`);

    return {
      url: accountLink.url,
      stripeAccountId: account.id,
      isExisting: false,
    };
  }),

  /**
   * Get a Stripe Express dashboard login link for the artist
   */
  getDashboardLink: protectedProcedure.mutation(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const accounts = await db
      .select()
      .from(stripeConnectAccounts)
      .where(eq(stripeConnectAccounts.artistId, userId))
      .limit(1);

    if (!accounts.length) {
      throw new Error('No Stripe Connect account found. Please connect your account first.');
    }

    const loginLink = await stripe.accounts.createLoginLink(accounts[0].stripeAccountId);

    return { url: loginLink.url };
  }),

  /**
   * Get a fresh onboarding link (for completing incomplete setup)
   */
  getOnboardingLink: protectedProcedure.mutation(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const accounts = await db
      .select()
      .from(stripeConnectAccounts)
      .where(eq(stripeConnectAccounts.artistId, userId))
      .limit(1);

    if (!accounts.length) {
      throw new Error('No Stripe Connect account found. Please create an account first.');
    }

    const accountLink = await stripe.accountLinks.create({
      account: accounts[0].stripeAccountId,
      refresh_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=refresh`,
      return_url: `${process.env.BASE_URL || 'https://www.ologywood.com'}/dashboard?stripe=connected`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }),

  /**
   * Disconnect Stripe Connect account (soft delete — mark as inactive)
   */
  disconnectAccount: protectedProcedure.mutation(async ({ ctx }: any) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(stripeConnectAccounts)
      .set({ status: 'inactive' })
      .where(eq(stripeConnectAccounts.artistId, userId));

    return { success: true };
  }),
});
