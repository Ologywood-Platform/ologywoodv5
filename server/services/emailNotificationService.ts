import { toast } from 'sonner';

interface BookingConfirmationEmail {
  artistEmail: string;
  artistName: string;
  venueEmail: string;
  venueName: string;
  eventDate: string;
  eventLocation: string;
  bookingId: number;
  contractUrl?: string;
}

interface PaymentReceiptEmail {
  recipientEmail: string;
  recipientName: string;
  bookingId: number;
  amount: number;
  paymentDate: string;
  paymentId: string;
  invoiceUrl?: string;
}

export class EmailNotificationService {
  /**
   * Send booking confirmation email to both artist and venue
   */
  static async sendBookingConfirmation(data: BookingConfirmationEmail): Promise<boolean> {
    try {
      // In production, this would call SendGrid or another email service
      // For now, we'll simulate the email sending
      
      console.log(`[Email] Sending booking confirmation to ${data.artistEmail} and ${data.venueEmail}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
      console.log({
        type: 'BOOKING_CONFIRMATION',
        artist: {
          email: data.artistEmail,
          name: data.artistName,
        },
        venue: {
          email: data.venueEmail,
          name: data.venueName,
        },
        event: {
          date: data.eventDate,
          location: data.eventLocation,
        },
        bookingId: data.bookingId,
        contractUrl: data.contractUrl,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }
  }

  /**
   * Send payment receipt email
   */
  static async sendPaymentReceipt(data: PaymentReceiptEmail): Promise<boolean> {
    try {
      // In production, this would call SendGrid or another email service
      console.log(`[Email] Sending payment receipt to ${data.recipientEmail}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
      console.log({
        type: 'PAYMENT_RECEIPT',
        recipient: {
          email: data.recipientEmail,
          name: data.recipientName,
        },
        payment: {
          amount: data.amount,
          date: data.paymentDate,
          id: data.paymentId,
        },
        bookingId: data.bookingId,
        invoiceUrl: data.invoiceUrl,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send payment receipt email:', error);
      return false;
    }
  }

  /**
   * Send booking cancellation email
   */
  static async sendBookingCancellation(
    artistEmail: string,
    artistName: string,
    venueEmail: string,
    venueName: string,
    bookingId: number,
    reason?: string
  ): Promise<boolean> {
    try {
      console.log(`[Email] Sending cancellation notification to ${artistEmail} and ${venueEmail}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
      console.log({
        type: 'BOOKING_CANCELLATION',
        artist: { email: artistEmail, name: artistName },
        venue: { email: venueEmail, name: venueName },
        bookingId,
        reason,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return false;
    }
  }

  /**
   * Send reminder email before event
   */
  static async sendEventReminder(
    artistEmail: string,
    artistName: string,
    venueName: string,
    eventDate: string,
    eventLocation: string,
    bookingId: number
  ): Promise<boolean> {
    try {
      console.log(`[Email] Sending event reminder to ${artistEmail}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
      console.log({
        type: 'EVENT_REMINDER',
        artist: { email: artistEmail, name: artistName },
        venue: venueName,
        event: { date: eventDate, location: eventLocation },
        bookingId,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send event reminder email:', error);
      return false;
    }
  }
}
