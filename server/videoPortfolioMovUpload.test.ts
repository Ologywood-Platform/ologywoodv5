import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOV_BROWSER_COMPATIBILITY_ERROR,
  PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS,
  PORTFOLIO_VIDEO_READ_TIMEOUT_MS,
  getPortfolioUploadChunks,
  preparePortfolioVideoForBrowser,
  preparePortfolioVideoForServerConversion,
} from '../client/src/lib/portfolioVideoUpload';
import {
  PORTFOLIO_VIDEO_ACCEPT,
  PORTFOLIO_VIDEO_MAX_BYTES,
  formatPortfolioDuration,
  getPortfolioFileValidationError,
  getPortfolioVideoSourceFormat,
  portfolioVideoRequiresConversion,
} from '../shared/videoPortfolioUpload';
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
  validateAssembledVideoSource,
  verifyPortfolioUploadSession,
} from './services/videoPortfolioDirectUpload';

const validInput = {
  title: 'Creator clip',
  category: 'other',
  durationSeconds: 15,
  sourceFormat: 'mp4',
  videoSize: 38_930_135,
  thumbnailSize: 54_581,
  videoMimeType: 'video/mp4',
  thumbnailMimeType: 'image/jpeg',
};

describe('Video Portfolio browser and source format compatibility', () => {
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
    expect(preparePortfolioVideoForServerConversion(new File(['mp4'], 'clip.mp4', { type: '' })).file.type).toBe('video/mp4');
    expect(preparePortfolioVideoForServerConversion(new File(['webm'], 'clip.webm', { type: '' })).file.type).toBe('video/webm');
  });

  it('recognizes every supported container and normalizes AVI/MKV MIME types for server conversion', () => {
    expect(getPortfolioVideoSourceFormat('clip.mp4')).toBe('mp4');
    expect(getPortfolioVideoSourceFormat('clip.MOV')).toBe('mov');
    expect(getPortfolioVideoSourceFormat('clip.webm')).toBe('webm');
    expect(getPortfolioVideoSourceFormat('clip.avi')).toBe('avi');
    expect(getPortfolioVideoSourceFormat('clip.mkv')).toBe('mkv');
    expect(getPortfolioVideoSourceFormat('clip.exe', 'video/mp4')).toBeNull();
    expect(portfolioVideoRequiresConversion('avi')).toBe(true);
    expect(portfolioVideoRequiresConversion('mkv')).toBe(true);

    const avi = new File(['avi'], 'clip.avi', { type: '' });
    const mkv = new File(['mkv'], 'clip.mkv', { type: 'application/octet-stream' });
    expect(preparePortfolioVideoForServerConversion(avi).file.type).toBe('video/x-msvideo');
    expect(preparePortfolioVideoForServerConversion(mkv).file.type).toBe('video/x-matroska');
    expect(PORTFOLIO_VIDEO_ACCEPT).toContain('.avi');
    expect(PORTFOLIO_VIDEO_ACCEPT).toContain('.mkv');
  });

  it('returns specific unsupported-format and over-size errors before upload', () => {
    expect(getPortfolioFileValidationError({ name: 'clip.exe', type: 'application/octet-stream', size: 25 })).toBe(
      '“clip.exe” is not a supported video. Choose MP4, MOV, WebM, AVI, or MKV.',
    );
    expect(getPortfolioFileValidationError({ name: 'large.mkv', type: 'video/x-matroska', size: PORTFOLIO_VIDEO_MAX_BYTES + 1 })).toBe(
      'This file is 100.0 MB. Video Portfolio uploads must be 100 MB or smaller.',
    );
    expect(getPortfolioFileValidationError({ name: 'empty.mp4', type: 'video/mp4', size: 0 })).toBe(
      'This video file is empty. Choose a different file.',
    );
    expect(formatPortfolioDuration(125.1)).toBe('2:06');
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
    expect(() => readPortfolioUploadInput({ ...validInput, videoSize: PORTFOLIO_MAX_VIDEO_BYTES + 1 })).toThrow('100 MB or smaller');
    expect(() => readPortfolioUploadInput({ ...validInput, durationSeconds: 121 })).toThrow('2 minutes');
    expect(() => readPortfolioUploadInput({ ...validInput, videoMimeType: 'video/quicktime' })).toThrow('does not match');

    const avi = readPortfolioUploadInput({
      ...validInput,
      sourceFormat: 'avi',
      durationSeconds: 0,
      videoMimeType: 'video/x-msvideo',
      thumbnailSize: 0,
      thumbnailMimeType: '',
    });
    expect(avi.requiresConversion).toBe(true);
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

  it('creates conversion sessions without client thumbnails and always targets MP4/JPEG output', () => {
    const input = readPortfolioUploadInput({
      ...validInput,
      sourceFormat: 'mkv',
      durationSeconds: 0,
      videoMimeType: 'video/x-matroska',
      thumbnailSize: 0,
      thumbnailMimeType: '',
    });
    const payload = createPortfolioUploadSession(input, { userId: 7, profileId: 11, sessionId: 'session-mkv' });
    expect(payload.requiresConversion).toBe(true);
    expect(payload.thumbnailChunkCount).toBe(0);
    expect(payload.finalVideoKey).toMatch(/video\.mp4$/);
    expect(payload.finalThumbnailKey).toMatch(/thumbnail\.jpg$/);
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
    expect(() => validateAssembledVideoSource(Buffer.from('RIFFxxxxAVI '), 'avi')).not.toThrow();
    expect(() => validateAssembledVideoSource(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), 'mkv')).not.toThrow();
    expect(() => validateAssembledMedia(Buffer.from('not-video'), 'video')).toThrow(PortfolioUploadValidationError);
    expect(() => validateAssembledVideoSource(Buffer.from('not-avi'), 'avi')).toThrow('valid AVI');
    expect(() => validateAssembledMedia(Buffer.from('not-image'), 'thumbnail')).toThrow(PortfolioUploadValidationError);
  });

  it('wires authenticated raw chunks, conversion, assembly, signature checks, and duplicate finalization protection', () => {
    const route = readFileSync(resolve(process.cwd(), 'server/routes/videoUpload.ts'), 'utf8');
    expect(route).toContain("express.raw({ type: 'application/octet-stream', limit: '5mb' })");
    expect(route).toContain('sdk.authenticateRequest');
    expect(route).toContain('assertUploadSessionOwner');
    expect(route).toContain('body.length !== expectedLength');
    expect(route).toContain('assembleUploadedAsset');
    expect(route).toContain('convertPortfolioVideo');
    expect(route).toContain('const videoUrl = storedVideo.url');
    expect(route).toContain('videoUrl LIKE ?');
    expect(route).toContain('validateAssembledMedia');
    expect(route).toContain('This upload was already added to your portfolio');
  });

  it('ships FFmpeg in the production image and presents clear conversion UX', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
    const manager = readFileSync(resolve(process.cwd(), 'client/src/components/VideoPortfolioManager.tsx'), 'utf8');
    const conversion = readFileSync(resolve(process.cwd(), 'server/services/videoPortfolioConversion.ts'), 'utf8');
    expect(dockerfile).toContain('FROM node:22-slim');
    expect(dockerfile).toContain('ffmpeg ca-certificates');
    expect(dockerfile).toContain('corepack pnpm run build');
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
    expect(manager).toContain('MP4, MOV, WebM, AVI, or MKV');
    expect(manager).toContain('Preparing a browser-ready MP4');
    expect(manager).toContain('getPortfolioFileValidationError(file)');
    expect(conversion).toContain("spawn(command, args, { shell: false");
    expect(conversion).toContain("await rm(workDir, { recursive: true, force: true })");
    expect(conversion).toContain('does not contain a readable video stream');
    expect(conversion).toContain("'-movflags', '+faststart'");
    expect(conversion).toContain("'-map_metadata', '-1'");
  });
});
