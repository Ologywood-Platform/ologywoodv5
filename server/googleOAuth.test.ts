import { describe, it, expect } from 'vitest';

describe('Google OAuth Configuration', () => {
  it('should have GOOGLE_CLIENT_ID configured', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe('');
    expect(clientId).toContain('.apps.googleusercontent.com');
  });

  it('should have GOOGLE_CLIENT_SECRET configured', () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe('');
    expect(clientSecret).toMatch(/^GOCSPX-/);
  });

  it('should be able to construct a valid Google OAuth URL', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = 'https://www.ologywood.com/api/auth/google/callback';
    const scopes = ['openid', 'email', 'profile'];
    
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId!);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    expect(url.toString()).toContain('accounts.google.com');
    expect(url.toString()).toContain(clientId);
    expect(url.toString()).toContain('openid');
  });
});
