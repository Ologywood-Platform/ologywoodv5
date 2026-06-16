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
 * Send an email using SendGrid
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
    console.error('[Email] SendGrid not configured - SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing');
    return false;
  }

  try {
    console.log(`[Email] Sending to: ${to}, subject: ${subject}`);
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: ENV.sendgridFromEmail,
          name: 'Ologywood',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
        headers: {
          "List-Unsubscribe": `<${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(to)}>`,
        },
      }),
    });

    if (response.ok || response.status === 202) {
      console.log(`[Email] Sent successfully to ${to}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[Email] SendGrid failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('[Email] SendGrid error:', error);
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
      
      <a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(artistEmail)}&type=booking" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
      
      <a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=booking" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
  venueName?: string;
}) {
  const { recipientEmail, recipientName, otherPartyName, eventDate, venueName = 'Event' } = params;

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
      
      <a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=booking" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
 * Branded email wrapper for subscription emails
 */
function subscriptionEmailWrapper(content: string, recipientEmail: string): string {
  const baseUrl = ENV.baseUrl;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=subscription`;
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
      </div>
      <div style="padding: 30px 24px;">
        ${content}
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
          You're receiving this email because you have an Ologywood account.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Unsubscribe</a> | 
          <a href="${baseUrl}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
          <a href="${baseUrl}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          &copy; 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

/**
 * Send subscription upgrade/created confirmation email
 */
export async function sendSubscriptionCreatedEmail(params: {
  artistEmail: string;
  artistName: string;
  planName?: string;
  planPrice?: string;
  features?: string[];
  trialEndDate?: string;
}) {
  const { artistEmail, artistName, planName, planPrice, features, trialEndDate } = params;
  const displayPlan = planName || 'Professional Plan';
  const displayPrice = planPrice || '$29/month';
  const displayFeatures = features || [
    'Unlimited booking requests',
    'Rider Builder & saved templates',
    'Fan email list & Send Update',
    'In-platform messaging',
    'Availability calendar',
  ];
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      Welcome aboard! Your <strong>${displayPlan}</strong> subscription is now active.
    </p>

    <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
      <h3 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px;">${displayPlan}</h3>
      <p style="color: #6D28D9; font-weight: 600; margin: 0 0 12px 0; font-size: 20px;">${displayPrice}</p>
      ${trialEndDate ? `
        <div style="background: #fef3c7; padding: 12px 16px; border-radius: 6px; margin: 0 0 12px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>14-day free trial active</strong> — you won't be charged until ${trialEndDate}.</p>
        </div>
      ` : ''}
      <p style="color: #4b5563; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">What's included:</p>
      <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        ${displayFeatures.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
      Start exploring your new features and grow your booking business!
    </p>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `Welcome to Ologywood ${displayPlan}!`,
    html: subscriptionEmailWrapper(content, artistEmail),
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
      
      <a href="${ENV.baseUrl}/subscription" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Manage Subscription
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(artistEmail)}&type=subscription" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
 * Send subscription cancellation confirmation email
 */
export async function sendSubscriptionCanceledEmail(params: {
  artistEmail: string;
  artistName: string;
  planName?: string;
  endDate: string;
}) {
  const { artistEmail, artistName, planName, endDate } = params;
  const displayPlan = planName || 'your plan';
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      We're sorry to see you go. Your <strong>${displayPlan}</strong> subscription has been cancelled.
    </p>

    <div style="background: #fef2f2; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="color: #991b1b; margin: 0 0 8px 0; font-weight: 600;">What happens next:</p>
      <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        <li>You'll keep full access to all features until <strong>${endDate}</strong></li>
        <li>After that date, your account will revert to the Free plan</li>
        <li>Your profile and data will be preserved</li>
      </ul>
    </div>

    <p style="color: #374151; font-size: 15px; margin: 20px 0;">
      Changed your mind? You can reactivate anytime before ${endDate} and keep your subscription going.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Reactivate Subscription</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
      We'd love to have you back. If there's anything we could improve, please let us know at <a href="${baseUrl}/contact" style="color: #6D28D9;">our contact page</a>.
    </p>
  `;

  return sendEmail({
    to: artistEmail,
    subject: 'Your Ologywood Subscription Has Been Cancelled',
    html: subscriptionEmailWrapper(content, artistEmail),
  });
}

/**
 * Send subscription reactivation confirmation email
 */
export async function sendSubscriptionReactivatedEmail(params: {
  artistEmail: string;
  artistName: string;
  planName?: string;
  planPrice?: string;
  nextBillingDate?: string;
}) {
  const { artistEmail, artistName, planName, planPrice, nextBillingDate } = params;
  const displayPlan = planName || 'your plan';
  const displayPrice = planPrice || '';
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      Great news! Your <strong>${displayPlan}</strong> subscription has been reactivated.
    </p>

    <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <p style="color: #166534; margin: 0 0 8px 0; font-weight: 600;">Subscription Restored</p>
      <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        <li>Plan: <strong>${displayPlan}</strong>${displayPrice ? ` (${displayPrice})` : ''}</li>
        <li>Status: <strong>Active</strong></li>
        ${nextBillingDate ? `<li>Next billing date: <strong>${nextBillingDate}</strong></li>` : ''}
      </ul>
    </div>

    <p style="color: #374151; font-size: 15px; margin: 20px 0;">
      All your features are back and your profile is visible to venues again. Welcome back!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `Welcome Back! Your ${displayPlan} Is Active Again`,
    html: subscriptionEmailWrapper(content, artistEmail),
  });
}

/**
 * Send subscription paused confirmation email
 */
export async function sendSubscriptionPausedEmail(params: {
  artistEmail: string;
  artistName: string;
  planName?: string;
  resumeDate: string;
}) {
  const { artistEmail, artistName, planName, resumeDate } = params;
  const displayPlan = planName || 'your plan';
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      Your <strong>${displayPlan}</strong> subscription has been paused. You won't be charged during the pause period.
    </p>

    <div style="background: #fffbeb; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; margin: 0 0 8px 0; font-weight: 600;">What happens while paused:</p>
      <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        <li>Your profile stays visible but marked as <strong>Currently Inactive</strong></li>
        <li>You won't be charged until you resume</li>
        <li>All your data, followers, and bookings are preserved</li>
        <li>Paid features (email blasts, video, etc.) are paused</li>
        <li>Your subscription will <strong>auto-resume on ${resumeDate}</strong> (90-day max)</li>
      </ul>
    </div>

    <p style="color: #374151; font-size: 15px; margin: 20px 0;">
      Ready to get back to it? You can resume your subscription anytime from your dashboard.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Resume Subscription</a>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: 'Your Ologywood Subscription Has Been Paused',
    html: subscriptionEmailWrapper(content, artistEmail),
  });
}

/**
 * Send subscription resumed confirmation email
 */
export async function sendSubscriptionResumedEmail(params: {
  artistEmail: string;
  artistName: string;
  planName?: string;
  planPrice?: string;
  nextBillingDate?: string;
}) {
  const { artistEmail, artistName, planName, planPrice, nextBillingDate } = params;
  const displayPlan = planName || 'your plan';
  const displayPrice = planPrice || '';
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      Your <strong>${displayPlan}</strong> subscription has been resumed. Welcome back!
    </p>

    <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <p style="color: #166534; margin: 0 0 8px 0; font-weight: 600;">Subscription Active</p>
      <ul style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        <li>Plan: <strong>${displayPlan}</strong>${displayPrice ? ` (${displayPrice})` : ''}</li>
        <li>Status: <strong>Active</strong></li>
        ${nextBillingDate ? `<li>Next billing date: <strong>${nextBillingDate}</strong></li>` : ''}
        <li>All paid features are restored</li>
      </ul>
    </div>

    <p style="color: #374151; font-size: 15px; margin: 20px 0;">
      Your profile is fully active again and visible to venues. All your paid features are back.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `Your ${displayPlan} Is Back! Subscription Resumed`,
    html: subscriptionEmailWrapper(content, artistEmail),
  });
}

/**
 * Send notification to venue when artist responds to their review
 */
export async function sendReviewResponseEmail(params: {
  venueEmail: string;
  venueName: string;
  artistName: string;
  artistProfileId?: number;
  originalReview: string;
  artistResponse: string;
  rating: number;
}) {
  const { venueEmail, venueName, artistName, artistProfileId, originalReview, artistResponse, rating } = params;

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
      
      ${artistProfileId ? `<a href="${ENV.baseUrl}/artist/${artistProfileId}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Artist Profile
      </a>` : `<a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Dashboard
      </a>`}
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(venueEmail)}&type=reviews" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(venueEmail)}&type=reviews" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
 * Send artist review notification email (venue reviewed an artist)
 */
export async function sendArtistReviewNotificationEmail(params: {
  artistEmail: string;
  artistName: string;
  venueName: string;
  reviewText: string;
  rating: number;
  artistProfileUrl: string;
}) {
  const { artistEmail, artistName, venueName, reviewText, rating, artistProfileUrl } = params;
  const stars = '⭐'.repeat(rating);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8b5cf6;">New Review from a Venue</h2>
      <p>Hi ${artistName},</p>
      <p><strong>${venueName}</strong> has left a review for you on Ologywood.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Rating: ${stars}</strong></p>
        ${reviewText ? `<p style="margin: 0; font-style: italic; color: #6b7280;">"${reviewText}"</p>` : '<p style="margin: 0; color: #9ca3af;">No written review provided.</p>'}
      </div>
      
      <p>You can respond to this review to show your appreciation or address any concerns.</p>
      
      <a href="${artistProfileUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        View Review & Respond
      </a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated message from Ologywood. Please do not reply to this email.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(artistEmail)}&type=reviews" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `New Review from ${venueName}`,
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
      
      <a href="${ENV.baseUrl}/artist/${artistId}"
         style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        View ${artistName}'s Profile
      </a>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        You're receiving this because you saved ${artistName} to your favorites. 
        You can manage your saved artists in your dashboard.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(venueEmail)}&type=availability" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
    
    <a href="${ENV.baseUrl}/dashboard" 
       style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
      View Dashboard
    </a>
    
    <p>Best regards,<br>The Ologywood Team</p>
    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
      <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=reminders" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
      <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
    </p>
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
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(to)}&type=payments" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(to)}&type=payments" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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


/**
 * Send contract signed notification
 */
export async function sendContractSigned(params: {
  to: string;
  artistName: string;
  venueName: string;
  contractTitle: string;
}): Promise<boolean> {
  const { to, artistName, venueName, contractTitle } = params;
  
  const subject = `Contract Signed: ${contractTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">✓ Contract Signed</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Great news! Your contract has been successfully signed by both parties.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0;">Contract Details</h3>
          <p><strong>Contract:</strong> ${contractTitle}</p>
          <p><strong>Artist:</strong> ${artistName}</p>
          <p><strong>Venue:</strong> ${venueName}</p>
          <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Fully Executed</span></p>
          <p><strong>Date Signed:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #333; margin: 20px 0;">
          Both parties have agreed to the terms outlined in the contract. You can now proceed with event planning and coordination.
        </p>
        
        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0099cc;">
          <p style="margin: 0; color: #0066aa;"><strong>Next Steps:</strong></p>
          <ul style="margin: 10px 0 0 20px; color: #0066aa;">
            <li>Review final event details and logistics</li>
            <li>Confirm payment schedule and terms</li>
            <li>Coordinate technical and hospitality requirements</li>
            <li>Set up communication channels for event coordination</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          A copy of the signed contract has been stored securely in your account for future reference.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(to)}&type=contracts" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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

/**
 * Send contract for signature notification
 */
export async function sendContractForSignature(params: {
  to: string;
  recipientName: string;
  senderName: string;
  contractTitle: string;
  contractUrl: string;
}): Promise<boolean> {
  const { to, recipientName, senderName, contractTitle, contractUrl } = params;
  
  const subject = `Action Required: Sign Contract - ${contractTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Contract Awaiting Your Signature</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${recipientName},</p>
        
        <p>${senderName} has sent you a contract for review and signature.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0;">Contract Details</h3>
          <p><strong>Contract Title:</strong> ${contractTitle}</p>
          <p><strong>From:</strong> ${senderName}</p>
          <p><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">Awaiting Your Signature</span></p>
        </div>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${contractUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Review & Sign Contract
          </a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Please review the contract carefully before signing. Once both parties have signed, the contract becomes legally binding.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(to)}&type=contracts" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
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


/**
 * Send newsletter subscription confirmation email
 */
export async function sendNewsletterSubscriptionEmail(email: string): Promise<boolean> {
  const subject = 'Welcome to Ologywood Newsletter!';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎵 Welcome to Ologywood!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Thank you for subscribing to our newsletter!</p>
        
        <p style="color: #666; line-height: 1.6;">
          You'll now receive the latest tips, industry insights, and success stories from the live entertainment world delivered straight to your inbox.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin-top: 0; color: #8b5cf6;">What to Expect</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>🎯 Artist tips to maximize your bookings</li>
            <li>🎭 Venue guides for finding perfect talent</li>
            <li>📈 Industry trends and innovations</li>
            <li>⭐ Success stories from our community</li>
            <li>💡 Marketing and business strategies</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          We respect your inbox and promise to send only valuable content. You can unsubscribe anytime. <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #8b5cf6; text-decoration: none;">Click here to unsubscribe</a>.
        </p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${ENV.baseUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Visit Ologywood
          </a>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          This is an automated message from Ologywood. Please do not reply to this email.<br>
          © 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
  });
}


/**
 * Send email verification link to venue
 */
export async function sendVenueVerificationEmail(params: {
  venueEmail: string;
  venueName: string;
  verificationToken: string;
  verificationLink: string;
}): Promise<boolean> {
  const { venueEmail, venueName, verificationLink } = params;
  
  const subject = 'Verify Your Ologywood Venue Account';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎭 Verify Your Venue</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hello ${venueName},</p>
        
        <p style="color: #666; line-height: 1.6;">
          Thank you for registering your venue on Ologywood! To complete your account setup and start booking talented artists, please verify your email address.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Or copy and paste this link in your browser:<br>
          <code style="background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; word-break: break-all;">
            ${verificationLink}
          </code>
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin-top: 0; color: #8b5cf6;">Why Verify?</h3>
          <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Unlock full access to artist discovery and booking</li>
            <li>Receive booking requests and messages from artists</li>
            <li>Build trust with verified artist badge</li>
            <li>Access analytics and booking insights</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          This is an automated message from Ologywood. Please do not reply to this email.<br>
          © 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: venueEmail,
    subject,
    html,
  });
}

/**
 * Send verification confirmation email to venue
 */
export async function sendVenueVerificationConfirmationEmail(params: {
  venueEmail: string;
  venueName: string;
}): Promise<boolean> {
  const { venueEmail, venueName } = params;
  
  const subject = 'Email Verified - Welcome to Ologywood!';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">✓ Email Verified!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333;">Hello ${venueName},</p>
        
        <p style="color: #666; line-height: 1.6;">
          Congratulations! Your email has been verified and your venue account is now fully active. You can now browse artists, send booking requests, and manage your venue profile.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #10b981;">Next Steps</h3>
          <ol style="color: #666; line-height: 1.8;">
            <li>Complete your venue profile with photos and details</li>
            <li>Browse and discover talented artists</li>
            <li>Send booking requests to artists you like</li>
            <li>Manage your bookings and calendar</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions or need assistance, our support team is here to help. Visit our <a href="${ENV.baseUrl}/help" style="color: #8b5cf6; text-decoration: none;">Help Center</a> for more information.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          This is an automated message from Ologywood. Please do not reply to this email.<br>
          © 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: venueEmail,
    subject,
    html,
  });
}


/**
 * Send client booking confirmation email to the client/fan who booked
 */
export async function sendClientBookingConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  artistName: string;
  artistId: number;
  bookingId: number;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venueName: string;
  venueAddress?: string;
  totalFee?: number;
  eventDetails?: string;
}): Promise<boolean> {
  const {
    clientEmail, clientName, artistName, artistId, bookingId,
    eventType, eventDate, eventTime, venueName, venueAddress, totalFee, eventDetails,
  } = params;

  const baseUrl = ENV.baseUrl;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(clientEmail)}&type=booking`;
  const eventTypeLabel = eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Request Sent!</h1>
      </div>
      <div style="padding: 30px 24px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${clientName},</p>
        
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
          Your booking request has been sent to <strong>${artistName}</strong>. You'll be notified when the artist responds.
        </p>

        <div style="background: #f5f3ff; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px; width: 120px;">Reference</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">#${bookingId}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Artist</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">${artistName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Event Type</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventTypeLabel}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Date</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventDate}</td>
            </tr>
            ${eventTime ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Time</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventTime}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Venue</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${venueName}</td>
            </tr>
            ${venueAddress ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Address</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${venueAddress}</td>
            </tr>` : ''}
            ${totalFee ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Offered Fee</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">$${totalFee.toLocaleString()}</td>
            </tr>` : ''}
          </table>
          ${eventDetails ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd5f5;">
              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 13px;">Event Details</p>
              <p style="color: #374151; margin: 0; font-size: 14px;">${eventDetails}</p>
            </div>
          ` : ''}
        </div>

        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            <strong>What happens next?</strong> The artist will review your request and respond. You'll receive an email and in-app notification when they accept or decline.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/my-bookings" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View My Bookings</a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          Need to make changes? <a href="${baseUrl}/messages?bookingId=${bookingId}" style="color: #6D28D9; text-decoration: none;">Message the artist</a> directly through Ologywood.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
          You're receiving this email because you submitted a booking request on Ologywood.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Unsubscribe</a> | 
          <a href="${baseUrl}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
          <a href="${baseUrl}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          &copy; 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Booking Request Sent — ${artistName} for ${eventTypeLabel} on ${eventDate}`,
    html,
  });
}

/**
 * Send notification to artist when they receive a client booking request
 * (Enhanced version of sendBookingRequestEmail with client booking details)
 */
export async function sendClientBookingNotificationToArtist(params: {
  artistEmail: string;
  artistName: string;
  clientName: string;
  clientEmail: string;
  bookingId: number;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venueName: string;
  venueAddress?: string;
  totalFee?: number;
  eventDetails?: string;
}): Promise<boolean> {
  const {
    artistEmail, artistName, clientName, clientEmail: clientEmailAddr, bookingId,
    eventType, eventDate, eventTime, venueName, venueAddress, totalFee, eventDetails,
  } = params;

  const baseUrl = ENV.baseUrl;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(artistEmail)}&type=booking`;
  const eventTypeLabel = eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Booking Request!</h1>
      </div>
      <div style="padding: 30px 24px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${artistName},</p>
        
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
          You have a new booking request from <strong>${clientName}</strong> for a <strong>${eventTypeLabel}</strong>.
        </p>

        <div style="background: #f5f3ff; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px; width: 120px;">Reference</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">#${bookingId}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Client</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">${clientName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Email</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${clientEmailAddr}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Event Type</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventTypeLabel}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Date</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventDate}</td>
            </tr>
            ${eventTime ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Time</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${eventTime}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Venue</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${venueName}</td>
            </tr>
            ${venueAddress ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Address</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px;">${venueAddress}</td>
            </tr>` : ''}
            ${totalFee ? `<tr>
              <td style="color: #6b7280; padding: 6px 0; font-size: 14px;">Offered Fee</td>
              <td style="color: #1f2937; padding: 6px 0; font-size: 14px; font-weight: 600;">$${totalFee.toLocaleString()}</td>
            </tr>` : ''}
          </table>
          ${eventDetails ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd5f5;">
              <p style="color: #6b7280; margin: 0 0 4px 0; font-size: 13px;">Event Details</p>
              <p style="color: #374151; margin: 0; font-size: 14px;">${eventDetails}</p>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Review & Respond</a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          Log in to your dashboard to accept or decline this booking request.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
          You're receiving this email because you have an Ologywood artist account.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Unsubscribe</a> | 
          <a href="${baseUrl}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | 
          <a href="${baseUrl}/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          &copy; 2026 Ologywood. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: artistEmail,
    subject: `New Booking Request: ${eventTypeLabel} on ${eventDate} — ${clientName}`,
    html,
  });
}


/**
 * Send email notification when a dispute status changes
 * Notifies the reporter when their dispute moves to under_review, resolved, or dismissed
 */
export async function sendDisputeStatusUpdate(params: {
  reporterEmail: string;
  reporterName: string;
  respondentName: string;
  disputeType: string;
  bookingEventDate: string;
  newStatus: 'under_review' | 'resolved' | 'dismissed';
  resolution?: string;
  disputeId: number;
  recipientRole?: 'reporter' | 'respondent';
  recipientEmail?: string;
  recipientName?: string;
}): Promise<boolean> {
  const {
    reporterEmail,
    reporterName,
    respondentName,
    disputeType,
    bookingEventDate,
    newStatus,
    resolution,
    disputeId,
    recipientRole = 'reporter',
    recipientEmail,
    recipientName,
  } = params;

  // Determine who this email is going to
  const toEmail = recipientRole === 'respondent' && recipientEmail ? recipientEmail : reporterEmail;
  const toName = recipientRole === 'respondent' && recipientName ? recipientName : reporterName;
  const otherPartyName = recipientRole === 'respondent' ? reporterName : respondentName;
  const isRespondent = recipientRole === 'respondent';

  const typeLabels: Record<string, string> = {
    payment_issue: 'Payment Issue',
    no_show: 'No Show',
    contract_violation: 'Contract Violation',
    quality_issue: 'Quality Issue',
    cancellation_dispute: 'Cancellation Dispute',
    harassment: 'Harassment',
    other: 'Other',
  };

  const statusConfig: Record<string, { label: string; color: string; icon: string; description: string }> = {
    under_review: {
      label: 'Under Review',
      color: '#f59e0b',
      icon: '🔍',
      description: 'Our team is actively reviewing your dispute. We will carefully examine all evidence and details provided by both parties.',
    },
    resolved: {
      label: 'Resolved',
      color: '#10b981',
      icon: '✓',
      description: 'Your dispute has been reviewed and resolved. Please see the resolution details below.',
    },
    dismissed: {
      label: 'Dismissed',
      color: '#6b7280',
      icon: '—',
      description: 'After careful review, our team has determined that this dispute does not meet the criteria for further action.',
    },
  };

  const config = statusConfig[newStatus];
  const typeLabel = typeLabels[disputeType] || disputeType;

  // Customize descriptions for respondent
  const respondentStatusConfig: Record<string, { description: string }> = {
    under_review: {
      description: 'A dispute has been filed regarding a booking you were involved in. Our team is actively reviewing the matter.',
    },
    resolved: {
      description: 'A dispute regarding a booking you were involved in has been reviewed and resolved. Please see the resolution details below.',
    },
    dismissed: {
      description: 'A dispute that was filed regarding a booking you were involved in has been dismissed after careful review.',
    },
  };

  const description = isRespondent ? respondentStatusConfig[newStatus].description : config.description;

  const subject = isRespondent
    ? `Dispute Notice: ${config.label} — ${typeLabel} (Booking on ${bookingEventDate})`
    : `Dispute Update: ${config.label} — ${typeLabel} (Booking on ${bookingEventDate})`;

  const resolutionBlock = resolution
    ? `
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
        <h3 style="margin-top: 0; color: #166534;">Resolution</h3>
        <p style="color: #333; margin: 0;">${resolution}</p>
      </div>
    `
    : '';

  const nextStepsMap: Record<string, string> = {
    under_review: `
      <ul style="margin: 10px 0 0 20px; color: #92400e;">
        <li>No action is required from you at this time</li>
        <li>We may reach out if we need additional information</li>
        <li>You will be notified when a decision is made</li>
        <li>Typical review time is 3–5 business days</li>
      </ul>
    `,
    resolved: `
      <ul style="margin: 10px 0 0 20px; color: #065f46;">
        <li>Review the resolution details above</li>
        <li>Any applicable refunds or credits will be processed separately</li>
        <li>If you have questions about the resolution, contact our support team</li>
      </ul>
    `,
    dismissed: `
      <ul style="margin: 10px 0 0 20px; color: #374151;">
        <li>Review the explanation provided above</li>
        <li>If you believe this was in error, you may contact our support team</li>
        <li>You can still leave a review for the booking on the platform</li>
      </ul>
    `,
  };

  const nextStepsBgColor: Record<string, string> = {
    under_review: '#fffbeb',
    resolved: '#ecfdf5',
    dismissed: '#f3f4f6',
  };

  const nextStepsTextColor: Record<string, string> = {
    under_review: '#92400e',
    resolved: '#065f46',
    dismissed: '#374151',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, ${config.color} 0%, ${newStatus === 'resolved' ? '#059669' : newStatus === 'under_review' ? '#d97706' : '#4b5563'} 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${config.icon} Dispute ${config.label}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${toName},</p>
        <p>${description}</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
          <h3 style="margin-top: 0;">Dispute Details</h3>
          <p><strong>Dispute ID:</strong> #${disputeId}</p>
          <p><strong>Type:</strong> ${typeLabel}</p>
          <p><strong>${isRespondent ? 'Filed By' : 'Against'}:</strong> ${otherPartyName}</p>
          <p><strong>Event Date:</strong> ${bookingEventDate}</p>
          <p><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold;">${config.label}</span></p>
        </div>
        
        ${resolutionBlock}
        
        <div style="background: ${nextStepsBgColor[newStatus]}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.color};">
          <p style="margin: 0; color: ${nextStepsTextColor[newStatus]};"><strong>Next Steps:</strong></p>
          ${nextStepsMap[newStatus]}
        </div>
        
        <a href="${ENV.baseUrl}/disputes" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View My Disputes
        </a>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you need further assistance, please contact our support team.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}&type=disputes" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/settings" style="color: #8b5cf6; text-decoration: none;">Manage Preferences</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
  });
}


/**
 * Send email notification when a dispute is first filed.
 * Sends to both the reporter (confirmation) and respondent (notice).
 */
export async function sendDisputeFiled(params: {
  reporterEmail: string;
  reporterName: string;
  respondentEmail: string;
  respondentName: string;
  disputeType: string;
  bookingEventDate: string;
  disputeId: number;
  description: string;
}): Promise<void> {
  const {
    reporterEmail,
    reporterName,
    respondentEmail,
    respondentName,
    disputeType,
    bookingEventDate,
    disputeId,
    description: disputeDescription,
  } = params;

  const typeLabels: Record<string, string> = {
    payment_issue: 'Payment Issue',
    no_show: 'No Show',
    contract_violation: 'Contract Violation',
    quality_issue: 'Quality Issue',
    cancellation_dispute: 'Cancellation Dispute',
    harassment: 'Harassment',
    other: 'Other',
  };

  const typeLabel = typeLabels[disputeType] || disputeType;

  const footerLinks = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0;">
        <a href="${ENV.baseUrl}/settings" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a> · 
        <a href="${ENV.baseUrl}/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> · 
        <a href="${ENV.baseUrl}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
      </p>
      <p style="margin: 5px 0 0;">© ${new Date().getFullYear()} Ologywood. All rights reserved.</p>
    </div>
  `;

  // --- Reporter confirmation email ---
  const reporterSubject = `Dispute Received: ${typeLabel} — Booking on ${bookingEventDate}`;
  const reporterHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Ologywood</h1>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; margin-bottom: 8px;">📋</div>
        <h2 style="margin: 0; color: #1e40af; font-size: 20px;">Dispute Received</h2>
        <p style="color: #3b82f6; margin: 8px 0 0; font-size: 14px;">We've received your dispute and will review it shortly.</p>
      </div>

      <p style="color: #333; font-size: 15px;">Hi ${reporterName},</p>
      <p style="color: #333; font-size: 15px;">Thank you for submitting your dispute. Our team will carefully review the details and get back to you within 3–5 business days.</p>

      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Dispute ID</td><td style="padding: 6px 0; color: #111;">#${disputeId}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Type</td><td style="padding: 6px 0; color: #111;">${typeLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Event Date</td><td style="padding: 6px 0; color: #111;">${bookingEventDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Against</td><td style="padding: 6px 0; color: #111;">${respondentName}</td></tr>
        </table>
      </div>

      <div style="background: #fefce8; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 8px; color: #92400e; font-size: 14px;">What Happens Next</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px;">
          <li>Our team will review all evidence and details</li>
          <li>We may contact you or the other party for more information</li>
          <li>You'll receive an email when the status changes</li>
          <li>You can track your dispute at any time from <a href="${ENV.baseUrl}/disputes" style="color: #7c3aed;">My Disputes</a></li>
        </ul>
      </div>

      ${footerLinks}
    </div>
  `;

  // --- Respondent notice email ---
  const respondentSubject = `Dispute Notice: ${typeLabel} — Booking on ${bookingEventDate}`;
  const respondentHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0; font-size: 24px;">Ologywood</h1>
      </div>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 36px; margin-bottom: 8px;">⚠️</div>
        <h2 style="margin: 0; color: #991b1b; font-size: 20px;">Dispute Filed</h2>
        <p style="color: #dc2626; margin: 8px 0 0; font-size: 14px;">A dispute has been filed regarding one of your bookings.</p>
      </div>

      <p style="color: #333; font-size: 15px;">Hi ${respondentName},</p>
      <p style="color: #333; font-size: 15px;">We're writing to let you know that a dispute has been filed regarding a booking you were involved in. Our team will review the matter carefully and fairly.</p>

      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Dispute ID</td><td style="padding: 6px 0; color: #111;">#${disputeId}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Type</td><td style="padding: 6px 0; color: #111;">${typeLabel}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Event Date</td><td style="padding: 6px 0; color: #111;">${bookingEventDate}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">Filed By</td><td style="padding: 6px 0; color: #111;">${reporterName}</td></tr>
        </table>
      </div>

      <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">What You Should Know</h4>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 13px;">
          <li>No action is required from you at this time</li>
          <li>Our team will review all evidence before making a decision</li>
          <li>We may reach out to you for your side of the story</li>
          <li>You'll receive an email when the status is updated</li>
          <li>You can view dispute details from <a href="${ENV.baseUrl}/disputes" style="color: #7c3aed;">My Disputes</a></li>
        </ul>
      </div>

      ${footerLinks}
    </div>
  `;

  // Send both emails (best-effort, don't block the dispute creation)
  try {
    await sendEmail({ to: reporterEmail, subject: reporterSubject, html: reporterHtml });
    console.log(`[DisputeFiled] Reporter confirmation sent to ${reporterEmail} for dispute #${disputeId}`);
  } catch (err) {
    console.error(`[DisputeFiled] Failed to send reporter confirmation for dispute #${disputeId}:`, err);
  }

  try {
    await sendEmail({ to: respondentEmail, subject: respondentSubject, html: respondentHtml });
    console.log(`[DisputeFiled] Respondent notice sent to ${respondentEmail} for dispute #${disputeId}`);
  } catch (err) {
    console.error(`[DisputeFiled] Failed to send respondent notice for dispute #${disputeId}:`, err);
  }
}


// ============= SETTLEMENT REMINDER EMAILS =============

export async function sendSettlementReminderEmail(params: {
  venueEmail: string;
  venueName: string;
  artistName: string;
  eventDate: string;
  bookingId: number;
  paymentTermsType: string;
  doorSplitArtistPercent?: number;
  guaranteeAmount?: string;
}): Promise<boolean> {
  const { venueEmail, venueName, artistName, eventDate, bookingId, paymentTermsType, doorSplitArtistPercent, guaranteeAmount } = params;

  const eventDateStr = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let termsDescription = '';
  if (paymentTermsType === 'door_split') {
    termsDescription = `<p><strong>Terms:</strong> Door Split — Artist receives ${doorSplitArtistPercent || 80}% of door revenue</p>`;
  } else if (paymentTermsType === 'guarantee_vs_percentage') {
    termsDescription = `<p><strong>Terms:</strong> Guarantee vs. Percentage — Minimum $${guaranteeAmount || '0'} OR ${doorSplitArtistPercent || 80}% of door (whichever is higher)</p>`;
  } else {
    termsDescription = `<p><strong>Terms:</strong> Flat Guarantee</p>`;
  }

  const subject = `Settlement Reminder: ${artistName} show on ${eventDateStr}`;

  const html = `
    <h2>Time to Settle Up</h2>
    
    <p>Hello ${venueName},</p>
    
    <p>The show with <strong>${artistName}</strong> on ${eventDateStr} is now complete. It's time to settle the payment based on your agreed terms.</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Show Details</h3>
      <p><strong>Artist:</strong> ${artistName}</p>
      <p><strong>Date:</strong> ${eventDateStr}</p>
      ${termsDescription}
    </div>
    
    <p>Please log in to your dashboard to complete the settlement form. You'll need to enter the door revenue and attendance so the artist payout can be calculated.</p>
    
    <a href="${ENV.baseUrl}/bookings/${bookingId}" 
       style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
      Complete Settlement
    </a>
    
    <p>Settling promptly builds trust and keeps artists coming back to your venue.</p>
    
    <p>Best regards,<br>The Ologywood Team</p>
    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
      <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(venueEmail)}&type=reminders" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
      <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
    </p>
  `;

  return sendEmail({ to: venueEmail, subject, html });
}


// ============= PERFORMANCE REQUEST EMAILS =============

/**
 * Send email to venue when an artist requests to perform
 */
export async function sendPerformanceRequestEmail(params: {
  venueEmail: string;
  venueName: string;
  artistName: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  message?: string;
  paymentTermsType?: string;
  proposedFee?: number;
}): Promise<boolean> {
  const { venueEmail, venueName, artistName, eventName, eventDate, eventTime, message, paymentTermsType, proposedFee } = params;

  const eventDateStr = new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const termsLabels: Record<string, string> = {
    flat_guarantee: 'Flat Guarantee',
    door_split: 'Door Split %',
    guarantee_vs_percentage: 'Guarantee vs. Percentage',
  };

  const termsLabel = paymentTermsType ? termsLabels[paymentTermsType] || paymentTermsType : 'Not specified';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">🎤 Performance Request</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">An artist wants to perform at your venue</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${venueName},</p>
        <p><strong>${artistName}</strong> has submitted a request to perform at your venue.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <h3 style="margin-top: 0; color: #6d28d9;">Request Details</h3>
          <p><strong>Show Name:</strong> ${eventName}</p>
          <p><strong>Preferred Date:</strong> ${eventDateStr}</p>
          ${eventTime ? `<p><strong>Time:</strong> ${eventTime}</p>` : ''}
          <p><strong>Payment Terms:</strong> ${termsLabel}</p>
          ${proposedFee ? `<p><strong>Proposed Fee:</strong> $${proposedFee.toLocaleString()}</p>` : ''}
        </div>
        
        ${message ? `
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #374151;">Message from Artist:</h4>
          <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}
        
        <p>Log in to your dashboard to review this request and respond to the artist.</p>
        
        <a href="${ENV.baseUrl}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Review Request
        </a>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(venueEmail)}&type=booking" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
          <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: venueEmail,
    subject: `Performance Request from ${artistName} — ${eventName} on ${eventDateStr}`,
    html,
  });
}


/**
 * Send email notification when a rider revision is proposed
 */
export async function sendRiderRevisionProposedEmail(params: {
  recipientEmail: string;
  recipientName: string;
  proposerName: string;
  bookingId: number;
  fieldCount: number;
  changeLabels: string[];
}) {
  const { recipientEmail, recipientName, proposerName, bookingId, fieldCount, changeLabels } = params;
  const changesHtml = changeLabels.map(label => `<li>${label}</li>`).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Rider Revision Proposed</h2>
      
      <p>Hi ${recipientName},</p>
      
      <p><strong>${proposerName}</strong> has proposed ${fieldCount} change${fieldCount > 1 ? 's' : ''} to the rider contract for Booking #${bookingId}:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <ul style="margin: 0; padding-left: 20px;">
          ${changesHtml}
        </ul>
      </div>
      
      <p>Please review and approve or reject the proposed changes.</p>
      
      <a href="${ENV.baseUrl}/booking/${bookingId}"
         style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Review Changes
      </a>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=rider" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Rider Revision Proposed by ${proposerName} — Booking #${bookingId}`,
    html,
  });
}

/**
 * Send email notification when a rider revision is approved or rejected
 */
export async function sendRiderRevisionDecisionEmail(params: {
  recipientEmail: string;
  recipientName: string;
  deciderName: string;
  bookingId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}) {
  const { recipientEmail, recipientName, deciderName, bookingId, decision, reason } = params;
  const isApproved = decision === 'approved';
  const statusColor = isApproved ? '#10b981' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const emoji = isApproved ? '✓' : '✗';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Rider Revision ${statusText}</h2>
      
      <p>Hi ${recipientName},</p>
      
      <p><strong>${deciderName}</strong> has <span style="color: ${statusColor}; font-weight: bold;">${emoji} ${decision}</span> your proposed rider changes for Booking #${bookingId}.</p>
      
      ${reason ? `
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">Reason:</p>
        <p style="margin: 5px 0 0 0; color: #7f1d1d;">${reason}</p>
      </div>
      ` : ''}
      
      <p>${isApproved ? 'The changes have been applied to the rider contract.' : 'You can propose new changes or discuss further with the other party.'}</p>
      
      <a href="${ENV.baseUrl}/booking/${bookingId}"
         style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        View Booking
      </a>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        <a href="${ENV.baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=rider" style="color: #8b5cf6; text-decoration: none;">Unsubscribe</a> | 
        <a href="${ENV.baseUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `Rider Revision ${statusText} by ${deciderName} — Booking #${bookingId}`,
    html,
  });
}
