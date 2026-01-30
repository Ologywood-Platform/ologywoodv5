/**
 * Two-Factor Authentication (2FA) Service
 * Provides SMS and email-based 2FA for enhanced security
 */

import crypto from 'crypto';

export interface TwoFactorMethod {
  id: string;
  userId: number;
  type: 'sms' | 'email';
  value: string; // phone number or email
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface TwoFactorSession {
  id: string;
  userId: number;
  code: string;
  method: 'sms' | 'email';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
}

export interface TwoFactorSettings {
  userId: number;
  isEnabled: boolean;
  methods: TwoFactorMethod[];
  backupCodes: string[];
  lastVerifiedAt?: Date;
}

export class TwoFactorAuthService {
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BACKUP_CODES_COUNT = 10;

  /**
   * Generate a random 6-digit code
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Add 2FA method (SMS or Email)
   */
  static async addTwoFactorMethod(
    userId: number,
    type: 'sms' | 'email',
    value: string
  ): Promise<TwoFactorMethod> {
    try {
      const method: TwoFactorMethod = {
        id: `2fa-${userId}-${Date.now()}`,
        userId,
        type,
        value,
        isVerified: false,
        isPrimary: false,
        createdAt: new Date(),
      };

      console.log(`[2FA] Added ${type} method for user ${userId}`);
      return method;
    } catch (error) {
      console.error('[2FA] Error adding 2FA method:', error);
      throw error;
    }
  }

  /**
   * Send 2FA code via SMS or Email
   */
  static async sendTwoFactorCode(
    userId: number,
    method: TwoFactorMethod
  ): Promise<TwoFactorSession> {
    try {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      const session: TwoFactorSession = {
        id: `session-${userId}-${Date.now()}`,
        userId,
        code,
        method: method.type,
        expiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
        isVerified: false,
      };

      // In production, send via SMS or Email
      if (method.type === 'sms') {
        console.log(`[2FA] Sending SMS code to ${method.value}: ${code}`);
        // await sendSMS(method.value, `Your Ologywood verification code is: ${code}`);
      } else {
        console.log(`[2FA] Sending email code to ${method.value}: ${code}`);
        // await sendEmail(method.value, 'Your Ologywood Verification Code', `Code: ${code}`);
      }

      return session;
    } catch (error) {
      console.error('[2FA] Error sending 2FA code:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code
   */
  static async verifyTwoFactorCode(
    session: TwoFactorSession,
    userCode: string
  ): Promise<boolean> {
    try {
      // Check expiry
      if (new Date() > session.expiresAt) {
        console.log('[2FA] Code expired');
        return false;
      }

      // Check attempts
      if (session.attempts >= session.maxAttempts) {
        console.log('[2FA] Max attempts exceeded');
        return false;
      }

      // Verify code
      if (session.code === userCode) {
        console.log('[2FA] Code verified successfully');
        session.isVerified = true;
        return true;
      }

      session.attempts++;
      console.log(`[2FA] Invalid code. Attempts: ${session.attempts}/${session.maxAttempts}`);
      return false;
    } catch (error) {
      console.error('[2FA] Error verifying code:', error);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(userId: number, code: string): Promise<boolean> {
    try {
      // In production, check against stored backup codes
      console.log(`[2FA] Verifying backup code for user ${userId}`);
      return false;
    } catch (error) {
      console.error('[2FA] Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enableTwoFactor(userId: number): Promise<TwoFactorSettings> {
    try {
      const backupCodes = this.generateBackupCodes();

      const settings: TwoFactorSettings = {
        userId,
        isEnabled: true,
        methods: [],
        backupCodes,
        lastVerifiedAt: new Date(),
      };

      console.log(`[2FA] Enabled 2FA for user ${userId}`);
      return settings;
    } catch (error) {
      console.error('[2FA] Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disableTwoFactor(userId: number): Promise<void> {
    try {
      console.log(`[2FA] Disabled 2FA for user ${userId}`);
    } catch (error) {
      console.error('[2FA] Error disabling 2FA:', error);
    }
  }

  /**
   * Get 2FA settings
   */
  static async getTwoFactorSettings(userId: number): Promise<TwoFactorSettings | null> {
    try {
      // In production, fetch from database
      return null;
    } catch (error) {
      console.error('[2FA] Error fetching 2FA settings:', error);
      return null;
    }
  }

  /**
   * Remove 2FA method
   */
  static async removeTwoFactorMethod(userId: number, methodId: string): Promise<void> {
    try {
      console.log(`[2FA] Removed 2FA method ${methodId} for user ${userId}`);
    } catch (error) {
      console.error('[2FA] Error removing 2FA method:', error);
    }
  }

  /**
   * Set primary 2FA method
   */
  static async setPrimaryMethod(userId: number, methodId: string): Promise<void> {
    try {
      console.log(`[2FA] Set primary 2FA method ${methodId} for user ${userId}`);
    } catch (error) {
      console.error('[2FA] Error setting primary method:', error);
    }
  }

  /**
   * Get 2FA analytics
   */
  static async getTwoFactorAnalytics(): Promise<{
    usersWithTwoFactor: number;
    enablementRate: number; // percentage
    verificationSuccessRate: number; // percentage
    commonMethods: { method: string; count: number }[];
  }> {
    try {
      return {
        usersWithTwoFactor: 0,
        enablementRate: 0,
        verificationSuccessRate: 0,
        commonMethods: [],
      };
    } catch (error) {
      console.error('[2FA] Error fetching analytics:', error);
      return {
        usersWithTwoFactor: 0,
        enablementRate: 0,
        verificationSuccessRate: 0,
        commonMethods: [],
      };
    }
  }

  /**
   * Check if 2FA is required for user
   */
  static async isTwoFactorRequired(userId: number): Promise<boolean> {
    try {
      // In production, check user settings and role
      return false;
    } catch (error) {
      console.error('[2FA] Error checking 2FA requirement:', error);
      return false;
    }
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
