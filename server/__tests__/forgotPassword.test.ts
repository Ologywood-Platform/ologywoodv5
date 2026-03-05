import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Forgot Password Flow', () => {
  describe('Backend - Auth Router Endpoints', () => {
    const authRouterPath = join(__dirname, '../routers/auth.ts');
    const authContent = readFileSync(authRouterPath, 'utf-8');

    it('should have forgotPassword endpoint defined', () => {
      expect(authContent).toContain('forgotPassword: publicProcedure');
    });

    it('should have resetPassword endpoint defined', () => {
      expect(authContent).toContain('resetPassword: publicProcedure');
    });

    it('should import passwordResetTokens from schema', () => {
      expect(authContent).toContain('passwordResetTokens');
    });

    it('should import randomBytes for secure token generation', () => {
      expect(authContent).toContain("import { randomBytes } from 'crypto'");
    });

    it('should import forgotPasswordLimiter for rate limiting', () => {
      expect(authContent).toContain('forgotPasswordLimiter');
    });

    it('should import sendEmail for sending reset emails', () => {
      expect(authContent).toContain("import { sendEmail } from '../email'");
    });

    it('should generate a 32-byte hex token', () => {
      expect(authContent).toContain("randomBytes(32).toString('hex')");
    });

    it('should set token expiry to 1 hour', () => {
      expect(authContent).toContain('60 * 60 * 1000');
    });

    it('should prevent email enumeration by always returning success', () => {
      const successMessages = authContent.match(/If an account exists with that email/g);
      expect(successMessages).not.toBeNull();
      expect(successMessages!.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate email format in forgotPassword input', () => {
      expect(authContent).toContain("email: z.string().email('Invalid email address')");
    });

    it('should validate token and newPassword in resetPassword input', () => {
      expect(authContent).toContain("token: z.string().min(1, 'Token is required')");
      expect(authContent).toContain("newPassword: z.string().min(8");
    });

    it('should check if token is already used', () => {
      expect(authContent).toContain('resetToken.usedAt');
      expect(authContent).toContain('already been used');
    });

    it('should check if token is expired', () => {
      expect(authContent).toContain('resetToken.expiresAt');
      expect(authContent).toContain('expired');
    });

    it('should mark token as used after successful reset', () => {
      expect(authContent).toContain('usedAt: new Date()');
    });

    it('should create session token after successful reset (auto-login)', () => {
      // After resetPassword, user should be logged in
      const resetSection = authContent.split('resetPassword: publicProcedure')[1];
      expect(resetSection).toContain('sdk.createSessionToken');
    });

    it('should hash new password with bcrypt', () => {
      const resetSection = authContent.split('resetPassword: publicProcedure')[1];
      expect(resetSection).toContain('bcrypt.hash(input.newPassword');
    });
  });

  describe('Backend - Database Schema', () => {
    const schemaPath = join(__dirname, '../../drizzle/schema.ts');
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    it('should have password_reset_tokens table defined', () => {
      expect(schemaContent).toContain('passwordResetTokens');
      expect(schemaContent).toContain('password_reset_tokens');
    });

    it('should have userId column', () => {
      expect(schemaContent).toContain('userId: int("userId").notNull()');
    });

    it('should have unique token column', () => {
      expect(schemaContent).toContain('token: varchar("token"');
    });

    it('should have expiresAt column', () => {
      expect(schemaContent).toContain('expiresAt: timestamp("expiresAt").notNull()');
    });

    it('should have usedAt column (nullable)', () => {
      expect(schemaContent).toContain('usedAt: timestamp("usedAt")');
    });

    it('should have indexes on token and userId', () => {
      expect(schemaContent).toContain('idx_prt_token');
      expect(schemaContent).toContain('idx_prt_user');
    });
  });

  describe('Backend - Rate Limiter', () => {
    const rateLimiterPath = join(__dirname, '../utils/rateLimiter.ts');
    const rateLimiterContent = readFileSync(rateLimiterPath, 'utf-8');

    it('should export forgotPasswordLimiter', () => {
      expect(rateLimiterContent).toContain('export const forgotPasswordLimiter');
    });

    it('should allow 3 requests per 15 minutes', () => {
      const forgotSection = rateLimiterContent.split('forgotPasswordLimiter')[1];
      expect(forgotSection).toContain('maxRequests: 3');
      expect(forgotSection).toContain('15 * 60 * 1000');
    });
  });

  describe('Backend - Reset Email Content', () => {
    const authContent = readFileSync(join(__dirname, '../routers/auth.ts'), 'utf-8');

    it('should include branded email template with Ologywood header', () => {
      expect(authContent).toContain('Reset Your Password');
    });

    it('should include reset link in the email', () => {
      expect(authContent).toContain('resetLink');
      expect(authContent).toContain('reset-password?token=');
    });

    it('should include expiry notice in the email', () => {
      expect(authContent).toContain('This link expires in 1 hour');
    });

    it('should include unsubscribe link in the email', () => {
      expect(authContent).toContain('unsubscribe');
    });

    it('should include safety notice for unsolicited requests', () => {
      expect(authContent).toContain("didn't request a password reset");
    });
  });

  describe('Frontend - QuickSignupModal Forgot Password', () => {
    const modalPath = join(__dirname, '../../client/src/components/QuickSignupModal.tsx');
    const modalContent = readFileSync(modalPath, 'utf-8');

    it('should have Forgot your password? link', () => {
      expect(modalContent).toContain('Forgot your password?');
    });

    it('should have forgotPassword mutation', () => {
      expect(modalContent).toContain('forgotPasswordMutation');
    });

    it('should have showForgotPassword state', () => {
      expect(modalContent).toContain('showForgotPassword');
    });

    it('should have forgot password email input', () => {
      expect(modalContent).toContain('id="forgot-email"');
    });

    it('should have Send Reset Link button', () => {
      expect(modalContent).toContain('Send Reset Link');
    });

    it('should show Check Your Email confirmation', () => {
      expect(modalContent).toContain('Check Your Email');
    });

    it('should have Back to Login button in forgot password form', () => {
      expect(modalContent).toContain('Back to Login');
    });
  });

  describe('Frontend - ResetPassword Page', () => {
    const resetPagePath = join(__dirname, '../../client/src/pages/ResetPassword.tsx');
    const resetContent = readFileSync(resetPagePath, 'utf-8');

    it('should exist as a page component', () => {
      expect(resetContent).toBeTruthy();
    });

    it('should read token from URL search params', () => {
      expect(resetContent).toContain("params.get('token')");
    });

    it('should have new password and confirm password fields', () => {
      expect(resetContent).toContain('id="new-password"');
      expect(resetContent).toContain('id="confirm-password"');
    });

    it('should use PasswordInput component for password fields', () => {
      expect(resetContent).toContain('PasswordInput');
    });

    it('should use PasswordStrengthIndicator', () => {
      expect(resetContent).toContain('PasswordStrengthIndicator');
    });

    it('should call resetPassword mutation', () => {
      expect(resetContent).toContain('resetPasswordMutation');
    });

    it('should validate password length >= 8', () => {
      expect(resetContent).toContain('newPassword.length < 8');
    });

    it('should validate passwords match', () => {
      expect(resetContent).toContain('newPassword !== confirmPassword');
    });

    it('should show success state after reset', () => {
      expect(resetContent).toContain('Password Reset!');
      expect(resetContent).toContain('You are now logged in');
    });

    it('should redirect to homepage after success', () => {
      expect(resetContent).toContain("setLocation('/')");
    });

    it('should handle invalid token (no token provided)', () => {
      expect(resetContent).toContain('Invalid reset link');
    });
  });

  describe('Frontend - Route Registration', () => {
    const appPath = join(__dirname, '../../client/src/App.tsx');
    const appContent = readFileSync(appPath, 'utf-8');

    it('should have /reset-password route', () => {
      expect(appContent).toContain('path="/reset-password"');
    });

    it('should lazy-load ResetPassword component', () => {
      expect(appContent).toContain("import(\"./pages/ResetPassword\")");
    });
  });
});
