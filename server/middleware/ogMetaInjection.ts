/**
 * Server-side Open Graph Meta Tag Injection Middleware
 * 
 * When social media crawlers (Facebook, Twitter, iMessage, WhatsApp, LinkedIn, etc.)
 * request an artist profile URL like /artist/123, this middleware:
 * 1. Detects the crawler via User-Agent
 * 2. Fetches the artist's profile data from the database
 * 3. Injects artist-specific OG meta tags into index.html
 * 4. Serves the modified HTML so the social preview shows the artist, not the homepage
 * 
 * For regular browsers, the request passes through to the SPA catch-all as normal.
 */

import { Request, Response, NextFunction } from 'express';
import * as db from '../db';
import path from 'path';
import fs from 'fs';

// Social media crawler User-Agent patterns
const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'Applebot',
  'iMessageLinkPreview',
  'Googlebot',
  'bingbot',
  'Baiduspider',
  'DuckDuckBot',
  'Embedly',
  'Quora Link Preview',
  'Showyoubot',
  'outbrain',
  'vkShare',
  'W3C_Validator',
  'redditbot',
  'Rogerbot',
  'Sogou',
  'Yahoo! Slurp',
  'yandex',
  'ImgProxy',
  'Viber',
  'Line/',
  'Snapchat',
  'SkypeUriPreview',
  'Iframely',
];

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

const DEFAULT_OG_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-social-preview-2026_af1c0d6d.png';
const SITE_NAME = 'Ologywood';
const BASE_URL = 'https://www.ologywood.com';

/**
 * Middleware to inject artist-specific OG meta tags for social crawlers
 */
export function ogMetaInjectionMiddleware(publicPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only handle GET requests to /artist/:id
    const artistMatch = req.path.match(/^\/artist\/(\d+)$/);
    if (!artistMatch) {
      return next();
    }

    // Only inject for crawlers — let browsers use the SPA
    const userAgent = req.headers['user-agent'] || '';
    if (!isCrawler(userAgent)) {
      return next();
    }

    const artistId = parseInt(artistMatch[1], 10);
    if (isNaN(artistId) || artistId <= 0) {
      return next();
    }

    try {
      // Fetch artist data from database
      const artist = await db.getArtistProfileById(artistId);
      
      if (!artist) {
        // Artist not found — fall through to SPA
        return next();
      }

      // Read the index.html template
      const indexPath = path.join(publicPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');

      // Build artist-specific meta values
      const artistName = (artist as any).artistName || 'Artist';
      const genre = (artist as any).genre || '';
      const bio = (artist as any).bio || '';
      const location = (artist as any).location || '';
      const rawProfilePhoto = (artist as any).profilePhotoUrl;
      // Use the OG image proxy for artist photos to ensure JPEG format for Twitter/social media
      // Falls back to default OG image if no profile photo
      const profilePhoto = rawProfilePhoto 
        ? `${BASE_URL}/api/og-image/artist/${artistId}`
        : DEFAULT_OG_IMAGE;
      const profileUrl = `${BASE_URL}/artist/${artistId}`;

      // Build title and description
      const ogTitle = `${artistName} - Book on ${SITE_NAME}`;
      const descParts = [];
      if (genre) descParts.push(genre);
      if (location) descParts.push(`Based in ${location}`);
      if (bio) {
        const shortBio = bio.length > 150 ? bio.substring(0, 147) + '...' : bio;
        descParts.push(shortBio);
      }
      const ogDescription = descParts.length > 0
        ? descParts.join(' | ')
        : `Check out ${artistName} on Ologywood - Book talented artists for your events!`;

      // Escape HTML entities for safe injection
      const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Replace OG meta tags in the HTML
      // Title
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${escapeHtml(ogTitle)}</title>`
      );
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${escapeHtml(ogDescription)}" />`
      );

      // Canonical
      html = html.replace(
        /<link rel="canonical" href=".*?" \/>/,
        `<link rel="canonical" href="${escapeHtml(profileUrl)}" />`
      );

      // Open Graph tags
      html = html.replace(
        /<meta property="og:url" content=".*?" \/>/,
        `<meta property="og:url" content="${escapeHtml(profileUrl)}" />`
      );
      html = html.replace(
        /<meta property="og:title" content=".*?" \/>/,
        `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`
      );
      html = html.replace(
        /<meta property="og:description" content=".*?" \/>/,
        `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`
      );
      html = html.replace(
        /<meta property="og:image" content=".*?" \/>/,
        `<meta property="og:image" content="${escapeHtml(profilePhoto)}" />`
      );
      html = html.replace(
        /<meta property="og:image:type" content=".*?" \/>/,
        `<meta property="og:image:type" content="image/jpeg" />`
      );
      html = html.replace(
        /<meta property="og:type" content=".*?" \/>/,
        `<meta property="og:type" content="profile" />`
      );

      // Twitter Card tags
      html = html.replace(
        /<meta name="twitter:url" content=".*?" \/>/,
        `<meta name="twitter:url" content="${escapeHtml(profileUrl)}" />`
      );
      html = html.replace(
        /<meta name="twitter:title" content=".*?" \/>/,
        `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`
      );
      html = html.replace(
        /<meta name="twitter:description" content=".*?" \/>/,
        `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`
      );
      html = html.replace(
        /<meta name="twitter:image" content=".*?" \/>/,
        `<meta name="twitter:image" content="${escapeHtml(profilePhoto)}" />`
      );

      // Send the modified HTML
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

      console.log(`[OG Meta] Served artist OG tags for crawler: artistId=${artistId}, name=${artistName}, ua=${userAgent.substring(0, 50)}`);
    } catch (error) {
      console.error('[OG Meta] Error injecting artist meta tags:', error);
      // Fall through to SPA on error
      return next();
    }
  };
}

/**
 * Middleware to inject venue-specific OG meta tags for social crawlers
 */
export function venueOgMetaInjectionMiddleware(publicPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const venueMatch = req.path.match(/^\/venue\/(\d+)$/) || req.path.match(/^\/venues\/(\d+)$/);
    if (!venueMatch) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    if (!isCrawler(userAgent)) {
      return next();
    }

    const venueId = parseInt(venueMatch[1], 10);
    if (isNaN(venueId) || venueId <= 0) {
      return next();
    }

    try {
      const venue = await db.getVenueProfileById(venueId);
      
      if (!venue) {
        return next();
      }

      const indexPath = path.join(publicPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');

      const venueName = (venue as any).venueName || 'Venue';
      const venueType = (venue as any).venueType || '';
      const description = (venue as any).description || '';
      const location = (venue as any).location || '';
      const rawProfilePhoto = (venue as any).profilePhotoUrl;
      const profilePhoto = rawProfilePhoto 
        ? `${BASE_URL}/api/og-image/venue/${venueId}`
        : DEFAULT_OG_IMAGE;
      const profileUrl = `${BASE_URL}/venue/${venueId}`;

      const ogTitle = `${venueName} - ${SITE_NAME}`;
      const descParts = [];
      if (venueType) descParts.push(venueType);
      if (location) descParts.push(location);
      if (description) {
        const shortDesc = description.length > 150 ? description.substring(0, 147) + '...' : description;
        descParts.push(shortDesc);
      }
      const ogDescription = descParts.length > 0
        ? descParts.join(' | ')
        : `Check out ${venueName} on Ologywood - Find the perfect venue for your events!`;

      const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(ogTitle)}</title>`);
      html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${escapeHtml(profileUrl)}" />`);
      html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${escapeHtml(profileUrl)}" />`);
      html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${escapeHtml(profilePhoto)}" />`);
      html = html.replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="profile" />`);
      html = html.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${escapeHtml(profileUrl)}" />`);
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`);
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${escapeHtml(profilePhoto)}" />`);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);

      console.log(`[OG Meta] Served venue OG tags for crawler: venueId=${venueId}, name=${venueName}`);
    } catch (error) {
      console.error('[OG Meta] Error injecting venue meta tags:', error);
      return next();
    }
  };
}

/**
 * Middleware to inject event-specific OG meta tags for social crawlers
 */
export function eventOgMetaInjectionMiddleware(publicPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const eventMatch = req.path.match(/^\/events\/(\d+)$/);
    if (!eventMatch) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    if (!isCrawler(userAgent)) {
      return next();
    }

    const eventId = parseInt(eventMatch[1], 10);
    if (isNaN(eventId) || eventId <= 0) {
      return next();
    }

    try {
      const event = await db.getEventById(eventId);
      
      if (!event) {
        return next();
      }

      const indexPath = path.join(publicPath, 'index.html');
      let html = fs.readFileSync(indexPath, 'utf-8');

      const eventTitle = (event as any).title || 'Event';
      const eventDescription = (event as any).description || '';
      const eventDate = (event as any).eventDate ? new Date((event as any).eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const eventLocation = (event as any).location || '';
      const eventImage = (event as any).flyerImageUrl || DEFAULT_OG_IMAGE;
      const eventUrl = `${BASE_URL}/events/${eventId}`;

      const ogTitle = `${eventTitle} - ${SITE_NAME}`;
      const descParts = [];
      if (eventDate) descParts.push(eventDate);
      if (eventLocation) descParts.push(eventLocation);
      if (eventDescription) {
        const shortDesc = eventDescription.length > 150 ? eventDescription.substring(0, 147) + '...' : eventDescription;
        descParts.push(shortDesc);
      }
      const ogDescription = descParts.length > 0
        ? descParts.join(' | ')
        : `Check out ${eventTitle} on Ologywood!`;

      const escapeHtml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(ogTitle)}</title>`);
      html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${escapeHtml(eventUrl)}" />`);
      html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${escapeHtml(eventUrl)}" />`);
      html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`);
      html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${escapeHtml(eventImage)}" />`);
      html = html.replace(/<meta property="og:type" content=".*?" \/>/, `<meta property="og:type" content="event" />`);
      html = html.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${escapeHtml(eventUrl)}" />`);
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`);
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${escapeHtml(eventImage)}" />`);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);

      console.log(`[OG Meta] Served event OG tags for crawler: eventId=${eventId}, title=${eventTitle}`);
    } catch (error) {
      console.error('[OG Meta] Error injecting event meta tags:', error);
      return next();
    }
  };
}
