import { describe, it, expect } from 'vitest';

describe('OAuth Redirect Base URL Configuration', () => {
  it('should have VITE_OAUTH_REDIRECT_BASE_URL set', () => {
    const redirectBaseUrl = process.env.VITE_OAUTH_REDIRECT_BASE_URL;
    expect(redirectBaseUrl).toBeDefined();
    expect(redirectBaseUrl).not.toBe('');
  });

  it('should use a valid HTTPS URL', () => {
    const redirectBaseUrl = process.env.VITE_OAUTH_REDIRECT_BASE_URL!;
    expect(redirectBaseUrl).toMatch(/^https:\/\//);
  });

  it('should use the manus.space domain for OAuth callbacks', () => {
    const redirectBaseUrl = process.env.VITE_OAUTH_REDIRECT_BASE_URL!;
    // The manus.space domain is pre-registered with Manus OAuth
    expect(redirectBaseUrl).toContain('manus.space');
  });

  it('should construct a valid OAuth callback URL', () => {
    const redirectBaseUrl = process.env.VITE_OAUTH_REDIRECT_BASE_URL!;
    const callbackUrl = `${redirectBaseUrl}/api/oauth/callback`;
    expect(callbackUrl).toMatch(/^https:\/\/.*\/api\/oauth\/callback$/);
  });
});
