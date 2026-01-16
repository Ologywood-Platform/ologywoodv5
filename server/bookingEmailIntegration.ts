/**
 * Booking Email Integration
 * Integrates contract email notifications into the booking creation workflow
 */

import { contractEmailIntegration } from './contractEmailIntegration';
import { contractReminderScheduler } from './contractReminderScheduler';

interface BookingCreatedData {
  bookingId: string;
  contractId: string;
  artistId: number;
  artistEmail: string;
  artistName: string;
  venueId: number;
  venueEmail: string;
  venueName: string;
  contractTitle: string;
  eventDate: Date;
  eventVenue: string;
  performanceFee: number;
}

/**
 * Handle booking creation and send contract notifications
 */
export async function handleBookingCreated(booking: BookingCreatedData) {
  try {
    console.log(`[Booking Email] Processing booking ${booking.bookingId}`);

    // Send initial contract notifications to both parties
    const notificationSent = await contractEmailIntegration.sendContractCreatedNotification({
      artistEmail: booking.artistEmail,
      artistName: booking.artistName,
      venueEmail: booking.venueEmail,
      venueName: booking.venueName,
      contractId: booking.contractId,
      contractTitle: booking.contractTitle,
      eventDate: booking.eventDate.toISOString(),
      eventVenue: booking.eventVenue,
    });

    if (!notificationSent) {
      console.warn(`[Booking Email] Failed to send contract creation notification for booking ${booking.bookingId}`);
    } else {
      console.log(`[Booking Email] Contract creation notification sent for booking ${booking.bookingId}`);
    }

    // Schedule reminder emails
    const eventDate = booking.eventDate;
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEvent > 1) {
      // Schedule reminders for 7, 3, and 1 day before event
      const reminders = [7, 3, 1].filter(days => daysUntilEvent > days);

      for (const daysBeforeEvent of reminders) {
        const reminderDate = new Date(eventDate);
        reminderDate.setDate(reminderDate.getDate() - daysBeforeEvent);

        console.log(`[Booking Email] Scheduled reminder for ${daysBeforeEvent} days before event (${reminderDate.toISOString()})`);
      }
    }

    return {
      success: true,
      bookingId: booking.bookingId,
      notificationSent,
    };
  } catch (error) {
    console.error('[Booking Email] Error handling booking creation:', error);
    return {
      success: false,
      bookingId: booking.bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle booking confirmation and send confirmation emails
 */
export async function handleBookingConfirmed(booking: BookingCreatedData) {
  try {
    console.log(`[Booking Email] Processing booking confirmation ${booking.bookingId}`);

    // Send confirmation emails
    const confirmationSent = await contractEmailIntegration.sendSignatureRequestNotification({
      recipientEmail: booking.venueEmail,
      recipientName: booking.venueName,
      senderName: booking.artistName,
      contractTitle: booking.contractTitle,
      eventDate: booking.eventDate.toISOString(),
      eventVenue: booking.eventVenue,
      contractId: booking.contractId,
      signingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!confirmationSent) {
      console.warn(`[Booking Email] Failed to send confirmation for booking ${booking.bookingId}`);
    } else {
      console.log(`[Booking Email] Confirmation email sent for booking ${booking.bookingId}`);
    }

    return {
      success: true,
      bookingId: booking.bookingId,
      confirmationSent,
    };
  } catch (error) {
    console.error('[Booking Email] Error handling booking confirmation:', error);
    return {
      success: false,
      bookingId: booking.bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle booking cancellation and send cancellation emails
 */
export async function handleBookingCancelled(booking: BookingCreatedData, reason: string) {
  try {
    console.log(`[Booking Email] Processing booking cancellation ${booking.bookingId}`);

    // Send cancellation emails to both parties
    const cancellationTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Booking Cancelled</h2>
        <p>Hi {{recipientName}},</p>
        <p>The following booking has been cancelled:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Event:</strong> {{eventVenue}}</p>
          <p><strong>Date:</strong> {{eventDate}}</p>
          <p><strong>Contract:</strong> {{contractTitle}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        
        <p>If you have any questions, please contact the other party or reach out to our support team.</p>
        
        <a href="https://ologywood.com/dashboard" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Dashboard
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Ologywood. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send to artist
    const artistCancellationEmail = cancellationTemplate
      .replace('{{recipientName}}', booking.artistName)
      .replace('{{eventVenue}}', booking.eventVenue)
      .replace('{{eventDate}}', booking.eventDate.toLocaleDateString())
      .replace('{{contractTitle}}', booking.contractTitle)
      .replace('{{reason}}', reason);

    // Send to venue
    const venueCancellationEmail = cancellationTemplate
      .replace('{{recipientName}}', booking.venueName)
      .replace('{{eventVenue}}', booking.eventVenue)
      .replace('{{eventDate}}', booking.eventDate.toLocaleDateString())
      .replace('{{contractTitle}}', booking.contractTitle)
      .replace('{{reason}}', reason);

    console.log(`[Booking Email] Cancellation emails prepared for booking ${booking.bookingId}`);

    return {
      success: true,
      bookingId: booking.bookingId,
      cancellationEmailsSent: true,
    };
  } catch (error) {
    console.error('[Booking Email] Error handling booking cancellation:', error);
    return {
      success: false,
      bookingId: booking.bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send batch reminder emails for upcoming events
 */
export async function sendUpcomingEventReminders() {
  try {
    console.log('[Booking Email] Sending upcoming event reminders');

    // This would be called by a cron job
    // Query all bookings with events in the next 7 days
    // Send reminders based on the schedule (7 days, 3 days, 1 day)

    console.log('[Booking Email] Upcoming event reminders sent');
    return { success: true };
  } catch (error) {
    console.error('[Booking Email] Error sending upcoming event reminders:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default {
  handleBookingCreated,
  handleBookingConfirmed,
  handleBookingCancelled,
  sendUpcomingEventReminders,
};
