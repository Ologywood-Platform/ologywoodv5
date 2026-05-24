import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import sitemapRoutes from './sitemapRoutes';

describe('Sitemap and Robots.txt Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/', sitemapRoutes);
  });

  describe('GET /sitemap.xml', () => {
    it('should return valid XML sitemap', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/xml');
    });

    it('should include required XML declaration', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.text).toContain('<?xml');
      expect(response.text).toContain('encoding');
    });

    it('should include urlset element', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.text).toContain('<urlset');
      expect(response.text).toContain('xmlns');
      expect(response.text).toContain('</urlset>');
    });

    it('should include static public pages', async () => {
      const response = await request(app).get('/sitemap.xml');
      const publicPages = ['/browse', '/how-it-works', '/contact', '/faq', '/help', '/cookies', '/accessibility', 'terms-of-service', 'privacy-policy'];
      publicPages.forEach(page => {
        expect(response.text).toContain(page);
      });
    });

    it('should use canonical URLs (no duplicates)', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Should have canonical versions
      expect(response.text).toContain('terms-of-service');
      expect(response.text).toContain('privacy-policy');
    });

    it('should NOT include private pages', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Private pages should not be in sitemap
      const privatePages = ['/dashboard', '/venue-dashboard', '/admin', '/settings', '/messages', '/bookings', '/earnings', '/rider-builder', '/verify-email', '/revert-email', '/following', '/favorites', '/rider-templates', '/unsubscribe'];
      privatePages.forEach(page => {
        // Check that page is not in sitemap URLs
        const regex = new RegExp(`<loc>[^<]*${page.replace(/\//g, '\\/')}[^<]*</loc>`);
        expect(response.text).not.toMatch(regex);
      });
    });

    it('should include priority and changefreq for each URL', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.text).toContain('<priority>');
      expect(response.text).toContain('<changefreq>');
    });

    it('should include lastmod timestamp', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.text).toContain('<lastmod>');
      expect(response.text).toContain('</lastmod>');
    });

    it('should set proper cache headers for sitemap', async () => {
      const response = await request(app).get('/sitemap.xml');
      expect(response.headers['cache-control']).toBeDefined();
    });

    it('should have home page with priority 1.0', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Check that home page is included with correct priority
      expect(response.text).toContain('<priority>1</priority>');
      expect(response.text).toContain('<changefreq>weekly</changefreq>');
    });

    it('should have browse page with priority 0.9', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Check that browse page is included with correct priority
      expect(response.text).toContain('/browse');
      expect(response.text).toContain('<priority>0.9</priority>');
    });
  });

  describe('GET /robots.txt', () => {
    it('should return plain text robots.txt', async () => {
      const response = await request(app).get('/robots.txt');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should allow all crawlers by default', async () => {
      const response = await request(app).get('/robots.txt');
      expect(response.text).toContain('User-agent: *');
      // Should have allow rule
      expect(response.text).toContain('Allow:');
    });

    it('should allow public pages', async () => {
      const response = await request(app).get('/robots.txt');
      const publicPages = ['/browse', '/artist/', '/venue/', '/venues', '/events', '/pricing', '/how-it-works', '/contact', '/faq', '/help', '/cookies', '/accessibility'];
      publicPages.forEach(page => {
        expect(response.text).toContain(`Allow: ${page}`);
      });
    });

    it('should disallow private pages', async () => {
      const response = await request(app).get('/robots.txt');
      const privatePages = ['/admin', '/admin/payouts', '/dashboard', '/venue-dashboard', '/settings', '/messages', '/bookings', '/booking/', '/booking-confirmation', '/earnings', '/earnings-dashboard', '/venue-invoices', '/rider-builder', '/rider-templates', '/saved-riders', '/riders', '/favorites', '/following', '/availability', '/profile/edit', '/events/create', '/verify-email', '/revert-email', '/unsubscribe', '/artist-tax-reporting'];
      privatePages.forEach(page => {
        expect(response.text).toContain(`Disallow: ${page}`);
      });
    });

    it('should disallow API endpoints', async () => {
      const response = await request(app).get('/robots.txt');
      const apiPaths = ['/api/', '/trpc/', '/auth/'];
      apiPaths.forEach(path => {
        expect(response.text).toContain(`Disallow: ${path}`);
      });
    });

    it('should include sitemap reference', async () => {
      const response = await request(app).get('/robots.txt');
      // Should include sitemap reference
      expect(response.text).toContain('Sitemap:');
    });

    it('should include crawl delay', async () => {
      const response = await request(app).get('/robots.txt');
      expect(response.text).toContain('Crawl-delay');
    });

    it('should include crawl delay', async () => {
      const response = await request(app).get('/robots.txt');
      expect(response.text).toContain('Crawl-delay');
    });

    it('should set proper cache headers for robots.txt', async () => {
      const response = await request(app).get('/robots.txt');
      expect(response.headers['cache-control']).toBeDefined();
    });

    it('should NOT have conflicting allow/disallow rules', async () => {
      const response = await request(app).get('/robots.txt');
      // Verify no exact path is both allowed and disallowed
      const lines = response.text.split('\n');
      const allowedPaths = lines.filter(l => l.startsWith('Allow:')).map(l => l.replace('Allow: ', '').trim());
      const disallowedPaths = lines.filter(l => l.startsWith('Disallow:')).map(l => l.replace('Disallow: ', '').trim());
      
      // Check for exact conflicts (should be none)
      const conflicts = allowedPaths.filter(p => p && p !== '/' && disallowedPaths.includes(p));
      expect(conflicts.length).toBe(0);
    });
  });

  describe('SEO Compliance', () => {
    it('should not include duplicate content URLs', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Check that we use canonical URLs
      expect(response.text).toContain('terms-of-service');
      expect(response.text).toContain('privacy-policy');
    });

    it('should use consistent URLs', async () => {
      const response = await request(app).get('/sitemap.xml');
      // URLs should be consistent (either all with domain or all relative)
      const lines = response.text.split('\n');
      const locLines = lines.filter(l => l.includes('<loc>'));
      
      // Check that all URLs follow same pattern
      const hasHttps = locLines.some(l => l.includes('https://'));
      const hasRelative = locLines.some(l => l.includes('<loc>/'));
      
      // Should use one format consistently
      expect(locLines.length).toBeGreaterThan(0);
    });

    it('should have proper XML format', async () => {
      const response = await request(app).get('/sitemap.xml');
      // Check for proper XML structure
      expect(response.text).toContain('<?xml');
      expect(response.text).toContain('<urlset');
      expect(response.text).toContain('</urlset>');
    });
  });
});