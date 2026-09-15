import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PERFORMANCE_VIDEO_ACCEPT,
  PERFORMANCE_VIDEO_MAX_BYTES,
  PERFORMANCE_VIDEO_MAX_DURATION_SECONDS,
  getPerformanceVideoDurationError,
  getPerformanceVideoFileValidationError,
} from '../shared/performanceVideoUpload';
import {
  assertPerformanceUploadOwner,
  createPerformanceUploadSession,
  getExpectedPerformanceChunkLength,
  readPerformanceUploadInput,
  signPerformanceUploadSession,
  verifyPerformanceUploadSession,
} from './services/performanceVideoDirectUpload';

const component = readFileSync(resolve(process.cwd(), 'client/src/components/PerformanceVideoUpload.tsx'), 'utf8');
const profile = readFileSync(resolve(process.cwd(), 'client/src/pages/ArtistProfile.tsx'), 'utf8');
const router = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
const routes = readFileSync(resolve(process.cwd(), 'server/routes/videoUpload.ts'), 'utf8');
const portfolioManager = readFileSync(resolve(process.cwd(), 'client/src/components/VideoPortfolioManager.tsx'), 'utf8');

describe('Performance Video upload parity', () => {
  it('keeps five-minute and 500 MB limits while accepting the portfolio format choices', () => {
    expect(PERFORMANCE_VIDEO_MAX_DURATION_SECONDS).toBe(300);
    expect(PERFORMANCE_VIDEO_MAX_BYTES).toBe(500 * 1024 * 1024);
    expect(PERFORMANCE_VIDEO_ACCEPT).toContain('.mp4');
    expect(PERFORMANCE_VIDEO_ACCEPT).toContain('.mov');
    expect(PERFORMANCE_VIDEO_ACCEPT).toContain('.webm');
    expect(PERFORMANCE_VIDEO_ACCEPT).toContain('.avi');
    expect(PERFORMANCE_VIDEO_ACCEPT).toContain('.mkv');
    expect(getPerformanceVideoFileValidationError({ name: 'set.mkv', type: 'video/x-matroska', size: 10 })).toBeNull();
    expect(getPerformanceVideoFileValidationError({ name: 'set.exe', size: 10 })).toContain('not a supported video');
    expect(getPerformanceVideoFileValidationError({ name: 'set.mp4', type: 'video/mp4', size: PERFORMANCE_VIDEO_MAX_BYTES + 1 })).toContain('500 MB');
    expect(getPerformanceVideoFileValidationError({ name: 'set.mp4', type: 'video/mp4', size: 0 })).toContain('empty');
    expect(getPerformanceVideoDurationError(300)).toBeNull();
    expect(getPerformanceVideoDurationError(301)).toContain('5:00');
  });

  it('signs owner-bound expiring sessions and validates exact chunk lengths', () => {
    const input = readPerformanceUploadInput({
      durationSeconds: 180,
      sourceFormat: 'mp4',
      videoSize: 4 * 1024 * 1024 + 7,
      thumbnailSize: 4,
      videoMimeType: 'video/mp4',
      thumbnailMimeType: 'image/jpeg',
    });
    const session = createPerformanceUploadSession(input, { userId: 7, profileId: 11, sessionId: 'session', now: 1_000 });
    const verified = verifyPerformanceUploadSession(signPerformanceUploadSession(session), 1_001);
    expect(verified.purpose).toBe('performance-video');
    expect(verified.finalVideoKey).toContain('performance-videos/7/uploads/session/video.mp4');
    expect(verified.videoChunkCount).toBe(2);
    expect(getExpectedPerformanceChunkLength(verified, 'video', 1)).toBe(7);
    expect(() => assertPerformanceUploadOwner(verified, { userId: 8, profileId: 11 })).toThrow(/does not belong/);
    expect(() => verifyPerformanceUploadSession(signPerformanceUploadSession(session), session.expiresAt + 1)).toThrow(/expired/);
  });

  it('shows the requested URL and file options only after preserving guidelines consent', () => {
    expect(component).toContain('Video Guidelines');
    expect(component).toContain('I Agree — Upload Video');
    expect(component).toContain('Live performance recordings (concerts, gigs, showcases)');
    expect(component).toContain('Videos go live immediately. Community members can report content');
    expect(component).toContain('Formats: MP4, MOV, WebM, AVI, or MKV');
    expect(component).toContain('Maximum duration: 5 minutes');
    expect(component).toContain('Maximum file size: 500 MB');
    expect(component).toContain('Paste URL');
    expect(component).toContain('Upload File');
    expect(component).toContain('startPerformanceUpload');
    expect(component).toContain("await uploadChunks('video', videoChunks)");
    expect(component).toContain("await uploadChunks('thumbnail', thumbnailChunks)");
    expect(component).toContain('finalizePerformanceUpload');
    expect(component).toContain("finally {");
    expect(component).toContain("fileInputRef.current.value = ''");
  });

  it('normalizes hosted URLs server-side and renders public embeds without changing portfolio upload behavior', () => {
    expect(router).toContain('setPerformanceVideoByUrl');
    expect(router).toContain('parsePortfolioVideoUrl(input.videoUrl)');
    expect(router).toContain("performanceVideoStatus: 'approved'");
    expect(profile).toContain('performanceSource?.embedUrl');
    expect(profile).toContain('allowFullScreen');
    expect(profile).toContain('preload="auto"');
    expect(profile).toContain('playsInline');
    expect(routes).toContain("router.post('/performance/start'");
    expect(routes).toContain("router.post('/performance/chunk'");
    expect(routes).toContain("router.post('/performance/finalize'");
    expect(routes).toContain('assertPerformanceUploadOwner');
    expect(routes).toContain('validateAssembledVideoSource');
    expect(portfolioManager).toContain("startPortfolioUpload");
    expect(portfolioManager).toContain("finalizePortfolioUpload");
  });
});
