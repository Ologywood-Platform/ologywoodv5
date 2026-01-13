import { ENV } from "./_core/env";

/**
 * Email notification service for Ologywood platform
 * Uses the built-in notification API to send emails
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using the built-in notification API
 */
async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    const response = await fetch(`${ENV.forgeApiUrl}/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error('[Email] Failed to send email:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Send booking request notification to artist
 */
export async function sendBookingRequestEmail(params: {
  artistEmail: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventDetails?: string;
}) {
  const { artistEmail, artistName, venueName, eventDate, eventDetails } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">New Booking Request</h2>
      <p>Hi ${artistName},</p>
      <p>You have received a new booking request from <strong>${venueName}</strong>.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Event Date:</strong> ${eventDate}</p>
        ${eventDetails ? `<p><strong>Details:</strong> ${eventDetails}</p>` : ''}
      </div>
      
      <p>Please log in to your Ologywood dashboard to review and respond to this request.</p>
      
      <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `New Booking Request from ${venueName}`,
    html,
  });
}

/**
 * Send booking confirmation notification to both parties
 */
export async function sendBookingConfirmationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  otherPartyName: string;
  eventDate: string;
  venueName: string;
  venueAddress?: string;
}) {
  const { recipientEmail, recipientName, otherPartyName, eventDate, venueName, venueAddress } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Booking Confirmed! 🎉</h2>
      <p>Hi ${recipientName},</p>
      <p>Great news! Your booking with <strong>${otherPartyName}</strong> has been confirmed.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Venue:</strong> ${venueName}</p>
        ${venueAddress ? `<p><strong>Address:</strong> ${venueAddress}</p>` : ''}
        <p><strong>Event Date:</strong> ${eventDate}</p>
      </div>
      
      <p>You can view all booking details in your dashboard.</p>
      
      <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Booking Confirmed: ${venueName} - ${eventDate}`,
    html,
  });
}

/**
 * Send booking cancellation notification
 */
export async function sendBookingCancellationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  otherPartyName: string;
  eventDate: string;
  venueName: string;
}) {
  const { recipientEmail, recipientName, otherPartyName, eventDate, venueName } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Booking Cancelled</h2>
      <p>Hi ${recipientName},</p>
      <p>We're writing to inform you that your booking with <strong>${otherPartyName}</strong> has been cancelled.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Venue:</strong> ${venueName}</p>
        <p><strong>Event Date:</strong> ${eventDate}</p>
      </div>
      
      <p>If you have any questions, please contact the other party directly or reach out to Ologywood support.</p>
      
      <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Booking Cancelled: ${venueName} - ${eventDate}`,
    html,
  });
}

/**
 * Send subscription created notification
 */
export async function sendSubscriptionCreatedEmail(params: {
  artistEmail: string;
  artistName: string;
  trialEndDate?: string;
}) {
  const { artistEmail, artistName, trialEndDate } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">Welcome to Ologywood! 🎵</h2>
      <p>Hi ${artistName},</p>
      <p>Thank you for subscribing to Ologywood! Your subscription is now active.</p>
      
      ${trialEndDate ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Free Trial Active</strong></p>
          <p style="margin: 10px 0 0 0;">Your 14-day free trial ends on ${trialEndDate}. You won't be charged until then.</p>
        </div>
      ` : ''}
      
      <p>You now have access to all Ologywood features:</p>
      <ul style="line-height: 1.8;">
        <li>Create and manage your artist profile</li>
        <li>Receive booking requests from venues</li>
        <li>Manage your availability calendar</li>
        <li>Create rider templates</li>
        <li>Communicate with venues</li>
      </ul>
      
      <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Go to Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: 'Welcome to Ologywood - Subscription Active',
    html,
  });
}

/**
 * Send subscription trial ending notification
 */
export async function sendTrialEndingEmail(params: {
  artistEmail: string;
  artistName: string;
  daysRemaining: number;
}) {
  const { artistEmail, artistName, daysRemaining } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Your Trial is Ending Soon</h2>
      <p>Hi ${artistName},</p>
      <p>This is a friendly reminder that your Ologywood free trial will end in <strong>${daysRemaining} days</strong>.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>After your trial ends, your subscription will automatically continue at $29/month. You can cancel anytime from your dashboard.</p>
      </div>
      
      <p>We hope you're enjoying Ologywood! If you have any questions or feedback, please don't hesitate to reach out.</p>
      
      <a href="https://ologywood.com/subscription" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Manage Subscription
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `Your Ologywood Trial Ends in ${daysRemaining} Days`,
    html,
  });
}

/**
 * Send subscription canceled notification
 */
export async function sendSubscriptionCanceledEmail(params: {
  artistEmail: string;
  artistName: string;
  endDate: string;
}) {
  const { artistEmail, artistName, endDate } = params;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b7280;">Subscription Cancelled</h2>
      <p>Hi ${artistName},</p>
      <p>We're sorry to see you go! Your Ologywood subscription has been cancelled.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>You'll continue to have access to all features until <strong>${endDate}</strong>.</p>
        <p>After that date, your profile will be hidden from venues and you won't be able to receive new bookings.</p>
      </div>
      
      <p>You can reactivate your subscription anytime from your dashboard. We'd love to have you back!</p>
      
      <a href="https://ologywood.com/subscription" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Reactivate Subscription
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: 'Your Ologywood Subscription Has Been Cancelled',
    html,
  });
}

/**
 * Send notification to venue when artist responds to their review
 */
export async function sendReviewResponseEmail(params: {
  venueEmail: string;
  venueName: string;
  artistName: string;
  originalReview: string;
  artistResponse: string;
  rating: number;
}) {
  const { venueEmail, venueName, artistName, originalReview, artistResponse, rating } = params;

  const stars = '⭐'.repeat(rating);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">Artist Responded to Your Review</h2>
      <p>Hi ${venueName},</p>
      <p><strong>${artistName}</strong> has responded to the review you left on their profile.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Your Review (${stars}):</strong></p>
        <p style="margin: 0 0 20px 0; font-style: italic; color: #6b7280;">"${originalReview}"</p>
        
        <div style="border-left: 4px solid #8b5cf6; padding-left: 16px; margin-top: 16px;">
          <p style="margin: 0 0 10px 0; color: #8b5cf6; font-weight: bold;">Artist Response:</p>
          <p style="margin: 0; color: #374151;">"${artistResponse}"</p>
        </div>
      </div>
      
      <p>Thank you for being part of the Ologywood community and helping artists improve their services!</p>
      
      <a href="https://ologywood.com/artist/${artistName}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Artist Profile
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: venueEmail,
    subject: `${artistName} Responded to Your Review`,
    html,
  });
}
