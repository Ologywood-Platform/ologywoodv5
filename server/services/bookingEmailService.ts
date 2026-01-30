/**
 * Booking Email Service
 * Manages booking confirmation, reminder, and notification emails
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface BookingEmail {
  id: string;
  bookingId: number;
  recipientEmail: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'payment_receipt' | 'contract_signing';
  subject: string;
  htmlContent: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface EmailSchedule {
  id: string;
  bookingId: number;
  type: 'reminder' | 'follow_up';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

export class BookingEmailService {
  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(
    bookingId: number,
    artistEmail: string,
    venueEmail: string,
    bookingDetails: any
  ): Promise<BookingEmail[]> {
    try {
      const emails: BookingEmail[] = [];

      // Artist confirmation
      const artistEmail_obj: BookingEmail = {
        id: `email-${bookingId}-artist-${Date.now()}`,
        bookingId,
        recipientEmail: artistEmail,
        type: 'confirmation',
        subject: `Booking Confirmed: ${bookingDetails.eventName}`,
        htmlContent: this.generateBookingConfirmationHTML(bookingDetails, 'artist'),
        status: 'pending',
      };

      // Venue confirmation
      const venueEmail_obj: BookingEmail = {
        id: `email-${bookingId}-venue-${Date.now()}`,
        bookingId,
        recipientEmail: venueEmail,
        type: 'confirmation',
        subject: `Booking Confirmed: ${bookingDetails.eventName}`,
        htmlContent: this.generateBookingConfirmationHTML(bookingDetails, 'venue'),
        status: 'pending',
      };

      emails.push(artistEmail_obj, venueEmail_obj);

      console.log(`[Email] Sending booking confirmation emails for booking ${bookingId}`);
      // In production, send via SendGrid or similar
      // await sendEmail(artistEmail, artistEmail_obj.subject, artistEmail_obj.htmlContent);
      // await sendEmail(venueEmail, venueEmail_obj.subject, venueEmail_obj.htmlContent);

      return emails;
    } catch (error) {
      console.error('[Email] Error sending booking confirmation:', error);
      throw error;
    }
  }

  /**
   * Send payment receipt email
   */
  static async sendPaymentReceipt(
    bookingId: number,
    email: string,
    paymentDetails: any
  ): Promise<BookingEmail> {
    try {
      const emailRecord: BookingEmail = {
        id: `email-${bookingId}-receipt-${Date.now()}`,
        bookingId,
        recipientEmail: email,
        type: 'payment_receipt',
        subject: `Payment Receipt - Booking #${bookingId}`,
        htmlContent: this.generatePaymentReceiptHTML(paymentDetails),
        status: 'pending',
      };

      console.log(`[Email] Sending payment receipt for booking ${bookingId}`);
      // In production, send via SendGrid or similar
      // await sendEmail(email, emailRecord.subject, emailRecord.htmlContent);

      return emailRecord;
    } catch (error) {
      console.error('[Email] Error sending payment receipt:', error);
      throw error;
    }
  }

  /**
   * Send contract signing reminder
   */
  static async sendContractSigningReminder(
    bookingId: number,
    email: string,
    contractDetails: any
  ): Promise<BookingEmail> {
    try {
      const emailRecord: BookingEmail = {
        id: `email-${bookingId}-contract-${Date.now()}`,
        bookingId,
        recipientEmail: email,
        type: 'contract_signing',
        subject: `Action Required: Sign Your Contract - Booking #${bookingId}`,
        htmlContent: this.generateContractReminderHTML(contractDetails),
        status: 'pending',
      };

      console.log(`[Email] Sending contract signing reminder for booking ${bookingId}`);
      // In production, send via SendGrid or similar

      return emailRecord;
    } catch (error) {
      console.error('[Email] Error sending contract reminder:', error);
      throw error;
    }
  }

  /**
   * Send event day reminder
   */
  static async sendEventDayReminder(
    bookingId: number,
    email: string,
    eventDetails: any
  ): Promise<BookingEmail> {
    try {
      const emailRecord: BookingEmail = {
        id: `email-${bookingId}-reminder-${Date.now()}`,
        bookingId,
        recipientEmail: email,
        type: 'reminder',
        subject: `Reminder: ${eventDetails.eventName} is Tomorrow!`,
        htmlContent: this.generateEventDayReminderHTML(eventDetails),
        status: 'pending',
      };

      console.log(`[Email] Sending event day reminder for booking ${bookingId}`);
      // In production, send via SendGrid or similar

      return emailRecord;
    } catch (error) {
      console.error('[Email] Error sending event day reminder:', error);
      throw error;
    }
  }

  /**
   * Send booking cancellation email
   */
  static async sendCancellationEmail(
    bookingId: number,
    artistEmail: string,
    venueEmail: string,
    cancellationDetails: any
  ): Promise<BookingEmail[]> {
    try {
      const emails: BookingEmail[] = [];

      const artistEmail_obj: BookingEmail = {
        id: `email-${bookingId}-cancel-artist-${Date.now()}`,
        bookingId,
        recipientEmail: artistEmail,
        type: 'cancellation',
        subject: `Booking Cancelled: ${cancellationDetails.eventName}`,
        htmlContent: this.generateCancellationHTML(cancellationDetails, 'artist'),
        status: 'pending',
      };

      const venueEmail_obj: BookingEmail = {
        id: `email-${bookingId}-cancel-venue-${Date.now()}`,
        bookingId,
        recipientEmail: venueEmail,
        type: 'cancellation',
        subject: `Booking Cancelled: ${cancellationDetails.eventName}`,
        htmlContent: this.generateCancellationHTML(cancellationDetails, 'venue'),
        status: 'pending',
      };

      emails.push(artistEmail_obj, venueEmail_obj);

      console.log(`[Email] Sending cancellation emails for booking ${bookingId}`);

      return emails;
    } catch (error) {
      console.error('[Email] Error sending cancellation email:', error);
      throw error;
    }
  }

  /**
   * Schedule reminder emails
   */
  static async scheduleReminders(bookingId: number, eventDate: Date): Promise<EmailSchedule[]> {
    try {
      const schedules: EmailSchedule[] = [];

      // 1 day before
      const oneDayBefore = new Date(eventDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      schedules.push({
        id: `schedule-${bookingId}-1day-${Date.now()}`,
        bookingId,
        type: 'reminder',
        scheduledFor: oneDayBefore,
        sent: false,
      });

      // 1 hour before
      const oneHourBefore = new Date(eventDate);
      oneHourBefore.setHours(oneHourBefore.getHours() - 1);

      schedules.push({
        id: `schedule-${bookingId}-1hour-${Date.now()}`,
        bookingId,
        type: 'reminder',
        scheduledFor: oneHourBefore,
        sent: false,
      });

      console.log(`[Email] Scheduled ${schedules.length} reminders for booking ${bookingId}`);
      return schedules;
    } catch (error) {
      console.error('[Email] Error scheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Generate booking confirmation HTML
   */
  private static generateBookingConfirmationHTML(details: any, recipient: 'artist' | 'venue'): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Booking Confirmed!</h2>
          <p>Your booking has been confirmed. Here are the details:</p>
          <ul>
            <li><strong>Event:</strong> ${details.eventName}</li>
            <li><strong>Date:</strong> ${details.eventDate}</li>
            <li><strong>Location:</strong> ${details.location}</li>
            <li><strong>Rate:</strong> $${details.rate}</li>
          </ul>
          <p>Please review the contract and sign it to complete the booking.</p>
          <p>Best regards,<br>Ologywood Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate payment receipt HTML
   */
  private static generatePaymentReceiptHTML(details: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Payment Receipt</h2>
          <p>Thank you for your payment!</p>
          <ul>
            <li><strong>Amount:</strong> $${details.amount}</li>
            <li><strong>Date:</strong> ${details.date}</li>
            <li><strong>Transaction ID:</strong> ${details.transactionId}</li>
          </ul>
          <p>Best regards,<br>Ologywood Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate contract reminder HTML
   */
  private static generateContractReminderHTML(details: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Action Required: Sign Your Contract</h2>
          <p>Your contract is ready to sign. Please review and sign it to finalize the booking.</p>
          <p><a href="${details.contractLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Sign Contract</a></p>
          <p>Best regards,<br>Ologywood Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate event day reminder HTML
   */
  private static generateEventDayReminderHTML(details: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Event Reminder</h2>
          <p>${details.eventName} is happening tomorrow!</p>
          <ul>
            <li><strong>Time:</strong> ${details.eventTime}</li>
            <li><strong>Location:</strong> ${details.location}</li>
            <li><strong>Contact:</strong> ${details.contactInfo}</li>
          </ul>
          <p>Best regards,<br>Ologywood Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generate cancellation HTML
   */
  private static generateCancellationHTML(details: any, recipient: 'artist' | 'venue'): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Booking Cancelled</h2>
          <p>The booking for ${details.eventName} has been cancelled.</p>
          <p><strong>Reason:</strong> ${details.reason}</p>
          <p>If you have any questions, please contact support.</p>
          <p>Best regards,<br>Ologywood Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Get email analytics
   */
  static async getEmailAnalytics(): Promise<{
    totalEmailsSent: number;
    deliveryRate: number; // percentage
    openRate: number; // percentage
    clickRate: number; // percentage
    failureRate: number; // percentage
  }> {
    try {
      return {
        totalEmailsSent: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        failureRate: 0,
      };
    } catch (error) {
      console.error('[Email] Error fetching analytics:', error);
      return {
        totalEmailsSent: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        failureRate: 0,
      };
    }
  }
}

export const bookingEmailService = new BookingEmailService();
