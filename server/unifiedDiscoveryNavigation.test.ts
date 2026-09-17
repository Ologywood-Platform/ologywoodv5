import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { discoveryMatchScore, toDiscoverySlug } from './routers/discoverySearch';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('unified discovery search', () => {
  it('creates clean canonical slugs for public results', () => {
    expect(toDiscoverySlug('Dawud Anyabwile')).toBe('dawud-anyabwile');
    expect(toDiscoverySlug('Arts & Culture Night!')).toBe('arts-culture-night');
  });

  it('ranks exact and prefix matches ahead of broad substring matches', () => {
    expect(discoveryMatchScore('Adonis', 'adonis')).toBeLessThan(discoveryMatchScore('Adonis Live', 'adonis'));
    expect(discoveryMatchScore('Dawud Anyabwile', 'any')).toBeLessThan(discoveryMatchScore('Many Voices', 'any'));
  });

  it('uses one public endpoint across artists, venues, and events', () => {
    const router = source('server/routers/discoverySearch.ts');
    expect(router).toContain('suggest: publicProcedure');
    expect(router).toContain('artistProfiles');
    expect(router).toContain('venueProfiles');
    expect(router).toContain('events');
    expect(router).toContain("eq(venueProfiles.isListed, true)");
    expect(router).toContain("eq(events.isPublic, true)");
    expect(router).toContain("ne(events.status, 'cancelled')");
    expect(router).toContain("ne(artistTeamMembers.role, 'owner')");
  });

  it('debounces suggestions and supports keyboard navigation', () => {
    const search = source('client/src/components/GlobalSearch.tsx');
    expect(search).toContain('setTimeout(() => setDebouncedQuery(query.trim()), 300)');
    expect(search).toContain('trpc.discoverySearch.suggest.useQuery');
    expect(search).toContain('if (mobile) return;');
    expect(search).toContain("event.key === 'ArrowDown'");
    expect(search).toContain("event.key === 'ArrowUp'");
    expect(search).toContain("event.key === 'Enter'");
    expect(search).toContain('aria-autocomplete="list"');
    expect(search).toContain('Suggestions appear as you type.');
  });

  it('exposes search from the shared desktop and mobile header', () => {
    const header = source('client/src/components/SiteHeader.tsx');
    expect(header).toContain('<GlobalSearch />');
    expect(header).toContain('<GlobalSearch mobile />');
  });
});

describe('dynamic entity breadcrumbs', () => {
  it('defines a clear hierarchy for artist, venue, and event details', () => {
    const breadcrumb = source('client/src/components/EntityBreadcrumb.tsx');
    expect(breadcrumb).toContain("label: 'Discover', href: '/discover'");
    expect(breadcrumb).toContain("label: 'Talent', href: '/browse'");
    expect(breadcrumb).toContain("label: 'Venues', href: '/venues'");
    expect(breadcrumb).toContain("label: 'Experiences', href: '/experiences'");
    expect(breadcrumb).toContain("label: 'Events', href: '/events'");
    expect(breadcrumb).toContain('{ label: currentLabel }');
  });

  const pageExpectations = [
    ['ArtistProfile.tsx', 'artist'],
    ['VenueProfile.tsx', 'venue'],
    ['EventDetail.tsx', 'event'],
  ] as const;

  for (const [page, type] of pageExpectations) {
    it(`${page} uses the shared ${type} breadcrumb`, () => {
      const content = source(`client/src/pages/${page}`);
      expect(content).toContain("import EntityBreadcrumb from '@/components/EntityBreadcrumb'");
      expect(content).toContain(`<EntityBreadcrumb`);
      expect(content).toContain(`type="${type}"`);
    });
  }

  it('keeps breadcrumb navigation accessible and mobile-safe', () => {
    const breadcrumb = source('client/src/components/PageBreadcrumb.tsx');
    expect(breadcrumb).toContain('aria-label="Breadcrumb"');
    expect(breadcrumb).toContain('aria-label="Home"');
    expect(breadcrumb).toContain('overflow-x-auto');
    expect(breadcrumb).toContain('truncate');
  });
});
