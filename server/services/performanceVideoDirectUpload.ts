import { createHmac, timingSafeEqual } from 'node:crypto';
import { ENV } from '../_core/env';
import { storageGet } from '../storage';
import {
  PORTFOLIO_UPLOAD_CHUNK_BYTES,
  PORTFOLIO_UPLOAD_SESSION_TTL_MS,
  PORTFOLIO_VIDEO_MIME_TYPES,
  PORTFOLIO_THUMBNAIL_MIME_TYPES,
  PortfolioUploadValidationError,
} from './videoPortfolioDirectUpload';
import {
  PORTFOLIO_VIDEO_FORMATS,
  getPortfolioVideoMimeType,
  portfolioVideoRequiresConversion,
  type PortfolioVideoSourceFormat,
} from '../../shared/videoPortfolioUpload';
import {
  PERFORMANCE_VIDEO_MAX_BYTES,
  PERFORMANCE_VIDEO_MAX_DURATION_SECONDS,
} from '../../shared/performanceVideoUpload';

export type PerformanceUploadInput = {
  duration: number;
  sourceFormat: PortfolioVideoSourceFormat;
  requiresConversion: boolean;
  videoSize: number;
  thumbnailSize: number;
  videoMimeType: typeof PORTFOLIO_VIDEO_MIME_TYPES[number];
  thumbnailMimeType: typeof PORTFOLIO_THUMBNAIL_MIME_TYPES[number] | '';
};

export type PerformanceUploadSession = PerformanceUploadInput & {
  v: 1;
  purpose: 'performance-video';
  userId: number;
  profileId: number;
  sessionId: string;
  videoChunkCount: number;
  thumbnailChunkCount: number;
  finalVideoKey: string;
  finalThumbnailKey: string;
  expiresAt: number;
};

export function readPerformanceUploadInput(body: any): PerformanceUploadInput {
  const duration = Number(body?.durationSeconds);
  const sourceFormat = String(body?.sourceFormat || '') as PortfolioVideoSourceFormat;
  const videoSize = Number(body?.videoSize);
  const thumbnailSize = Number(body?.thumbnailSize);
  const videoMimeType = String(body?.videoMimeType || '') as PerformanceUploadInput['videoMimeType'];
  const thumbnailMimeType = String(body?.thumbnailMimeType || '') as PerformanceUploadInput['thumbnailMimeType'];

  if (!PORTFOLIO_VIDEO_FORMATS.includes(sourceFormat)) {
    throw new PortfolioUploadValidationError('Choose an MP4, MOV, WebM, AVI, or MKV video file');
  }
  const requiresConversion = portfolioVideoRequiresConversion(sourceFormat);
  if (!Number.isFinite(duration) || duration < 0 || (!requiresConversion && duration <= 0) || duration > PERFORMANCE_VIDEO_MAX_DURATION_SECONDS) {
    throw new PortfolioUploadValidationError('Performance Videos must be 5 minutes or less');
  }
  if (!Number.isInteger(videoSize) || videoSize < 1 || videoSize > PERFORMANCE_VIDEO_MAX_BYTES) {
    throw new PortfolioUploadValidationError('Performance Video uploads must be 500 MB or smaller');
  }
  if (!Number.isInteger(thumbnailSize) || thumbnailSize < (requiresConversion ? 0 : 1) || thumbnailSize > 3 * 1024 * 1024) {
    throw new PortfolioUploadValidationError('Video thumbnail must be under 3 MB');
  }
  if (!PORTFOLIO_VIDEO_MIME_TYPES.includes(videoMimeType as typeof PORTFOLIO_VIDEO_MIME_TYPES[number])) {
    throw new PortfolioUploadValidationError('The upload type must be MP4, MOV, WebM, AVI, or MKV');
  }
  if (videoMimeType !== getPortfolioVideoMimeType(sourceFormat)) {
    throw new PortfolioUploadValidationError('The selected video format does not match its upload type');
  }
  if ((!requiresConversion || thumbnailSize > 0) && !PORTFOLIO_THUMBNAIL_MIME_TYPES.includes(thumbnailMimeType as typeof PORTFOLIO_THUMBNAIL_MIME_TYPES[number])) {
    throw new PortfolioUploadValidationError('Only JPEG, PNG, or WebP thumbnails are supported');
  }
  if (requiresConversion && thumbnailSize !== 0) {
    throw new PortfolioUploadValidationError('Converted videos use a server-generated thumbnail');
  }
  return { duration, sourceFormat, requiresConversion, videoSize, thumbnailSize, videoMimeType, thumbnailMimeType };
}

export function createPerformanceUploadSession(
  input: PerformanceUploadInput,
  owner: { userId: number; profileId: number; sessionId: string; now?: number },
): PerformanceUploadSession {
  const now = owner.now ?? Date.now();
  const videoExtension = input.requiresConversion ? 'mp4' : input.videoMimeType === 'video/webm' ? 'webm' : 'mp4';
  const thumbnailExtension = input.requiresConversion ? 'jpg' : input.thumbnailMimeType === 'image/png' ? 'png' : input.thumbnailMimeType === 'image/webp' ? 'webp' : 'jpg';
  const root = `performance-videos/${owner.userId}/uploads/${owner.sessionId}`;
  return {
    v: 1,
    purpose: 'performance-video',
    ...input,
    userId: owner.userId,
    profileId: owner.profileId,
    sessionId: owner.sessionId,
    videoChunkCount: Math.ceil(input.videoSize / PORTFOLIO_UPLOAD_CHUNK_BYTES),
    thumbnailChunkCount: input.thumbnailSize === 0 ? 0 : Math.ceil(input.thumbnailSize / PORTFOLIO_UPLOAD_CHUNK_BYTES),
    finalVideoKey: `${root}/video.${videoExtension}`,
    finalThumbnailKey: `${root}/thumbnail.${thumbnailExtension}`,
    expiresAt: now + PORTFOLIO_UPLOAD_SESSION_TTL_MS,
  };
}

export function signPerformanceUploadSession(payload: PerformanceUploadSession): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', ENV.cookieSecret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyPerformanceUploadSession(token: string, now = Date.now()): PerformanceUploadSession {
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) throw new PortfolioUploadValidationError('Invalid upload confirmation');
  const expectedSignature = createHmac('sha256', ENV.cookieSecret).update(encoded).digest();
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  if (supplied.length !== expectedSignature.length || !timingSafeEqual(supplied, expectedSignature)) {
    throw new PortfolioUploadValidationError('Invalid upload confirmation');
  }
  let payload: PerformanceUploadSession;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PerformanceUploadSession;
  } catch {
    throw new PortfolioUploadValidationError('Invalid upload confirmation');
  }
  if (payload.v !== 1 || payload.purpose !== 'performance-video' || payload.expiresAt < now) {
    throw new PortfolioUploadValidationError('This upload expired. Choose the video again and retry.');
  }
  return payload;
}

export function assertPerformanceUploadOwner(
  payload: PerformanceUploadSession,
  owner: { userId: number; profileId: number },
): void {
  if (payload.userId !== owner.userId || payload.profileId !== owner.profileId) {
    throw new PortfolioUploadValidationError('This upload does not belong to your profile', 403);
  }
}

export function getPerformanceChunkKey(payload: PerformanceUploadSession, kind: 'video' | 'thumbnail', index: number): string {
  const expectedCount = kind === 'video' ? payload.videoChunkCount : payload.thumbnailChunkCount;
  if (!Number.isInteger(index) || index < 0 || index >= expectedCount) {
    throw new PortfolioUploadValidationError('Invalid upload chunk');
  }
  return `performance-videos/${payload.userId}/uploads/${payload.sessionId}/chunks/${kind}-${index}.part`;
}

export function getExpectedPerformanceChunkLength(payload: PerformanceUploadSession, kind: 'video' | 'thumbnail', index: number): number {
  getPerformanceChunkKey(payload, kind, index);
  const totalSize = kind === 'video' ? payload.videoSize : payload.thumbnailSize;
  const start = index * PORTFOLIO_UPLOAD_CHUNK_BYTES;
  return Math.min(PORTFOLIO_UPLOAD_CHUNK_BYTES, totalSize - start);
}

export async function assemblePerformanceAsset(payload: PerformanceUploadSession, kind: 'video' | 'thumbnail'): Promise<Buffer> {
  const count = kind === 'video' ? payload.videoChunkCount : payload.thumbnailChunkCount;
  const chunks: Buffer[] = [];
  for (let index = 0; index < count; index += 1) {
    const expectedLength = getExpectedPerformanceChunkLength(payload, kind, index);
    const { url } = await storageGet(getPerformanceChunkKey(payload, kind, index));
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new PortfolioUploadValidationError('One or more upload chunks are missing. Please retry.');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length !== expectedLength) throw new PortfolioUploadValidationError('An upload chunk has the wrong size. Please retry.');
    chunks.push(buffer);
  }
  const assembled = Buffer.concat(chunks);
  const expectedSize = kind === 'video' ? payload.videoSize : payload.thumbnailSize;
  if (assembled.length !== expectedSize) throw new PortfolioUploadValidationError(`The assembled ${kind} size could not be verified.`);
  return assembled;
}
