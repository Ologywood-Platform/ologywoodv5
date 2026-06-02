import { describe, it, expect } from 'vitest';

describe('Spotify OAuth Routes', () => {
  const BASE_URL = 'http://localhost:3000';

  it('GET /api/auth/spotify should redirect to Spotify consent screen', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/spotify`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('accounts.spotify.com/authorize');
    expect(location).toContain('client_id=');
    expect(location).toContain('redirect_uri=');
    expect(location).toContain('scope=user-read-email');
    expect(location).toContain('response_type=code');
    expect(location).toContain('state=');
    expect(location).toContain('show_dialog=true');
  });

  it('GET /api/auth/spotify should include returnPath in state', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/spotify?returnPath=/dashboard`, {
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

  it('GET /api/auth/spotify/callback without code should redirect with error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/spotify/callback`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=NO_CODE');
  });

  it('GET /api/auth/spotify/callback with error param should redirect with that error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/spotify/callback?error=access_denied`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=access_denied');
  });

  it('GET /api/auth/spotify/callback with invalid code should redirect with error', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/spotify/callback?code=invalid_code_123`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    const location = response.headers.get('location');
    expect(location).toContain('oauth_error=TOKEN_EXCHANGE_FAILED');
  });
});
