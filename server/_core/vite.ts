import express, { type Express } from "express";
// Build version: 2026-05-11-v3 - OG image must use /api/og-image/ proxy
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { artistProfiles, venueProfiles, events, blogPosts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { EDU_SHARE_DESCRIPTION, EDU_SHARE_IMAGE, EDU_SHARE_IMAGE_ALT, EDU_SHARE_TITLE, EDU_SHARE_URL, isEduLandingPath } from '../../shared/eduShare';
import { injectEduShareMeta } from '../services/eduShareMetadata';
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateArtistJsonLd,
  generateVenueJsonLd,
  generateEventJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqPageJsonLd,
  jsonLdToScriptTag,
} from "../utils/jsonLd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache-busted branded preview. The project asset route resolves publicly for social crawlers.
const DEFAULT_OG_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-platform-og-2026-10-10_b5a657bf.png';

function isSocialBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
    'WhatsApp', 'Slackbot', 'TelegramBot', 'Discordbot', 'Pinterest',
    'Googlebot', 'bingbot', 'Applebot', 'iMessageLinkPreview',
    'Viber', 'Line/', 'Snapchat', 'SkypeUriPreview', 'redditbot',
    'Embedly', 'Quora Link Preview', 'vkShare', 'Iframely',
  ];
  return botPatterns.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Get the OG image URL for an entity.
 * Uses the /api/og-image proxy to convert WebP/PNG images to JPEG for social media compatibility.
 * Twitter, LinkedIn, and some other platforms don't reliably support WebP in OG meta tags.
 */
function getOgImageUrl(profilePhotoUrl: string | null | undefined, entityType: 'artist' | 'venue', entityId: number, baseUrl: string): string {
  if (!profilePhotoUrl) {
    return DEFAULT_OG_IMAGE;
  }
  // Always use the proxy endpoint to ensure JPEG format for social media
  return `${baseUrl}/api/og-image/${entityType}/${entityId}`;
}

interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  jsonLd?: object | object[];
}

const STATIC_SEO: Record<string, Omit<OgData, 'url'> & { path: string }> = {
  '/': {
    path: '/', title: 'Your Talent. Your Platform. Your Next Opportunity.',
    description: 'Get discovered, book opportunities, grow your audience, and earn from what you create. OlogyWood powers bookings, tickets, fan clubs, merch, and content releases.',
    image: DEFAULT_OG_IMAGE, type: 'website',
  },
  '/home': {
    path: '/', title: 'Your Talent. Your Platform. Your Next Opportunity.',
    description: 'Get discovered, book opportunities, grow your audience, and earn from what you create. OlogyWood powers bookings, tickets, fan clubs, merch, and content releases.',
    image: DEFAULT_OG_IMAGE, type: 'website',
  },
  '/discover': { path: '/discover', title: 'Discover Talent and Opportunities | Ologywood', description: 'Discover artists, venues, events, and creative opportunities on Ologywood.', image: DEFAULT_OG_IMAGE },
  '/experiences': { path: '/experiences', title: 'Creative Experiences | Ologywood', description: 'Explore live and digital experiences from independent creators on Ologywood.', image: DEFAULT_OG_IMAGE },
  '/shop': { path: '/shop', title: 'Creator Shop | Ologywood', description: 'Shop music, merch, books, and digital releases directly from independent creators.', image: DEFAULT_OG_IMAGE },
  '/community': { path: '/community', title: 'Creator Community | Ologywood', description: 'Connect with independent creators, fans, and opportunities across the Ologywood community.', image: DEFAULT_OG_IMAGE },
  '/browse': { path: '/browse', title: 'Browse Artists — Find & Book Talent | Ologywood', description: 'Discover and book talented performing artists for your events. Search by genre, location, and availability.', image: DEFAULT_OG_IMAGE },
  '/venues': { path: '/venues', title: 'Browse Venues | Ologywood', description: 'Discover venues looking for talented performers and explore booking opportunities.', image: DEFAULT_OG_IMAGE },
  '/events': { path: '/events', title: 'Discover Events | Ologywood', description: 'Explore upcoming live events, concerts, and performances. Find events near you and buy tickets directly from creators.', image: DEFAULT_OG_IMAGE },
  '/ology-live': { path: '/ology-live', title: 'Ology Live Experiences | Ologywood', description: 'Discover live digital experiences, sessions, and performances from independent creators.', image: DEFAULT_OG_IMAGE },
  '/pricing': { path: '/pricing', title: 'Pricing — Simple, Transparent Plans | Ologywood', description: 'Choose the right Ologywood plan for bookings, direct-to-fan sales, audience growth, and creator tools.', image: DEFAULT_OG_IMAGE },
  '/how-it-works': { path: '/how-it-works', title: 'How Ologywood Works | Artist Booking and Creator Commerce', description: 'Learn how Ologywood helps creators build profiles, manage bookings, sell directly to fans, and grow their audience.', image: DEFAULT_OG_IMAGE },
  '/faq': { path: '/faq', title: 'FAQ | Ologywood', description: 'Answers about artist bookings, payments, riders, contracts, events, tickets, merch, and creator tools on Ologywood.', image: DEFAULT_OG_IMAGE },
  '/help': { path: '/help', title: 'Help Center | Ologywood', description: 'Get help with your Ologywood account, bookings, riders, contracts, payments, events, and creator tools.', image: DEFAULT_OG_IMAGE },
  '/contact': { path: '/contact', title: 'Contact Ologywood | Creator and Venue Support', description: 'Contact the Ologywood team about artist bookings, venue partnerships, creator commerce, and platform support.', image: DEFAULT_OG_IMAGE },
  '/about': { path: '/about', title: 'About Ologywood | Built for Independent Creators', description: 'Learn how Ologywood helps independent talent get discovered, book opportunities, reach fans, and earn from what they create.', image: DEFAULT_OG_IMAGE },
  '/sell-music': { path: '/sell-music', title: 'Sell Your Music Directly to Fans | Ologywood', description: 'Release and sell singles directly from your Ologywood profile with direct-to-fan tools and a simple platform fee.', image: DEFAULT_OG_IMAGE },
  '/sponsor-opportunities': { path: '/sponsor-opportunities', title: 'Sponsor Opportunities | Ologywood', description: 'Connect brands and sponsors with independent creators, artists, events, and entertainment opportunities.', image: DEFAULT_OG_IMAGE },
  '/blog': { path: '/blog', title: 'Ologywood Blog | Creator Economy and Entertainment Insights', description: 'Read Ologywood announcements, creator guides, industry insights, and direct-to-fan growth ideas.', image: DEFAULT_OG_IMAGE },
  '/edu': { path: '/edu', title: EDU_SHARE_TITLE, description: EDU_SHARE_DESCRIPTION, image: EDU_SHARE_IMAGE },
  '/privacy-policy': { path: '/privacy-policy', title: 'Privacy Policy | Ologywood', description: 'Read the Ologywood privacy policy.', image: DEFAULT_OG_IMAGE },
  '/privacy': { path: '/privacy-policy', title: 'Privacy Policy | Ologywood', description: 'Read the Ologywood privacy policy.', image: DEFAULT_OG_IMAGE },
  '/terms-of-service': { path: '/terms-of-service', title: 'Terms of Service | Ologywood', description: 'Read the Ologywood terms of service.', image: DEFAULT_OG_IMAGE },
  '/terms': { path: '/terms-of-service', title: 'Terms of Service | Ologywood', description: 'Read the Ologywood terms of service.', image: DEFAULT_OG_IMAGE },
  '/cookies': { path: '/cookies', title: 'Cookie Policy | Ologywood', description: 'Read the Ologywood cookie policy.', image: DEFAULT_OG_IMAGE },
  '/accessibility': { path: '/accessibility', title: 'Accessibility | Ologywood', description: 'Learn about accessibility at Ologywood.', image: DEFAULT_OG_IMAGE },
  '/dmca': { path: '/dmca', title: 'DMCA Policy | Ologywood', description: 'Read the Ologywood DMCA policy.', image: DEFAULT_OG_IMAGE },
  '/disclaimer': { path: '/disclaimer', title: 'Disclaimer | Ologywood', description: 'Read the Ologywood disclaimer.', image: DEFAULT_OG_IMAGE },
  '/creator-rights': { path: '/creator-rights', title: 'Creator Rights | Ologywood', description: 'Learn how Ologywood supports creator rights and ownership.', image: DEFAULT_OG_IMAGE },
  '/community-guidelines': { path: '/community-guidelines', title: 'Community Guidelines | Ologywood', description: 'Read the Ologywood community guidelines.', image: DEFAULT_OG_IMAGE },
};

const NOINDEX_PREFIXES = ['/booking/', '/booking-confirmation/', '/messages/', '/artists/'];
const NOINDEX_PATHS = new Set(['/get-started', '/onboarding/artist', '/onboarding/venue', '/profile/edit', '/dashboard', '/venue-dashboard', '/verify-email', '/revert-email', '/reset-password', '/earnings', '/earnings-dashboard', '/venue-invoices', '/admin', '/admin/payouts', '/artist-tax-reporting', '/booking/create', '/bookings', '/contracts', '/events/create', '/releases', '/rider-builder', '/rider-templates', '/saved-riders', '/favorites', '/riders', '/messages', '/following', '/availability', '/unsubscribe', '/workspace', '/my-ology', '/settings', '/promote', '/media-kit', '/sponsor-dashboard', '/sponsor-analytics', '/my-tickets', '/my-purchases', '/my-music', '/fan-club', '/purchase-success', '/tickets/confirmation', '/tickets/accept', '/onboarding']);
function shouldNoIndex(pathname: string): boolean {
  return NOINDEX_PATHS.has(pathname) || NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function staticOgData(pathname: string, baseUrl: string): OgData | null {
  const entry = STATIC_SEO[pathname === '/edu/' ? '/edu' : pathname];
  if (!entry) return null;
  const url = entry.path === '/' ? `${baseUrl}/` : `${baseUrl}${entry.path}`;
  const breadcrumb = entry.path === '/' ? undefined : generateBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: entry.title.split('|')[0].split('—')[0].trim(), url: entry.path }], baseUrl);
  const jsonLd = entry.path === '/' ? [generateOrganizationJsonLd(baseUrl), generateWebSiteJsonLd(baseUrl)] : breadcrumb ? [breadcrumb] : undefined;
  return { title: entry.title, description: entry.description, image: entry.image, type: entry.type, url, jsonLd };
}

/**
 * Replace OG meta tags in the index.html template with dynamic values
 */
function injectOgTags(html: string, og: OgData): string {
  const { title, description, image, url, type = 'website', jsonLd } = og;
  
  // Determine image type based on URL
  const imageType = image.includes('/api/og-image/') ? 'image/jpeg' : 
    image.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  
  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(description)}">`
  );
  html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?\s*>/i, '<meta name="robots" content="index, follow">');
  
  // Replace OG tags
  html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${type}">`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(url)}">`);
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(image)}">`);
  html = html.replace(/<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image:secure_url" content="${escapeHtml(image)}">`);
  html = html.replace(/<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image:type" content="${imageType}">`);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(url)}">`);
  
  // Replace Twitter tags
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapeHtml(image)}">`);
  html = html.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${escapeHtml(url)}">`);
  
  // Inject JSON-LD before </head>
  if (jsonLd) {
    const jsonLdTag = jsonLdToScriptTag(jsonLd);
    html = html.replace('</head>', `${jsonLdTag}\n</head>`);
  }
  
  return html;
}

/**
 * Fetch OG data for a given pathname from the database
 * Uses the /api/og-image proxy for all profile photos to ensure JPEG format
 */
async function getOgDataForPath(pathname: string, baseUrl: string): Promise<OgData | null> {
  try {
    const staticData = staticOgData(pathname, baseUrl);
    if (staticData) return staticData;

    // Match /artist/:id
    const artistMatch = pathname.match(/^\/artist\/(\d+)$/);
    if (artistMatch) {
      const artistId = parseInt(artistMatch[1], 10);
      const database = await getDb();
      if (database) {
        const [artist] = await database
          .select({
            id: artistProfiles.id,
            artistName: artistProfiles.artistName,
            bio: artistProfiles.bio,
            genre: artistProfiles.genre,
            location: artistProfiles.location,
            profilePhotoUrl: artistProfiles.profilePhotoUrl,
          })
          .from(artistProfiles)
          .where(eq(artistProfiles.id, artistId))
          .limit(1);

        if (artist) {
          const genres = Array.isArray(artist.genre) ? artist.genre.join(', ') : '';
          const locationStr = artist.location ? ` based in ${artist.location}` : '';
          const description = artist.bio
            ? artist.bio.substring(0, 200)
            : `${artist.artistName}${locationStr}${genres ? ` — ${genres}` : ''}. Book on Ologywood.`;
          
          // Use the OG image proxy for JPEG conversion (critical for Twitter/LinkedIn)
          const ogImage = getOgImageUrl(artist.profilePhotoUrl, 'artist', artistId, baseUrl);
          
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Browse Artists', url: '/browse' },
            { name: artist.artistName, url: `/artist/${artistId}` },
          ], baseUrl);

          console.log(`[OG Tags] Artist ${artistId} (${artist.artistName}): image=${ogImage}`);

          return {
            title: `${artist.artistName} | Book on Ologywood`,
            description,
            image: ogImage,
            url: `${baseUrl}/artist/${artistId}`,
            type: 'profile',
            jsonLd: [generateArtistJsonLd(artist, baseUrl), breadcrumb],
          };
        }
      }
    }

    // Match /venue/:id or /venues/:id
    const venueMatch = pathname.match(/^\/venues?\/(\d+)$/);
    if (venueMatch) {
      const venueId = parseInt(venueMatch[1], 10);
      const database = await getDb();
      if (database) {
        const [venue] = await database
          .select({
            id: venueProfiles.id,
            organizationName: venueProfiles.organizationName,
            bio: venueProfiles.bio,
            location: venueProfiles.location,
            profilePhotoUrl: venueProfiles.profilePhotoUrl,
            venueType: venueProfiles.venueType,
            capacity: venueProfiles.capacity,
            averageRating: venueProfiles.averageRating,
            reviewCount: venueProfiles.reviewCount,
          })
          .from(venueProfiles)
          .where(eq(venueProfiles.id, venueId))
          .limit(1);

        if (venue) {
          const typeStr = venue.venueType ? `${venue.venueType} venue` : 'Venue';
          const locationStr = venue.location ? ` in ${venue.location}` : '';
          const description = venue.bio
            ? venue.bio.substring(0, 200)
            : `${venue.organizationName} — ${typeStr}${locationStr}. Find and book artists on Ologywood.`;
          
          // Use the OG image proxy for JPEG conversion
          const ogImage = getOgImageUrl(venue.profilePhotoUrl, 'venue', venueId, baseUrl);
          
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Browse Venues', url: '/venues' },
            { name: venue.organizationName, url: `/venue/${venueId}` },
          ], baseUrl);

          return {
            title: `${venue.organizationName} | Ologywood`,
            description,
            image: ogImage,
            url: `${baseUrl}/venue/${venueId}`,
            type: 'business.business',
            jsonLd: [generateVenueJsonLd(venue, baseUrl), breadcrumb],
          };
        }
      }
    }

    // Match /events/:id
    const eventMatch = pathname.match(/^\/events\/(\d+)$/);
    if (eventMatch) {
      const eventId = parseInt(eventMatch[1], 10);
      const database = await getDb();
      if (database) {
        const [event] = await database
          .select({
            id: events.id,
            eventTitle: events.eventTitle,
            eventType: events.eventType,
            eventDate: events.eventDate,
            eventTime: events.eventTime,
            eventEndTime: events.eventEndTime,
            location: events.location,
            description: events.description,
            isPublic: events.isPublic,
            capacity: events.capacity,
            rate: events.rate,
          })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (event && event.isPublic) {
          const dateStr = event.eventDate ? ` on ${event.eventDate}` : '';
          const locationStr = event.location ? ` at ${event.location}` : '';
          const descriptionText = event.description
            ? event.description.substring(0, 200)
            : `${event.eventTitle}${dateStr}${locationStr}. Discover events on Ologywood.`;
          
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Events', url: '/events' },
            { name: event.eventTitle, url: `/events/${eventId}` },
          ], baseUrl);

          return {
            title: `${event.eventTitle} | Ologywood Events`,
            description: descriptionText,
            image: DEFAULT_OG_IMAGE,
            url: `${baseUrl}/events/${eventId}`,
            type: 'event',
            jsonLd: [generateEventJsonLd({
              ...event,
              eventDate: event.eventDate ? event.eventDate.toISOString().split('T')[0] : null,
            }, baseUrl), breadcrumb],
          };
        }
      }
    }

    // Match /blog/:slug
    const blogMatch = pathname.match(/^\/blog\/([a-z0-9-]+)$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const database = await getDb();
      if (database) {
        const [post] = await database
          .select({
            id: blogPosts.id,
            title: blogPosts.title,
            excerpt: blogPosts.excerpt,
            slug: blogPosts.slug,
            coverImageUrl: blogPosts.coverImageUrl,
            category: blogPosts.category,
            tags: blogPosts.tags,
          })
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);

        if (post) {
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ], baseUrl);

          return {
            title: `${post.title} - Ologywood Blog`,
            description: post.excerpt || `Read ${post.title} on the Ologywood blog.`,
            image: post.coverImageUrl || DEFAULT_OG_IMAGE,
            url: `${baseUrl}/blog/${post.slug}`,
            type: 'article',
            jsonLd: [breadcrumb],
          };
        }
      }
    }

    // Match /browse
    if (pathname === '/browse') {
      const breadcrumb = generateBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Browse Artists', url: '/browse' },
      ], baseUrl);

      return {
        title: 'Browse Artists — Find & Book Talent | Ologywood',
        description: 'Discover and book talented performing artists for your events. Search by genre, location, and availability.',
        image: DEFAULT_OG_IMAGE,
        url: `${baseUrl}/browse`,
        type: 'website',
        jsonLd: [breadcrumb],
      };
    }

    // Match /pricing
    if (pathname === '/pricing') {
      const breadcrumb = generateBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Pricing', url: '/pricing' },
      ], baseUrl);

      const faqSchema = generateFaqPageJsonLd([
        { question: 'Can I change my plan anytime?', answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely! Cancel your subscription anytime with no penalties or hidden fees.' },
        { question: 'How does the booking limit work on the Free plan?', answer: 'Free plan users can send up to 2 booking requests per month. Upgrade to Starter or Professional for unlimited bookings.' },
        { question: 'What is the Rider Builder?', answer: 'The Rider Builder lets artists create professional technical riders with equipment needs, hospitality requirements, and stage specifications. Available on Starter and Professional plans.' },
        { question: 'Can I send email updates to my fans?', answer: 'Yes! Artists on Starter and Professional plans can send branded email updates to all their followers, up to once per day.' },
        { question: 'What are White Label Releases?', answer: 'White Label Releases let artists sell singles directly from their Ologywood profile. Starter plans include up to 2 active singles with pay-what-you-want pricing. Professional plans get unlimited releases. Ologywood takes just a 1% platform fee on each sale.' },
      ]);

      return {
        title: 'Pricing — Simple, Transparent Plans | Ologywood',
        description: 'Choose the perfect plan for your booking needs. Start free, upgrade anytime. Free, Professional ($9.99/mo), and Enterprise plans available.',
        image: DEFAULT_OG_IMAGE,
        url: `${baseUrl}/pricing`,
        type: 'website',
        jsonLd: [breadcrumb, faqSchema],
      };
    }

  } catch (error) {
    console.error('[OG Tags] Error fetching OG data:', error);
  }

  return null;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // For social media bots in dev mode, inject dynamic OG tags
      const userAgent = req.headers['user-agent'] || '';
      if (isSocialBot(userAgent)) {
        let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        baseUrl = baseUrl.replace(/\/$/, '');
        
        // req.path is "/" in app.use("*") handlers, use originalUrl for the actual path
        const pathname = new URL(req.originalUrl, 'http://localhost').pathname;
        const ogData = await getOgDataForPath(pathname, baseUrl);
        if (ogData) {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "../..",
            "client",
            "index.html"
          );
          let template = await fs.promises.readFile(clientTemplate, "utf-8");
          template = injectOgTags(template, ogData);
          console.log(`[OG Tags Dev] Served OG tags for bot: path=${req.path}, title=${ogData.title}, image=${ogData.image}`);
          return res.status(200).set({ "Content-Type": "text/html" }).end(template);
        }
      }

      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const pathname = new URL(url, 'http://localhost').pathname;
      if (isEduLandingPath(pathname)) {
        template = injectEduShareMeta(template);
      } else {
        const baseUrl = (process.env.BASE_URL || `https://${req.get('host')}`).replace(/\/$/, '');
        const ogData = await getOgDataForPath(pathname, baseUrl);
        if (ogData) template = injectOgTags(template, ogData);
        else if (shouldNoIndex(pathname)) template = template.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?\s*>/i, '<meta name="robots" content="noindex, nofollow">');
      }
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function getStaticAssetCacheControl(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  if (/\/assets\/[^/]+[-.][a-z0-9_-]{6,}\.[^/]+$/i.test(normalized)) {
    return 'public, max-age=31536000, immutable';
  }
  if (/(^|\/)(index\.html|manifest\.json|sw\.js)$/.test(normalized)) {
    return 'no-cache, no-store, must-revalidate';
  }
  return null;
}

// The SPA shell contains no user-specific data; auth and API state load after
// boot. A short edge cache reduces repeat-navigation TTFB without allowing a
// published asset shell to remain stale for long.
export const SPA_SHELL_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

export function serveStatic(app: Express) {
  // When running from dist/index.js, __dirname is the dist directory
  // We need to serve files from dist/public
  const distPath = path.join(__dirname, "public");
  console.log(`[Static Files] Serving from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `[ERROR] Could not find the build directory: ${distPath}`
    );
    console.error(`[ERROR] Current __dirname: ${__dirname}`);
    console.error(`[ERROR] Make sure to run 'pnpm build' before starting the server`);
  }
  
  // Use the same fully functional SPA shell, with public EDU metadata for all
  // user agents. This must precede static directory handling to avoid /edu
  // redirecting to /edu/ when a deployment normalizes the trailing slash.
  app.get(['/edu', '/edu/'], async (_req, res, next) => {
    try {
      const html = injectEduShareMeta(await fs.promises.readFile(path.resolve(distPath, 'index.html'), 'utf8'));
      return res.status(200).set({ 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' }).send(html);
    } catch (error) { next(error); }
  });

  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    // Vite filenames under /assets include a content hash, so they are safe to
    // cache for a year. HTML, manifests, service workers, and legacy filenames
    // remain revalidated so a publish can take effect without stale app shells.
    maxAge: 0,
    setHeaders: (res, path) => {
      const cacheControl = getStaticAssetCacheControl(path);
      if (cacheControl) res.setHeader('Cache-Control', cacheControl);
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  // Fall through to index.html for SPA routing (but exclude static files)
  app.use("*", async (req, res) => {
    // req.path is "/" in app.use("*") handlers, use originalUrl for the actual path
    const pathname = new URL(req.originalUrl, 'http://localhost').pathname;
    if (
      pathname.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
      pathname === '/sw.js' ||
      pathname === '/manifest.json'
    ) {
      return res.status(404).send('Not Found');
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    
    // Inject route metadata into the initial HTML for every public request,
    // not only social crawlers. This prevents SEO tools and search bots from
    // seeing the generic homepage shell before React hydrates.
    const userAgent = req.headers['user-agent'] || '';
    try {
      let baseUrl = (process.env.BASE_URL || `https://${req.get('host')}`).replace(/\/$/, '');
      const ogData = await getOgDataForPath(pathname, baseUrl);
      let html = await fs.promises.readFile(indexPath, 'utf-8');
      if (ogData) {
        if (ogData.image && ogData.image.includes('cloudfront.net')) {
          const artistMatch2 = pathname.match(/^\/artist\/(\d+)$/);
          const venueMatch2 = pathname.match(/^\/venue\/(\d+)$/);
          if (artistMatch2) ogData.image = `${baseUrl}/api/og-image/artist/${artistMatch2[1]}`;
          else if (venueMatch2) ogData.image = `${baseUrl}/api/og-image/venue/${venueMatch2[1]}`;
        }
        html = injectOgTags(html, ogData);
      } else if (shouldNoIndex(pathname)) {
        html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?\s*>/i, '<meta name="robots" content="noindex, nofollow">');
      }
      const headers: Record<string, string> = { 'Content-Type': 'text/html', 'Cache-Control': ogData && isSocialBot(userAgent) ? 'no-cache, no-store, must-revalidate' : SPA_SHELL_CACHE_CONTROL };
      if (ogData && isSocialBot(userAgent)) headers.Vary = 'User-Agent';
      return res.status(200).set(headers).send(html);
    } catch (error) {
      console.error('[SEO] Error injecting route metadata:', error);
    }
    
    // Default: serve the public shell with a short edge cache. User-specific
    // state is loaded after boot, while direct index.html remains revalidated
    // through the static-file policy above.
    res.setHeader('Cache-Control', SPA_SHELL_CACHE_CONTROL);
    res.sendFile(indexPath);
  });
}
