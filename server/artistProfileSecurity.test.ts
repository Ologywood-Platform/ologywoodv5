import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

describe('artist profile and media security boundaries', () => {
  it('uses safe artist identifiers and strict profile fields', () => {
    expect(source).toContain('const artistProfileId = z.number().int().safe().positive()');
    expect(source).toContain('const artistName = z.string().trim().min(1).max(200)');
    expect(source).toContain('const artistBio = z.string().trim().max(10_000)');
    expect(source).toContain('const artistGenres = z.array(z.string().trim().min(1).max(100)).max(20)');
    expect(source).toContain('const artistFee = z.number().finite().min(0).max(10_000_000)');
    expect(source).toContain('Maximum fee must be at least the minimum fee');
    expect(source).toContain('socialLinks: artistSocialLinks.optional()');
    expect(source).toContain('socialLinks: artistSocialLinks.optional()');
    expect(source).toContain('socialLinks: artistSocialLinks.optional()');
  });

  it('restricts profile links and public slug input to safe values', () => {
    expect(source).toContain("const artistUrl = z.string().trim().max(2_048).refine((value) => value === '' || /^https?:\\/\\//i.test(value)");
    expect(source).toContain("const artistRequiredUrl = z.string().trim().min(1).max(2_048).url().refine((value) => /^https?:\\/\\//i.test(value)");
    expect(source).toContain("slug: z.string().trim().min(1).max(255).regex");
    expect(source).toContain('.input(z.object({ id: artistProfileId }).strict())');
  });

  it('validates profile images and routes profile uploads through the shared image handler', () => {
    expect(source).toContain("const artistImageMime = z.string().trim().refine((value) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(value)");
    expect(source).toContain('const artistFileName = z.string().trim().min(1).max(255).regex');
    expect(source).toContain('const artistBase64Data = z.string().min(1).max(700_000_000)');
    expect(source).toContain('function decodeArtistBase64');
    expect(source).toContain('File MIME type does not match the data URL.');
    expect(source).toContain("const { url } = await handlePhotoUpload(input, ctx.user.id, 'artist-profile-photos')");
    expect(source).toContain('decodeArtistBase64(input.fileData, input.fileType, 10 * 1024 * 1024)');
  });

  it('bounds and validates performance-video upload keys and content', () => {
    expect(source).toContain("const artistVideoMime = z.string().trim().refine((value) => ['video/mp4', 'video/quicktime', 'video/webm'].includes(value)");
    expect(source).toContain('fileSizeBytes: z.number().int().safe().min(1).max(500 * 1024 * 1024');
    expect(source).toContain('durationSeconds: z.number().finite().min(0).max(300');
    expect(source).toContain('performance-videos\\/\\d+\\/\\d+\\.(?:mp4|mov|webm)');
    expect(source).toContain('Upload key does not belong to this artist');
    expect(source).toContain('decodeArtistBase64(input.fileData, input.mimeType, 500 * 1024 * 1024)');
  });

  it('keeps portfolio video reads public but binds mutations to the artist profile', () => {
    expect(source).toContain('.input(z.object({ artistProfileId }).strict())');
    expect(source).toContain('.input(z.object({ videoId: artistProfileId }).strict())');
    expect(source).toContain('category: portfolioVideoCategory');
    expect(source).toContain('sortOrder: portfolioSortOrder');
    expect(source).toContain("SELECT id FROM video_portfolio WHERE id = ? AND artistProfileId = ?");
    expect(source).toContain("Maximum 10 videos allowed in your portfolio");
    expect(source).toContain('video-portfolio/${ctx.user.id}/${timestamp}.${extension}');
    expect(source).toContain('videoUrl: artistRequiredUrl');
  });
});
