import { Router } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

/**
 * Video proxy endpoint - re-serves .mov files with video/mp4 content-type
 * so Chrome can play them. Chrome rejects video/quicktime but can play
 * the same H.264-encoded content when served as video/mp4.
 * 
 * GET /api/video/proxy?url=<encoded_video_url>
 */
router.get('/proxy', (req, res) => {
  const videoUrl = req.query.url as string;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Only allow proxying from our CloudFront domain
  try {
    const parsed = new URL(videoUrl);
    if (!parsed.hostname.endsWith('.cloudfront.net')) {
      return res.status(403).json({ error: 'Only CloudFront URLs are allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const client = videoUrl.startsWith('https') ? https : http;

  // Support range requests for seeking
  const headers: Record<string, string> = {};
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }

  const proxyReq = client.get(videoUrl, { headers }, (proxyRes) => {
    // Set content type to video/mp4 so Chrome plays it
    res.setHeader('Content-Type', 'video/mp4');
    
    // Pass through relevant headers
    if (proxyRes.headers['content-length']) {
      res.setHeader('Content-Length', proxyRes.headers['content-length']);
    }
    if (proxyRes.headers['content-range']) {
      res.setHeader('Content-Range', proxyRes.headers['content-range']);
    }
    if (proxyRes.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Use the same status code (important for 206 Partial Content)
    res.status(proxyRes.statusCode || 200);

    // Stream the video data
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[VideoProxy] Error fetching video:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch video' });
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    proxyReq.destroy();
  });
});

export default router;
