import { createHmac, timingSafeEqual } from 'node:crypto';
import { ENV } from '../_core/env';
import { storageGet } from '../storage';
import { VIDEO_PORTFOLIO_CATEGORIES, type VideoPortfolioCategory } from '../../shared/videoPortfolio';

export const PORTFOLIO_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const PORTFOLIO_MAX_THUMBNAIL_BYTES = 3 * 1024 * 1024;
export const PORTFOLIO_UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024;
export const PORTFOLIO_UPLOAD_SESSION_TTL_MS = 15 * 60 * 1000;
export const PORTFOLIO_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export const PORTFOLIO_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type PortfolioUploadInput = {
  title: string;
  category: VideoPortfolioCategory;
  duration: number;
  videoSize: number;
  thumbnailSize: number;
  videoMimeType: typeof PORTFOLIO_VIDEO_MIME_TYPES[number];
  thumbnailMimeType: typeof PORTFOLIO_THUMBNAIL_MIME_TYPES[number];
};

export type PortfolioUploadSession = PortfolioUploadInput & {
  v: 1;
  userId: number;
  profileId: number;
  sessionId: string;
  videoChunkCount: number;
  thumbnailChunkCount: number;
  finalVideoKey: string;
  finalThumbnailKey: string;
  expiresAt: number;
};

export class PortfolioUploadValidationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export function readPortfolioUploadInput(body: any): PortfolioUploadInput {
  const title = String(body?.title || '').trim();
  const category = String(body?.category || '') as VideoPortfolioCategory;
  const duration = Number(body?.durationSeconds);
  const videoSize = Number(body?.videoSize);
  const thumbnailSize = Number(body?.thumbnailSize);
  const videoMimeType = String(body?.videoMimeType || '') as PortfolioUploadInput['videoMimeType'];
  const thumbnailMimeType = String(body?.thumbnailMimeType || '') as PortfolioUploadInput['thumbnailMimeType'];

  if (!title || title.length > 255) throw new PortfolioUploadValidationError('Enter a video title between 1 and 255 characters');
  if (!VIDEO_PORTFOLIO_CATEGORIES.includes(category)) throw new PortfolioUploadValidationError('Select a valid video category');
  if (!Number.isFinite(duration) || duration <= 0 || duration > 120) throw new PortfolioUploadValidationError('Portfolio videos must be 2 minutes or less');
  if (!Number.isInteger(videoSize) || videoSize < 1 || videoSize > PORTFOLIO_MAX_VIDEO_BYTES) throw new PortfolioUploadValidationError('Portfolio video must be under 100MB');
  if (!Number.isInteger(thumbnailSize) || thumbnailSize < 1 || thumbnailSize > PORTFOLIO_MAX_THUMBNAIL_BYTES) throw new PortfolioUploadValidationError('Video thumbnail must be under 3MB');
  if (!PORTFOLIO_VIDEO_MIME_TYPES.includes(videoMimeType)) throw new PortfolioUploadValidationError('Only browser-compatible MP4 and WebM uploads are supported');
  if (!PORTFOLIO_THUMBNAIL_MIME_TYPES.includes(thumbnailMimeType)) throw new PortfolioUploadValidationError('Only JPEG, PNG, or WebP thumbnails are supported');
  return { title, category, duration, videoSize, thumbnailSize, videoMimeType, thumbnailMimeType };
}

export function createPortfolioUploadSession(
  input: PortfolioUploadInput,
  owner: { userId: number; profileId: number; sessionId: string; now?: number },
): PortfolioUploadSession {
  const now = owner.now ?? Date.now();
  const videoExtension = input.videoMimeType === 'video/webm' ? 'webm' : 'mp4';
  const thumbnailExtension = input.thumbnailMimeType === 'image/png' ? 'png' : input.thumbnailMimeType === 'image/webp' ? 'webp' : 'jpg';
  const root = `video-portfolio/${owner.userId}/uploads/${owner.sessionId}`;
  return {
    v: 1,
    ...input,
    userId: owner.userId,
    profileId: owner.profileId,
    sessionId: owner.sessionId,
    videoChunkCount: Math.ceil(input.videoSize / PORTFOLIO_UPLOAD_CHUNK_BYTES),
    thumbnailChunkCount: Math.ceil(input.thumbnailSize / PORTFOLIO_UPLOAD_CHUNK_BYTES),
    finalVideoKey: `${root}/video.${videoExtension}`,
    finalThumbnailKey: `${root}/thumbnail.${thumbnailExtension}`,
    expiresAt: now + PORTFOLIO_UPLOAD_SESSION_TTL_MS,
  };
}

export function signPortfolioUploadSession(payload: PortfolioUploadSession): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', ENV.cookieSecret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyPortfolioUploadSession(token: string, now = Date.now()): PortfolioUploadSession {
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) throw new PortfolioUploadValidationError('Invalid upload confirmation');

  const expectedSignature = createHmac('sha256', ENV.cookieSecret).update(encoded).digest();
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  if (supplied.length !== expectedSignature.length || !timingSafeEqual(supplied, expectedSignature)) {
    throw new PortfolioUploadValidationError('Invalid upload confirmation');
  }

  let payload: PortfolioUploadSession;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PortfolioUploadSession;
  } catch {
    throw new PortfolioUploadValidationError('Invalid upload confirmation');
  }
  if (payload.v !== 1 || payload.expiresAt < now) {
    throw new PortfolioUploadValidationError('This upload expired. Choose the video again and retry.');
  }
  return payload;
}

export function assertUploadSessionOwner(
  payload: PortfolioUploadSession,
  owner: { userId: number; profileId: number },
): void {
  if (payload.userId !== owner.userId || payload.profileId !== owner.profileId) {
    throw new PortfolioUploadValidationError('This upload does not belong to your profile', 403);
  }
}

export function getUploadChunkKey(
  payload: PortfolioUploadSession,
  kind: 'video' | 'thumbnail',
  index: number,
): string {
  const expectedCount = kind === 'video' ? payload.videoChunkCount : payload.thumbnailChunkCount;
  if (!Number.isInteger(index) || index < 0 || index >= expectedCount) {
    throw new PortfolioUploadValidationError('Invalid upload chunk');
  }
  return `video-portfolio/${payload.userId}/uploads/${payload.sessionId}/chunks/${kind}-${index}.part`;
}

export function getExpectedChunkLength(
  payload: PortfolioUploadSession,
  kind: 'video' | 'thumbnail',
  index: number,
): number {
  getUploadChunkKey(payload, kind, index);
  const totalSize = kind === 'video' ? payload.videoSize : payload.thumbnailSize;
  const start = index * PORTFOLIO_UPLOAD_CHUNK_BYTES;
  return Math.min(PORTFOLIO_UPLOAD_CHUNK_BYTES, totalSize - start);
}

async function readStoredChunk(key: string, expectedLength: number): Promise<Buffer> {
  const { url } = await storageGet(key);
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new PortfolioUploadValidationError('One or more upload chunks are missing. Please retry.');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length !== expectedLength) throw new PortfolioUploadValidationError('An upload chunk has the wrong size. Please retry.');
  return buffer;
}

export async function assembleUploadedAsset(
  payload: PortfolioUploadSession,
  kind: 'video' | 'thumbnail',
): Promise<Buffer> {
  const count = kind === 'video' ? payload.videoChunkCount : payload.thumbnailChunkCount;
  const chunks: Buffer[] = [];
  for (let index = 0; index < count; index += 1) {
    chunks.push(await readStoredChunk(
      getUploadChunkKey(payload, kind, index),
      getExpectedChunkLength(payload, kind, index),
    ));
  }
  const assembled = Buffer.concat(chunks);
  const expectedSize = kind === 'video' ? payload.videoSize : payload.thumbnailSize;
  if (assembled.length !== expectedSize) throw new PortfolioUploadValidationError(`The assembled ${kind} size could not be verified.`);
  return assembled;
}

export function validateAssembledMedia(buffer: Buffer, kind: 'video' | 'thumbnail'): void {
  const isIsoMedia = buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  const isWebM = buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer.subarray(1, 4).toString('ascii') === 'PNG';
  const isWebP = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if ((kind === 'video' && !isIsoMedia && !isWebM) || (kind === 'thumbnail' && !isJpeg && !isPng && !isWebP)) {
    throw new PortfolioUploadValidationError(`The uploaded ${kind} file is not a supported media format.`);
  }
}

export function publicStorageUrl(key: string): string {
  return `/manus-storage/${key.replace(/^\/+/, '')}`;
}
