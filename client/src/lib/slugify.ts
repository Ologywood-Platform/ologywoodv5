/**
 * Generate the share URL for social media.
 * Uses canonical /artist/:id or /venue/:id URLs.
 * These are the URLs that previously showed previews on Facebook.
 */
export function toOgShareUrl(
  origin: string,
  entityType: 'artist' | 'venue' | 'event' | 'blog',
  name: string,
  id: number
): string {
  // Use simple canonical URLs - these work with Facebook's cache
  if (entityType === 'event') {
    return `${origin}/events/${id}`;
  }
  return `${origin}/${entityType}/${id}`;
}
