import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Tip payment security boundaries', () => {
  it('requires safe artist profile IDs and cents-safe integer tip amounts', () => {
    const source = read('./routers/tip.ts');
    expect(source).toContain('const artistProfileId = z.number().int().safe().positive()');
    expect(source).toContain('const tipAmount = z.number().int().min(100).max(50000)');
    expect(source).toContain('tipperName: z.string().trim().max(255).optional()');
    expect(source).toContain('message: z.string().trim().max(200).optional()');
    expect(source).toContain('}).strict())');
  });

  it('requires both charge and payout readiness before tips are enabled', () => {
    const source = read('./routers/tip.ts');
    expect(source).toContain("account.status !== 'active' || !account.chargesEnabled || !account.payoutsEnabled");
  });

  it('does not log connected-account or PaymentIntent identifiers and redacts provider failures', () => {
    const source = read('./routers/tip.ts');
    expect(source).not.toContain('account.stripeAccountId`');
    expect(source).not.toContain('PaymentIntent created: ${paymentIntent.id}');
    expect(source).not.toContain('console.log(`[Tip]');
    expect(source).toContain("PaymentIntent creation failed', { kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).toContain('Unable to start this tip payment. Please try again.');
    expect(source).not.toContain("throw new Error('Database not available')");
  });
});
