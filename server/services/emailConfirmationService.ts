import sgMail from "@sendgrid/mail";
import { ENV } from "../_core/env";
import { randomBytes } from 'crypto';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ConfirmationEmailData {
  recipientEmail: string;
  recipientName: string;
  verificationLink: string;
  expiresIn?: string;
}

class EmailConfirmationService {
  private sgMail: typeof sgMail;

  constructor() {
    this.sgMail = sgMail;
    if (ENV.sendgridApiKey) {
      this.sgMail.setApiKey(ENV.sendgridApiKey);
    }
  }

  /**
   * Generate confirmation token for email verification.
   * Stores the token in the database on the user's row so it survives server restarts.
   */
  async generateConfirmationToken(email: string, userId: number): Promise<string> {
    const token = randomBytes(32).toString('hex');

    try {
      const db = await getDb();
      if (db) {
        await db.update(users).set({
          emailVerificationToken: token,
          emailVerificationSentAt: new Date(),
        }).where(eq(users.id, userId));
      }
    } catch (error) {
      console.error('[EmailConfirmation] Failed to persist token to DB:', error);
      // Token was generated but not persisted — verification will fail later
    }

    return token;
  }

  /**
   * Verify confirmation token by looking it up in the database.
   * Tokens expire after 24 hours.
   */
  async verifyConfirmationToken(token: string): Promise<{ valid: boolean; email?: string; userId?: number }> {
    try {
      const db = await getDb();
      if (!db) {
        return { valid: false };
      }

      // Find user with this token
      const result = await db.select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationSentAt: users.emailVerificationSentAt,
      }).from(users).where(eq(users.emailVerificationToken, token)).limit(1);

      if (result.length === 0) {
        return { valid: false };
      }

      const user = result[0];

      // Check if already verified
      if (user.emailVerified) {
        // Clear the token since it's already used
        await db.update(users).set({
          emailVerificationToken: null,
        }).where(eq(users.id, user.id));
        return { valid: false };
      }

      // Check if token has expired (24 hours)
      if (user.emailVerificationSentAt) {
        const expiresAt = new Date(user.emailVerificationSentAt.getTime() + 24 * 60 * 60 * 1000);
        if (new Date() > expiresAt) {
          // Clear expired token
          await db.update(users).set({
            emailVerificationToken: null,
          }).where(eq(users.id, user.id));
          return { valid: false };
        }
      }

      // Token is valid — clear it so it can't be reused
      await db.update(users).set({
        emailVerificationToken: null,
      }).where(eq(users.id, user.id));

      return {
        valid: true,
        email: user.email || undefined,
        userId: user.id,
      };
    } catch (error) {
      console.error('[EmailConfirmation] Failed to verify token:', error);
      return { valid: false };
    }
  }

  /**
   * Send email confirmation email
   */
  async sendConfirmationEmail(data: ConfirmationEmailData): Promise<void> {
    if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
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
          <p style="margin: 0;">&copy; 2026 Ologywood. All rights reserved.</p>
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
          <p style="margin: 0;">&copy; 2026 Ologywood. All rights reserved.</p>
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
    } catch (error) {
      console.error("[Email] Failed to send resend confirmation email:", error);
      throw error;
    }
  }

  /**
   * Send email change confirmation
   */
  async sendEmailChangeConfirmation(
    newEmail: string,
    oldEmail: string,
    userName: string,
    revertToken: string
  ): Promise<void> {
    if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
      return;
    }

    const revertUrl = `${process.env.BASE_URL || 'https://ologywood.com'}/revert-email?token=${revertToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Email Change Confirmed</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Your email address change has been successfully verified and confirmed. Your new email address is now active on your Ologywood account.
          </p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Email Change Summary:</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>Previous Email:</strong></p>
            <p style="font-family: 'Courier New', monospace; background-color: #f9fafb; padding: 8px; border-radius: 4px; margin: 0 0 10px 0;">${oldEmail}</p>
            <p style="font-size: 13px; margin: 5px 0;"><strong>New Email:</strong></p>
            <p style="font-family: 'Courier New', monospace; background-color: #f9fafb; padding: 8px; border-radius: 4px; margin: 0;">${newEmail}</p>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 20px 0;"><strong>What's Next?</strong></p>
          <p style="font-size: 13px; margin: 0 0 10px 0;">You can now use your new email address (${newEmail}) to:</p>
          <ul style="font-size: 13px; margin: 0; padding-left: 20px;">
            <li>Log in to your Ologywood account</li>
            <li>Receive booking notifications and messages</li>
            <li>Reset your password if needed</li>
            <li>Manage your account settings</li>
          </ul>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 20px 0 10px 0;"><strong>Need to Undo This Change?</strong></p>
          <p style="font-size: 13px; margin: 0 0 15px 0;">If you didn't request this email change or would like to revert to your previous email address, you can do so within the next 48 hours:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${revertUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Revert Email Change</a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="font-size: 12px; margin: 0;"><strong>Important:</strong> The revert link will expire in 48 hours. If you need to revert after that, please contact our support team.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; margin: 0;"><strong>Account Security:</strong> If you didn't make this change or don't recognize the new email address, please contact our support team immediately at support@ologywood.com.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">&copy; 2026 Ologywood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: newEmail,
        from: ENV.sendgridFromEmail,
        subject: 'Email Address Change Confirmed - Ologywood',
        html: htmlContent,
      });
    } catch (error) {
      console.error('[Email] Failed to send email change confirmation:', error);
      throw error;
    }
  }

  /**
   * Send email revert confirmation
   */
  async sendRevertConfirmation(
    email: string,
    userName: string
  ): Promise<void> {
    if (!ENV.sendgridApiKey || !ENV.sendgridFromEmail) {
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Email Change Reverted</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
          
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Your email address change has been successfully reverted. Your account is now using your previous email address.
          </p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">Your email address is now:</p>
            <p style="font-family: 'Courier New', monospace; background-color: #f9fafb; padding: 12px; border-radius: 4px; margin: 0; word-break: break-all;">${email}</p>
          </div>
          
          <p style="font-size: 13px; line-height: 1.6; margin: 20px 0;">If you need to change your email address again, you can do so from your account settings.</p>
          
          <p style="font-size: 13px; line-height: 1.6; margin: 20px 0;">If you have any questions, please contact our support team.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">&copy; 2026 Ologywood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: email,
        from: ENV.sendgridFromEmail,
        subject: 'Email Change Reverted - Ologywood',
        html: htmlContent,
      });
    } catch (error) {
      console.error('[Email] Failed to send email revert confirmation:', error);
      throw error;
    }
  }
}

export const emailConfirmationService = new EmailConfirmationService();
