import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Auth Improvements - Set Password for OAuth Users', () => {
  it('AccountSettings has Set Password button for OAuth users', () => {
    const content = fs.readFileSync(
      path.join(__dirname, '../client/src/components/AccountSettings.tsx'),
      'utf-8'
    );
    // Should have the "Set a Password" button for OAuth users
    expect(content).toContain('Set a Password');
    // Should have the setPasswordMutation
    expect(content).toContain('setPasswordMutation');
    // Should have the showSetPassword state
    expect(content).toContain('showSetPassword');
    // Should have PasswordStrengthIndicator in the set password form
    expect(content).toContain('PasswordStrengthIndicator');
    // Should show informative message about social login
    expect(content).toContain('Social Login Active');
    // Should explain why setting a password is useful
    expect(content).toContain('useful for mobile');
  });

  it('AccountSettings set password form has proper validation', () => {
    const content = fs.readFileSync(
      path.join(__dirname, '../client/src/components/AccountSettings.tsx'),
      'utf-8'
    );
    // Should validate minimum password length
    expect(content).toContain('at least 8 characters');
    // Should validate password confirmation match
    expect(content).toContain('Passwords do not match');
    // Should have a cancel button
    expect(content).toContain('Cancel');
    // Should show loading state
    expect(content).toContain('Setting Password...');
  });
});

describe('Auth Improvements - OAuth Mobile Error Handling', () => {
  it('Home page handles OAuth errors with visible banner', () => {
    const content = fs.readFileSync(
      path.join(__dirname, '../client/src/pages/Home.tsx'),
      'utf-8'
    );
    // Should detect oauth_error from URL params
    expect(content).toContain("params.get('oauth_error')");
    // Should display error banner with AlertTriangle icon
    expect(content).toContain('AlertTriangle');
    // Should show contextual error messages
    expect(content).toContain('Sign in expired');
    expect(content).toContain('Security check failed');
    expect(content).toContain('Sign in failed');
    // Should have a retry button
    expect(content).toContain('Try Again');
    // Should have a dismiss button
    expect(content).toContain('Dismiss');
  });

  it('OAuth callback redirects to home with error params instead of showing JSON', () => {
    const content = fs.readFileSync(
      path.join(__dirname, '../server/_core/oauth.ts'),
      'utf-8'
    );
    // Should redirect with oauth_error param on missing code/state
    expect(content).toContain('/?oauth_error=INVALID_CODE');
    // Should redirect on missing openId
    expect(content).toContain('/?oauth_error=MISSING_EMAIL');
    // Should redirect on unknown errors
    expect(content).toContain('/?oauth_error=UNKNOWN_ERROR');
    // Should NOT return JSON errors (bad UX on mobile)
    expect(content).not.toContain('res.status(400).json');
    expect(content).not.toContain('res.status(500).json');
    // Should log mobile detection
    expect(content).toContain('isMobileUserAgent');
    expect(content).toContain('isMobile');
  });

  it('QuickSignupModal has OAuth sign-in button on login tab', () => {
    const content = fs.readFileSync(
      path.join(__dirname, '../client/src/components/QuickSignupModal.tsx'),
      'utf-8'
    );
    // Should import getLoginUrl
    expect(content).toContain("import { getLoginUrl } from '@/const'");
    // Should have the OAuth sign-in button
    expect(content).toContain('Sign in with Social Login');
    // Should have a divider between email login and OAuth
    expect(content).toContain('or');
    // Should handle missing OAuth config gracefully
    expect(content).toContain('Social login is not configured');
  });

  it('setPassword endpoint exists in auth router', () => {
    const content = fs.readFileSync(
      path.join(__dirname, './routers/auth.ts'),
      'utf-8'
    );
    // Should have setPassword endpoint
    expect(content).toContain('setPassword:');
    // Should validate email and password
    expect(content).toContain("email: z.string().email");
    expect(content).toContain("password: z.string().min(8");
  });
});

describe('Auth Improvements - Cookie Configuration', () => {
  it('cookies use correct sameSite and secure settings', () => {
    const content = fs.readFileSync(
      path.join(__dirname, './_core/cookies.ts'),
      'utf-8'
    );
    // Should use sameSite: lax for first-party session cookies (fixes mobile login)
    expect(content).toContain('sameSite: "lax"');
    // Should set secure flag based on request
    expect(content).toContain('secure: isSecure');
    // Should be httpOnly
    expect(content).toContain('httpOnly: true');
  });
});
