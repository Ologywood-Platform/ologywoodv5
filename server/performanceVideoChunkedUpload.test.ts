import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getSubscriptionByUserId: vi.fn(),
  updateArtistProfile: vi.fn(),
  getPool: vi.fn(),
  ensureSchema: vi.fn(),
  storagePut: vi.fn(),
  storageGet: vi.fn(),
  convertPortfolioVideo: vi.fn(),
  convertPerformanceVideo: vi.fn(),
}));

vi.mock('./_core/sdk', () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock('./db', () => ({
  getArtistProfileByUserId: mocks.getArtistProfileByUserId,
  getSubscriptionByUserId: mocks.getSubscriptionByUserId,
  updateArtistProfile: mocks.updateArtistProfile,
  getPool: mocks.getPool,
}));
vi.mock('./services/videoPortfolioSchemaService', () => ({ ensureVideoPortfolioSchema: mocks.ensureSchema }));
vi.mock('./storage', () => ({ storagePut: mocks.storagePut, storageGet: mocks.storageGet }));
vi.mock('./services/videoPortfolioConversion', () => ({
  convertPortfolioVideo: mocks.convertPortfolioVideo,
  convertPerformanceVideo: mocks.convertPerformanceVideo,
}));

import videoUploadRouter from './routes/videoUpload';

const videoBytes = Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 0, 0, 0, 0]);
const thumbnailBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const aviBytes = Buffer.from('RIFFxxxxAVI ');

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/video', videoUploadRouter);
  return app;
}

describe('Performance Video authenticated chunked upload route', () => {
  const stored = new Map<string, Buffer>();
  const profile: Record<string, any> = { id: 11, userId: 7, artistName: 'Validation Artist', performanceVideoUrl: null };

  beforeEach(() => {
    vi.clearAllMocks();
    stored.clear();
    profile.performanceVideoUrl = null;
    profile.performanceVideoThumbnail = null;
    mocks.authenticateRequest.mockResolvedValue({ id: 7, role: 'artist' });
    mocks.getArtistProfileByUserId.mockImplementation(async () => profile);
    mocks.getSubscriptionByUserId.mockResolvedValue({ tier: 'professional' });
    mocks.getPool.mockReturnValue({ execute: vi.fn() });
    mocks.updateArtistProfile.mockImplementation(async (_id: number, changes: Record<string, unknown>) => Object.assign(profile, changes));
    mocks.convertPerformanceVideo.mockResolvedValue({ video: videoBytes, thumbnail: thumbnailBytes, duration: 45 });
    mocks.storagePut.mockImplementation(async (key: string, data: Buffer) => {
      stored.set(key, Buffer.from(data));
      return { key, url: `/manus-storage/${key}` };
    });
    mocks.storageGet.mockImplementation(async (key: string) => ({ key, url: `https://storage.test/${encodeURIComponent(key)}` }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const key = decodeURIComponent(new URL(url).pathname.slice(1));
      const bytes = stored.get(key);
      return bytes ? new Response(bytes, { status: 200 }) : new Response('missing', { status: 404 });
    }));
  });

  async function startSession(app = buildApp()) {
    return request(app).post('/api/video/performance/start').send({
      durationSeconds: 45,
      sourceFormat: 'mp4',
      videoSize: videoBytes.length,
      thumbnailSize: thumbnailBytes.length,
      videoMimeType: 'video/mp4',
      thumbnailMimeType: 'image/jpeg',
    });
  }

  async function uploadChunk(app: express.Express, token: string, kind: 'video' | 'thumbnail', bytes: Buffer) {
    return request(app)
      .post('/api/video/performance/chunk')
      .set('Content-Type', 'application/octet-stream')
      .set('x-performance-upload-token', token)
      .set('x-performance-upload-kind', kind)
      .set('x-performance-upload-index', '0')
      .send(bytes);
  }

  it('assembles valid chunks, stores final media, updates only the owner profile, and rejects replay', async () => {
    const app = buildApp();
    const started = await startSession(app);
    expect(started.status).toBe(200);
    expect((await uploadChunk(app, started.body.token, 'video', videoBytes)).status).toBe(200);
    expect((await uploadChunk(app, started.body.token, 'thumbnail', thumbnailBytes)).status).toBe(200);
    const finalized = await request(app).post('/api/video/performance/finalize').send({ token: started.body.token });
    expect(finalized.status).toBe(200);
    expect(finalized.body.url).toMatch(/^\/manus-storage\/performance-videos\/7\/uploads\//);
    expect(mocks.updateArtistProfile).toHaveBeenCalledWith(11, expect.objectContaining({
      performanceVideoStatus: 'approved',
      performanceVideoDuration: 45,
      performanceVideoFlagCount: 0,
    }));
    const replay = await request(app).post('/api/video/performance/finalize').send({ token: started.body.token });
    expect(replay.status).toBe(409);
  });

  it('converts AVI to browser-ready MP4 and generates its thumbnail', async () => {
    const app = buildApp();
    const started = await request(app).post('/api/video/performance/start').send({
      durationSeconds: 0,
      sourceFormat: 'avi',
      videoSize: aviBytes.length,
      thumbnailSize: 0,
      videoMimeType: 'video/x-msvideo',
      thumbnailMimeType: '',
    });
    expect(started.status).toBe(200);
    expect(started.body.requiresConversion).toBe(true);
    expect((await uploadChunk(app, started.body.token, 'video', aviBytes)).status).toBe(200);
    const finalized = await request(app).post('/api/video/performance/finalize').send({ token: started.body.token });
    expect(finalized.status).toBe(200);
    expect(finalized.body).toMatchObject({ success: true, converted: true });
    expect(mocks.convertPerformanceVideo).toHaveBeenCalledWith({ source: aviBytes, sourceFormat: 'avi' });
    expect(finalized.body.url).toMatch(/\/video\.mp4$/);
    expect(finalized.body.thumbnailUrl).toMatch(/\/thumbnail\.jpg$/);
  });

  it('rejects tampered chunks, a different profile, free-tier access, and missing authentication', async () => {
    const app = buildApp();
    const started = await startSession(app);
    expect((await uploadChunk(app, `${started.body.token}x`, 'video', videoBytes)).status).toBe(400);

    mocks.authenticateRequest.mockResolvedValue({ id: 8, role: 'artist' });
    mocks.getArtistProfileByUserId.mockResolvedValue({ id: 12, userId: 8 });
    expect((await uploadChunk(app, started.body.token, 'video', videoBytes)).status).toBe(403);

    mocks.authenticateRequest.mockResolvedValue({ id: 7, role: 'artist' });
    mocks.getArtistProfileByUserId.mockImplementation(async () => profile);
    mocks.getSubscriptionByUserId.mockResolvedValue({ tier: 'free' });
    const freeTier = await startSession(app);
    expect(freeTier.status).toBe(403);

    mocks.authenticateRequest.mockRejectedValue(new Error('no session'));
    const unauthorized = await startSession(app);
    expect(unauthorized.status).toBe(401);
  });
});
