import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, desc, eq, ne } from 'drizzle-orm';
import {
  artistProfiles,
  artistTeamMembers,
  blogPosts,
  events,
  merchItems,
  ologyLiveExperiences,
  venueProfiles,
} from '../../drizzle/schema';
import { getDb } from '../db';

type SitemapPage = {
  url: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  lastmod?: string;
};

const router = Router();

export const PUBLIC_STATIC_PAGES: SitemapPage[] = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/discover', changefreq: 'daily', priority: 0.9 },
  { url: '/experiences', changefreq: 'daily', priority: 0.9 },
  { url: '/shop', changefreq: 'daily', priority: 0.9 },
  { url: '/community', changefreq: 'daily', priority: 0.8 },
  { url: '/browse', changefreq: 'daily', priority: 0.9 },
  { url: '/venues', changefreq: 'daily', priority: 0.8 },
  { url: '/events', changefreq: 'daily', priority: 0.8 },
  { url: '/ology-live', changefreq: 'daily', priority: 0.8 },
  { url: '/pricing', changefreq: 'monthly', priority: 0.7 },
  { url: '/how-it-works', changefreq: 'monthly', priority: 0.7 },
  { url: '/sell-music', changefreq: 'monthly', priority: 0.8 },
  { url: '/sponsor-opportunities', changefreq: 'daily', priority: 0.7 },
  { url: '/blog', changefreq: 'daily', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/faq', changefreq: 'monthly', priority: 0.6 },
  { url: '/help', changefreq: 'monthly', priority: 0.6 },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.5 },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.5 },
  { url: '/cookies', changefreq: 'yearly', priority: 0.4 },
  { url: '/accessibility', changefreq: 'yearly', priority: 0.4 },
  { url: '/dmca', changefreq: 'yearly', priority: 0.4 },
  { url: '/disclaimer', changefreq: 'yearly', priority: 0.4 },
  { url: '/creator-rights', changefreq: 'yearly', priority: 0.5 },
  { url: '/community-guidelines', changefreq: 'yearly', priority: 0.4 },
];

export function toSitemapSlug(value: string, maxLength = 60): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

export function artistSitemapPath(name: string): string {
  return `/artist/${toSitemapSlug(name)}`;
}

export function venueSitemapPath(name: string): string {
  return `/venue/${toSitemapSlug(name)}`;
}

export function eventSitemapPath(title: string): string {
  return `/events/${toSitemapSlug(title)}`;
}

export function merchSitemapPath(title: string, id: number): string {
  return `/merch/${toSitemapSlug(title, 80)}-${id}`;
}

function normalizeBaseUrl(req: Request): string {
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  if (baseUrl.includes('ologywood.com') && !baseUrl.includes('www.')) {
    baseUrl = baseUrl.replace('https://', 'https://www.');
  }
  return baseUrl.replace(/\/$/, '');
}

function toLastModified(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function deduplicatePages(pages: SitemapPage[]): SitemapPage[] {
  const uniquePages = new Map<string, SitemapPage>();
  for (const page of pages) {
    if (!page.url || page.url.endsWith('/')) {
      if (page.url !== '/') continue;
    }
    const existing = uniquePages.get(page.url);
    if (!existing || (page.lastmod && (!existing.lastmod || page.lastmod > existing.lastmod))) {
      uniquePages.set(page.url, page);
    }
  }
  return Array.from(uniquePages.values());
}

/**
 * Generate the canonical public sitemap. Private account tools are intentionally
 * excluded, while public profiles and commerce/discovery detail pages are loaded
 * from the database.
 */
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = normalizeBaseUrl(req);
    const dynamicPages: SitemapPage[] = [];
    const database = await getDb();

    if (database) {
      try {
        let teamMemberUserIds = new Set<number>();
        try {
          const teamMembers = await database
            .select({ userId: artistTeamMembers.userId })
            .from(artistTeamMembers)
            .where(ne(artistTeamMembers.role, 'owner'));
          teamMemberUserIds = new Set(teamMembers.map((member) => member.userId));
        } catch (error) {
          console.error('Error fetching team members for sitemap filtering:', error);
        }

        const artists = await database
          .select({
            userId: artistProfiles.userId,
            artistName: artistProfiles.artistName,
            updatedAt: artistProfiles.updatedAt,
          })
          .from(artistProfiles)
          .orderBy(desc(artistProfiles.updatedAt))
          .limit(10000);

        dynamicPages.push(
          ...artists
            .filter((artist) => {
              const name = artist.artistName.trim();
              return Boolean(name)
                && !teamMemberUserIds.has(artist.userId)
                && !name.toLowerCase().includes('team member')
                && Boolean(toSitemapSlug(name));
            })
            .map((artist) => ({
              url: artistSitemapPath(artist.artistName),
              changefreq: 'weekly' as const,
              priority: 0.8,
              lastmod: toLastModified(artist.updatedAt),
            })),
        );
      } catch (error) {
        console.error('Error fetching artists for sitemap:', error);
      }

      try {
        const venues = await database
          .select({
            organizationName: venueProfiles.organizationName,
            updatedAt: venueProfiles.updatedAt,
          })
          .from(venueProfiles)
          .where(eq(venueProfiles.isListed, true))
          .orderBy(desc(venueProfiles.updatedAt))
          .limit(10000);

        dynamicPages.push(
          ...venues
            .filter((venue) => Boolean(toSitemapSlug(venue.organizationName)))
            .map((venue) => ({
              url: venueSitemapPath(venue.organizationName),
              changefreq: 'weekly' as const,
              priority: 0.8,
              lastmod: toLastModified(venue.updatedAt),
            })),
        );
      } catch (error) {
        console.error('Error fetching venues for sitemap:', error);
      }

      try {
        const publicEvents = await database
          .select({
            eventTitle: events.eventTitle,
            updatedAt: events.updatedAt,
          })
          .from(events)
          .where(and(eq(events.isPublic, true), ne(events.status, 'cancelled')))
          .orderBy(desc(events.updatedAt))
          .limit(10000);

        dynamicPages.push(
          ...publicEvents
            .filter((event) => Boolean(toSitemapSlug(event.eventTitle)))
            .map((event) => ({
              url: eventSitemapPath(event.eventTitle),
              changefreq: 'weekly' as const,
              priority: 0.7,
              lastmod: toLastModified(event.updatedAt),
            })),
        );
      } catch (error) {
        console.error('Error fetching events for sitemap:', error);
      }

      try {
        const publishedPosts = await database
          .select({
            slug: blogPosts.slug,
            updatedAt: blogPosts.updatedAt,
            publishedAt: blogPosts.publishedAt,
          })
          .from(blogPosts)
          .where(eq(blogPosts.status, 'published'))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(10000);

        dynamicPages.push(
          ...publishedPosts
            .filter((post) => Boolean(post.slug.trim()))
            .map((post) => ({
              url: `/blog/${post.slug}`,
              changefreq: 'monthly' as const,
              priority: 0.7,
              lastmod: toLastModified(post.updatedAt || post.publishedAt),
            })),
        );
      } catch (error) {
        console.error('Error fetching blog posts for sitemap:', error);
      }

      try {
        const activeMerch = await database
          .select({
            id: merchItems.id,
            title: merchItems.title,
            updatedAt: merchItems.updatedAt,
          })
          .from(merchItems)
          .where(eq(merchItems.isActive, true))
          .orderBy(desc(merchItems.updatedAt))
          .limit(10000);

        dynamicPages.push(
          ...activeMerch
            .filter((item) => Boolean(toSitemapSlug(item.title, 80)))
            .map((item) => ({
              url: merchSitemapPath(item.title, item.id),
              changefreq: 'weekly' as const,
              priority: 0.7,
              lastmod: toLastModified(item.updatedAt),
            })),
        );
      } catch (error) {
        console.error('Error fetching merchandise for sitemap:', error);
      }

      try {
        const activeExperiences = await database
          .select({
            id: ologyLiveExperiences.id,
            updatedAt: ologyLiveExperiences.updatedAt,
          })
          .from(ologyLiveExperiences)
          .where(eq(ologyLiveExperiences.isActive, true))
          .orderBy(desc(ologyLiveExperiences.updatedAt))
          .limit(10000);

        dynamicPages.push(
          ...activeExperiences.map((experience) => ({
            url: `/ology-live/${experience.id}`,
            changefreq: 'weekly' as const,
            priority: 0.7,
            lastmod: toLastModified(experience.updatedAt),
          })),
        );
      } catch (error) {
        console.error('Error fetching Ology Live experiences for sitemap:', error);
      }
    }

    const xml = generateSitemapXml(baseUrl, deduplicatePages([...PUBLIC_STATIC_PAGES, ...dynamicPages]));
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Generate robots.txt for search engine crawlers. Public detail routes are
 * crawlable; authenticated workspaces, transactions, and account tools are not.
 */
router.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = normalizeBaseUrl(req);
  const robotsTxt = `# Robots.txt for OlogyWood Creator Commerce Platform

# Social media crawlers - full access to public pages and preview endpoints
User-agent: facebookexternalhit
Allow: /

User-agent: Facebot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Slackbot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /

User-agent: Pinterest
Allow: /

User-agent: Discordbot
Allow: /

# All other crawlers
User-agent: *
Allow: /
Allow: /discover
Allow: /experiences
Allow: /shop
Allow: /community
Allow: /browse
Allow: /artist/
Allow: /venue/
Allow: /venues
Allow: /events
Allow: /events/
Allow: /ology-live
Allow: /merch/
Allow: /portfolio-video/
Allow: /pricing
Allow: /how-it-works
Allow: /sell-music
Allow: /sponsor-opportunities
Allow: /blog
Allow: /blog/
Allow: /about
Allow: /contact
Allow: /faq
Allow: /help
Allow: /terms-of-service
Allow: /privacy-policy
Allow: /cookies
Allow: /accessibility
Allow: /dmca
Allow: /disclaimer
Allow: /creator-rights
Allow: /community-guidelines
Allow: /api/og-page/
Allow: /api/og-image/

# Disallow private/protected pages
Disallow: /admin
Disallow: /admin/payouts
Disallow: /blogger-dashboard
Disallow: /dashboard
Disallow: /nil-compliance
Disallow: /venue-dashboard
Disallow: /workspace
Disallow: /my-ology
Disallow: /settings
Disallow: /account
Disallow: /team
Disallow: /messages
Disallow: /messages/
Disallow: /notifications
Disallow: /bookings
Disallow: /my-bookings
Disallow: /booking/
Disallow: /booking-confirmation
Disallow: /contracts
Disallow: /disputes
Disallow: /earnings
Disallow: /earnings-dashboard
Disallow: /venue-invoices
Disallow: /rider-builder
Disallow: /releases
Disallow: /content-releases
Disallow: /rider-templates
Disallow: /saved-riders
Disallow: /riders
Disallow: /favorites
Disallow: /following
Disallow: /availability
Disallow: /profile/edit
Disallow: /artists/*/history
Disallow: /events/create
Disallow: /events/*/edit
Disallow: /events/*/tickets
Disallow: /events/*/check-in
Disallow: /venue/events/create
Disallow: /ology-live/dashboard
Disallow: /ology-live/my-sessions
Disallow: /ology-live/earnings
Disallow: /merch$
Disallow: /merch-orders
Disallow: /projects
Disallow: /promote
Disallow: /sponsor-dashboard
Disallow: /sponsor-analytics
Disallow: /media-kit
Disallow: /my-tickets
Disallow: /my-purchases
Disallow: /my-music
Disallow: /fan-club
Disallow: /purchase-success
Disallow: /tickets/confirmation/
Disallow: /tickets/accept/
Disallow: /verify-email
Disallow: /revert-email
Disallow: /reset-password
Disallow: /unsubscribe
Disallow: /onboarding
Disallow: /get-started
Disallow: /artist-tax-reporting

# Disallow API endpoints (specific preview endpoints above remain available)
Disallow: /api/
Disallow: /trpc/
Disallow: /auth/

# Disallow deprecated pages
Disallow: /_deprecated/

# Crawl delay (be respectful)
Crawl-delay: 1

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.send(robotsTxt);
});

function generateSitemapXml(baseUrl: string, pages: SitemapPage[]): string {
  const urlEntries = pages
    .map((page) => {
      const lastmod = page.lastmod ? `\n    <lastmod>${escapeXml(page.lastmod)}</lastmod>` : '';
      return `  <url>
    <loc>${escapeXml(`${baseUrl}${page.url}`)}</loc>${lastmod}
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
