import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  storageGet: vi.fn(),
  storagePut: vi.fn(),
}));

// This is the same module resolved by ../storage from services/releasePreviewMedia.
vi.mock('./storage', () => ({
  storageGet: storage.storageGet,
  storagePut: storage.storagePut,
}));

import {
  PREVIEW_INPUT_BYTES,
  clipReleasePreview,
  decodePreviewUpload,
  getMusicPreview,
  readPreviewReference,
  signPreviewReference,
} from './services/releasePreviewMedia';

const execFileAsync = promisify(execFile);

let fixtureDir = '';
let longAudio = Buffer.alloc(0);
let shortAudio = Buffer.alloc(0);
let longVideo = Buffer.alloc(0);
let silentVideo = Buffer.alloc(0);
let tooLongAudio = Buffer.alloc(0);

type ProbeInfo = {
  format: { duration?: string; format_name?: string; tags?: Record<string, string> };
  streams: Array<{ codec_type: string; width?: number; height?: number }>;
};

async function ffmpeg(args: string[]) {
  await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    maxBuffer: 1024 * 1024,
  });
}

async function probe(file: string): Promise<ProbeInfo> {
  const { stdout } = await execFileAsync(
    'ffprobe',
    [
      '-v', 'error',
      '-show_entries', 'format=duration,format_name:format_tags:stream=codec_type,width,height',
      '-of', 'json',
      file,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  return JSON.parse(stdout) as ProbeInfo;
}

function duration(info: ProbeInfo): number {
  return Number(info.format.duration);
}

async function writePreview(name: string, bytes: Buffer) {
  const target = join(fixtureDir, name);
  await writeFile(target, bytes);
  return probe(target);
}

describe.sequential('release preview media', () => {
  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', 'release-preview-media-test-secret');
    fixtureDir = await mkdtemp(join(tmpdir(), 'ology-release-preview-media-test-'));

    const longAudioPath = join(fixtureDir, 'synthetic-45-seconds.mp3');
    const shortAudioPath = join(fixtureDir, 'synthetic-4-seconds.mp3');
    const longVideoPath = join(fixtureDir, 'synthetic-40-seconds.mp4');
    const silentVideoPath = join(fixtureDir, 'synthetic-video-without-audio.mp4');
    const tooLongAudioPath = join(fixtureDir, 'synthetic-301-seconds.mp3');

    await ffmpeg([
      '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100',
      '-t', '45', '-c:a', 'libmp3lame', '-b:a', '64k',
      '-metadata', 'title=Original private track title',
      '-metadata', 'comment=Original private comment',
      longAudioPath,
    ]);
    await ffmpeg([
      '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=44100',
      '-t', '4', '-c:a', 'libmp3lame', '-b:a', '64k',
      shortAudioPath,
    ]);
    await ffmpeg([
      '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=12',
      '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=44100',
      '-t', '40', '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '64k',
      '-metadata', 'title=Original private video title',
      longVideoPath,
    ]);
    await ffmpeg([
      '-f', 'lavfi', '-i', 'color=c=black:s=160x90:r=12',
      '-t', '3', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      silentVideoPath,
    ]);
    // A compressed, generated silent source keeps this duration boundary test small and fast.
    await ffmpeg([
      '-f', 'lavfi', '-i', 'anullsrc=r=8000:cl=mono',
      '-t', '301', '-c:a', 'libmp3lame', '-b:a', '8k',
      tooLongAudioPath,
    ]);

    [longAudio, shortAudio, longVideo, silentVideo, tooLongAudio] = await Promise.all([
      readFile(longAudioPath),
      readFile(shortAudioPath),
      readFile(longVideoPath),
      readFile(silentVideoPath),
      readFile(tooLongAudioPath),
    ]);
  }, 30_000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await rm(fixtureDir, { recursive: true, force: true });
    // Vitest restores the prior value (including an existing real JWT_SECRET); do not delete it.
    vi.unstubAllEnvs();
  });

  it('clips a 45-second audio source to 30 seconds, removes source metadata, and emits valid MP3', async () => {
    const sourceInfo = await writePreview('inspect-original-long.mp3', longAudio);
    expect(duration(sourceInfo)).toBeGreaterThan(44);

    const preview = await clipReleasePreview(longAudio, { audioOnly: true });
    const outputInfo = await writePreview('clipped-long.mp3', preview.data);

    expect(preview).toMatchObject({ kind: 'audio', mimeType: 'audio/mpeg', extension: 'mp3' });
    expect(preview.durationSeconds).toBeLessThanOrEqual(30);
    expect(duration(outputInfo)).toBeLessThanOrEqual(30.1);
    expect(outputInfo.format.format_name?.split(',')).toContain('mp3');
    expect(outputInfo.streams.some((stream) => stream.codec_type === 'audio')).toBe(true);
    expect(outputInfo.format.tags?.title).toBeUndefined();
    expect(outputInfo.format.tags?.comment).toBeUndefined();
    expect(preview.data.equals(longAudio)).toBe(false);
  }, 30_000);

  it('keeps a short audio source at its original duration rather than extending it to 30 seconds', async () => {
    const sourceInfo = await writePreview('inspect-original-short.mp3', shortAudio);
    const preview = await clipReleasePreview(shortAudio, { audioOnly: true });
    const outputInfo = await writePreview('clipped-short.mp3', preview.data);

    expect(duration(sourceInfo)).toBeLessThan(5);
    expect(preview.durationSeconds).toBeLessThan(5);
    expect(preview.durationSeconds).toBeCloseTo(duration(sourceInfo), 1);
    expect(duration(outputInfo)).toBeCloseTo(duration(sourceInfo), 1);
  }, 30_000);

  it('clips a low-resolution 40-second video to a valid MP4 no longer than 30 seconds', async () => {
    const sourceInfo = await writePreview('inspect-original-video.mp4', longVideo);
    expect(duration(sourceInfo)).toBeGreaterThan(39);
    expect(sourceInfo.streams.find((stream) => stream.codec_type === 'video')).toMatchObject({
      width: 320,
      height: 180,
    });

    const preview = await clipReleasePreview(longVideo);
    const outputInfo = await writePreview('clipped-video.mp4', preview.data);

    expect(preview).toMatchObject({ kind: 'video', mimeType: 'video/mp4', extension: 'mp4' });
    expect(preview.durationSeconds).toBeLessThanOrEqual(30);
    expect(duration(outputInfo)).toBeLessThanOrEqual(30.1);
    expect(outputInfo.format.format_name?.split(',')).toContain('mp4');
    expect(outputInfo.streams.some((stream) => stream.codec_type === 'video')).toBe(true);
  }, 30_000);

  it('rejects text playlists before they can be interpreted by FFmpeg', async () => {
    await expect(clipReleasePreview(Buffer.from('#EXTM3U\nhttps://not-a-media-file.example/private.mp3\n')))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects fake text presented as media bytes', async () => {
    await expect(clipReleasePreview(Buffer.from('this is not audio or video data')))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  }, 30_000);

  it('rejects empty and oversized preview inputs without processing them', async () => {
    await expect(clipReleasePreview(Buffer.alloc(0))).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(clipReleasePreview(Buffer.alloc(PREVIEW_INPUT_BYTES + 1))).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Preview source is too large or empty.',
    });
  });

  it('rejects an audio source longer than five minutes before preview conversion', async () => {
    const sourceInfo = await writePreview('inspect-original-too-long.mp3', tooLongAudio);
    expect(duration(sourceInfo)).toBeGreaterThan(300);

    await expect(clipReleasePreview(tooLongAudio, { audioOnly: true })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Use a preview source no longer than five minutes. The first 30 seconds will be used.',
    });
  }, 30_000);

  it('rejects a video-only source when an audio-only preview is required', async () => {
    const sourceInfo = await writePreview('inspect-silent-video.mp4', silentVideo);
    expect(sourceInfo.streams.some((stream) => stream.codec_type === 'audio')).toBe(false);

    await expect(clipReleasePreview(silentVideo, { audioOnly: true })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This file does not contain playable audio or video.',
    });
  }, 30_000);

  it('strictly decodes valid uploads and rejects malformed base64', () => {
    expect(decodePreviewUpload(`data:audio/mpeg;base64,${shortAudio.toString('base64')}`)).toEqual(shortAudio);
    expect(() => decodePreviewUpload('data:audio/mpeg;base64,a')).toThrow(/valid audio or video file|prepare this preview/i);
    expect(() => decodePreviewUpload('not base64!')).toThrow(/valid audio or video file/i);
  });

  it('round-trips a signed preview reference only for its owner and rejects tampering', () => {
    const reference = {
      version: 1 as const,
      userId: 41,
      key: 'release-previews/hosted/41/6ec4fd46-5239-4e21-9d43-24e574ebbe25.mp3',
      kind: 'audio' as const,
      durationSeconds: 12.5,
    };
    const token = signPreviewReference(reference);

    expect(readPreviewReference(token, 41)).toEqual(reference);
    expect(() => readPreviewReference(token, 42)).toThrow(/own account again/i);
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    expect(() => readPreviewReference(tampered, 41)).toThrow(/own account again/i);
  });

  it('rejects malformed signed references and even correctly signed keys outside the owner prefix', () => {
    expect(() => readPreviewReference('not.a.valid.preview.token', 41)).toThrow(/own account again/i);
    const wrongPrefixToken = signPreviewReference({
      version: 1,
      userId: 41,
      key: 'releases/41/original-paid-track.mp3',
      kind: 'audio',
      durationSeconds: 12,
    });
    expect(() => readPreviewReference(wrongPrefixToken, 41)).toThrow(/own account again/i);
  });

  it('creates and returns a cached preview URL, never the storage source URL', async () => {
    const sourceKey = 'music/41/synthetic-source.mp3';
    const sourceUrl = 'https://source.storage.example/private/synthetic-source.mp3?signature=source-secret';
    const cacheProbeUrl = 'https://cache.storage.example/probe/preview.mp3?signature=expired';
    const previewUrl = 'https://cache.storage.example/download/preview.mp3?signature=preview-secret';
    let destinationGets = 0;

    storage.storageGet.mockImplementation(async (key: string) => {
      if (key === sourceKey) return { key, url: sourceUrl };
      if (key.startsWith('release-previews/music/')) {
        destinationGets += 1;
        return { key, url: destinationGets === 1 ? cacheProbeUrl : previewUrl };
      }
      throw new Error(`Unexpected storage key: ${key}`);
    });
    storage.storagePut.mockResolvedValue({ key: 'unused-by-service', url: 'https://cache.storage.example/uploaded' });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : input.toString();
      if (url === cacheProbeUrl && init?.method === 'HEAD') return new Response(null, { status: 404 });
      if (url === sourceUrl) {
        return new Response(longAudio, {
          status: 200,
          headers: { 'content-length': String(longAudio.length) },
        });
      }
      throw new Error(`Unexpected HTTP request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getMusicPreview(sourceKey);
    const cachedResult = await getMusicPreview(sourceKey);

    expect(result).toBe(previewUrl);
    expect(cachedResult).toBe(previewUrl);
    expect(result).not.toBe(sourceUrl);
    expect(result).not.toContain('source-secret');
    expect(storage.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^release-previews\/music\/[a-f0-9]{64}\.mp3$/),
      expect.any(Buffer),
      'audio/mpeg',
    );
    expect(storage.storagePut).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(sourceUrl, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  }, 30_000);
});
