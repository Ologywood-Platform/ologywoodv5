import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const releases = readFileSync(resolve(__dirname, 'routers/releases.ts'), 'utf8');
const commerce = readFileSync(resolve(__dirname, '..', 'shared/contentReleaseCommerce.ts'), 'utf8');

describe('content-release security boundaries', () => {
  it('uses strict bounded release fields and allowlisted release options', () => {
    expect(releases).toContain("title: z.string().trim().min(1).max(255)");
    expect(releases).toContain('.strict().superRefine');
    expect(releases).toContain('const releasePrice = z.number().finite().min(0).max(999_999.99)');
    expect(releases).toContain("const accessModel = z.string().trim().max(50).refine");
    expect(releases).toContain('const hostingPlatform = z.enum');
    expect(releases).toContain('Minimum price cannot exceed the release price.');
  });

  it('requires safe release/profile identifiers and caps public release reads', () => {
    expect(releases).toContain('const safeReleaseId = z.number().int().safe().positive()');
    expect(releases).toContain('const safeArtistProfileId = z.number().int().safe().positive()');
    expect(releases).toContain('.limit(100);');
    expect(releases).toContain('const contentReleaseViewLimiter = new RateLimiter({ maxRequests: 120');
    expect(releases).toContain("contentReleaseViewLimiter.checkAsync(`ip:${clientIp(ctx)}`)");
  });

  it('keeps public content behind access checks and omits internal release metadata', () => {
    expect(commerce).toContain('contentUrl:release.accessModel===\'free\'||release.userId===viewerId?release.contentUrl:null');
    expect(commerce).toContain('userId:_userId');
    expect(commerce).toContain('revenue:_revenue');
    expect(commerce).not.toContain('return {...release');
  });

  it('keeps checkout amounts in a cents-safe bounded range', () => {
    expect(releases).toContain('.input(z.object({ releaseId: safeReleaseId, amount: releasePrice }).strict())');
    expect(releases).toContain('createContentReleaseCheckout(ctx.user,input)');
  });
});
