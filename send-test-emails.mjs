#!/usr/bin/env node

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';
const TEST_EMAIL = 'garychisolm30@gmail.com';
const BASE_URL = process.env.BASE_URL || 'https://ologywood.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not configured');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const emailTemplates = [
  {
    name: 'Booking Request',
    subject: 'New Booking Request - Luna Moonlight',
    html: `
      <h2>You have a new booking request!</h2>
      <p><strong>Artist:</strong> Luna Moonlight</p>
      <p><strong>Venue:</strong> The Blue Note Jazz Club</p>
      <p><strong>Event Date:</strong> March 15, 2026</p>
      <p><strong>Event Details:</strong> Live jazz performance for private event</p>
      <p><strong>Total Fee:</strong> $500</p>
      <p><a href="${BASE_URL}/bookings">View Booking Request</a></p>
    `,
  },
  {
    name: 'Booking Confirmed',
    subject: 'Booking Confirmed - The Velvet Collective',
    html: `
      <h2>Your booking has been confirmed!</h2>
      <p><strong>Artist:</strong> The Velvet Collective</p>
      <p><strong>Event Date:</strong> April 20, 2026</p>
      <p><strong>Venue:</strong> The Riverside Theater</p>
      <p><strong>Status:</strong> Confirmed</p>
      <p><a href="${BASE_URL}/bookings">View Booking Details</a></p>
    `,
  },
  {
    name: 'Booking Cancelled',
    subject: 'Booking Cancelled - G.Chizo',
    html: `
      <h2>Your booking has been cancelled</h2>
      <p><strong>Artist:</strong> G.Chizo</p>
      <p><strong>Event Date:</strong> May 10, 2026</p>
      <p><strong>Reason:</strong> Artist unavailable</p>
      <p>We apologize for any inconvenience. Please browse other artists or contact support.</p>
      <p><a href="${BASE_URL}/browse">Browse Artists</a></p>
    `,
  },
  {
    name: 'Booking Reminder',
    subject: 'Reminder: Your Event is Coming Up - Sofia Strings',
    html: `
      <h2>Event Reminder</h2>
      <p><strong>Artist:</strong> Sofia Strings</p>
      <p><strong>Event Date:</strong> June 5, 2026 at 7:00 PM</p>
      <p><strong>Venue:</strong> The Grand Ballroom</p>
      <p>Your event is coming up in 7 days. Please confirm all details and ensure the artist has access to the venue.</p>
      <p><a href="${BASE_URL}/bookings">View Booking</a></p>
    `,
  },
  {
    name: 'Payment Received',
    subject: 'Payment Received - The Rhythm Kings',
    html: `
      <h2>Payment Received</h2>
      <p><strong>Artist:</strong> The Rhythm Kings</p>
      <p><strong>Amount:</strong> $750.00</p>
      <p><strong>Date:</strong> February 23, 2026</p>
      <p><strong>Status:</strong> Completed</p>
      <p>Your payment has been successfully processed. A receipt has been sent to your email.</p>
    `,
  },
];

async function sendTestEmails() {
  console.log(`📧 Sending ${emailTemplates.length} test emails to ${TEST_EMAIL}...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const template of emailTemplates) {
    try {
      const msg = {
        to: TEST_EMAIL,
        from: SENDER_EMAIL,
        subject: `[TEST] ${template.subject}`,
        html: template.html,
        text: `Test email: ${template.name}`,
      };

      await sgMail.send(msg);
      console.log(`✅ ${template.name} - Sent successfully`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${template.name} - Failed:`, error.message);
      failureCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${emailTemplates.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${emailTemplates.length}`);
  console.log(`\n📬 All test emails sent to: ${TEST_EMAIL}`);
}

sendTestEmails().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
