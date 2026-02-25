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

const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ysxOwFpvMPLOUeDm.png';

function isSocialBot(userAgent: string): boolean {
  const botPatterns = [
    'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
    'WhatsApp', 'Slackbot', 'TelegramBot', 'Discordbot', 'Pinterest',
    'Googlebot', 'bingbot', 'Applebot', 'iMessageLinkPreview',
  ];
  return botPatterns.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
          
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Browse Artists', url: '/browse' },
            { name: artist.artistName, url: `/artist/${artistId}` },
          ], baseUrl);

          return {
            title: `${artist.artistName} | Book on Ologywood`,
            description,
            image: artist.profilePhotoUrl || DEFAULT_OG_IMAGE,
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
          
          const breadcrumb = generateBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Browse Venues', url: '/venues' },
            { name: venue.organizationName, url: `/venue/${venueId}` },
          ], baseUrl);

          return {
            title: `${venue.organizationName} | Ologywood`,
            description,
            image: venue.profilePhotoUrl || DEFAULT_OG_IMAGE,
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
        { question: 'Is there a free trial?', answer: 'Yes! Professional plan includes a 14-day free trial. No credit card required.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely! Cancel your subscription anytime with no penalties or hidden fees.' },
        { question: 'Do you offer discounts for annual billing?', answer: 'Yes! Annual billing saves you 20% compared to monthly. Contact our sales team for details.' },
        { question: 'What about refunds?', answer: 'We offer a 30-day money-back guarantee if you\'re not satisfied with our service.' },
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
