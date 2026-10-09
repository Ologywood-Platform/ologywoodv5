export const CONTENT_RELEASE_COVER_MAX_BYTES = 10 * 1024 * 1024;
export const CONTENT_RELEASE_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const CONTENT_RELEASE_COVER_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
export const CONTENT_RELEASE_COVER_UPLOAD_ERROR = 'We could not upload your cover art. Your previous cover is unchanged. Please try again.';

export function getContentReleaseCoverMimeType(file: { type: string; name: string }): string {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : '';
}

export function validateContentReleaseCoverFile(file: {type:string; name:string; size:number}): string | null {
  if (!(CONTENT_RELEASE_COVER_MIME_TYPES as readonly string[]).includes(getContentReleaseCoverMimeType(file))) return 'Please choose a JPG, PNG, or WebP image.';
  if (file.size === 0) return 'This image is empty. Please choose another file.';
  if (file.size > CONTENT_RELEASE_COVER_MAX_BYTES) return 'Cover art must be 10 MB or smaller.';
  return null;
}
