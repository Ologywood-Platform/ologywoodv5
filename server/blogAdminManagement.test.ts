import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canManageBlog, normalizeBlogStatusCounts } from './services/blogAdminService';
import { isPlatformOwner } from './services/platformOwnerAccess';

const routerSource = readFileSync(new URL('./routers/blog.ts', import.meta.url), 'utf8');
const adminRouterSource = readFileSync(new URL('./routers/admin.ts', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../client/src/pages/BlogAdmin.tsx', import.meta.url), 'utf8');

describe('Blog Management counts and access', () => {
  it('allows administrators, approved bloggers, and the configured owner only', () => {
    expect(canManageBlog({ role: 'admin', openId: 'admin' }, 'owner')).toBe(true);
    expect(canManageBlog({ role: 'blogger', openId: 'writer' }, 'owner')).toBe(true);
    expect(canManageBlog({ role: 'artist', openId: 'owner' }, 'owner')).toBe(true);
    expect(canManageBlog({ role: 'artist', openId: 'other' }, 'owner')).toBe(false);
    expect(canManageBlog({ role: 'artist', openId: '' }, '')).toBe(false);
  });

  it('recognizes a creator-owner by verified email when the linked open ID differs', () => {
    const owner = {
      role: 'artist',
      openId: 'linked-creator-open-id',
      email: 'GARYCHISOLM30@GMAIL.COM',
    };
    const configuration = {
      openId: 'original-owner-open-id',
      email: 'garychisolm30@gmail.com',
    };

    expect(isPlatformOwner(owner, configuration)).toBe(true);
    expect(canManageBlog(owner, configuration)).toBe(true);
  });

  it('does not grant Blog Management to an ordinary creator or user', () => {
    const configuration = {
      openId: 'owner-open-id',
      email: 'owner@example.com',
    };
    expect(canManageBlog({ role: 'artist', openId: 'other', email: 'artist@example.com' }, configuration)).toBe(false);
    expect(canManageBlog({ role: 'user', openId: 'fan', email: 'fan@example.com' }, configuration)).toBe(false);
  });

  it('uses one shared platform-owner check in Blog and Admin procedures', () => {
    expect(routerSource).toContain('canManageBlog(user)');
    expect(adminRouterSource).toContain('isPlatformOwner(user)');
    expect(adminRouterSource).not.toContain("const OWNER_EMAIL = 'garychisolm30@gmail.com'");
  });

  it('normalizes MySQL numeric strings, numbers, bigints, and empty aggregates', () => {
    expect(normalizeBlogStatusCounts({ total: '6', published: 4n, drafts: 1, archived: '1' })).toEqual({
      total: 6,
      published: 4,
      drafts: 1,
      archived: 1,
    });
    expect(normalizeBlogStatusCounts(undefined)).toEqual({ total: 0, published: 0, drafts: 0, archived: 0 });
  });

  it('returns global status counts independently of the current list filter', () => {
    expect(routerSource).toContain("sum(case when ${blogPosts.status} = 'published' then 1 else 0 end)");
    expect(routerSource).toContain("sum(case when ${blogPosts.status} = 'draft' then 1 else 0 end)");
    expect(routerSource).toContain('counts: normalizeBlogStatusCounts');
  });

  it('does not display false zero counts while loading or after an error', () => {
    expect(clientSource).toContain("'Loading blog post counts…'");
    expect(clientSource).toContain("'Blog post counts are temporarily unavailable'");
    expect(clientSource).toContain('Blog posts could not be loaded');
    expect(clientSource).toContain('Try Again');
    expect(clientSource).toContain('No ${statusFilter} posts');
    expect(clientSource).toContain('There are currently no posts with ${statusFilter} status.');
  });

  it('invalidates all admin filters and the public Blog after every mutation', () => {
    expect(clientSource.match(/utils\.blog\.adminList\.invalidate\(\)/g)).toHaveLength(4);
    expect(clientSource.match(/utils\.blog\.list\.invalidate\(\)/g)).toHaveLength(4);
  });
});
