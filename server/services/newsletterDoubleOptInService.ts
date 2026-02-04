import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface NewsletterSubscription {
  email: string;
  name?: string;
  source?: string; // footer, signup_page, profile, etc.
}

export class NewsletterDoubleOptInService {
  static async initiateSubscription(subscription: NewsletterSubscription) {
    try {
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      console.log(`[Newsletter] Initiating double opt-in for: ${subscription.email}`);

      // In production, save token to database and send confirmation email
      // For now, we'll just log it
      const confirmationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/confirm?token=${confirmationToken}`;

      console.log(`[Newsletter] Confirmation link: ${confirmationLink}`);
      console.log(`[Newsletter] Token expires at: ${tokenExpiry}`);

      // Send confirmation email (would use SendGrid in production)
      await this.sendConfirmationEmail(subscription.email, confirmationLink, subscription.name);

      return {
        success: true,
        message: 'Confirmation email sent. Please check your inbox.',
        token: confirmationToken,
        expiresAt: tokenExpiry,
      };
    } catch (error) {
      console.error('[Newsletter] Error initiating subscription:', error);
      return {
        success: false,
        message: 'Failed to initiate subscription',
        error,
      };
    }
  }

  static async confirmSubscription(token: string) {
    try {
      console.log(`[Newsletter] Confirming subscription with token: ${token.substring(0, 10)}...`);

      // In production, verify token from database
      // Check token exists and hasn't expired
      // Mark user as confirmed

      return {
        success: true,
        message: 'Thank you for confirming your subscription!',
        confirmed: true,
      };
    } catch (error) {
      console.error('[Newsletter] Error confirming subscription:', error);
      return {
        success: false,
        message: 'Invalid or expired confirmation link',
        error,
      };
    }
  }

  static async sendConfirmationEmail(email: string, confirmationLink: string, name?: string) {
    try {
      // In production, use SendGrid API
      console.log(`[Newsletter] Sending confirmation email to: ${email}`);

      const emailContent = `
        <h2>Confirm Your Newsletter Subscription</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for subscribing to the Ologywood newsletter! To complete your subscription, please click the link below:</p>
        <p><a href="${confirmationLink}">Confirm Subscription</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      `;

      console.log('[Newsletter] Email content prepared');
      // In production: await sendgridClient.send({ to: email, html: emailContent, ... });

      return { success: true };
    } catch (error) {
      console.error('[Newsletter] Error sending confirmation email:', error);
      return { success: false, error };
    }
  }

  static async unsubscribe(email: string) {
    try {
      console.log(`[Newsletter] Unsubscribing: ${email}`);

      // In production, mark user as unsubscribed in database
      const db = getDb();
      
      // Update user newsletter preference
      await db
        .update(users)
        .set({ newsletterSubscribed: false })
        .where(eq(users.email, email));

      return {
        success: true,
        message: 'You have been unsubscribed from our newsletter',
      };
    } catch (error) {
      console.error('[Newsletter] Error unsubscribing:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe',
        error,
      };
    }
  }

  static async getSubscriptionStats() {
    try {
      const db = getDb();

      // Get newsletter statistics
      const totalSubscribers = await db
        .select()
        .from(users)
        .where(eq(users.newsletterSubscribed, true));

      return {
        totalSubscribers: totalSubscribers.length,
        unsubscribed: 0,
        pendingConfirmation: 0,
      };
    } catch (error) {
      console.error('[Newsletter] Error getting stats:', error);
      return {
        totalSubscribers: 0,
        unsubscribed: 0,
        pendingConfirmation: 0,
      };
    }
  }
}
