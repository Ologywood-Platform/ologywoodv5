import { sendEmail } from '../email';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface PayoutNotificationData {
  artistId: number;
  payoutId: number;
  amount: number;
  payoutMethod: string;
  status: 'requested' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

/**
 * Generate payout requested email HTML
 */
const generatePayoutRequestedEmail = (artistName: string, amount: number, payoutId: number): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
        .status-badge { display: inline-block; background: #ffc107; color: #333; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payout Request Received</h1>
        </div>
        <div class="content">
          <p>Hi ${artistName},</p>
          <p>We've received your payout request! Here are the details:</p>
          
          <div class="details">
            <p><strong>Payout ID:</strong> #${payoutId}</p>
            <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            <p><strong>Status:</strong> <span class="status-badge">Pending Review</span></p>
          </div>

          <p>Your payout request is now being reviewed by our team. We typically process payouts within 2-3 business days.</p>
          
          <p>You'll receive an email update when your payout status changes. You can track your payout status anytime in your Ologywood dashboard.</p>

          <a href="${process.env.BASE_URL}/earnings" class="button">View Payout Status</a>

          <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Ologywood Team</p>

          <div class="footer">
            <p>© 2026 Ologywood. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate payout processing email HTML
 */
const generatePayoutProcessingEmail = (artistName: string, amount: number, payoutId: number): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
        .status-badge { display: inline-block; background: #17a2b8; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #17a2b8; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payout Processing</h1>
        </div>
        <div class="content">
          <p>Hi ${artistName},</p>
          <p>Great news! Your payout request has been approved and is now being processed.</p>
          
          <div class="details">
            <p><strong>Payout ID:</strong> #${payoutId}</p>
            <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            <p><strong>Status:</strong> <span class="status-badge">Processing</span></p>
          </div>

          <p>Your funds are being transferred to your bank account. This typically takes 1-3 business days depending on your bank.</p>
          
          <p>You'll receive a final confirmation email once the transfer is complete.</p>

          <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Ologywood Team</p>

          <div class="footer">
            <p>© 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate payout completed email HTML
 */
const generatePayoutCompletedEmail = (artistName: string, amount: number, payoutId: number): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #28a745; margin: 20px 0; }
        .status-badge { display: inline-block; background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #28a745; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payout Completed!</h1>
        </div>
        <div class="content">
          <p>Hi ${artistName},</p>
          <p>Your payout has been successfully completed!</p>
          
          <div class="details">
            <p><strong>Payout ID:</strong> #${payoutId}</p>
            <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            <p><strong>Status:</strong> <span class="status-badge">Completed</span></p>
          </div>

          <p>The funds have been transferred to your bank account. Please allow 1-2 business days for the funds to appear in your account.</p>
          
          <p>Thank you for using Ologywood! Keep creating amazing performances.</p>

          <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Ologywood Team</p>

          <div class="footer">
            <p>© 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate payout failed email HTML
 */
const generatePayoutFailedEmail = (artistName: string, amount: number, payoutId: number, errorMessage?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #dc3545; margin: 20px 0; }
        .status-badge { display: inline-block; background: #dc3545; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
        .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #dc3545; }
        .error-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payout Failed</h1>
        </div>
        <div class="content">
          <p>Hi ${artistName},</p>
          <p>Unfortunately, your payout could not be processed. Please review the details below:</p>
          
          <div class="details">
            <p><strong>Payout ID:</strong> #${payoutId}</p>
            <p><strong>Amount:</strong> <span class="amount">$${amount.toFixed(2)}</span></p>
            <p><strong>Status:</strong> <span class="status-badge">Failed</span></p>
          </div>

          ${errorMessage ? `<div class="error-box"><strong>Reason:</strong> ${errorMessage}</div>` : ''}

          <p>Please check your bank account information and try again. If the problem persists, please contact our support team for assistance.</p>

          <a href="${process.env.BASE_URL}/earnings" class="button">Try Again</a>

          <p style="margin-top: 30px;">If you need help, please reach out to our support team.</p>
          
          <p>Best regards,<br>The Ologywood Team</p>

          <div class="footer">
            <p>© 2026 Ologywood. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const payoutNotificationService = {
  /**
   * Send payout notification email
   */
  async sendPayoutNotification(data: PayoutNotificationData): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get artist user info
    const artistResult = await db
      .select()
      .from(users)
      .where(eq(users.id, data.artistId))
      .limit(1);

    const artist = artistResult[0];
    if (!artist || !artist.email) {
      console.error(`Artist ${data.artistId} not found or has no email`);
      return;
    }

    let subject = '';
    let htmlContent = '';

    switch (data.status) {
      case 'requested':
        subject = 'Payout Request Received - Ologywood';
        htmlContent = generatePayoutRequestedEmail(artist.name || 'Artist', data.amount, data.payoutId);
        break;
      case 'processing':
        subject = 'Payout Processing - Ologywood';
        htmlContent = generatePayoutProcessingEmail(artist.name || 'Artist', data.amount, data.payoutId);
        break;
      case 'completed':
        subject = 'Payout Completed - Ologywood';
        htmlContent = generatePayoutCompletedEmail(artist.name || 'Artist', data.amount, data.payoutId);
        break;
      case 'failed':
        subject = 'Payout Failed - Ologywood';
        htmlContent = generatePayoutFailedEmail(artist.name || 'Artist', data.amount, data.payoutId, data.errorMessage);
        break;
    }

    try {
      await sendEmail({
        to: artist.email,
        subject,
        html: htmlContent,
      });
      console.log(`[Payout Notification] Sent ${data.status} email to ${artist.email}`);
    } catch (error) {
      console.error(`[Payout Notification] Failed to send email to ${artist.email}:`, error);
    }
  },

  /**
   * Send payout notification to admin
   */
  async sendAdminPayoutNotification(data: PayoutNotificationData): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ologywood.com';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #333; color: white; padding: 20px; border-radius: 4px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Payout Notification - Admin Alert</h2>
          </div>
          <div class="details">
            <p><strong>Artist ID:</strong> ${data.artistId}</p>
            <p><strong>Payout ID:</strong> ${data.payoutId}</p>
            <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${data.payoutMethod}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            ${data.errorMessage ? `<p><strong>Error:</strong> ${data.errorMessage}</p>` : ''}
          </div>
          <p>Please review and process this payout in the admin panel.</p>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: adminEmail,
        subject: `Payout ${data.status.toUpperCase()} - Payout #${data.payoutId}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error(`[Payout Notification] Failed to send admin email:`, error);
    }
  },
};
