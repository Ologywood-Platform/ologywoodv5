import express, { Router, Request, Response } from 'express';
import * as db from '../db';

const router = Router();

/**
 * Generate dynamic sitemap.xml for SEO
 * Includes all public pages and dynamic artist/venue profiles
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

    // Static pages
    const staticPages = [
      { url: '/', changefreq: 'weekly', priority: 1.0 },
      { url: '/browse', changefreq: 'daily', priority: 0.9 },
      { url: '/about', changefreq: 'monthly', priority: 0.7 },
      { url: '/how-it-works', changefreq: 'monthly', priority: 0.7 },
      { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
      { url: '/contact', changefreq: 'monthly', priority: 0.6 },
      { url: '/verify-email', changefreq: 'never', priority: 0.3 },
      { url: '/revert-email', changefreq: 'never', priority: 0.3 },
      { url: '/terms-of-service', changefreq: 'yearly', priority: 0.5 },
      { url: '/privacy-policy', changefreq: 'yearly', priority: 0.5 },
    ];

    // Fetch dynamic artist profiles
    let artistPages: Array<{ url: string; changefreq: string; priority: number }> = [];
    try {
      const artists = await db.artist.findMany({
        select: {
          id: true,
          updatedAt: true,
        },
        where: {
          verified: true, // Only include verified artists
        },
      });

      artistPages = artists.map((artist) => ({
        url: `/artist/${artist.id}`,
        changefreq: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching artists for sitemap:', error);
    }

    // Fetch dynamic venue profiles
    let venuePages: Array<{ url: string; changefreq: string; priority: number }> = [];
    try {
      const venues = await db.venue.findMany({
        select: {
          id: true,
          updatedAt: true,
        },
        where: {
          verified: true, // Only include verified venues
        },
      });

      venuePages = venues.map((venue) => ({
        url: `/venue/${venue.id}`,
        changefreq: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching venues for sitemap:', error);
    }

    // Combine all pages
    const allPages = [...staticPages, ...artistPages, ...venuePages];

    // Generate XML
    const xml = generateSitemapXml(baseUrl, allPages);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Generate sitemap index for large sitemaps
 * Useful if sitemap grows beyond 50,000 URLs
 */
router.get('/sitemap-index.xml', (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(sitemapIndex);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
});

/**
 * Generate robots.txt for search engine crawlers
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

  const robotsTxt = `# Robots.txt for Ologywood
User-agent: *
Allow: /
Allow: /browse
Allow: /artist/
Allow: /venue/
Allow: /about
Allow: /how-it-works
Allow: /pricing
Allow: /verify-email
Allow: /revert-email

Disallow: /admin
Disallow: /dashboard
Disallow: /settings
Disallow: /api/
Disallow: /trpc/
Disallow: /auth/

# Crawl delay
Crawl-delay: 1

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-index.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
  res.send(robotsTxt);
});

/**
 * Helper function to generate sitemap XML
 */
function generateSitemapXml(
  baseUrl: string,
  pages: Array<{ url: string; changefreq: string; priority: number }>
): string {
  const urlEntries = pages
    .map((page) => {
      return `  <url>
    <loc>${escapeXml(`${baseUrl}${page.url}`)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
