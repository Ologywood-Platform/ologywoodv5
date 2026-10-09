export const CONTENT_RELEASE_TYPES = [
  { value: 'movie', label: 'Movie' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'short_film', label: 'Short Film' },
  { value: 'web_series', label: 'Web Series' },
  { value: 'concert', label: 'Concert' },
  { value: 'livestream', label: 'Livestream' },
  { value: 'podcast_episode', label: 'Podcast Episode' },
  { value: 'single', label: 'Single' },
  { value: 'album', label: 'Album' },
  { value: 'course', label: 'Course' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'interview', label: 'Interview' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes' },
  { value: 'other', label: 'Other' },
] as const;

export function getContentReleaseTypeLabel(value: string): string {
  return CONTENT_RELEASE_TYPES.find(type => type.value === value)?.label ?? value;
}

export const CONTENT_RELEASE_SAVE_ERROR = 'We could not save your release. Your entries are still here. Please try again; if it keeps failing, contact support.';

/** Never render raw server/database diagnostics in a creator's form. */
export function getContentReleaseErrorMessage(error: { message?: string; data?: { code?: string } | null }): string {
  if (error.data?.code === 'INTERNAL_SERVER_ERROR' || /Failed query|\bSQL\b|Unknown column|doesn't exist|\bparams:/i.test(error.message ?? '')) {
    return CONTENT_RELEASE_SAVE_ERROR;
  }
  return error.message || CONTENT_RELEASE_SAVE_ERROR;
}
