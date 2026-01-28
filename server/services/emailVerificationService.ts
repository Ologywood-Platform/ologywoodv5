import sgMail from "@sendgrid/mail";
import { ENV } from "../_core/env";

export interface VerificationEmailData {
  recipientEmail: string;
  recipientName: string;
  verificationStatus: "submitted" | "approved" | "rejected" | "appeal";
  artistName?: string;
  rejectionReason?: string;
  verificationLink?: string;
  appealDeadline?: Date;
}

class EmailVerificationService {
  private sgMail: typeof sgMail;

  constructor() {
    this.sgMail = sgMail;
    if (ENV.SENDGRID_API_KEY) {
      this.sgMail.setApiKey(ENV.SENDGRID_API_KEY);
    }
  }

  /**
   * Send verification submission confirmation email
   */
  async sendVerificationSubmittedEmail(data: VerificationEmailData): Promise<void> {
    if (!ENV.SENDGRID_API_KEY || !ENV.SENDGRID_FROM_EMAIL) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verification Submitted</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Thank you for submitting your artist verification documents. We've received your submission and our team is reviewing it.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>What happens next?</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Our team will review your documents (typically within 2-3 business days)</li>
            <li>We may request additional information if needed</li>
            <li>You'll receive an email once your verification is approved or if we need more info</li>
          </ul>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.SENDGRID_FROM_EMAIL,
        subject: "Artist Verification Submitted",
        html: htmlContent,
      });
      console.log(`[Email] Verification submitted email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send verification submitted email:", error);
    }
  }

  /**
   * Send verification approved email
   */
  async sendVerificationApprovedEmail(data: VerificationEmailData): Promise<void> {
    if (!ENV.SENDGRID_API_KEY || !ENV.SENDGRID_FROM_EMAIL) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🎉 Verification Approved!</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Congratulations! Your artist verification has been approved. You now have access to all premium features on Ologywood.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #28a745;"><strong>✓ Verification Badge Unlocked</strong></p>
          <p style="margin: 5px 0; font-size: 14px;">Your profile now displays a verification badge, helping venues trust your profile.</p>
        </div>
        
        <p><strong>You can now:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Appear higher in venue searches</li>
          <li>Access premium booking tools</li>
          <li>Generate professional contracts</li>
          <li>Access detailed analytics</li>
        </ul>
        
        <p>Start booking more gigs today!</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.SENDGRID_FROM_EMAIL,
        subject: "🎉 Your Artist Verification is Approved!",
        html: htmlContent,
      });
      console.log(`[Email] Verification approved email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send verification approved email:", error);
    }
  }

  /**
   * Send verification rejected email
   */
  async sendVerificationRejectedEmail(data: VerificationEmailData): Promise<void> {
    if (!ENV.SENDGRID_API_KEY || !ENV.SENDGRID_FROM_EMAIL) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Verification Status Update</h2>
        <p>Hi ${data.recipientName},</p>
        <p>Thank you for submitting your verification documents. Unfortunately, we were unable to approve your verification at this time.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 10px 0; color: #333;">${data.rejectionReason || "Please see details below"}</p>
        </div>
        
        <p><strong>What you can do:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Review the rejection reason above</li>
          <li>Gather additional or corrected documents</li>
          <li>Resubmit your verification with updated information</li>
          <li>Contact our support team if you have questions</li>
        </ul>
        
        <p>We're here to help! Feel free to reach out to our support team if you need clarification.</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.SENDGRID_FROM_EMAIL,
        subject: "Verification Status Update",
        html: htmlContent,
      });
      console.log(`[Email] Verification rejected email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send verification rejected email:", error);
    }
  }

  /**
   * Send verification appeal email
   */
  async sendVerificationAppealEmail(data: VerificationEmailData): Promise<void> {
    if (!ENV.SENDGRID_API_KEY || !ENV.SENDGRID_FROM_EMAIL) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Appeal Received</h2>
        <p>Hi ${data.recipientName},</p>
        <p>We've received your appeal for your verification rejection. Our team will review your appeal and get back to you within 5 business days.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
          <p style="margin: 0;"><strong>Appeal Deadline:</strong></p>
          <p style="margin: 10px 0;">${data.appealDeadline?.toLocaleDateString()}</p>
        </div>
        
        <p>We appreciate your patience and will review your case carefully. If you have any additional information to provide, please reply to this email.</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.SENDGRID_FROM_EMAIL,
        subject: "Appeal Received - Verification Review",
        html: htmlContent,
      });
      console.log(`[Email] Verification appeal email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send verification appeal email:", error);
    }
  }

  /**
   * Send verification reminder email
   */
  async sendVerificationReminderEmail(data: VerificationEmailData): Promise<void> {
    if (!ENV.SENDGRID_API_KEY || !ENV.SENDGRID_FROM_EMAIL) {
      console.log("[Email] SendGrid not configured, skipping email");
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Complete Your Artist Verification</h2>
        <p>Hi ${data.recipientName},</p>
        <p>We noticed you haven't completed your artist verification yet. Verified artists get more bookings and appear higher in venue searches!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="${data.verificationLink}" style="display: inline-block; padding: 12px 30px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Complete Verification Now
          </a>
        </div>
        
        <p><strong>Benefits of verification:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>✓ Verification badge on your profile</li>
          <li>✓ Higher search rankings</li>
          <li>✓ More booking inquiries</li>
          <li>✓ Access to premium features</li>
        </ul>
        
        <p>It only takes a few minutes to get verified!</p>
        <p>Best regards,<br/>The Ologywood Team</p>
      </div>
    `;

    try {
      await this.sgMail.send({
        to: data.recipientEmail,
        from: ENV.SENDGRID_FROM_EMAIL,
        subject: "Complete Your Artist Verification Today",
        html: htmlContent,
      });
      console.log(`[Email] Verification reminder email sent to ${data.recipientEmail}`);
    } catch (error) {
      console.error("[Email] Failed to send verification reminder email:", error);
    }
  }

  /**
   * Send batch verification status emails
   */
  async sendBatchVerificationEmails(
    recipients: VerificationEmailData[],
    emailType: "submitted" | "approved" | "rejected" | "appeal" | "reminder"
  ): Promise<void> {
    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        switch (emailType) {
          case "submitted":
            return this.sendVerificationSubmittedEmail(recipient);
          case "approved":
            return this.sendVerificationApprovedEmail(recipient);
          case "rejected":
            return this.sendVerificationRejectedEmail(recipient);
          case "appeal":
            return this.sendVerificationAppealEmail(recipient);
          case "reminder":
            return this.sendVerificationReminderEmail(recipient);
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`[Email] Batch verification emails: ${successful} sent, ${failed} failed`);
  }
}

export const emailVerificationService = new EmailVerificationService();
