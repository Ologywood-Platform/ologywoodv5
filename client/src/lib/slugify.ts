/**
 * Generate the OG share URL for social media sharing.
 * 
 * Uses /api/og-page/ endpoint which:
 * 1. Returns artist-specific OG meta tags (title, image, description)
 * 2. Redirects regular users to the SPA page via JavaScript
 * 
 * This is required because the Manus CDN serves static HTML with generic
 * OG tags for /artist/:id routes. Only /api/* routes reach Node.js.
 */
export function toOgShareUrl(
  origin: string,
  entityType: 'artist' | 'venue' | 'event' | 'blog',
  name: string,
  id: number
): string {
  // Use numeric ID only - no slug to avoid 301 redirects that confuse social crawlers
  if (entityType === 'event') {
    return `${origin}/api/og-page/event/${id}`;
  }
  return `${origin}/api/og-page/${entityType}/${id}`;
}
