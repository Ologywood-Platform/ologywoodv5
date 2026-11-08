import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const authSource = readFileSync(resolve(__dirname, 'routers/auth.ts'), 'utf8');
const settingsSource = readFileSync(resolve(__dirname, '../client/src/components/AccountSettings.tsx'), 'utf8');

function sectionBetween(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('auth recovery and credential boundaries', () => {
  it('binds OAuth password setup to the authenticated account', () => {
    const section = sectionBetween(authSource, 'setPassword: protectedProcedure', '// Change password');
    expect(section).toContain('.input(z.object({\n      password: passwordSchema,\n    }).strict())');
    expect(section).toContain('eq(users.id, ctx.user.id)');
    expect(section).not.toContain('email: z.string');
    expect(settingsSource).toContain('setPasswordMutation.mutateAsync({\n                                password: newPassword,\n                              })');
  });

  it('prevents public account enumeration from email lookup helpers', () => {
    const check = sectionBetween(authSource, 'checkEmail: publicProcedure', '// Get user by email');
    const lookup = sectionBetween(authSource, 'getUserByEmail: publicProcedure', '// Upload custom profile picture');
    expect(check).toContain('ctx.user.email.toLowerCase() !== input.email');
    expect(check).toContain('return { exists: false }');
    expect(lookup).toContain('ctx.user.email.toLowerCase() !== input.email');
    expect(lookup).toContain('return null');
    expect(lookup).not.toContain('passwordHash');
  });

  it('bounds auth credentials/tokens and escapes reset-email names', () => {
    expect(authSource).toContain(".max(256, 'Password must be 256 characters or fewer')");
    expect(authSource).toContain('const authTokenSchema = z.string().trim().min(1, \'Token is required\').max(256)');
    expect(authSource).toContain('const avatarDataSchema = z.string().min(1).max(2_800_000)');
    expect(authSource).toContain('escapeFanEmailHtml(user.name || \'there\')');
    expect(authSource).not.toContain('Forgot password: no account found for ${input.email');
    expect(authSource).not.toContain("console.error('[Auth] Reset password error:', error)");
  });
});
