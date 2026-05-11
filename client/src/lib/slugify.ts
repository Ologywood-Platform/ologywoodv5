/**
 * Convert a name to a URL-friendly slug with ID appended.
 * "Joe Watts" + 25 -> "joe-watts-25"
 * "LOOSE CHAIN" + 12 -> "loose-chain-12"
 * "Adrianne & Musicbox" + 24 -> "adrianne-musicbox-24"
 */
export function toOgShareUrl(
  origin: string,
  entityType: 'artist' | 'venue' | 'event' | 'blog',
  name: string,
  id: number
): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${origin}/api/og-page/${entityType}/${slug}-${id}`;
}
