import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { getCanonicalNavigationAnswer, MUSIC_UPLOAD_GUIDANCE } from './routers/aiChat';

const source = (path: string) => fs.readFileSync(new URL(`../client/src/${path}`, import.meta.url), 'utf8');

describe('Downloadable music upload navigation', () => {
  it('exposes the existing manager from the creator dashboard separately from hosted content', () => {
    const dashboard = source('pages/ArtistDashboardV3.tsx');
    expect(dashboard).toContain("navigate('/releases')");
    expect(dashboard).toContain('>Music Releases</span>');
    expect(dashboard).toContain('Upload songs to sell');
    expect(dashboard).toContain("navigate('/content-releases')");
    expect(dashboard).toContain('>Content Releases</span>');
  });
  it('adds music only to creator Create actions, preserving team and venue boundaries', () => {
    const dialog = source('components/CreateActionDialog.tsx');
    expect(dialog).toContain("label: 'Music Release'");
    expect(dialog).toContain("href: '/releases', icon: Music");
    const venue = dialog.split('const venueActions =')[1].split('const bloggerActions =')[0];
    expect(venue).not.toContain('/releases');
    expect(dialog).toContain("role === 'creator' ? creatorActions");
    expect(dialog).toContain('if (actions.length === 0) return null');
  });
  it('links the hosted-content page to the upload tool without automatically transferring or saving drafts', () => {
    const page = source('pages/ContentReleases.tsx');
    expect(page).toContain('Want fans to download your song?');
    expect(page).toContain('<Link href="/releases"');
    expect(page).toContain('Unsaved entries on this form will not be carried over.');
  });
  it('uses a root music header in every branch and keeps existing upload and publishing contracts', () => {
    const manager = source('pages/ReleaseManager.tsx');
    expect(manager.match(/<SiteHeader\s*\/>/g)).toHaveLength(1);
    expect(manager.match(/<MusicReleasePageShell>/g)).toHaveLength(4);
    expect(manager).toContain('>Music Releases</h1>');
    expect(manager).toContain('Upload a Song');
    expect(manager).toContain('canCreate?.allowed && !showCreateForm && !editingRelease');
    expect(manager).toContain('/api/release/upload/audio');
    expect(manager).toContain('/api/release/upload/cover');
    expect(manager).toContain('Create Draft');
    expect(manager).toContain('publishMutation.mutate({ id: release.id })');
    expect(manager).toContain('rightsCertified');
    expect(manager).toContain('1% platform fee');
  });
  it.each([
    'I want to add songs to be downloaded and cant see where to add them',
    'How do I upload an audio file for a single?',
    'Where do I sell downloadable music?',
  ])('answers creator upload intent before hosted-single or buying guidance: %s', (question) => {
    expect(getCanonicalNavigationAnswer(question)).toBe(MUSIC_UPLOAD_GUIDANCE);
    expect(MUSIC_UPLOAD_GUIDANCE).toContain('Artist Dashboard → Music Releases');
    expect(MUSIC_UPLOAD_GUIDANCE).toContain('Workspace → Create → Music Release');
    expect(MUSIC_UPLOAD_GUIDANCE).toContain('Create Draft, then Publish');
  });
  it('keeps ordinary preview, buying and hosted single questions on their existing answers', () => {
    expect(getCanonicalNavigationAnswer('How do fans buy music?')).toContain('Open the creator profile');
    expect(getCanonicalNavigationAnswer('How does the song preview work?')).toContain('public samples');
    expect(getCanonicalNavigationAnswer('How do I release one song on YouTube?')).toContain('hosted on YouTube');
  });
  it('includes accurate upload steps and plan limits in Help', () => {
    const help = source('pages/Help.tsx');
    expect(help).toContain('upload-downloadable-song');
    expect(help).toContain('Create Draft, then Publish from the release list');
    expect(help).toContain('Professional and Enterprise allow unlimited Music Releases; Starter allows two');
  });
});
