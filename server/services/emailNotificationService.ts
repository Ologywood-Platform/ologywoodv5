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
      
// Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
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
// Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
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
// Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
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
// Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email details
return true;
    } catch (error) {
      console.error('Failed to send event reminder email:', error);
      return false;
    }
  }
}
