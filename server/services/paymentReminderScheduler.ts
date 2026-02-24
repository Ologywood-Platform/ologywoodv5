/**
 * Payment Reminder Scheduler Service
 * Handles scheduling and sending final payment reminders
 * Sends reminder 7 days before event date when deposit has been paid
 */

import { getDb } from "../db";
import { bookings, users } from "../../drizzle/schema";
import { eq, and, lt, gte, isNull } from "drizzle-orm";
import { getFinalPaymentReminderEmailTemplate } from "./finalPaymentReminderEmail";
import { sendBookingReminderEmail } from "./emailService";

export interface PaymentReminderSchedulerOptions {
  daysBeforeEvent?: number;
  batchSize?: number;
}

/**
 * Check for bookings that need final payment reminders
 * Sends reminder 7 days before event if deposit is paid but balance is not
 */
export async function checkAndSendPaymentReminders(
  options: PaymentReminderSchedulerOptions = {}
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { daysBeforeEvent = 7, batchSize = 50 } = options;

  const db = await getDb();
  if (!db) {
    return { sent: 0, failed: 0, errors: ["Database not available"] };
  }

  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  try {
    // Calculate date range: events happening in exactly 7 days
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + daysBeforeEvent);

    const startOfDay = new Date(reminderDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reminderDate);
    endOfDay.setHours(23, 59, 59, 999);


    // Find bookings that:
    // 1. Have events in exactly 7 days
    // 2. Have deposit paid (status = 'deposit_paid')
    const bookingsNeedingReminder = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.eventDate, startOfDay),
          lt(bookings.eventDate, endOfDay),
          eq(bookings.paymentStatus, "deposit_paid")
        )
      )
      .limit(batchSize);


    // Process each booking
    for (const booking of bookingsNeedingReminder) {
      try {
        // Get venue user details
        const venueUser = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.venueId))
          .limit(1);

        if (venueUser.length === 0) {
          errors.push(`Venue user not found for booking ${booking.id}`);
          failed++;
          continue;
        }

        const venue = venueUser[0];
        const totalFee = booking.totalFee ? parseFloat(booking.totalFee.toString()) : 0;
        const remainingBalance = Math.round(totalFee * 0.5 * 100); // 50% remaining

        // Create payment link (adjust URL as needed)
        const paymentLink = `${process.env.FRONTEND_URL || "https://ologywood.com"}/booking/${booking.id}/payment`;

        // Get email template
        const emailTemplate = getFinalPaymentReminderEmailTemplate({
          recipientName: venue.name || "Venue Manager",
          artistName: "Artist",
          eventDate: booking.eventDate.toISOString(),
          eventLocation: "TBD",
          remainingBalance,
          currency: "USD",
          paymentLink,
          baseUrl: process.env.FRONTEND_URL || "https://ologywood.com",
        });

        // Send email using existing booking reminder email function
        try {
          const hoursUntilEvent = Math.floor(
            (booking.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
          );

          const venueEmail = venue.email || "noemail@example.com";
          await sendBookingReminderEmail(
            booking.venueId,
            venueEmail,
            {
              artistName: "Artist",
              venueName: venue.name || "Venue",
              eventDate: booking.eventDate.toLocaleDateString(),
              eventTime: booking.eventTime || "TBD",
              hoursUntilEvent,
            }
          );
        } catch (emailError) {
          const emailMsg = emailError instanceof Error ? emailError.message : String(emailError);
          errors.push(
            `Failed to send reminder for booking ${booking.id}: ${emailMsg}`
          );
          failed++;
          continue;
        }

        // Log that reminder was sent (just update timestamp)
        await db
          .update(bookings)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));

        sent++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Error processing booking ${booking.id}: ${errorMsg}`);
        failed++;
      }
    }


    return { sent, failed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Payment Reminder] Fatal error:", errorMsg);
    return {
      sent: 0,
      failed,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Manual trigger for sending payment reminders
 * Used for testing or manual intervention
 */
export async function triggerPaymentReminders(): Promise<{
  success: boolean;
  message: string;
  details: { sent: number; failed: number; errors: string[] };
}> {
  try {
    const result = await checkAndSendPaymentReminders();

    return {
      success: result.failed === 0,
      message: `Payment reminders: ${result.sent} sent, ${result.failed} failed`,
      details: result,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to trigger payment reminders: ${errorMsg}`,
      details: { sent: 0, failed: 0, errors: [errorMsg] },
    };
  }
}
