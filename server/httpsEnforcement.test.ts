import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { installHttpsRedirect } from './middleware/httpsRedirect';

const runtimeEntrypoint = readFileSync(resolve(process.cwd(), 'server/_core/index.ts'), 'utf8');
const securityHeaders = readFileSync(resolve(process.cwd(), 'server/middleware/securityHeaders.ts'), 'utf8');
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe('HTTPS enforcement', () => {
  it('is installed by the actual server/_core/index.ts entrypoint', () => {
    expect(runtimeEntrypoint).toContain("import { installHttpsRedirect } from \"../middleware/httpsRedirect\";");
    expect(runtimeEntrypoint).toContain('installHttpsRedirect(app);');
  });

  it('redirects insecure production GET requests and preserves host/path/query', async () => {
    process.env.NODE_ENV = 'production';
    const app = express();
    installHttpsRedirect(app);
    app.get('/health', (_req, res) => res.json({ ok: true }));

    const response = await request(app)
      .get('/health?source=browser')
      .set('Host', 'www.ologywood.com');

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe('https://www.ologywood.com/health?source=browser');
  });

  it('passes non-GET API requests through and accepts forwarded HTTPS', async () => {
    process.env.NODE_ENV = 'production';
    const app = express();
    installHttpsRedirect(app);
    app.post('/api/test', (_req, res) => res.json({ ok: true }));

    const insecurePost = await request(app).post('/api/test').set('Host', 'www.ologywood.com');
    const forwardedHttpsPost = await request(app)
      .post('/api/test')
      .set('Host', 'www.ologywood.com')
      .set('x-forwarded-proto', 'https');

    expect(insecurePost.status).toBe(200);
    expect(forwardedHttpsPost.status).toBe(200);
  });

  it('keeps the redirect disabled outside production and sets HSTS', async () => {
    process.env.NODE_ENV = 'development';
    const app = express();
    installHttpsRedirect(app);
    app.get('/health', (_req, res) => res.json({ ok: true }));

    const response = await request(app).get('/health').set('Host', 'localhost:3000');

    expect(response.status).toBe(200);
    expect(securityHeaders).toContain("Strict-Transport-Security");
    expect(securityHeaders).toContain('max-age=31536000; includeSubDomains; preload');
  });
});
