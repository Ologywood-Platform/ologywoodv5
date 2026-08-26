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

const DEFAULT_OG_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-social-preview-2026_af1c0d6d.png';
const SITE_NAME = 'Ologywood';

/**
 * Convert a name to a URL-friendly slug
 * "Joe Watts" -> "joe-watts"
 * "LOOSE CHAIN" -> "loose-chain"
 * "Adrianne & Musicbox" -> "adrianne-musicbox"
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

/**
 * Extract the numeric ID from a slug like "joe-watts-25" or just "25"
 * The ID is always the last segment after the final hyphen (if numeric)
 * or the entire string if it's just a number.
 */
function extractIdFromSlug(slug: string): number | null {
  // Try: "25" (just an ID)
  const directId = parseInt(slug, 10);
  if (!isNaN(directId) && String(directId) === slug) {
    return directId;
  }
  // Try: "joe-watts-25" (slug with ID at the end)
  const lastHyphen = slug.lastIndexOf('-');
  if (lastHyphen !== -1) {
    const idPart = slug.substring(lastHyphen + 1);
    const id = parseInt(idPart, 10);
    if (!isNaN(id) && String(id) === idPart) {
      return id;
    }
  }
  return null;
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
  // Use the /api/og-image/ proxy which converts WebP to JPEG for social media compatibility.
  // Twitter/X does NOT support WebP images in cards — must be JPEG or PNG.
  // Confirmed: /api/og-image/ returns HTTP 200 on production for all bot UAs.
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
  
  <!-- Redirect regular users to the SPA page (delayed to let bots read OG tags) -->
  <noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" /></noscript>
</head>
<body>
  <p>${escapeHtml(title)}</p>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(canonicalUrl)}">View on Ologywood</a></p>
  <script>
    // Redirect after DOM is fully loaded - bots typically don't wait for DOMContentLoaded
    if (!/bot|crawl|spider|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Telegram|Pinterest|Googlebot/i.test(navigator.userAgent)) {
      window.location.replace("${canonicalUrl}");
    }
  </script>
</body>
</html>`;
}

/**
 * /api/og-page/* - Serves OG-rich HTML for social media crawlers
 * 
 * URLs support readable slugs with the ID at the end:
 *   /api/og-page/artist/joe-watts-25
 *   /api/og-page/artist/25  (also works, backwards compatible)
 *   /api/og-page/venue/the-roxy-theatre-1
 * 
 * Social bots get full OG meta tags + JSON-LD structured data.
 * Regular users get redirected to the actual SPA page via JavaScript.
 * The og:url points to the canonical /artist/25 URL.
 */

// Artist pages — supports /artist/:slug (e.g., joe-watts-25) or /artist/:id (e.g., 25)
router.get('/artist/:slug', async (req: Request, res: Response) => {
  const artistId = extractIdFromSlug(req.params.slug);
  if (artistId === null) {
    return res.status(400).json({ error: 'Invalid artist URL. Use format: /api/og-page/artist/artist-name-ID' });
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
        const correctSlug = `${toSlug(artist.artistName)}-${artistId}`;

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
          url: `${baseUrl}/api/og-page/artist/${correctSlug}`,
          canonicalUrl,
          type: 'profile',
          jsonLd: [generateArtistJsonLd(artist, baseUrl), breadcrumb],
        });
        
        console.log(`[OG Page] Served artist OG: id=${artistId}, name=${artist.artistName}, slug=${correctSlug}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating artist OG:', error);
  }

  return res.redirect(302, canonicalUrl);
});

// Venue pages — supports /venue/:slug or /venue/:id
router.get('/venue/:slug', async (req: Request, res: Response) => {
  const venueId = extractIdFromSlug(req.params.slug);
  if (venueId === null) {
    return res.status(400).json({ error: 'Invalid venue URL' });
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
        const correctSlug = `${toSlug(venue.organizationName)}-${venueId}`;
        
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
          url: `${baseUrl}/api/og-page/venue/${correctSlug}`,
          canonicalUrl,
          type: 'business.business',
          jsonLd: [generateVenueJsonLd(venue, baseUrl), breadcrumb],
        });
        
        console.log(`[OG Page] Served venue OG: id=${venueId}, name=${venue.organizationName}, slug=${correctSlug}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating venue OG:', error);
  }

  return res.redirect(302, canonicalUrl);
});

// Event pages
router.get('/event/:slug', async (req: Request, res: Response) => {
  const eventId = extractIdFromSlug(req.params.slug);
  if (eventId === null) {
    return res.status(400).json({ error: 'Invalid event URL' });
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
        
        const correctSlug = `${toSlug(event.eventTitle)}-${eventId}`;
        
        const breadcrumb = generateBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Events', url: '/events' },
          { name: event.eventTitle, url: `/events/${eventId}` },
        ], baseUrl);

        const html = generateOgHtml({
          title: `${event.eventTitle} | Ologywood Events`,
          description: descriptionText,
          image: DEFAULT_OG_IMAGE,
          url: `${baseUrl}/api/og-page/event/${correctSlug}`,
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

// Blog pages (already use slugs naturally)
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

// Static pages
router.get('/home', async (req: Request, res: Response) => {
  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');

  const html = generateOgHtml({
    title: 'Build Your Brand. Grow Your Fans. Create More Opportunities.',
    description: 'Creators own their audience. Creators choose where their content lives. OlogyWood powers everything that makes that content profitable — bookings, Sell Tickets, fan clubs, merch, and content releases.',
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

// Project Preview pages — /api/og-page/project/:id
router.get('/project/:id', async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
  baseUrl = baseUrl.replace(/\/$/, '');

  try {
    const database = await getDb();
    if (database) {
      const { projectPreviews: pp, artistProfiles: ap } = await import('../../drizzle/schema');
      const [project] = await database
        .select({
          id: pp.id,
          title: pp.title,
          releaseType: pp.releaseType,
          coverArtUrl: pp.coverArtUrl,
          description: pp.description,
          userId: pp.userId,
          status: pp.status,
        })
        .from(pp)
        .where(eq(pp.id, projectId))
        .limit(1);

      if (project) {
        // Get artist name for the OG card
        const [artist] = await database
          .select({ id: ap.id, artistName: ap.artistName })
          .from(ap)
          .where(eq(ap.userId, project.userId))
          .limit(1);

        const artistName = artist?.artistName || 'Artist';
        const artistId = artist?.id;
        const canonicalUrl = artistId ? `${baseUrl}/artist/${artistId}#projects` : baseUrl;
        const description = project.description
          ? project.description.substring(0, 200)
          : `${project.title} — ${project.releaseType.replace('_', ' ')} by ${artistName}. Listen to previews on Ologywood.`;
        const ogImage = project.coverArtUrl || DEFAULT_OG_IMAGE;

        const html = generateOgHtml({
          title: `${project.title} by ${artistName} | Ologywood`,
          description,
          image: ogImage,
          url: `${baseUrl}/api/og-page/project/${projectId}`,
          canonicalUrl,
          type: 'music.album',
        });

        console.log(`[OG Page] Served project OG: id=${projectId}, title=${project.title}, artist=${artistName}`);
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }
    }
  } catch (error) {
    console.error('[OG Page] Error generating project OG:', error);
  }

  return res.redirect(302, baseUrl);
});

export default router;
