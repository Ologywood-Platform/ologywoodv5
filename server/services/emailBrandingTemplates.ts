/**
 * Ologywood Email Branding Templates
 * Provides consistent, branded email templates with the approved neon OW logo and purple-to-cyan gradient
 * Color scheme: Purple (#6D28D9) to Cyan (#00D9FF)
 */

import { getEmailLogoImage } from '../../shared/emailBranding';

export interface BrandedEmailTemplate {
  subject: string;
  html: string;
}

/**
 * Email header with the approved neon OW logo and branding
 */
function getEmailHeader(): string {
  return `
    <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
      <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
    </div>
  `;
}

/**
 * Email footer with branding and unsubscribe
 */
function getEmailFooter(unsubscribeUrl?: string): string {
  return `
    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
        © 2026 Ologywood. All rights reserved.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: #6D28D9; text-decoration: none;">Manage preferences</a> | ` : ''}
        <a href="https://www.ologywood.com/privacy" style="color: #6D28D9; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  `;
}

/**
 * Booking Confirmation Email
 */
export function getBookingConfirmationTemplate(params: {
  recipientName: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  bookingId: number;
  dashboardUrl?: string;
}): BrandedEmailTemplate {
  const { recipientName, artistName, venueName, eventDate, eventTime, eventLocation, bookingId, dashboardUrl = 'https://www.ologywood.com/bookings' } = params;

  return {
    subject: `🎉 Booking Confirmed: ${artistName} at ${venueName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Booking Confirmed! 🎵</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Your booking has been confirmed! Here are the details:
          </p>
          
          <div style="background: linear-gradient(135deg, #f3e8ff 0%, #cffafe 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Artist:</strong> <span style="color: #4b5563;">${artistName}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Venue:</strong> <span style="color: #4b5563;">${venueName}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Date:</strong> <span style="color: #4b5563;">${eventDate}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Time:</strong> <span style="color: #4b5563;">${eventTime}</span></p>
            <p style="margin: 0 0 0 0;"><strong style="color: #1f2937;">Location:</strong> <span style="color: #4b5563;">${eventLocation}</span></p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Booking ID: <strong>#${bookingId}</strong>
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Booking Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            If you have any questions about your booking, please don't hesitate to reach out to our support team.
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}

/**
 * New Opportunity Email
 */
export function getNewOpportunityTemplate(params: {
  recipientName: string;
  venueName: string;
  eventType: string;
  eventDate: string;
  budget: string;
  location: string;
  opportunityUrl?: string;
}): BrandedEmailTemplate {
  const { recipientName, venueName, eventType, eventDate, budget, location, opportunityUrl = 'https://www.ologywood.com/browse' } = params;

  return {
    subject: `✨ New Opportunity: ${eventType} at ${venueName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">New Booking Opportunity! 🎤</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            A venue is looking for talent! Here are the details:
          </p>
          
          <div style="background: linear-gradient(135deg, #f3e8ff 0%, #cffafe 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00D9FF;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Venue:</strong> <span style="color: #4b5563;">${venueName}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Event Type:</strong> <span style="color: #4b5563;">${eventType}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Date:</strong> <span style="color: #4b5563;">${eventDate}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Budget:</strong> <span style="color: #4b5563;">${budget}</span></p>
            <p style="margin: 0 0 0 0;"><strong style="color: #1f2937;">Location:</strong> <span style="color: #4b5563;">${location}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${opportunityUrl}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Opportunity
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Don't miss this chance! Respond quickly to increase your chances of being selected.
          </p>

        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}

/**
 * Password Reset Email
 */
export function getPasswordResetTemplate(params: {
  recipientName: string;
  resetLink: string;
  expiresIn: string;
}): BrandedEmailTemplate {
  const { recipientName, resetLink, expiresIn } = params;
  return {
    subject: '🔐 Reset Your Ologywood Password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Password Reset</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset your Ologywood password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⏰ This link expires in ${expiresIn}.</strong> If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            For security reasons, never share this link with anyone.
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}

/**
 * Welcome Email for New Users
 */
export function getWelcomeTemplate(params: {
  recipientName: string;
  userType: 'artist' | 'venue';
  onboardingUrl?: string;
}): BrandedEmailTemplate {
  const { recipientName, userType, onboardingUrl = 'https://www.ologywood.com/dashboard' } = params;
  const welcomeMessage = userType === 'artist' 
    ? 'Welcome to Ologywood! Start booking gigs and grow your career.'
    : 'Welcome to Ologywood! Find talented artists for your events.';

  return {
    subject: '🎉 Welcome to Ologywood!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome to Ologywood! 🎵</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ${welcomeMessage}
          </p>
          
          <div style="background: linear-gradient(135deg, #f3e8ff 0%, #cffafe 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Getting Started:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Complete your profile</li>
              <li style="margin: 8px 0;">Set up your preferences</li>
              <li style="margin: 8px 0;">Start exploring opportunities</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${onboardingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Get Started
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Have questions? Check out our <a href="https://www.ologywood.com/how-it-works" style="color: #6D28D9; text-decoration: none;">How It Works</a> guide or contact our support team.
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}

/**
 * Payment Confirmation Email
 */
export function getPaymentConfirmationTemplate(params: {
  recipientName: string;
  amount: string;
  currency: string;
  description: string;
  transactionId: string;
  invoiceUrl?: string;
}): BrandedEmailTemplate {
  const { recipientName, amount, currency, description, transactionId, invoiceUrl = 'https://www.ologywood.com/billing' } = params;

  return {
    subject: `💳 Payment Received - ${currency} ${amount}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Payment Received ✓</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Your payment has been successfully processed. Here are the details:
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Amount:</strong> <span style="color: #4b5563;">${currency} ${amount}</span></p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Description:</strong> <span style="color: #4b5563;">${description}</span></p>
            <p style="margin: 0 0 0 0;"><strong style="color: #1f2937;">Transaction ID:</strong> <span style="color: #4b5563;">${transactionId}</span></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Invoice
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Thank you for your business!
          </p>
        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}

/**
 * Support Ticket Response Email
 */
export function getSupportTicketResponseTemplate(params: {
  recipientName: string;
  ticketId: string;
  subject: string;
  message: string;
  ticketUrl?: string;
}): BrandedEmailTemplate {
  const { recipientName, ticketId, subject, message, ticketUrl = 'https://www.ologywood.com/support' } = params;

  return {
    subject: `📧 Response to Your Support Ticket #${ticketId}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${getEmailHeader()}
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Support Response</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${recipientName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Our support team has responded to your ticket:
          </p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1f2937;">Ticket ID:</strong> <span style="color: #4b5563;">#${ticketId}</span></p>
            <p style="margin: 0 0 15px 0;"><strong style="color: #1f2937;">Subject:</strong> <span style="color: #4b5563;">${subject}</span></p>
            <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
              <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Full Ticket
            </a>
          </div>
        </div>
        
        ${getEmailFooter()}
      </div>
    `,
  };
}
