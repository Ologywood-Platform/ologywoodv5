import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getPool: vi.fn(),
  ensureSchema: vi.fn(),
  fetchCiphertext: vi.fn(),
  decrypt: vi.fn(),
  authorizeBooking: vi.fn(),
}));

vi.mock('./_core/sdk', () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock('./db', () => ({ getPool: mocks.getPool }));
vi.mock('./services/riderDocumentSchemaService', () => ({ ensureRiderDocumentSchema: mocks.ensureSchema }));
vi.mock('./services/riderDocumentStorage', () => ({ fetchEncryptedRiderObject: mocks.fetchCiphertext }));
vi.mock('./services/riderDocumentService', () => ({ decryptRiderDocumentBytes: mocks.decrypt }));
vi.mock('./services/bookingRiderDocumentService', () => ({
  authorizeBookingRiderDocumentDownload: mocks.authorizeBooking,
}));

import riderDocumentsRoute from './routes/riderDocuments';

const version = {
  id: 30,
  ownerUserId: 100,
  storageKey: 'private/rider-documents/100/secure.bin',
  fileName: 'Rider \"Spring\".pdf',
  byteSize: 123,
  pageCount: 1,
};

type RouteState = { missing?: boolean; membership?: unknown | (() => unknown) };
function connection(state: RouteState = {}) {
  const calls: string[] = [];
  const execute = vi.fn(async (sql: string) => {
    calls.push(sql);
    if (sql.startsWith('SET TRANSACTION')) return [[], {}];
    if (sql.includes('SELECT ownerUserId FROM rider_document_versions')) return [state.missing ? [] : [{ ownerUserId: 100 }], {}];
    if (sql.startsWith('SELECT id FROM users WHERE id IN')) return [[], {}];
    if (sql.includes('FROM artist_profiles WHERE userId')) return [[{ id: 50, userId: 100, artistName: 'Talent' }], {}];
    if (sql.includes('SELECT id FROM artist_team_members WHERE userId')) return [[], {}];
    if (sql.includes('FROM artist_team_members')) {
      const permissions = typeof state.membership === 'function' ? state.membership() : state.membership ?? {};
      return [[{ permissions }], {}];
    }
    if (sql.includes('SELECT id, openId, email, emailVerified FROM users')) return [[{ id: 100, email: 'talent@example.invalid', emailVerified: false }], {}];
    if (sql.includes('FROM user_subscriptions') || sql.includes('FROM complimentary_access_grants')) return [[], {}];
    if (sql.includes('rider_document_versions') && sql.includes('storageKey') && sql.includes('FOR UPDATE')) {
      return [state.missing ? [] : [version], {}];
    }
    throw new Error(`Unexpected route-test SQL: ${sql}`);
  });
  return {
    calls,
    execute,
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  };
}

function app() {
  const server = express();
  server.use('/api/rider-documents', riderDocumentsRoute);
  return server;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authenticateRequest.mockResolvedValue({ id: 100 });
  mocks.ensureSchema.mockResolvedValue(undefined);
  mocks.fetchCiphertext.mockResolvedValue(Buffer.from('ciphertext-only-mock'));
  mocks.decrypt.mockReturnValue(Buffer.from('%PDF-1.7 safe bytes'));
  mocks.authorizeBooking.mockResolvedValue({
    storageKey: version.storageKey,
    fileName: version.fileName,
    byteSize: version.byteSize,
    pageCount: version.pageCount,
    title: 'Frozen rider',
  });
});

describe('private rider PDF download route (fully mocked external boundaries)', () => {
  it('returns 401 before pool/schema/ciphertext work when SDK authentication fails', async () => {
    mocks.authenticateRequest.mockRejectedValue(new Error('synthetic unauthenticated request'));
    const response = await request(app()).get('/api/rider-documents/30');
    expect(response.status).toBe(401);
    expect(mocks.getPool).not.toHaveBeenCalled();
    expect(mocks.fetchCiphertext).not.toHaveBeenCalled();
  });

  it('returns 404 for an absent version without decrypting or fetching a private object', async () => {
    const conn = connection({ missing: true });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const response = await request(app()).get('/api/rider-documents/30');
    expect(response.status).toBe(404);
    expect(mocks.fetchCiphertext).not.toHaveBeenCalled();
    expect(mocks.decrypt).not.toHaveBeenCalled();
    expect(conn.rollback).toHaveBeenCalledOnce();
  });

  it('returns 403 to an arbitrary authenticated admin-like user; no library-admin bypass exists', async () => {
    const conn = connection({ membership: { manageRiders: false, role: 'admin' } });
    mocks.authenticateRequest.mockResolvedValue({ id: 999, role: 'admin' });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const response = await request(app()).get('/api/rider-documents/30');
    expect(response.status).toBe(403);
    expect(mocks.fetchCiphertext).not.toHaveBeenCalled();
    expect(mocks.decrypt).not.toHaveBeenCalled();
  });

  it('uses secure default attachment headers and switches only Content-Disposition to inline preview', async () => {
    for (const suffix of ['', '?preview=1']) {
      const conn = connection();
      mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
      const response = await request(app()).get(`/api/rider-documents/30${suffix}`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/pdf/);
      expect(response.headers['content-disposition']).toMatch(suffix ? /^inline;/ : /^attachment;/);
      expect(response.headers['cache-control']).toMatch(/no-store/);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toMatch(/^sandbox;/);
      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(response.headers.pragma).toBe('no-cache');
      expect(response.headers.expires).toBe('0');
    }
  });

  it('locks actor/owner users through live access before locking the version row', async () => {
    const conn = connection();
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const response = await request(app()).get('/api/rider-documents/30');
    expect(response.status).toBe(200);
    const userLock = conn.calls.findIndex((sql) => sql.startsWith('SELECT id FROM users WHERE id IN'));
    const versionLock = conn.calls.findIndex((sql) => sql.includes('FROM rider_document_versions') && sql.includes('FOR UPDATE'));
    expect(userLock).toBeGreaterThan(-1);
    expect(versionLock).toBeGreaterThan(userLock);
  });

  it('rechecks authorization after mocked private I/O and denies a manager revoked during fetch', async () => {
    let checks = 0;
    const conn = connection({ membership: () => (checks++ === 0 ? JSON.stringify({ manageRiders: true }) : JSON.stringify({ manageRiders: false })) });
    mocks.authenticateRequest.mockResolvedValue({ id: 101 });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const response = await request(app()).get('/api/rider-documents/30');
    expect(response.status).toBe(403);
    expect(mocks.fetchCiphertext).toHaveBeenCalledWith(version.storageKey);
    expect(mocks.decrypt).not.toHaveBeenCalled();
    expect(conn.rollback).toHaveBeenCalledOnce();
  });

  it('delegates booking paths to the immutable booking helper with the exact booking/version IDs and rechecks it after I/O', async () => {
    const conn = connection();
    mocks.authenticateRequest.mockResolvedValue({ id: 77 });
    mocks.getPool.mockReturnValue({ getConnection: vi.fn().mockResolvedValue(conn) });
    const response = await request(app()).get('/api/rider-documents/30?bookingId=900');
    expect(response.status).toBe(200);
    expect(mocks.authorizeBooking).toHaveBeenCalledTimes(2);
    expect(mocks.authorizeBooking).toHaveBeenNthCalledWith(1, conn, 77, 900, 30);
    expect(mocks.authorizeBooking).toHaveBeenNthCalledWith(2, conn, 77, 900, 30);
    expect(mocks.fetchCiphertext).toHaveBeenCalledWith(version.storageKey);
    expect(mocks.decrypt).toHaveBeenCalledWith(expect.any(Buffer), 100, version.storageKey);
  });
});
