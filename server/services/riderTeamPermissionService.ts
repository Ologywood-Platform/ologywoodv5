import { TRPCError } from '@trpc/server';
import { getDb, getPool } from '../db';

function permissionsObject(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid stored team permissions');
  return parsed as Record<string, unknown>;
}

/** Only the actual creator owner can grant or revoke document management. */
export async function setTeamRiderPermission(actorId: number, memberId: number, manageRiders: boolean) {
  await getDb();
  const pool = getPool();
  if (!pool) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Team permissions temporarily unavailable' });
  const connection = await pool.getConnection();
  try {
    const [initialRows] = await connection.execute<any[]>('SELECT id, userId, artistProfileId FROM artist_team_members WHERE id = ? LIMIT 1', [memberId]);
    const initial = initialRows[0];
    if (!initial) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
    await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    const ids = [...new Set([actorId, Number(initial.userId)])].sort((a, b) => a - b);
    await connection.execute(`SELECT id FROM users WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`, ids);
    const [profiles] = await connection.execute<any[]>('SELECT id, userId FROM artist_profiles WHERE id = ? AND userId = ? FOR UPDATE', [initial.artistProfileId, actorId]);
    const [nonOwner] = await connection.execute<any[]>('SELECT id FROM artist_team_members WHERE userId = ? AND teamRole <> ? LIMIT 1 FOR UPDATE', [actorId, 'owner']);
    if (!profiles[0] || nonOwner.length) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the talent account owner can manage rider permissions' });
    const [members] = await connection.execute<any[]>('SELECT id, userId, artistProfileId, teamRole, permissions FROM artist_team_members WHERE id = ? FOR UPDATE', [memberId]);
    const member = members[0];
    if (!member || Number(member.artistProfileId) !== Number(profiles[0].id) || Number(member.userId) !== Number(initial.userId)) throw new TRPCError({ code: 'CONFLICT', message: 'Team access changed. Refresh and try again' });
    if (member.teamRole === 'owner' || Number(member.userId) === actorId) throw new TRPCError({ code: 'FORBIDDEN', message: 'The owner already controls their riders' });
    const permissions = { ...permissionsObject(member.permissions), manageRiders };
    await connection.execute('UPDATE artist_team_members SET permissions = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND artistProfileId = ? AND userId = ?', [JSON.stringify(permissions), memberId, profiles[0].id, member.userId]);
    await connection.execute('INSERT INTO artist_team_activity_log (artistProfileId, userId, action, details) VALUES (?, ?, ?, ?)', [profiles[0].id, actorId, 'rider_permission_updated', JSON.stringify({ memberId, manageRiders })]);
    await connection.commit();
    return { success: true as const, manageRiders };
  } catch (error) {
    await connection.rollback();
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Team permissions temporarily unavailable' });
  } finally { connection.release(); }
}
