import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

describe('subscription checkout security boundaries', () => {
  it('uses strict plan inputs and bounded HTTP(S) return URLs', () => {
    expect(source).toContain('const subscriptionReturnUrl = z.string().trim().max(2_048).url()');
    expect(source).toContain('successUrl: subscriptionReturnUrl');
    expect(source).toContain('cancelUrl: subscriptionReturnUrl');
    expect(source).toContain("plan: z.enum(['starter', 'professional', 'enterprise'])");
    expect(source).toContain('}).strict())');
  });

  it('accepts checkout redirects only on the approved application origin', () => {
    expect(source).toContain("const origin = trustedCheckoutOrigin(process.env.BASE_URL, (ctx.req as any)?.headers?.origin)");
    expect(source).toContain("parsed.origin === origin && !parsed.username && !parsed.password");
    expect(source).toContain("Checkout return URLs must use the approved application origin");
  });

  it('caps referral-credit coupons at the selected configured plan total', () => {
    expect(source).toContain('const selectedProduct = input.plan === \'starter\'');
    expect(source).toContain("const planTotalCents = input.interval === 'year'");
    expect(source).toContain('const amountOff = Math.min(Math.round(balance * 100), planTotalCents)');
  });

  it('does not log customer, subscription, or account email identifiers during sync', () => {
    const start = source.indexOf('syncFromStripe: protectedProcedure');
    const section = source.slice(start, start + 8_000);
    const consoleStatements = section.match(/console\.(?:log|error)\([^\n]+/g)?.join('\n') || '';
    expect(consoleStatements).not.toContain('ctx.user.email');
    expect(consoleStatements).not.toContain('Customer ID:');
    expect(consoleStatements).not.toContain('activeSub.id');
    expect(consoleStatements).not.toContain('userId: ctx.user.id');
    expect(section).toContain("console.log('[SyncFromStripe] Sync succeeded')");
  });
});
