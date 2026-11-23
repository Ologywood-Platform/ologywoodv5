import { describe, expect, it } from 'vitest';
import { getOAuthSessionCookieOptions, getSessionCookieOptions } from './_core/cookies';

function requestWith(protocol: string, forwardedProto?: string) {
  return {
    protocol,
    headers: forwardedProto ? { 'x-forwarded-proto': forwardedProto } : {},
  } as any;
}

describe('session cookie options', () => {
  it('keeps ordinary first-party HTTPS sessions SameSite=Lax', () => {
    expect(getSessionCookieOptions(requestWith('https'))).toMatchObject({
      secure: true,
      sameSite: 'lax',
    });
  });

  it('uses SameSite=None and Secure for HTTPS OAuth callbacks', () => {
    expect(getOAuthSessionCookieOptions(requestWith('http', 'https'))).toMatchObject({
      secure: true,
      sameSite: 'none',
    });
  });

  it('keeps local HTTP OAuth sessions compatible with development', () => {
    expect(getOAuthSessionCookieOptions(requestWith('http'))).toMatchObject({
      secure: false,
      sameSite: 'lax',
    });
  });
});
