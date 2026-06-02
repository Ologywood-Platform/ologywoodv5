import { describe, it, expect } from 'vitest';

describe('Google OAuth Routes', () => {
  const BASE_URL = 'http://localhost:3000';

  it('GET /api/auth/google should redirect to Google consent screen', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('client_id=');
    expect(location).toContain('redirect_uri=');
    expect(location).toContain('scope=openid+email+profile');
    expect(location).toContain('response_type=code');
    expect(location).toContain('state=');
  });

  it('GET /api/auth/google should include returnPath in state', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google?returnPath=/dashboard`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    
    // Extract state from URL
    const url = new URL(location!);
    const state = url.searchParams.get('state');
    expect(state).toBeTruthy();
    
    // Decode state and verify returnPath
    const decoded = JSON.parse(Buffer.from(state!, 'base64url').toString('utf-8'));
    expect(decoded.returnPath).toBe('/dashboard');
    expect(decoded.csrf).toBeTruthy();
  });

  it('GET /api/auth/google/callback without code should redirect with error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google/callback`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=NO_CODE');
  });

  it('GET /api/auth/google/callback with error param should redirect with that error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google/callback?error=access_denied`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=access_denied');
  });

  it('GET /api/auth/google/callback with invalid code should redirect with error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/google/callback?code=invalid_code_123`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=TOKEN_EXCHANGE_FAILED');
  });
});
