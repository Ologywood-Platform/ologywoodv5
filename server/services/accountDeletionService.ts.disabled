import {
  users,
  artistProfiles,
  venueProfiles,
  bookings,
  contracts,
  messages,
  reviews,
  favorites,
  follows,
  riderTemplates,
  emailPreferences,
  notificationPreferences,
  subscriptions,
  verificationBadges,
  referrals,
  signatures,
  profileViews,
} from '../../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * AccountDeletionService handles the complete deletion of user accounts
 * including cascading deletes, data cleanup, and notifications
 */
export class AccountDeletionService {
  /**
   * Delete a user account and all associated data
   * Sends confirmation email before deletion
   */
  static async deleteAccount(userId: number, userEmail: string, userName: string): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Step 1: Send confirmation email before deletion
      await this.sendAccountDeletionEmail(userEmail, userName);

      // Step 2: Delete all user-related data in order of dependencies
      // This prevents foreign key constraint violations

      // Delete artist-specific data
      await db.delete(riderTemplates).where(eq(riderTemplates.artistId, userId));
      await db.delete(artistProfiles).where(eq(artistProfiles.userId, userId));

      // Delete venue-specific data
      await db.delete(venueProfiles).where(eq(venueProfiles.userId, userId));

      // Delete booking-related data
      const userBookings = await db.query.bookings.findMany({
        where: eq(bookings.artistId, userId),
      });
      const bookingIds = userBookings.map((b: any) => b.id);
      
      if (bookingIds.length > 0) {
        await db.delete(contracts).where(inArray(contracts.bookingId, bookingIds));
        await db.delete(signatures).where(inArray(signatures.bookingId, bookingIds));
        await db.delete(bookings).where(inArray(bookings.id, bookingIds));
      }

      // Delete venue bookings
      await db.delete(bookings).where(eq(bookings.venueId, userId));

      // Delete messages (both sent and received)
      await db.delete(messages).where(eq(messages.senderId, userId));
      await db.delete(messages).where(eq(messages.recipientId, userId));

      // Delete reviews and ratings
      await db.delete(reviews).where(eq(reviews.artistId, userId));
      await db.delete(reviews).where(eq(reviews.reviewerId, userId));

      // Delete favorites
      await db.delete(favorites).where(eq(favorites.venueId, userId));
      await db.delete(favorites).where(eq(favorites.artistId, userId));

      // Delete follows
      await db.delete(follows).where(eq(follows.followerId, userId));
      await db.delete(follows).where(eq(follows.followingId, userId));

      // Delete user preferences and settings
      await db.delete(emailPreferences).where(eq(emailPreferences.userId, userId));
      await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));

      // Delete subscription data
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

      // Delete verification badges
      await db.delete(verificationBadges).where(eq(verificationBadges.userId, userId));

      // Delete referral data
      await db.delete(referrals).where(eq(referrals.referrerId, userId));
      await db.delete(referrals).where(eq(referrals.referredUserId, userId));

      // Delete profile views
      await db.delete(profileViews).where(eq(profileViews.viewerId, userId));
      await db.delete(profileViews).where(eq(profileViews.profileOwnerId, userId));

      // Step 3: Finally delete the user account
      await db.delete(users).where(eq(users.id, userId));

      console.log(`[AccountDeletion] Successfully deleted account for user ${userId} (${userEmail})`);
    } catch (error) {
      console.error(`[AccountDeletion] Error deleting account for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send account deletion confirmation email
   */
  private static async sendAccountDeletionEmail(userEmail: string, userName: string): Promise<void> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('[AccountDeletion] SendGrid API key not configured. Email not sent (dev mode)');
        return;
      }

      const message = {
        to: userEmail,
        from: SENDGRID_FROM_EMAIL,
        subject: 'Your Ologywood Account Has Been Deleted',
        html: this.getConfirmationEmailTemplate(userName),
      };

      await sgMail.send(message as any);
      console.log(`[AccountDeletion] Confirmation email sent to ${userEmail}`);
    } catch (error) {
      console.error(`[AccountDeletion] Error sending confirmation email:`, error);
      // Don't throw - deletion should continue even if email fails
    }
  }

  /**
   * Get the confirmation email template
   */
  private static getConfirmationEmailTemplate(userName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Deletion Confirmation</h2>
        <p>Hi ${userName},</p>
        <p>Your Ologywood account has been successfully deleted. All your personal data, bookings, messages, and preferences have been permanently removed from our system.</p>
        
        <h3>What Was Deleted:</h3>
        <ul>
          <li>Your profile information and settings</li>
          <li>All booking history and contracts</li>
          <li>Messages and conversations</li>
          <li>Reviews and ratings</li>
          <li>Saved preferences and notifications</li>
          <li>All other associated data</li>
        </ul>

        <p>If you have any questions or believe this was done in error, please contact our support team within 30 days.</p>

        <p>Thank you for being part of the Ologywood community.</p>

        <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
  }
}
