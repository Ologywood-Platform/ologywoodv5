import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

function sectionBetween(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('auth and public artist-search boundaries', () => {
  it('projects auth.me fields instead of spreading credential-bearing user rows', () => {
    const section = sectionBetween('me: publicProcedure.query', 'logout: protectedProcedure');
    expect(section).toContain('email-verification, or provider-specific credential identifiers');
    expect(section).toContain('return { id, openId, name, email, loginMethod, role');
    expect(section).not.toContain('return { ...safeUser');
    expect(section).not.toContain('emailVerificationToken');
    expect(section).not.toContain('garychisolm30@gmail.com');
    expect(section).toContain("console.error('[Auth.me] Error')");
  });

  it('uses one strict bounded schema for public artist search', () => {
    const helper = sectionBetween('const artistSearchInput =', 'const artistStats =');
    expect(helper).toContain('genre: z.array(z.string().trim().min(1).max(100)).max(20).optional()');
    expect(helper).toContain('minFee: z.number().finite().min(0).max(10_000_000).optional()');
    expect(helper).toContain('availableFrom: scheduleDateSchema.optional()');
    expect(helper).toContain('Maximum fee must be at least the minimum fee');
    expect(helper).toContain('Available-to date must not be before available-from date');

    const section = sectionBetween('search: publicProcedure', '// Get distinct cities');
    expect(section).toContain('.input(artistSearchInput.optional().default({}))');
    expect(section).not.toContain('minFee: z.number().optional()');
    expect(section).not.toContain('availableFrom: z.string().optional()');
  });
});
