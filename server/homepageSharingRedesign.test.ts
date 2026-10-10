import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb }));
import { ogTagMiddleware } from './middleware/ogTags';

const title = 'Your Talent. Your Platform. Your Next Opportunity.';
const image = 'https://www.ologywood.com/manus-storage/ologywood-platform-og-2026-10-10_f734dc76.png';
const source = (name: string) => readFileSync(resolve(import.meta.dirname, '..', name), 'utf8');

async function request(path: string, userAgent: string) {
  let html = '';
  const next = vi.fn();
  const response: any = {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn((value: string) => { html = value; }),
  };
  await ogTagMiddleware()({ path, headers: { 'user-agent': userAgent }, get: () => 'www.ologywood.com' } as any, response, next);
  return { html, next, response };
}

function dbRows(rows: unknown[]) {
  const query: any = {};
  for (const key of ['select', 'from', 'where']) query[key] = vi.fn(() => query);
  query.limit = vi.fn(async () => rows);
  return query;
}

beforeEach(() => vi.clearAllMocks());

describe('Homepage-aligned platform sharing', () => {
  for (const bot of ['facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Discordbot', 'iMessageLinkPreview']) {
    it(`serves current large-image metadata to ${bot} without database work`, async () => {
      const { html, next, response } = await request('/', bot);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(html).toContain(`<meta property="og:title" content="${title}"`);
      expect(html).toContain(`<meta property="og:image" content="${image}"`);
      expect(html).toContain(`<meta property="og:image:secure_url" content="${image}"`);
      expect(html).toContain(`<meta name="twitter:image" content="${image}"`);
      expect(html).toContain('content="summary_large_image"');
      expect(html).toContain('og:image:width" content="1200"');
      expect(html).toContain('og:image:height" content="630"');
      expect(html).toContain('Your Next Opportunity.');
      expect(html).toContain('Creators own their audience.');
      expect(next).not.toHaveBeenCalled();
      expect(mocks.getDb).not.toHaveBeenCalled();
    });
  }

  it('leaves ordinary homepage requests on the SPA route', async () => {
    const { next, html } = await request('/', 'Mozilla/5.0');
    expect(next).toHaveBeenCalledOnce();
    expect(html).toBe('');
  });

  it('aligns static browser and all global fallback images with the versioned artwork', () => {
    const files = ['client/index.html', 'client/src/utils/seoMeta.ts', 'client/src/hooks/useMetaTags.ts', 'server/middleware/ogTags.ts', 'server/middleware/ogMetaInjection.ts', 'server/middleware/ogImageProxy.ts', 'server/routes/ogPage.ts', 'server/_core/vite.ts'];
    for (const file of files) {
      expect(source(file), file).toContain(image);
      expect(source(file), file).not.toContain('ologywood-social-preview-2026_af1c0d6d.png');
    }
    for (const file of ['client/index.html', 'client/src/utils/seoMeta.ts', 'client/src/hooks/useMetaTags.ts', 'server/middleware/ogTags.ts', 'server/routes/ogPage.ts']) {
      expect(source(file), file).toContain(title);
      expect(source(file), file).not.toContain('Build Your Brand. Grow Your Fans. Create More Opportunities.');
    }
  });

  it('preserves artist-specific photo and title instead of replacing them with the platform card', async () => {
    mocks.getDb.mockResolvedValue(dbRows([{ id: 11, artistName: 'Example Artist', bio: 'Artist biography', genre: [], profilePhotoUrl: 'https://example.com/artist.png' }]));
    const { html } = await request('/artist/11', 'Twitterbot');
    expect(html).toContain('Example Artist | Book on Ologywood');
    expect(html).toContain('/api/og-image/artist/11');
    expect(html).not.toContain(image);
    expect(html).not.toContain(title);
  });

  it('preserves venue-specific photo and title instead of replacing them with the platform card', async () => {
    mocks.getDb.mockResolvedValue(dbRows([{ id: 4, organizationName: 'Example Venue', bio: 'Venue description', profilePhotoUrl: 'https://example.com/venue.png' }]));
    const { html } = await request('/venue/4', 'LinkedInBot');
    expect(html).toContain('Example Venue | Ologywood');
    expect(html).toContain('/api/og-image/venue/4');
    expect(html).not.toContain(image);
    expect(html).not.toContain(title);
  });
});
