import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { trustedCheckoutOrigin } from './services/trustedOrigin';

const source = readFileSync(join(__dirname, 'routers', 'stripeConnect.ts'), 'utf8');

describe('Stripe Connect security boundary', () => {
  it('uses a creator-only procedure for every Connect account operation', () => {
    for (const procedure of ['getAccountStatus', 'createAccount', 'getDashboardLink', 'getOnboardingLink', 'disconnectAccount']) {
      expect(source).toContain(`${procedure}: artistConnectProcedure`);
    }
    expect(source).toContain("ctx.user.role !== 'artist' && ctx.user.role !== 'admin'");
    expect(source).toContain("message: 'Artist access required'");
  });

  it('builds callback URLs from the approved configured origin', () => {
    expect(source).toContain("trustedCheckoutOrigin(process.env.BASE_URL, undefined)");
    expect(source).toContain("new URL('/dashboard?stripe=refresh', origin)");
    expect(source).toContain("new URL('/dashboard?stripe=connected', origin)");
    expect(source).not.toContain("${process.env.BASE_URL || 'https://www.ologywood.com'}");
    expect(trustedCheckoutOrigin('javascript:alert(1)', undefined)).toBe('https://www.ologywood.com');
    expect(trustedCheckoutOrigin('https://creator.example.test', undefined)).toBe('https://creator.example.test');
  });

  it('does not return raw database/provider errors or log provider details', () => {
    expect(source).toContain("errorType: error instanceof Error ? error.name : 'UnknownError'");
    expect(source).toContain("throw scheduledStripeFailure()");
    expect(source).not.toContain('throw new Error(\'Database not available\')');
    expect(source).not.toContain('console.log(`[Stripe Connect] Created account');
    expect(source).not.toContain('console.error(`[Stripe Connect]');
  });
});
