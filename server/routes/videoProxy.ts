import { Router } from 'express';

const router = Router();

/**
 * Video proxy endpoint that streams video files with correct content-type headers.
 * This fixes .mov files (served as video/quicktime by S3/CloudFront) not playing in Chrome.
 * Chrome can play H.264-encoded .mov files if served with video/mp4 content-type.
 */
router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Only allow proxying from our CloudFront domain
  const allowedDomains = ['d2xsxph8kpxj0f.cloudfront.net'];
  try {
    const parsedUrl = new URL(url);
    if (!allowedDomains.some(d => parsedUrl.hostname === d)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const fetchHeaders: Record<string, string> = {};
    if (req.headers.range) {
      fetchHeaders['Range'] = req.headers.range;
    }

    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).json({ error: 'Failed to fetch video' });
    }

    // Determine correct content type - serve .mov as video/mp4 for Chrome compatibility
    let contentType = response.headers.get('content-type') || 'video/mp4';
    if (contentType === 'video/quicktime') {
      contentType = 'video/mp4';
    }

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.status(206);
    }

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream the response body
    if (response.body) {
      const reader = (response.body as any).getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            break;
          }
          if (!res.write(Buffer.from(value))) {
            await new Promise<void>(resolve => res.once('drain', resolve));
          }
        }
      };
      pump().catch(() => res.end());
    } else {
      res.end();
    }
  } catch (error) {
    console.error('[VideoProxy] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Proxy error' });
    }
  }
});

export default router;
