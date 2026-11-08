import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Follow and social-graph security boundaries', () => {
  it('uses safe user IDs and strict follow relationship payloads', () => {
    const source = read('./routers/follows.ts');
    const service = read('./services/followService.ts');
    expect(source).toContain('const safeUserId = z.number().int().safe().positive()');
    expect(source).toContain('followingId: safeUserId');
    expect(source).toContain('followingType: z.enum(["artist", "venue"])');
    expect(service).toContain('if (followerId === followingId) throw new Error(\'Cannot follow yourself\')');
  });

  it('bounds private list pagination and recommendation limits', () => {
    const source = read('./routers/follows.ts');
    expect(source).toContain('const listLimit = z.number().int().min(1).max(100)');
    expect(source).toContain('const listOffset = z.number().int().min(0).max(1_000_000)');
    expect(source).toContain('const recommendationLimit = z.number().int().min(1).max(50)');
    expect(source).toContain('limit: z.number().int().min(1).max(24).default(8)');
  });

  it('keeps fan-email access paid and consent revision-bounded', () => {
    const source = read('./routers/follows.ts');
    expect(source).toContain('await assertFanEmailCreator(ctx.user.id)');
    expect(source).toContain('hasFeatureAccess(ctx.user.id, "riderBuilder")');
    expect(source).toContain('expectedRevision: z.number().int().min(0).max(1_000_000_000)');
    expect(source).toContain('fanEmailCsvCell');
  });
});
