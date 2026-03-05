import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Password Visibility Toggle', () => {
  describe('PasswordInput Component', () => {
    const componentPath = join(__dirname, '../../client/src/components/ui/password-input.tsx');
    const componentContent = readFileSync(componentPath, 'utf-8');

    it('should exist as a reusable component', () => {
      expect(componentContent).toBeTruthy();
    });

    it('should import Eye and EyeOff icons from lucide-react', () => {
      expect(componentContent).toContain('Eye');
      expect(componentContent).toContain('EyeOff');
    });

    it('should toggle between password and text input types', () => {
      expect(componentContent).toContain("showPassword ? 'text' : 'password'");
    });

    it('should have an aria-label for accessibility', () => {
      expect(componentContent).toContain('Hide password');
      expect(componentContent).toContain('Show password');
    });

    it('should use useState for toggle state', () => {
      expect(componentContent).toContain('useState(false)');
      expect(componentContent).toContain('setShowPassword');
    });

    it('should use button type=button to prevent form submission', () => {
      expect(componentContent).toContain('type="button"');
    });

    it('should use tabIndex -1 to prevent tab focus on toggle button', () => {
      expect(componentContent).toContain('tabIndex={-1}');
    });

    it('should use forwardRef for ref forwarding', () => {
      expect(componentContent).toContain('React.forwardRef');
    });

    it('should have displayName set', () => {
      expect(componentContent).toContain("PasswordInput.displayName = 'PasswordInput'");
    });
  });

  describe('QuickSignupModal Integration', () => {
    const modalPath = join(__dirname, '../../client/src/components/QuickSignupModal.tsx');
    const modalContent = readFileSync(modalPath, 'utf-8');

    it('should import PasswordInput component', () => {
      expect(modalContent).toContain("import { PasswordInput } from '@/components/ui/password-input'");
    });

    it('should use PasswordInput for signup password field', () => {
      expect(modalContent).toContain('id="signup-password"');
      // Should NOT have type="password" on PasswordInput (it handles that internally)
      const signupPasswordSection = modalContent.split('id="signup-password"')[1]?.split('/>')[0] || '';
      expect(signupPasswordSection).not.toContain('type="password"');
    });

    it('should use PasswordInput for signup confirm password field', () => {
      expect(modalContent).toContain('id="signup-confirm-password"');
    });

    it('should use PasswordInput for login password field', () => {
      expect(modalContent).toContain('id="login-password"');
    });

    it('should use PasswordInput for set-password field', () => {
      expect(modalContent).toContain('id="set-password"');
    });

    it('should use PasswordInput for set-confirm-password field', () => {
      expect(modalContent).toContain('id="set-confirm-password"');
    });

    it('should not have any raw type=password Input elements', () => {
      // All password fields should use PasswordInput, not Input with type="password"
      const inputPasswordMatches = modalContent.match(/type="password"/g);
      expect(inputPasswordMatches).toBeNull();
    });
  });

  describe('AccountSettings Integration', () => {
    const settingsPath = join(__dirname, '../../client/src/components/AccountSettings.tsx');
    const settingsContent = readFileSync(settingsPath, 'utf-8');

    it('should import PasswordInput component', () => {
      expect(settingsContent).toContain("import { PasswordInput } from './ui/password-input'");
    });

    it('should use PasswordInput for current password field', () => {
      expect(settingsContent).toContain('id="currentPassword"');
      const currentPwSection = settingsContent.split('id="currentPassword"')[1]?.split('/>')[0] || '';
      expect(currentPwSection).not.toContain('type="password"');
    });

    it('should use PasswordInput for new password field', () => {
      expect(settingsContent).toContain('id="newPassword"');
    });

    it('should use PasswordInput for confirm password field', () => {
      expect(settingsContent).toContain('id="confirmPassword"');
    });

    it('should not have any raw type=password Input elements in password change form', () => {
      // Extract the password change section
      const passwordSection = settingsContent.split('currentPassword')[1]?.split('confirmPassword')[1]?.split('</div>')[0] || '';
      expect(passwordSection).not.toContain('type="password"');
    });
  });
});
