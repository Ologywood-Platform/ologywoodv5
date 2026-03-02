import express, { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { artistProfiles, venueProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Generate dynamic sitemap.xml for SEO
 * Includes only public pages and verified artist/venue profiles
 * Excludes private/protected pages that require authentication
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    // Ensure we always use www domain for consistency
    if (!baseUrl.includes('www.')) {
      baseUrl = baseUrl.replace('https://', 'https://www.');
    }
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');

    // Static PUBLIC pages only (no private/protected pages)
    const staticPages = [
      { url: '/', changefreq: 'weekly', priority: 1.0, lastmod: new Date().toISOString() },
      { url: '/browse', changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() },
      { url: '/venues', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
      { url: '/events', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
      { url: '/pricing', changefreq: 'monthly', priority: 0.7, lastmod: new Date().toISOString() },
      { url: '/how-it-works', changefreq: 'monthly', priority: 0.7, lastmod: new Date().toISOString() },
      { url: '/sell-music', changefreq: 'monthly', priority: 0.8, lastmod: new Date().toISOString() },
      { url: '/blog', changefreq: 'daily', priority: 0.8, lastmod: new Date().toISOString() },
      { url: '/contact', changefreq: 'monthly', priority: 0.6, lastmod: new Date().toISOString() },
      { url: '/faq', changefreq: 'monthly', priority: 0.6, lastmod: new Date().toISOString() },
      { url: '/help', changefreq: 'monthly', priority: 0.6, lastmod: new Date().toISOString() },
      // Use canonical URLs to avoid duplicates
      { url: '/terms-of-service', changefreq: 'yearly', priority: 0.5, lastmod: new Date().toISOString() },
      { url: '/privacy-policy', changefreq: 'yearly', priority: 0.5, lastmod: new Date().toISOString() },
      { url: '/cookies', changefreq: 'yearly', priority: 0.4, lastmod: new Date().toISOString() },
      { url: '/accessibility', changefreq: 'yearly', priority: 0.4, lastmod: new Date().toISOString() },
      { url: '/dmca', changefreq: 'yearly', priority: 0.4, lastmod: new Date().toISOString() },
    ];

    // Fetch dynamic artist profiles
    let artistPages: Array<{ url: string; changefreq: string; priority: number; lastmod: string }> = [];
    try {
      const database = await getDb();
      if (database) {
        const artists = await database.select({
          id: artistProfiles.id,
          updatedAt: artistProfiles.updatedAt,
        }).from(artistProfiles).limit(10000);

        artistPages = artists.map((artist: any) => ({
          url: `/artist/${artist.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: artist.updatedAt ? new Date(artist.updatedAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error fetching artists for sitemap:', error);
    }

    // Fetch dynamic venue profiles
    let venuePages: Array<{ url: string; changefreq: string; priority: number; lastmod: string }> = [];
    try {
      const database = await getDb();
      if (database) {
        const venues = await database.select({
          id: venueProfiles.id,
          updatedAt: venueProfiles.updatedAt,
        }).from(venueProfiles).limit(10000);

        venuePages = venues.map((venue: any) => ({
          url: `/venue/${venue.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: venue.updatedAt ? new Date(venue.updatedAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error fetching venues for sitemap:', error);
    }

    // Fetch public events
    let eventPages: Array<{ url: string; changefreq: string; priority: number; lastmod: string }> = [];
    try {
      const database = await getDb();
      if (database) {
        const { events } = await import('../../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const publicEvents = await database.select({
          id: events.id,
          updatedAt: events.updatedAt,
        }).from(events).where(eq(events.isPublic, true)).limit(10000);

        eventPages = publicEvents.map((event: any) => ({
          url: `/events/${event.id}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error fetching events for sitemap:', error);
    }

    // Combine all pages
    const allPages = [...staticPages, ...artistPages, ...venuePages, ...eventPages];

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
 * Generate robots.txt for search engine crawlers
 * Properly configured to allow public pages and disallow private ones
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  // Always use www.ologywood.com for canonical consistency
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  // Ensure www prefix for consistency with canonical URLs
  if (baseUrl.includes('ologywood.com') && !baseUrl.includes('www.')) {
    baseUrl = baseUrl.replace('https://', 'https://www.');
  }

  const robotsTxt = `# Robots.txt for Ologywood Artist Booking Platform
User-agent: *
Allow: /
Allow: /browse
Allow: /artist/
Allow: /venue/
Allow: /venues
Allow: /events
Allow: /events/
Allow: /pricing
Allow: /how-it-works
Allow: /sell-music
Allow: /blog
Allow: /blog/
Allow: /contact
Allow: /faq
Allow: /help
Allow: /terms-of-service
Allow: /privacy-policy
Allow: /cookies
Allow: /accessibility
Allow: /dmca

# Disallow private/protected pages
Disallow: /admin
Disallow: /admin/payouts
Disallow: /dashboard
Disallow: /venue-dashboard
Disallow: /artist-dashboard
Disallow: /settings
Disallow: /account
Disallow: /messages
Disallow: /bookings
Disallow: /booking/
Disallow: /booking-confirmation
Disallow: /earnings
Disallow: /earnings-dashboard
Disallow: /venue-invoices
Disallow: /rider-builder
Disallow: /releases
Disallow: /rider-templates
Disallow: /saved-riders
Disallow: /riders
Disallow: /favorites
Disallow: /following
Disallow: /availability
Disallow: /verify-email
Disallow: /revert-email
Disallow: /unsubscribe
Disallow: /onboarding
Disallow: /get-started
Disallow: /artist-tax-reporting

# Disallow API endpoints
Disallow: /api/
Disallow: /trpc/
Disallow: /auth/

# Disallow deprecated pages
Disallow: /_deprecated/

# Crawl delay (be respectful)
Crawl-delay: 1

# Request rate (pages per 10 seconds)
Request-rate: 10/10s

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
  res.send(robotsTxt);
});

/**
 * Helper function to generate sitemap XML with proper formatting
 */
function generateSitemapXml(
  baseUrl: string,
  pages: Array<{ url: string; changefreq: string; priority: number; lastmod: string }>
): string {
  const urlEntries = pages
    .map((page) => {
      return `  <url>
    <loc>${escapeXml(`${baseUrl}${page.url}`)}</loc>
    <lastmod>${page.lastmod}</lastmod>
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
