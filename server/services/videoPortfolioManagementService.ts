import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import {
  isPositiveSafeId,
  isValidVideoPortfolioOrderIds,
  type EditVideoPortfolioTitleInput,
  type SaveVideoPortfolioOrderInput,
  type VideoPortfolioManagementContext,
  type VideoPortfolioManagementItem,
  type VideoPortfolioManagementState,
} from '../../shared/videoPortfolioManagement';
import { getDb, getPool } from '../db';
import { ensureVideoPortfolioSchema } from './videoPortfolioSchemaService';

type SqlConnection = {
  execute: (query: string, values?: unknown[]) => Promise<any>;
  query?: (query: string, values?: unknown[]) => Promise<any>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
};

type SqlPool = {
  getConnection: () => Promise<SqlConnection>;
  execute: SqlConnection['execute'];
};

type VideoRow = {
  id: unknown;
  title: unknown;
  sortOrder: unknown;
  status: unknown;
  thumbnailUrl?: unknown;
  createdAt?: unknown;
};

type OwnerProfile = VideoPortfolioManagementContext;

const REVISION = /^[a-f0-9]{64}$/;

const unavailable = () => new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Video portfolio management is temporarily unavailable. Please try again.',
});
const forbidden = () => new TRPCError({
  code: 'FORBIDDEN',
  message: 'Only the creator profile owner can manage this video portfolio.',
});
const invalidEdit = () => new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid video portfolio title edit.' });
const invalidOrder = () => new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid video portfolio order.' });
// Deliberately never return a stored title in this error: expectedTitle is a CAS token.
const conflict = () => new TRPCError({ code: 'CONFLICT', message: 'Video portfolio changed. Refresh and try again.' });
const notFound = () => new TRPCError({ code: 'NOT_FOUND', message: 'Video not found.' });

async function poolOrThrow(): Promise<SqlPool> {
  if (!getPool()) await getDb();
  const pool = getPool();
  if (!pool) throw unavailable();
  return pool as unknown as SqlPool;
}

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

function checkedUserId(value: unknown): number {
  if (!isPositiveSafeId(value)) throw forbidden();
  return value;
}

function checkedStateItem(row: VideoRow): VideoPortfolioManagementItem {
  const id = Number(row.id);
  const sortOrder = Number(row.sortOrder);
  const status = String(row.status);
  if (!isPositiveSafeId(id) || !Number.isSafeInteger(sortOrder) || (status !== 'active' && status !== 'processing')) {
    throw unavailable();
  }
  if (typeof row.title !== 'string') throw unavailable();

  const thumbnailUrl = typeof row.thumbnailUrl === 'string' && row.thumbnailUrl.length > 0
    ? row.thumbnailUrl
    : undefined;
  return thumbnailUrl === undefined
    ? { id, title: row.title, sortOrder, status }
    : { id, title: row.title, sortOrder, status, thumbnailUrl };
}

function stableRevision(items: readonly VideoPortfolioManagementItem[]): string {
  const snapshot = [...items]
    .sort((a, b) => a.id - b.id)
    .map(({ id, title, sortOrder, status }) => [id, title, sortOrder, status]);
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

function stateFor(profileId: number, rowsToMap: VideoRow[]): VideoPortfolioManagementState {
  const items = rowsToMap.map(checkedStateItem);
  return { artistProfileId: profileId, items, revision: stableRevision(items) };
}

/**
 * Resolves an actual creator account, never a generic administrator or a
 * standalone/non-owner collaborator record. Mutations call this with locks in
 * the documented order: users, artist_profiles, artist_team_members, videos.
 */
async function verifyActualOwner(connection: Pick<SqlConnection, 'execute'>, userId: number, lock: boolean): Promise<OwnerProfile> {
  const suffix = lock ? ' FOR UPDATE' : '';
  const users = await rows(connection, `SELECT id FROM users WHERE id=? LIMIT 1${suffix}`, [userId]);
  if (users.length !== 1) throw forbidden();

  const profiles = await rows(connection,
    `SELECT id, userId, artistName FROM artist_profiles WHERE userId=? LIMIT 1${suffix}`,
    [userId],
  );
  const profile = profiles[0];
  const profileId = Number(profile?.id);
  if (!profile || Number(profile.userId) !== userId || !isPositiveSafeId(profileId) || /team member/i.test(String(profile.artistName ?? ''))) throw forbidden();

  // Use the physical column name, `teamRole`; a legacy member is never an owner.
  const memberships = await rows(connection,
    `SELECT id, artistProfileId, userId, teamRole
       FROM artist_team_members
      WHERE userId=?
      ORDER BY id ASC${suffix}`,
    [userId],
  );
  if (memberships.some((membership) => String(membership.teamRole) !== 'owner')) throw forbidden();

  return { ownerAccountId: userId, artistProfileId: profileId };
}

async function readCurrentState(
  connection: Pick<SqlConnection, 'execute'>,
  artistProfileId: number,
  lock: boolean,
): Promise<VideoPortfolioManagementState> {
  // Every present lifecycle state is known; active and processing are the
  // current nonremoved set and are the only rows this API exposes or orders.
  const result = await rows(connection,
    `SELECT id, title, sortOrder, status, thumbnailUrl, createdAt
       FROM video_portfolio
      WHERE artistProfileId=? AND status IN (?, ?)
      ORDER BY id ASC${lock ? ' FOR UPDATE' : ''}`,
    [artistProfileId, 'active', 'processing'],
  );

  const sorted = [...result].sort((a: VideoRow, b: VideoRow) => {
    const sortOrder = Number(a.sortOrder) - Number(b.sortOrder);
    if (sortOrder) return sortOrder;
    const createdA = dateValue(a.createdAt);
    const createdB = dateValue(b.createdAt);
    if (createdA !== createdB) return createdB - createdA;
    return Number(b.id) - Number(a.id);
  });
  return stateFor(artistProfileId, sorted as VideoRow[]);
}

function dateValue(value: unknown): number {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : Number.NEGATIVE_INFINITY;
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
  }
  return Number.NEGATIVE_INFINITY;
}

function checkedEditInput(input: unknown): { id: number; title: string; expectedTitle: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidEdit();
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 3 || keys[0] !== 'expectedTitle' || keys[1] !== 'id' || keys[2] !== 'title') throw invalidEdit();
  if (!isPositiveSafeId(record.id) || typeof record.title !== 'string' || typeof record.expectedTitle !== 'string') throw invalidEdit();
  const title = record.title.trim();
  if (title.length < 1 || title.length > 255) throw invalidEdit();
  return { id: record.id, title, expectedTitle: record.expectedTitle };
}

function checkedOrderInput(input: unknown): SaveVideoPortfolioOrderInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidOrder();
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== 'expectedRevision' || keys[1] !== 'ids') throw invalidOrder();
  if (!isValidVideoPortfolioOrderIds(record.ids) || typeof record.expectedRevision !== 'string' || !REVISION.test(record.expectedRevision)) {
    throw invalidOrder();
  }
  return { ids: record.ids, expectedRevision: record.expectedRevision };
}

async function beginReadCommitted(connection: SqlConnection) {
  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await connection.beginTransaction();
}

/** Resolve the authenticated account's owner context without applying writes. */
export async function getVideoPortfolioManagementContextForUser(userId: number): Promise<VideoPortfolioManagementContext> {
  const checkedId = checkedUserId(userId);
  try {
    const pool = await poolOrThrow();
    const connection = await pool.getConnection();
    try {
      return await verifyActualOwner(connection, checkedId, false);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

/** Return a fresh, owner-scoped management snapshot. */
export async function getVideoPortfolioManagementStateForUser(userId: number): Promise<VideoPortfolioManagementState> {
  const checkedId = checkedUserId(userId);
  try {
    const pool = await poolOrThrow();
    await ensureVideoPortfolioSchema(pool as any);
    const connection = await pool.getConnection();
    try {
      const owner = await verifyActualOwner(connection, checkedId, false);
      return await readCurrentState(connection, owner.artistProfileId, false);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

/** Change only a title, guarded by a title CAS token and an owner-scoped row lock. */
export async function editVideoPortfolioTitleForUser(userId: number, input: EditVideoPortfolioTitleInput | unknown): Promise<{ id: number; title: string }> {
  const checkedId = checkedUserId(userId);
  const edit = checkedEditInput(input);
  try {
    const pool = await poolOrThrow();
    await ensureVideoPortfolioSchema(pool as any);
    const connection = await pool.getConnection();
    let began = false;
    try {
      await beginReadCommitted(connection);
      began = true;
      const owner = await verifyActualOwner(connection, checkedId, true);
      const videos = await rows(connection,
        `SELECT id, title, status
           FROM video_portfolio
          WHERE id=? AND artistProfileId=? AND status IN (?, ?)
          FOR UPDATE`,
        [edit.id, owner.artistProfileId, 'active', 'processing'],
      );
      const video = videos[0] as VideoRow | undefined;
      if (!video) throw notFound();
      if (String(video.title) !== edit.expectedTitle) throw conflict();

      if (edit.title !== edit.expectedTitle) {
        const [updated] = await connection.execute(
          `UPDATE video_portfolio
              SET title=?
            WHERE id=? AND artistProfileId=? AND status IN (?, ?) AND title=?`,
          [edit.title, edit.id, owner.artistProfileId, 'active', 'processing', edit.expectedTitle],
        );
        if (Number(updated?.affectedRows) !== 1) throw conflict();
      }

      const confirmedRows = await rows(connection,
        `SELECT id, title
           FROM video_portfolio
          WHERE id=? AND artistProfileId=? AND status IN (?, ?)
          FOR UPDATE`,
        [edit.id, owner.artistProfileId, 'active', 'processing'],
      );
      const confirmed = confirmedRows[0] as VideoRow | undefined;
      if (!confirmed || Number(confirmed.id) !== edit.id || typeof confirmed.title !== 'string') throw conflict();
      await connection.commit();
      return { id: edit.id, title: confirmed.title };
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

/**
 * Atomically apply presentation order to exactly the locked current nonremoved
 * set. Writes are id-ordered and only touch sortOrder; a fresh in-transaction
 * read returns any concurrently committed new clips without renumbering them.
 */
export async function saveVideoPortfolioOrderForUser(userId: number, input: SaveVideoPortfolioOrderInput | unknown): Promise<VideoPortfolioManagementState> {
  const checkedId = checkedUserId(userId);
  const order = checkedOrderInput(input);
  try {
    const pool = await poolOrThrow();
    await ensureVideoPortfolioSchema(pool as any);
    const connection = await pool.getConnection();
    let began = false;
    try {
      await beginReadCommitted(connection);
      began = true;
      const owner = await verifyActualOwner(connection, checkedId, true);
      const current = await readCurrentState(connection, owner.artistProfileId, true);
      if (current.revision !== order.expectedRevision) throw conflict();

      const existingIds = new Set(current.items.map((item) => item.id));
      if (existingIds.size !== order.ids.length || order.ids.some((id) => !existingIds.has(id))) throw conflict();

      const nextSortOrder = new Map(order.ids.map((id, index) => [id, index]));
      const existingSortOrder = new Map(current.items.map(item => [item.id, item.sortOrder]));
      for (const id of [...order.ids].sort((a, b) => a - b)) {
        // Unchanged rows need no write; MySQL/TiDB affected-row modes can differ.
        if (nextSortOrder.get(id) === existingSortOrder.get(id)) continue;
        const [updated] = await connection.execute(
          `UPDATE video_portfolio
              SET sortOrder=?
            WHERE id=? AND artistProfileId=? AND status IN (?, ?)`,
          [nextSortOrder.get(id), id, owner.artistProfileId, 'active', 'processing'],
        );
        if (Number(updated?.affectedRows) !== 1) throw conflict();
      }

      // Do not synthesize state: a new committed clip remains untouched and is included here.
      const confirmed = await readCurrentState(connection, owner.artistProfileId, false);
      await connection.commit();
      return confirmed;
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
