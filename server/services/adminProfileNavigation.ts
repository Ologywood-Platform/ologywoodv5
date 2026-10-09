import { and, inArray, ne } from 'drizzle-orm';
import { artistProfiles, artistTeamMembers, venueProfiles } from '../../drizzle/schema';
import type { getDb } from '../db';

export type AdminProfileNavigation = {
  href: string | null;
  profileName: string | null;
  profileType: 'artist' | 'venue' | null;
  status: 'available' | 'team_member' | 'not_created' | 'unavailable';
};
type ProfileUser = { id: number; role: string };
type ArtistSummary = { id: number; userId: number; artistName: string };
type VenueSummary = { id: number; userId: number; organizationName: string };

/** Same canonical name normalization as the platform's public profile URLs. */
function profileSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60);
}
export function resolveAdminProfileNavigation(
  user: ProfileUser,
  artists: ArtistSummary[],
  venues: VenueSummary[],
  collaboratorUserIds: Set<number>,
): AdminProfileNavigation {
  const empty = { href: null, profileName: null, profileType: null };
  if (collaboratorUserIds.has(user.id)) return { ...empty, status: 'team_member' };
  const artist = artists.find(profile => profile.userId === user.id);
  const venue = venues.find(profile => profile.userId === user.id);
  // Preserve actual profile ownership even when the platform owner has an admin role.
  const useVenue = venue && (user.role === 'venue' || !artist);
  const name = useVenue ? venue.organizationName : artist?.artistName;
  const id = useVenue ? venue.id : artist?.id;
  const profileType = useVenue ? 'venue' : 'artist';
  if (!name || !id || id < 1) return { ...empty, status: name !== undefined ? 'unavailable' : 'not_created' };
  if (profileType === 'artist' && name.toLowerCase().includes('team member')) return { ...empty, status: 'team_member' };
  const slug = profileSlug(name);
  if (!slug) return { ...empty, status: 'unavailable' };
  return { href: `/${profileType}/${slug}`, profileName: name, profileType, status: 'available' };
}

export async function getAdminProfileNavigation(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  pageUsers: ProfileUser[],
): Promise<Map<number, AdminProfileNavigation>> {
  const ids = pageUsers.map(user => user.id);
  if (!ids.length) return new Map();
  // Only three bounded reads for the current page, never an N+1 profile query.
  const [artists, venues, collaborators] = await Promise.all([
    database.select({ id: artistProfiles.id, userId: artistProfiles.userId, artistName: artistProfiles.artistName })
      .from(artistProfiles).where(inArray(artistProfiles.userId, ids)),
    database.select({ id: venueProfiles.id, userId: venueProfiles.userId, organizationName: venueProfiles.organizationName })
      .from(venueProfiles).where(inArray(venueProfiles.userId, ids)),
    database.select({ userId: artistTeamMembers.userId }).from(artistTeamMembers)
      .where(and(inArray(artistTeamMembers.userId, ids), ne(artistTeamMembers.role, 'owner'))),
  ]);
  const collaboratorIds = new Set(collaborators.map(member => member.userId));
  return new Map(pageUsers.map(user => [user.id, resolveAdminProfileNavigation(user, artists, venues, collaboratorIds)]));
}
