/**
 * Convert a name to a URL-friendly slug.
 * e.g., "Adonis" -> "adonis", "KemistInTheLab" -> "kemistinthelab"
 * e.g., "Joe Watts" -> "joe-watts"
 */
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
 *   https://www.ologywood.com/artist/adonis
 *   https://www.ologywood.com/venue/the-roxy-theatre
 * 
 * Social media bots get proper OG tags via the ogTags middleware.
 * Regular users see the normal SPA profile page.
 */
export function toOgShareUrl(
  origin: string,
  entityType: 'artist' | 'venue' | 'event' | 'blog',
  name: string,
  id: number
): string {
  const slug = toSlug(name);
  if (entityType === 'event') {
    return `${origin}/events/${id}`;
  }
  return `${origin}/${entityType}/${slug}`;
}
