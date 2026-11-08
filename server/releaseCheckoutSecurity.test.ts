import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { trustedCheckoutOrigin } from './services/trustedOrigin';
import { positiveRouteId } from './routes/routeInput';

describe('release checkout security boundaries', () => {
  it('prefers a configured base URL and ignores request-origin spoofing', () => {
    expect(trustedCheckoutOrigin('https://www.ologywood.com/', 'https://attacker.example')).toBe('https://www.ologywood.com');
    expect(trustedCheckoutOrigin('', 'https://attacker.example')).toBe('https://www.ologywood.com');
  });

  it('allows only approved local, Manus, and Ologywood request origins', () => {
    expect(trustedCheckoutOrigin('', 'https://3000-preview.manus.computer')).toBe('https://3000-preview.manus.computer');
    expect(trustedCheckoutOrigin('', 'http://localhost:3000')).toBe('http://localhost:3000');
    expect(trustedCheckoutOrigin('', 'https://ologywood.com')).toBe('https://ologywood.com');
    expect(trustedCheckoutOrigin('', 'https://ologywood.com.attacker.example')).toBe('https://www.ologywood.com');
  });

  it('accepts only strict positive release IDs', () => {
    expect(positiveRouteId('12')).toBe(12);
    expect(positiveRouteId('12junk')).toBeNull();
    expect(positiveRouteId('1.2')).toBeNull();
    expect(positiveRouteId('0')).toBeNull();
    expect(positiveRouteId(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
  });

  it('keeps the route on strict amount/origin contracts', () => {
    const source = readFileSync('server/routes/releaseCheckout.ts', 'utf8');
    expect(source).toContain('positiveRouteId(releaseId)');
    expect(source).toContain('customAmountCents must be a positive integer');
    expect(source).toContain('customAmountCents is outside the allowed range');
    expect(source).toContain('This release does not allow custom pricing');
    expect(source).toContain('trustedCheckoutOrigin(process.env.BASE_URL, req.headers.origin)');
    expect(source).not.toContain('parseInt(releaseId)');
    expect(source).not.toContain('parseInt(customAmountCents)');
  });
});
