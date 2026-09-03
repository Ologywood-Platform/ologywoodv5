import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getArtistProfileByUserId: vi.fn(),
  getPool: vi.fn(),
  ensureSchema: vi.fn(),
  storagePut: vi.fn(),
  storageGet: vi.fn(),
  convertPortfolioVideo: vi.fn(),
}));

vi.mock('./_core/sdk', () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock('./db', () => ({
  getArtistProfileByUserId: mocks.getArtistProfileByUserId,
  getPool: mocks.getPool,
  getSubscriptionByUserId: vi.fn(),
  updateArtistProfile: vi.fn(),
}));
vi.mock('./services/videoPortfolioSchemaService', () => ({ ensureVideoPortfolioSchema: mocks.ensureSchema }));
vi.mock('./storage', () => ({ storagePut: mocks.storagePut, storageGet: mocks.storageGet }));
vi.mock('./services/videoPortfolioConversion', () => ({ convertPortfolioVideo: mocks.convertPortfolioVideo }));

import videoUploadRouter from './routes/videoUpload';

const videoBytes = Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 0, 0, 0, 0]);
const thumbnailBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const aviBytes = Buffer.from('RIFFxxxxAVI ');
const convertedVideoBytes = Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 0, 0, 0, 0]);

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/video', videoUploadRouter);
  return app;
}

describe('Video Portfolio authenticated chunked upload route', () => {
  const stored = new Map<string, Buffer>();
  let catalogInserted = false;
  let activeCount = 0;
  const execute = vi.fn(async (sql: string) => {
    if (sql.includes('SELECT COUNT(*) AS cnt')) return [[{ cnt: activeCount }], []];
    if (sql.includes('SELECT id FROM video_portfolio')) {
      return [catalogInserted ? [{ id: 77 }] : [], []];
    }
    if (sql.includes('INSERT INTO video_portfolio')) {
      catalogInserted = true;
      return [{ insertId: 77 }, []];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    stored.clear();
    catalogInserted = false;
    activeCount = 0;
    mocks.authenticateRequest.mockResolvedValue({ id: 7, role: 'artist' });
    mocks.getArtistProfileByUserId.mockResolvedValue({ id: 11, userId: 7, artistName: 'Validation Artist' });
    mocks.getPool.mockReturnValue({ execute });
    mocks.ensureSchema.mockResolvedValue(undefined);
    mocks.convertPortfolioVideo.mockResolvedValue({ video: convertedVideoBytes, thumbnail: thumbnailBytes, duration: 3.1 });
    mocks.storagePut.mockImplementation(async (key: string, data: Buffer) => {
      stored.set(key, Buffer.from(data));
      return { key, url: `/manus-storage/${key}` };
    });
    mocks.storageGet.mockImplementation(async (key: string) => ({
      key,
      url: `https://storage.test/${encodeURIComponent(key)}`,
    }));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const key = decodeURIComponent(new URL(url).pathname.slice(1));
      const bytes = stored.get(key);
      return bytes ? new Response(bytes, { status: 200 }) : new Response('missing', { status: 404 });
    }));
  });

  async function startSession(app = buildApp()) {
    return request(app)
      .post('/api/video/portfolio/start')
      .send({
        title: 'Real MOV class',
        category: 'other',
        durationSeconds: 15,
        sourceFormat: 'mp4',
        videoSize: videoBytes.length,
        thumbnailSize: thumbnailBytes.length,
        videoMimeType: 'video/mp4',
        thumbnailMimeType: 'image/jpeg',
      });
  }

  async function uploadChunk(app: express.Express, token: string, kind: 'video' | 'thumbnail', bytes: Buffer) {
    return request(app)
      .post('/api/video/portfolio/chunk')
      .set('Content-Type', 'application/octet-stream')
      .set('x-portfolio-upload-token', token)
      .set('x-portfolio-upload-kind', kind)
      .set('x-portfolio-upload-index', '0')
      .send(bytes);
  }

  async function startConversionSession(app = buildApp()) {
    return request(app)
      .post('/api/video/portfolio/start')
      .send({
        title: 'AVI conversion',
        category: 'other',
        durationSeconds: 0,
        sourceFormat: 'avi',
        videoSize: aviBytes.length,
        thumbnailSize: 0,
        videoMimeType: 'video/x-msvideo',
        thumbnailMimeType: '',
      });
  }

  it('assembles valid chunks, stores final media, inserts once, and rejects replay', async () => {
    const app = buildApp();
    const started = await startSession(app);
    expect(started.status).toBe(200);
    expect(started.body.videoChunkCount).toBe(1);
    expect(started.body.thumbnailChunkCount).toBe(1);

    expect((await uploadChunk(app, started.body.token, 'video', videoBytes)).status).toBe(200);
    expect((await uploadChunk(app, started.body.token, 'thumbnail', thumbnailBytes)).status).toBe(200);

    const finalized = await request(app)
      .post('/api/video/portfolio/finalize')
      .send({ token: started.body.token });
    expect(finalized.status).toBe(200);
    expect(finalized.body).toMatchObject({ success: true, id: 77 });
    expect(finalized.body.url).toMatch(/^\/manus-storage\/video-portfolio\/7\/uploads\//);
    expect(finalized.body.url).toMatch(/\/video\.mp4$/);
    expect(finalized.body.thumbnailUrl).toMatch(/\/thumbnail\.jpg$/);

    const finalVideoKey = finalized.body.url.replace('/manus-storage/', '');
    const finalThumbnailKey = finalized.body.thumbnailUrl.replace('/manus-storage/', '');
    expect(stored.get(finalVideoKey)).toEqual(videoBytes);
    expect(stored.get(finalThumbnailKey)).toEqual(thumbnailBytes);

    const replay = await request(app)
      .post('/api/video/portfolio/finalize')
      .send({ token: started.body.token });
    expect(replay.status).toBe(409);
  });

  it('converts an authenticated AVI source and stores only browser-ready MP4/JPEG outputs', async () => {
    const app = buildApp();
    const started = await startConversionSession(app);
    expect(started.status).toBe(200);
    expect(started.body.requiresConversion).toBe(true);
    expect(started.body.thumbnailChunkCount).toBe(0);
    expect((await uploadChunk(app, started.body.token, 'video', aviBytes)).status).toBe(200);

    const finalized = await request(app)
      .post('/api/video/portfolio/finalize')
      .send({ token: started.body.token });
    expect(finalized.status).toBe(200);
    expect(finalized.body).toMatchObject({ success: true, id: 77, converted: true });
    expect(mocks.convertPortfolioVideo).toHaveBeenCalledWith({ source: aviBytes, sourceFormat: 'avi' });
    expect(finalized.body.url).toMatch(/\/video\.mp4$/);
    expect(finalized.body.thumbnailUrl).toMatch(/\/thumbnail\.jpg$/);
    expect(stored.get(finalized.body.url.replace('/manus-storage/', ''))).toEqual(convertedVideoBytes);
    expect(stored.get(finalized.body.thumbnailUrl.replace('/manus-storage/', ''))).toEqual(thumbnailBytes);
  });

  it('rejects wrong chunk sizes and tampered upload tokens', async () => {
    const app = buildApp();
    const started = await startSession(app);
    const wrongSize = await uploadChunk(app, started.body.token, 'video', videoBytes.subarray(0, 8));
    expect(wrongSize.status).toBe(400);
    expect(wrongSize.body.error).toContain('size');

    const tampered = await uploadChunk(app, `${started.body.token}x`, 'video', videoBytes);
    expect(tampered.status).toBe(400);
    expect(tampered.body.error).toContain('Invalid upload confirmation');
  });

  it('binds a session to the authenticated artist profile', async () => {
    const app = buildApp();
    const started = await startSession(app);
    mocks.authenticateRequest.mockResolvedValue({ id: 8, role: 'artist' });
    mocks.getArtistProfileByUserId.mockResolvedValue({ id: 12, userId: 8, artistName: 'Different Artist' });
    const response = await uploadChunk(app, started.body.token, 'video', videoBytes);
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('does not belong');
  });

  it('enforces the ten-video capacity before issuing a session', async () => {
    activeCount = 10;
    const response = await startSession();
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Maximum 10 videos');
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it('requires authentication before starting or uploading chunks', async () => {
    mocks.authenticateRequest.mockRejectedValue(new Error('no session'));
    const start = await startSession();
    expect(start.status).toBe(401);
    expect(start.body.error).toBe('Unauthorized');
  });
});
