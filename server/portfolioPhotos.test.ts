import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  getArtistRecentPhotos: vi.fn(),
}));

vi.mock('./db', () => ({
  getDb: mocks.getDb,
  getArtistRecentPhotos: mocks.getArtistRecentPhotos,
}));

import { eventsRouter } from './routers/events';
import { getPortfolioPhotos } from './services/portfolioPhotoService';

type PhotoRow = { id: number; photoUrl: string; caption: string | null };

function databaseFixture({
  rows = [],
  totalCount = rows.length,
  rejectWith,
}: {
  rows?: PhotoRow[];
  totalCount?: number;
  rejectWith?: Error;
} = {}) {
  const pageQuery = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
  pageQuery.from.mockReturnValue(pageQuery);
  pageQuery.innerJoin.mockReturnValue(pageQuery);
  pageQuery.where.mockReturnValue(pageQuery);
  pageQuery.orderBy.mockReturnValue(pageQuery);
  pageQuery.limit.mockImplementation(async () => {
    if (rejectWith) throw rejectWith;
    return rows;
  });

  const countQuery = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
  };
  countQuery.from.mockReturnValue(countQuery);
  countQuery.innerJoin.mockReturnValue(countQuery);
  countQuery.where.mockImplementation(async () => {
    if (rejectWith) throw rejectWith;
    return [{ totalCount }];
  });

  const select = vi.fn((selection: Record<string, unknown>) => (
    'totalCount' in selection ? countQuery : pageQuery
  ));
  mocks.getDb.mockResolvedValue({ select });

  return { select, pageQuery, countQuery };
}

function caller() {
  return eventsRouter.createCaller({ user: null, req: {}, res: {} } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('portfolio photo service', () => {
  it('uses a photo-ID keyset, returns limit + 1 pagination, and counts every matching event-history photo', async () => {
    const rows = Array.from({ length: 13 }, (_, index) => ({
      id: 40 - index,
      photoUrl: `https://images.example/${40 - index}.jpg`,
      caption: index === 1 ? null : `Photo ${40 - index}`,
    }));
    const { pageQuery, countQuery } = databaseFixture({ rows, totalCount: 25 });

    const result = await getPortfolioPhotos({ artistId: 7, limit: 12 });

    expect(result).toEqual({
      photos: rows.slice(0, 12),
      nextCursor: 29,
      totalCount: 25,
    });
    expect(pageQuery.limit).toHaveBeenCalledWith(13);
    expect(pageQuery.orderBy).toHaveBeenCalledOnce();
    expect(pageQuery.where).toHaveBeenCalledOnce();
    expect(countQuery.where).toHaveBeenCalledOnce();
  });

  it('uses the cursor only for the page query while preserving the total count for the full matching set', async () => {
    const rows = [
      { id: 18, photoUrl: 'https://images.example/18.jpg', caption: 'Across another event' },
      { id: 17, photoUrl: 'https://images.example/17.jpg', caption: null },
    ];
    const { pageQuery, countQuery } = databaseFixture({ rows, totalCount: 14 });

    await expect(getPortfolioPhotos({ artistId: 7, cursor: 19, limit: 12 })).resolves.toEqual({
      photos: rows,
      nextCursor: null,
      totalCount: 14,
    });
    expect(pageQuery.where.mock.calls[0]?.[0]).not.toBe(countQuery.where.mock.calls[0]?.[0]);
  });

  it('returns the same empty response for an artist with no matching profile/history/photos', async () => {
    databaseFixture({ rows: [], totalCount: 0 });

    await expect(getPortfolioPhotos({ artistId: 404, limit: 12 })).resolves.toEqual({
      photos: [],
      nextCursor: null,
      totalCount: 0,
    });
  });

  it('fails rather than presenting an outage as an empty portfolio', async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(getPortfolioPhotos({ artistId: 7, limit: 12 })).rejects.toThrow('Database unavailable');

    databaseFixture({ rejectWith: new Error('read outage') });
    await expect(getPortfolioPhotos({ artistId: 7, limit: 12 })).rejects.toThrow('read outage');
  });
});

describe('events.getPortfolioPhotos', () => {
  it('is public, defaults to 12, caps input at 24, and returns the documented page shape', async () => {
    const row = { id: 31, photoUrl: 'https://images.example/31.jpg', caption: 'Newest' };
    const first = databaseFixture({ rows: [row], totalCount: 31 });

    await expect(caller().getPortfolioPhotos({ artistId: 7 })).resolves.toEqual({
      photos: [row],
      nextCursor: null,
      totalCount: 31,
    });
    expect(first.pageQuery.limit).toHaveBeenCalledWith(13);

    const second = databaseFixture({ rows: [], totalCount: 31 });
    await caller().getPortfolioPhotos({ artistId: 7, cursor: 31, limit: 24 });
    expect(second.pageQuery.limit).toHaveBeenCalledWith(25);
  });

  it('accepts the actual tRPC infinite-query forward input on first and subsequent pages', async () => {
    const row = { id: 31, photoUrl: 'https://images.example/31.jpg', caption: 'Newest' };
    databaseFixture({ rows: [row], totalCount: 2 });
    await expect(caller().getPortfolioPhotos({ artistId: 7, limit: 12, direction: 'forward' })).resolves.toMatchObject({ photos: [row], totalCount: 2 });
    databaseFixture({ rows: [], totalCount: 2 });
    await expect(caller().getPortfolioPhotos({ artistId: 7, limit: 12, cursor: 31, direction: 'forward' })).resolves.toMatchObject({ photos: [], totalCount: 2 });
  });

  it.each([
    { artistId: 0 },
    { artistId: -1 },
    { artistId: 1, cursor: 0 },
    { artistId: 1, limit: 0 },
    { artistId: 1, limit: 25 },
    { artistId: 1, direction: 'backward' },
    { artistId: 1, privateOwnerId: 9 },
  ])('rejects invalid bounded input %j before querying', async (input) => {
    await expect(caller().getPortfolioPhotos(input as never)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('maps database outages to a safe public error instead of an empty success', async () => {
    mocks.getDb.mockResolvedValue(null);

    await expect(caller().getPortfolioPhotos({ artistId: 7 })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Portfolio photos are temporarily unavailable. Please try again.',
    });
  });

  it('keeps getRecentPhotos backwards compatible while bounding unsafe positive limits', async () => {
    mocks.getArtistRecentPhotos.mockResolvedValue([]);

    await caller().getRecentPhotos({ artistId: 7, limit: 4 });
    expect(mocks.getArtistRecentPhotos).toHaveBeenLastCalledWith(7, 4);

    await caller().getRecentPhotos({ artistId: 7, limit: 999 });
    expect(mocks.getArtistRecentPhotos).toHaveBeenLastCalledWith(7, 24);

    await caller().getRecentPhotos({ artistId: 7, limit: 0 });
    expect(mocks.getArtistRecentPhotos).toHaveBeenLastCalledWith(7, 3);
  });
});
