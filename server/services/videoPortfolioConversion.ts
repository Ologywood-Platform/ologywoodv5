import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PORTFOLIO_MAX_THUMBNAIL_BYTES,
  PORTFOLIO_MAX_VIDEO_BYTES,
  PortfolioUploadValidationError,
  validateAssembledMedia,
  validateAssembledVideoSource,
} from './videoPortfolioDirectUpload';
import { PORTFOLIO_VIDEO_MAX_DURATION_SECONDS, type PortfolioVideoSourceFormat } from '../../shared/videoPortfolioUpload';

const PROCESS_TIMEOUT_MS = 160_000;
const MAX_DIAGNOSTIC_CHARS = 6_000;
let conversionActive = false;

type ProbeResult = {
  format?: { duration?: string; format_name?: string };
  streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }>;
};

type ProcessResult = { stdout: string; stderr: string };

async function runMediaProcess(command: 'ffmpeg' | 'ffprobe', args: string[], timeoutMs = PROCESS_TIMEOUT_MS): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const append = (current: string, chunk: Buffer) => `${current}${chunk.toString('utf8')}`.slice(-MAX_DIAGNOSTIC_CHARS);
    child.stdout.on('data', (chunk: Buffer) => { stdout = append(stdout, chunk); });
    child.stderr.on('data', (chunk: Buffer) => { stderr = append(stderr, chunk); });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.once('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (error.code === 'ENOENT') {
        reject(new PortfolioUploadValidationError('Video conversion is temporarily unavailable. Please try again later or upload an H.264/AAC MP4 file.', 503));
      } else {
        reject(error);
      }
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new PortfolioUploadValidationError('Video conversion took too long. Try a shorter or smaller file, or upload an H.264/AAC MP4 file.', 408));
      } else if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new PortfolioUploadValidationError('We could not convert this video. Try an H.264 video with AAC audio in an MP4 file.'));
      }
    });
  });
}

async function probeVideo(path: string): Promise<{ duration: number; hasAudio: boolean }> {
  const result = await runMediaProcess('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,format_name:stream=codec_type,codec_name,width,height',
    '-of', 'json',
    path,
  ], 20_000);
  let probe: ProbeResult;
  try {
    probe = JSON.parse(result.stdout) as ProbeResult;
  } catch {
    throw new PortfolioUploadValidationError('We could not read this video container. Try an H.264/AAC MP4 file.');
  }
  const duration = Number(probe.format?.duration);
  const videoStream = probe.streams?.find(stream => stream.codec_type === 'video');
  if (!videoStream || !Number.isFinite(duration) || duration <= 0) {
    throw new PortfolioUploadValidationError('This file does not contain a readable video stream.');
  }
  if (duration > PORTFOLIO_VIDEO_MAX_DURATION_SECONDS + 0.25) {
    const seconds = Math.ceil(duration);
    throw new PortfolioUploadValidationError(`This video is ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}. Video Portfolio clips must be 2:00 or shorter.`);
  }
  return { duration, hasAudio: Boolean(probe.streams?.some(stream => stream.codec_type === 'audio')) };
}

export async function convertPortfolioVideo(options: {
  source: Buffer;
  sourceFormat: PortfolioVideoSourceFormat;
}): Promise<{ video: Buffer; thumbnail: Buffer; duration: number }> {
  if (conversionActive) {
    throw new PortfolioUploadValidationError('Another video is being prepared right now. Please retry in a moment.', 503);
  }
  conversionActive = true;
  const workDir = join(tmpdir(), 'ologywood-video-conversion', randomUUID());
  try {
    validateAssembledVideoSource(options.source, options.sourceFormat);
    await mkdir(workDir, { recursive: true, mode: 0o700 });
    const inputPath = join(workDir, `source.${options.sourceFormat}`);
    const outputPath = join(workDir, 'video.mp4');
    const thumbnailPath = join(workDir, 'thumbnail.jpg');
    await writeFile(inputPath, options.source, { mode: 0o600 });
    const sourceProbe = await probeVideo(inputPath);
    const seekSeconds = Math.min(Math.max(sourceProbe.duration * 0.25, 1), 15).toFixed(3);

    const args = [
      '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
      '-map', '0:v:0', '-map', '0:a:0?', '-sn', '-dn', '-map_metadata', '-1',
      '-vf', 'scale=w=min(1920\\,iw):h=min(1920\\,ih):force_original_aspect_ratio=decrease,format=yuv420p',
      '-threads', '1', '-filter_threads', '1', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-maxrate', '6M', '-bufsize', '12M',
      '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
      '-t', String(PORTFOLIO_VIDEO_MAX_DURATION_SECONDS), '-fs', String(PORTFOLIO_MAX_VIDEO_BYTES), outputPath,
    ];
    await runMediaProcess('ffmpeg', args);
    await runMediaProcess('ffmpeg', [
      '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-ss', seekSeconds, '-i', outputPath,
      '-frames:v', '1', '-vf', 'scale=1200:630:force_original_aspect_ratio=decrease,pad=1200:630:(ow-iw)/2:(oh-ih)/2:black',
      '-q:v', '3', thumbnailPath,
    ], 30_000);

    const [outputStat, thumbnailStat] = await Promise.all([stat(outputPath), stat(thumbnailPath)]);
    if (outputStat.size < 1 || outputStat.size > PORTFOLIO_MAX_VIDEO_BYTES) {
      throw new PortfolioUploadValidationError('The converted video exceeds the 100 MB maximum. Try a shorter or smaller file.');
    }
    if (thumbnailStat.size < 1 || thumbnailStat.size > PORTFOLIO_MAX_THUMBNAIL_BYTES) {
      throw new PortfolioUploadValidationError('We could not create a valid thumbnail from this video.');
    }
    const [video, thumbnail] = await Promise.all([readFile(outputPath), readFile(thumbnailPath)]);
    validateAssembledVideoSource(video, 'mp4');
    validateAssembledMedia(thumbnail, 'thumbnail');
    const outputProbe = await probeVideo(outputPath);
    return { video, thumbnail, duration: outputProbe.duration };
  } finally {
    conversionActive = false;
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function isPortfolioConversionActive(): boolean {
  return conversionActive;
}
