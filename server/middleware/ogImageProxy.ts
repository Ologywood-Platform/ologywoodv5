/**
 * OG Image Proxy Endpoint
 * 
 * Serves artist/venue/event profile photos as JPEG images for social media crawlers.
 * Twitter and some other platforms don't reliably support WebP in OG meta tags,
 * so this endpoint fetches the original image and converts it to JPEG on the fly.
 * 
 * Routes:
 *   GET /api/og-image/artist/:id
 *   GET /api/og-image/venue/:id
 *   GET /api/og-image/event/:id
 */

import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import * as db from '../db';

const router = Router();

// Cache converted images for 24 hours to avoid repeated conversions
const IMAGE_CACHE_SECONDS = 86400;

async function fetchAndConvertToJpeg(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`[OG Image Proxy] Failed to fetch image: ${response.status} ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to JPEG using sharp
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

    return jpegBuffer;
  } catch (error) {
    console.error(`[OG Image Proxy] Error converting image:`, error);
    return null;
  }
}

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
  // Limit cache to 100 entries to prevent memory issues
  if (imageCache.size >= 100) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(key, { buffer, timestamp: Date.now() });
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
    const artist = await db.getArtistProfileById(artistId);
    const profilePhotoUrl = (artist as any)?.profilePhotoUrl;

    if (!profilePhotoUrl) {
      return res.status(404).send('No profile photo');
    }

    const jpegBuffer = await fetchAndConvertToJpeg(profilePhotoUrl);
    if (!jpegBuffer) {
      return res.status(502).send('Failed to process image');
    }

    setCachedImage(cacheKey, jpegBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(jpegBuffer);

    console.log(`[OG Image Proxy] Served JPEG for artist ${artistId}`);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for artist ${artistId}:`, error);
    res.status(500).send('Internal error');
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
    const venue = await db.getVenueProfileById(venueId);
    const profilePhotoUrl = (venue as any)?.profilePhotoUrl;

    if (!profilePhotoUrl) {
      return res.status(404).send('No profile photo');
    }

    const jpegBuffer = await fetchAndConvertToJpeg(profilePhotoUrl);
    if (!jpegBuffer) {
      return res.status(502).send('Failed to process image');
    }

    setCachedImage(cacheKey, jpegBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    res.send(jpegBuffer);

    console.log(`[OG Image Proxy] Served JPEG for venue ${venueId}`);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for venue ${venueId}:`, error);
    res.status(500).send('Internal error');
  }
});

export default router;
