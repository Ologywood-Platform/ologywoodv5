import { TRPCError } from '@trpc/server';
import { getDb, getPool } from '../db';

type SqlConnection = {
  execute: (query: string, values?: unknown[]) => Promise<any>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
};

type SqlPool = {
  getConnection: () => Promise<SqlConnection>;
};

type DescriptionRow = {
  id: number | string;
  artistId: number | string;
  description: string | null;
  status: string;
};

type ArtistProfileRow = {
  id: number | string;
  userId: number | string;
  artistName: string | null;
};

export type MusicReleaseDescription = {
  id: number;
  description: string | null;
  status: string;
};

export type UpdateMusicReleaseDescriptionInput = {
  id: number;
  description: string;
  expectedDescription: string | null;
};

const editableStatuses = new Set(['draft', 'published', 'archived']);
const unavailable = () => new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Release description is temporarily unavailable. Please try again.',
});
const releaseNotFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Release not found' });
const ownerRequired = () => new TRPCError({ code: 'FORBIDDEN', message: 'Only the creator profile owner can edit release descriptions.' });
const descriptionConflict = () => new TRPCError({ code: 'CONFLICT', message: 'Release description changed. Refresh and try again.' });

async function rows(connection: Pick<SqlConnection, 'execute'>, query: string, values: unknown[] = []): Promise<any[]> {
  try {
    const [result] = await connection.execute(query, values);
    if (!Array.isArray(result)) throw unavailable();
    return result;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

async function poolOrThrow(): Promise<SqlPool> {
  if (!getPool()) await getDb();
  const pool = getPool();
  if (!pool) throw unavailable();
  return pool as unknown as SqlPool;
}

/**
 * Confirms that this account owns its profile. Team accounts (and a legacy
 * profile label used for team accounts) are intentionally not privileged here.
 */
async function verifyProfileOwner(
  connection: Pick<SqlConnection, 'execute'>,
  userId: number,
  lock: boolean,
): Promise<number> {
  const suffix = lock ? ' FOR UPDATE' : '';
  const profiles = await rows(
    connection,
    `SELECT id, userId, artistName FROM artist_profiles WHERE userId=? LIMIT 1${suffix}`,
    [userId],
  );
  const profile = profiles[0] as ArtistProfileRow | undefined;
  const memberships = await rows(
    connection,
    `SELECT id FROM artist_team_members WHERE userId=? AND teamRole <> 'owner' LIMIT 1${suffix}`,
    [userId],
  );

  const profileId = Number(profile?.id);
  if (
    !profile ||
    Number(profile.userId) !== userId ||
    memberships.length > 0 ||
    /team member/i.test(String(profile.artistName ?? '')) ||
    !Number.isSafeInteger(profileId) ||
    profileId <= 0
  ) {
    throw ownerRequired();
  }
  return profileId;
}

async function findOwnedEditableRelease(
  connection: Pick<SqlConnection, 'execute'>,
  releaseId: number,
  artistId: number,
  lock: boolean,
): Promise<DescriptionRow> {
  const releases = await rows(
    connection,
    `SELECT id, artistId, description, status FROM artist_releases WHERE id=? AND artistId=? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [releaseId, artistId],
  );
  const release = releases[0] as DescriptionRow | undefined;
  const id = Number(release?.id);
  if (
    !release ||
    Number(release.artistId) !== artistId ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof release.status !== 'string' ||
    !editableStatuses.has(release.status) ||
    (release.description !== null && typeof release.description !== 'string')
  ) {
    // This includes taken-down releases, so their existence is not disclosed.
    throw releaseNotFound();
  }
  return release;
}

function response(release: DescriptionRow): MusicReleaseDescription {
  return {
    id: Number(release.id),
    description: release.description,
    status: release.status,
  };
}

/** Fresh, ownership-scoped edit state. It intentionally never selects media or sales fields. */
export async function getMusicReleaseDescriptionForEditForUser(userId: number, releaseId: number): Promise<MusicReleaseDescription> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw ownerRequired();
  if (!Number.isSafeInteger(releaseId) || releaseId <= 0) throw releaseNotFound();

  try {
    const pool = await poolOrThrow();
    const connection = await pool.getConnection();
    try {
      const artistId = await verifyProfileOwner(connection, userId, false);
      const release = await findOwnedEditableRelease(connection, releaseId, artistId, false);
      return response(release);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

/**
 * Description-only CAS update. The authenticated user row is always locked
 * first; profile, membership, and release locks then follow deterministically.
 */
export async function updateMusicReleaseDescriptionForUser(
  userId: number,
  input: UpdateMusicReleaseDescriptionInput,
): Promise<MusicReleaseDescription> {
  if (!Number.isSafeInteger(userId) || userId <= 0) throw ownerRequired();
  if (!Number.isSafeInteger(input?.id) || input.id <= 0) throw releaseNotFound();

  // Empty UI input is deliberately stored as NULL. Whitespace is user content.
  const nextDescription = input.description === '' ? null : input.description;

  try {
    const pool = await poolOrThrow();
    const connection = await pool.getConnection();
    let began = false;
    try {
      await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      began = true;

      const users = await rows(connection, 'SELECT id FROM users WHERE id=? FOR UPDATE', [userId]);
      if (users.length !== 1) throw ownerRequired();

      const artistId = await verifyProfileOwner(connection, userId, true);
      const release = await findOwnedEditableRelease(connection, input.id, artistId, true);
      if (release.description !== input.expectedDescription) throw descriptionConflict();

      if (release.description !== nextDescription) {
        let updateResult: any;
        try {
          [updateResult] = await connection.execute(
            'UPDATE artist_releases SET description=? WHERE id=? AND artistId=? AND description <=> ?',
            [nextDescription, input.id, artistId, input.expectedDescription],
          );
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw unavailable();
        }
        if (!updateResult || Number(updateResult.affectedRows) !== 1) throw descriptionConflict();
      }

      await connection.commit();
      return { id: Number(release.id), description: nextDescription, status: release.status };
    } catch (error) {
      if (began) {
        try { await connection.rollback(); } catch { /* preserve the safe original error */ }
      }
      if (error instanceof TRPCError) throw error;
      throw unavailable();
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}
