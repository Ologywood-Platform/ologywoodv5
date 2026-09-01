import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock('../db', () => ({ getDb: getDbMock }));

import { ogTagMiddleware } from '../middleware/ogTags';

function createResponse() {
  const response: any = { statusCode: 200, body: '', contentType: '' };
  response.status = vi.fn((code: number) => { response.statusCode = code; return response; });
  response.set = vi.fn((name: string, value: string) => {
    if (name.toLowerCase() === 'content-type') response.contentType = value;
    return response;
  });
  response.send = vi.fn((body: string) => { response.body = body; return response; });
  return response;
}

function createRequest(path: string): any {
  return {
    path,
    headers: { 'user-agent': 'facebookexternalhit/1.1' },
    get: (name: string) => name.toLowerCase() === 'host' ? 'www.ologywood.com' : 'facebookexternalhit/1.1',
  };
}

function postChain(posts: any[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(async () => posts) })),
    })),
  };
}

describe('Blog Open Graph middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://www.ologywood.com';
  });

  it('renders a published launch article with an absolute campaign-cover URL', async () => {
    getDbMock.mockResolvedValue({
      select: vi.fn(() => postChain([{
        id: 8,
        slug: 'books-and-sandbox-post-launch',
        title: 'From Bookings to Book Sales',
        excerpt: 'Meet Books in Creator Shop and Sandbox Post.',
        coverImageUrl: '/manus-storage/ologywood-books-sandbox-post-launch_27b20296.png',
      }])),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/blog/books-and-sandbox-post-launch'), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<meta property="og:type" content="article" />');
    expect(response.body).toContain('https://www.ologywood.com/manus-storage/ologywood-books-sandbox-post-launch_27b20296.png');
    expect(response.body).toContain('https://www.ologywood.com/blog/books-and-sandbox-post-launch');
  });

  it('preserves an already absolute Blog cover URL', async () => {
    getDbMock.mockResolvedValue({
      select: vi.fn(() => postChain([{
        id: 9,
        slug: 'external-cover',
        title: 'External Cover',
        excerpt: 'Existing cover behavior.',
        coverImageUrl: 'https://cdn.example.com/blog-cover.jpg',
      }])),
    });

    const response = createResponse();
    await ogTagMiddleware()(createRequest('/blog/external-cover'), response, vi.fn());
    expect(response.body).toContain('https://cdn.example.com/blog-cover.jpg');
    expect(response.body).not.toContain('https://www.ologywood.comhttps://cdn.example.com');
  });
});
