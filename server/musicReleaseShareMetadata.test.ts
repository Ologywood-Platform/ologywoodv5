import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class Unavailable extends Error {
    constructor() {
      super('unavailable');
      this.name = 'PublicMusicReleaseUnavailableError';
    }
  }
  return {
    getPublicMusicSingle: vi.fn(),
    getPublicMusicReleaseOgImage: vi.fn(),
    Unavailable,
  };
});

vi.mock('./services/musicReleasePublicService', () => ({
  getPublicMusicSingle: mocks.getPublicMusicSingle,
  getPublicMusicReleaseOgImage: mocks.getPublicMusicReleaseOgImage,
  PublicMusicReleaseUnavailableError: mocks.Unavailable,
}));

import ogImageProxyRouter from './middleware/ogImageProxy';
import { ogTagMiddleware } from './middleware/ogTags';

const release = {
  id: 42,
  artistId: 8,
  artistName: 'A <Artist> & Co',
  artistUrl: '/artist/a-artist-co',
  title: 'Current <Title> & More',
  description: 'Description with <markup> & quotes "here".',
  genre: 'Soul',
  currency: 'usd',
  priceInCents: 299,
  allowPayWhatYouWant: true,
  coverArtUrl: 'https://signed.example.test/cover?token=private',
  hasPreview: true,
  durationSeconds: 211,
  fileFormat: 'MP3',
  publishedAt: new Date('2026-01-02T03:04:05.000Z'),
  totalSales: 9,
};

function response() {
  const res: any = { statusCode: 200, body: '' };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.set = vi.fn(() => res);
  res.send = vi.fn((body: string) => { res.body = body; return res; });
  return res;
}

function crawlerRequest(path: string, method = 'GET'): any {
  return {
    path,
    method,
    headers: { 'user-agent': 'facebookexternalhit/1.1' },
    // Deliberately hostile values must not influence release canonical metadata.
    get: (name: string) => name.toLowerCase() === 'host' ? 'attacker.invalid' : '',
  };
}

describe('public music single crawler metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://attacker.invalid';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the numeric ID to canonicalize an old slug and escapes all public metadata', async () => {
    mocks.getPublicMusicSingle.mockResolvedValue(release);
    const res = response();

    await ogTagMiddleware()(crawlerRequest('/music/old-stale-title-42'), res, vi.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('https://www.ologywood.com/music/current-title-more-42');
    expect(res.body).toContain('https://www.ologywood.com/api/og-image/music/42');
    expect(res.body).not.toContain('attacker.invalid');
    expect(res.body).toContain('Current &lt;Title&gt; &amp; More');
    expect(res.body).toContain('A &lt;Artist&gt; &amp; Co');
    expect(res.body).toContain('Description with &lt;markup&gt; &amp; quotes &quot;here&quot;.');
    expect(res.body).toContain('$2.99 or more');
    expect(res.body).not.toContain('signed.example.test');
    expect(res.body).not.toMatch(/<audio\b/i);
    expect(res.body).not.toContain('audioFileKey');
    expect(res.body).not.toContain('previewFileKey');
  });

  it('serves generic 404 responses for malformed, missing, and private release identifiers', async () => {
    const malformed = response();
    await ogTagMiddleware()(crawlerRequest('/music/0'), malformed, vi.fn());
    expect(malformed.statusCode).toBe(404);
    expect(malformed.body).toBe('Not found');
    expect(mocks.getPublicMusicSingle).not.toHaveBeenCalled();

    mocks.getPublicMusicSingle.mockResolvedValue(null);
    const missing = response();
    await ogTagMiddleware()(crawlerRequest('/music/no-longer-public-42'), missing, vi.fn());
    expect(missing.statusCode).toBe(404);
    expect(missing.body).toBe('Not found');
    expect(missing.body).not.toContain('draft');
  });

  it('fails closed with 503 for a source outage but does not intercept non-GET/HEAD methods', async () => {
    mocks.getPublicMusicSingle.mockRejectedValue(new mocks.Unavailable());
    const outage = response();
    await ogTagMiddleware()(crawlerRequest('/music/title-42'), outage, vi.fn());
    expect(outage.statusCode).toBe(503);
    expect(outage.body).toBe('Service unavailable');

    const next = vi.fn();
    await ogTagMiddleware()(crawlerRequest('/music/title-42', 'POST'), response(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('public music cover OG image privacy', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('checks current publication eligibility before reading an existing image cache entry', async () => {
    const app = express();
    app.use('/api/og-image', ogImageProxyRouter);
    const id = 90991; // Test-local unique ID avoids the module-level cache of other cases.
    const sourceUrl = 'https://d111111.cloudfront.net/project/releases/covers/12/current-cover.webp';
    const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#456' } }).png().toBuffer();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(png, {
      status: 200,
      headers: { 'content-type': 'image/png', 'content-length': String(png.length) },
    })));
    mocks.getPublicMusicReleaseOgImage.mockResolvedValueOnce({
      cacheIdentity: `music-${id}-releases/covers/12/current-cover.webp`,
      sourceUrl,
    });

    const first = await request(app).get(`/api/og-image/music/${id}`);
    expect(first.status).toBe(200);
    expect(first.headers['content-type']).toMatch(/^image\/jpeg/);
    expect(fetch).toHaveBeenCalledWith(sourceUrl, expect.objectContaining({ redirect: 'error' }));

    // Publication changes after the cache fill. A cache-first implementation
    // would leak the former cover here; the route must query the service first.
    mocks.getPublicMusicReleaseOgImage.mockResolvedValueOnce(null);
    const second = await request(app).get(`/api/og-image/music/${id}`);
    expect(second.status).toBe(404);
    expect(second.text).toBe('Not found');
    expect(mocks.getPublicMusicReleaseOgImage).toHaveBeenCalledTimes(2);
  });

  it('refuses a non-storage source even when a mocked source reaches the proxy', async () => {
    const app = express();
    app.use('/api/og-image', ogImageProxyRouter);
    mocks.getPublicMusicReleaseOgImage.mockResolvedValue({
      cacheIdentity: 'music-90992-untrusted',
      sourceUrl: 'https://attacker.invalid/cover.png',
    });

    const result = await request(app).get('/api/og-image/music/90992');
    expect(result.status).toBe(503);
    expect(result.text).toBe('Service unavailable');
  });
});
