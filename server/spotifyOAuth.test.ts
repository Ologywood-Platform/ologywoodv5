import { describe, it, expect } from 'vitest';

describe('Spotify OAuth Configuration', () => {
  it('should have SPOTIFY_CLIENT_ID configured', () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe('');
    expect(clientId).toHaveLength(32); // Spotify client IDs are 32 hex chars
  });

  it('should have SPOTIFY_CLIENT_SECRET configured', () => {
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe('');
    expect(clientSecret).toHaveLength(32); // Spotify client secrets are 32 hex chars
  });

  it('should be able to construct a valid Spotify OAuth URL', () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = 'https://www.ologywood.com/api/auth/spotify/callback';
    const scopes = ['user-read-email', 'user-read-private'];

    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id', clientId!);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('show_dialog', 'true');

    expect(url.toString()).toContain('accounts.spotify.com/authorize');
    expect(url.toString()).toContain(clientId);
    expect(url.toString()).toContain('user-read-email');
  });
});
