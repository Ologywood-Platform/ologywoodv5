import sgMail from '@sendgrid/mail';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { emailPreferences, users } from '../../drizzle/schema';
import {
  getBookingConfirmationTemplate,
  getNewOpportunityTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getPaymentConfirmationTemplate,
  getSupportTicketResponseTemplate,
} from './emailBrandingTemplates';

// Initialize SendGrid
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailPreferenceSettings {
  frequency: 'daily' | 'weekly' | 'never';
  bookingUpdates: boolean;
  newOpportunities: boolean;
  platformNews: boolean;
  weeklyDigest: boolean;
  reminders: boolean;
}

/**
 * Get user's email preferences
 */
export async function getUserEmailPreferences(userId: number): Promise<EmailPreferenceSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // Return default preferences if not found
    return {
      frequency: 'weekly',
      bookingUpdates: true,
      newOpportunities: true,
      platformNews: false,
      weeklyDigest: true,
      reminders: true,
    };
  }

  return {
    frequency: result[0].frequency as 'daily' | 'weekly' | 'never',
    bookingUpdates: result[0].bookingUpdates,
    newOpportunities: result[0].newOpportunities,
    platformNews: result[0].platformNews,
    weeklyDigest: result[0].weeklyDigest,
    reminders: result[0].reminders,
  };
}

/**
 * Check if user should receive an email based on their preferences
 */
export function shouldSendEmail(
  preferences: EmailPreferenceSettings,
  emailType: 'bookingUpdates' | 'newOpportunities' | 'platformNews' | 'weeklyDigest' | 'reminders'
): boolean {
  // Never send if frequency is 'never'
  if (preferences.frequency === 'never') {
    return false;
  }

  // Check if this specific email type is enabled
  return preferences[emailType] === true;
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  userId: number,
  userEmail: string,
  bookingDetails: {
    artistName: string;
    venueName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    bookingId: number;
  }
): Promise<boolean> {
  try {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences || !shouldSendEmail(preferences, 'bookingUpdates')) {
      return false;
    }

    const message = {
      to: userEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `Booking Confirmation: ${bookingDetails.artistName} at ${bookingDetails.venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmation</h2>
          <p>Your booking has been confirmed!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${bookingDetails.artistName}</h3>
            <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
            <p><strong>Date:</strong> ${bookingDetails.eventDate}</p>
            <p><strong>Time:</strong> ${bookingDetails.eventTime}</p>
            <p><strong>Location:</strong> ${bookingDetails.eventLocation}</p>
          </div>

          <p>You can view more details about this booking in your Ologywood dashboard.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>You're receiving this email because you have booking update notifications enabled. You can manage your email preferences in your account settings.</p>
          </div>
        </div>
      `,
    };

    if (!process.env.SENDGRID_API_KEY) {
      return false;
    }

    await sgMail.send(message as any);
    return true;
  } catch (error) {
    console.error('[Email] Error sending booking confirmation:', error);
    return false;
  }
}

/**
 * Send new opportunity email
 */
export async function sendNewOpportunityEmail(
  userId: number,
  userEmail: string,
  opportunityDetails: {
    venueName: string;
    eventType: string;
    eventDate: string;
    budget: string;
    location: string;
    opportunityId: number;
  }
): Promise<boolean> {
  try {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences || !shouldSendEmail(preferences, 'newOpportunities')) {
      return false;
    }

    const message = {
      to: userEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `New Booking Opportunity: ${opportunityDetails.venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Booking Opportunity</h2>
          <p>A venue is looking for talent like you!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${opportunityDetails.venueName}</h3>
            <p><strong>Event Type:</strong> ${opportunityDetails.eventType}</p>
            <p><strong>Date:</strong> ${opportunityDetails.eventDate}</p>
            <p><strong>Budget:</strong> ${opportunityDetails.budget}</p>
            <p><strong>Location:</strong> ${opportunityDetails.location}</p>
          </div>

          <p><a href="https://ologywood.com/opportunities/${opportunityDetails.opportunityId}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Opportunity</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>You're receiving this email because you have new opportunity notifications enabled. You can manage your email preferences in your account settings.</p>
          </div>
        </div>
      `,
    };

    if (!process.env.SENDGRID_API_KEY) {
      return false;
    }

    await sgMail.send(message as any);
    return true;
  } catch (error) {
    console.error('[Email] Error sending new opportunity email:', error);
    return false;
  }
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigestEmail(
  userId: number,
  userEmail: string,
  digestContent: {
    newOpportunities: number;
    upcomingBookings: number;
    newMessages: number;
    platformUpdates: string[];
  }
): Promise<boolean> {
  try {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences || !shouldSendEmail(preferences, 'weeklyDigest')) {
      return false;
    }

    const message = {
      to: userEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Your Weekly Ologywood Digest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Weekly Digest</h2>
          <p>Here's what's happening on Ologywood this week:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📊 This Week's Summary</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;"><strong>${digestContent.newOpportunities}</strong> new booking opportunities</li>
              <li style="padding: 8px 0;"><strong>${digestContent.upcomingBookings}</strong> upcoming bookings</li>
              <li style="padding: 8px 0;"><strong>${digestContent.newMessages}</strong> new messages</li>
            </ul>
          </div>

          ${digestContent.platformUpdates.length > 0 ? `
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>🎉 Platform Updates</h3>
              <ul style="list-style: none; padding: 0;">
                ${digestContent.platformUpdates.map(update => `<li style="padding: 8px 0;">• ${update}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <p><a href="https://ologywood.com/dashboard" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>You're receiving this email because you have weekly digest notifications enabled. You can manage your email preferences in your account settings.</p>
          </div>
        </div>
      `,
    };

    if (!process.env.SENDGRID_API_KEY) {
      return false;
    }

    await sgMail.send(message as any);
    return true;
  } catch (error) {
    console.error('[Email] Error sending weekly digest:', error);
    return false;
  }
}

/**
 * Send booking reminder email
 */
export async function sendBookingReminderEmail(
  userId: number,
  userEmail: string,
  reminderDetails: {
    artistName: string;
    venueName: string;
    eventDate: string;
    eventTime: string;
    hoursUntilEvent: number;
  }
): Promise<boolean> {
  try {
    const preferences = await getUserEmailPreferences(userId);
    if (!preferences || !shouldSendEmail(preferences, 'reminders')) {
      return false;
    }

    const message = {
      to: userEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: `Reminder: Your booking with ${reminderDetails.artistName} is coming up!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Reminder</h2>
          <p>Your booking is happening soon!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${reminderDetails.artistName}</h3>
            <p><strong>Venue:</strong> ${reminderDetails.venueName}</p>
            <p><strong>Date:</strong> ${reminderDetails.eventDate}</p>
            <p><strong>Time:</strong> ${reminderDetails.eventTime}</p>
            <p><strong>Time until event:</strong> ${reminderDetails.hoursUntilEvent} hours</p>
          </div>

          <p>Make sure everything is ready for the event!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p>You're receiving this email because you have booking reminder notifications enabled. You can manage your email preferences in your account settings.</p>
          </div>
        </div>
      `,
    };

    if (!process.env.SENDGRID_API_KEY) {
      return false;
    }

    await sgMail.send(message as any);
    return true;
  } catch (error) {
    console.error('[Email] Error sending booking reminder:', error);
    return false;
  }
}
