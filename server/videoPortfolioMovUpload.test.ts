import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOV_BROWSER_COMPATIBILITY_ERROR,
  PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS,
  PORTFOLIO_VIDEO_READ_TIMEOUT_MS,
  getPortfolioUploadChunks,
  preparePortfolioVideoForBrowser,
} from '../client/src/lib/portfolioVideoUpload';
import {
  PORTFOLIO_MAX_VIDEO_BYTES,
  PORTFOLIO_UPLOAD_CHUNK_BYTES,
  PortfolioUploadValidationError,
  assertUploadSessionOwner,
  createPortfolioUploadSession,
  getExpectedChunkLength,
  getUploadChunkKey,
  readPortfolioUploadInput,
  signPortfolioUploadSession,
  validateAssembledMedia,
  verifyPortfolioUploadSession,
} from './services/videoPortfolioDirectUpload';

const validInput = {
  title: 'Creator clip',
  category: 'other',
  durationSeconds: 15,
  videoSize: 38_930_135,
  thumbnailSize: 54_581,
  videoMimeType: 'video/mp4',
  thumbnailMimeType: 'image/jpeg',
};

describe('Video Portfolio MOV browser compatibility', () => {
  it('relabels MOV bytes as MP4 without changing their contents, size, or timestamp', async () => {
    const bytes = new Uint8Array([0, 0, 0, 20, 102, 116, 121, 112, 113, 116, 32, 32]);
    const source = new File([bytes], 'creator-clip.mov', {
      type: 'video/quicktime',
      lastModified: 1_725_000_000_000,
    });
    const prepared = preparePortfolioVideoForBrowser(source);
    expect(prepared.relabeledMov).toBe(true);
    expect(prepared.file.name).toBe('creator-clip.mp4');
    expect(prepared.file.type).toBe('video/mp4');
    expect(prepared.file.size).toBe(source.size);
    expect(prepared.file.lastModified).toBe(source.lastModified);
    expect(new Uint8Array(await prepared.file.arrayBuffer())).toEqual(bytes);
  });

  it('leaves existing MP4 and WebM files unchanged', () => {
    const mp4 = new File(['mp4'], 'clip.mp4', { type: 'video/mp4' });
    const webm = new File(['webm'], 'clip.webm', { type: 'video/webm' });
    expect(preparePortfolioVideoForBrowser(mp4)).toEqual({ file: mp4, relabeledMov: false });
    expect(preparePortfolioVideoForBrowser(webm)).toEqual({ file: webm, relabeledMov: false });
  });

  it('slices large files into exact bounded chunks without changing bytes', async () => {
    const source = new Blob([new Uint8Array(PORTFOLIO_UPLOAD_CHUNK_BYTES * 2 + 7).fill(42)]);
    const chunks = getPortfolioUploadChunks(source, PORTFOLIO_UPLOAD_CHUNK_BYTES);
    expect(chunks.map(chunk => chunk.size)).toEqual([PORTFOLIO_UPLOAD_CHUNK_BYTES, PORTFOLIO_UPLOAD_CHUNK_BYTES, 7]);
    expect(new Uint8Array(await chunks[2].arrayBuffer())).toEqual(new Uint8Array(7).fill(42));
  });

  it('provides bounded waits, same-origin chunk endpoints, progress, and spinner recovery', () => {
    expect(PORTFOLIO_VIDEO_READ_TIMEOUT_MS).toBe(20_000);
    expect(PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS).toBe(180_000);
    expect(MOV_BROWSER_COMPATIBILITY_ERROR).toContain('H.264');
    expect(MOV_BROWSER_COMPATIBILITY_ERROR).toContain('AAC');
    expect(MOV_BROWSER_COMPATIBILITY_ERROR).toContain('MP4');

    const manager = readFileSync(resolve(process.cwd(), 'client/src/components/VideoPortfolioManager.tsx'), 'utf8');
    const helper = readFileSync(resolve(process.cwd(), 'client/src/lib/portfolioVideoUpload.ts'), 'utf8');
    expect(manager).toContain('preparePortfolioVideoForBrowser(uploadFile)');
    expect(manager).toContain("await uploadChunks('video', videoChunks)");
    expect(manager).toContain("await uploadChunks('thumbnail', thumbnailChunks)");
    expect(manager).toContain('await finalizePortfolioUpload(session.token)');
    expect(helper).toContain("fetch('/api/video/portfolio/start'");
    expect(helper).toContain("xhr.open('POST', '/api/video/portfolio/chunk')");
    expect(helper).toContain("fetch('/api/video/portfolio/finalize'");
    expect(helper).toContain("xhr.addEventListener('timeout'");
    expect(manager).toContain('finally {');
    expect(manager).toContain('setUploading(false)');
  });
});

describe('Video Portfolio authenticated chunk sessions', () => {
  it('accepts the supplied-file class and enforces the existing 100 MB and two-minute limits', () => {
    const input = readPortfolioUploadInput(validInput);
    expect(input.videoSize).toBe(38_930_135);
    expect(input.duration).toBe(15);
    expect(() => readPortfolioUploadInput({ ...validInput, videoSize: PORTFOLIO_MAX_VIDEO_BYTES + 1 })).toThrow('under 100MB');
    expect(() => readPortfolioUploadInput({ ...validInput, durationSeconds: 121 })).toThrow('2 minutes');
    expect(() => readPortfolioUploadInput({ ...validInput, videoMimeType: 'video/quicktime' })).toThrow('MP4 and WebM');
  });

  it('binds an expiring signed session to one owner, profile, and deterministic key root', () => {
    const input = readPortfolioUploadInput(validInput);
    const payload = createPortfolioUploadSession(input, { userId: 7, profileId: 11, sessionId: 'session-abc', now: 1_000 });
    const token = signPortfolioUploadSession(payload);
    expect(verifyPortfolioUploadSession(token, 2_000)).toEqual(payload);
    expect(payload.videoChunkCount).toBe(10);
    expect(payload.thumbnailChunkCount).toBe(1);
    expect(payload.finalVideoKey).toBe('video-portfolio/7/uploads/session-abc/video.mp4');
    expect(() => assertUploadSessionOwner(payload, { userId: 8, profileId: 11 })).toThrow('does not belong');
    expect(() => verifyPortfolioUploadSession(`${token}tampered`, 2_000)).toThrow('Invalid upload confirmation');
    expect(() => verifyPortfolioUploadSession(token, payload.expiresAt + 1)).toThrow('expired');
  });

  it('enforces exact chunk indexes and expected final-chunk lengths', () => {
    const payload = createPortfolioUploadSession(readPortfolioUploadInput(validInput), {
      userId: 7,
      profileId: 11,
      sessionId: 'session-lengths',
    });
    expect(getExpectedChunkLength(payload, 'video', 0)).toBe(PORTFOLIO_UPLOAD_CHUNK_BYTES);
    expect(getExpectedChunkLength(payload, 'video', 9)).toBe(1_181_399);
    expect(getExpectedChunkLength(payload, 'thumbnail', 0)).toBe(54_581);
    expect(getUploadChunkKey(payload, 'video', 0)).toContain('/chunks/video-0.part');
    expect(() => getUploadChunkKey(payload, 'video', 10)).toThrow('Invalid upload chunk');
  });

  it('accepts real media signatures and rejects declared types with fake bytes', () => {
    expect(() => validateAssembledMedia(Buffer.from([0, 0, 0, 20, 102, 116, 121, 112]), 'video')).not.toThrow();
    expect(() => validateAssembledMedia(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'thumbnail')).not.toThrow();
    expect(() => validateAssembledMedia(Buffer.from('not-video'), 'video')).toThrow(PortfolioUploadValidationError);
    expect(() => validateAssembledMedia(Buffer.from('not-image'), 'thumbnail')).toThrow(PortfolioUploadValidationError);
  });

  it('wires authenticated raw chunks, assembly, signature checks, and duplicate finalization protection', () => {
    const route = readFileSync(resolve(process.cwd(), 'server/routes/videoUpload.ts'), 'utf8');
    expect(route).toContain("express.raw({ type: 'application/octet-stream', limit: '5mb' })");
    expect(route).toContain('sdk.authenticateRequest');
    expect(route).toContain('assertUploadSessionOwner');
    expect(route).toContain('body.length !== expectedLength');
    expect(route).toContain('assembleUploadedAsset');
    expect(route).toContain('validateAssembledMedia');
    expect(route).toContain('This upload was already added to your portfolio');
  });
});
