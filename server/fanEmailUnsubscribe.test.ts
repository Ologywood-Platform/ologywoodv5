import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  unsubscribeAllEmailPreferencesByToken: vi.fn(),
  getFanUnsubscribeStatus: vi.fn(),
  unsubscribeFanByToken: vi.fn(),
}));

vi.mock('./db', () => ({
  unsubscribeAllEmailPreferencesByToken: mocks.unsubscribeAllEmailPreferencesByToken,
}));
vi.mock('./services/fanEmailConsentService', () => ({
  getFanUnsubscribeStatus: mocks.getFanUnsubscribeStatus,
  unsubscribeFanByToken: mocks.unsubscribeFanByToken,
}));

import unsubscribeRoutes from './routes/unsubscribeRoutes';

function app() {
  const instance = express();
  instance.use(express.urlencoded({ extended: false, limit: '8kb' }));
  instance.use(express.json({ limit: '8kb' }));
  instance.use('/api/email', unsubscribeRoutes);
  return instance;
}

beforeEach(() => {
  mocks.unsubscribeAllEmailPreferencesByToken.mockReset();
  mocks.getFanUnsubscribeStatus.mockReset();
  mocks.unsubscribeFanByToken.mockReset();
});

describe('fan email unsubscribe routes', () => {
  it('shows a no-store generic scoped confirmation on GET and never mutates', async () => {
    mocks.getFanUnsubscribeStatus.mockResolvedValue({ valid: true, scope: 'creator_updates' });
    const response = await request(app()).get('/api/email/unsubscribe?fanToken=signed-capability');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.text).toContain('Unsubscribe from creator updates?');
    expect(response.text).not.toContain('creatorId');
    expect(mocks.unsubscribeFanByToken).not.toHaveBeenCalled();
    expect(mocks.unsubscribeAllEmailPreferencesByToken).not.toHaveBeenCalled();
  });

  it('uses a scoped fan token only for creator updates on POST (including RFC 8058 query form)', async () => {
    mocks.unsubscribeFanByToken.mockResolvedValue(true);
    const response = await request(app())
      .post('/api/email/unsubscribe?fanToken=current-signed-capability')
      .set('List-Unsubscribe', '<https://www.ologywood.com/api/email/unsubscribe?fanToken=current-signed-capability>')
      .set('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('no-store');
    expect(mocks.unsubscribeFanByToken).toHaveBeenCalledWith('current-signed-capability');
    expect(mocks.unsubscribeAllEmailPreferencesByToken).not.toHaveBeenCalled();
    expect(response.text).toContain('Unsubscribed from creator updates');
  });

  it('does not treat replayed/stale scoped tokens as a successful broader opt-out', async () => {
    mocks.unsubscribeFanByToken.mockResolvedValue(false);
    const response = await request(app())
      .post('/api/email/unsubscribe')
      .type('form')
      .send({ fanToken: 'stale-capability', token: 'legacy-token' });
    expect(response.status).toBe(404);
    expect(mocks.unsubscribeFanByToken).toHaveBeenCalledWith('stale-capability');
    expect(mocks.unsubscribeAllEmailPreferencesByToken).not.toHaveBeenCalled();
  });

  it('keeps a legacy opaque token valid but confirms on GET and mutates only on POST', async () => {
    const get = await request(app()).get('/api/email/unsubscribe?token=opaque-legacy-token');
    expect(get.status).toBe(200);
    expect(get.text).toContain('Unsubscribe from all emails?');
    expect(mocks.unsubscribeAllEmailPreferencesByToken).not.toHaveBeenCalled();

    mocks.unsubscribeAllEmailPreferencesByToken.mockResolvedValue(true);
    const post = await request(app()).post('/api/email/unsubscribe').type('form').send({ token: 'opaque-legacy-token' });
    expect(post.status).toBe(200);
    expect(mocks.unsubscribeAllEmailPreferencesByToken).toHaveBeenCalledWith('opaque-legacy-token');
  });

  it('never authorizes old email or userId links', async () => {
    const get = await request(app()).get('/api/email/unsubscribe?email=fan%40example.test');
    const post = await request(app()).post('/api/email/unsubscribe').type('form').send({ userId: '7' });
    expect(get.status).toBe(401);
    expect(post.status).toBe(401);
    expect(mocks.unsubscribeFanByToken).not.toHaveBeenCalled();
    expect(mocks.unsubscribeAllEmailPreferencesByToken).not.toHaveBeenCalled();
  });
});
