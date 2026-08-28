/**
 * Master Email Template System for Ologywood
 * Consistent branding across all email communications
 */

import { EMAIL_LOGO_ALT, EMAIL_LOGO_URL } from '../../shared/emailBranding';

export interface EmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  preheader?: string;
  mainContent: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
  unsubscribeToken?: string; // For CAN-SPAM/GDPR compliance
  emailType: 'booking-confirmation' | 'booking-request' | 'booking-cancellation' | 'payment-confirmation' | 'welcome' | 'password-reset' | 'status-update';
}

/**
 * Generate HTML email with Ologywood branding
 */
export function generateEmailHTML(data: EmailTemplateData): string {
  const brandColor = '#7c3aed'; // Purple
  const accentColor = '#06b6d4'; // Cyan
  const darkBg = '#1f2937'; // Dark gray
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f3f4f6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .logo {
            height: 50px;
            width: auto;
            margin-bottom: 15px;
        }
        .header-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .header-tagline {
            font-size: 14px;
            opacity: 0.9;
            letter-spacing: 2px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 15px;
            color: #4b5563;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .content p {
            margin-bottom: 15px;
        }
        .booking-details {
            background-color: #f9fafb;
            border-left: 4px solid ${brandColor};
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
        }
        .detail-value {
            color: #1f2937;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 25px 0;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
        }
        .email-footer {
            background-color: ${darkBg};
            color: #d1d5db;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
        }
        .footer-logo {
            height: 30px;
            width: auto;
            margin-bottom: 15px;
            opacity: 0.8;
        }
        .footer-links {
            margin: 15px 0;
        }
        .footer-links a {
            color: ${accentColor};
            text-decoration: none;
            margin: 0 10px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }

        .footer-copyright {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.7;
        }
        .highlight {
            color: ${brandColor};
            font-weight: 600;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #92400e;
        }
        .success {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #065f46;
        }
        @media (max-width: 600px) {
            .email-body {
                padding: 20px;
            }
            .booking-details {
                padding: 15px;
            }
            .cta-button {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <img src="${EMAIL_LOGO_URL}" alt="${EMAIL_LOGO_ALT}" class="logo">
            <div class="header-title">Ologywood</div>
            <div class="header-tagline">BOOK • CONNECT • PERFORM</div>
        </div>

        <!-- Body -->
        <div class="email-body">
            <div class="greeting">Hello ${data.recipientName},</div>
            
            <div class="content">
                ${data.mainContent}
            </div>

            ${data.ctaText && data.ctaUrl ? `
                <a href="${data.ctaUrl}" class="cta-button">${data.ctaText}</a>
            ` : ''}
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <img src="${EMAIL_LOGO_URL}" alt="${EMAIL_LOGO_ALT}" class="footer-logo">
            
            <div class="footer-links">
                <a href="https://www.ologywood.com">Home</a>
                <a href="https://www.ologywood.com/browse">Browse Artists</a>
                <a href="https://www.ologywood.com/contact">Contact</a>
            </div>

            <div class="footer-copyright">
                © 2026 Ologywood. All rights reserved.<br>
                <a href="https://www.ologywood.com/privacy-policy" style="color: ${accentColor};">Privacy Policy</a> | 
                <a href="https://www.ologywood.com/terms-of-service" style="color: ${accentColor};">Terms of Service</a>
            </div>

            <!-- Unsubscribe Link for CAN-SPAM/GDPR Compliance -->
            ${data.unsubscribeToken ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 12px; color: #999;"><a href="https://www.ologywood.com/api/email/unsubscribe?token=${data.unsubscribeToken}" style="color: ${accentColor}; text-decoration: none;">Unsubscribe from these emails</a></div>` : ''}

            ${data.footerText ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">${data.footerText}</div>` : ''}
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Email Template Builders for specific email types
 */

export function buildBookingConfirmationEmail(
  artistName: string,
  venueName: string,
  eventDate: string,
  eventTime: string,
  rate: number,
  bookingId: string
): EmailTemplateData {
  return {
    recipientName: artistName,
    recipientEmail: '', // Will be set by sender
    subject: `🎉 Booking Confirmed with ${venueName}`,
    preheader: `Your booking for ${eventDate} is confirmed!`,
    mainContent: `
      <p>Great news! Your booking has been confirmed.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Venue</span>
          <span class="detail-value">${venueName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date</span>
          <span class="detail-value">${eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Time</span>
          <span class="detail-value">${eventTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Rate</span>
          <span class="detail-value">$${rate.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Booking ID</span>
          <span class="detail-value">#${bookingId}</span>
        </div>
      </div>

      <div class="success">
        ✓ Your booking is confirmed. Check your dashboard for more details and contract information.
      </div>

      <p>Please review the contract and confirm your availability. If you have any questions, contact the venue directly through your Ologywood dashboard.</p>
    `,
    ctaText: 'View Booking Details',
    ctaUrl: 'https://www.ologywood.com/dashboard/bookings',
    emailType: 'booking-confirmation'
  };
}

export function buildBookingRequestEmail(
  artistName: string,
  venueName: string,
  eventDate: string,
  eventTime: string,
  rate: number,
  requestId: string
): EmailTemplateData {
  return {
    recipientName: artistName,
    recipientEmail: '', // Will be set by sender
    subject: `📅 New Booking Request from ${venueName}`,
    preheader: `${venueName} wants to book you for ${eventDate}`,
    mainContent: `
      <p><span class="highlight">${venueName}</span> is interested in booking you for their event!</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Venue</span>
          <span class="detail-value">${venueName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Date</span>
          <span class="detail-value">${eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event Time</span>
          <span class="detail-value">${eventTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Offered Rate</span>
          <span class="detail-value">$${rate.toFixed(2)}</span>
        </div>
      </div>

      <p>Review the booking request and accept or decline. You can also negotiate the rate or discuss details directly with the venue.</p>
    `,
    ctaText: 'Review Request',
    ctaUrl: 'https://www.ologywood.com/dashboard/requests',
    emailType: 'booking-request'
  };
}

export function buildPaymentConfirmationEmail(
  recipientName: string,
  amount: number,
  transactionId: string,
  eventDetails: string
): EmailTemplateData {
  return {
    recipientName,
    recipientEmail: '', // Will be set by sender
    subject: `💳 Payment Received - $${amount.toFixed(2)}`,
    preheader: `Payment of $${amount.toFixed(2)} has been processed`,
    mainContent: `
      <p>Thank you! Your payment has been successfully processed.</p>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">$${amount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Event</span>
          <span class="detail-value">${eventDetails}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <p>A receipt has been sent to your email. You can view your payment history anytime in your Ologywood dashboard.</p>
    `,
    ctaText: 'View Receipt',
    ctaUrl: 'https://www.ologywood.com/dashboard/payments',
    emailType: 'payment-confirmation'
  };
}

export function buildWelcomeEmail(
  recipientName: string,
  userType: 'artist' | 'venue'
): EmailTemplateData {
  const typeText = userType === 'artist' ? 'artist' : 'venue owner';
  const actionText = userType === 'artist' ? 'Create your profile' : 'Set up your venue';
  const actionUrl = userType === 'artist' ? 'https://www.ologywood.com/artist-onboarding' : 'https://www.ologywood.com/venue-setup';

  return {
    recipientName,
    recipientEmail: '', // Will be set by sender
    subject: `Welcome to Ologywood, ${recipientName}! 🎵`,
    preheader: 'Get started with Ologywood today',
    mainContent: `
      <p>Welcome to <span class="highlight">Ologywood</span> – the premier platform for booking talented artists and managing events!</p>

      <p>We're excited to have you join our community of ${userType === 'artist' ? 'independent artists' : 'venues and event organizers'}.</p>

      <div class="success">
        ✓ Your account has been created and is ready to use.
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul style="margin-left: 20px; color: #4b5563;">
        <li>Complete your profile</li>
        <li>Add your ${userType === 'artist' ? 'portfolio and availability' : 'venue details and requirements'}</li>
        <li>Start ${userType === 'artist' ? 'receiving booking requests' : 'discovering talented artists'}</li>
      </ul>

      <p>If you have any questions, check out our <a href="https://www.ologywood.com/faq" style="color: #7c3aed; text-decoration: none;">FAQ</a> or contact our support team.</p>
    `,
    ctaText: actionText,
    ctaUrl: actionUrl,
    emailType: 'welcome'
  };
}

export function buildPasswordResetEmail(
  recipientName: string,
  resetLink: string
): EmailTemplateData {
  return {
    recipientName,
    recipientEmail: '', // Will be set by sender
    subject: 'Reset Your Ologywood Password',
    preheader: 'Password reset requested',
    mainContent: `
      <p>We received a request to reset your password. Click the button below to create a new password.</p>

      <div class="warning">
        ⚠️ This link will expire in 24 hours for security reasons.
      </div>

      <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
    `,
    ctaText: 'Reset Password',
    ctaUrl: resetLink,
    emailType: 'password-reset'
  };
}

export function buildStatusUpdateEmail(
  recipientName: string,
  updateType: string,
  details: string
): EmailTemplateData {
  return {
    recipientName,
    recipientEmail: '', // Will be set by sender
    subject: `📢 ${updateType} Update`,
    preheader: `Important update: ${updateType}`,
    mainContent: `
      <p>${details}</p>
      <p>Log in to your Ologywood dashboard for more information.</p>
    `,
    ctaText: 'View Dashboard',
    ctaUrl: 'https://www.ologywood.com/dashboard',
    emailType: 'status-update'
  };
}
