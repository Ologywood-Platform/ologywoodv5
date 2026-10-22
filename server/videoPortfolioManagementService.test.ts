import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getPool: vi.fn(),
  ensureSchema: vi.fn(),
}));

vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));
vi.mock('./services/videoPortfolioSchemaService', () => ({ ensureVideoPortfolioSchema: mocks.ensureSchema }));

import {
  editVideoPortfolioTitleForUser,
  getVideoPortfolioManagementContextForUser,
  getVideoPortfolioManagementStateForUser,
  saveVideoPortfolioOrderForUser,
} from './services/videoPortfolioManagementService';

type Video = {
  id: number;
  title: string;
  sortOrder: number;
  status: 'active' | 'processing' | 'removed';
  thumbnailUrl?: string | null;
  createdAt: Date;
  videoUrl: string;
  category: string;
  duration: number;
};

let videos: Video[];
let memberships: Array<{ id: number; artistProfileId: number; userId: number; teamRole: string }>;
let profile: { id: number; userId: number; artistName?: string } | null;
let usersExist: boolean;
let statements: Array<{ sql: string; values: unknown[] }>;
let connection: any;

const stateInput = () => ({
  ids: videos.filter(video => video.status !== 'removed')
    .sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)
    .map(video => video.id),
  expectedRevision: '',
});

function createConnection() {
  connection = {
    execute: vi.fn(async (sql: string, values: unknown[] = []) => {
      statements.push({ sql, values });
      if (sql.startsWith('SET TRANSACTION')) return [[], undefined];
      if (sql.startsWith('SELECT id FROM users')) return [usersExist ? [{ id: 7 }] : [], undefined];
      if (sql.includes('FROM artist_profiles')) return [profile ? [profile] : [], undefined];
      if (sql.includes('FROM artist_team_members')) return [[...memberships], undefined];
      if (sql.includes('FROM video_portfolio') && sql.includes('WHERE id=?')) {
        const found = videos.find(video => video.id === values[0] && video.status !== 'removed');
        return [found ? [{ ...found }] : [], undefined];
      }
      if (sql.includes('FROM video_portfolio')) {
        return [[...videos].filter(video => video.status !== 'removed').map(video => ({ ...video })) , undefined];
      }
      if (sql.startsWith('UPDATE video_portfolio') && sql.includes('SET title=?')) {
        const [title, id, artistProfileId, active, processing, expectedTitle] = values as [string, number, number, string, string, string];
        const found = videos.find(video => video.id === id && profile?.id === artistProfileId && (video.status === active || video.status === processing) && video.title === expectedTitle);
        if (!found) return [{ affectedRows: 0 }, undefined];
        found.title = title;
        return [{ affectedRows: 1 }, undefined];
      }
      if (sql.startsWith('UPDATE video_portfolio') && sql.includes('SET sortOrder=?')) {
        const [sortOrder, id, artistProfileId, active, processing] = values as [number, number, number, string, string];
        const found = videos.find(video => video.id === id && profile?.id === artistProfileId && (video.status === active || video.status === processing));
        if (!found) return [{ affectedRows: 0 }, undefined];
        found.sortOrder = sortOrder;
        return [{ affectedRows: 1 }, undefined];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    }),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };
  return connection;
}

beforeEach(() => {
  vi.clearAllMocks();
  videos = [
    { id: 11, title: 'Older top', sortOrder: 0, status: 'active', thumbnailUrl: 'https://cdn.test/11.jpg', createdAt: new Date('2030-01-01T00:00:00Z'), videoUrl: 'https://cdn.test/11.mp4', category: 'highlights', duration: 10 },
    { id: 12, title: 'Newer tie', sortOrder: 0, status: 'processing', createdAt: new Date('2030-02-01T00:00:00Z'), videoUrl: 'https://cdn.test/12.mp4', category: 'highlights', duration: 10 },
    { id: 13, title: 'Removed', sortOrder: 5, status: 'removed', createdAt: new Date('2030-03-01T00:00:00Z'), videoUrl: 'https://cdn.test/13.mp4', category: 'highlights', duration: 10 },
  ];
  memberships = [{ id: 1, artistProfileId: 70, userId: 7, teamRole: 'owner' }];
  profile = { id: 70, userId: 7 };
  usersExist = true;
  statements = [];
  const conn = createConnection();
  mocks.getPool.mockReturnValue({ getConnection: vi.fn(async () => conn), execute: conn.execute });
  mocks.getDb.mockResolvedValue({});
  mocks.ensureSchema.mockResolvedValue(undefined);
});

describe('video portfolio management ownership and state', () => {
  it('uses the physical teamRole column and only the existing narrow video schema guard', () => {
    const source = readFileSync(resolve(process.cwd(), 'server/services/videoPortfolioManagementService.ts'), 'utf8');
    const schema = readFileSync(resolve(process.cwd(), 'drizzle/schema.ts'), 'utf8');
    expect(source).toContain('teamRole');
    expect(schema).toContain('role: mysqlEnum("teamRole", ["owner", "manager", "team_member"])');
    expect(schema).toContain('export const videoPortfolio = mysqlTable("video_portfolio"');
    for (const column of ['artistProfileId', 'title', 'sortOrder', 'status', 'thumbnailUrl', 'createdAt']) {
      expect(schema).toContain(`${column}:`);
    }
    expect(source).toContain('ensureVideoPortfolioSchema(pool as any)');
    expect(source).not.toMatch(/CREATE TABLE|ALTER TABLE|DROP TABLE|INSERT INTO video_portfolio/i);
  });

  it('returns only a real creator owner context, including an administrator who owns the profile', async () => {
    await expect(getVideoPortfolioManagementContextForUser(7)).resolves.toEqual({ ownerAccountId: 7, artistProfileId: 70 });
    expect(statements.map(item => item.sql)).toEqual(expect.arrayContaining([
      expect.stringContaining('FROM users'),
      expect.stringContaining('FROM artist_profiles'),
      expect.stringContaining('FROM artist_team_members'),
    ]));
  });

  it('rejects generic admins, legacy standalone collaborators, and a stale nonowner membership before reading videos', async () => {
    profile = null;
    await expect(getVideoPortfolioManagementStateForUser(7)).rejects.toMatchObject({ code: 'FORBIDDEN' });

    profile = { id: 70, userId: 7 };
    memberships = [{ id: 2, artistProfileId: 70, userId: 7, teamRole: 'manager' }];
    statements = [];
    await expect(getVideoPortfolioManagementStateForUser(7)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(statements.some(item => item.sql.includes('FROM video_portfolio'))).toBe(false);
  });

  it('returns a fresh typed owner-scoped snapshot sorted by sortOrder, newest creation, then descending id', async () => {
    videos.push({ id: 14, title: 'Same creation', sortOrder: 0, status: 'active', createdAt: new Date('2030-02-01T00:00:00Z'), videoUrl: 'https://cdn.test/14.mp4', category: 'highlights', duration: 10 });
    const state = await getVideoPortfolioManagementStateForUser(7);
    expect(state.artistProfileId).toBe(70);
    expect(state.items.map(item => item.id)).toEqual([14, 12, 11]);
    expect(state.items).toEqual(expect.arrayContaining([{ id: 11, title: 'Older top', sortOrder: 0, status: 'active', thumbnailUrl: 'https://cdn.test/11.jpg' }]));
    expect(state.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(state.items.some(item => item.id === 13)).toBe(false);
  });
});

describe('video portfolio title CAS', () => {
  it('locks users, profile, physical teamRole membership, then its scoped video and writes only title', async () => {
    await expect(editVideoPortfolioTitleForUser(7, { id: 12, title: '  Confirmed title  ', expectedTitle: 'Newer tie' }))
      .resolves.toEqual({ id: 12, title: 'Confirmed title' });

    const lockQueries = statements.filter(item => item.sql.includes('FOR UPDATE')).map(item => item.sql);
    expect(lockQueries[0]).toContain('FROM users');
    expect(lockQueries[1]).toContain('FROM artist_profiles');
    expect(lockQueries[2]).toContain('teamRole');
    expect(lockQueries[3]).toContain('FROM video_portfolio');
    const update = statements.find(item => item.sql.startsWith('UPDATE video_portfolio'))!;
    expect(update.sql).toContain('SET title=?');
    expect(update.sql.split('WHERE')[0]).not.toMatch(/videoUrl|thumbnailUrl|category|duration|status|createdAt|sortOrder/i);
    expect(update.values).toEqual(['Confirmed title', 12, 70, 'active', 'processing', 'Newer tie']);
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
  });

  it('uses a generic conflict for stale title tokens and rolls back without unsafe writes', async () => {
    await expect(editVideoPortfolioTitleForUser(7, { id: 11, title: 'New', expectedTitle: 'Stale title' }))
      .rejects.toMatchObject({ code: 'CONFLICT', message: expect.not.stringContaining('Older top') });
    expect(statements.some(item => item.sql.startsWith('UPDATE video_portfolio'))).toBe(false);
    expect(connection.rollback).toHaveBeenCalledOnce();
  });

  it('does not permit edits to removed rows while allowing processing rows', async () => {
    await expect(editVideoPortfolioTitleForUser(7, { id: 13, title: 'Nope', expectedTitle: 'Removed' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(statements.some(item => item.sql.startsWith('UPDATE video_portfolio'))).toBe(false);

    await expect(editVideoPortfolioTitleForUser(7, { id: 12, title: 'Processing is editable', expectedTitle: 'Newer tie' }))
      .resolves.toEqual({ id: 12, title: 'Processing is editable' });
  });

  it.each([
    { id: 0, title: 'valid', expectedTitle: 'x' },
    { id: 11, title: '   ', expectedTitle: 'x' },
    { id: 11, title: 'x'.repeat(256), expectedTitle: 'x' },
    { id: 11, title: 'x', expectedTitle: 'x', category: 'injected' },
  ])('rejects malformed or injected title input before acquiring a connection: %j', async input => {
    await expect(editVideoPortfolioTitleForUser(7, input)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });
});

describe('video portfolio ordering CAS', () => {
  async function freshState() {
    return getVideoPortfolioManagementStateForUser(7);
  }

  it('requires the exact current nonremoved set, writes only sortOrder in deterministic id order, and confirms state', async () => {
    const state = await freshState();
    statements = [];
    const confirmed = await saveVideoPortfolioOrderForUser(7, { ids: [11, 12], expectedRevision: state.revision });
    expect(confirmed.items.map(item => item.id)).toEqual([11, 12]);
    const writes = statements.filter(item => item.sql.startsWith('UPDATE video_portfolio'));
    expect(writes.map(item => item.values[1])).toEqual([12]);
    expect(videos.find(video => video.id === 11)?.sortOrder).toBe(0);
    for (const write of writes) {
      expect(write.sql).toContain('SET sortOrder=?');
      expect(write.sql.split('WHERE')[0]).not.toMatch(/title|videoUrl|thumbnailUrl|category|duration|status|createdAt/i);
      expect(write.sql).toContain('artistProfileId=?');
    }
    expect(connection.commit).toHaveBeenCalledOnce();
  });

  it('rejects stale revision, duplicate, newly added, and removed IDs without any write and rolls back a started transaction', async () => {
    const state = await freshState();
    for (const input of [
      { ids: [11, 12], expectedRevision: '0'.repeat(64) },
      { ids: [11, 11], expectedRevision: state.revision },
      { ids: [11, 12, 99], expectedRevision: state.revision },
      { ids: [11, 13], expectedRevision: state.revision },
    ]) {
      statements = [];
      connection.rollback.mockClear();
      await expect(saveVideoPortfolioOrderForUser(7, input)).rejects.toMatchObject({ code: input.ids[1] === 11 ? 'BAD_REQUEST' : 'CONFLICT' });
      expect(statements.some(item => item.sql.startsWith('UPDATE video_portfolio'))).toBe(false);
      if (input.ids[1] !== 11) expect(connection.rollback).toHaveBeenCalledOnce();
    }
  });

  it('does not renumber or remove a newly committed video seen by the confirmed reread', async () => {
    const state = await freshState();
    let inserted = false;
    const original = connection.execute.getMockImplementation();
    connection.execute.mockImplementation(async (sql: string, values: unknown[] = []) => {
      if (!inserted && sql.includes('FROM video_portfolio') && !sql.includes('FOR UPDATE')) {
        inserted = true;
        videos.push({ id: 99, title: 'New clip', sortOrder: 88, status: 'active', createdAt: new Date('2030-05-01T00:00:00Z'), videoUrl: 'https://cdn.test/99.mp4', category: 'highlights', duration: 10 });
      }
      return original(sql, values);
    });

    const confirmed = await saveVideoPortfolioOrderForUser(7, { ids: [12, 11], expectedRevision: state.revision });
    expect(confirmed.items.map(item => item.id)).toEqual([12, 11, 99]);
    expect(videos.find(video => video.id === 99)?.sortOrder).toBe(88);
  });

  it('rolls back rather than partially saving when a locked current video is deleted before its scoped update', async () => {
    const state = await freshState();
    const original = connection.execute.getMockImplementation();
    connection.execute.mockImplementation(async (sql: string, values: unknown[] = []) => {
      if (sql.startsWith('UPDATE video_portfolio') && sql.includes('SET sortOrder=?') && values[1] === 12) {
        videos = videos.filter(video => video.id !== 12);
      }
      return original(sql, values);
    });

    await expect(saveVideoPortfolioOrderForUser(7, { ids: [11, 12], expectedRevision: state.revision }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
  });

  it.each([
    { ids: [11, 12], expectedRevision: 'not-a-hash' },
    { ids: [11, 12, 12], expectedRevision: 'a'.repeat(64) },
    { ids: [0], expectedRevision: 'a'.repeat(64) },
    { ids: Array.from({ length: 101 }, (_, index) => index + 1), expectedRevision: 'a'.repeat(64) },
    { ids: [11, 12], expectedRevision: 'a'.repeat(64), title: 'injected' },
  ])('rejects invalid or injected order input before a connection: %j', async input => {
    await expect(saveVideoPortfolioOrderForUser(7, input)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });
});


describe('legacy ownership and driver-independent metadata saves', () => {
  it('denies a legacy standalone team-member profile even without a membership row', async () => {
    profile = { id: 70, userId: 7, artistName: 'Helper - Team Member (TEST)' };
    memberships = [];
    await expect(getVideoPortfolioManagementContextForUser(7)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(statements.some(item => item.sql.includes('FROM video_portfolio'))).toBe(false);
  });
  it('confirms an unchanged title without writing or depending on affected-row mode', async () => {
    const saved = await editVideoPortfolioTitleForUser(7, { id: 11, title: 'Older top', expectedTitle: 'Older top' });
    expect(saved.title).toBe('Older top');
    expect(statements.some(item => item.sql.startsWith('UPDATE'))).toBe(false);
    expect(connection.commit).toHaveBeenCalledOnce();
  });
  it('confirms an unchanged normalized order without touching rows', async () => {
    videos.find(video => video.id === 12)!.sortOrder = 1;
    const state = await getVideoPortfolioManagementStateForUser(7);
    statements = [];
    await expect(saveVideoPortfolioOrderForUser(7, { ids: [11, 12], expectedRevision: state.revision })).resolves.toMatchObject({ revision: state.revision });
    expect(statements.some(item => item.sql.startsWith('UPDATE'))).toBe(false);
  });
});
