import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SANDBOX_POST_IMAGE_MIME_TYPES,
  SANDBOX_POST_MAX_CHARACTERS,
  SANDBOX_POST_MAX_IMAGE_BYTES,
  SANDBOX_POST_MAX_VIDEO_BYTES,
  SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS,
  SANDBOX_POST_VIDEO_MIME_TYPES,
  normalizeSandboxPostText,
  sandboxPostDescription,
  sandboxPostPath,
} from '../shared/sandboxPost';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Sandbox Post product contract', () => {
  it('defines concise text and safe media limits centrally', () => {
    expect(SANDBOX_POST_MAX_CHARACTERS).toBe(600);
    expect(SANDBOX_POST_MAX_IMAGE_BYTES).toBe(8 * 1024 * 1024);
    expect(SANDBOX_POST_MAX_VIDEO_BYTES).toBe(25 * 1024 * 1024);
    expect(SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS).toBe(30);
    expect(SANDBOX_POST_IMAGE_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(SANDBOX_POST_VIDEO_MIME_TYPES).toEqual(['video/mp4', 'video/quicktime', 'video/webm']);
  });

  it('normalizes text and creates a stable clean profile URL', () => {
    expect(normalizeSandboxPostText('  First line\r\nSecond line  ')).toBe('First line\nSecond line');
    expect(sandboxPostPath('Dawud Anyabwile')).toBe('/artist/dawud-anyabwile/sandbox');
    expect(sandboxPostDescription('New work in progress.', 'Dawud Anyabwile'))
      .toContain('a Sandbox Post from Dawud Anyabwile on OlogyWood');
  });

  it('uses one current row per profile and owner with no history table', () => {
    const schema = read('drizzle/schema.ts');
    const migration = read('drizzle/0110_optimal_starjammers.sql');
    expect(schema).toContain('export const sandboxPosts = mysqlTable("sandbox_posts"');
    expect(schema).toContain('unique("uniq_sandbox_posts_profile").on(table.artistProfileId)');
    expect(schema).toContain('unique("uniq_sandbox_posts_owner").on(table.artistUserId)');
    expect(migration).toContain('CREATE TABLE `sandbox_posts`');
    expect(schema).not.toContain('sandboxPostHistory');
    expect(schema).not.toContain('sandbox_post_history');
  });

  it('provides a clean share page and custom social and direct destinations', () => {
    const app = read('client/src/App.tsx');
    const shareDialog = read('client/src/components/SandboxPostShareDialog.tsx');
    const shareUrls = read('client/src/lib/sandboxPostShare.ts');
    expect(app).toContain('<Route path="/artist/:slug/sandbox"');
    expect(shareUrls).toContain('facebook.com/sharer');
    expect(shareUrls).toContain('twitter.com/intent/tweet');
    expect(shareUrls).toContain('linkedin.com/sharing/share-offsite');
    expect(shareDialog).toContain('navigator.share');
    expect(shareDialog).toContain('navigator.clipboard.writeText');
  });
});

describe('Sandbox Post security and replacement', () => {
  const router = read('server/routers/sandboxPost.ts');

  it('permanently deletes the current row before inserting the replacement', () => {
    const deleteIndex = router.indexOf('await tx.delete(sandboxPosts)');
    const insertIndex = router.indexOf('await tx.insert(sandboxPosts)');
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(insertIndex).toBeGreaterThan(deleteIndex);
    expect(router).toContain('previousPostPermanentlyDeleted');
  });

  it('requires the profile owner and blocks non-owner team-member accounts', () => {
    expect(router).toContain("role !== 'artist' && role !== 'admin'");
    expect(router).toContain('eq(artistProfiles.userId, userId)');
    expect(router).toContain("ne(artistTeamMembers.role, 'owner')");
    expect(router).toContain('Team member accounts cannot publish public Sandbox Posts.');
  });

  it('validates decoded size, signature, extension, duration, and randomized storage keys', () => {
    expect(router).toContain('buffer.length !== media.fileSizeBytes');
    expect(router).toContain('validateFileSignature(buffer, media.type, media.mimeType)');
    expect(router).toContain('safeExtension(media.fileName, media.mimeType)');
    expect(router).toContain('crypto.randomUUID()');
    expect(router).toContain('SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS');
  });

  it('returns public-safe fields only and keeps moderation active-only', () => {
    const publicMapper = router.slice(router.indexOf('function toPublicPost'), router.indexOf('function toOwnerPost'));
    expect(publicMapper).toContain('mediaUrl: post.mediaUrl');
    expect(publicMapper).toContain('mediaThumbnailUrl: post.mediaThumbnailUrl');
    expect(publicMapper).not.toContain('mediaKey');
    expect(publicMapper).not.toContain('mediaMimeType');
    expect(publicMapper).not.toContain('mediaFileName');
    expect(publicMapper).not.toContain('artistUserId');
    expect(router).toContain("eq(sandboxPosts.status, 'active')");
    expect(router).toContain('setHidden: adminProcedure');
  });

  it('serves active-only Sandbox Post metadata before the generic artist route', () => {
    const middleware = read('server/middleware/ogTags.ts');
    const proxy = read('server/middleware/ogImageProxy.ts');
    const sandboxIndex = middleware.indexOf('const sandboxPostMatch');
    const artistIndex = middleware.indexOf('const artistMatch');
    expect(sandboxIndex).toBeGreaterThan(-1);
    expect(artistIndex).toBeGreaterThan(sandboxIndex);
    expect(middleware).toContain("pathname.match(/^\\/artist\\/([^/]+)$/)");
    expect(middleware).toContain("eq(sandboxPosts.status, 'active')");
    expect(middleware).toContain('await ensureSandboxPostSchema(database)');
    expect(middleware).toContain("getOgImageUrl(preferredImage, 'sandbox-post'");
    expect(proxy).toContain("router.get('/sandbox-post/:id'");
    expect(proxy).toContain('await ensureSandboxPostSchema(database)');
    expect(proxy).toContain("eq(sandboxPosts.status, 'active')");
  });
});
