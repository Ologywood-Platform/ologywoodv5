import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const router = readFileSync(resolve(__dirname, 'routers/referral.ts'), 'utf8');
const emails = readFileSync(resolve(__dirname, 'referralEmails.ts'), 'utf8');

describe('referral security boundaries', () => {
  it('uses a bounded generated-code grammar and throttles public validation', () => {
    expect(router).toContain("const referralCodeSchema = z.string().trim().regex(/^[A-Z0-9_-]{8}$/u");
    expect(router).toContain('const publicReferralLimiter = new RateLimiter({ maxRequests: 60');
    expect(router).toContain("publicReferralLimiter.checkAsync(`ip:${clientIp(ctx)}`)");
    expect(router).toContain('.input(z.object({ code: referralCodeSchema }).strict())');
  });

  it('masks referred email addresses and projects credit history fields', () => {
    expect(router).toContain('referredEmail: maskEmail(referral.referredEmail)');
    expect(router).toContain('referralCredits.description');
    expect(router).not.toContain('.select()\n      .from(referralCredits)');
  });

  it('makes referral-code application conditional to prevent concurrent reuse', () => {
    expect(router).toContain('const updateResult = await database');
    expect(router).toContain('eq(referrals.status, "pending")');
    expect(router).toContain('if (affectedRows !== 1)');
    expect(router).toContain('This referral code has already been used');
  });

  it('escapes user-controlled names in referral emails and removes subject newlines', () => {
    expect(emails).toContain('import { escapeFanEmailHtml }');
    expect(emails).toContain('const safeReferrerName = escapeFanEmailHtml(referrerName)');
    expect(emails).toContain('const safeReferredName = escapeFanEmailHtml(referredName)');
    expect(emails).toContain("return value.replace(/[\\r\\n]/gu, '').slice(0, 160)");
    expect(emails).not.toContain('Hi ${referrerName}');
    expect(emails).not.toContain('<strong>${referredName}</strong>');
  });
});
