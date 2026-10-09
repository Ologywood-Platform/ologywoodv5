import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  subscription: vi.fn(),
  ensureSchema: vi.fn(),
  uploadHostedPreview: vi.fn(),
  resolveHostedPreview: vi.fn(),
  readPreviewReference: vi.fn(),
  storageGet: vi.fn(),
  storagePut: vi.fn(),
  createContentReleaseCheckout: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getActiveReleaseCount: vi.fn(),
  createRelease: vi.fn(),
  getReleaseById: vi.fn(),
  getReleasesByArtistId: vi.fn(),
  getPublishedReleasesByArtistId: vi.fn(),
  updateRelease: vi.fn(),
  deleteRelease: vi.fn(),
  getArtistReleaseSalesStats: vi.fn(),
  getPurchasesByReleaseId: vi.fn(),
  sendArtistUpdate: vi.fn(),
}));

vi.mock('./db', () => ({
  getDb: mocks.getDb,
  getSubscriptionByUserId: mocks.subscription,
  getArtistProfileByUserId: mocks.getArtistProfileByUserId,
  getActiveReleaseCount: mocks.getActiveReleaseCount,
  createRelease: mocks.createRelease,
  getReleaseById: mocks.getReleaseById,
  getReleasesByArtistId: mocks.getReleasesByArtistId,
  getPublishedReleasesByArtistId: mocks.getPublishedReleasesByArtistId,
  updateRelease: mocks.updateRelease,
  deleteRelease: mocks.deleteRelease,
  getArtistReleaseSalesStats: mocks.getArtistReleaseSalesStats,
  getPurchasesByReleaseId: mocks.getPurchasesByReleaseId,
}));
vi.mock('./storage', () => ({ storageGet: mocks.storageGet, storagePut: mocks.storagePut }));
vi.mock('./services/contentReleaseSchemaService', () => ({ ensureContentReleaseSchema: mocks.ensureSchema }));
vi.mock('./services/releasePreviewMedia', () => ({
  PREVIEW_INPUT_BYTES: 20 * 1024 * 1024,
  PREVIEW_ERROR: 'preview failed',
  uploadHostedPreview: mocks.uploadHostedPreview,
  resolveHostedPreview: mocks.resolveHostedPreview,
  readPreviewReference: mocks.readPreviewReference,
}));
vi.mock('./services/contentReleaseCommerceService', () => ({
  createContentReleaseCheckout: mocks.createContentReleaseCheckout,
}));
vi.mock('./services/pricingTierService', () => ({
  hasFeatureAccess: vi.fn(),
  canCreateRelease: vi.fn(),
  getUserSubscription: vi.fn(),
  PRICING_TIERS: {},
}));
vi.mock('./services/artistUpdateService', () => ({ sendArtistUpdate: mocks.sendArtistUpdate }));
vi.mock('./email', () => ({ sendEmail: vi.fn() }));
vi.mock('stripe', () => ({ default: class Stripe {} }));

import { contentReleasePreviewLimiter, releasesRouter } from './routers/releases';
import { releaseRouter } from './routers/release';

const creatorContext: any = { user: { id: 7, role: 'artist', email: 'creator@example.test' }, req: {}, res: {} };
const anonymousContext: any = { user: null, req: {}, res: {} };
const previewUpload = { fileData: 'YQ==', mimeType: 'audio/mpeg' as const };
const releaseInput = {
  title: 'Private preview test',
  releaseType: 'single',
  hostingPlatform: 'youtube',
  contentUrl: 'https://paid.example.test/full-release',
};

/** Fluent Drizzle-shaped mock used by the content-release router. */
function contentDb(rows: any[][] = []) {
  const execute = vi.fn();
  const select = vi.fn(() => {
    const result = Promise.resolve(rows.shift() ?? []);
    const builder: any = {
      from: () => builder,
      where: () => builder,
      limit: () => builder,
      orderBy: () => builder,
      then: result.then.bind(result),
    };
    return builder;
  });
  const values = vi.fn().mockResolvedValue([{ insertId: 101 }]);
  const insert = vi.fn(() => ({ values }));
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { execute, select, insert, values, update, set, where };
}

function invalidPreviewReference() {
  return new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Please upload this release preview from your own account again.',
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  contentReleasePreviewLimiter.reset('7');
  contentReleasePreviewLimiter.reset('8');
  mocks.ensureSchema.mockResolvedValue(undefined);
  mocks.subscription.mockResolvedValue({ tier: 'professional' });
  mocks.uploadHostedPreview.mockResolvedValue({
    previewMedia: 'valid-owner-token',
    previewUrl: 'https://media.example.test/preview.mp3',
    kind: 'audio',
    durationSeconds: 30,
  });
  mocks.resolveHostedPreview.mockResolvedValue({
    previewUrl: 'https://media.example.test/signed-preview.mp3',
    kind: 'audio',
    durationSeconds: 30,
  });
  mocks.readPreviewReference.mockReturnValue({
    version: 1,
    userId: 7,
    key: 'release-previews/hosted/7/11111111-1111-4111-8111-111111111111.mp3',
    kind: 'audio',
    durationSeconds: 30,
  });
  mocks.storageGet.mockImplementation(async (key: string) => ({ url: `https://media.example.test/${key}` }));
});

describe('content release hosted-preview API', () => {
  it('rejects unsigned uploadPreview before looking up the database', async () => {
    await expect(releasesRouter.createCaller(anonymousContext).uploadPreview(previewUpload)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.uploadHostedPreview).not.toHaveBeenCalled();
  });

  it('rejects non-creators before looking up or uploading preview media', async () => {
    const nonCreator = { ...creatorContext, user: { id: 7, role: 'venue' } };
    await expect(releasesRouter.createCaller(nonCreator).uploadPreview(previewUpload)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.uploadHostedPreview).not.toHaveBeenCalled();
  });

  it.each(['a missing release', "another creator's release"])('denies %s before preview processing', async () => {
    const db = contentDb([[{ id: 11 }], []]);
    mocks.getDb.mockResolvedValue(db);

    await expect(releasesRouter.createCaller(creatorContext).uploadPreview({ ...previewUpload, releaseId: 404 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(mocks.uploadHostedPreview).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('keeps free and exhausted Starter creators from processing a new preview', async () => {
    const freeDb = contentDb([[{ id: 11 }]]);
    mocks.getDb.mockResolvedValue(freeDb);
    mocks.subscription.mockResolvedValueOnce({ tier: 'free' });
    await expect(releasesRouter.createCaller(creatorContext).uploadPreview(previewUpload)).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const starterDb = contentDb([[{ id: 11 }], [{ id: 1 }, { id: 2 }]]);
    mocks.getDb.mockResolvedValue(starterDb);
    mocks.subscription.mockResolvedValueOnce({ tier: 'starter' });
    await expect(releasesRouter.createCaller(creatorContext).uploadPreview(previewUpload)).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(mocks.uploadHostedPreview).not.toHaveBeenCalled();
    expect(freeDb.insert).not.toHaveBeenCalled();
    expect(starterDb.insert).not.toHaveBeenCalled();
  });

  it('hides a draft preview from a non-owner without resolving its media', async () => {
    const db = contentDb([[{ userId: 7, isPublished: false, previewMedia: 'draft-owner-token' }]]);
    mocks.getDb.mockResolvedValue(db);

    await expect(releasesRouter.createCaller({ ...creatorContext, user: { id: 8, role: 'artist' } }).getPreview({ releaseId: 101 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(mocks.resolveHostedPreview).not.toHaveBeenCalled();
  });

  it('allows the draft owner to resolve only the dedicated preview', async () => {
    const db = contentDb([[{ userId: 7, isPublished: false, previewMedia: 'draft-owner-token' }]]);
    mocks.getDb.mockResolvedValue(db);

    const result = await releasesRouter.createCaller(creatorContext).getPreview({ releaseId: 101 });
    expect(result).toEqual({
      previewUrl: 'https://media.example.test/signed-preview.mp3',
      kind: 'audio',
      durationSeconds: 30,
    });
    expect(mocks.resolveHostedPreview).toHaveBeenCalledWith('draft-owner-token', 7);
    expect(result).not.toHaveProperty('contentUrl');
  });

  it('allows an anonymous listener to resolve a published preview without returning paid content', async () => {
    const db = contentDb([[{ userId: 7, isPublished: true, previewMedia: 'published-owner-token' }]]);
    mocks.getDb.mockResolvedValue(db);

    const result = await releasesRouter.createCaller(anonymousContext).getPreview({ releaseId: 101 });
    expect(mocks.resolveHostedPreview).toHaveBeenCalledWith('published-owner-token', 7);
    expect(result).toEqual({
      previewUrl: 'https://media.example.test/signed-preview.mp3',
      kind: 'audio',
      durationSeconds: 30,
    });
    expect(result).not.toHaveProperty('contentUrl');
  });

  it.each([
    ['create', 'forged-preview-token'],
    ['create', 'token-signed-for-owner-8'],
    ['update', 'forged-preview-token'],
    ['update', 'token-signed-for-owner-8'],
  ] as const)('rejects %s with a forged or foreign preview token before any release write', async (operation, token) => {
    mocks.readPreviewReference.mockImplementation((candidate: string, ownerId?: number) => {
      expect(candidate).toBe(token);
      expect(ownerId).toBe(7);
      throw invalidPreviewReference();
    });
    const db = operation === 'create'
      ? contentDb([[{ id: 11 }]])
      : contentDb([[{ id: 101, userId: 7, aiUseDisclosureEnabled: false }]]);
    mocks.getDb.mockResolvedValue(db);

    if (operation === 'create') {
      await expect(releasesRouter.createCaller(creatorContext).create({ ...releaseInput, previewMedia: token })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    } else {
      await expect(releasesRouter.createCaller(creatorContext).update({ id: 101, previewMedia: token })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    }

    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('writes only previewMedia for a preview-only partial update', async () => {
    const original = {
      id: 101,
      userId: 7,
      title: 'Keep this title',
      description: 'Keep this description',
      accessModel: 'ticketed',
      contentUrl: 'https://paid.example.test/keep',
      isPublished: true,
      aiUseDisclosureEnabled: false,
    };
    const db = contentDb([[original], [{ ...original, previewMedia: 'fresh-owner-token' }]]);
    mocks.getDb.mockResolvedValue(db);

    const result = await releasesRouter.createCaller(creatorContext).update({ id: 101, previewMedia: 'fresh-owner-token' });
    expect(mocks.readPreviewReference).toHaveBeenCalledWith('fresh-owner-token', 7);
    expect(db.set).toHaveBeenCalledWith({ previewMedia: 'fresh-owner-token' });
    expect(db.set).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ title: 'Keep this title', contentUrl: 'https://paid.example.test/keep', previewMedia: 'fresh-owner-token' });
  });

  it('redacts the opaque preview token and paid content URL from public content-release cards', async () => {
    const paidRelease = {
      id: 101,
      artistProfileId: 11,
      userId: 7,
      title: 'Paid Single',
      contentUrl: 'https://paid.example.test/full',
      accessModel: 'ticketed',
      previewMedia: 'opaque-owner-bound-token',
      isPublished: true,
    };
    const db = contentDb([[paidRelease]]);
    mocks.getDb.mockResolvedValue(db);

    const [result] = await releasesRouter.createCaller(anonymousContext).getByArtist({ artistProfileId: 11 });
    expect(result).toMatchObject({ id: 101, hasPreview: true, contentUrl: null });
    expect(result).not.toHaveProperty('previewMedia');
    expect(result).not.toContain('opaque-owner-bound-token');
    expect(result).not.toContain('https://paid.example.test/full');
  });
});

describe('music release public media access', () => {
  const publishedTrack = {
    id: 201,
    artistId: 11,
    title: 'Public Track',
    status: 'published',
    audioFileKey: 'music/private/full-track.mp3',
    previewFileKey: 'music/private/preview-track.mp3',
    coverArtKey: 'music/public/cover.jpg',
  };

  it('does not presign the full-audio key for public getByArtist cards', async () => {
    mocks.getPublishedReleasesByArtistId.mockResolvedValue([publishedTrack]);

    const [result] = await releaseRouter.createCaller(anonymousContext).getByArtist({ artistId: 11 });
    expect(result).toMatchObject({
      id: 201,
      audioFileKey: null,
      previewFileKey: null,
      audioUrl: null,
      previewUrl: null,
      hasPreview: true,
      coverArtUrl: 'https://media.example.test/music/public/cover.jpg',
    });
    expect(mocks.storageGet).toHaveBeenCalledWith('music/public/cover.jpg');
    expect(mocks.storageGet).not.toHaveBeenCalledWith('music/private/full-track.mp3');
    expect(mocks.storageGet).not.toHaveBeenCalledWith('music/private/preview-track.mp3');
  });

  it('does not presign the full-audio key for a public getById view', async () => {
    mocks.getReleaseById.mockResolvedValue(publishedTrack);

    const result = await releaseRouter.createCaller(anonymousContext).getById({ id: 201 });
    expect(result).toMatchObject({
      id: 201,
      audioFileKey: null,
      previewFileKey: null,
      audioUrl: null,
      previewUrl: null,
      hasPreview: true,
    });
    expect(mocks.storageGet).toHaveBeenCalledWith('music/public/cover.jpg');
    expect(mocks.storageGet).not.toHaveBeenCalledWith('music/private/full-track.mp3');
    expect(mocks.storageGet).not.toHaveBeenCalledWith('music/private/preview-track.mp3');
  });

  it('returns NOT_FOUND to anonymous callers for a draft music release without storage access', async () => {
    mocks.getReleaseById.mockResolvedValue({ ...publishedTrack, status: 'draft' });

    await expect(releaseRouter.createCaller(anonymousContext).getById({ id: 201 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('retains full media access for the owner in getMyReleases and getById, including drafts', async () => {
    const ownerTrack = { ...publishedTrack, status: 'draft' };
    mocks.getArtistProfileByUserId.mockResolvedValue({ id: 11, userId: 7, artistName: 'Creator' });
    mocks.getReleasesByArtistId.mockResolvedValue([ownerTrack]);

    const [dashboardRelease] = await releaseRouter.createCaller(creatorContext).getMyReleases();
    expect(dashboardRelease).toMatchObject({
      audioFileKey: 'music/private/full-track.mp3',
      previewFileKey: 'music/private/preview-track.mp3',
      audioUrl: 'https://media.example.test/music/private/full-track.mp3',
      previewUrl: 'https://media.example.test/music/private/preview-track.mp3',
    });
    expect(mocks.storageGet).toHaveBeenCalledWith('music/private/full-track.mp3');

    mocks.storageGet.mockClear();
    mocks.getReleaseById.mockResolvedValue(ownerTrack);
    const detailRelease = await releaseRouter.createCaller(creatorContext).getById({ id: 201 });
    expect(detailRelease).toMatchObject({
      audioFileKey: 'music/private/full-track.mp3',
      previewFileKey: 'music/private/preview-track.mp3',
      audioUrl: 'https://media.example.test/music/private/full-track.mp3',
      previewUrl: 'https://media.example.test/music/private/preview-track.mp3',
    });
    expect(mocks.storageGet).toHaveBeenCalledWith('music/private/full-track.mp3');
  });
});
