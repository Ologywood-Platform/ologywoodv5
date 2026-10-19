import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlDialect } from 'drizzle-orm/mysql-core';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  storageGet: vi.fn(),
  ensureSchema: vi.fn(),
}));

vi.mock('./db', () => ({ getDb: mocks.getDb }));
vi.mock('./storage', () => ({ storageGet: mocks.storageGet }));
vi.mock('./services/artistReleaseSchemaService', () => ({
  ensureArtistReleaseDisclosureSchema: mocks.ensureSchema,
}));

import {
  getPublicMusicReleaseOgImage,
  getPublicMusicSingle,
  PublicMusicReleaseUnavailableError,
} from './services/musicReleasePublicService';

const publicRow = {
  id: 42,
  artistId: 8,
  artistUserId: 12,
  artistName: 'The <Artist>',
  title: 'New & Dangerous',
  description: 'A public single.',
  genre: 'Soul',
  currency: 'usd',
  priceInCents: 299,
  allowPayWhatYouWant: true,
  coverArtKey: 'releases/covers/12/cover-123.webp',
  previewFileKey: 'releases/previews/12/preview.mp3',
  audioFileKey: 'releases/audio/12/full.mp3',
  durationSeconds: 211,
  fileFormat: 'MP3',
  publishedAt: new Date('2026-01-02T03:04:05.000Z'),
  totalSales: 9,
  aiUseDisclosureEnabled: true,
  aiUseLevel: 'ai_assisted',
  aiUseComponents: ['production_arrangement'],
  aiUseTools: 'Safe Tool',
  aiUseNotes: 'Creator supplied note',
};

function database(releaseRows: unknown[], membershipRows: unknown[] = []) {
  let selectCount = 0;
  const db: any = {
    select: vi.fn(() => {
      const result = selectCount++ === 0 ? releaseRows : membershipRows;
      const chain: any = {};
      chain.from = vi.fn(() => chain);
      chain.innerJoin = vi.fn(() => chain);
      chain.where = vi.fn(() => chain);
      chain.limit = vi.fn(async () => result);
      return chain;
    }),
  };
  return db;
}

describe('getPublicMusicSingle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureSchema.mockResolvedValue(undefined);
    mocks.storageGet.mockResolvedValue({
      key: publicRow.coverArtKey,
      url: 'https://d111111.cloudfront.net/project/releases/covers/12/cover-123.webp?temporary=true',
    });
  });

  it('returns only the explicit public DTO for an eligible published standalone creator', async () => {
    mocks.getDb.mockResolvedValue(database([publicRow]));

    const result = await getPublicMusicSingle(42);

    expect(result).toEqual({
      id: 42,
      artistId: 8,
      artistName: 'The <Artist>',
      artistUrl: '/artist/the-artist',
      title: 'New & Dangerous',
      description: 'A public single.',
      genre: 'Soul',
      currency: 'usd',
      priceInCents: 299,
      allowPayWhatYouWant: true,
      coverArtUrl: 'https://d111111.cloudfront.net/project/releases/covers/12/cover-123.webp?temporary=true',
      hasPreview: true,
      durationSeconds: 211,
      fileFormat: 'MP3',
      publishedAt: publicRow.publishedAt,
      totalSales: 9,
      aiUseDisclosureEnabled: true,
      aiUseLevel: 'ai_assisted',
      aiUseComponents: ['production_arrangement'],
      aiUseTools: 'Safe Tool',
      aiUseNotes: 'Creator supplied note',
    });
    expect(mocks.storageGet).toHaveBeenCalledWith('releases/covers/12/cover-123.webp');

    // Public lookup never exposes storage keys or playable media, even though
    // the source record contains them.
    expect(result).not.toHaveProperty('coverArtKey');
    expect(result).not.toHaveProperty('previewFileKey');
    expect(result).not.toHaveProperty('audioFileKey');
    expect(result).not.toHaveProperty('audioUrl');
    expect(result).not.toHaveProperty('previewUrl');
    expect(JSON.stringify(result)).not.toContain('releases/audio/');
  });

  it('includes actual admin-owned public creator profiles without overriding published-only or team restrictions', async () => {
    const db = database([publicRow]);
    mocks.getDb.mockResolvedValue(db);
    await expect(getPublicMusicSingle(42)).resolves.toMatchObject({ id: 42, artistId: 8 });
    const chain = db.select.mock.results[0].value;
    const query = new MySqlDialect().sqlToQuery(chain.where.mock.calls[0][0]);
    expect(query.params).toContain('published');
    expect(query.params).toContain('artist');
    expect(query.params).toContain('admin');
    expect(query.sql).toContain('`artist_releases`.`status`');
    expect(query.sql).toContain('`users`.`role`');
    mocks.getDb.mockResolvedValue(database([publicRow], [{ id: 4 }]));
    await expect(getPublicMusicSingle(42)).resolves.toBeNull();
  });

  it.each(['draft', 'archived', 'taken_down', 'missing'])('returns the same safe null result for %s releases', async () => {
    // The real query includes status = published, so each of these states is
    // represented by its database returning no matching public row.
    mocks.getDb.mockResolvedValue(database([]));

    await expect(getPublicMusicSingle(42)).resolves.toBeNull();
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('excludes team-member creator profiles and never grants an admin-style override', async () => {
    mocks.getDb.mockResolvedValue(database([publicRow], [{ id: 4 }]));

    await expect(getPublicMusicSingle(42)).resolves.toBeNull();
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('fails closed for unsafe IDs and never touches the database', async () => {
    await expect(getPublicMusicSingle(0)).resolves.toBeNull();
    await expect(getPublicMusicSingle(Number.MAX_SAFE_INTEGER + 1)).resolves.toBeNull();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('does not disguise source/storage outages as a not-found response', async () => {
    mocks.getDb.mockResolvedValue(database([publicRow]));
    mocks.storageGet.mockRejectedValue(new Error('storage diagnostics must not be public'));

    await expect(getPublicMusicSingle(42)).rejects.toBeInstanceOf(PublicMusicReleaseUnavailableError);
  });

  it('returns a trusted, current cover source identity only after public eligibility checks', async () => {
    mocks.getDb.mockResolvedValue(database([publicRow]));

    await expect(getPublicMusicReleaseOgImage(42)).resolves.toEqual({
      cacheIdentity: 'music-42-releases/covers/12/cover-123.webp',
      sourceUrl: 'https://d111111.cloudfront.net/project/releases/covers/12/cover-123.webp?temporary=true',
    });

    mocks.getDb.mockResolvedValue(database([]));
    await expect(getPublicMusicReleaseOgImage(42)).resolves.toBeNull();
  });
});
