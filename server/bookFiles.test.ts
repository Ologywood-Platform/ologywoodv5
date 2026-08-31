import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  execute: vi.fn(),
  ensureSchema: vi.fn(),
  storagePut: vi.fn(),
  storageGet: vi.fn(),
}));

vi.mock('./_core/sdk', () => ({
  sdk: { authenticateRequest: mocks.authenticateRequest },
}));

vi.mock('./db', () => ({
  getPool: () => ({ execute: mocks.execute }),
}));

vi.mock('./services/merchSchemaService', () => ({
  ensureMerchItemsSchema: mocks.ensureSchema,
}));

vi.mock('./storage', () => ({
  storagePut: mocks.storagePut,
  storageGet: mocks.storageGet,
}));

import bookFilesRouter from './routes/bookFiles';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/books', bookFilesRouter);
  return app;
}

describe('private eBook file routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: 7, email: 'reader@example.com' });
    mocks.ensureSchema.mockResolvedValue(undefined);
    mocks.storagePut.mockResolvedValue({ key: 'ebooks/7/12/book.pdf', url: 'https://private.example/book.pdf' });
    mocks.storageGet.mockResolvedValue({ key: 'ebooks/7/12/book.pdf', url: 'https://signed.example/download?token=secret' });
  });

  it('requires authentication before accepting an eBook upload', async () => {
    mocks.authenticateRequest.mockRejectedValue(new Error('unauthorized'));

    const response = await request(makeApp())
      .post('/api/books/upload/12')
      .field('rightsConfirmed', 'true')
      .attach('ebook', Buffer.from('%PDF-1.7'), { filename: 'book.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(401);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it('requires an explicit rights affirmation before storing an eBook', async () => {
    const response = await request(makeApp())
      .post('/api/books/upload/12')
      .attach('ebook', Buffer.from('%PDF-1.7'), { filename: 'book.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/own or control the rights/i);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it('stores an owned PDF under a private randomized key and returns no storage key or URL', async () => {
    mocks.execute
      .mockResolvedValueOnce([[{ id: 12, userId: 7, productCategory: 'book', bookFormat: 'ebook' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(makeApp())
      .post('/api/books/upload/12')
      .field('rightsConfirmed', 'true')
      .attach('ebook', Buffer.from('%PDF-1.7'), { filename: 'My Book.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(200);
    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^ebooks\/7\/12\/[0-9a-f-]+-My-Book\.pdf$/),
      expect.any(Buffer),
      'application/pdf',
    );
    expect(response.body).toEqual({ success: true, fileName: 'My-Book.pdf', fileSize: 8, fileFormat: 'pdf' });
    expect(response.body).not.toHaveProperty('key');
    expect(response.body).not.toHaveProperty('url');
  });

  it('does not issue a download for another buyer', async () => {
    mocks.execute.mockResolvedValueOnce([[
      {
        id: 22,
        buyerUserId: 8,
        buyerEmail: 'other@example.com',
        downloadCount: 0,
        maxDownloads: 5,
        status: 'active',
        paymentStatus: 'paid',
        ebookFileKey: 'ebooks/8/12/book.pdf',
        ebookFileName: 'book.pdf',
      },
    ]]);

    const response = await request(makeApp()).get('/api/books/download/22');

    expect(response.status).toBe(403);
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('does not issue a download after refund revocation', async () => {
    mocks.execute.mockResolvedValueOnce([[
      {
        id: 22,
        buyerUserId: 7,
        buyerEmail: 'reader@example.com',
        downloadCount: 0,
        maxDownloads: 5,
        status: 'refunded',
        paymentStatus: 'refunded',
        ebookFileKey: 'ebooks/7/12/book.pdf',
        ebookFileName: 'book.pdf',
      },
    ]]);

    const response = await request(makeApp()).get('/api/books/download/22');

    expect(response.status).toBe(404);
    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('enforces the download limit atomically before returning a signed URL', async () => {
    mocks.execute
      .mockResolvedValueOnce([[
        {
          id: 22,
          buyerUserId: 7,
          buyerEmail: 'reader@example.com',
          downloadCount: 4,
          maxDownloads: 5,
          status: 'active',
          paymentStatus: 'paid',
          ebookFileKey: 'ebooks/7/12/book.pdf',
          ebookFileName: 'book.pdf',
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(makeApp()).get('/api/books/download/22');

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty('downloadUrl');
  });

  it('returns a signed URL and safe counters only to the verified buyer', async () => {
    mocks.execute
      .mockResolvedValueOnce([[
        {
          id: 22,
          buyerUserId: 7,
          buyerEmail: 'reader@example.com',
          downloadCount: 0,
          maxDownloads: 5,
          status: 'active',
          paymentStatus: 'paid',
          ebookFileKey: 'ebooks/7/12/book.pdf',
          ebookFileName: 'book.pdf',
        },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ downloadCount: 1, maxDownloads: 5 }]]);

    const response = await request(makeApp()).get('/api/books/download/22');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      downloadUrl: 'https://signed.example/download?token=secret',
      fileName: 'book.pdf',
      downloadsUsed: 1,
      downloadsRemaining: 4,
    });
    expect(response.body).not.toHaveProperty('ebookFileKey');
  });
});
