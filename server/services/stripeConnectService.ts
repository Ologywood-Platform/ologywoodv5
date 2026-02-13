import Stripe from 'stripe';
import { getDb } from '../db';
import { stripeConnectAccounts, artistPayouts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export const stripeConnectService = {
  /**
   * Create Stripe Connect account for artist
   */
  async createConnectAccount(artistId: number, email: string, artistName: string) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        business_profile: {
          name: artistName,
          support_email: email,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      await db.insert(stripeConnectAccounts).values({
        artistId,
        stripeAccountId: account.id,
        status: 'pending',
        chargesEnabled: false,
        payoutsEnabled: false,
      });

      return account;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw error;
    }
  },

  /**
   * Get Stripe Connect onboarding link
   */
  async getOnboardingLink(artistId: number, refreshUrl: string, returnUrl: string) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const accounts = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.artistId, artistId)).limit(1);
      const account = accounts.length > 0 ? accounts[0] : null;

      if (!account) {
        throw new Error('Stripe Connect account not found');
      }

      const link = await stripe.accountLinks.create({
        account: account.stripeAccountId,
        type: 'account_onboarding',
        refresh_url: refreshUrl,
        return_url: returnUrl,
      });

      return link;
    } catch (error) {
      console.error('Error getting onboarding link:', error);
      throw error;
    }
  },

  /**
   * Get Connect account status
   */
  async getAccountStatus(artistId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      const accounts = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.artistId, artistId)).limit(1);
      const connectAccount = accounts.length > 0 ? accounts[0] : null;

      if (!connectAccount) {
        return null;
      }

      const account = await stripe.accounts.retrieve(connectAccount.stripeAccountId);

      // Update status in database
      if (db) {
        await db
          .update(stripeConnectAccounts)
          .set({
            status: account.charges_enabled ? 'active' : 'pending',
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            bankAccountVerified: account.requirements?.currently_due?.length === 0,
          })
          .where(eq(stripeConnectAccounts.artistId, artistId));
      }

      return {
        status: account.charges_enabled ? 'active' : 'pending',
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        bankAccountVerified: account.requirements?.currently_due?.length === 0,
        requiredDocuments: account.requirements?.currently_due || [],
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  },

  /**
   * Process payout using Stripe Connect
   */
  async processPayout(payoutId: number, artistId: number, amount: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      // Get Connect account
      const accounts = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.artistId, artistId)).limit(1);
      const connectAccount = accounts.length > 0 ? accounts[0] : null;

      if (!connectAccount?.payoutsEnabled) {
        throw new Error('Stripe Connect payouts not enabled for this artist');
      }

      // Create transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: connectAccount.stripeAccountId,
        description: 'Artist payout for booking',
      });

      // Update payout record
      if (db) {
        await db
          .update(artistPayouts)
          .set({
            status: 'completed',
            stripeTransferId: transfer.id,
            completedAt: new Date(),
          })
          .where(eq(artistPayouts.id, payoutId));
      }

      return transfer;
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  },

  /**
   * Handle Stripe Connect webhook events
   */
  async handleConnectWebhook(event: any) {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      switch (event.type) {
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          const accounts = await db.select().from(stripeConnectAccounts).where(eq(stripeConnectAccounts.stripeAccountId, account.id)).limit(1);
          const connectAccount = accounts.length > 0 ? accounts[0] : null;

          if (connectAccount) {
            await db
              .update(stripeConnectAccounts)
              .set({
                status: account.charges_enabled ? 'active' : 'pending',
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
              })
              .where(eq(stripeConnectAccounts.id, connectAccount.id));
          }
          break;
        }

        case 'transfer.created': {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(`Transfer created: ${transfer.id}`);
          break;
        }

        case 'transfer.paid': {
          const transfer = event.data.object as Stripe.Transfer;
          console.log(`Transfer paid: ${transfer.id}`);
          break;
        }

        case 'transfer.failed': {
          const transfer = event.data.object as Stripe.Transfer;
          console.error(`Transfer failed: ${transfer.id}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error handling Connect webhook:', error);
      throw error;
    }
  },
};
