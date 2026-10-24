import { and, count, desc, eq, lt } from 'drizzle-orm';
import { artistProfiles, eventHistory, eventPhotos } from '../../drizzle/schema';
import { getDb } from '../db';

export const PORTFOLIO_PHOTO_DEFAULT_LIMIT = 12;
export const PORTFOLIO_PHOTO_MAX_LIMIT = 24;

export type PortfolioPhoto = {
  id: number;
  photoUrl: string;
  caption: string | null;
};

export type PortfolioPhotoPage = {
  photos: PortfolioPhoto[];
  nextCursor: number | null;
  totalCount: number;
};

export type PortfolioPhotoPageInput = {
  artistId: number;
  cursor?: number;
  limit: number;
};

/**
 * Returns public portfolio photos from every event-history entry belonging to a
 * publicly resolvable artist profile. Photo ID is the ordering and cursor key,
 * so equal upload timestamps cannot produce duplicates or skipped rows.
 */
export async function getPortfolioPhotos({
  artistId,
  cursor,
  limit,
}: PortfolioPhotoPageInput): Promise<PortfolioPhotoPage> {
  const database = await getDb();
  if (!database) {
    throw new Error('Database unavailable');
  }

  // This matches the current public artist.getProfile boundary: the artist
  // profile must exist. The current public profile lookup does not impose a
  // separate role or team-membership visibility predicate.
  const matchingArtistPhotos = and(
    eq(eventHistory.artistId, artistId),
    eq(artistProfiles.id, artistId),
  );
  const pageCondition = cursor
    ? and(matchingArtistPhotos, lt(eventPhotos.id, cursor))
    : matchingArtistPhotos;

  const [rows, total] = await Promise.all([
    database
      .select({
        id: eventPhotos.id,
        photoUrl: eventPhotos.photoUrl,
        caption: eventPhotos.caption,
      })
      .from(eventPhotos)
      .innerJoin(eventHistory, eq(eventPhotos.eventHistoryId, eventHistory.id))
      .innerJoin(artistProfiles, eq(artistProfiles.id, eventHistory.artistId))
      .where(pageCondition)
      .orderBy(desc(eventPhotos.id))
      .limit(limit + 1),
    database
      .select({ totalCount: count() })
      .from(eventPhotos)
      .innerJoin(eventHistory, eq(eventPhotos.eventHistoryId, eventHistory.id))
      .innerJoin(artistProfiles, eq(artistProfiles.id, eventHistory.artistId))
      .where(matchingArtistPhotos),
  ]);

  const hasNextPage = rows.length > limit;
  const photos = rows.slice(0, limit);

  return {
    photos,
    nextCursor: hasNextPage ? photos.at(-1)?.id ?? null : null,
    totalCount: Number(total[0]?.totalCount ?? 0),
  };
}
