import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Blog security boundaries', () => {
  it('uses safe IDs and bounded integer pagination', () => {
    const source = read('./routers/blog.ts');
    expect(source).toContain('const blogPostId = z.number().int().safe().positive()');
    expect(source).toContain('const blogLimit = z.number().int().min(1).max(100)');
    expect(source).toContain('const blogOffset = z.number().int().min(0).max(1_000_000)');
    expect(source).toContain('id: blogPostId');
    expect(source).toContain('}).strict()');
  });

  it('bounds post content and restricts cover URLs to HTTP(S)', () => {
    const source = read('./routers/blog.ts');
    expect(source).toContain('content: blogText.max(200_000)');
    expect(source).toContain('const blogImageUrl = z.string().trim().url().max(2_000)');
    expect(source).toContain('Cover image URL must use HTTP(S)');
    expect(source).toContain('const blogTags = z.array(z.string().trim().min(1).max(50)).max(20)');
  });

  it('validates data-url MIME, decoded image size, and extension from MIME', () => {
    const source = read('./routers/blog.ts');
    expect(source).toContain('Image MIME type does not match the data URL.');
    expect(source).toContain('Invalid base64 image data.');
    expect(source).toContain('buffer.length > 10_000_000');
    expect(source).toContain("'image/jpeg': 'jpg'");
    expect(source).toContain('storagePut(fileKey, buffer, input.mimeType)');
  });
});
