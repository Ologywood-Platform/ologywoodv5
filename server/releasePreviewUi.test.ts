import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MAX_BYTES,
  MAX_INPUT_SECONDS,
  MAX_SECONDS,
  getReleasePreviewKind,
  getReleasePreviewMimeType,
  validateReleasePreviewFile,
} from '../shared/releasePreview';

describe('Content Release 30-second preview client contract', () => {
  it('shares the exact 30-second, 20 MB and five-minute input boundaries', () => {
    expect(MAX_SECONDS).toBe(30);
    expect(MAX_BYTES).toBe(20 * 1024 * 1024);
    expect(MAX_INPUT_SECONDS).toBe(5 * 60);
  });

  it('accepts the documented audio/video file formats, including blank browser MIME types', () => {
    expect(getReleasePreviewMimeType({ name: 'clip.M4A', type: '', size: 100 })).toBe('audio/mp4');
    expect(getReleasePreviewKind({ name: 'trailer.mov', type: 'video/quicktime' })).toBe('video');
    expect(getReleasePreviewKind({ name: 'song.flac', type: 'audio/flac' })).toBe('audio');
    expect(validateReleasePreviewFile({ name: 'clip.exe', type: 'application/octet-stream', size: 100 })).toContain('MP3');
    expect(validateReleasePreviewFile({ name: 'clip.mp3', type: 'audio/mpeg', size: MAX_BYTES + 1 })).toContain('20 MB');
  });

  it('keeps preview media opaque, fetches a signed URL only on demand, and does not use the paid source as media', () => {
    const player = readFileSync('client/src/components/ContentReleasePreview.tsx', 'utf8');
    const form = readFileSync('client/src/pages/ContentReleases.tsx', 'utf8');
    const publicCards = readFileSync('client/src/components/ContentReleasesDisplay.tsx', 'utf8');

    expect(player).toContain('trpc.contentRelease.uploadPreview.useMutation()');
    expect(player).toContain('trpc.contentRelease.getPreview.useQuery');
    expect(player).toContain('{ enabled: false, retry: false }');
    expect(player).toContain('src: preview.previewUrl');
    expect(player).not.toContain('contentUrl');
    expect(player).toContain('onTimeUpdate: stopAtCap');
    expect(player).toContain('onSeeking: clampSeek');
    expect(player).toContain("Preview (0:30)");
    expect(player).toContain('Preview not added yet');
    expect(form).toContain('setPreviewMedia(release.previewMedia || "")');
    expect(form).toContain('previewMedia');
    expect(form).toContain('isUploadingCover || isUploadingPreview');
    expect(publicCards).toContain("owner?'Open full release':'Watch / Listen'");
    expect(publicCards).toContain('hasPreview={release.hasPreview === true}');
  });

  it('never presigns the full song in the public preview endpoint', () => {
    const source = readFileSync('server/routes/releaseDownload.ts', 'utf8');
    const preview = source.slice(source.indexOf('router.get("/preview/:releaseId"'));
    expect(preview).toContain('getMusicPreview(sourceKey)');
    expect(preview).not.toContain('storageGet(');
    expect(preview).toContain('release.status !== "published"');
    const card = readFileSync('client/src/components/ReleaseCard.tsx', 'utf8');
    expect(card).toContain('release.hasPreview ??');
    expect(card).toContain('Math.min(audio.duration || PREVIEW_MAX_SECONDS, PREVIEW_MAX_SECONDS)');
    expect(card).not.toContain('hasPreviewFile ?');
  });

  it('explains hosted samples without claiming external paid links can be automatically clipped', () => {
    const help = readFileSync('client/src/pages/Help.tsx', 'utf8');
    const ai = readFileSync('server/routers/aiChat.ts', 'utf8');
    expect(help).toContain('How do 30-second release previews work?');
    expect(ai).toContain('OlogyWood does not extract private content from external hosting links.');
    expect(ai).toContain('return RELEASE_PREVIEW_GUIDANCE');
  });
});
