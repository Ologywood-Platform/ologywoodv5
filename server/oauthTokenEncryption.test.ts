import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { decryptOAuthToken, encryptOAuthToken, isEncryptedOAuthToken } from './services/oauthTokenEncryption';

const originalKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  else process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = originalKey;
});

describe('OAuth token encryption at rest', () => {
  it('stores non-empty access and refresh tokens as randomized AES-GCM envelopes', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = '44'.repeat(32);
    const first = encryptOAuthToken('google-access-token');
    const second = encryptOAuthToken('google-access-token');
    expect(isEncryptedOAuthToken(first)).toBe(true);
    expect(first).not.toBe('google-access-token');
    expect(first).not.toBe(second);
    expect(decryptOAuthToken(first)).toBe('google-access-token');
  });

  it('rejects tampering and wrong keys without returning plaintext', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = '55'.repeat(32);
    const encrypted = encryptOAuthToken('google-refresh-token');
    const [iv, tag, payload] = encrypted.slice('enc:v1:'.length).split('.');
    expect(iv).toBeTruthy();
    const tamperedPayload = `${payload[0] === 'A' ? 'B' : 'A'}${payload.slice(1)}`;
    expect(() => decryptOAuthToken(`enc:v1:${iv}.${tag}.${tamperedPayload}`)).toThrow();
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = '66'.repeat(32);
    expect(() => decryptOAuthToken(encrypted)).toThrow();
  });

  it('keeps empty optional tokens and legacy plaintext rows readable', () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = '77'.repeat(32);
    expect(encryptOAuthToken('')).toBe('');
    expect(decryptOAuthToken('')).toBe('');
    expect(decryptOAuthToken('legacy-google-token')).toBe('legacy-google-token');
  });

  it('fails closed for new writes when no dedicated or compatible project key exists', () => {
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
    delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
    expect(() => encryptOAuthToken('token')).toThrow(/encryption is not configured/i);
  });

  it('encrypts Google Calendar writes and decrypts only at provider boundaries', () => {
    const source = readFileSync('server/routes/googleCalendarSync.ts', 'utf8');
    expect(source).toContain('accessToken: encryptOAuthToken(tokens.access_token)');
    expect(source).toContain('refreshToken: tokens.refresh_token ? encryptOAuthToken(tokens.refresh_token)');
    expect(source).toContain('refresh_token: decryptOAuthToken');
    expect(source).toContain('let accessToken = decryptOAuthToken');
  });
});
