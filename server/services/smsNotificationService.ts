import twilio from "twilio";
import { ENV } from "../_core/env";

export interface SMSNotificationData {
  recipientPhone: string;
  message: string;
  type: "booking_confirmation" | "contract_signed" | "booking_reminder" | "payment_received";
}

class SMSNotificationService {
  private twilioClient: any;
  private twilioPhoneNumber: string = "+1234567890";

  constructor() {
    // Initialize Twilio client if credentials are available
    if (ENV.twilioAccountSid && ENV.twilioAuthToken) {
      this.twilioClient = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
      this.twilioPhoneNumber = ENV.twilioPhoneNumber || "+1234567890";
    } else {
      this.twilioPhoneNumber = "+1234567890";
    }
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): boolean {
    // Basic validation - should be E.164 format (+1234567890)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmationSMS(data: SMSNotificationData): Promise<void> {
    if (!this.twilioClient) {
      
      return;
    }

    if (!this.validatePhoneNumber(data.recipientPhone)) {
      console.error("[SMS] Invalid phone number format:", data.recipientPhone);
      return;
    }

    const message = `🎵 Booking Confirmed! Your booking has been confirmed. Check your email for details and contract. - Ologywood`;

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: data.recipientPhone,
      });
      
    } catch (error) {
      console.error("[SMS] Failed to send booking confirmation:", error);
    }
  }

  /**
   * Send contract signed SMS
   */
  async sendContractSignedSMS(data: SMSNotificationData): Promise<void> {
    if (!this.twilioClient) {
      
      return;
    }

    if (!this.validatePhoneNumber(data.recipientPhone)) {
      console.error("[SMS] Invalid phone number format:", data.recipientPhone);
      return;
    }

    const message = `✍️ Contract Signed! Your contract has been signed. You're all set for your booking. - Ologywood`;

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: data.recipientPhone,
      });
      
    } catch (error) {
      console.error("[SMS] Failed to send contract signed SMS:", error);
    }
  }

  /**
   * Send booking reminder SMS
   */
  async sendBookingReminderSMS(data: SMSNotificationData): Promise<void> {
    if (!this.twilioClient) {
      
      return;
    }

    if (!this.validatePhoneNumber(data.recipientPhone)) {
      console.error("[SMS] Invalid phone number format:", data.recipientPhone);
      return;
    }

    const message = `📅 Booking Reminder! Your booking is coming up soon. Make sure everything is ready. - Ologywood`;

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: data.recipientPhone,
      });
      
    } catch (error) {
      console.error("[SMS] Failed to send booking reminder:", error);
    }
  }

  /**
   * Send payment received SMS
   */
  async sendPaymentReceivedSMS(data: SMSNotificationData): Promise<void> {
    if (!this.twilioClient) {
      
      return;
    }

    if (!this.validatePhoneNumber(data.recipientPhone)) {
      console.error("[SMS] Invalid phone number format:", data.recipientPhone);
      return;
    }

    const message = `💰 Payment Received! Your payment has been processed successfully. - Ologywood`;

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: data.recipientPhone,
      });
      
    } catch (error) {
      console.error("[SMS] Failed to send payment SMS:", error);
    }
  }

  /**
   * Send custom SMS
   */
  async sendCustomSMS(data: SMSNotificationData): Promise<void> {
    if (!this.twilioClient) {
      
      return;
    }

    if (!this.validatePhoneNumber(data.recipientPhone)) {
      console.error("[SMS] Invalid phone number format:", data.recipientPhone);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: data.message,
        from: this.twilioPhoneNumber,
        to: data.recipientPhone,
      });
      
    } catch (error) {
      console.error("[SMS] Failed to send custom SMS:", error);
    }
  }

  /**
   * Send batch SMS notifications
   */
  async sendBatchSMS(recipients: SMSNotificationData[]): Promise<{ sent: number; failed: number }> {
    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        switch (recipient.type) {
          case "booking_confirmation":
            return this.sendBookingConfirmationSMS(recipient);
          case "contract_signed":
            return this.sendContractSignedSMS(recipient);
          case "booking_reminder":
            return this.sendBookingReminderSMS(recipient);
          case "payment_received":
            return this.sendPaymentReceivedSMS(recipient);
          default:
            return this.sendCustomSMS(recipient);
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    
    return { sent, failed };
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!this.twilioClient && !!this.twilioPhoneNumber;
  }
}

export const smsNotificationService = new SMSNotificationService();

// Log SMS service status
if (!smsNotificationService.isConfigured()) {
}
