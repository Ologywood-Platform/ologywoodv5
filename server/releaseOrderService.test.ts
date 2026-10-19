import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));

import {
  applyContentSinglesReleaseOrder,
  applyMusicReleaseOrder,
  getReleaseOrderStateForUser,
  saveReleaseOrderForUser,
} from './services/releaseOrderService';
import { resetReleaseOrderSchemaForTests } from './services/releaseOrderSchemaService';

type FixtureState = {
  profile?: { id: number; userId: number; artistName: string };
  users?: number[];
  memberships?: Array<{ id: number }>;
  order?: { orderedIds: number[] | null; revision: number } | null;
  music?: Array<{ id: number; title: string; publishedAt: string }>;
  content?: Array<{ id: number; title: string; createdAt: string }>;
  failOn?: string;
};

function fixture(options: FixtureState = {}) {
  const state: Required<FixtureState> = {
    profile: { id: 7, userId: 1, artistName: 'Actual Owner' },
    users: [1], memberships: [], order: null,
    music: [
      { id: 3, title: 'Newest', publishedAt: '2026-01-03T00:00:00.000Z' },
      { id: 2, title: 'Middle', publishedAt: '2026-01-02T00:00:00.000Z' },
      { id: 1, title: 'First', publishedAt: '2026-01-01T00:00:00.000Z' },
    ],
    content: [
      { id: 13, title: 'Newest hosted', createdAt: '2026-01-03T00:00:00.000Z' },
      { id: 12, title: 'Middle hosted', createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 11, title: 'First hosted', createdAt: '2026-01-01T00:00:00.000Z' },
    ],
    failOn: '', ...options,
  };
  const calls: Array<[string, unknown[]]> = [];
  const execute = vi.fn(async (rawSql: string, values: unknown[] = []) => {
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    calls.push([sql, values]);
    if (state.failOn && sql.includes(state.failOn)) throw new Error('private database outage details');
    if (sql.includes('information_schema.statistics')) {
      return [[
        { index_name: 'uniq_profile_release_order_scope', column_name: 'profileId', non_unique: 0, seq_in_index: 1 },
        { index_name: 'uniq_profile_release_order_scope', column_name: 'kind', non_unique: 0, seq_in_index: 2 },
      ], []];
    }
    if (sql.includes('information_schema.columns')) {
      return [[{ column_name: 'id' }, { column_name: 'profileId' }, { column_name: 'kind' }, { column_name: 'orderedIds' }, { column_name: 'revision' }, { column_name: 'updatedAt' }], []];
    }
    if (sql.startsWith('SET ')) return [[], []];
    if (sql.startsWith('SELECT id FROM users')) return [state.users.map(id => ({ id })), []];
    if (sql.includes('FROM artist_profiles')) return [state.profile ? [state.profile] : [], []];
    if (sql.includes('FROM artist_team_members')) return [state.memberships, []];
    if (sql.includes('FROM profile_release_orders')) return [state.order ? [{ orderedIds: state.order.orderedIds, revision: state.order.revision }] : [], []];
    if (sql.includes('FROM artist_releases')) return [state.music, []];
    if (sql.includes('FROM releases')) return [state.content, []];
    if (sql.startsWith('INSERT INTO profile_release_orders')) {
      state.order = { orderedIds: values[2] == null ? null : JSON.parse(String(values[2])), revision: Number(values[3]) };
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  });
  const connection = {
    execute,
    beginTransaction: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
    release: vi.fn(),
  };
  const pool = { execute, getConnection: vi.fn(async () => connection) };
  mocks.getDb.mockResolvedValue({});
  mocks.getPool.mockReturnValue(pool);
  return { state, calls, execute, connection, pool };
}

beforeEach(() => {
  vi.resetAllMocks();
  resetReleaseOrderSchemaForTests();
});

describe('release order service', () => {
  it('returns newest-first state by default and custom ranks with new entries appended', async () => {
    fixture({ order: { orderedIds: [1, 2], revision: 4 } });
    await expect(getReleaseOrderStateForUser(1, 'music')).resolves.toEqual({
      kind: 'music', revision: 4, custom: true,
      items: [{ id: 1, title: 'First' }, { id: 2, title: 'Middle' }, { id: 3, title: 'Newest' }],
    });

    resetReleaseOrderSchemaForTests();
    fixture();
    await expect(getReleaseOrderStateForUser(1, 'content_singles')).resolves.toEqual({
      kind: 'content_singles', revision: 0, custom: false,
      items: [{ id: 13, title: 'Newest hosted' }, { id: 12, title: 'Middle hosted' }, { id: 11, title: 'First hosted' }],
    });
  });

  it('reset persists null rather than deletion, increments revision, and returns the ordinary baseline', async () => {
    const { state, connection, calls } = fixture({ order: { orderedIds: [1, 2, 3], revision: 9 } });
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 9, ids: [3, 2, 1], reset: true })).resolves.toMatchObject({
      kind: 'music', revision: 10, custom: false, items: [{ id: 3 }, { id: 2 }, { id: 1 }],
    });
    expect(state.order).toEqual({ orderedIds: null, revision: 10 });
    expect(calls.some(([sql]) => sql.startsWith('DELETE FROM profile_release_orders'))).toBe(false);
    expect(connection.commit).toHaveBeenCalledOnce();
  });

  it('rejects a stale revision before an order table write and rolls back atomically', async () => {
    const { calls, connection } = fixture({ order: { orderedIds: [1, 2, 3], revision: 2 } });
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 1, ids: [1, 2, 3] }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(calls.some(([sql]) => sql.startsWith('INSERT INTO profile_release_orders'))).toBe(false);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });

  it('rejects duplicate ids as bad input and rejects foreign or nonpublished/current-set mismatches generically', async () => {
    const duplicate = fixture();
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [1, 1, 3] }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(duplicate.connection.beginTransaction).not.toHaveBeenCalled();

    resetReleaseOrderSchemaForTests();
    const foreign = fixture();
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [1, 2, 999] }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(foreign.calls.some(([sql]) => sql.startsWith('INSERT INTO profile_release_orders'))).toBe(false);

    resetReleaseOrderSchemaForTests();
    const omitted = fixture();
    await expect(saveReleaseOrderForUser(1, { kind: 'content_singles', expectedRevision: 0, ids: [11, 12] }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(omitted.calls.some(([sql]) => sql.startsWith('INSERT INTO profile_release_orders'))).toBe(false);
  });

  it('denies team members and legacy team-member profiles even when their account role is otherwise irrelevant', async () => {
    const manager = fixture({ memberships: [{ id: 8 }] });
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [3, 2, 1] }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(manager.connection.rollback).toHaveBeenCalledOnce();

    resetReleaseOrderSchemaForTests();
    fixture({ profile: { id: 7, userId: 1, artistName: 'Legacy Team Member Artist' } });
    await expect(getReleaseOrderStateForUser(1, 'music')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('serializes on the authenticated users row, rechecks ownership on that connection, and writes no release or purchase data', async () => {
    const { calls, connection } = fixture();
    await saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [1, 2, 3] });
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    const userLock = calls.find(([sql]) => sql === 'SELECT id FROM users WHERE id=? FOR UPDATE');
    expect(userLock).toEqual(['SELECT id FROM users WHERE id=? FOR UPDATE', [1]]);
    expect(calls.filter(([sql]) => sql.includes('FROM artist_profiles')).at(-1)?.[0]).toContain('FOR UPDATE');
    expect(calls.filter(([sql]) => sql.includes('FROM artist_team_members')).at(-1)?.[0]).toContain('FOR UPDATE');
    expect(calls.filter(([sql]) => sql.includes('FROM artist_releases')).at(-1)?.[0]).toContain('FOR UPDATE');
    expect(calls.some(([sql]) => /(?:UPDATE|INSERT INTO|DELETE FROM) (?:artist_releases|releases|release_purchases|content_release_purchases)/.test(sql))).toBe(false);
  });

  it('binds hosted state and locked saves to both profile and authenticated creator account', async () => {
    const read = fixture();
    await getReleaseOrderStateForUser(1, 'content_singles');
    const source = read.calls.find(([sql]) => sql.includes('FROM releases'));
    expect(source?.[0]).toContain("artistProfileId=? AND userId=? AND isPublished=true AND releaseType='single'");
    expect(source?.[1]).toEqual([7, 1]);
    resetReleaseOrderSchemaForTests();
    const save = fixture();
    await saveReleaseOrderForUser(1, { kind: 'content_singles', expectedRevision: 0, ids: [11, 13, 12] });
    expect(save.calls.find(([sql]) => sql.includes('FROM releases'))?.[0]).toContain('FOR UPDATE');
    expect(save.calls.find(([sql]) => sql.includes('FROM releases'))?.[1]).toEqual([7, 1]);
  });

  it('denies a mismatched profile-owner tuple before any presentation write', async () => {
    const mismatch = fixture({ profile: { id: 7, userId: 99, artistName: 'Different creator' } });
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [1, 2, 3] })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mismatch.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(false);
  });

  it('refuses corrupt saved metadata instead of silently switching to newest-first', async () => {
    fixture({ order: { orderedIds: [1, 1], revision: 1 } });
    await expect(getReleaseOrderStateForUser(1, 'music')).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });

  it('appends unranked music consistently by publication date regardless of dashboard creation order', async () => {
    fixture({ order: { orderedIds: [1], revision: 1 } });
    const dashboard = [{ id: 2, status: 'published', publishedAt: '2026-01-02' }, { id: 3, status: 'published', publishedAt: '2026-01-03' }, { id: 1, status: 'published', publishedAt: '2026-01-01' }];
    await expect(applyMusicReleaseOrder(7, dashboard).then(rows => rows.map(row => row.id))).resolves.toEqual([1, 3, 2]);
  });

  it('returns a safe availability error and rolls back rather than silently discarding a custom order on a source outage', async () => {
    const { connection } = fixture({ order: { orderedIds: [1, 2, 3], revision: 0 }, failOn: 'FROM artist_releases' });
    await expect(saveReleaseOrderForUser(1, { kind: 'music', expectedRevision: 0, ids: [1, 2, 3] }))
      .rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'Release ordering is temporarily unavailable. Please try again.' });
    expect(connection.rollback).toHaveBeenCalledOnce();
  });

  it('reorders only eligible presentation slots and preserves default lists without an order read', async () => {
    const music = [
      { id: 9, status: 'draft', publishedAt: '2026-05-01' },
      { id: 3, status: 'published', publishedAt: '2026-01-03' },
      { id: 8, status: 'archived', publishedAt: '2026-05-02' },
      { id: 2, status: 'published', publishedAt: '2026-01-02' },
      { id: 1, status: 'published', publishedAt: '2026-01-01' },
    ];
    const first = fixture({ order: { orderedIds: [1, 2, 3], revision: 1 } });
    await expect(applyMusicReleaseOrder(7, music).then(rows => rows.map(row => row.id))).resolves.toEqual([9, 1, 8, 2, 3]);
    expect(first.calls.some(([sql]) => sql.includes('FROM profile_release_orders'))).toBe(true);

    resetReleaseOrderSchemaForTests();
    const defaultOrder = fixture();
    await expect(applyMusicReleaseOrder(7, music.slice(0, 2)).then(rows => rows.map(row => row.id))).resolves.toEqual([9, 3]);
    expect(defaultOrder.calls.some(([sql]) => sql.includes('profile_release_orders'))).toBe(false);

    resetReleaseOrderSchemaForTests();
    fixture({ order: { orderedIds: [11, 12, 13], revision: 1 } });
    const hosted = [
      { id: 90, isPublished: true, releaseType: 'movie', createdAt: '2026-04-01' },
      { id: 13, isPublished: true, releaseType: 'single', createdAt: '2026-01-03' },
      { id: 91, isPublished: true, releaseType: 'album', createdAt: '2026-03-01' },
      { id: 12, isPublished: true, releaseType: 'single', createdAt: '2026-01-02' },
      { id: 11, isPublished: true, releaseType: 'single', createdAt: '2026-01-01' },
    ];
    await expect(applyContentSinglesReleaseOrder(7, hosted).then(rows => rows.map(row => row.id))).resolves.toEqual([90, 11, 91, 12, 13]);
  });
});
