import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const admin = readFileSync(resolve(__dirname, 'routers/admin.ts'), 'utf8');

describe('administrator router security boundaries', () => {
  it('uses safe positive IDs and bounded pagination primitives', () => {
    expect(admin).toContain('const adminPositiveId = z.number().int().safe().positive()');
    expect(admin).toContain('const adminLimit = z.number().int().safe().min(1).max(500).default(50)');
    expect(admin).toContain('const adminOffset = z.number().int().safe().min(0).max(1_000_000).default(0)');
    expect(admin).toContain('page: z.number().int().safe().min(1).max(100_000).default(1)');
  });

  it('strictly bounds privileged moderation, payout, dispute, and bulk-user inputs', () => {
    expect(admin).toContain('bookingId: adminPositiveId');
    expect(admin).toContain('payoutId: adminPositiveId');
    expect(admin).toContain('releaseId: adminPositiveId');
    expect(admin).toContain('artistProfileId: adminPositiveId');
    expect(admin).toContain('userIds: z.array(adminPositiveId).max(500)');
    expect(admin).toContain('reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(2_000)');
    expect(admin).toContain('refundAmount: z.number().finite().nonnegative().max(1_000_000).optional()');
  });

  it('escapes user-controlled names in admin email templates and redacts delivery logs', () => {
    expect(admin).toContain('const safeRecipientName = escapeFanEmailHtml');
    expect(admin).toContain('const safeChangedByName = escapeFanEmailHtml');
    expect(admin).toContain('escapeFanEmailHtml(user.name || \'there\')');
    expect(admin).not.toContain('Role change email sent to ${params.recipientEmail}');
    expect(admin).toContain("console.error('[Admin] Profile reminder delivery failed', { targetUserId: user.id })");
    expect(admin).toContain('function adminErrorKind(error: unknown): string');
    expect(admin).not.toContain("Failed to send role change email:', error);");
  });

  it('caps profile-reminder fan-out and rejects unknown activity fields', () => {
    expect(admin).toContain('targetUsers = targetUsers.slice(0, 500)');
    expect(admin).toContain('details: z.string().trim().max(4_000).optional()');
    expect(admin).toContain('}).strict())');
  });
});
