export const VIDEO_PORTFOLIO_CATEGORIES = [
  'highlights',
  'training',
  'game_day',
  'behind_the_scenes',
  'live_performance',
  'studio',
  'music_video',
  'other',
] as const;

export type VideoPortfolioCategory = (typeof VIDEO_PORTFOLIO_CATEGORIES)[number];
export type PortfolioVideoKind = 'direct' | 'youtube' | 'vimeo';

export type PortfolioVideoSource = {
  normalizedUrl: string;
  kind: PortfolioVideoKind;
  embedUrl: string | null;
  thumbnailUrl: string | null;
};

const DIRECT_VIDEO_EXTENSION = /\.(mp4|webm|mov|m4v)$/i;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

export function parsePortfolioVideoUrl(value: string): PortfolioVideoSource | null {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let youtubeId: string | null = null;
  if (hostname === 'youtu.be') {
    youtubeId = parsed.pathname.split('/').filter(Boolean)[0] || null;
  } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') youtubeId = parsed.searchParams.get('v');
    if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/')) {
      youtubeId = parsed.pathname.split('/').filter(Boolean)[1] || null;
    }
  }
  if (youtubeId && VIDEO_ID_PATTERN.test(youtubeId)) {
    return {
      normalizedUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      kind: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  if (hostname === 'vimeo.com' || hostname === 'player.vimeo.com') {
    const vimeoId = parsed.pathname.split('/').filter(Boolean).find((segment) => /^\d+$/.test(segment));
    if (vimeoId) {
      return {
        normalizedUrl: `https://vimeo.com/${vimeoId}`,
        kind: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        thumbnailUrl: null,
      };
    }
  }

  if (DIRECT_VIDEO_EXTENSION.test(parsed.pathname)) {
    return {
      normalizedUrl: parsed.toString(),
      kind: 'direct',
      embedUrl: null,
      thumbnailUrl: null,
    };
  }

  return null;
}

export const PORTFOLIO_VIDEO_URL_HELP = 'Use a YouTube, Vimeo, or direct MP4, MOV, or WebM link.';
