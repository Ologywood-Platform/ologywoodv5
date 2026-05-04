import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { artistProfiles, venueProfiles, events } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  generateArtistJsonLd,
  generateVenueJsonLd,
  generateEventJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqPageJsonLd,
  jsonLdToScriptTag,
} from "../utils/jsonLd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optimized 114KB JPEG (was 953KB PNG) for faster social media crawler fetching
// Must be an absolute public URL - social crawlers don't follow relative paths or redirects
const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/XByJYRufALCMxsjM.jpg';

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
  
  // Replace OG tags
  html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${type}">`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(url)}">`);
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}">`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(description)}">`);
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(image)}">`);
  html = html.replace(/<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image:type" content="${imageType}">`);
  
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
        
        const ogData = await getOgDataForPath(req.path, baseUrl);
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
  
  // Serve static files with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
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
    // Don't serve index.html for static assets or special files
    const pathname = req.path;
    if (
      pathname.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i) ||
      pathname === '/sw.js' ||
      pathname === '/manifest.json'
    ) {
      return res.status(404).send('Not Found');
    }
    
    const indexPath = path.resolve(distPath, "index.html");
    
    // For social media bots, inject dynamic OG tags into the HTML
    const userAgent = req.headers['user-agent'] || '';
    if (isSocialBot(userAgent)) {
      try {
        let baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        baseUrl = baseUrl.replace(/\/$/, '');
        
        const ogData = await getOgDataForPath(pathname, baseUrl);
        if (ogData) {
          let html = await fs.promises.readFile(indexPath, 'utf-8');
          html = injectOgTags(html, ogData);
          console.log(`[OG Tags Prod] Served OG tags for bot: path=${pathname}, title=${ogData.title}, image=${ogData.image}`);
          return res.status(200).set('Content-Type', 'text/html').send(html);
        }
      } catch (error) {
        console.error('[OG Tags] Error injecting OG tags in production:', error);
      }
    }
    
    // Default: serve index.html as-is for regular users
    res.sendFile(indexPath);
  });
}
