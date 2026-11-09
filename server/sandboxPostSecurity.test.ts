import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/sandboxPost.ts'), 'utf8');

describe('Sandbox Post input hardening', () => {
  it('uses strict bounded media and post payloads', () => {
    expect(source).toContain("fileName: z.string().trim().min(1).max(255).refine");
    expect(source).toContain('fileSizeBytes: z.number().int().safe().positive().max(SANDBOX_POST_MAX_VIDEO_BYTES)');
    expect(source).toContain('fileData: z.string().min(1).max(36_000_000)');
    expect(source).toContain('}).strict();');
    expect(source).toContain('content: z.string().trim().max(SANDBOX_POST_MAX_CHARACTERS)');
  });

  it('requires MIME-matched valid base64 media data and keeps owner/admin boundaries', () => {
    expect(source).toContain("/^data:([^;,]+);base64,");
    expect(source).toContain('decodeDataUrl(media.fileData, media.mimeType)');
    expect(source).toContain("decodeDataUrl(media.thumbnailData, 'image/jpeg')");
    expect(source).toContain("role !== 'artist' && role !== 'admin'");
    expect(source).toContain("setHidden: adminProcedure.input(z.object({ postId: z.number().int().safe().positive(), hidden: z.boolean() }).strict())");
  });

  it('bounds public profile identifiers and slug syntax', () => {
    expect(source).toContain('artistProfileId: z.number().int().safe().positive()');
    expect(source).toContain("slug: z.string().trim().min(1).max(255).regex");
    expect(source).toContain("eq(sandboxPosts.status, 'active')");
  });
});
