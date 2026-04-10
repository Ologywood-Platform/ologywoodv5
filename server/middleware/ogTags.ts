import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { artistProfiles, venueProfiles, events } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  generateArtistJsonLd,
  generateVenueJsonLd,
  generateEventJsonLd,
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqPageJsonLd,
  jsonLdToScriptTag,
} from '../utils/jsonLd';

const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ysxOwFpvMPLOUeDm.png';
const SITE_NAME = 'Ologywood';

/**
 * Detect if the request is from a social media crawler / bot
 */
function isSocialBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'Slackbot',
    'TelegramBot',
    'Discordbot',
    'Pinterest',
    'Googlebot',
    'bingbot',
    'Applebot',
    'iMessageLinkPreview',
    'Viber',
    'Line/',
    'Snapchat',
    'SkypeUriPreview',
    'redditbot',
    'Embedly',
    'Quora Link Preview',
    'vkShare',
    'Iframely',
  ];
  return botPatterns.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

/**
 * Escape HTML entities for safe injection into meta tags
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Get the OG image URL for an entity.
 * Uses the /api/og-image proxy to convert WebP/PNG images to JPEG for social media compatibility.
 * Falls back to the default OG image if no profile photo exists.
 */
function getOgImageUrl(profilePhotoUrl: string | null | undefined, entityType: 'artist' | 'venue', entityId: number, baseUrl: string): string {
  if (!profilePhotoUrl) {
    return DEFAULT_OG_IMAGE;
  }
  // Always use the proxy endpoint to ensure JPEG format for social media
  return `${baseUrl}/api/og-image/${entityType}/${entityId}`;
}

/**
 * Generate an HTML page with OG meta tags and JSON-LD for social media crawlers
 */
function generateOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  jsonLd?: object | object[];
}): string {
  const { title, description, image, url, type = 'website', jsonLd } = opts;
  const jsonLdTags = jsonLd ? `\n  ${jsonLdToScriptTag(jsonLd)}` : '';
  
  // Determine image type based on URL
  const imageType = image.includes('/api/og-image/') ? 'image/jpeg' : 
    image.endsWith('.png') ? 'image/png' : 
    image.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="twitter:site" content="@ologywood" />
  ${jsonLdTags}
</head>
<body>
  <p>${escapeHtml(title)}</p>
  <p>${escapeHtml(description)}</p>
</body>
</html>`;
}

/**
 * Middleware that intercepts social media bot requests for artist, venue, and event pages
 * and returns proper OG meta tags + JSON-LD structured data from the database.
 * 
 * Uses /api/og-image proxy endpoints to serve images as JPEG for maximum social media compatibility.
 * Twitter, LinkedIn, and some other platforms don't reliably support WebP in OG meta tags.
 */
export function ogTagMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Only intercept for social media bots
    if (!isSocialBot(userAgent)) {
      return next();
    }

    const pathname = req.path;
    let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
    baseUrl = baseUrl.replace(/\/$/, '');

    try {
      // Match homepage /
      if (pathname === '/') {
        const html = generateOgHtml({
          title: 'Ologywood — Book Talented Artists for Your Events',
          description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place.',
          image: DEFAULT_OG_IMAGE,
          url: baseUrl,
          type: 'website',
          jsonLd: [
            generateOrganizationJsonLd(baseUrl),
            generateWebSiteJsonLd(baseUrl),
          ],
        });
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }

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

            const html = generateOgHtml({
              title: `${artist.artistName} | Book on Ologywood`,
              description,
              image: ogImage,
              url: `${baseUrl}/artist/${artistId}`,
              type: 'profile',
              jsonLd: [generateArtistJsonLd(artist, baseUrl), breadcrumb],
            });
            console.log(`[OG Tags] Served artist OG for bot: id=${artistId}, name=${artist.artistName}, image=${ogImage}, ua=${userAgent.substring(0, 60)}`);
            return res.status(200).set('Content-Type', 'text/html').send(html);
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

            const html = generateOgHtml({
              title: `${venue.organizationName} | Ologywood`,
              description,
              image: ogImage,
              url: `${baseUrl}/venue/${venueId}`,
              type: 'business.business',
              jsonLd: [generateVenueJsonLd(venue, baseUrl), breadcrumb],
            });
            console.log(`[OG Tags] Served venue OG for bot: id=${venueId}, name=${venue.organizationName}, image=${ogImage}`);
            return res.status(200).set('Content-Type', 'text/html').send(html);
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

            const html = generateOgHtml({
              title: `${event.eventTitle} | Ologywood Events`,
              description: descriptionText,
              image: DEFAULT_OG_IMAGE,
              url: `${baseUrl}/events/${eventId}`,
              type: 'event',
              jsonLd: [generateEventJsonLd({
                ...event,
                eventDate: event.eventDate ? event.eventDate.toISOString().split('T')[0] : null,
              }, baseUrl), breadcrumb],
            });
            return res.status(200).set('Content-Type', 'text/html').send(html);
          }
        }
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

        const html = generateOgHtml({
          title: 'Pricing — Simple, Transparent Plans | Ologywood',
          description: 'Choose the perfect plan for your booking needs. Start free, upgrade anytime. Free, Professional ($9.99/mo), and Enterprise plans available.',
          image: DEFAULT_OG_IMAGE,
          url: `${baseUrl}/pricing`,
          type: 'website',
          jsonLd: [breadcrumb, faqSchema],
        });
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }

      // Match /browse
      if (pathname === '/browse') {
        const breadcrumb = generateBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Browse Artists', url: '/browse' },
        ], baseUrl);

        const html = generateOgHtml({
          title: 'Browse Artists — Find & Book Talent | Ologywood',
          description: 'Discover and book talented performing artists for your events. Search by genre, location, and availability.',
          image: DEFAULT_OG_IMAGE,
          url: `${baseUrl}/browse`,
          type: 'website',
          jsonLd: [breadcrumb],
        });
        return res.status(200).set('Content-Type', 'text/html').send(html);
      }

    } catch (error) {
      console.error('[OG Tags] Error generating OG tags:', error);
    }

    // Fall through to normal SPA handling for non-matched routes or errors
    return next();
  };
}
