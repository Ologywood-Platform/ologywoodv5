/**
 * SEO Meta Tags Utility
 * Generates consistent Open Graph and Twitter Card meta tags for all pages
 * to improve social media link previews and search engine visibility.
 */

const DEFAULT_OG_IMAGE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/ysxOwFpvMPLOUeDm.png';
const BASE_URL = 'https://www.ologywood.com';
const SITE_NAME = 'Ologywood';

export interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

/**
 * Normalize a URL: remove trailing slashes (except root), ensure www prefix.
 */
function normalizeUrl(url: string): string {
  // Remove trailing slash except for root
  let normalized = url.replace(/\/+$/, '') || '/';
  // If it's just the base domain, keep trailing slash
  if (normalized === BASE_URL) {
    normalized = BASE_URL + '/';
  }
  return normalized;
}

/**
 * Build the canonical URL for the current page.
 * Uses ogUrl if provided, otherwise derives from window.location.pathname.
 */
function buildCanonicalUrl(config: MetaTagsConfig): string {
  if (config.canonical) return normalizeUrl(config.canonical);
  if (config.ogUrl) return normalizeUrl(config.ogUrl);
  // Fallback: derive from current path
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const cleanPath = path.replace(/\/+$/, '') || '/';
  return cleanPath === '/' ? `${BASE_URL}/` : `${BASE_URL}${cleanPath}`;
}

/**
 * Set meta tags for a page. Updates existing tags or creates new ones.
 * ALWAYS sets a canonical URL to prevent duplicate content issues.
 */
export function setMetaTags(config: MetaTagsConfig) {
  // Title
  document.title = config.title;
  updateMetaTag('og:title', config.ogTitle || config.title);
  updateMetaTag('twitter:title', config.twitterTitle || config.title);

  // Description
  updateMetaTag('description', config.description);
  updateMetaTag('og:description', config.ogDescription || config.description);
  updateMetaTag('twitter:description', config.twitterDescription || config.description);

  // Keywords
  if (config.keywords) {
    updateMetaTag('keywords', config.keywords);
  }

  // Build canonical URL (always set, never skip)
  const canonicalUrl = buildCanonicalUrl(config);
  const ogUrl = normalizeUrl(config.ogUrl || canonicalUrl);

  // Open Graph
  updateMetaTag('og:type', config.ogType || 'website');
  updateMetaTag('og:site_name', SITE_NAME);
  updateMetaTag('og:url', ogUrl);
  updateMetaTag('og:image', config.ogImage || DEFAULT_OG_IMAGE);
  updateMetaTag('og:image:width', '1200');
  updateMetaTag('og:image:height', '630');

  // Twitter Card
  updateMetaTag('twitter:card', config.twitterCard || 'summary_large_image');
  updateMetaTag('twitter:image', config.twitterImage || config.ogImage || DEFAULT_OG_IMAGE);
  updateMetaTag('twitter:url', ogUrl);

  // Canonical URL - ALWAYS set to prevent duplicate content issues
  updateCanonicalTag(canonicalUrl);
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      tag.setAttribute('property', name);
    } else {
      tag.setAttribute('name', name);
    }
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

/**
 * Update or create canonical tag
 */
function updateCanonicalTag(url: string) {
  let link = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', url);
}

/**
 * Predefined meta tags for all public pages.
 * Each entry includes proper og:url, og:image, and page-specific copy.
 */
export const pageMetaTags = {
  home: {
    title: 'Ologywood - Book Talented Artists for Your Events',
    description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place. Find the perfect artist for your venue or event.',
    keywords: 'artist booking, event planning, performers, venues, entertainment booking',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: BASE_URL,
  },

  browse: {
    title: 'Browse Artists - Ologywood',
    description: 'Discover talented performing artists available for booking. Filter by genre, location, and availability to find the perfect act for your event.',
    keywords: 'browse artists, find performers, artist directory, event entertainment',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/browse`,
  },

  events: {
    title: 'Discover Events - Ologywood',
    description: 'Explore upcoming live events, concerts, and performances. Find events near you and buy tickets directly from the artists you love.',
    keywords: 'live events, concerts, performances, event discovery, tickets',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/events`,
  },

  pricing: {
    title: 'Pricing Plans - Ologywood',
    description: 'Choose the right plan for your music career. Free, Starter ($9/mo), and Professional ($29/mo) tiers with rider templates, e-signatures, fan updates, and more.',
    keywords: 'artist pricing, subscription plans, booking platform pricing, artist tools',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/pricing`,
  },

  howItWorks: {
    title: 'How It Works - Ologywood',
    description: 'Learn how Ologywood simplifies the artist booking process. Create your profile, set availability, manage riders and contracts, and grow your fan base.',
    keywords: 'how to book artists, booking process, artist management, venue booking',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/how-it-works`,
  },

  faq: {
    title: 'FAQ - Ologywood',
    description: 'Frequently asked questions about booking artists, payments, riders, contracts, e-signatures, events, and platform features on Ologywood.',
    keywords: 'artist booking FAQ, booking questions, payment questions, rider requirements',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/faq`,
  },

  help: {
    title: 'Help Center - Ologywood',
    description: 'Get help with your Ologywood account. Learn about bookings, riders, contracts, payments, events, and more.',
    keywords: 'help center, support, artist booking help, platform guide',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/help`,
  },

  contact: {
    title: 'Contact Us - Ologywood',
    description: 'Get in touch with the Ologywood team. We are here to help with questions about artist bookings, venue partnerships, and platform support.',
    keywords: 'contact ologywood, support, artist booking help, venue partnerships',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/contact`,
  },

  venues: {
    title: 'Browse Venues - Ologywood',
    description: 'Discover venues looking for talented performers. Browse venue profiles, upcoming events, and booking opportunities.',
    keywords: 'browse venues, find venues, venue directory, performance venues',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/venues`,
  },

  artistProfile: (artistName: string, artistId?: number, artistImage?: string) => ({
    title: `${artistName} - Book on Ologywood`,
    description: `Book ${artistName} for your next event on Ologywood. View performance details, availability, rider requirements, and upcoming events.`,
    keywords: `${artistName}, book artist, performer profile, event booking`,
    ogImage: artistImage || DEFAULT_OG_IMAGE,
    ogUrl: artistId ? `${BASE_URL}/artist/${artistId}` : BASE_URL,
    ogType: 'profile',
  }),

  venueProfile: (venueName: string, venueId?: number, venueImage?: string) => ({
    title: `${venueName} - Ologywood Venue`,
    description: `${venueName} on Ologywood. Browse upcoming events, available booking slots, and connect with talented artists.`,
    keywords: `${venueName}, venue profile, event venue, booking venue`,
    ogImage: venueImage || DEFAULT_OG_IMAGE,
    ogUrl: venueId ? `${BASE_URL}/venue/${venueId}` : BASE_URL,
  }),

  eventDetail: (eventTitle: string, eventId?: number, eventImage?: string, eventDescription?: string) => ({
    title: `${eventTitle} - Ologywood Event`,
    description: eventDescription || `${eventTitle} on Ologywood. View event details, lineup, tickets, and venue information.`,
    keywords: `${eventTitle}, live event, concert, performance, tickets`,
    ogImage: eventImage || DEFAULT_OG_IMAGE,
    ogUrl: eventId ? `${BASE_URL}/events/${eventId}` : `${BASE_URL}/events`,
    ogType: 'event',
  }),

  login: {
    title: 'Login - Ologywood',
    description: 'Sign in to your Ologywood account to manage bookings, profiles, and messages.',
    keywords: 'login, sign in, artist login, venue login',
    ogUrl: `${BASE_URL}/get-started`,
  },

  signup: {
    title: 'Sign Up - Ologywood',
    description: 'Create a free account on Ologywood. Join as an artist or venue to start booking today.',
    keywords: 'sign up, register, create account, artist registration, venue registration',
    ogUrl: `${BASE_URL}/get-started`,
  },

  blog: {
    title: 'Blog - Ologywood',
    description: 'Announcements, guides, and news from the Ologywood team. Stay up to date with platform features, artist tips, and industry insights.',
    keywords: 'ologywood blog, artist booking news, music industry, platform updates',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/blog`,
  },

  sellMusic: {
    title: 'Sell Your Music - Ologywood White Label Releases',
    description: 'Sell singles directly from your Ologywood artist profile. Keep 99% of every sale with just a 1% platform fee. Upload, price, and sell your music to fans worldwide.',
    keywords: 'sell music online, white label release, independent artist, music distribution, sell singles',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/sell-music`,
  },
  'api-docs': {
    title: 'API Documentation - Ologywood Developer Platform',
    description: 'Build integrations and AI agents with the Ologywood REST API. Authenticate with API keys, receive real-time webhooks, and access every platform feature programmatically.',
    keywords: 'ologywood api, developer documentation, rest api, ai agent integration, webhooks, api keys',
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: `${BASE_URL}/api-docs`,
  },
};

export { DEFAULT_OG_IMAGE, BASE_URL, SITE_NAME };
