export const MEDIA_UPLOAD_CHUNK_BYTES = 1024 * 1024;
export const MEDIA_UPLOAD_TTL_MS = 60 * 60 * 1000;
export const MEDIA_UPLOAD_PURPOSES = ['content-preview', 'content-cover', 'music-audio', 'music-cover'] as const;
export type MediaUploadPurpose = typeof MEDIA_UPLOAD_PURPOSES[number];
export const MEDIA_UPLOAD_LIMITS: Record<MediaUploadPurpose, number> = {
  'content-preview': 20 * 1024 * 1024,
  'content-cover': 10 * 1024 * 1024,
  'music-audio': 50 * 1024 * 1024,
  'music-cover': 10 * 1024 * 1024,
};
export type MediaUploadState = 'uploading' | 'queued' | 'processing' | 'done' | 'failed';
export type MediaUploadResult = {
  previewMedia?: string;
  previewUrl?: string;
  kind?: 'audio' | 'video';
  durationSeconds?: number;
  url?: string;
  width?: number;
  height?: number;
  success?: boolean;
  fileKey?: string;
  fileSizeBytes?: number;
  fileFormat?: string;
};
export type MediaUploadStatus = {
  id: string;
  state: MediaUploadState;
  receivedChunks: number[];
  chunkBytes: number;
  chunkCount: number;
  expiresAt: number;
  result?: MediaUploadResult;
  error?: string;
};
export type MediaUploadProgress = { stage: 'uploading' | 'processing'; percent: number };
