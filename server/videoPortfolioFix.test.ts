import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePortfolioVideoUrl } from '../shared/videoPortfolio';
import {
  ensureVideoPortfolioSchema,
  resetVideoPortfolioSchemaCheckForTests,
} from './services/videoPortfolioSchemaService';

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('portfolio video URL normalization', () => {
  it('normalizes YouTube watch, short, and Shorts URLs for saving and playback', () => {
    expect(parsePortfolioVideoUrl('https://youtu.be/AbCdEf12345?t=12')).toMatchObject({
      normalizedUrl: 'https://www.youtube.com/watch?v=AbCdEf12345',
      kind: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/AbCdEf12345',
      thumbnailUrl: 'https://img.youtube.com/vi/AbCdEf12345/hqdefault.jpg',
    });
    expect(parsePortfolioVideoUrl('https://www.youtube.com/shorts/ZyXwVu98765')).toMatchObject({
      kind: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/ZyXwVu98765',
    });
  });

  it('normalizes Vimeo links and accepts direct video files', () => {
    expect(parsePortfolioVideoUrl('https://vimeo.com/123456789')).toMatchObject({
      kind: 'vimeo',
      embedUrl: 'https://player.vimeo.com/video/123456789',
    });
    expect(parsePortfolioVideoUrl('https://cdn.example.com/clips/art-show.mp4?download=1')).toMatchObject({
      kind: 'direct',
      embedUrl: null,
    });
  });

  it('rejects unsafe protocols and non-video webpages', () => {
    expect(parsePortfolioVideoUrl('javascript:alert(1)')).toBeNull();
    expect(parsePortfolioVideoUrl('https://example.com/article')).toBeNull();
    expect(parsePortfolioVideoUrl('not a url')).toBeNull();
  });
});

describe('legacy video portfolio schema repair', () => {
  beforeEach(() => resetVideoPortfolioSchemaCheckForTests());

  it('renames the legacy url column and adds soft-removal status without deleting rows', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[{ Field: 'id' }, { Field: 'url' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await ensureVideoPortfolioSchema({ execute });

    expect(execute).toHaveBeenNthCalledWith(2, 'ALTER TABLE `video_portfolio` CHANGE COLUMN `url` `videoUrl` text NOT NULL');
    expect(execute).toHaveBeenNthCalledWith(3, "ALTER TABLE `video_portfolio` ADD COLUMN `status` enum('active','processing','removed') NOT NULL DEFAULT 'active'");
    expect(execute.mock.calls.flat().join(' ')).not.toMatch(/DROP|DELETE|TRUNCATE/i);
  });

  it('copies legacy values when deployment already added videoUrl beside url', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[{ Field: 'id' }, { Field: 'url' }, { Field: 'videoUrl' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await ensureVideoPortfolioSchema({ execute });

    expect(execute).toHaveBeenNthCalledWith(2, "UPDATE `video_portfolio` SET `videoUrl` = `url` WHERE (`videoUrl` IS NULL OR `videoUrl` = '') AND `url` IS NOT NULL");
    expect(execute).toHaveBeenNthCalledWith(3, "ALTER TABLE `video_portfolio` ADD COLUMN `status` enum('active','processing','removed') NOT NULL DEFAULT 'active'");
  });
});

describe('portfolio upload and playback integration', () => {
  it('uses a multipart S3 endpoint with ownership, size, duration, category, and catalog-limit checks', () => {
    const route = projectFile('server/routes/videoUpload.ts');
    expect(route).toContain("router.post('/portfolio', portfolioUpload.fields([");
    expect(route).toContain("{ name: 'video', maxCount: 1 }");
    expect(route).toContain("{ name: 'thumbnail', maxCount: 1 }");
    expect(route).toContain('sdk.authenticateRequest');
    expect(route).toContain('getArtistProfileByUserId(user.id)');
    expect(route).toContain('100 * 1024 * 1024');
    expect(route).toContain('duration > 120');
    expect(route).toContain('VIDEO_PORTFOLIO_CATEGORIES.includes(category)');
    expect(route).toContain('storagePut(fileKey, file.buffer, file.mimetype)');
    expect(route).toContain('storagePut(thumbnailKey, thumbnail.buffer, thumbnail.mimetype)');
    expect(route).toContain('thumbnailUrl, category, duration');
    expect(route).toContain('ensureVideoPortfolioSchema');
  });

  it('opens an explicit file picker, avoids base64 conversion, and always clears loading state', () => {
    const manager = projectFile('client/src/components/VideoPortfolioManager.tsx');
    expect(manager).toContain("fileInputRef.current?.click()");
    expect(manager).toContain("xhr.open('POST', '/api/video/portfolio')");
    expect(manager).toContain("formData.append('thumbnail', thumbnail");
    expect(manager).toContain("canvas.width = 1200");
    expect(manager).toContain("canvas.height = 630");
    expect(manager).toContain('Math.min(Math.max(duration * 0.25, 1), 15)');
    expect(manager).toContain('finally {');
    expect(manager).toContain('setUploading(false)');
    expect(manager).toContain("fileInputRef.current.value = ''");
    expect(manager).not.toContain('FileReader');
  });

  it('normalizes URL saves and renders hosted links on clean slug profiles', () => {
    const router = projectFile('server/routers.ts');
    const profile = projectFile('client/src/pages/ArtistProfile.tsx');
    expect(router).toContain('parsePortfolioVideoUrl(input.videoUrl)');
    expect(router).toContain('source.normalizedUrl');
    expect(router).toContain('source.thumbnailUrl');
    expect(profile).toContain('Number(artist?.id || artistId)');
    expect(profile).toContain('activeVideo.embedUrl');
    expect(profile).toContain('<iframe');
  });
});
