import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('server/routes/googleCalendarSync.ts', 'utf8');

describe('Google Calendar sync route security boundaries', () => {
  it('uses the approved origin for OAuth callback redirects instead of trusting forwarded hosts', () => {
    expect(source).toContain("import { trustedCheckoutOrigin } from '../services/trustedOrigin'");
    expect(source).toContain('trustedCheckoutOrigin(process.env.BASE_URL, requestOrigin)');
    expect(source).not.toContain('return `${proto}://${host}/api/calendar-sync/google/callback`');
  });

  it('does not log provider response bodies, calendar email, or raw exceptions', () => {
    expect(source).toContain("console.error('[Google Calendar Sync] Token exchange failed')");
    expect(source).toContain("console.error('[Google Calendar Sync] Events fetch failed')");
    expect(source).toContain("kind: err instanceof Error ? err.name : 'UnknownError'");
    expect(source).toContain("console.log('[Google Calendar Sync] Calendar connected')");
    expect(source).not.toContain('errBody');
    expect(source).not.toContain('errText');
    expect(source).not.toContain('(${googleEmail})');
    expect(source).not.toContain("console.error('[Google Calendar Sync] Callback error:', err)");
    expect(source).not.toContain("console.error('[Google Calendar Sync] Sync error:', err)");
  });

  it('keeps OAuth state/session binding and encrypted token storage', () => {
    expect(source).toContain('singleQueryString(req.query.code)');
    expect(source).not.toContain('req.query.code as string');
    expect(source).toContain('createOAuthState({ userId })');
    expect(source).toContain('verifyOAuthState(stateParam)');
    expect(source).toContain('if (callbackUser.id !== userId)');
    expect(source).toContain('encryptOAuthToken(tokens.access_token)');
    expect(source).toContain('decryptOAuthToken(String(integration.accessToken || \'\'))');
  });
});
