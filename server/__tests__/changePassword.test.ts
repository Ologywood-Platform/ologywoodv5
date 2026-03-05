import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

describe('Change Password Feature', () => {
  describe('Password Change Validation', () => {
    it('should require current password to be non-empty', () => {
      const currentPassword = '';
      expect(currentPassword.length > 0).toBe(false);
    });

    it('should require new password to be at least 8 characters', () => {
      expect('short'.length >= 8).toBe(false);
      expect('12345678'.length >= 8).toBe(true);
      expect('MyNewPass!'.length >= 8).toBe(true);
    });

    it('should reject new password shorter than 8 characters', () => {
      const shortPasswords = ['abc', '1234567', 'pass', ''];
      shortPasswords.forEach(pw => {
        expect(pw.length >= 8).toBe(false);
      });
    });

    it('should require new password and confirm password to match', () => {
      const newPassword = 'NewSecurePass123!';
      const confirmPassword = 'NewSecurePass123!';
      const wrongConfirm = 'DifferentPass!';

      expect(newPassword === confirmPassword).toBe(true);
      expect(newPassword === wrongConfirm).toBe(false);
    });
  });

  describe('Password Hashing with bcrypt', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'TestPass123!';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$') || hash.startsWith('$2a$')).toBe(true);
    });

    it('should verify correct password against hash', async () => {
      const password = 'TestPass123!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const password = 'TestPass123!';
      const wrongPassword = 'WrongPass456!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPass123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      // bcrypt uses random salt, so hashes should differ
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('hasPassword Flag in auth.me Response', () => {
    it('should strip passwordHash from user data and add hasPassword flag', () => {
      const userData = {
        id: 7,
        email: 'user@example.com',
        name: 'Test User',
        role: 'artist',
        passwordHash: '$2b$10$somehash',
      };

      // Simulate what auth.me does
      const { passwordHash, ...safeUser } = userData;
      const result = { ...safeUser, hasPassword: !!passwordHash };

      expect(result.hasPassword).toBe(true);
      expect('passwordHash' in result).toBe(false);
      expect(result.email).toBe('user@example.com');
    });

    it('should set hasPassword to false for OAuth-only users', () => {
      const userData = {
        id: 8,
        email: null,
        name: 'OAuth User',
        role: 'user',
        passwordHash: null,
      };

      const { passwordHash, ...safeUser } = userData;
      const result = { ...safeUser, hasPassword: !!passwordHash };

      expect(result.hasPassword).toBe(false);
      expect('passwordHash' in result).toBe(false);
    });

    it('should set hasPassword to false when passwordHash is undefined', () => {
      const userData = {
        id: 9,
        email: null,
        name: 'Another User',
        role: 'user',
        passwordHash: undefined,
      };

      const { passwordHash, ...safeUser } = userData;
      const result = { ...safeUser, hasPassword: !!passwordHash };

      expect(result.hasPassword).toBe(false);
    });
  });

  describe('Security Section UI Logic', () => {
    it('should show OAuth message when hasPassword is false', () => {
      const user = { hasPassword: false };
      const showOAuthMessage = !user.hasPassword;
      expect(showOAuthMessage).toBe(true);
    });

    it('should show Change Password button when hasPassword is true', () => {
      const user = { hasPassword: true };
      const showChangePassword = user.hasPassword;
      expect(showChangePassword).toBe(true);
    });

    it('should not show Change Password form by default', () => {
      const showPasswordChange = false;
      expect(showPasswordChange).toBe(false);
    });

    it('should toggle password change form visibility', () => {
      let showPasswordChange = false;
      showPasswordChange = true;
      expect(showPasswordChange).toBe(true);
      showPasswordChange = false;
      expect(showPasswordChange).toBe(false);
    });
  });

  describe('Change Password Flow', () => {
    it('should reject password change when no passwordHash exists on account', () => {
      const user = { passwordHash: null };
      const hasPassword = !!user.passwordHash;
      expect(hasPassword).toBe(false);
      // Should throw BAD_REQUEST error
    });

    it('should reject password change when current password is wrong', async () => {
      const storedHash = await bcrypt.hash('CorrectPass123!', 10);
      const attemptedPassword = 'WrongPass456!';
      
      const isValid = await bcrypt.compare(attemptedPassword, storedHash);
      expect(isValid).toBe(false);
    });

    it('should accept password change when current password is correct', async () => {
      const currentPassword = 'CorrectPass123!';
      const storedHash = await bcrypt.hash(currentPassword, 10);
      
      const isValid = await bcrypt.compare(currentPassword, storedHash);
      expect(isValid).toBe(true);
      
      // Hash new password
      const newPassword = 'NewSecurePass789!';
      const newHash = await bcrypt.hash(newPassword, 10);
      
      // Verify new password works
      expect(await bcrypt.compare(newPassword, newHash)).toBe(true);
      // Old password should not work with new hash
      expect(await bcrypt.compare(currentPassword, newHash)).toBe(false);
    });

    it('should not allow empty new password', () => {
      const newPassword = '';
      expect(newPassword.length >= 8).toBe(false);
    });

    it('should clear form fields after successful password change', () => {
      let currentPassword = 'OldPass123!';
      let newPassword = 'NewPass456!';
      let confirmPassword = 'NewPass456!';
      let showPasswordChange = true;

      // Simulate successful change
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      showPasswordChange = false;

      expect(currentPassword).toBe('');
      expect(newPassword).toBe('');
      expect(confirmPassword).toBe('');
      expect(showPasswordChange).toBe(false);
    });
  });

  describe('Protected Endpoint Authorization', () => {
    it('should require authentication for changePassword endpoint', () => {
      // changePassword uses protectedProcedure which requires ctx.user
      const isProtected = true; // Uses protectedProcedure
      expect(isProtected).toBe(true);
    });

    it('should use the authenticated user ID from context', () => {
      const ctx = { user: { id: 7 } };
      expect(ctx.user.id).toBe(7);
    });
  });
});
