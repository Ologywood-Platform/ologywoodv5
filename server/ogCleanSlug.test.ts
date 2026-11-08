import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routes/ogPage.ts'), 'utf8');

describe('clean OG profile slug compatibility', () => {
  it('resolves artist name-only slugs through the stored artist name', () => {
    expect(source).toContain('const requestedSlug = req.params.slug');
    expect(source).toContain('toSlug(candidate.artistName) === requestedSlug');
    expect(source).toContain("return res.status(404).json({ error: 'Artist not found' })");
  });

  it('resolves venue name-only slugs through the stored organization name', () => {
    expect(source).toContain('toSlug(candidate.organizationName) === requestedSlug');
    expect(source).toContain("return res.status(404).json({ error: 'Venue not found' })");
  });

  it('keeps the public canonical URLs clean while preserving slug-ID share URLs', () => {
    expect(source).toContain('canonicalUrl = `${baseUrl}/artist/${toSlug(artist.artistName)}`');
    expect(source).toContain('canonicalUrl = `${baseUrl}/venue/${toSlug(venue.organizationName)}`');
    expect(source).toContain('candidate.isPublic && toSlug(candidate.eventTitle) === requestedSlug');
    expect(source).toContain("return res.status(404).json({ error: 'Event not found' })");
    expect(source).toContain('canonicalUrl = `${baseUrl}/events/${toSlug(event.eventTitle)}`');
    expect(source).toContain('url: `${baseUrl}/api/og-page/artist/${correctSlug}`');
    expect(source).toContain('url: `${baseUrl}/api/og-page/venue/${correctSlug}`');
    expect(source).toContain('url: `${baseUrl}/api/og-page/event/${correctSlug}`');
  });
});
