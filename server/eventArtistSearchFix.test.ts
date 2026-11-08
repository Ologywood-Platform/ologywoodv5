import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eventSearchPattern, normalizeEventSearchQuery } from '../shared/eventSearch';
import { discoveryMatchScore } from './routers/discoverySearch';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('event artist-name search', () => {
  it('prioritizes exact and starts-with artist matches', () => {
    expect(discoveryMatchScore('Dawud Anyabwile', 'dawud')).toBe(1);
    expect(discoveryMatchScore('Anyabwile Dawud', 'dawud')).toBe(2);
    expect(discoveryMatchScore('The xDawud Project', 'dawud')).toBe(3);
    expect(discoveryMatchScore('Dawud', 'Dawud')).toBe(0);
  });

  it('normalizes full and partial artist names case-insensitively', () => {
    expect(normalizeEventSearchQuery('  DAWUD   Anyabwile ')).toBe('dawud anyabwile');
    expect(eventSearchPattern('Dawud')).toBe('%dawud%');
    expect(eventSearchPattern('   ')).toBeNull();
  });

  it('submits the applied free-text query to the event search API', () => {
    const page = source('client/src/pages/EventDiscovery.tsx');
    expect(page).toContain('if (searchQuery.trim()) input.search = searchQuery.trim()');
    expect(page).toContain('Search by event, artist, venue, or location');
    expect(page).toContain('setHasSearched(true)');
    expect(page).toContain('const filteredEvents = apiEvents');
    expect(page).not.toContain('apiEvents.filter((event: any)');
  });

  it('matches event, description, location, artist, and venue names while retaining public and combined filters', () => {
    const db = source('server/db.ts');
    expect(db).toContain('eq(events.isPublic, true)');
    expect(db).toContain('eventSearchPattern(filters.query)');
    expect(db).toContain('artistProfiles.artistName');
    expect(db).toContain('venueProfiles.organizationName');
    expect(db).toContain('events.eventTitle');
    expect(db).toContain('events.description');
    expect(db).toContain('events.location');
    expect(db).toContain('if (filters.city)');
    expect(db).toContain('if (filters.category)');
    expect(db).toContain('if (filters.startDate)');
    expect(db).toContain('if (filters.endDate)');
  });

  it('uses artist profile IDs for enrichment and clean-slug Upcoming Events queries', () => {
    const router = source('server/routers/events.ts');
    const profile = source('client/src/pages/ArtistProfile.tsx');
    expect(router).toContain('search: z.string().trim().max(200).optional()');
    expect(router).toContain('query: input.search');
    expect(router).toContain('getArtistProfileById(event.artistId)');
    expect(router).not.toContain('getArtistProfileByUserId(event.artistId)');
    expect(profile).toContain('const resolvedArtistId = Number(artist?.id || artistId)');
    expect(profile).toContain('{ artistId: resolvedArtistId }');
    expect(profile).toContain('{ enabled: resolvedArtistId > 0 }');
  });

  it('keeps Browse starts-with, state/region, and verified filter wiring intact', () => {
    const browse = source('client/src/pages/Browse.tsx');
    const router = source('server/routers.ts');
    expect(browse).toContain("name.startsWith(q)");
    expect(browse).toContain("state?: string");
    expect(browse).toContain("region?: string");
    expect(browse).toContain("filters.state");
    expect(browse).toContain("filters.region");
    expect(router).toContain("verifiedOnly: z.boolean().optional()");
  });
});
