import { and, desc, eq, ne, notExists, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  artistProfiles,
  artistTeamMembers,
  events,
  venueProfiles,
} from '../../drizzle/schema';
import { formatDateOnly } from '../../shared/dateOnly';
import { publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';

export type DiscoverySearchResult = {
  id: number;
  type: 'artist' | 'venue' | 'event';
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
};

export function toDiscoverySlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export function discoveryMatchScore(value: string, query: string): number {
  const normalizedValue = value.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedValue === normalizedQuery) return 0;
  if (normalizedValue.startsWith(normalizedQuery)) return 1;
  if (normalizedValue.split(/\s+/).some((word) => word.startsWith(normalizedQuery))) return 2;
  if (normalizedValue.includes(normalizedQuery)) return 3;
  return 4;
}

function combineDetails(...values: Array<string | null | undefined>): string | null {
  const details = values.map((value) => value?.trim()).filter(Boolean);
  return details.length > 0 ? details.join(' · ') : null;
}

function createNameCondition(column: any, query: string) {
  if (query.length <= 2) {
    return sql`LEFT(LOWER(COALESCE(${column}, '')), ${query.length}) = ${query}`;
  }
  return sql`LOCATE(${query}, LOWER(COALESCE(${column}, ''))) > 0`;
}

function createBroadCondition(primaryColumn: any, secondaryColumns: any[], query: string) {
  const primaryCondition = createNameCondition(primaryColumn, query);
  if (query.length <= 2) return primaryCondition;
  return or(
    primaryCondition,
    ...secondaryColumns.map((column) => sql`LOCATE(${query}, LOWER(COALESCE(${column}, ''))) > 0`),
  );
}

export const discoverySearchRouter = router({
  suggest: publicProcedure
    .input(z.object({
      query: z.string().trim().min(1).max(80),
      limitPerType: z.number().int().min(1).max(6).default(4),
    }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { artists: [], venues: [], events: [] };

      const query = input.query.trim().toLowerCase();
      const candidateLimit = input.limitPerType * 8;

      const [artistCandidates, venueCandidates, eventCandidates] = await Promise.all([
        database
          .select({
            id: artistProfiles.id,
            userId: artistProfiles.userId,
            artistName: artistProfiles.artistName,
            talentType: artistProfiles.talentType,
            location: artistProfiles.location,
            city: artistProfiles.city,
            state: artistProfiles.state,
            imageUrl: artistProfiles.profilePhotoUrl,
          })
          .from(artistProfiles)
          .where(and(
            createBroadCondition(
              artistProfiles.artistName,
              [artistProfiles.location, artistProfiles.city, artistProfiles.state],
              query,
            ),
            notExists(
              database
                .select({ id: artistTeamMembers.id })
                .from(artistTeamMembers)
                .where(and(
                  eq(artistTeamMembers.userId, artistProfiles.userId),
                  ne(artistTeamMembers.role, 'owner'),
                )),
            ),
          ))
          .orderBy(desc(artistProfiles.updatedAt))
          .limit(candidateLimit),
        database
          .select({
            id: venueProfiles.id,
            organizationName: venueProfiles.organizationName,
            venueType: venueProfiles.venueType,
            location: venueProfiles.location,
            city: venueProfiles.city,
            state: venueProfiles.state,
            imageUrl: venueProfiles.profilePhotoUrl,
          })
          .from(venueProfiles)
          .where(and(
            eq(venueProfiles.isListed, true),
            createBroadCondition(
              venueProfiles.organizationName,
              [venueProfiles.location, venueProfiles.city, venueProfiles.state],
              query,
            ),
          ))
          .orderBy(desc(venueProfiles.updatedAt))
          .limit(candidateLimit),
        database
          .select({
            id: events.id,
            eventTitle: events.eventTitle,
            eventType: events.eventType,
            eventDate: events.eventDate,
            location: events.location,
            imageUrl: events.coverImageUrl,
          })
          .from(events)
          .where(and(
            eq(events.isPublic, true),
            ne(events.status, 'cancelled'),
            createBroadCondition(events.eventTitle, [events.location], query),
          ))
          .orderBy(desc(events.updatedAt))
          .limit(candidateLimit),
      ]);

      const byRelevance = (left: { title: string }, right: { title: string }) =>
        discoveryMatchScore(left.title, query) - discoveryMatchScore(right.title, query)
        || left.title.localeCompare(right.title);

      const artists: DiscoverySearchResult[] = artistCandidates
        .filter((artist) => {
          const name = artist.artistName.trim();
          return Boolean(name)
            && !name.toLowerCase().includes('team member')
            && Boolean(toDiscoverySlug(name));
        })
        .map((artist) => ({
          id: artist.id,
          type: 'artist' as const,
          title: artist.artistName,
          subtitle: combineDetails(
            artist.talentType ? artist.talentType.replace(/_/g, ' ') : 'Talent',
            artist.location || combineDetails(artist.city, artist.state),
          ),
          imageUrl: artist.imageUrl,
          href: `/artist/${toDiscoverySlug(artist.artistName)}`,
        }))
        .sort(byRelevance)
        .slice(0, input.limitPerType);

      const venues: DiscoverySearchResult[] = venueCandidates
        .filter((venue) => Boolean(toDiscoverySlug(venue.organizationName)))
        .map((venue) => ({
          id: venue.id,
          type: 'venue' as const,
          title: venue.organizationName,
          subtitle: combineDetails(
            venue.venueType || 'Venue',
            venue.location || combineDetails(venue.city, venue.state),
          ),
          imageUrl: venue.imageUrl,
          href: `/venue/${toDiscoverySlug(venue.organizationName)}`,
        }))
        .sort(byRelevance)
        .slice(0, input.limitPerType);

      const publicEvents: DiscoverySearchResult[] = eventCandidates
        .filter((event) => Boolean(toDiscoverySlug(event.eventTitle)))
        .map((event) => ({
          id: event.id,
          type: 'event' as const,
          title: event.eventTitle,
          subtitle: combineDetails(
            formatDateOnly(event.eventDate),
            event.location,
            event.eventType.replace(/_/g, ' '),
          ),
          imageUrl: event.imageUrl,
          href: `/events/${toDiscoverySlug(event.eventTitle)}`,
        }))
        .sort(byRelevance)
        .slice(0, input.limitPerType);

      return { artists, venues, events: publicEvents };
    }),
});
