import * as db from "../db";
import { smsNotificationService } from "./smsNotificationService";
import * as email from "../email";
import { TRPCError } from "@trpc/server";

interface BookingReminder {
  bookingId: number;
  artistId: number;
  venueId: number;
  bookingDate: Date;
  artistEmail: string;
  venueEmail: string;
  artistPhone?: string;
  venuePhone?: string;
  eventName: string;
  eventLocation: string;
}

export const bookingReminderService = {
  /**
   * Schedule a reminder for 24 hours before booking
   */
  async scheduleReminder(bookingId: number): Promise<void> {
    try {
      const booking = await db.getBookingById(bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      const bookingDate = new Date(booking.eventDate);
      const reminderTime = new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000);
      const now = new Date();

      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        const delay = reminderTime.getTime() - now.getTime();
        
        // Schedule the reminder (in production, use a job queue like Bull or Agenda)
        setTimeout(() => {
          this.sendReminder(bookingId).catch(err => {
            console.error(`Failed to send reminder for booking ${bookingId}:`, err);
          });
        }, delay);
      }
    } catch (error) {
      console.error("Error scheduling reminder:", error);
    }
  },

  /**
   * Send reminder SMS and email
   */
  async sendReminder(bookingId: number): Promise<void> {
    try {
      const booking = await db.getBookingById(bookingId);
      if (!booking || booking.status !== "confirmed") {
        return; // Don't send reminder if booking is not confirmed
      }

      const artist = await db.getArtistProfileById(booking.artistId);
      const venue = await db.getVenueProfileById(booking.venueId);

      if (!artist || !venue) {
        throw new Error("Artist or venue not found");
      }

      const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Send email to artist
      if (artist.email) {
        await email.sendEmail({
          to: artist.email,
          subject: `Reminder: Your booking at ${venue.venueName} is tomorrow!`,
          html: `
            <h2>Booking Reminder</h2>
            <p>Hi ${artist.artistName},</p>
            <p>This is a reminder that you have a confirmed booking tomorrow:</p>
            <ul>
              <li><strong>Venue:</strong> ${venue.venueName}</li>
              <li><strong>Location:</strong> ${venue.location}</li>
              <li><strong>Date & Time:</strong> ${eventDate}</li>
              <li><strong>Fee:</strong> $${booking.fee}</li>
            </ul>
            <p>Please arrive 30 minutes early for setup. If you have any questions, contact the venue directly.</p>
            <p>Good luck with your performance!</p>
          `,
        });
      }

      // Send email to venue
      if (venue.email) {
        await email.sendEmail({
          to: venue.email,
          subject: `Reminder: ${artist.artistName} is performing tomorrow!`,
          html: `
            <h2>Booking Reminder</h2>
            <p>Hi ${venue.venueName},</p>
            <p>This is a reminder that you have a confirmed booking tomorrow:</p>
            <ul>
              <li><strong>Artist:</strong> ${artist.artistName}</li>
              <li><strong>Date & Time:</strong> ${eventDate}</li>
              <li><strong>Fee:</strong> $${booking.fee}</li>
            </ul>
            <p>Make sure everything is set up and ready for the performance.</p>
          `,
        });
      }

      // Send SMS if phone numbers are available
      if (artist.phoneNumber) {
        try {
          await smsNotificationService.sendBookingReminderSMS({
            recipientPhone: artist.phoneNumber,
            message: `Reminder: Your booking at ${venue.venueName} is tomorrow at ${eventDate}. See you then!`,
            type: "booking_reminder",
          });
        } catch (err) {
          console.error("Failed to send SMS to artist:", err);
        }
      }

      if (venue.phoneNumber) {
        try {
          await smsNotificationService.sendBookingReminderSMS({
            recipientPhone: venue.phoneNumber,
            message: `Reminder: ${artist.artistName} is performing tomorrow at ${eventDate}. Get ready!`,
            type: "booking_reminder",
          });
        } catch (err) {
          console.error("Failed to send SMS to venue:", err);
        }
      }

      console.log(`Booking reminder sent for booking ${bookingId}`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send reminder",
      });
    }
  },

  /**
   * Get all upcoming bookings that need reminders
   */
  async getUpcomingBookingsForReminders(): Promise<any[]> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextDay = new Date(tomorrow.getTime() + 60 * 60 * 1000);

      // Get bookings confirmed for tomorrow
      const bookings = await db.query(
        `SELECT * FROM bookings WHERE status = 'confirmed' AND eventDate BETWEEN ? AND ?`,
        [tomorrow, nextDay]
      );

      return bookings || [];
    } catch (error) {
      console.error("Error getting upcoming bookings:", error);
      return [];
    }
  },

  /**
   * Process all pending reminders (call this periodically)
   */
  async processPendingReminders(): Promise<void> {
    try {
      const bookings = await this.getUpcomingBookingsForReminders();
      
      for (const booking of bookings) {
        await this.sendReminder(booking.id);
      }

      console.log(`Processed ${bookings.length} booking reminders`);
    } catch (error) {
      console.error("Error processing reminders:", error);
    }
  },
};
