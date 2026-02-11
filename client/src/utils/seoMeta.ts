/**
 * SEO Meta Tags Utility
 * Generates consistent meta tags for all pages to improve search engine visibility
 */

export interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

/**
 * Set meta tags for a page
 */
export function setMetaTags(config: MetaTagsConfig) {
  const baseUrl = process.env.VITE_APP_URL || 'https://ologywood.com';

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

  // Open Graph
  updateMetaTag('og:type', 'website');
  updateMetaTag('og:url', config.ogUrl || baseUrl);
  if (config.ogImage) {
    updateMetaTag('og:image', config.ogImage);
  }

  // Twitter Card
  updateMetaTag('twitter:card', config.twitterCard || 'summary_large_image');
  if (config.twitterImage) {
    updateMetaTag('twitter:image', config.twitterImage);
  }

  // Canonical URL
  if (config.canonical) {
    updateCanonicalTag(config.canonical);
  }
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    if (name.startsWith('og:')) {
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
 * Predefined meta tags for common pages
 */
export const pageMetaTags = {
  home: {
    title: 'Ologywood - Book Talented Artists for Your Events',
    description: 'Connect with performing artists, manage bookings, and streamline your event planning all in one place. Find the perfect artist for your venue or event.',
    keywords: 'artist booking, event planning, performers, venues, entertainment booking',
    ogImage: 'https://ologywood.com/og-home.jpg',
  },

  browse: {
    title: 'Browse Artists - Ologywood',
    description: 'Discover talented performing artists available for booking. Filter by genre, location, and availability.',
    keywords: 'browse artists, find performers, artist directory, event entertainment',
    ogImage: 'https://ologywood.com/og-browse.jpg',
  },

  howItWorks: {
    title: 'How It Works - Ologywood',
    description: 'Learn how Ologywood simplifies the artist booking process for venues and performers. Step-by-step guide for both artists and venues.',
    keywords: 'how to book artists, booking process, artist management, venue booking',
  },

  faq: {
    title: 'FAQ - Ologywood',
    description: 'Frequently asked questions about booking artists, payments, riders, and platform features.',
    keywords: 'artist booking FAQ, booking questions, payment questions, rider requirements',
  },

  artistProfile: (artistName: string) => ({
    title: `${artistName} - Ologywood Artist Profile`,
    description: `Book ${artistName} for your next event. View performance details, availability, and rider requirements.`,
    keywords: `${artistName}, book artist, performer profile, event booking`,
  }),

  venueProfile: (venueName: string) => ({
    title: `${venueName} - Ologywood Venue Profile`,
    description: `${venueName} on Ologywood. Browse upcoming events and available artists.`,
    keywords: `${venueName}, venue profile, event venue, booking venue`,
  }),

  login: {
    title: 'Login - Ologywood',
    description: 'Sign in to your Ologywood account to manage bookings, profiles, and messages.',
    keywords: 'login, sign in, artist login, venue login',
  },

  signup: {
    title: 'Sign Up - Ologywood',
    description: 'Create a free account on Ologywood. Join as an artist or venue to start booking today.',
    keywords: 'sign up, register, create account, artist registration, venue registration',
  },
};
