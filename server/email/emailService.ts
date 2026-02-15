/**
 * Email Service for Ologywood
 * Handles sending branded emails via SendGrid
 */

import sgMail from '@sendgrid/mail';
import { EmailTemplateData, generateEmailHTML } from './emailTemplate';

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

export interface SendEmailOptions {
  to: string;
  templateData: EmailTemplateData;
  replyTo?: string;
}

/**
 * Send a branded email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    if (!sendgridApiKey) {
      console.warn('SendGrid API key not configured. Email not sent.');
      return false;
    }

    const htmlContent = generateEmailHTML(options.templateData);

    const msg = {
      to: options.to,
      from: sendgridFromEmail,
      replyTo: options.replyTo || sendgridFromEmail,
      subject: options.templateData.subject,
      html: htmlContent,
      text: options.templateData.mainContent, // Fallback plain text
      headers: {
        'X-Email-Type': options.templateData.emailType,
        'X-Ologywood-Brand': 'true',
      },
    };

    await sgMail.send(msg);
    console.log(`✓ Email sent to ${options.to} (${options.templateData.emailType})`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  artistEmail: string,
  artistName: string,
  venueName: string,
  eventDate: string,
  eventTime: string,
  rate: number,
  bookingId: string
): Promise<boolean> {
  const { buildBookingConfirmationEmail } = await import('./emailTemplate');
  const templateData = buildBookingConfirmationEmail(
    artistName,
    venueName,
    eventDate,
    eventTime,
    rate,
    bookingId
  );

  return sendEmail({
    to: artistEmail,
    templateData,
  });
}

/**
 * Send booking request email
 */
export async function sendBookingRequestEmail(
  artistEmail: string,
  artistName: string,
  venueName: string,
  eventDate: string,
  eventTime: string,
  rate: number,
  requestId: string
): Promise<boolean> {
  const { buildBookingRequestEmail } = await import('./emailTemplate');
  const templateData = buildBookingRequestEmail(
    artistName,
    venueName,
    eventDate,
    eventTime,
    rate,
    requestId
  );

  return sendEmail({
    to: artistEmail,
    templateData,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  recipientEmail: string,
  recipientName: string,
  amount: number,
  transactionId: string,
  eventDetails: string
): Promise<boolean> {
  const { buildPaymentConfirmationEmail } = await import('./emailTemplate');
  const templateData = buildPaymentConfirmationEmail(
    recipientName,
    amount,
    transactionId,
    eventDetails
  );

  return sendEmail({
    to: recipientEmail,
    templateData,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  recipientName: string,
  userType: 'artist' | 'venue'
): Promise<boolean> {
  const { buildWelcomeEmail } = await import('./emailTemplate');
  const templateData = buildWelcomeEmail(recipientName, userType);

  return sendEmail({
    to: recipientEmail,
    templateData,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  recipientName: string,
  resetLink: string
): Promise<boolean> {
  const { buildPasswordResetEmail } = await import('./emailTemplate');
  const templateData = buildPasswordResetEmail(recipientName, resetLink);

  return sendEmail({
    to: recipientEmail,
    templateData,
  });
}

/**
 * Send status update email
 */
export async function sendStatusUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  updateType: string,
  details: string
): Promise<boolean> {
  const { buildStatusUpdateEmail } = await import('./emailTemplate');
  const templateData = buildStatusUpdateEmail(recipientName, updateType, details);

  return sendEmail({
    to: recipientEmail,
    templateData,
  });
}

/**
 * Send test email (for verification)
 */
export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  const { buildWelcomeEmail } = await import('./emailTemplate');
  const templateData = buildWelcomeEmail('Test User', 'artist');
  templateData.recipientEmail = recipientEmail;
  templateData.subject = '🎉 Ologywood Email Template Test';
  templateData.mainContent = `
    <p>This is a test email to verify that Ologywood's branded email system is working correctly.</p>
    
    <div class="success">
      ✓ If you're seeing this email with the Ologywood branding (purple/cyan gradient header and neon logo), the email system is configured correctly!
    </div>

    <p><strong>Email Features Included:</strong></p>
    <ul style="margin-left: 20px; color: #4b5563;">
      <li>Consistent neon Ologywood branding</li>
      <li>Responsive design for all devices</li>
      <li>Professional layout and typography</li>
      <li>Branded footer with social links</li>
      <li>Call-to-action buttons</li>
    </ul>

    <p>This template will be used for all Ologywood communications including booking confirmations, payment receipts, welcome emails, and status updates.</p>
  `;

  return sendEmail({
    to: recipientEmail,
    templateData,
  });
}
