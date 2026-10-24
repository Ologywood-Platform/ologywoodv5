import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { globalErrorHandler } from './error-handler';

describe('upload API parser errors', () => {
  it('returns JSON 413 without echoed request content or internal details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = express();
    app.use(express.json({ limit: '1kb' }));
    app.post('/api/upload', (_req, res) => res.json({ success: true }));
    app.use(globalErrorHandler);
    const response = await request(app).post('/api/upload').send({ secret: 'private-input-'.repeat(200) });
    expect(response.status).toBe(413);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(JSON.stringify(response.body)).not.toContain('private-input');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-input');
    log.mockRestore();
  });
  it('returns JSON 400 for malformed JSON and does not fake an upload result', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = express();
    app.use(express.json());
    app.post('/api/upload', (_req, res) => res.json({ success: true }));
    app.use(globalErrorHandler);
    const response = await request(app).post('/api/upload').set('Content-Type', 'application/json').send('{not-json');
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_JSON');
    log.mockRestore();
  });
});
