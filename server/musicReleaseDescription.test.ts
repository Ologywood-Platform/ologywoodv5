import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));
vi.mock('./storage', () => ({ storageGet: vi.fn() }));
vi.mock('./email', () => ({ sendEmail: vi.fn() }));
vi.mock('./services/pricingTierService', () => ({
  hasFeatureAccess: vi.fn(), canCreateRelease: vi.fn(), getUserSubscription: vi.fn(), PRICING_TIERS: {},
}));
vi.mock('./services/artistUpdateService', () => ({ sendArtistUpdate: vi.fn() }));
vi.mock('stripe', () => ({ default: class Stripe {} }));

import {
  getMusicReleaseDescriptionForEditForUser,
  updateMusicReleaseDescriptionForUser,
} from './services/musicReleaseDescriptionService';
import { releaseRouter } from './routers/release';

type ReleaseState = { id: number; artistId: number; description: string | null; status: string } | null;
type FixtureOptions = {
  users?: number[];
  profile?: { id: number; userId: number; artistName: string } | null;
  memberships?: Array<{ id: number }>;
  release?: ReleaseState;
  failOn?: string;
  updateMiss?: boolean;
};

function fixture(options: FixtureOptions = {}) {
  const state: Required<FixtureOptions> = {
    users: [1],
    profile: { id: 7, userId: 1, artistName: 'Actual Owner' },
    memberships: [],
    release: { id: 42, artistId: 7, description: 'Original description', status: 'published' },
    failOn: '',
    updateMiss: false,
    ...options,
  };
  const calls: Array<[string, unknown[]]> = [];
  const execute = vi.fn(async (rawSql: string, values: unknown[] = []) => {
    const sql = rawSql.replace(/\s+/g, ' ').trim();
    calls.push([sql, values]);
    if (state.failOn && sql.includes(state.failOn)) throw new Error('private database outage details');
    if (sql.startsWith('SET ')) return [[], []];
    if (sql.startsWith('SELECT id FROM users')) return [state.users.map(id => ({ id })), []];
    if (sql.includes('FROM artist_profiles')) return [state.profile ? [state.profile] : [], []];
    if (sql.includes('FROM artist_team_members')) {
      if (!sql.includes("teamRole <> 'owner'")) throw Object.assign(new Error('Unknown column role'), { code: 'ER_BAD_FIELD_ERROR' });
      return [state.memberships, []];
    }
    if (sql.startsWith('SELECT id, artistId, description, status FROM artist_releases')) {
      const [releaseId, artistId] = values.map(Number);
      const release = state.release;
      return [release && release.id === releaseId && release.artistId === artistId ? [{ ...release }] : [], []];
    }
    if (sql.startsWith('UPDATE artist_releases SET description=?')) {
      const [nextDescription, releaseId, artistId, expectedDescription] = values as [string | null, number, number, string | null];
      const release = state.release;
      if (state.updateMiss || !release || release.id !== releaseId || release.artistId !== artistId || release.description !== expectedDescription) {
        return [{ affectedRows: 0 }, []];
      }
      release.description = nextDescription;
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
  mocks.getDb.mockResolvedValue({});
  mocks.getPool.mockReturnValue({ getConnection: vi.fn(async () => connection) });
  return { state, calls, connection, execute };
}

function caller(user: any = { id: 1, role: 'artist' }) {
  return releaseRouter.createCaller({ user, req: {}, res: {} } as any);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('music release description service', () => {
  it('returns a fresh minimal owner-scoped DTO using physical teamRole and artist_releases columns', async () => {
    const { calls, connection } = fixture();
    await expect(getMusicReleaseDescriptionForEditForUser(1, 42)).resolves.toEqual({
      id: 42, description: 'Original description', status: 'published',
    });

    const ownership = calls.find(([sql]) => sql.includes('FROM artist_team_members'));
    const releaseRead = calls.find(([sql]) => sql.includes('FROM artist_releases'));
    expect(ownership?.[0]).toContain("teamRole <> 'owner'");
    expect(releaseRead).toEqual([
      'SELECT id, artistId, description, status FROM artist_releases WHERE id=? AND artistId=? LIMIT 1',
      [42, 7],
    ]);
    expect(releaseRead?.[0]).not.toContain('audioFileKey');
    expect(connection.beginTransaction).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('serializes a description-only CAS write with the user, profile, membership, and release locks', async () => {
    const { state, calls, connection } = fixture();
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: 'Updated description', expectedDescription: 'Original description',
    })).resolves.toEqual({ id: 42, description: 'Updated description', status: 'published' });

    expect(state.release?.description).toBe('Updated description');
    expect(connection.beginTransaction).toHaveBeenCalledOnce();
    expect(calls[0]).toEqual(['SET TRANSACTION ISOLATION LEVEL READ COMMITTED', []]);
    expect(calls.find(([sql]) => sql === 'SELECT id FROM users WHERE id=? FOR UPDATE')).toEqual([
      'SELECT id FROM users WHERE id=? FOR UPDATE', [1],
    ]);
    expect(calls.filter(([sql]) => sql.includes('FROM artist_profiles')).at(-1)?.[0]).toContain('FOR UPDATE');
    expect(calls.filter(([sql]) => sql.includes('FROM artist_team_members')).at(-1)?.[0]).toContain('FOR UPDATE');
    expect(calls.filter(([sql]) => sql.includes('FROM artist_releases')).at(-1)?.[0]).toContain('FOR UPDATE');
    const update = calls.find(([sql]) => sql.startsWith('UPDATE artist_releases'));
    expect(update).toEqual([
      'UPDATE artist_releases SET description=? WHERE id=? AND artistId=? AND description <=> ?',
      ['Updated description', 42, 7, 'Original description'],
    ]);
    expect(update?.[0]).not.toMatch(/title|audio|preview|cover|price|sales|status|published|fee/i);
    expect(connection.commit).toHaveBeenCalledOnce();
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('keeps whitespace but turns an intentionally blank editor value into NULL', async () => {
    const whitespace = fixture({ release: { id: 42, artistId: 7, description: null, status: 'draft' } });
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: '  artist supplied spacing  ', expectedDescription: null,
    })).resolves.toMatchObject({ description: '  artist supplied spacing  ', status: 'draft' });
    expect(whitespace.state.release?.description).toBe('  artist supplied spacing  ');

    const clear = fixture({ release: { id: 42, artistId: 7, description: 'Remove me', status: 'archived' } });
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: '', expectedDescription: 'Remove me',
    })).resolves.toEqual({ id: 42, description: null, status: 'archived' });
    expect(clear.calls.find(([sql]) => sql.startsWith('UPDATE artist_releases'))?.[1]).toEqual([null, 42, 7, 'Remove me']);
  });

  it('rolls back and reports a generic conflict when the editor baseline is stale', async () => {
    const { calls, connection } = fixture({ release: { id: 42, artistId: 7, description: 'Current database value', status: 'published' } });
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: 'New text', expectedDescription: 'Stale page value',
    })).rejects.toMatchObject({ code: 'CONFLICT', message: 'Release description changed. Refresh and try again.' });
    expect(calls.some(([sql]) => sql.startsWith('UPDATE artist_releases'))).toBe(false);
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it.each([
    ['foreign', { release: { id: 42, artistId: 99, description: 'Hidden', status: 'published' } }],
    ['taken down', { release: { id: 42, artistId: 7, description: 'Hidden', status: 'taken_down' } }],
  ] as const)('makes %s releases generically not found and rolls write attempts back', async (_name, options) => {
    const { connection } = fixture(options);
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: 'New text', expectedDescription: 'Hidden',
    })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Release not found' });
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('fails closed, rolls back, and releases its connection on source outages', async () => {
    const { connection } = fixture({ failOn: 'FROM artist_releases' });
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: 'New text', expectedDescription: 'Original description',
    })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Release description is temporarily unavailable. Please try again.',
    });
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('rejects profile/account mismatches and non-owner collaborators without an admin bypass', async () => {
    const profileMismatch = fixture({ profile: { id: 7, userId: 99, artistName: 'Different account' } });
    await expect(updateMusicReleaseDescriptionForUser(1, {
      id: 42, description: 'New text', expectedDescription: 'Original description',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(profileMismatch.connection.rollback).toHaveBeenCalledOnce();

    const collaborator = fixture({ memberships: [{ id: 8 }] });
    await expect(getMusicReleaseDescriptionForEditForUser(1, 42)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(collaborator.connection.release).toHaveBeenCalledOnce();

    const legacyTeamMember = fixture({ profile: { id: 7, userId: 1, artistName: 'Legacy Team Member Artist' } });
    await expect(getMusicReleaseDescriptionForEditForUser(1, 42)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(legacyTeamMember.connection.release).toHaveBeenCalledOnce();

    const adminWithoutOwnedProfile = fixture({ profile: null });
    await expect(caller({ id: 1, role: 'admin' }).getDescriptionForEdit({ id: 42 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(adminWithoutOwnedProfile.connection.release).toHaveBeenCalledOnce();

    fixture();
    await expect(caller({ id: 1, role: 'admin' }).getDescriptionForEdit({ id: 42 })).resolves.toMatchObject({ id: 42 });
  });
});

describe('release description router contract', () => {
  it('requires sign-in before reaching the service', async () => {
    fixture();
    await expect(caller(null).getDescriptionForEdit({ id: 42 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller(null).updateDescription({ id: 42, description: 'Text', expectedDescription: null })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });

  it('rejects immutable/media/financial fields, unsafe IDs, and overlong values before the database', async () => {
    fixture();
    await expect(caller().updateDescription({
      id: 42, description: 'Text', expectedDescription: null, title: 'Forbidden title', priceInCents: 1, audioFileKey: 'media/key',
    } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().getDescriptionForEdit({ id: Number.MAX_SAFE_INTEGER + 1 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().updateDescription({
      id: 42, description: 'x'.repeat(2001), expectedDescription: null,
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().updateDescription({
      id: 42, description: 'Text', expectedDescription: 'x'.repeat(2001),
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getPool).not.toHaveBeenCalled();
  });
});
