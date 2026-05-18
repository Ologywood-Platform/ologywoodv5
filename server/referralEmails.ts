import { sendEmail } from "./email";
import { ENV } from "./_core/env";

/**
 * Referral email notification templates
 * Uses the branded Ologywood email style with unsubscribe links
 */

function referralEmailWrapper(content: string, recipientEmail: string): string {
  const baseUrl = ENV.baseUrl;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=referral`;
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
          You're receiving this email because you have an Ologywood account with referral activity.
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
 * Send notification to referrer when their friend signs up
 */
export async function sendReferralSignupEmail(params: {
  referrerEmail: string;
  referrerName: string;
  referredName: string;
}): Promise<boolean> {
  const { referrerEmail, referrerName, referredName } = params;
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${referrerName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      Great news! <strong>${referredName}</strong> just signed up on Ologywood using your referral link. 🎉
    </p>

    <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9d5ff;">
      <p style="color: #6D28D9; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">What happens next?</p>
      <p style="color: #374151; font-size: 14px; margin: 0;">
        Your <strong>$5.00 referral credit</strong> has been added to your account. You can use it toward your next subscription payment.
      </p>
    </div>

    <p style="color: #374151; font-size: 14px; margin: 0 0 20px 0;">
      Keep sharing your referral link to earn more credits. Every friend who joins earns you $5!
    </p>

    <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View Your Referrals
    </a>
  `;

  return sendEmail({
    to: referrerEmail,
    subject: `🎉 ${referredName} joined Ologywood with your referral!`,
    html: referralEmailWrapper(content, referrerEmail),
  });
}

/**
 * Send notification to referrer when they earn credit from a conversion
 */
export async function sendReferralCreditEarnedEmail(params: {
  referrerEmail: string;
  referrerName: string;
  referredName: string;
  creditAmount: number;
}): Promise<boolean> {
  const { referrerEmail, referrerName, referredName, creditAmount } = params;
  const baseUrl = ENV.baseUrl;

  const content = `
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${referrerName},</p>
    
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      You just earned a referral reward! 💰
    </p>

    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0; text-align: center;">
      <p style="color: #059669; font-size: 32px; font-weight: 700; margin: 0 0 8px 0;">
        +$${creditAmount.toFixed(2)}
      </p>
      <p style="color: #065f46; font-size: 14px; margin: 0;">
        Credit added to your account
      </p>
    </div>

    <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">
      <strong>Reason:</strong> ${referredName} signed up using your referral link
    </p>
    
    <p style="color: #374151; font-size: 14px; margin: 0 0 20px 0;">
      Your credit balance will be automatically applied to your next subscription payment, or you can redeem it at checkout.
    </p>

    <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View Credit Balance
    </a>
  `;

  return sendEmail({
    to: referrerEmail,
    subject: `💰 You earned $${creditAmount.toFixed(2)} referral credit!`,
    html: referralEmailWrapper(content, referrerEmail),
  });
}
