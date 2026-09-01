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
 *   GET /api/og-image/merch/:id
 *   GET /api/og-image/portfolio-video/:id
 *   GET /api/og-image/sandbox-post/:id
 */

import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import { getDb } from '../db';
import { artistProfiles, artistTeamMembers, merchItems, sandboxPosts, users, venueProfiles, videoPortfolio } from '../../drizzle/schema';
import { and, eq, ne, or } from 'drizzle-orm';
import { ensureSandboxPostSchema } from '../services/sandboxPostSchemaService';

const router = Router();

// Cache converted images for 1 hour to avoid repeated conversions
const IMAGE_CACHE_SECONDS = 3600;
const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

// Default fallback image URL
const DEFAULT_OG_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-social-preview-2026_af1c0d6d.png';

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
    const publicOrigin = (process.env.BASE_URL || 'https://www.ologywood.com').replace(/\/$/, '');
    const resolvedImageUrl = imageUrl.startsWith('/') ? `${publicOrigin}${imageUrl}` : imageUrl;
    console.log(`[OG Image Proxy] Fetching: ${resolvedImageUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(resolvedImageUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'OlogywoodOGProxy/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[OG Image Proxy] Failed to fetch image: HTTP ${response.status} from ${resolvedImageUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SOURCE_IMAGE_BYTES) {
      console.error(`[OG Image Proxy] Source image too large (${contentLength} bytes): ${resolvedImageUrl}`);
      return null;
    }

    const hasImageContentType = contentType.startsWith('image/');
    const hasSupportedImageExtension = /\.(?:jpe?g|png|webp|gif|avif)(?:[?#].*)?$/i.test(resolvedImageUrl);
    const isGenericBinaryImage = contentType.startsWith('application/octet-stream') && hasSupportedImageExtension;
    if (!hasImageContentType && !isGenericBinaryImage) {
      console.error(`[OG Image Proxy] Non-image content-type: ${contentType} from ${resolvedImageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      console.error(`[OG Image Proxy] Image too small (${buffer.length} bytes), likely invalid: ${resolvedImageUrl}`);
      return null;
    }
    if (buffer.length > MAX_SOURCE_IMAGE_BYTES) {
      console.error(`[OG Image Proxy] Source image exceeded limit after download (${buffer.length} bytes): ${resolvedImageUrl}`);
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

    console.log(`[OG Image Proxy] Converted to JPEG: ${jpegBuffer.length} bytes from ${resolvedImageUrl}`);
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

router.get('/merch/:id', async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId) || itemId <= 0) return res.status(404).send('Not found');

  const cacheKey = `merch-${itemId}`;
  const cached = getCachedImage(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(cached);
  }

  try {
    const database = await getDb();
    if (!database) return serveFallbackImage(res, cacheKey);
    const [item] = await database
      .select({ imageUrls: merchItems.imageUrls, isActive: merchItems.isActive })
      .from(merchItems)
      .where(eq(merchItems.id, itemId))
      .limit(1);
    const imageUrl = item?.isActive && Array.isArray(item.imageUrls) ? item.imageUrls[0] : null;
    if (!imageUrl) return serveFallbackImage(res, cacheKey);
    const jpegBuffer = await fetchAndConvertToJpeg(imageUrl);
    if (!jpegBuffer) return serveFallbackImage(res, cacheKey);
    setCachedImage(cacheKey, jpegBuffer);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(jpegBuffer);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for merch item ${itemId}:`, error);
    return serveFallbackImage(res, cacheKey);
  }
});

router.get('/portfolio-video/:id', async (req: Request, res: Response) => {
  const videoId = parseInt(req.params.id, 10);
  if (isNaN(videoId) || videoId <= 0) return res.status(404).send('Not found');

  try {
    const database = await getDb();
    const fallbackCacheKey = `portfolio-video-${videoId}-fallback`;
    if (!database) return serveFallbackImage(res, fallbackCacheKey);
    const [video] = await database
      .select({ thumbnailUrl: videoPortfolio.thumbnailUrl })
      .from(videoPortfolio)
      .where(and(eq(videoPortfolio.id, videoId), eq(videoPortfolio.status, 'active')))
      .limit(1);
    if (!video?.thumbnailUrl) return serveFallbackImage(res, fallbackCacheKey);
    const cacheKey = `portfolio-video-${videoId}-${video.thumbnailUrl}`;
    const cached = getCachedImage(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
      return res.send(cached);
    }
    const jpegBuffer = await fetchAndConvertToJpeg(video.thumbnailUrl);
    if (!jpegBuffer) return serveFallbackImage(res, cacheKey);
    setCachedImage(cacheKey, jpegBuffer);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(jpegBuffer);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for portfolio video ${videoId}:`, error);
    return serveFallbackImage(res, `portfolio-video-${videoId}-fallback`);
  }
});

router.get('/sandbox-post/:id', async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId) || postId <= 0) return res.status(404).send('Not found');
  const fallbackCacheKey = `sandbox-post-${postId}-fallback`;

  try {
    const database = await getDb();
    if (!database) return serveFallbackImage(res, fallbackCacheKey);
    await ensureSandboxPostSchema(database);
    const [post] = await database.select({
      artistUserId: sandboxPosts.artistUserId,
      mediaType: sandboxPosts.mediaType,
      mediaUrl: sandboxPosts.mediaUrl,
      mediaThumbnailUrl: sandboxPosts.mediaThumbnailUrl,
      profilePhotoUrl: artistProfiles.profilePhotoUrl,
      artistName: artistProfiles.artistName,
    }).from(sandboxPosts)
      .innerJoin(artistProfiles, eq(artistProfiles.id, sandboxPosts.artistProfileId))
      .innerJoin(users, eq(users.id, sandboxPosts.artistUserId))
      .where(and(
        eq(sandboxPosts.id, postId),
        eq(sandboxPosts.status, 'active'),
        or(eq(users.role, 'artist'), eq(users.role, 'admin')),
      ))
      .limit(1);
    if (!post || post.artistName.toLowerCase().includes('team member')) return serveFallbackImage(res, fallbackCacheKey);
    const [nonOwnerMembership] = await database.select({ id: artistTeamMembers.id }).from(artistTeamMembers)
      .where(and(eq(artistTeamMembers.userId, post.artistUserId), ne(artistTeamMembers.role, 'owner')))
      .limit(1);
    if (nonOwnerMembership) return serveFallbackImage(res, fallbackCacheKey);
    const imageUrl = post.mediaType === 'image'
      ? post.mediaUrl
      : post.mediaThumbnailUrl || post.profilePhotoUrl;
    if (!imageUrl) return serveFallbackImage(res, fallbackCacheKey);
    const cacheKey = `sandbox-post-${postId}-${imageUrl}`;
    const cached = getCachedImage(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
      return res.send(cached);
    }
    const jpegBuffer = await fetchAndConvertToJpeg(imageUrl);
    if (!jpegBuffer) return serveFallbackImage(res, cacheKey);
    setCachedImage(cacheKey, jpegBuffer);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', `public, max-age=${IMAGE_CACHE_SECONDS}`);
    return res.send(jpegBuffer);
  } catch (error) {
    console.error(`[OG Image Proxy] Error for Sandbox Post ${postId}:`, error);
    return serveFallbackImage(res, fallbackCacheKey);
  }
});

export default router;
