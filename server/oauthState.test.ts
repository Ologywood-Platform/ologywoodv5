import crypto from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createOAuthState, OAUTH_STATE_TTL_MS, safeOAuthReturnPath, verifyOAuthState } from './services/oauthState';
import { readFileSync } from 'node:fs';

const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

describe('OAuth state security', () => {
  it('round-trips a signed payload and preserves a safe relative return path', () => {
    process.env.JWT_SECRET = 'oauth-state-test-secret';
    const state = createOAuthState({ userId: 7, returnPath: '/workspace?tab=calendar' });
    expect(verifyOAuthState(state)).toMatchObject({ userId: 7, returnPath: '/workspace?tab=calendar' });
  });

  it('rejects tampered signatures and expired payloads', () => {
    process.env.JWT_SECRET = 'oauth-state-test-secret';
    const state = createOAuthState({ returnPath: '/dashboard' });
    const [payload, signature] = state.split('.');
    expect(verifyOAuthState(`${payload}.${signature.slice(0, -1)}x`)).toBeNull();

    const expiredPayload = Buffer.from(JSON.stringify({ version: 1, issuedAt: Date.now() - OAUTH_STATE_TTL_MS - 1, returnPath: '/dashboard' })).toString('base64url');
    const expiredSignature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(expiredPayload).digest('base64url');
    expect(verifyOAuthState(`${expiredPayload}.${expiredSignature}`)).toBeNull();
  });

  it('normalizes external, protocol-relative, backslash, and control-character paths to root', () => {
    expect(safeOAuthReturnPath('https://attacker.example/phish')).toBe('/');
    expect(safeOAuthReturnPath('//attacker.example/phish')).toBe('/');
    expect(safeOAuthReturnPath('/\\\\attacker')).toBe('/');
    expect(safeOAuthReturnPath('/dashboard\u0000')).toBe('/');
    expect(safeOAuthReturnPath('/artist/adonis')).toBe('/artist/adonis');
  });

  it('routes Google, Spotify, and Calendar callbacks through the signed-state helper and fixed provider errors', () => {
    const google = readFileSync('server/routes/googleAuth.ts', 'utf8');
    const spotify = readFileSync('server/routes/spotifyAuth.ts', 'utf8');
    const calendar = readFileSync('server/routes/googleCalendarSync.ts', 'utf8');
    expect(google).toContain('verifyOAuthState(stateParam)');
    expect(spotify).toContain('verifyOAuthState(stateParam)');
    expect(calendar).toContain('verifyOAuthState(stateParam)');
    expect(google).toContain('oauth_error=PROVIDER_DENIED');
    expect(spotify).toContain('oauth_error=PROVIDER_DENIED');
    expect(calendar).toContain('reason=provider_denied');
    expect(google).not.toContain('oauth_error=${error}');
    expect(spotify).not.toContain('oauth_error=${error}');
  });
});
