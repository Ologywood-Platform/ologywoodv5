/**
 * Video Proxy Route
 * Proxies video files from CloudFront/S3 with corrected Content-Type headers.
 * This fixes the issue where .mov files served as "video/quicktime" are rejected by Chrome.
 * By proxying with "video/mp4" content-type, Chrome can play H.264-encoded .mov files.
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Allowed CloudFront domain for security
const ALLOWED_DOMAIN = 'd2xsxph8kpxj0f.cloudfront.net';

// GET /api/video/proxy?url=<encoded_url>
router.get('/proxy', async (req: Request, res: Response) => {
  try {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Security: only proxy from our CloudFront domain
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(videoUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    if (parsedUrl.hostname !== ALLOWED_DOMAIN) {
      return res.status(403).json({ error: 'URL not allowed' });
    }

    // Fetch the video from CloudFront with range support
    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(videoUrl, { headers });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).json({ error: 'Failed to fetch video' });
    }

    // Determine content type - force video/mp4 for .mov files
    const ext = parsedUrl.pathname.split('.').pop()?.toLowerCase();
    let contentType = 'video/mp4'; // Default to mp4 for best browser compatibility
    if (ext === 'webm') contentType = 'video/webm';
    else if (ext === 'ogg') contentType = 'video/ogg';

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h

    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length')!);
    }
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range')!);
    }

    // Set status code (200 or 206 for range requests)
    res.status(response.status);

    // Stream the response body
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      };
      pump().catch(() => res.end());
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('[Video Proxy Error]', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

export default router;
