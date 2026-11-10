import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
const mocks = vi.hoisted(() => ({ verifySession: vi.fn() }));
vi.mock('../_core/sdk', () => ({ sdk: { verifySession: mocks.verifySession } }));
vi.mock('../db', () => ({ getDb: vi.fn() }));
vi.mock('../services/freeTrialService', () => ({ FreeTrialService: {} }));
vi.mock('../services/pricingTierService', () => ({ getUserSubscription: vi.fn() }));
vi.mock('../utils/persistAvatar', () => ({ persistAvatarToS3: vi.fn() }));
import authRouter from '../routes/spotifyAuth';
const app = express(); app.use(express.json()); app.use('/api/auth', authRouter);

beforeEach(() => { vi.clearAllMocks(); mocks.verifySession.mockResolvedValue(null); });
describe('Exchange Token Endpoint (offline HTTP and mocked session verification)', () => {
  it('rejects a missing token without attempting verification or setting cookies', async () => {
    const response = await request(app).post('/api/auth/exchange-token').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing token');
    expect(mocks.verifySession).not.toHaveBeenCalled();
    expect(response.headers['set-cookie']).toBeUndefined();
  });
  it('rejects invalid tokens without setting a cookie', async () => {
    const response = await request(app).post('/api/auth/exchange-token').send({ token: 'invalid-unit-token' });
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
  it('rejects non-string token values before session verification', async () => {
    const response = await request(app).post('/api/auth/exchange-token').send({ token: 12345 });
    expect(response.status).toBe(400);
    expect(mocks.verifySession).not.toHaveBeenCalled();
  });
  it('returns a safe failure if the verification dependency is unavailable', async () => {
    mocks.verifySession.mockRejectedValue(new Error('fixture failure'));
    const response = await request(app).post('/api/auth/exchange-token').send({ token: 'fixture' });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Token exchange failed' });
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
