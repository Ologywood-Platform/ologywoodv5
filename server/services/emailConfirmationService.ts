import sgMail from "@sendgrid/mail";
import { ENV } from "../_core/env";
import { randomBytes } from 'crypto';

interface ConfirmationEmailData {
  recipientEmail: string;
  recipientName: string;
  verificationLink: string;
  expiresIn?: string;
}

// In-memory store for confirmation tokens
const confirmationTokens = new Map<string, {
  email: string;
  userId: number;
  expiresAt: Date;
  confirmed: boolean;
}>();

class EmailConfirmationService {
  private sgMail: typeof sgMail;

  constructor() {
    this.sgMail = sgMail;
    if (ENV.sendgridApiKey) {
      this.sgMail.setApiKey(ENV.sendgridApiKey);
    }
  }

  /**
   * Generate confirmation token for email verification
   */
  generateConfirmationToken(email: string, userId: number): string {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    confirmationTokens.set(token, {
      email,
      userId,
      expiresAt,
      confirmed: false,
    });

    return token;
  }

  /**
   * Verify confirmation token
   */
  verifyConfirmationToken(token: string): { valid: boolean; email?: string; userId?: number } {
    const confirmation = confirmationTokens.get(token);

    if (!confirmation) {
      return { valid: false };
    }

    if (new Date() > confirmation.expiresAt) {
      confirmationTokens.delete(token);
      return { valid: false };
    }

    if (confirmation.confirmed) {
      return { valid: false };
    }

    confirmation.confirmed = true;
    return {
      valid: true,
      email: confirmation.email,
      userId: confirmation.userId,
    };
  }

  /**
   * Send email confirmation email
   */
  async sendConfirmationEmail(data: ConfirmationEmailData): Promise<void> {
    if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Ologywood!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${data.recipientName},</p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for signing up! To complete your registration and start booking amazing artists and venues, please confirm your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" style="display: inline-block; padding: 14px 40px; background-color: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin: 20px 0 0 0; text-align: center;">
            This link expires in ${data.expiresIn || '24 hours'}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 13px; color: #666; margin: 0 0 10px 0;">
            <strong>What you can do after confirming:</strong>
          </p>
          <ul style="font-size: 13px; color: #666; margin: 0; padding-left: 20px;">
            <li>Browse and book talented artists for your events</li>
            <li>Discover amazing venues for your performances</li>
            <li>Connect with other professionals in the industry</li>
            <li>Manage your bookings and messages</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; margin: 0;">
            If you didn't create this account, please ignore this email. If you have any questions, contact our support team.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.sendgridFromEmail,
        subject: "Confirm Your Email - Welcome to Ologywood!",
        html: htmlContent,
      });
      console.log(`[Email] Confirmation email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send confirmation email:", error);
      throw error;
    }
  }

  /**
   * Send resend confirmation email
   */
  async sendResendConfirmationEmail(data: ConfirmationEmailData): Promise<void> {
    if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Confirm Your Email</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${data.recipientName},</p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Here's a fresh confirmation link for your email address. This link will expire in ${data.expiresIn || '24 hours'}.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationLink}" style="display: inline-block; padding: 14px 40px; background-color: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin: 20px 0 0 0; text-align: center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">© 2026 Ologywood. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.sendgridFromEmail,
        subject: "Confirm Your Email - Ologywood",
        html: htmlContent,
      });
      console.log(`[Email] Resend confirmation email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send resend confirmation email:", error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): number {
    let cleanedCount = 0;
    const now = new Date();

    for (const [token, confirmation] of confirmationTokens.entries()) {
      if (now > confirmation.expiresAt) {
        confirmationTokens.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

export const emailConfirmationService = new EmailConfirmationService();

// Run cleanup every hour
setInterval(() => {
  const cleaned = emailConfirmationService.cleanupExpiredTokens();
  if (cleaned > 0) {
    console.log(`[Email Confirmation] Cleaned up ${cleaned} expired tokens`);
  }
}, 60 * 60 * 1000);
