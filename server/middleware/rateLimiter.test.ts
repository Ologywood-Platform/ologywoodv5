import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimiter';

describe('HTTP rate-limit middleware', () => {
  const previousUrl = process.env.REDIS_URL;
  const previousHost = process.env.REDIS_HOST;

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previousUrl;
    if (previousHost === undefined) delete process.env.REDIS_HOST;
    else process.env.REDIS_HOST = previousHost;
  });

  it('uses the shared limiter contract and falls back locally when Redis is not configured', async () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;

    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, maxRequests: 1 }));
    app.get('/limited', (_req, res) => res.json({ ok: true }));

    const first = await request(app).get('/limited');
    expect(first.status).toBe(200);
    expect(first.headers['x-ratelimit-limit']).toBe('1');
    expect(first.headers['x-ratelimit-remaining']).toBe('0');

    const second = await request(app).get('/limited');
    expect(second.status).toBe(429);
    expect(second.body.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('preserves configured skips', async () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;

    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, maxRequests: 1, skip: () => true }));
    app.get('/skipped', (_req, res) => res.json({ ok: true }));

    const responses = await Promise.all([
      request(app).get('/skipped'),
      request(app).get('/skipped'),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
  });
});
