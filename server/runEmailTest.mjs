/**
 * Comprehensive Email Test Script
 * Tests ALL email functions end-to-end by sending real emails
 * Usage: node server/runEmailTest.mjs
 */

// Load environment variables
import { config } from 'dotenv';
config();

const TEST_EMAIL = 'garychisolm30@gmail.com';
const BASE_URL = process.env.BASE_URL || 'https://www.ologywood.com';
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';

const results = [];
let emailNumber = 0;

async function sendEmail(to, subject, html) {
  // Try Forge API first
  if (FORGE_API_URL && FORGE_API_KEY) {
    try {
      const response = await fetch(`${FORGE_API_URL}/notification/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FORGE_API_KEY}`,
        },
        body: JSON.stringify({ to, subject, html }),
      });

      if (response.ok) {
        return { success: true, method: 'Forge API' };
      } else {
        const errorText = await response.text();
        console.warn(`  [Forge API failed: ${response.status}] ${errorText}`);
      }
    } catch (error) {
      console.warn(`  [Forge API error] ${error.message}`);
    }
  }

  // Fallback to SendGrid
  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: SENDGRID_FROM_EMAIL, name: 'Ologywood' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (response.ok || response.status === 202) {
        return { success: true, method: 'SendGrid' };
      } else {
        const errorText = await response.text();
        return { success: false, method: 'SendGrid', error: errorText };
      }
    } catch (error) {
      return { success: false, method: 'SendGrid', error: error.message };
    }
  }

  return { success: false, method: 'None', error: 'No email service configured' };
}

async function testEmail(name, subject, html) {
  emailNumber++;
  const fullSubject = `[Test ${emailNumber}] ${subject}`;
  console.log(`\n📧 Test ${emailNumber}: ${name}`);
  
  try {
    const result = await sendEmail(TEST_EMAIL, fullSubject, html);
    if (result.success) {
      console.log(`  ✅ SUCCESS via ${result.method}`);
      results.push({ num: emailNumber, name, status: '✅ SUCCESS', method: result.method });
    } else {
      console.log(`  ❌ FAILED via ${result.method}: ${result.error}`);
      results.push({ num: emailNumber, name, status: '❌ FAILED', method: result.method, error: result.error });
    }
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    results.push({ num: emailNumber, name, status: '❌ FAILED', error: error.message });
  }
  
  // Small delay between sends to avoid rate limiting
  await new Promise(r => setTimeout(r, 1500));
}

// Branded email wrapper
function wrapEmail(content) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center;">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ymRJKMwaOWmPOCjV.png" alt="Ologywood" style="height: 40px; width: auto; margin-bottom: 10px;">
        <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
      </div>
      <div style="padding: 30px 24px;">
        ${content}
      </div>
      <div style="background: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">This is a test email from Ologywood.</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          <a href="${BASE_URL}/unsubscribe" style="color: #6D28D9;">Unsubscribe</a> | 
          <a href="${BASE_URL}/privacy" style="color: #6D28D9;">Privacy Policy</a>
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; 2026 Ologywood. All rights reserved.</p>
      </div>
    </div>
  `;
}

// ============================================================
// RUN ALL EMAIL TESTS
// ============================================================

console.log('='.repeat(60));
console.log('🚀 OLOGYWOOD END-TO-END EMAIL TEST');
console.log(`📬 Sending all test emails to: ${TEST_EMAIL}`);
console.log(`🔧 Forge API: ${FORGE_API_URL ? 'Configured' : 'Not configured'}`);
console.log(`🔧 SendGrid: ${SENDGRID_API_KEY ? 'Configured' : 'Not configured'}`);
console.log('='.repeat(60));

// 1. Welcome Email (Artist)
await testEmail('Welcome Email (Artist)',
  'Welcome to Ologywood, Test Artist!',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Welcome to Ologywood! 🎵</h2>
    <p style="color: #374151; font-size: 16px;">Hi Test Artist,</p>
    <p style="color: #374151;">Welcome to the Ologywood community! Your artist profile is ready to be set up.</p>
    <p style="color: #374151;">Here's what you can do next:</p>
    <ul style="color: #374151;">
      <li>Complete your artist profile</li>
      <li>Upload your best photos and videos</li>
      <li>Set your availability and rates</li>
      <li>Start receiving booking requests</li>
    </ul>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Go to Dashboard</a>
    </div>
  `)
);

// 2. Welcome Email (Venue)
await testEmail('Welcome Email (Venue)',
  'Welcome to Ologywood, Test Venue!',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Welcome to Ologywood! 🏛️</h2>
    <p style="color: #374151; font-size: 16px;">Hi Test Venue,</p>
    <p style="color: #374151;">Welcome to Ologywood! You can now browse and book talented artists for your events.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/browse" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Browse Artists</a>
    </div>
  `)
);

// 3. Booking Request
await testEmail('Booking Request',
  'New Booking Request from The Grand Theater',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">New Booking Request 🎤</h2>
    <p style="color: #374151;">Hi Test Artist,</p>
    <p style="color: #374151;">You have a new booking request from <strong>The Grand Theater</strong>!</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> March 15, 2026</p>
      <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> The Grand Theater</p>
      <p style="margin: 0 0 8px 0;"><strong>Location:</strong> 123 Main St, Atlanta, GA</p>
      <p style="margin: 0;"><strong>Details:</strong> Live music event - 2 hour performance</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Request</a>
    </div>
  `)
);

// 4. Booking Confirmation
await testEmail('Booking Confirmation',
  'Booking Confirmed: March 15, 2026 at The Grand Theater',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Booking Confirmed! ✅</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">Your booking has been confirmed!</p>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> March 15, 2026</p>
      <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> The Grand Theater</p>
      <p style="margin: 0;"><strong>Address:</strong> 123 Main St, Atlanta, GA 30303</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Booking</a>
    </div>
  `)
);

// 5. Booking Cancellation
await testEmail('Booking Cancellation',
  'Booking Cancelled: March 15, 2026 at The Grand Theater',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Booking Cancelled</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">A booking scheduled for <strong>March 15, 2026</strong> at <strong>The Grand Theater</strong> has been cancelled.</p>
    <p style="color: #374151;"><strong>Reason:</strong> Schedule conflict</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: #6D28D9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Bookings</a>
    </div>
  `)
);

// 6. Subscription Created
await testEmail('Subscription Created',
  'Welcome to Ologywood Starter Plan!',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Subscription Activated! 🎉</h2>
    <p style="color: #374151;">Hi Test Artist,</p>
    <p style="color: #374151;">Your <strong>Starter Plan</strong> subscription is now active!</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> Starter</p>
      <p style="margin: 0;"><strong>Trial ends:</strong> February 25, 2026</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Go to Dashboard</a>
    </div>
  `)
);

// 7. Trial Ending
await testEmail('Trial Ending Reminder',
  'Your Ologywood Trial Ends in 3 Days',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Trial Ending Soon ⏰</h2>
    <p style="color: #374151;">Hi Test Artist,</p>
    <p style="color: #374151;">Your free trial ends in <strong>3 days</strong>. Upgrade now to keep all your premium features.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/pricing" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Plans</a>
    </div>
  `)
);

// 8. Subscription Cancelled
await testEmail('Subscription Cancelled',
  'Your Ologywood Subscription Has Been Cancelled',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Subscription Cancelled</h2>
    <p style="color: #374151;">Hi Test Artist,</p>
    <p style="color: #374151;">Your Ologywood subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>
    <p style="color: #374151;">We'd love to have you back anytime!</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/pricing" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Resubscribe</a>
    </div>
  `)
);

// 9. Payment Receipt
await testEmail('Payment Receipt',
  'Payment Received: $150.00',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Payment Received 💰</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">A payment of <strong>$150.00</strong> has been processed for your booking.</p>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> $150.00</p>
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> April 2, 2026</p>
      <p style="margin: 0;"><strong>Booking:</strong> Live Performance at The Grand Theater</p>
    </div>
  `)
);

// 10. Refund Notification
await testEmail('Refund Notification',
  'Refund Processed: $150.00',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Refund Processed</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">A refund of <strong>$150.00</strong> has been processed. Please allow 5-10 business days for the funds to appear in your account.</p>
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 8px 0;"><strong>Refund Amount:</strong> $150.00</p>
      <p style="margin: 0;"><strong>Reason:</strong> Booking cancellation</p>
    </div>
  `)
);

// 11. Contract for Signature
await testEmail('Contract for Signature',
  'Contract Ready for Signature: Live Performance Agreement',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Contract Ready for Signature 📝</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">A contract is ready for your review and signature.</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
      <p style="margin: 0 0 8px 0;"><strong>Contract:</strong> Live Performance Agreement</p>
      <p style="margin: 0 0 8px 0;"><strong>Event:</strong> March 15, 2026 at The Grand Theater</p>
      <p style="margin: 0;"><strong>Fee:</strong> $500.00</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/contracts" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Review & Sign</a>
    </div>
  `)
);

// 12. Contract Signed
await testEmail('Contract Signed',
  'Contract Signed: Live Performance Agreement',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Contract Signed! ✅</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">The contract <strong>Live Performance Agreement</strong> has been signed by all parties.</p>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <p style="margin: 0 0 8px 0;"><strong>Contract:</strong> Live Performance Agreement</p>
      <p style="margin: 0;"><strong>Status:</strong> Fully Executed</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/contracts" style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Contract</a>
    </div>
  `)
);

// 13. Review Notification (Venue → Artist)
await testEmail('Review Notification',
  'New Review from The Grand Theater',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">New Review! ⭐</h2>
    <p style="color: #374151;">Hi Test Artist,</p>
    <p style="color: #374151;"><strong>The Grand Theater</strong> left you a review:</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 20px;">⭐⭐⭐⭐⭐</p>
      <p style="color: #4b5563; margin: 0; font-style: italic;">"Amazing performance! The crowd loved every minute. Would definitely book again."</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/dashboard" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Review</a>
    </div>
  `)
);

// 14. Review Response
await testEmail('Review Response',
  'Test Artist Responded to Your Review',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Artist Response to Your Review</h2>
    <p style="color: #374151;">Hi Test Venue,</p>
    <p style="color: #374151;"><strong>Test Artist</strong> responded to your review:</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="color: #4b5563; margin: 0; font-style: italic;">"Thank you so much! It was an incredible night. Looking forward to performing again!"</p>
    </div>
  `)
);

// 15. Availability Update
await testEmail('Availability Update',
  'Test Artist has new availability dates',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">New Availability 📅</h2>
    <p style="color: #374151;">Hi Test Venue,</p>
    <p style="color: #374151;"><strong>Test Artist</strong>, an artist you've worked with, has updated their availability.</p>
    <p style="color: #374151;">Check out their new available dates and book them for your next event!</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/browse" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">View Availability</a>
    </div>
  `)
);

// 16. Booking Reminder
await testEmail('Booking Reminder',
  'Reminder: Upcoming Booking on March 15, 2026',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Booking Reminder 🔔</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">This is a reminder about your upcoming booking:</p>
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> March 15, 2026</p>
      <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> The Grand Theater</p>
      <p style="margin: 0;"><strong>Time:</strong> 8:00 PM</p>
    </div>
  `)
);

// 17. Fan Update (Artist Blast)
await testEmail('Fan Update (Artist Blast)',
  'Test Artist: New Music Coming Soon!',
  wrapEmail(`
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi Fan,</p>
    <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;">
      <strong>Test Artist</strong> sent you an update:
    </p>
    <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">New Music Coming Soon!</h3>
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0; line-height: 1.6;">Hey everyone! I'm excited to announce that my new album will be dropping next month. Stay tuned for exclusive previews!</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${BASE_URL}/artist/1" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Artist Profile</a>
    </div>
  `)
);

// 18. Fan New Event Notification
await testEmail('Fan New Event Notification',
  'Test Artist has a new event: Summer Jam 2026',
  wrapEmail(`
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi Fan,</p>
    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
      <strong>Test Artist</strong>, an artist you follow, just announced a new event!
    </p>
    <div style="background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6D28D9;">
      <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 20px;">Summer Jam 2026</h3>
      <p style="color: #4b5563; margin: 0 0 8px 0;"><strong>Date:</strong> July 4, 2026</p>
      <p style="color: #4b5563; margin: 0;"><strong>Location:</strong> Piedmont Park, Atlanta, GA</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${BASE_URL}/events" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Event Details</a>
    </div>
  `)
);

// 19. Password Reset
await testEmail('Password Reset',
  'Reset Your Ologywood Password',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Password Reset Request 🔐</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">We received a request to reset your password. Click the button below to set a new password.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/reset-password?token=test123" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset Password</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
  `)
);

// 20. Payment Failed
await testEmail('Payment Failed',
  'Payment Failed: Action Required',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Payment Failed ⚠️</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">Your payment of <strong>$29.99 USD</strong> has failed.</p>
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> Insufficient funds</p>
      <p style="margin: 0;"><strong>Next retry:</strong> February 15, 2026</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/settings" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Update Payment Method</a>
    </div>
  `)
);

// 21. Newsletter Subscription
await testEmail('Newsletter Subscription',
  'Welcome to the Ologywood Newsletter!',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">You're Subscribed! 📬</h2>
    <p style="color: #374151;">Hi there,</p>
    <p style="color: #374151;">Thank you for subscribing to the Ologywood newsletter! You'll receive updates about new artists, events, and platform features.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Explore Ologywood</a>
    </div>
  `)
);

// 22. Venue Verification Request
await testEmail('Venue Verification Request',
  'Venue Verification: The Grand Theater',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Venue Verification Request 🏛️</h2>
    <p style="color: #374151;">Hi Admin,</p>
    <p style="color: #374151;">A new venue has requested verification:</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> The Grand Theater</p>
      <p style="margin: 0 0 8px 0;"><strong>Location:</strong> Atlanta, GA</p>
      <p style="margin: 0;"><strong>Submitted:</strong> April 2, 2026</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/admin" style="background: linear-gradient(135deg, #6D28D9 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Review in Admin</a>
    </div>
  `)
);

// 23. Venue Verification Confirmed
await testEmail('Venue Verification Confirmed',
  'Your Venue Has Been Verified!',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Venue Verified! ✅</h2>
    <p style="color: #374151;">Hi Test Venue,</p>
    <p style="color: #374151;">Congratulations! <strong>The Grand Theater</strong> has been verified on Ologywood. Your venue now has a verified badge visible to all artists.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${BASE_URL}/venue-dashboard" style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Go to Dashboard</a>
    </div>
  `)
);

// 24. Dispute Filed
await testEmail('Dispute Filed',
  'Dispute Filed: Booking #12345',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Dispute Filed</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">A dispute has been filed regarding Booking #12345.</p>
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0 0 8px 0;"><strong>Dispute ID:</strong> DSP-2026-001</p>
      <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> Performance not as described</p>
      <p style="margin: 0;"><strong>Status:</strong> Under Review</p>
    </div>
    <p style="color: #374151;">Our team will review this dispute and respond within 48 hours.</p>
  `)
);

// 25. Contact Form Confirmation
await testEmail('Contact Form Confirmation',
  'We received your message — Ologywood',
  wrapEmail(`
    <h2 style="color: #1f2937; margin: 0 0 16px 0;">Message Received 📩</h2>
    <p style="color: #374151;">Hi Test User,</p>
    <p style="color: #374151;">Thank you for reaching out! We've received your message and will get back to you within 24-48 hours.</p>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> General Inquiry</p>
      <p style="margin: 0; font-style: italic; color: #4b5563;">"I'm interested in learning more about Ologywood for my venue."</p>
    </div>
  `)
);

// ============================================================
// RESULTS SUMMARY
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

const successCount = results.filter(r => r.status.includes('SUCCESS')).length;
const failCount = results.filter(r => r.status.includes('FAILED')).length;

console.log(`\nTotal: ${results.length} | ✅ Success: ${successCount} | ❌ Failed: ${failCount}`);
console.log(`Success Rate: ${Math.round((successCount / results.length) * 100)}%\n`);

console.log('Detailed Results:');
console.log('-'.repeat(60));
for (const r of results) {
  const method = r.method ? ` (${r.method})` : '';
  const error = r.error ? ` — ${r.error.substring(0, 80)}` : '';
  console.log(`  ${r.status} ${r.num}. ${r.name}${method}${error}`);
}
console.log('-'.repeat(60));

if (failCount > 0) {
  console.log('\n⚠️  Some emails failed. Check the details above.');
} else {
  console.log('\n🎉 All emails sent successfully! Check your inbox at ' + TEST_EMAIL);
}
