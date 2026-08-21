/**
 * Convert a name to a URL-friendly slug.
 * e.g., "Adonis" -> "adonis", "KemistInTheLab" -> "kemistinthelab"
 * e.g., "Joe Watts" -> "joe-watts"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

/**
 * Generate the OG share URL for social media sharing.
 * 
 * Generates clean, readable URLs like:
 *   https://www.ologywood.com/api/og-page/artist/adonis-11
 *   https://www.ologywood.com/api/og-page/venue/the-roxy-theatre-1
 * 
 * The /api/og-page/ endpoint serves proper OG meta tags for social
 * media crawlers and redirects regular users to the SPA page.
 */
export function toOgShareUrl(
  origin: string,
  entityType: 'artist' | 'venue' | 'event' | 'blog',
  name: string,
  id: number
): string {
  const slug = toSlug(name);
  if (entityType === 'event') {
    return `${origin}/api/og-page/event/${slug}-${id}`;
  }
  return `${origin}/api/og-page/${entityType}/${slug}-${id}`;
}
