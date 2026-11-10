import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('EDU verification and entitlement safeguards', () => {
  it('keeps EDU review separate from billing and stores only the school-code suffix', () => {
    const router = read('./routers/edu.ts');
    expect(router).toContain("schoolCodeLast4");
    expect(router).toContain("action: 'submitted'");
    expect(router).toContain("status: 'pending'");
    expect(router).not.toContain('schoolCode: input.schoolCode');
  });

  it('requires an explicit admin decision and records the review event', () => {
    const router = read('./routers/edu.ts');
    expect(router).toContain("adminReview: adminProcedure");
    expect(router).toContain("decision: z.enum(['approve', 'reject', 'revoke'])");
    expect(router).toContain("action: status");
    expect(router).toContain('reviewedByUserId: ctx.user.id');
  });

  it('limits the EDU coupon to verified Starter or Professional checkout', () => {
    const source = read('./routers.ts');
    expect(source).toContain("input.plan === 'starter' || input.plan === 'professional'");
    expect(source).toContain('percent_off: 50');
    expect(source).toContain("duration: 'repeating'");
    expect(source).toContain('duration_in_months: 12');
    expect(source).toContain("input.useCredits && stripeClient && !eduDiscountApplied");
    expect(source).toContain("plan: z.enum(['starter', 'professional', 'enterprise'])");
  });

  it('carries the approved verification ID into Stripe session and subscription metadata', () => {
    const router = read('./routers.ts');
    const stripe = read('./stripe.ts');
    expect(router).toContain('eduVerificationId = eduVerification.id.toString()');
    expect(router).toContain('eduVerificationId,');
    expect(stripe).toContain('eduVerificationId?: string;');
    expect(stripe).toContain('eduVerificationId: params.eduVerificationId');
  });

  it('creates no migration with destructive operations', () => {
    const migration = read('../drizzle/0121_misty_squadron_supreme.sql');
    expect(migration).toContain('CREATE TABLE `edu_verifications`');
    expect(migration).toContain('CREATE TABLE `edu_verification_events`');
    expect(migration).not.toMatch(/\bDROP\s+|\bDELETE\s+|\bTRUNCATE\s+/i);
  });
});
