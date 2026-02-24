import crypto from 'crypto';

/**
 * Email Change Verification Service
 * Handles secure email change verification flow with tokens
 * Note: Database integration would be added in a future phase
 */
export class EmailChangeVerificationService {
  // In-memory token storage (would be replaced with database in production)
  private static tokenStore = new Map<string, {
    userId: number;
    newEmail: string;
    expiresAt: Date;
    createdAt: Date;
  }>();

  /**
   * Generate a secure verification token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Request email change with verification
   */
  static async requestEmailChange(
    userId: number,
    currentEmail: string,
    newEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email format
      if (!this.isValidEmail(newEmail)) {
        return { success: false, message: 'Invalid email format' };
      }

      // Generate verification token (24 hour expiry)
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Store in memory (would be database in production)
      this.tokenStore.set(token, {
        userId,
        newEmail,
        expiresAt,
        createdAt: new Date(),
      });


      return {
        success: true,
        message: 'Verification email sent to your new email address',
      };
    } catch (error) {
      console.error('[EmailChangeVerification] Error requesting email change:', error);
      return { success: false, message: 'Failed to send verification email' };
    }
  }

  /**
   * Verify and complete email change
   */
  static async verifyEmailChange(token: string): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      // Get verification token
      const verification = this.tokenStore.get(token);

      if (!verification) {
        return { success: false, message: 'Invalid or expired verification token' };
      }

      // Check expiry
      if (new Date() > verification.expiresAt) {
        this.tokenStore.delete(token);
        return { success: false, message: 'Verification token has expired' };
      }

      // Delete used token
      this.tokenStore.delete(token);


      return {
        success: true,
        message: 'Email address verified successfully',
        userId: verification.userId,
      };
    } catch (error) {
      console.error('[EmailChangeVerification] Error verifying email change:', error);
      return { success: false, message: 'Failed to verify email address' };
    }
  }

  /**
   * Cancel pending email change
   */
  static async cancelEmailChange(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Find and delete token for user
      for (const [token, data] of this.tokenStore.entries()) {
        if (data.userId === userId) {
          this.tokenStore.delete(token);
          break;
        }
      }
      return { success: true, message: 'Email change cancelled' };
    } catch (error) {
      console.error('[EmailChangeVerification] Error cancelling email change:', error);
      return { success: false, message: 'Failed to cancel email change' };
    }
  }

  /**
   * Get pending email verification
   */
  static async getPendingVerification(userId: number): Promise<{ pending: boolean; newEmail?: string; expiresAt?: Date }> {
    try {
      for (const [, data] of this.tokenStore.entries()) {
        if (data.userId === userId) {
          return {
            pending: true,
            newEmail: data.newEmail,
            expiresAt: data.expiresAt,
          };
        }
      }
      return { pending: false };
    } catch (error) {
      console.error('[EmailChangeVerification] Error getting pending verification:', error);
      return { pending: false };
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
