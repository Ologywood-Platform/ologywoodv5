import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Canonical Tag Fix - Google Search Console Duplicate Issue', () => {
  
  describe('index.html canonical tag', () => {
    const indexHtml = fs.readFileSync(
      path.join(__dirname, '../client/index.html'), 'utf-8'
    );

    it('should have canonical tag pointing to www.ologywood.com, NOT manus.space', () => {
      expect(indexHtml).toContain('href="https://www.ologywood.com/"');
      expect(indexHtml).not.toContain('ologywood-mp6flm6c.manus.space');
    });

    it('should have canonical tag and og:url pointing to the same domain', () => {
      const canonicalMatch = indexHtml.match(/rel="canonical" href="([^"]+)"/);
      const ogUrlMatch = indexHtml.match(/property="og:url" content="([^"]+)"/);
      expect(canonicalMatch).toBeTruthy();
      expect(ogUrlMatch).toBeTruthy();
      // Both should use www.ologywood.com
      expect(canonicalMatch![1]).toContain('www.ologywood.com');
      expect(ogUrlMatch![1]).toContain('www.ologywood.com');
    });

    it('should not have conflicting domain references', () => {
      // No manus.space in canonical or og:url
      const lines = indexHtml.split('\n');
      const canonicalLine = lines.find(l => l.includes('rel="canonical"'));
      expect(canonicalLine).toBeDefined();
      expect(canonicalLine).not.toContain('manus.space');
      expect(canonicalLine).not.toContain('manus.computer');
    });
  });

  describe('CanonicalUpdater component', () => {
    const canonicalUpdater = fs.readFileSync(
      path.join(__dirname, '../client/src/components/CanonicalUpdater.tsx'), 'utf-8'
    );

    it('should exist and use useLocation from wouter', () => {
      expect(canonicalUpdater).toContain("import { useLocation } from 'wouter'");
    });

    it('should use www.ologywood.com as BASE_URL', () => {
      expect(canonicalUpdater).toContain("const BASE_URL = 'https://www.ologywood.com'");
    });

    it('should normalize trailing slashes', () => {
      expect(canonicalUpdater).toContain("replace(/\\/+$/, '')");
    });

    it('should update canonical link tag on route change', () => {
      expect(canonicalUpdater).toContain('link[rel="canonical"]');
      expect(canonicalUpdater).toContain("link.setAttribute('href', canonicalUrl)");
    });

    it('should also update og:url to match canonical', () => {
      expect(canonicalUpdater).toContain('meta[property="og:url"]');
    });

    it('should render null (no visible DOM)', () => {
      expect(canonicalUpdater).toContain('return null');
    });
  });

  describe('CanonicalUpdater is registered in App.tsx', () => {
    const appTsx = fs.readFileSync(
      path.join(__dirname, '../client/src/App.tsx'), 'utf-8'
    );

    it('should import CanonicalUpdater', () => {
      expect(appTsx).toContain("import { CanonicalUpdater }");
    });

    it('should render CanonicalUpdater before Router', () => {
      const canonicalPos = appTsx.indexOf('<CanonicalUpdater');
      const routerPos = appTsx.indexOf('<Router');
      expect(canonicalPos).toBeGreaterThan(-1);
      expect(routerPos).toBeGreaterThan(-1);
      expect(canonicalPos).toBeLessThan(routerPos);
    });
  });

  describe('seoMeta utility canonical handling', () => {
    const seoMeta = fs.readFileSync(
      path.join(__dirname, '../client/src/utils/seoMeta.ts'), 'utf-8'
    );

    it('should have normalizeUrl function', () => {
      expect(seoMeta).toContain('function normalizeUrl(url: string)');
    });

    it('should have buildCanonicalUrl function', () => {
      expect(seoMeta).toContain('function buildCanonicalUrl(config: MetaTagsConfig)');
    });

    it('should ALWAYS set canonical URL in setMetaTags', () => {
      expect(seoMeta).toContain('// Canonical URL - ALWAYS set to prevent duplicate content issues');
      expect(seoMeta).toContain('updateCanonicalTag(canonicalUrl)');
    });

    it('should remove trailing slashes in normalizeUrl', () => {
      expect(seoMeta).toContain("replace(/\\/+$/, '')");
    });

    it('should derive canonical from window.location.pathname as fallback', () => {
      expect(seoMeta).toContain('window.location.pathname');
    });

    it('should use www.ologywood.com as BASE_URL', () => {
      expect(seoMeta).toContain("const BASE_URL = 'https://www.ologywood.com'");
    });

    it('should have consistent og:url for all static pages', () => {
      // All pageMetaTags should have ogUrl set
      expect(seoMeta).toContain("ogUrl: BASE_URL,"); // home
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/browse`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/events`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/pricing`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/how-it-works`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/faq`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/help`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/contact`");
      expect(seoMeta).toContain("ogUrl: `${BASE_URL}/venues`");
    });
  });

  describe('Server-side trailing slash normalization', () => {
    const serverIndex = fs.readFileSync(
      path.join(__dirname, './_core/index.ts'), 'utf-8'
    );

    it('should have trailing slash normalization middleware', () => {
      expect(serverIndex).toContain('Trailing slash normalization');
    });

    it('should skip root path from normalization', () => {
      expect(serverIndex).toContain("req.path === '/'");
    });

    it('should skip API routes from normalization', () => {
      expect(serverIndex).toContain("req.path.startsWith('/api/')");
      expect(serverIndex).toContain("req.path.startsWith('/trpc/')");
    });

    it('should skip static files (with extensions) from normalization', () => {
      expect(serverIndex).toContain("req.path.includes('.')");
    });

    it('should 301 redirect trailing slashes to clean paths', () => {
      expect(serverIndex).toContain("res.redirect(301, cleanPath + query)");
    });

    it('should preserve query strings during redirect', () => {
      expect(serverIndex).toContain("const query = req.url.slice(req.path.length)");
    });
  });

  describe('www redirect middleware', () => {
    const serverIndex = fs.readFileSync(
      path.join(__dirname, './_core/index.ts'), 'utf-8'
    );

    it('should redirect non-www ologywood.com to www', () => {
      expect(serverIndex).toContain("req.hostname === 'ologywood.com'");
      expect(serverIndex).toContain("res.redirect(301, `https://www.ologywood.com${req.originalUrl}`)");
    });

    it('should only apply www redirect in production', () => {
      expect(serverIndex).toContain("process.env.NODE_ENV === 'production'");
    });
  });

  describe('Sitemap URL consistency', () => {
    const sitemapRoutes = fs.readFileSync(
      path.join(__dirname, './routes/sitemapRoutes.ts'), 'utf-8'
    );

    it('should ensure www prefix in sitemap baseUrl', () => {
      expect(sitemapRoutes).toContain("baseUrl.replace('https://', 'https://www.')");
    });

    it('should ensure www prefix in robots.txt baseUrl', () => {
      // robots.txt handler should also normalize
      const robotsSection = sitemapRoutes.substring(sitemapRoutes.indexOf("'/robots.txt'"));
      expect(robotsSection).toContain("baseUrl.replace('https://', 'https://www.')");
    });

    it('should have no trailing slashes on sitemap static page URLs (except root)', () => {
      // All static page URLs should not end with / (except root)
      const staticPagesMatch = sitemapRoutes.match(/url: '\/[a-z-]+'/g);
      if (staticPagesMatch) {
        staticPagesMatch.forEach(url => {
          expect(url).not.toMatch(/\/'/); // Should not end with /'
        });
      }
    });

    it('should have root URL as / in sitemap', () => {
      expect(sitemapRoutes).toContain("url: '/'");
    });
  });

  describe('Pages with setMetaTags coverage', () => {
    const pagesDir = path.join(__dirname, '../client/src/pages');
    const publicPages = [
      'Home.tsx', 'Browse.tsx', 'ArtistProfile.tsx', 'VenueProfile.tsx',
      'VenueProfileDetail.tsx', 'VenueBrowse.tsx', 'EventDetail.tsx',
      'EventDiscovery.tsx', 'Pricing.tsx', 'HowItWorks.tsx', 'FAQ.tsx',
      'Help.tsx', 'Contact.tsx'
    ];

    publicPages.forEach(page => {
      it(`${page} should call setMetaTags for proper canonical`, () => {
        const content = fs.readFileSync(path.join(pagesDir, page), 'utf-8');
        expect(content).toContain('setMetaTags');
      });
    });
  });
});
