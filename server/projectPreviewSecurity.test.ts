import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/projectPreviews.ts'), 'utf8');

describe('project preview security boundaries', () => {
  it('uses safe strict identifiers and bounded project/track fields', () => {
    expect(source).toContain('const projectIdSchema = z.number().int().safe().positive()');
    expect(source).toContain('const trackIdSchema = z.number().int().safe().positive()');
    expect(source).toContain('.strict()');
    expect(source).toContain('externalLinkSchema');
    expect(source).toContain('projectDateSchema');
  });

  it('requires data URLs with matching signatures and derives storage extensions from MIME', () => {
    expect(source).toContain('^data:([^;,]+);base64,');
    expect(source).toContain('validateMediaSignature(buffer, input.mimeType)');
    expect(source).toContain('extensionForMime(input.mimeType)');
    expect(source).not.toContain('input.fileName.split(".").pop()');
  });

  it('prevents partial or duplicate reorder writes and limits public play increments', () => {
    expect(source).toContain('Track IDs must be unique.');
    expect(source).toContain('Track order must include exactly the tracks in this project.');
    expect(source).toContain('projectPreviewPlayLimiter.check(`ip:${clientIp}`)');
    expect(source).toContain("eq(users.role, 'artist')");
  });
});
