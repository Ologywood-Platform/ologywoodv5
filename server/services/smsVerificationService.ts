/**
 * SMS Verification & Two-Factor Authentication Service
 * Handles phone verification and 2FA for enhanced security
 */

export interface VerificationCode {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export interface TwoFactorSettings {
  enabled: boolean;
  method: 'sms' | 'email' | 'authenticator';
  phoneNumber?: string;
  backupCodes?: string[];
}

class SMSVerificationService {
  private static verificationStore = new Map<string, VerificationCode>();
  private static twoFactorStore = new Map<number, TwoFactorSettings>();

  /**
   * Generate a random 6-digit verification code
   */
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate backup codes for 2FA
   */
  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Send SMS verification code
   */
  static async sendVerificationCode(phoneNumber: string): Promise<{ code: string; expiresIn: number }> {
    try {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      this.verificationStore.set(phoneNumber, {
        code,
        phoneNumber,
        expiresAt,
        attempts: 0,
        verified: false,
      });

      console.log(`[SMS] Verification code sent to ${phoneNumber}: ${code}`);

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // const message = `Your Ologywood verification code is: ${code}. Valid for 10 minutes.`;
      // await smsClient.send({ to: phoneNumber, body: message });

      return {
        code, // In production, don't return the code
        expiresIn: 600, // 10 minutes in seconds
      };
    } catch (error) {
      console.error('[SMS] Error sending verification code:', error);
      throw error;
    }
  }

  /**
   * Verify SMS code
   */
  static async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const verification = this.verificationStore.get(phoneNumber);

      if (!verification) {
        console.log(`[SMS] No verification found for ${phoneNumber}`);
        return false;
      }

      // Check if code has expired
      if (new Date() > verification.expiresAt) {
        this.verificationStore.delete(phoneNumber);
        console.log(`[SMS] Verification code expired for ${phoneNumber}`);
        return false;
      }

      // Check attempt limit
      if (verification.attempts >= 3) {
        this.verificationStore.delete(phoneNumber);
        console.log(`[SMS] Too many attempts for ${phoneNumber}`);
        return false;
      }

      // Verify code
      if (verification.code === code) {
        verification.verified = true;
        console.log(`[SMS] Code verified for ${phoneNumber}`);
        return true;
      }

      verification.attempts++;
      console.log(`[SMS] Invalid code for ${phoneNumber}. Attempts: ${verification.attempts}`);
      return false;
    } catch (error) {
      console.error('[SMS] Error verifying code:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication for a user
   */
  static async enableTwoFactor(
    userId: number,
    phoneNumber: string,
    method: 'sms' | 'email' | 'authenticator' = 'sms'
  ): Promise<{ backupCodes: string[] }> {
    try {
      const backupCodes = this.generateBackupCodes();

      const settings: TwoFactorSettings = {
        enabled: true,
        method,
        phoneNumber: method === 'sms' ? phoneNumber : undefined,
        backupCodes,
      };

      this.twoFactorStore.set(userId, settings);

      console.log(`[2FA] Two-factor authentication enabled for user ${userId}`);

      return { backupCodes };
    } catch (error) {
      console.error('[2FA] Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication for a user
   */
  static async disableTwoFactor(userId: number): Promise<void> {
    try {
      this.twoFactorStore.delete(userId);
      console.log(`[2FA] Two-factor authentication disabled for user ${userId}`);
    } catch (error) {
      console.error('[2FA] Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Get 2FA settings for a user
   */
  static async getTwoFactorSettings(userId: number): Promise<TwoFactorSettings | null> {
    try {
      return this.twoFactorStore.get(userId) || null;
    } catch (error) {
      console.error('[2FA] Error getting 2FA settings:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code (SMS or backup code)
   */
  static async verify2FACode(userId: number, code: string): Promise<boolean> {
    try {
      const settings = this.twoFactorStore.get(userId);

      if (!settings || !settings.enabled) {
        console.log(`[2FA] 2FA not enabled for user ${userId}`);
        return false;
      }

      // Check if it's a backup code
      if (settings.backupCodes && settings.backupCodes.includes(code)) {
        // Remove used backup code
        settings.backupCodes = settings.backupCodes.filter((c) => c !== code);
        console.log(`[2FA] Backup code used for user ${userId}`);
        return true;
      }

      // If SMS method, verify SMS code
      if (settings.method === 'sms' && settings.phoneNumber) {
        return await this.verifyCode(settings.phoneNumber, code);
      }

      // TODO: Implement authenticator app verification (TOTP)
      // if (settings.method === 'authenticator') {
      //   return verifyTOTP(userId, code);
      // }

      return false;
    } catch (error) {
      console.error('[2FA] Error verifying 2FA code:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSMSNotification(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log(`[SMS] Notification sent to ${phoneNumber}: ${message}`);

      // TODO: Integrate with SMS service
      // const smsClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await smsClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber,
      // });
    } catch (error) {
      console.error('[SMS] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send SMS booking confirmation
   */
  static async sendBookingConfirmationSMS(
    phoneNumber: string,
    bookingDetails: {
      artistName: string;
      eventDate: string;
      bookingId: number;
    }
  ): Promise<void> {
    const message = `Your booking with ${bookingDetails.artistName} on ${bookingDetails.eventDate} is confirmed! Booking ID: ${bookingDetails.bookingId}. View details: ologywood.com/booking/${bookingDetails.bookingId}`;

    await this.sendSMSNotification(phoneNumber, message);
  }

  /**
   * Send SMS payment confirmation
   */
  static async sendPaymentConfirmationSMS(
    phoneNumber: string,
    paymentDetails: {
      amount: number;
      bookingId: number;
    }
  ): Promise<void> {
    const message = `Payment of $${paymentDetails.amount} received for booking #${paymentDetails.bookingId}. Thank you for using Ologywood!`;

    await this.sendSMSNotification(phoneNumber, message);
  }

  /**
   * Verify phone number ownership
   */
  static async verifyPhoneOwnership(phoneNumber: string, code: string): Promise<boolean> {
    try {
      return await this.verifyCode(phoneNumber, code);
    } catch (error) {
      console.error('[SMS] Error verifying phone ownership:', error);
      throw error;
    }
  }

  /**
   * Update phone number for 2FA
   */
  static async updatePhoneNumber(userId: number, newPhoneNumber: string): Promise<void> {
    try {
      const settings = this.twoFactorStore.get(userId);

      if (!settings) {
        throw new Error('2FA not enabled for this user');
      }

      settings.phoneNumber = newPhoneNumber;
      this.twoFactorStore.set(userId, settings);

      console.log(`[2FA] Phone number updated for user ${userId}`);
    } catch (error) {
      console.error('[2FA] Error updating phone number:', error);
      throw error;
    }
  }
}

export { SMSVerificationService };
export default SMSVerificationService;
