import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('../db', () => ({
  getDb: getDbMock,
}));

import { ogTagMiddleware } from '../middleware/ogTags';

function createResponse() {
  const response: any = { statusCode: 200, body: '', contentType: '' };
  response.status = vi.fn((code: number) => {
    response.statusCode = code;
    return response;
  });
  response.set = vi.fn((name: string, value: string) => {
    if (name.toLowerCase() === 'content-type') response.contentType = value;
    return response;
  });
  response.send = vi.fn((body: string) => {
    response.body = body;
    return response;
  });
  return response;
}

function createRequest(path: string): any {
  return {
    path,
    protocol: 'https',
    headers: { 'user-agent': 'facebookexternalhit/1.1' },
    get: (name: string) => {
      if (name.toLowerCase() === 'user-agent') return 'facebookexternalhit/1.1';
      if (name.toLowerCase() === 'host') return 'www.ologywood.com';
      return '';
    },
  };
}

function createPortfolioSelectChain(result: any[]) {
  return {
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => result),
        })),
      })),
    })),
  };
}

describe('portfolio video Open Graph middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://www.ologywood.com';
  });

  it('renders the saved thumbnail, creator, category, and clean canonical URL', async () => {
    const video = {
      id: 2,
      title: 'Video test',
      thumbnailUrl: 'https://cdn.example.com/adonis-video-thumbnail.jpg',
      category: 'highlights',
      status: 'active',
      artistName: 'Adonis',
    };
    getDbMock.mockResolvedValue({
      select: vi.fn(() => createPortfolioSelectChain([video])),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/portfolio-video/video-test-2'), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toBe('text/html');
    expect(response.body).toContain('<meta property="og:type" content="video.other" />');
    expect(response.body).toContain('Video test | Adonis on OlogyWood');
    expect(response.body).toContain('Watch “Video test,” a Highlights video from Adonis on OlogyWood.');
    expect(response.body).toContain('https://www.ologywood.com/api/og-image/portfolio-video/2');
    expect(response.body).toContain('https://www.ologywood.com/portfolio-video/video-test-2');
    expect(response.body).toContain('Thumbnail for Video test by Adonis');
  });

  it('does not render video metadata for a removed or missing clip', async () => {
    getDbMock.mockResolvedValue({
      select: vi.fn(() => createPortfolioSelectChain([])),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/portfolio-video/private-clip-999'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.send).not.toHaveBeenCalled();
    expect(response.body).toBe('');
  });
});
