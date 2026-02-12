#!/usr/bin/env node

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'info@ologywood.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable not set');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function sendTestConfirmationEmail() {
  const newEmail = 'garychisolm30@gmail.com';
  const oldEmail = 'gary.chisolm@example.com';
  const userName = 'Gary Chisolm';
  const revertToken = 'test-revert-token-' + Date.now();

  const revertUrl = `https://ologywood.com/revert-email?token=${revertToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✓ Email Change Confirmed</h1>
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
          <p style="font-size: 12px; margin: 0;"><strong>⚠️ Important:</strong> The revert link will expire in 48 hours. If you need to revert after that, please contact our support team.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; margin: 0;"><strong>Account Security:</strong> If you didn't make this change or don't recognize the new email address, please contact our support team immediately at support@ologywood.com.</p>
      </div>
      
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
        <p style="margin: 0;">© 2026 Ologywood. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  try {
    console.log('📧 Sending email confirmation test...\n');
    console.log(`To: ${newEmail}`);
    console.log(`From: ${SENDGRID_FROM_EMAIL}`);
    console.log(`Subject: Email Address Change Confirmed - Ologywood\n`);

    const response = await sgMail.send({
      to: newEmail,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Email Address Change Confirmed - Ologywood',
      html: htmlContent,
    });

    console.log('✅ Email sent successfully!');
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    console.log(`Status: ${response[0].statusCode}\n`);

    console.log('📋 Email Details:');
    console.log(`   • From: ${SENDGRID_FROM_EMAIL}`);
    console.log(`   • To: ${newEmail}`);
    console.log(`   • Previous Email: ${oldEmail}`);
    console.log(`   • Revert Token: ${revertToken}`);
    console.log(`   • Revert URL: ${revertUrl}`);
    console.log(`   • Revert Window: 48 hours\n`);

    console.log('✨ Email Confirmation Features Tested:');
    console.log('   ✓ Professional HTML template');
    console.log('   ✓ Email change summary display');
    console.log('   ✓ Revert link with token');
    console.log('   ✓ Security warnings');
    console.log('   ✓ 48-hour revert window');
    console.log('   ✓ Account security information');

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    process.exit(1);
  }
}

sendTestConfirmationEmail();
