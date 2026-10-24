import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PROFILE_MUSIC_PREVIEW_COUNT, PROFILE_VIDEO_PREVIEW_COUNT, visibleProfileItems, uniquePortfolioPhotos } from '../shared/profileSections';
vi.mock('./_core/llm', () => ({ invokeLLM: vi.fn() }));
import { getCanonicalNavigationAnswer, PROFILE_GALLERY_GUIDANCE, VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE, SINGLE_ORDER_GUIDANCE } from './routers/aiChat';
const profile = readFileSync(new URL('../client/src/pages/ArtistProfile.tsx', import.meta.url), 'utf8');
const help = readFileSync(new URL('../client/src/pages/Help.tsx', import.meta.url), 'utf8');

describe('Compact profile sections and complete photo gallery', () => {
  it('keeps the creator order and original music/video objects', () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({ id: 100 - i, title: `Original ${i}` }));
    expect(visibleProfileItems(rows, false, PROFILE_MUSIC_PREVIEW_COUNT)).toEqual(rows.slice(0, 3));
    expect(visibleProfileItems(rows, false, PROFILE_VIDEO_PREVIEW_COUNT)).toEqual(rows.slice(0, 6));
    expect(visibleProfileItems(rows, true, 3)).toBe(rows);
    expect(rows[0].id).toBe(100);
    expect(visibleProfileItems(rows, false, 3)[0]).toBe(rows[0]);
  });
  it('does not hide shorter lists and makes every larger-list item reachable', () => {
    expect(visibleProfileItems([], false, 3)).toEqual([]);
    expect(visibleProfileItems([1, 2], false, 3)).toEqual([1, 2]);
    expect(visibleProfileItems([1, 2, 3, 4], true, 3)).toEqual([1, 2, 3, 4]);
  });
  it('shows the fifth uploaded photo and deduplicates overlapping cursor pages by stored ID', () => {
    const photos = Array.from({ length: 5 }, (_, i) => ({ id: 5 - i, photoUrl: `/original-${i}.jpg` }));
    const result = uniquePortfolioPhotos([{ photos }, { photos: [photos[4], { id: 6, photoUrl: '/original-new.jpg' }] }]);
    expect(result).toHaveLength(6);
    expect(result.slice(0, 5)).toEqual(photos);
    expect(result[4]).toBe(photos[4]);
    expect(uniquePortfolioPhotos([])).toEqual([]);
  });
  it('uses bounded pages instead of the old four-photo cap and preserves original image URLs', () => {
    expect(profile).toContain('trpc.events.getPortfolioPhotos.useInfiniteQuery');
    expect(profile).toContain('limit: 12');
    expect(profile).not.toContain('trpc.events.getRecentPhotos.useQuery');
    expect(profile).toContain('getNextPageParam: page => page.nextCursor ?? undefined');
    expect(profile).toContain('uniquePortfolioPhotos');
    expect(profile).toContain('src={photo.photoUrl}');
    expect(profile).toContain('loading="lazy"');
    expect(profile).toContain('Retry more photos');
    expect(profile).toContain('Portfolio photos could not be loaded.');
    expect(profile).toContain('portfolioPhotosQuery.isFetchNextPageError');
  });
  it('exposes keyboard-accessible thumbnail and reversible section controls', () => {
    expect(profile).toContain('Open portfolio photo ${index + 1}');
    expect(profile).toContain('returnFocusRef={photoTriggerRef}');
    expect(profile).toContain('aria-expanded={showAllMusic}');
    expect(profile).toContain('aria-expanded={showAllVideos}');
    expect(profile).toContain('aria-controls="profile-music-list"');
    expect(profile).toContain('aria-controls="profile-video-list"');
    expect(profile).toContain('setShowAllMusic(false)');
    expect(profile).toContain('setShowAllVideos(false)');
    expect(profile).toContain('setSelectedPhotoId(null)');
  });
  it('clears missing selections and cancels pending previews when extra cards unmount', () => {
    const releaseCard = readFileSync(new URL('../client/src/components/ReleaseCard.tsx', import.meta.url), 'utf8');
    expect(profile).toContain('!portfolioPhotos.some(photo => photo.id === selectedPhotoId)');
    expect(releaseCard).toContain('previewAbortRef.current?.abort()');
    expect(releaseCard).toContain('signal: controller.signal');
    expect(releaseCard).toContain('if (!mountedRef.current || controller.signal.aborted) return');
    expect(releaseCard).toContain('audioRef.current.pause()');
  });
  it('retains the existing music purchase component, full SEO list and selected-video player', () => {
    expect(profile).toContain('<ReleaseCard');
    expect(profile).toContain('key={release.id}');
    expect(profile).toContain('data={releases.map((r: any) => buildMusicRecordingJsonLd');
    expect(profile).toContain('src={activeVideo.url}');
    expect(profile).toContain('portfolioVideoUrl(window.location.origin, activeVideo.title, activeVideo.id)');
    expect(profile).toContain('<ContentReleasesDisplay artistProfileId={artist.id} />');
    expect(profile).not.toContain('release.reorder');
  });
});

describe('Public portfolio viewing guidance', () => {
  it.each(['How do I view full portfolio photos?', 'A fifth photo is missing from my profile', 'Show all music', 'How do I expand the videos on a profile?'])('routes %s without a model call', message => {
    expect(getCanonicalNavigationAnswer(message)).toBe(PROFILE_GALLERY_GUIDANCE);
  });
  it('keeps existing edit/order instructions separate from viewing', () => {
    expect(getCanonicalNavigationAnswer('How do I edit a Video Portfolio title?')).toBe(VIDEO_PORTFOLIO_MANAGEMENT_GUIDANCE);
    expect(getCanonicalNavigationAnswer('How do I reorder singles?')).toBe(SINGLE_ORDER_GUIDANCE);
  });
  it('documents uncropped images, loaded-photo paging and unchanged commerce', () => {
    expect(help).toContain("id: 'profile-photos-and-sections'");
    for (const text of ['Close photo viewer', 'Load more photos', 'Show all', 'Show less']) {
      expect(help).toContain(text);
      expect(PROFILE_GALLERY_GUIDANCE).toContain(text);
    }
    expect(PROFILE_GALLERY_GUIDANCE).toContain('without cropping');
    expect(PROFILE_GALLERY_GUIDANCE).toContain('prices, purchases');
  });
});
