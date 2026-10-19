import { MUSIC_RELEASE_PUBLIC_ORIGIN } from '../../shared/musicReleaseShare';

/** StorageGet output only: callers must never pass a creator-supplied URL. */
export function isTrustedMusicCoverSource(source: string, expectedKey?: string): boolean {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    const host = url.hostname.toLowerCase();
    const firstParty = url.origin === MUSIC_RELEASE_PUBLIC_ORIGIN;
    if (!firstParty && !host.endsWith('.cloudfront.net') && !host.endsWith('.manuscdn.com')) return false;
    const pathname = decodeURIComponent(url.pathname);
    if (!/\/releases\/covers\/[1-9]\d*\/[A-Za-z0-9][A-Za-z0-9._-]{0,240}\.(?:jpe?g|png|webp)$/i.test(pathname)) return false;
    if (firstParty && !pathname.startsWith('/manus-storage/')) return false;
    return !expectedKey || pathname.endsWith('/' + expectedKey);
  } catch { return false; }
}
