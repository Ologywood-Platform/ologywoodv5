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

/**
 * Send notification to venue when artist submits a review
 */
export async function sendVenueReviewNotificationEmail(params: {
  venueEmail: string;
  venueName: string;
  artistName: string;
  reviewText: string;
  rating: number;
  venueProfileUrl: string;
}) {
  const { venueEmail, venueName, artistName, reviewText, rating, venueProfileUrl } = params;

  const stars = '⭐'.repeat(rating);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">New Review from an Artist</h2>
      <p>Hi ${venueName},</p>
      <p><strong>${artistName}</strong> has left a review for your venue on Ologywood.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Rating: ${stars}</strong></p>
        ${reviewText ? `<p style="margin: 0; font-style: italic; color: #6b7280;">"${reviewText}"</p>` : '<p style="margin: 0; color: #9ca3af;">No written review provided.</p>'}
      </div>
      
      <p>You can respond to this review to show your appreciation or address any concerns. Public responses help build trust with artists!</p>
      
      <a href="${venueProfileUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Review & Respond
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: venueEmail,
    subject: `New Review from ${artistName}`,
    html,
  });
}


/**
 * Send availability update notification to venues who favorited the artist
 */
export async function sendAvailabilityUpdateNotification(
  venueEmail: string,
  venueName: string,
  artistName: string,
  artistId: number,
  newDates: string[]
) {
  const datesFormatted = newDates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }).join('<br>');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Availability from ${artistName}</h2>
      
      <p>Hi ${venueName},</p>
      
      <p>Good news! <strong>${artistName}</strong>, an artist you've saved, has added new availability dates:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        ${datesFormatted}
      </div>
      
      <p>Don't miss this opportunity to book them for your venue!</p>
      
      <a href="https://${ENV.appId}.manus.space/artist/${artistId}" 
         style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        View ${artistName}'s Profile
      </a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        You're receiving this because you saved ${artistName} to your favorites. 
        You can manage your saved artists in your dashboard.
      </p>
    </div>
  `;
  
  return await sendEmail({
    to: venueEmail,
    subject: `${artistName} has new availability dates`,
    html,
  });
}


export async function sendBookingReminder(
  recipientEmail: string,
  recipientName: string,
  bookingDetails: {
    artistName: string;
    venueName: string;
    eventDate: Date;
    eventTime?: string;
    venueAddress?: string;
    totalFee?: number;
    eventDetails?: string;
  },
  daysUntilEvent: number,
  isArtist: boolean
) {
  const eventDateStr = bookingDetails.eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const roleSpecificMessage = isArtist
    ? `This is a reminder that you have an upcoming performance at ${bookingDetails.venueName}.`
    : `This is a reminder that ${bookingDetails.artistName} will be performing at your venue.`;
  
  const preparationTips = isArtist
    ? `<ul>
        <li>Confirm your travel arrangements</li>
        <li>Review your rider requirements</li>
        <li>Prepare your equipment and setlist</li>
        <li>Contact the venue if you have any questions</li>
      </ul>`
    : `<ul>
        <li>Confirm venue setup and technical requirements</li>
        <li>Review the artist's rider</li>
        <li>Prepare payment arrangements</li>
        <li>Contact the artist if you have any questions</li>
      </ul>`;
  
  const subject = `Reminder: Event in ${daysUntilEvent} day${daysUntilEvent > 1 ? 's' : ''} - ${bookingDetails.artistName} at ${bookingDetails.venueName}`;
  
  const html = `
    <h2>Upcoming Event Reminder</h2>
    
    <p>Hello ${recipientName},</p>
    
    <p>${roleSpecificMessage}</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Event Details</h3>
      <p><strong>Artist:</strong> ${bookingDetails.artistName}</p>
      <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
      <p><strong>Date:</strong> ${eventDateStr}</p>
      ${bookingDetails.eventTime ? `<p><strong>Time:</strong> ${bookingDetails.eventTime}</p>` : ''}
      ${bookingDetails.venueAddress ? `<p><strong>Location:</strong> ${bookingDetails.venueAddress}</p>` : ''}
      ${bookingDetails.totalFee ? `<p><strong>Fee:</strong> $${bookingDetails.totalFee.toLocaleString()}</p>` : ''}
      ${bookingDetails.eventDetails ? `<p><strong>Details:</strong> ${bookingDetails.eventDetails}</p>` : ''}
    </div>
    
    <h3>Preparation Checklist (${daysUntilEvent} days before event):</h3>
    ${preparationTips}
    
    <p>If you need to make any changes or have questions, please log in to your dashboard to contact the ${isArtist ? 'venue' : 'artist'}.</p>
    
    <a href="https://${ENV.appId}.manus.space/dashboard" 
       style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
      View Dashboard
    </a>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
  
  await sendEmail({ to: recipientEmail, subject, html });
}


// ============= PAYMENT RECEIPT EMAILS =============

export async function sendPaymentReceipt(
  to: string,
  venueName: string,
  artistName: string,
  amount: number,
  paymentType: 'deposit' | 'full_payment',
  bookingDate?: string,
  transactionId?: string
) {
  const subject = `Payment Receipt - ${venueName} Booking`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Payment Receipt</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Thank you for your payment!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Venue:</strong> ${venueName}</p>
          <p><strong>Artist:</strong> ${artistName}</p>
          ${bookingDate ? `<p><strong>Event Date:</strong> ${bookingDate}</p>` : ''}
          <p><strong>Payment Type:</strong> ${paymentType === 'deposit' ? 'Deposit' : 'Full Payment'}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0;">Payment Information</h3>
          <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0;">$${amount.toFixed(2)}</p>
          ${transactionId ? `<p><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated receipt. Please keep this email for your records. If you have any questions about this payment, please contact us.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject,
    html,
  });
}

export async function sendRefundNotification(
  to: string,
  venueName: string,
  artistName: string,
  refundAmount: number,
  reason?: string
) {
  const subject = `Refund Processed - ${venueName} Booking`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Refund Processed</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Your refund has been successfully processed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
          <h3 style="margin-top: 0;">Refund Details</h3>
          <p><strong>Venue:</strong> ${venueName}</p>
          <p><strong>Artist:</strong> ${artistName}</p>
          <p><strong>Refund Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #f5576c;">$${refundAmount.toFixed(2)}</span></p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p><strong>Date Processed:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          The refund will appear in your account within 3-5 business days, depending on your bank.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject,
    html,
  });
}
