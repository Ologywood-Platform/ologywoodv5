export const PROFILE_MUSIC_PREVIEW_COUNT = 3;
export const PROFILE_VIDEO_PREVIEW_COUNT = 6;

/** Presentation-only: preserve the creator's existing order and original rows. */
export function visibleProfileItems<T>(items: readonly T[], expanded: boolean, limit: number): readonly T[] {
  return expanded ? items : items.slice(0, limit);
}

/** Cursor pages can overlap after a refresh; never duplicate a stored photo ID. */
export function uniquePortfolioPhotos<T extends { id: number }>(pages: readonly { photos: readonly T[] }[]): T[] {
  const seen = new Set<number>();
  return pages.flatMap(page => page.photos.filter(photo => {
    if (seen.has(photo.id)) return false;
    seen.add(photo.id);
    return true;
  }));
}
