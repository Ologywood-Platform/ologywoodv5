import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const pagesDir = path.resolve(__dirname, '../client/src/pages');
const profileSource = fs.readFileSync(path.join(pagesDir, 'ArtistProfile.tsx'), 'utf8');
const portfolioSource = fs.readFileSync(path.join(pagesDir, 'ArtistHistory.tsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(pagesDir, 'ArtistDashboardV3.tsx'), 'utf8');
const bookingSource = fs.readFileSync(path.join(pagesDir, 'BookingDetail.tsx'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '../client/src/App.tsx'), 'utf8');

describe('creator-neutral portfolio wording', () => {
  it('uses a universal Portfolio heading and description on public profiles', () => {
    expect(profileSource).toContain('<CardTitle>Portfolio</CardTitle>');
    expect(profileSource).toContain('Selected work, projects, appearances, and creative highlights');
    expect(profileSource).toContain('Explore previous work and professional experience from this creator.');
    expect(profileSource).not.toContain('<CardTitle>Performance Portfolio</CardTitle>');
  });

  it('uses creator-neutral metadata, headings, and empty states on the full portfolio page', () => {
    expect(portfolioSource).toContain('`${artistName} - Portfolio | Ologywood`');
    expect(portfolioSource).toContain('Portfolio Coming Soon');
    expect(portfolioSource).toContain('Add Your First Portfolio Entry');
    expect(portfolioSource).toContain('Delete Portfolio Entry');
    expect(portfolioSource).not.toContain('Performance Portfolio');
    expect(portfolioSource).not.toContain('No Performance History Yet');
  });

  it('uses clean portfolio URLs and resolved IDs for actions opened from artist slugs', () => {
    expect(appSource).toContain('<Route path="/artist/:slug/portfolio"');
    expect(appSource).toContain('<Route path="/artists/:id/history"');
    expect(profileSource).toContain('navigate(`/artist/${toSlug(artist.artistName)}/portfolio`)');
    expect(profileSource).not.toContain('navigate(`/artists/${artistId}/history`)');
    expect(profileSource).toContain('<FavoriteButton artistId={resolvedArtistId}');
    expect(profileSource).toContain('<TouringDisplay artistProfileId={resolvedArtistId} />');
    expect(profileSource).toContain('targetId={resolvedArtistId}');
    expect(profileSource).toContain('artistId={resolvedArtistId}');
    expect(dashboardSource).toContain('navigate(`/artist/${artistSlug}/portfolio`)');
    expect(dashboardSource).toContain('disabled={!artistProfile?.artistName}');
    expect(bookingSource).toContain('? `/artist/${toSlug(artistName)}/portfolio`');
    expect(bookingSource).toContain(': `/artists/${booking.artistId}/history`');
  });

  it('does not render an empty artist breadcrumb for zero or missing portfolio IDs', () => {
    expect(portfolioSource).toContain('useRoute("/artist/:slug/portfolio")');
    expect(portfolioSource).toContain('useRoute("/artists/:id/history")');
    expect(portfolioSource).toContain('const hasValidRoute = (isCleanRoute && !!slug) || (isLegacyRoute && legacyArtistId > 0)');
    expect(portfolioSource).toContain('if (!hasValidRoute || !artist)');
    expect(portfolioSource).toContain('Portfolio not found');
    expect(portfolioSource).toContain('href: `/artist/${toSlug(artist.artistName)}`');
    expect(portfolioSource).toContain('navigate(`/artist/${toSlug(artist.artistName)}/portfolio`, { replace: true })');
    expect(portfolioSource).not.toContain("toSlug(artist?.artistName || '')");
  });
});
