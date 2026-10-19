import { TRPCError } from '@trpc/server';
import { applyReleaseOrder, RELEASE_ORDER_KINDS, RELEASE_ORDER_MAX_ITEMS, validReleaseOrderIds, type ReleaseOrderKind, type ReleaseOrderState, type SaveReleaseOrderInput } from '../../shared/releaseOrder';
import { getDb, getPool } from '../db';
import { ensureReleaseOrderSchema } from './releaseOrderSchemaService';

type SqlConnection = {
  execute: (query: string, values?: unknown[]) => Promise<any>;
  beginTransaction: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
};
type SqlPool = { getConnection: () => Promise<SqlConnection>; execute: SqlConnection['execute'] };
type ReleaseOrderRow = { orderedIds: unknown; revision: number | string };
type ReleaseItem = { id: number; title: string; publishedAt?: unknown; createdAt?: unknown; status?: string; isPublished?: boolean; releaseType?: string };

const kindSet = new Set<string>(RELEASE_ORDER_KINDS);
const unavailable = () => new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Release ordering is temporarily unavailable. Please try again.' });
const invalid = () => new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid release order.' });
const conflict = () => new TRPCError({ code: 'CONFLICT', message: 'Release order changed. Refresh and try again.' });
const forbidden = () => new TRPCError({ code: 'FORBIDDEN', message: 'Only the creator profile owner can reorder releases.' });

function checkedKind(value: unknown): ReleaseOrderKind {
  if (typeof value !== 'string' || !kindSet.has(value)) throw invalid();
  return value as ReleaseOrderKind;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw invalid();
  return value as number;
}

function checkedIds(value: unknown): number[] {
  if (!validReleaseOrderIds(value)) throw invalid();
  return value;
}

function epoch(value: unknown): number {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : Number.NEGATIVE_INFINITY;
  if (typeof value === 'number') return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
  }
  return Number.NEGATIVE_INFINITY;
}

function newestFirst<T extends { id: number }>(date: (row: T) => unknown): (a: T, b: T) => number {
  return (a, b) => epoch(date(b)) - epoch(date(a)) || b.id - a.id;
}

function orderedIds(value: unknown): number[] | null {
  if (value == null) return null;
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { throw unavailable(); }
  }
  if (!validReleaseOrderIds(parsed)) throw unavailable();
  return parsed;
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

async function poolOrThrow(): Promise<SqlPool> {
  if (!getPool()) await getDb();
  const pool = getPool();
  if (!pool) throw unavailable();
  return pool as unknown as SqlPool;
}

async function verifyOwner(connection: Pick<SqlConnection, 'execute'>, userId: number, lock: boolean): Promise<{ id: number; artistName: string | null }> {
  const suffix = lock ? ' FOR UPDATE' : '';
  const profiles = await rows(connection,
    `SELECT id, userId, artistName FROM artist_profiles WHERE userId=? LIMIT 1${suffix}`,
    [userId],
  );
  const profile = profiles[0];
  const memberships = await rows(connection,
    `SELECT id FROM artist_team_members WHERE userId=? AND teamRole <> 'owner' LIMIT 1${suffix}`,
    [userId],
  );
  if (!profile || Number(profile.userId) !== userId || memberships.length || /team member/i.test(String(profile.artistName ?? ''))) {
    throw forbidden();
  }
  if (!Number.isSafeInteger(Number(profile.id)) || Number(profile.id) <= 0) throw unavailable();
  return { id: Number(profile.id), artistName: profile.artistName == null ? null : String(profile.artistName) };
}

async function readOrder(connection: Pick<SqlConnection, 'execute'>, profileId: number, kind: ReleaseOrderKind, lock = false): Promise<{ ids: number[] | null; revision: number }> {
  const result = await rows(connection,
    `SELECT orderedIds, revision FROM profile_release_orders WHERE profileId=? AND kind=? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [profileId, kind],
  );
  if (!result.length) return { ids: null, revision: 0 };
  const row = result[0] as ReleaseOrderRow;
  const revision = Number(row.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) throw unavailable();
  return { ids: orderedIds(row.orderedIds), revision };
}

async function readEligible(connection: Pick<SqlConnection, 'execute'>, profileId: number, kind: ReleaseOrderKind, ownerUserId: number, lock = false): Promise<ReleaseItem[]> {
  const suffix = lock ? ' FOR UPDATE' : '';
  if (kind === 'music') {
    return rows(connection,
      `SELECT id, title, publishedAt FROM artist_releases
        WHERE artistId=? AND status='published'
        ORDER BY publishedAt DESC, id DESC${suffix}`,
      [profileId],
    ).then(items => items.map(item => ({ id: Number(item.id), title: String(item.title ?? ''), publishedAt: item.publishedAt })));
  }
  return rows(connection,
    `SELECT id, title, createdAt FROM releases
      WHERE artistProfileId=? AND userId=? AND isPublished=true AND releaseType='single'
      ORDER BY createdAt DESC, id DESC${suffix}`,
    [profileId, ownerUserId],
  ).then(items => items.map(item => ({ id: Number(item.id), title: String(item.title ?? ''), createdAt: item.createdAt })));
}

function releaseOrderState(kind: ReleaseOrderKind, revision: number, ids: number[] | null, baseline: ReleaseItem[]): ReleaseOrderState {
  const itemIds = ids === null ? baseline.map(item => item.id) : applyReleaseOrder(baseline, ids).map(item => item.id);
  const byId = new Map(baseline.map(item => [item.id, item]));
  return {
    kind,
    revision,
    custom: ids !== null,
    items: itemIds.flatMap(id => {
      const item = byId.get(id);
      return item ? [{ id: item.id, title: item.title }] : [];
    }),
  };
}

/** Protected state read. The profile scope is always derived from the authenticated user. */
export async function getReleaseOrderStateForUser(userId: number, kindInput: unknown): Promise<ReleaseOrderState> {
  const kind = checkedKind(kindInput);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw forbidden();
  try {
    await ensureReleaseOrderSchema();
    const pool = await poolOrThrow();
    const connection = await pool.getConnection();
    try {
      const profile = await verifyOwner(connection, userId, false);
      const [order, eligible] = await Promise.all([
        readOrder(connection, profile.id, kind),
        readEligible(connection, profile.id, kind, userId),
      ]);
      return releaseOrderState(kind, order.revision, order.ids, eligible);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

/**
 * Saves only the presentation table. The authenticated user's row is locked
 * first so concurrent writers share a deterministic serialization point.
 */
export async function saveReleaseOrderForUser(userId: number, input: SaveReleaseOrderInput): Promise<ReleaseOrderState> {
  const kind = checkedKind(input?.kind);
  const expectedRevision = checkedRevision(input?.expectedRevision);
  const ids = checkedIds(input?.ids);
  if (typeof input?.reset !== 'undefined' && typeof input.reset !== 'boolean') throw invalid();
  if (!Number.isSafeInteger(userId) || userId <= 0) throw forbidden();

  try {
    await ensureReleaseOrderSchema();
    const pool = await poolOrThrow();
    const connection = await pool.getConnection();
    let began = false;
    try {
      await connection.execute("SET time_zone = '+00:00'");
      await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      began = true;

      const users = await rows(connection, 'SELECT id FROM users WHERE id=? FOR UPDATE', [userId]);
      if (users.length !== 1) throw forbidden();
      const profile = await verifyOwner(connection, userId, true);
      const order = await readOrder(connection, profile.id, kind, true);
      if (order.revision !== expectedRevision) throw conflict();

      // Lock eligible source rows and require the caller's complete current set.
      // This rejects stale, foreign, draft, and wrong-type IDs without exposing titles.
      const eligible = await readEligible(connection, profile.id, kind, userId, true);
      if (eligible.length > RELEASE_ORDER_MAX_ITEMS || eligible.length !== ids.length) throw conflict();
      const actual = new Set(eligible.map(item => item.id));
      if (actual.size !== ids.length || ids.some(id => !actual.has(id))) throw conflict();

      const nextIds = input.reset ? null : ids;
      const nextRevision = order.revision + 1;
      const updatedAt = Date.now();
      await connection.execute(
        `INSERT INTO profile_release_orders (profileId, kind, orderedIds, revision, updatedAt)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE orderedIds=VALUES(orderedIds), revision=VALUES(revision), updatedAt=VALUES(updatedAt)`,
        [profile.id, kind, nextIds === null ? null : JSON.stringify(nextIds), nextRevision, updatedAt],
      );
      await connection.commit();
      return releaseOrderState(kind, nextRevision, nextIds, eligible);
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

async function customIdsForDisplay(profileId: number, kind: ReleaseOrderKind): Promise<number[] | null> {
  try {
    await ensureReleaseOrderSchema();
    const pool = await poolOrThrow();
    const result = await rows(pool, 'SELECT orderedIds FROM profile_release_orders WHERE profileId=? AND kind=? LIMIT 1', [profileId, kind]);
    return result.length ? orderedIds(result[0].orderedIds) : null;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw unavailable();
  }
}

/** Music dashboard/public presentation helper; drafts and other statuses retain their slots. */
export async function applyMusicReleaseOrder<T extends { id: number; status: string; publishedAt?: unknown }>(profileId: number, rowsToOrder: readonly T[]): Promise<T[]> {
  const eligible = rowsToOrder.filter(row => row.status === 'published');
  if (eligible.length < 2) return [...rowsToOrder];
  const ids = await customIdsForDisplay(profileId, 'music');
  if (ids === null) return [...rowsToOrder];
  const baseline = [...eligible].sort(newestFirst(row => row.publishedAt)).map(row => row.id);
  const publicBaseline = applyReleaseOrder(rowsToOrder, baseline, row => row.status === 'published');
  return applyReleaseOrder(publicBaseline, ids, row => row.status === 'published');
}

/** Hosted content presentation helper; only published single slots are replaced. */
export async function applyContentSinglesReleaseOrder<T extends { id: number; isPublished: boolean; releaseType: string; createdAt?: unknown }>(profileId: number, rowsToOrder: readonly T[]): Promise<T[]> {
  const isEligible = (row: T) => row.isPublished === true && row.releaseType === 'single';
  const eligible = rowsToOrder.filter(isEligible);
  if (eligible.length < 2) return [...rowsToOrder];
  const ids = await customIdsForDisplay(profileId, 'content_singles');
  if (ids === null) return [...rowsToOrder];
  const baseline = [...eligible].sort(newestFirst(row => row.createdAt)).map(row => row.id);
  const hostedBaseline = applyReleaseOrder(rowsToOrder, baseline, isEligible);
  return applyReleaseOrder(hostedBaseline, ids, isEligible);
}
