import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock('../db', () => ({
  getDb: getDbMock,
}));

import { ogTagMiddleware } from '../middleware/ogTags';

function createResponse() {
  const response: any = {
    statusCode: 200,
    body: '',
    contentType: '',
  };
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
    headers: {
      'user-agent': 'facebookexternalhit/1.1',
    },
    get: (name: string) => {
      if (name.toLowerCase() === 'user-agent') return 'facebookexternalhit/1.1';
      if (name.toLowerCase() === 'host') return 'www.ologywood.com';
      return '';
    },
  };
}

function createSelectChain(result: any[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(async () => result),
      })),
    })),
  };
}

describe('merch product Open Graph middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'https://www.ologywood.com';
  });

  it('renders product image, creator, canonical URL, and native USD price metadata', async () => {
    const product = {
      id: 42,
      userId: 7,
      userType: 'artist',
      title: 'Tour Hoodie',
      description: 'Official limited-run tour hoodie.',
      priceDisplay: '$45.00',
      priceInCents: 4500,
      imageUrls: ['https://cdn.example.com/tour-hoodie.webp'],
      isActive: true,
    };
    const seller = { name: 'Adonis' };
    let selectCall = 0;
    getDbMock.mockResolvedValue({
      select: vi.fn(() => createSelectChain(selectCall++ === 0 ? [product] : [seller])),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/merch/tour-hoodie-42'), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(response.contentType).toBe('text/html');
    expect(response.body).toContain('<meta property="og:type" content="product" />');
    expect(response.body).toContain('Tour Hoodie — $45.00 | Adonis');
    expect(response.body).toContain('https://www.ologywood.com/api/og-image/merch/42');
    expect(response.body).toContain('https://www.ologywood.com/merch/tour-hoodie-42');
    expect(response.body).toContain('<meta property="product:price:amount" content="45.00" />');
    expect(response.body).toContain('<meta property="product:price:currency" content="USD" />');
  });

  it('does not render product metadata for an inactive or missing item', async () => {
    getDbMock.mockResolvedValue({
      select: vi.fn(() => createSelectChain([])),
    });

    const response = createResponse();
    const next = vi.fn();
    await ogTagMiddleware()(createRequest('/merch/private-shirt-999'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.send).not.toHaveBeenCalled();
    expect(response.body).toBe('');
  });
});
