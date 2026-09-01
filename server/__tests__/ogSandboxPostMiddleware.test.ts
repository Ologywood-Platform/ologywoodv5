import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('../db', () => ({ getDb: getDbMock }));
vi.mock('../services/sandboxPostSchemaService', () => ({ ensureSandboxPostSchema: vi.fn() }));

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

function candidateChain(candidates: any[]) {
  return { from: vi.fn(async () => candidates) };
}

function joinedPostChain(posts: any[]) {
  return {
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn(async () => posts) })),
        })),
      })),
    })),
  };
}

function membershipChain(memberships: any[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(async () => memberships) })),
    })),
  };
}

describe('Sandbox Post Open Graph middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://www.ologywood.com';
  });

  it('renders the active current post at the clean talent URL with its post image', async () => {
    const post = {
      id: 81,
      content: 'Sketching the next chapter today.',
      mediaType: 'image',
      mediaUrl: 'https://cdn.example.com/current-sketch.webp',
      mediaThumbnailUrl: null,
      artistUserId: 7,
      artistName: 'Dawud Anyabwile',
      profilePhotoUrl: 'https://cdn.example.com/dawud.webp',
    };
    let call = 0;
    getDbMock.mockResolvedValue({
      select: vi.fn(() => {
        call += 1;
        if (call === 1) return candidateChain([{ id: 12, artistName: 'Dawud Anyabwile' }]);
        if (call === 2) return joinedPostChain([post]);
        return membershipChain([]);
      }),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/artist/dawud-anyabwile/sandbox'), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toBe('text/html');
    expect(response.body).toContain("Dawud Anyabwile's Sandbox Post | OlogyWood");
    expect(response.body).toContain('https://www.ologywood.com/artist/dawud-anyabwile/sandbox');
    expect(response.body).toContain('https://www.ologywood.com/api/og-image/sandbox-post/81');
    expect(response.body).toContain('<meta property="og:type" content="article" />');
  });

  it('does not render post metadata when the current post is missing or hidden', async () => {
    let call = 0;
    getDbMock.mockResolvedValue({
      select: vi.fn(() => {
        call += 1;
        return call === 1
          ? candidateChain([{ id: 12, artistName: 'Dawud Anyabwile' }])
          : joinedPostChain([]);
      }),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/artist/dawud-anyabwile/sandbox'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.send).not.toHaveBeenCalled();
  });

  it('does not render post metadata for a non-owner team-member account', async () => {
    let call = 0;
    getDbMock.mockResolvedValue({
      select: vi.fn(() => {
        call += 1;
        if (call === 1) return candidateChain([{ id: 99, artistName: 'Test Profile' }]);
        if (call === 2) return joinedPostChain([{
          id: 90,
          content: 'Not public.',
          mediaType: null,
          mediaUrl: null,
          mediaThumbnailUrl: null,
          artistUserId: 55,
          artistName: 'Test Profile',
          profilePhotoUrl: null,
        }]);
        return membershipChain([{ id: 1 }]);
      }),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/artist/test-profile/sandbox'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.send).not.toHaveBeenCalled();
  });
});
