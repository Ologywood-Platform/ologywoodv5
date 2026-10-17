import { TRPCError } from '@trpc/server';
import { and, eq, ne } from 'drizzle-orm';
import { artistProfiles, artistTeamMembers } from '../../drizzle/schema';
import { getDb } from '../db';

/** Account role alone never grants access to somebody else's fan contacts. */
export async function assertFanEmailCreator(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Fan tools are temporarily unavailable.' });
  const [profiles, memberships] = await Promise.all([
    db.select({ id: artistProfiles.id, name: artistProfiles.artistName }).from(artistProfiles).where(eq(artistProfiles.userId, userId)).limit(1),
    db.select({ id: artistTeamMembers.id }).from(artistTeamMembers).where(and(eq(artistTeamMembers.userId, userId), ne(artistTeamMembers.role, 'owner'))).limit(1),
  ]);
  if (!profiles.length || memberships.length || /team member/i.test(profiles[0].name || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only creator profile owners can use fan email tools.' });
  }
}
