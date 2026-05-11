import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { artistProfiles, venueProfiles, events, blogPosts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  generateArtistJsonLd,
  generateVenueJsonLd,
  generateEventJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqPageJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  jsonLdToScriptTag,
} from '../utils/jsonLd';

const router = Router();

const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/yZNBAlaBsVCCLvfC.jpg';
const SITE_NAME = 'Ologywood';

/**
 * Detect if the request is from a social media crawler / bot
 */
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getOgImageUrl(profilePhotoUrl: string | null | undefined, entityType: 'artist' | 'venue', entityId: number, baseUrl: string): string {
  if (!profilePhotoUrl) {
    return DEFAULT_OG_IMAGE;
  }
  return `${baseUrl}/api/og-image/${entityType}/${entityId}`;
}

function generateOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  canonicalUrl: string;
  type?: string;
  jsonLd?: object | object[];
}): string {
  const { title, description, image, url, canonicalUrl, type = 'website', jsonLd } = opts;
  const jsonLdTags = jsonLd ? `\n  ${jsonLdToScriptTag(jsonLd)}` : '';
  
  const imageType = image.includes('/api/og-image/') ? 'image/jpeg' : 
    image.endsWith('.png') ? 'image/png' : 
    image.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  
  // For social bots: return full OG HTML with og:url pointing to the canonical SPA URL
  // For regular users: JavaScript redirect to the SPA page
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:site" content="@ologywood" />
  ${jsonLdTags}
  
  <!-- Redirect regular users to the SPA page -->
  <script>window.location.replace("${canonicalUrl}");</script>
  <noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" /></noscript>
</head>
<body>
  <p>${escapeHtml(title)}</p>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(canonicalUrl)}">View on Ologywood</a></p>
</body>
</html>`;
}

/**
 * /api/og-page/* - Serves OG-rich HTML for social media crawlers
 * 
 * Social bots get full OG meta tags + JSON-LD structured data
 * Regular users get redirected to the actual SPA page via JavaScript
 * 
 * This endpoint exists because the Manus deployment serves static index.html
 * for non-API paths, so the Express OG middleware never sees those requests.
 * 
 * Usage: Share https://www.ologywood.com/api/og-page/artist/25 instead of /artist/25
 * The og:url still points to /artist/25 so Facebook shows the canonical URL.
 */

// Artist pages
router.get('/artist/:id', async (req: Request, res: Response) => {
  const artistId = parseInt(req.params.id, 10);
  if (isNaN(artistId)) {
    return res.status(400).json({ error: 'Invalid artist ID' });
  }

  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/artist/${artistId}`;

  try {
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
        
        const ogImage = getOgImageUrl(artist.profilePhotoUrl, 'artist', artistId, baseUrl);
        
        const breadcrumb = generateBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Browse Artists', url: '/browse' },
          { name: artist.artistName, url: `/artist/${artistId}` },
        ], baseUrl);

        const html = generateOgHtml({
          title: `${artist.artistName} | Book on Ologywood`,
          description,
          image: ogImage,
          url: `${baseUrl}/api/og-page/artist/${artistId}`,
          canonicalUrl,
          type: 'profile',
          jsonLd: [generateArtistJsonLd(artist, baseUrl), breadcrumb],
        });
        
        console.log(`[OG Page] Served artist OG: id=${artistId}, name=${artist.artistName}, ua=${(req.headers['user-agent'] || '').substring(0, 60)}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating artist OG:', error);
  }

  // Fallback: redirect to the SPA page
  return res.redirect(302, canonicalUrl);
});

// Venue pages
router.get('/venue/:id', async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id, 10);
  if (isNaN(venueId)) {
    return res.status(400).json({ error: 'Invalid venue ID' });
  }

  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/venue/${venueId}`;

  try {
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
        
        const ogImage = getOgImageUrl(venue.profilePhotoUrl, 'venue', venueId, baseUrl);
        
        const breadcrumb = generateBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Browse Venues', url: '/venues' },
          { name: venue.organizationName, url: `/venue/${venueId}` },
        ], baseUrl);

        const html = generateOgHtml({
          title: `${venue.organizationName} | Ologywood`,
          description,
          image: ogImage,
          url: `${baseUrl}/api/og-page/venue/${venueId}`,
          canonicalUrl,
          type: 'business.business',
          jsonLd: [generateVenueJsonLd(venue, baseUrl), breadcrumb],
        });
        
        console.log(`[OG Page] Served venue OG: id=${venueId}, name=${venue.organizationName}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating venue OG:', error);
  }

  return res.redirect(302, canonicalUrl);
});

// Event pages
router.get('/event/:id', async (req: Request, res: Response) => {
  const eventId = parseInt(req.params.id, 10);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/events/${eventId}`;

  try {
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

        const html = generateOgHtml({
          title: `${event.eventTitle} | Ologywood Events`,
          description: descriptionText,
          image: DEFAULT_OG_IMAGE,
          url: `${baseUrl}/api/og-page/event/${eventId}`,
          canonicalUrl,
          type: 'event',
          jsonLd: [generateEventJsonLd({
            ...event,
            eventDate: event.eventDate ? event.eventDate.toISOString().split('T')[0] : null,
          }, baseUrl), breadcrumb],
        });
        
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating event OG:', error);
  }

  return res.redirect(302, canonicalUrl);
});

// Blog pages
router.get('/blog/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;

  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/blog/${slug}`;

  try {
    const database = await getDb();
    if (database) {
      const [post] = await database
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          excerpt: blogPosts.excerpt,
          slug: blogPosts.slug,
          coverImageUrl: blogPosts.coverImageUrl,
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

        const html = generateOgHtml({
          title: `${post.title} - Ologywood Blog`,
          description: post.excerpt || `Read ${post.title} on the Ologywood blog.`,
          image: post.coverImageUrl || DEFAULT_OG_IMAGE,
          url: `${baseUrl}/api/og-page/blog/${slug}`,
          canonicalUrl,
          type: 'article',
          jsonLd: [breadcrumb],
        });
        
        console.log(`[OG Page] Served blog OG: slug=${slug}, title=${post.title}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating blog OG:', error);
  }

  return res.redirect(302, canonicalUrl);
});

// Static pages (homepage, browse, pricing)
router.get('/home', async (req: Request, res: Response) => {
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');

  const html = generateOgHtml({
    title: 'Ologywood — Book Talented Artists for Your Events',
    description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place.',
    image: DEFAULT_OG_IMAGE,
    url: `${baseUrl}/api/og-page/home`,
    canonicalUrl: baseUrl,
    type: 'website',
    jsonLd: [generateOrganizationJsonLd(baseUrl), generateWebSiteJsonLd(baseUrl)],
  });
  
  return res.status(200).set('Content-Type', 'text/html').send(html);
});

router.get('/browse', async (req: Request, res: Response) => {
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Browse Artists', url: '/browse' },
  ], baseUrl);

  const html = generateOgHtml({
    title: 'Browse Artists — Find & Book Talent | Ologywood',
    description: 'Discover and book talented performing artists for your events. Search by genre, location, and availability.',
    image: DEFAULT_OG_IMAGE,
    url: `${baseUrl}/api/og-page/browse`,
    canonicalUrl: `${baseUrl}/browse`,
    type: 'website',
    jsonLd: [breadcrumb],
  });
  
  return res.status(200).set('Content-Type', 'text/html').send(html);
});

router.get('/pricing', async (req: Request, res: Response) => {
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');

  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' },
  ], baseUrl);

  const faqSchema = generateFaqPageJsonLd([
    { question: 'Can I change my plan anytime?', answer: 'Yes! You can upgrade or downgrade your plan at any time.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards through Stripe.' },
    { question: 'Can I cancel anytime?', answer: 'Absolutely! Cancel your subscription anytime with no penalties.' },
  ]);

  const html = generateOgHtml({
    title: 'Pricing — Simple, Transparent Plans | Ologywood',
    description: 'Choose the perfect plan for your booking needs. Start free, upgrade anytime.',
    image: DEFAULT_OG_IMAGE,
    url: `${baseUrl}/api/og-page/pricing`,
    canonicalUrl: `${baseUrl}/pricing`,
    type: 'website',
    jsonLd: [breadcrumb, faqSchema],
  });
  
  return res.status(200).set('Content-Type', 'text/html').send(html);
});

export default router;
