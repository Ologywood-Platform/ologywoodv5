import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { EDU_DISCOUNT_PERCENT, EDU_MANUAL_REVIEW_STATEMENT, getEduApprovalWindow, getEffectiveEduStatus, getPermittedEduReviewActions, isEduVerificationEligible, type EduPolicyRow } from '../shared/eduPolicy';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
const NOW = new Date('2030-06-15T12:00:00Z');
const approved: EduPolicyRow = { status: 'approved', verifiedUntil: new Date('2030-06-16T12:00:00Z'), graceUntil: new Date('2030-07-16T12:00:00Z') };

describe('shared EDU eligibility policy', () => {
  it('reports active, grace, and expired with exclusive deadlines', () => {
    expect(getEffectiveEduStatus(approved, NOW)).toBe('active');
    expect(getEffectiveEduStatus(approved, new Date('2030-06-16T12:00:00Z'))).toBe('grace');
    expect(isEduVerificationEligible(approved, new Date('2030-07-01T12:00:00Z'))).toBe(true);
    expect(getEffectiveEduStatus(approved, new Date('2030-07-16T12:00:00Z'))).toBe('expired');
    expect(isEduVerificationEligible(approved, new Date('2030-07-16T12:00:00Z'))).toBe(false);
  });

  it('does not grant eligibility to pending, rejected, revoked, missing, or invalid states', () => {
    expect(getEffectiveEduStatus(null)).toBe('not_submitted');
    expect(isEduVerificationEligible(null)).toBe(false);
    for (const status of ['pending', 'rejected', 'revoked'] as const) {
      expect(getEffectiveEduStatus({ ...approved, status }, NOW)).toBe(status);
      expect(isEduVerificationEligible({ ...approved, status }, NOW)).toBe(false);
    }
    for (const verifiedUntil of [null, 'invalid']) {
      expect(getEffectiveEduStatus({ ...approved, verifiedUntil }, NOW)).toBe('expired');
    }
    expect(isEduVerificationEligible(approved, new Date('invalid'))).toBe(false);
    expect(getEffectiveEduStatus({ ...approved, graceUntil: 'invalid' }, new Date('2030-07-01'))).toBe('expired');
    expect(getEffectiveEduStatus({ ...approved, graceUntil: new Date('2030-01-01') }, new Date('2030-07-01'))).toBe('expired');
  });

  it('treats renewal submission as evidence, not a new eligibility state', () => {
    expect(getEffectiveEduStatus({ ...approved, renewalSubmittedAt: NOW }, NOW)).toBe('active');
    expect(getPermittedEduReviewActions({ status: 'pending' })).toEqual(['approve', 'reject']);
    expect(getPermittedEduReviewActions({ status: 'approved' })).toEqual(['revoke']);
    expect(getPermittedEduReviewActions({ status: 'approved', renewalSubmittedAt: NOW })).toEqual(['renew', 'reject', 'revoke']);
    expect(getPermittedEduReviewActions({ status: 'rejected' })).toEqual([]);
    expect(getPermittedEduReviewActions({ status: 'revoked' })).toEqual([]);
  });

  it('uses a 365-day verification window and 30-day grace, extending early renewal without shortening approval', () => {
    const initial = getEduApprovalWindow(NOW);
    expect(initial.verifiedUntil).toEqual(new Date('2031-06-15T12:00:00Z'));
    expect(initial.graceUntil).toEqual(new Date('2031-07-15T12:00:00Z'));
    expect(getEduApprovalWindow(NOW, approved.verifiedUntil).verifiedUntil).toEqual(new Date('2031-06-16T12:00:00Z'));
    expect(getEduApprovalWindow(NOW, new Date('2029-01-01'))).toEqual(initial);
    expect(getEduApprovalWindow(NOW, 'invalid')).toEqual(initial);
    expect(EDU_DISCOUNT_PERCENT).toBe(50);
    expect(EDU_MANUAL_REVIEW_STATEMENT).toContain('does not automatically prove');
  });
});

describe('EDU schema and UI safety contracts', () => {
  it('generates only additive EDU columns and retains existing migration history', () => {
    const migration = read('../drizzle/0122_edu_renewal_review_lifecycle.sql');
    const statements = migration.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean);
    expect(statements).toHaveLength(23);
    for (const statement of statements) expect(statement).toMatch(/^ALTER TABLE `edu_(verifications|verification_events)` ADD `/);
    expect(migration).not.toMatch(/\bDROP\s+|\bDELETE\s+|\bTRUNCATE\s+|\bMODIFY\s+/i);
    const original = read('../drizzle/0121_misty_squadron_supreme.sql');
    expect(original).toContain('CREATE TABLE `edu_verifications`');
    const schema = read('../drizzle/schema.ts').split("export const eduVerifications =")[1].split('export type EduVerification')[0];
    for (const field of ['checkoutSessionId', 'stripeCouponId', 'stripeSubscriptionId', 'billingMode', 'billingVerificationRevision', 'renewalNoticeSentAt', 'expiryNoticeSentAt', 'discountEndsAt', 'billingReconcileAfter', 'revision', 'renewalSubmittedAt']) expect(schema).toContain(field);
    expect(schema).not.toMatch(/\bschoolCode:\s/);
  });

  it('adds only the durable EDU notice table with the helper-compatible fields and index', () => {
    const migration = read('../drizzle/0123_edu_billing_notices.sql');
    expect(migration).toContain('CREATE TABLE `edu_billing_notices`');
    expect(migration).toContain('PRIMARY KEY(`noticeKey`)');
    expect(migration).toContain('`noticeKey` varchar(191) NOT NULL');
    expect(migration).toContain('`kind` varchar(32) NOT NULL');
    expect(migration).toContain('`state` varchar(16) NOT NULL');
    expect(migration).toContain('`sentAt` timestamp');
    expect(migration).toContain('`createdAt` timestamp NOT NULL DEFAULT (now())');
    expect(migration).toContain('CREATE INDEX `idx_edu_billing_notice_verification` ON `edu_billing_notices` (`verificationId`,`revision`)');
    expect(migration).not.toMatch(/\bDROP\s+|\bDELETE\s+|\bTRUNCATE\s+|\bALTER\s+/i);
  });

  it('renders evidence with React escaping and accurately labels manual proof and paid activation', () => {
    const admin = read('../client/src/pages/EduAdmin.tsx');
    const student = read('../client/src/pages/EduVerification.tsx');
    expect(admin).toContain('manualProofConfirmed:');
    expect(admin).toContain('expectedRevision');
    expect(admin).toContain('maxLength={500}');
    expect(admin).toContain('School code suffix:');
    expect(student).toContain('evidenceAcknowledged: true');
    expect(student).toContain('not automatically ownership-verified');
    expect(student).toContain('not automatically validated');
    expect(admin + student).not.toContain('dangerouslySetInnerHTML');
  });

  it('aligns public pricing and removes automatic code verification and reminder promises', () => {
    const landing = read('../client/src/pages/Edu.tsx');
    const apply = read('../client/src/pages/EduApply.tsx');
    expect(apply).not.toContain('Education pricing is not final');
    expect(apply).toContain('50% off Starter or Professional');
    expect(landing).not.toContain('approved school code');
    expect(landing).not.toContain('Students receive reminders before expiration');
    expect(landing).toContain('approval is not paid activation');
  });
});
