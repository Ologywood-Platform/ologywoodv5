export const SANDBOX_POST_MAX_CHARACTERS = 600;
export const SANDBOX_POST_MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const SANDBOX_POST_MAX_VIDEO_BYTES = 25 * 1024 * 1024;
export const SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS = 30;

export const SANDBOX_POST_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const SANDBOX_POST_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export type SandboxPostMediaType = 'image' | 'video';

export function normalizeSandboxPostText(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim();
}

export function sandboxPostPath(artistName: string): string {
  const slug = artistName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `/artist/${slug || 'talent'}/sandbox`;
}

export function sandboxPostDescription(content: string, artistName: string): string {
  const normalized = normalizeSandboxPostText(content).replace(/\s+/g, ' ');
  const suffix = ` — a Sandbox Post from ${artistName} on OlogyWood.`;
  const maxContentLength = Math.max(0, 200 - suffix.length);
  return `${normalized.slice(0, maxContentLength).trim()}${suffix}`;
}
