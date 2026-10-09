/** Shared client/server contract for creator-supplied Content Release previews. */
export const MAX_SECONDS = 30;
export const MAX_BYTES = 20 * 1024 * 1024;
export const MAX_INPUT_SECONDS = 5 * 60;

export const RELEASE_PREVIEW_ACCEPT = '.mp3,.wav,.flac,.aac,.m4a,.mp4,.mov,.webm,audio/mpeg,audio/wav,audio/flac,audio/aac,audio/mp4,video/mp4,video/quicktime,video/webm';

export type ReleasePreviewKind = 'audio' | 'video';
export type ReleasePreviewUploadMimeType =
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/flac'
  | 'audio/aac'
  | 'audio/mp4'
  | 'video/mp4'
  | 'video/quicktime'
  | 'video/webm';

type PreviewFileLike = {
  name: string;
  size: number;
  type?: string;
};

const MIME_BY_EXTENSION: Record<string, ReleasePreviewUploadMimeType> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

const MIME_ALIASES: Record<string, ReleasePreviewUploadMimeType> = {
  'audio/mp3': 'audio/mpeg',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/x-flac': 'audio/flac',
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'video/x-msvideo': 'video/quicktime',
};

const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_BY_EXTENSION));

function extensionOf(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

/** Returns the canonical MIME type accepted by the preview upload mutation, if known. */
export function getReleasePreviewMimeType(file: PreviewFileLike): ReleasePreviewUploadMimeType | null {
  const reported = (file.type || '').trim().toLowerCase();
  const normalizedReported = MIME_ALIASES[reported] || reported;
  const byName = MIME_BY_EXTENSION[extensionOf(file.name) || ''];

  if (ALLOWED_MIME_TYPES.has(normalizedReported)) return normalizedReported;
  return byName || null;
}

export function getReleasePreviewKind(file: Pick<PreviewFileLike, 'name' | 'type'>): ReleasePreviewKind | null {
  const mimeType = getReleasePreviewMimeType({...file, size: 1});
  if (!mimeType) return null;
  return mimeType.startsWith('video/') ? 'video' : 'audio';
}

/**
 * Client feedback only; the server is authoritative and validates the decoded bytes and duration.
 * An extension fallback supports browsers that leave File.type blank for WAV, FLAC, or M4A files.
 */
export function validateReleasePreviewFile(file: PreviewFileLike): string | null {
  if (file.size <= 0) return 'This preview file is empty. Choose a file with audio or video content.';
  if (file.size > MAX_BYTES) return 'Preview files must be 20 MB or smaller.';
  if (!getReleasePreviewMimeType(file)) {
    return 'Upload an MP3, WAV, FLAC, AAC, M4A, MP4, MOV, or WebM preview file.';
  }
  return null;
}
