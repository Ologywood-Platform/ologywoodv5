import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const source = (file: string) => readFileSync(`client/src/${file}`, 'utf8');
describe('Release sections and responsive public layout', () => {
  it('explains downloadable music separately from hosted access without merging commerce', () => {
    const profile = source('pages/ArtistProfile.tsx');
    const hosted = source('components/ContentReleasesDisplay.tsx');
    expect(profile).toContain('buy the audio download');
    expect(profile).toContain('<ReleaseCard');
    expect(profile).toContain('<ContentReleasesDisplay artistProfileId={artist.id}');
    expect(hosted).toContain('Paid purchases unlock hosted access, not a downloadable music file.');
    expect(hosted).toContain('contentRelease.purchase.useMutation');
    expect(hosted).toContain('ContentReleasePublicPreview');
  });
  it('fits quick actions to available column space, allowing long follow labels to wrap', () => {
    const actions = source('components/ProfileJourneyActions.tsx');
    expect(actions).toContain('repeat(auto-fit,minmax(min(100%,11rem),1fr))');
    expect(actions).toContain('[&_button]:whitespace-normal');
    expect(actions).not.toContain('xl:grid-cols-6');
    expect(actions).toContain('<FollowButton');
  });
  it('avoids narrow tablet sidebar columns and breaks long creator text', () => {
    const profile = source('pages/ArtistProfile.tsx');
    expect(profile).toContain('lg:grid-cols-3');
    expect(profile).toContain('lg:col-span-2');
    expect(profile).toContain('[&>div]:min-w-0');
    expect(profile).toContain('whitespace-pre-wrap [overflow-wrap:anywhere]');
    for (const file of ['components/ReleaseCard.tsx', 'components/ContentReleasesDisplay.tsx', 'components/TrackReviewSection.tsx']) {
      expect(source(file)).toContain('[overflow-wrap:anywhere]');
    }
  });
  it('keeps desktop navigation off smaller viewports without clipping menus', () => {
    const header = source('components/SiteHeader.tsx');
    expect(header).toContain('hidden min-[1440px]:flex');
    expect(header).toContain('min-[1440px]:hidden');
    expect(header).toContain('max-w-[1536px]');
    expect(header).not.toContain('hidden lg:flex');
    expect(header).not.toContain('overflow-x-hidden');
  });
  it('wraps phone preference/payment actions and stacks the footer subscribe form', () => {
    expect(source('components/EmailPreferencesCenter.tsx')).toContain('flex flex-col sm:flex-row gap-3');
    expect(source('pages/Settings.tsx')).toContain('w-full sm:w-auto whitespace-normal');
    expect(source('components/Footer.tsx')).toContain('flex flex-col sm:flex-row gap-2');
    expect(source('components/Footer.tsx')).toContain('w-full min-w-0 flex-1');
  });
  it('identifies Project Previews as a showcase without changing snippet limits', () => {
    const projects = source('components/ProjectPreviewManager.tsx');
    expect(projects).toContain('A showcase, not a purchase listing.');
    expect(projects).toContain('limitInfo.maxSnippetSeconds');
    expect(projects).toContain('limitInfo.maxTracksPerProject');
    expect(source('pages/Help.tsx')).toContain('release-section-differences');
  });
});
