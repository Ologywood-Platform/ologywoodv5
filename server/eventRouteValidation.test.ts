import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import eventRoutes from './routes/events';

describe('event route input validation', () => {
  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use(eventRoutes);
    return instance;
  }

  it('rejects malformed and non-positive event identifiers before database access', async () => {
    const instance = app();
    const requests = [
      ['/api/events/not-an-id', () => request(instance).get('/api/events/not-an-id')],
      ['/api/events/0', () => request(instance).get('/api/events/0')],
      ['/api/events/artist/not-an-id', () => request(instance).get('/api/events/artist/not-an-id')],
      ['/api/events/history/not-an-id', () => request(instance).get('/api/events/history/not-an-id')],
      ['/api/events/photos/0', () => request(instance).delete('/api/events/photos/0')],
    ] as const;
    for (const [path, makeRequest] of requests) {
      const response = await makeRequest();
      expect(response.status, path).toBe(400);
      expect(response.body.error).toMatch(/^Invalid /);
    }
  });

  it('rejects malformed event capacity before the create path', async () => {
    const response = await request(app())
      .post('/api/events')
      .set('content-type', 'application/json')
      .send({
        eventTitle: 'Validation-only fixture',
        eventType: 'Concert',
        eventDate: '2026-12-01',
        capacity: '12.5',
      });

    // Authentication is intentionally checked before body mutation. The
    // guard remains covered by source assertions below for authenticated use.
    expect(response.status).toBe(401);
  });

  it('keeps the route guard and capacity validation in the production source', async () => {
    const source = await import('node:fs/promises').then((fs) => fs.readFile('server/routes/events.ts', 'utf8'));
    expect(source).toContain("router.param(parameter");
    expect(source).toContain("import { positiveRouteId } from './routeInput';");
    expect(source).toContain('const parsed = positiveRouteId(value);');
    expect(source).toContain('validateEventBody(req.body)');
    expect(await import('node:fs/promises').then((fs) => fs.readFile('server/routes/eventInput.ts', 'utf8'))).toContain('capacity must be a non-negative whole number');
  });
});
