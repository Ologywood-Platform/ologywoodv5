import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/discoverySearch.ts'), 'utf8');

describe('discovery search security boundaries', () => {
  it('uses a strict bounded suggestion schema', () => {
    expect(source).toContain('query: z.string().trim().min(1).max(80)');
    expect(source).toContain('limitPerType: z.number().int().safe().min(1).max(6).default(4)');
    expect(source).toContain('}).strict())');
  });

  it('throttles public discovery queries per client IP', () => {
    expect(source).toContain('const discoverySearchLimiter = new RateLimiter({ maxRequests: 120');
    expect(source).toContain("discoverySearchLimiter.checkAsync(`ip:${clientIp(ctx)}`)");
    expect(source).toContain('return { artists: [], venues: [], events: [] };');
  });

  it('keeps public results limited to discovery-safe fields and excludes team members', () => {
    expect(source).toContain('notExists(');
    expect(source).toContain("ne(artistTeamMembers.role, 'owner')");
    expect(source).toContain('href: `/artist/${toDiscoverySlug(artist.artistName)}`');
    expect(source).not.toContain('artist.userId');
    expect(source).not.toContain('users.email');
  });
});
