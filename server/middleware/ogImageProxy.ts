/**
 * OG Image Proxy Endpoint
 * 
 * Serves artist/venue profile photos as JPEG images for social media crawlers.
 * Twitter, LinkedIn, and some other platforms don't reliably support WebP in OG meta tags,
 * so this endpoint fetches the original image and converts it to JPEG on the fly.
 * 
 * Routes:
 *   GET /api/og-image/artist/:id
 *   GET /api/og-image/venue/:id
 */

import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import { getDb } from '../db';
import { artistProfiles, venueProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Cache converted images for 1 hour to avoid repeated conversions
const IMAGE_CACHE_SECONDS = 3600;

// Default fallback image URL
const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ysxOwFpvMPLOUeDm.png';

// Simple in-memory cache
const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();

function getCachedImage(key: string): Buffer | null {
  const cached = imageCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < IMAGE_CACHE_SECONDS * 1000) {
    return cached.buffer;
  }
  if (cached) {
    imageCache.delete(key);
  }
  return null;
}

function setCachedImage(key: string, buffer: Buffer): void {
  // Limit cache to 50 entries to prevent memory issues
  if (imageCache.size >= 50) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(key, { buffer, timestamp: Date.now() });
}

async function fetchAndConvertToJpeg(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log(`[OG Image Proxy] Fetching: ${imageUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'OlogywoodOGProxy/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[OG Image Proxy] Failed to fetch image: HTTP ${response.status} from ${imageUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.error(`[OG Image Proxy] Non-image content-type: ${contentType} from ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      console.error(`[OG Image Proxy] Image too small (${buffer.length} bytes), likely invalid: ${imageUrl}`);
      return null;
    }

    // Convert to JPEG using sharp, resize to 1200x630 (standard OG image dimensions)
    const jpegBuffer = await sharp(buffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    console.log(`[OG Image Proxy] Converted to JPEG: ${jpegBuffer.length} bytes from ${imageUrl}`);
    return jpegBuffer;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[OG Image Proxy] Timeout fetching image: ${imageUrl}`);
    } else {
      console.error(`[OG Image Proxy] Error converting image from ${imageUrl}:`, error.message);
    }
    return null;
  }
}

/**
 * Serve a fallback default image as JPEG
 */
async function serveFallbackImage(res: Response, cacheKey: string): Promise<void> {
  // Try to serve the default OG image
  const cached = getCachedImage('default-fallback');
  if (cached) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(cached);
    return;
  }

  const jpegBuffer = await fetchAndConvertToJpeg(DEFAULT_OG_IMAGE);
  if (jpegBuffer) {
    setCachedImage('default-fallback', jpegBuffer);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(jpegBuffer);
    return;
  }

  // Last resort: return a 1x1 pixel JPEG
  const pixel = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=', 'base64');
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(pixel);
}

router.get('/artist/:id', async (req: Request, res: Response) => {
  const artistId = parseInt(req.params.id, 10);
  if (isNaN(artistId) || artistId <= 0) {
    return res.status(404).send('Not found');
  }

  const cacheKey = `artist-${artistId}`;

  // Check cache first
  const cached = getCachedImage(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(cached);
  }

  try {
    const database = await getDb();
    if (!database) {
      console.error('[OG Image Proxy] Database not available');
      return serveFallbackImage(res, cacheKey);
    }

    const [artist] = await database
      .select({ profilePhotoUrl: artistProfiles.profilePhotoUrl })
      .from(artistProfiles)
      .where(eq(artistProfiles.id, artistId))
      .limit(1);

    const profilePhotoUrl = artist?.profilePhotoUrl;

    if (!profilePhotoUrl) {
      console.log(`[OG Image Proxy] No profile photo for artist ${artistId}, serving fallback`);
      return serveFallbackImage(res, cacheKey);
    }

    const jpegBuffer = await fetchAndConvertToJpeg(profilePhotoUrl);
    if (!jpegBuffer) {
      console.log(`[OG Image Proxy] Failed to convert image for artist ${artistId}, serving fallback`);
      return serveFallbackImage(res, cacheKey);
    }

    setCachedImage(cacheKey, jpegBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(jpegBuffer);

    console.log(`[OG Image Proxy] Served JPEG for artist ${artistId} (${jpegBuffer.length} bytes)`);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for artist ${artistId}:`, error);
    return serveFallbackImage(res, cacheKey);
  }
});

router.get('/venue/:id', async (req: Request, res: Response) => {
  const venueId = parseInt(req.params.id, 10);
  if (isNaN(venueId) || venueId <= 0) {
    return res.status(404).send('Not found');
  }

  const cacheKey = `venue-${venueId}`;
  const cached = getCachedImage(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(cached);
  }

  try {
    const database = await getDb();
    if (!database) {
      return serveFallbackImage(res, cacheKey);
    }

    const [venue] = await database
      .select({ profilePhotoUrl: venueProfiles.profilePhotoUrl })
      .from(venueProfiles)
      .where(eq(venueProfiles.id, venueId))
      .limit(1);

    const profilePhotoUrl = venue?.profilePhotoUrl;

    if (!profilePhotoUrl) {
      return serveFallbackImage(res, cacheKey);
    }

    const jpegBuffer = await fetchAndConvertToJpeg(profilePhotoUrl);
    if (!jpegBuffer) {
      return serveFallbackImage(res, cacheKey);
    }

    setCachedImage(cacheKey, jpegBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(jpegBuffer);

    console.log(`[OG Image Proxy] Served JPEG for venue ${venueId}`);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for venue ${venueId}:`, error);
    return serveFallbackImage(res, cacheKey);
  }
});

export default router;
