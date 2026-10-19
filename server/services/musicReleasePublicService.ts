import { and, eq, ne, or } from 'drizzle-orm';
import { artistProfiles, artistReleases, artistTeamMembers, users } from '../../drizzle/schema';
import { getDb } from '../db';
import { storageGet } from '../storage';
import { ensureArtistReleaseDisclosureSchema } from './artistReleaseSchemaService';
import { isTrustedMusicCoverSource } from './musicCoverSource';

/**
 * Deliberately small, unauthenticated representation for a published music
 * single. Do not add storage keys, playable media URLs, owner identities, or
 * other dashboard fields here: this is used by both the public endpoint and
 * crawler routes.
 */
export type PublicMusicReleaseSingle = {
  id: number;
  artistId: number;
  artistName: string;
  artistUrl: string;
  title: string;
  description: string | null;
  genre: string | null;
  currency: string;
  priceInCents: number;
  allowPayWhatYouWant: boolean;
  coverArtUrl: string | null;
  hasPreview: boolean;
  durationSeconds: number;
  fileFormat: string;
  publishedAt: Date | null;
  totalSales: number;
  // These names intentionally match artist_releases' actual disclosure schema.
  // A disabled disclosure is omitted rather than making a claim about AI use.
  aiUseDisclosureEnabled?: true;
  aiUseLevel?: string | null;
  aiUseComponents?: string[];
  aiUseTools?: string | null;
  aiUseNotes?: string | null;
};

type PublicMusicReleaseRow = {
  id: number;
  artistId: number;
  artistUserId: number;
  artistName: string;
  title: string;
  description: string | null;
  genre: string | null;
  currency: string;
  priceInCents: number;
  allowPayWhatYouWant: boolean;
  coverArtKey: string | null;
  previewFileKey: string | null;
  audioFileKey: string | null;
  durationSeconds: number;
  fileFormat: string;
  publishedAt: Date | null;
  totalSales: number;
  aiUseDisclosureEnabled: boolean;
  aiUseLevel: string | null;
  aiUseComponents: string[] | null;
  aiUseTools: string | null;
  aiUseNotes: string | null;
};

/** A source failure is intentionally distinguishable from a public 404. */
export class PublicMusicReleaseUnavailableError extends Error {
  constructor() {
    super('Public music release service unavailable');
    this.name = 'PublicMusicReleaseUnavailableError';
  }
}

function isPositiveSafeId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function artistPath(name: string): string {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `/artist/${slug || 'artist'}`;
}

/**
 * Release upload routes issue this namespace. Keeping this strict means a
 * malformed database value can never turn the image proxy into an arbitrary
 * URL fetch or a path traversal through the storage service.
 */
function isTrustedMusicCoverKey(value: string): boolean {
  return /^releases\/covers\/[1-9]\d*\/[A-Za-z0-9][A-Za-z0-9._-]{0,240}\.(?:jpe?g|png|webp)$/i.test(value);
}

/**
 * Loads only fields required to decide whether a release is public. The query
 * enforces publish state and an actual creator account; the membership check
 * then mirrors the platform's existing public-profile rule for team accounts.
 */
async function findPublicMusicRelease(id: number): Promise<PublicMusicReleaseRow | null> {
  if (!isPositiveSafeId(id)) return null;

  try {
    const database = await getDb();
    if (!database) throw new PublicMusicReleaseUnavailableError();
    await ensureArtistReleaseDisclosureSchema(database);

    const [release] = await database.select({
      id: artistReleases.id,
      artistId: artistReleases.artistId,
      artistUserId: artistProfiles.userId,
      artistName: artistProfiles.artistName,
      title: artistReleases.title,
      description: artistReleases.description,
      genre: artistReleases.genre,
      currency: artistReleases.currency,
      priceInCents: artistReleases.priceInCents,
      allowPayWhatYouWant: artistReleases.allowPayWhatYouWant,
      // Internal-only references: never map these into the public DTO.
      coverArtKey: artistReleases.coverArtKey,
      previewFileKey: artistReleases.previewFileKey,
      audioFileKey: artistReleases.audioFileKey,
      durationSeconds: artistReleases.durationSeconds,
      fileFormat: artistReleases.fileFormat,
      publishedAt: artistReleases.publishedAt,
      totalSales: artistReleases.totalSales,
      aiUseDisclosureEnabled: artistReleases.aiUseDisclosureEnabled,
      aiUseLevel: artistReleases.aiUseLevel,
      aiUseComponents: artistReleases.aiUseComponents,
      aiUseTools: artistReleases.aiUseTools,
      aiUseNotes: artistReleases.aiUseNotes,
    }).from(artistReleases)
      .innerJoin(artistProfiles, eq(artistProfiles.id, artistReleases.artistId))
      .innerJoin(users, eq(users.id, artistProfiles.userId))
      .where(and(
        eq(artistReleases.id, id),
        eq(artistReleases.status, 'published'),
        // Match existing public creator visibility: an administrator who owns
        // an artist profile is a creator too, but gains no publication override.
        or(eq(users.role, 'artist'), eq(users.role, 'admin')),
      ))
      .limit(1) as PublicMusicReleaseRow[];

    if (!release || release.artistName.toLowerCase().includes('team member')) return null;

    const [nonOwnerMembership] = await database.select({ id: artistTeamMembers.id })
      .from(artistTeamMembers)
      .where(and(
        eq(artistTeamMembers.userId, release.artistUserId),
        ne(artistTeamMembers.role, 'owner'),
      ))
      .limit(1);

    return nonOwnerMembership ? null : release;
  } catch (error) {
    if (error instanceof PublicMusicReleaseUnavailableError) throw error;
    // Do not turn database/storage implementation errors into a false 404.
    throw new PublicMusicReleaseUnavailableError();
  }
}

function disclosureFor(release: PublicMusicReleaseRow): Pick<PublicMusicReleaseSingle,
  'aiUseDisclosureEnabled' | 'aiUseLevel' | 'aiUseComponents' | 'aiUseTools' | 'aiUseNotes'
> {
  if (release.aiUseDisclosureEnabled !== true) return {};
  return {
    aiUseDisclosureEnabled: true,
    aiUseLevel: release.aiUseLevel,
    aiUseComponents: Array.isArray(release.aiUseComponents) ? [...release.aiUseComponents] : [],
    aiUseTools: release.aiUseTools,
    aiUseNotes: release.aiUseNotes,
  };
}

/**
 * Public single lookup for release.getPublicSingle. This never returns an
 * audio/preview URL or a storage key, including when the requester is owner.
 */
export async function getPublicMusicSingle(id: number): Promise<PublicMusicReleaseSingle | null> {
  const release = await findPublicMusicRelease(id);
  if (!release) return null;

  let coverArtUrl: string | null = null;
  if (release.coverArtKey) {
    if (!isTrustedMusicCoverKey(release.coverArtKey)) throw new PublicMusicReleaseUnavailableError();
    try {
      // Resolve afresh; presigned URLs are short-lived display references only.
      coverArtUrl = (await storageGet(release.coverArtKey)).url;
      if (!isTrustedMusicCoverSource(coverArtUrl, release.coverArtKey)) throw new PublicMusicReleaseUnavailableError();
    } catch {
      throw new PublicMusicReleaseUnavailableError();
    }
  }

  return {
    id: release.id,
    artistId: release.artistId,
    artistName: release.artistName,
    artistUrl: artistPath(release.artistName),
    title: release.title,
    description: release.description,
    genre: release.genre,
    currency: release.currency,
    priceInCents: release.priceInCents,
    allowPayWhatYouWant: release.allowPayWhatYouWant,
    coverArtUrl,
    hasPreview: Boolean(release.previewFileKey || release.audioFileKey),
    durationSeconds: release.durationSeconds,
    fileFormat: release.fileFormat,
    publishedAt: release.publishedAt,
    totalSales: release.totalSales,
    ...disclosureFor(release),
  };
}

/**
 * Internal-only source descriptor for the OG image middleware. It carries no
 * raw key outside this service. The cache identity contains the current key so
 * replacement artwork cannot reuse a prior image cache entry.
 */
export async function getPublicMusicReleaseOgImage(id: number): Promise<{
  cacheIdentity: string;
  sourceUrl: string | null;
} | null> {
  const release = await findPublicMusicRelease(id);
  if (!release) return null;
  if (!release.coverArtKey) return { cacheIdentity: `music-${id}-fallback`, sourceUrl: null };
  if (!isTrustedMusicCoverKey(release.coverArtKey)) throw new PublicMusicReleaseUnavailableError();

  try {
    const sourceUrl = (await storageGet(release.coverArtKey)).url;
    if (!isTrustedMusicCoverSource(sourceUrl, release.coverArtKey)) throw new PublicMusicReleaseUnavailableError();
    return { cacheIdentity: `music-${id}-${release.coverArtKey}`, sourceUrl };
  } catch {
    throw new PublicMusicReleaseUnavailableError();
  }
}
