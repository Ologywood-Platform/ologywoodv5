import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/team.ts'), 'utf8');

describe('team invitation security boundaries', () => {
  it('uses strict generated invitation tokens and does not expose raw invitee emails or tokens', () => {
    expect(source).toContain("const invitationToken = z.string().trim().regex(/^[a-f0-9]{64}$/i");
    expect(source).toContain(".input(z.object({ token: invitationToken }).strict())");
    expect(source).toContain('email: artistTeamInvitations.email');
    expect(source).not.toContain('fullEmail: invitation.email');
    expect(source).toContain('return {\n          id: log.id,\n          action: log.action');
  });

  it('binds acceptance and decline to the invited email and keeps IDs strict', () => {
    expect(source).toContain("ctx.user.email?.trim().toLowerCase() !== invitation.email.trim().toLowerCase()");
    expect(source).toContain('const teamMemberId = z.number().int().safe().positive()');
    expect(source).toContain('memberId: teamMemberId');
    expect(source).toContain('invitationId: teamMemberId');
    expect(source).toContain('limit: z.number().int().min(1).max(50).default(20)');
  });

  it('normalizes invitation emails, avoids PII in activity details, and escapes invitation HTML', () => {
    expect(source).toContain('email: z.string().trim().toLowerCase().email().max(320)');
    expect(source).toContain('details: { role: input.role }');
    expect(source).toContain('escapeFanEmailHtml(ctx.user.name || \'Someone\')');
    expect(source).toContain('escapeFanEmailHtml(artistProfile.artistName || \'an artist\')');
  });
});
