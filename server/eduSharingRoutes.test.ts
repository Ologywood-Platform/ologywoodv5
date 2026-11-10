import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
const { getDb } = vi.hoisted(() => ({ getDb: vi.fn(async () => { throw new Error('EDU sharing must not read the database'); }) }));
vi.mock('./db', () => ({ getDb }));
import { ogTagMiddleware } from './middleware/ogTags';
import ogPageRoutes from './routes/ogPage';
import { EDU_SHARE_TITLE, EDU_SHARE_URL, EDU_SHARE_IMAGE } from '../shared/eduShare';

async function request(path: string, userAgent: string, method = 'GET') {
  const app = express(); app.use('/api/og-page', ogPageRoutes); app.use(ogTagMiddleware());
  app.use((_req, res) => res.status(200).send('normal app route'));
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  try {
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, { method, headers: { 'User-Agent': userAgent, Host: 'hostile.example', 'X-Forwarded-Host': 'hostile.example' } });
    return { status: response.status, body: await response.text(), contentType: response.headers.get('content-type'), cache: response.headers.get('cache-control') };
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
describe('EDU social sharing public HTTP routes', () => {
  it.each(['facebookexternalhit/1.1', 'Facebot', 'LinkedInBot/1.0', 'Twitterbot/1.0', 'WhatsApp/2.0', 'Slackbot-LinkExpanding', 'iMessageLinkPreview'])('returns EDU metadata for %s without storage or Host trust', async ua => {
    const result = await request('/edu?campaign=school', ua);
    expect(result.status).toBe(200); expect(result.body).toContain(EDU_SHARE_TITLE);
    expect(result.body).toContain(`property="og:url" content="${EDU_SHARE_URL}"`);
    expect(result.body).toContain(`property="og:image" content="${EDU_SHARE_IMAGE}"`);
    expect(result.body).not.toContain('hostile.example'); expect(getDb).not.toHaveBeenCalled();
  });
  it('covers trailing slash and HEAD without leaking a response body', async () => {
    expect((await request('/edu/', 'LinkedInBot')).body).toContain(EDU_SHARE_TITLE);
    const head = await request('/edu', 'LinkedInBot', 'HEAD'); expect(head.status).toBe(200); expect(head.body).toBe(''); expect(head.contentType).toContain('text/html');
  });
  it.each(['/edu/apply?path=school', '/edu/verify', '/admin/edu'])('does not treat %s as the public EDU landing page', async path => {
    expect((await request(path, 'facebookexternalhit')).body).toBe('normal app route'); expect(getDb).not.toHaveBeenCalled();
  });
  it('does not intercept mutation methods or normal browser app rendering', async () => {
    expect((await request('/edu', 'Facebookexternalhit', 'POST')).body).toBe('normal app route');
    expect((await request('/edu', 'Mozilla/5.0')).body).toBe('normal app route');
  });
  it('exposes a DB-independent API share fallback and redirects human readers to EDU, never home', async () => {
    const result = await request('/api/og-page/edu', 'Mozilla/5.0');
    expect(result.status).toBe(200); expect(result.body).toContain(EDU_SHARE_TITLE);
    expect(result.body).toContain(`window.location.replace("${EDU_SHARE_URL}")`);
    expect(result.body).toContain(`href="${EDU_SHARE_URL}"`); expect(result.cache).toContain('no-store');
    expect(getDb).not.toHaveBeenCalled();
  });
  it('wires the current build shell and both browser/prod metadata paths without changing home', () => {
    expect(readFileSync('package.json', 'utf8')).toContain('tsx scripts/buildEduShareShell.ts');
    const builder = readFileSync('scripts/buildEduShareShell.ts', 'utf8');
    expect(builder).toContain("readFileSync(resolve(publicDirectory, 'index.html')"); expect(builder).toContain("'edu/index.html'");
    const server = readFileSync('server/_core/vite.ts', 'utf8');
    expect(server).toContain("app.get(['/edu', '/edu/']"); expect(server).toContain('template = injectEduShareMeta(template)');
    expect(readFileSync('client/src/pages/Edu.tsx', 'utf8')).toContain('canonical: EDU_SHARE_URL');
  });
});
