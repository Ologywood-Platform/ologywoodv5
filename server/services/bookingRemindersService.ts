import { getDb } from '../db';
import { bookings } from '../drizzle/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
// TODO: implement email service with proper sendEmail function

/**
 * Automated Booking Reminders Service
 * Sends reminders to artists and venues at 7, 3, and 1 day before events
 */

interface ReminderConfig {
  daysBeforeEvent: number;
  emailTemplate: string;
  subject: string;
}

const reminderConfigs: ReminderConfig[] = [
  {
    daysBeforeEvent: 7,
    emailTemplate: 'booking-reminder-7days',
    subject: 'Upcoming Event in 7 Days - Ologywood',
  },
  {
    daysBeforeEvent: 3,
    emailTemplate: 'booking-reminder-3days',
    subject: 'Reminder: Your Event is in 3 Days - Ologywood',
  },
  {
    daysBeforeEvent: 1,
    emailTemplate: 'booking-reminder-1day',
    subject: 'Final Reminder: Your Event is Tomorrow - Ologywood',
  },
];

/**
 * Send booking reminders for upcoming events
 */
export async function sendBookingReminders() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log('[Booking Reminders] Starting reminder service...');

    // Process each reminder configuration
    for (const config of reminderConfigs) {
      await processRemindersForDays(db, config);
    }

    console.log('[Booking Reminders] Reminder service completed successfully');
  } catch (error) {
    console.error('[Booking Reminders] Error sending reminders:', error);
  }
}

/**
 * Process reminders for a specific number of days before event
 */
async function processRemindersForDays(db: any, config: ReminderConfig) {
  try {
    // Calculate the date range for events
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + config.daysBeforeEvent);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(
      `[Booking Reminders] Processing reminders for ${config.daysBeforeEvent} days before (${startOfDay.toDateString()})`
    );

    // Get all confirmed bookings on the target date
    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          gte(bookings.eventDate, startOfDay),
          lte(bookings.eventDate, endOfDay)
        )
      );

    console.log(`[Booking Reminders] Found ${upcomingBookings.length} bookings for reminders`);

    // Send reminders for each booking
    for (const booking of upcomingBookings) {
      await sendBookingReminder(booking, config);
    }
  } catch (error) {
    console.error(`[Booking Reminders] Error processing ${config.daysBeforeEvent}-day reminders:`, error);
  }
}

/**
 * Send reminder email for a specific booking
 */
async function sendBookingReminder(booking: any, config: ReminderConfig) {
  try {
    // Get artist and venue details
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Format event details
    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const eventTime = booking.eventTime || 'TBD';

    // Send reminder to artist
    if (booking.artistId) {
      await sendEmail({
        to: booking.artistEmail || 'artist@example.com',
        subject: config.subject,
        template: config.emailTemplate,
        data: {
          artistName: booking.artistName || 'Artist',
          venueName: booking.venueName || 'Venue',
          eventDate,
          eventTime,
          eventDetails: booking.eventDetails || 'No details provided',
          bookingId: booking.id,
          daysUntilEvent: config.daysBeforeEvent,
        },
      });

      console.log(
        `[Booking Reminders] Sent ${config.daysBeforeEvent}-day reminder to artist for booking ${booking.id}`
      );
    }

    // Send reminder to venue
    if (booking.venueId) {
      await sendEmail({
        to: booking.venueEmail || 'venue@example.com',
        subject: config.subject,
        template: config.emailTemplate,
        data: {
          venueName: booking.venueName || 'Venue',
          artistName: booking.artistName || 'Artist',
          eventDate,
          eventTime,
          eventDetails: booking.eventDetails || 'No details provided',
          bookingId: booking.id,
          daysUntilEvent: config.daysBeforeEvent,
        },
      });

      console.log(
        `[Booking Reminders] Sent ${config.daysBeforeEvent}-day reminder to venue for booking ${booking.id}`
      );
    }
  } catch (error) {
    console.error(`[Booking Reminders] Error sending reminder for booking ${booking.id}:`, error);
  }
}

/**
 * Schedule booking reminders to run daily at 8 AM
 */
export function scheduleBookingReminders() {
  // Run at 8 AM every day
  const schedule = require('node-schedule');

  schedule.scheduleJob('0 8 * * *', async () => {
    console.log('[Booking Reminders] Running scheduled reminder job...');
    await sendBookingReminders();
  });

  console.log('[Booking Reminders] Scheduled to run daily at 8 AM');
}

/**
 * Email template for 7-day reminder
 */
export const reminderTemplate7Days = `
<h2>Upcoming Event in 7 Days!</h2>
<p>Hi {{artistName}}/{{venueName}},</p>
<p>This is a friendly reminder that your booking with {{venueName}}/{{artistName}} is coming up in 7 days!</p>
<p><strong>Event Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{eventDate}}</li>
  <li><strong>Time:</strong> {{eventTime}}</li>
  <li><strong>Details:</strong> {{eventDetails}}</li>
</ul>
<p>Please make sure to confirm all details and prepare accordingly.</p>
<p><a href="https://ologywood.com/bookings/{{bookingId}}">View Booking Details</a></p>
`;

/**
 * Email template for 3-day reminder
 */
export const reminderTemplate3Days = `
<h2>Reminder: Your Event is in 3 Days!</h2>
<p>Hi {{artistName}}/{{venueName}},</p>
<p>Your booking with {{venueName}}/{{artistName}} is happening in just 3 days!</p>
<p><strong>Event Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{eventDate}}</li>
  <li><strong>Time:</strong> {{eventTime}}</li>
  <li><strong>Details:</strong> {{eventDetails}}</li>
</ul>
<p>Please confirm your attendance and reach out if you have any questions.</p>
<p><a href="https://ologywood.com/bookings/{{bookingId}}">View Booking Details</a></p>
`;

/**
 * Email template for 1-day reminder
 */
export const reminderTemplate1Day = `
<h2>Final Reminder: Your Event is Tomorrow!</h2>
<p>Hi {{artistName}}/{{venueName}},</p>
<p>Your booking with {{venueName}}/{{artistName}} is happening tomorrow!</p>
<p><strong>Event Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{eventDate}}</li>
  <li><strong>Time:</strong> {{eventTime}}</li>
  <li><strong>Details:</strong> {{eventDetails}}</li>
</ul>
<p>Please make sure you're ready and contact {{venueName}}/{{artistName}} if you have any last-minute questions.</p>
<p><a href="https://ologywood.com/bookings/{{bookingId}}">View Booking Details</a></p>
`;
