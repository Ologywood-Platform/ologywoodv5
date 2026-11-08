import crypto from 'node:crypto';
import { ENV } from '../_core/env';

const STATE_VERSION = 1;
const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_RETURN_PATH_LENGTH = 512;

export type OAuthStatePayload = Record<string, unknown> & {
  returnPath?: string;
  issuedAt?: number;
  version?: number;
};

function stateSecret(): string {
  return process.env.JWT_SECRET || process.env.OAUTH_STATE_SECRET || ENV.cookieSecret || '';
}

function sign(encodedPayload: string): string {
  const secret = stateSecret();
  if (!secret) throw new Error('OAuth state signing is not configured');
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function safeOAuthReturnPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_RETURN_PATH_LENGTH) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, 'https://ologywood.invalid');
    if (parsed.origin !== 'https://ologywood.invalid') return fallback;
  } catch {
    return fallback;
  }
  return value;
}

export function createOAuthState(payload: OAuthStatePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify({
    ...payload,
    version: STATE_VERSION,
    issuedAt: Date.now(),
  })).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyOAuthState(value: unknown): OAuthStatePayload | null {
  if (typeof value !== 'string') return null;
  const [encodedPayload, suppliedSignature, extra] = value.split('.');
  if (!encodedPayload || !suppliedSignature || extra) return null;
  let expectedSignature: string;
  try {
    expectedSignature = sign(encodedPayload);
  } catch {
    return null;
  }
  const expected = Buffer.from(expectedSignature, 'base64url');
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (payload.version !== STATE_VERSION || typeof payload.issuedAt !== 'number') return null;
    if (!Number.isSafeInteger(payload.issuedAt) || Date.now() - payload.issuedAt < 0 || Date.now() - payload.issuedAt > STATE_TTL_MS) return null;
    if (payload.returnPath !== undefined) payload.returnPath = safeOAuthReturnPath(payload.returnPath);
    return payload;
  } catch {
    return null;
  }
}

export const OAUTH_STATE_TTL_MS = STATE_TTL_MS;
