import { useEffect } from 'react';

interface MetaTagsConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  locale?: string;
  imageWidth?: string;
  imageHeight?: string;
}

const DEFAULT_OG_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-social-preview-2026_af1c0d6d.png';
const DEFAULT_SITE_NAME = 'Ologywood';
const DEFAULT_DESCRIPTION = 'Creators own their audience. Creators choose where their content lives. OlogyWood powers everything that makes that content profitable — bookings, Sell Tickets, fan clubs, merch, and content releases.';
const BASE_URL = 'https://www.ologywood.com';

/**
 * Dynamically update Open Graph and Twitter Card meta tags for the current page.
 * Falls back to default values from index.html when not specified.
 * Restores original values on unmount.
 */
export function useMetaTags(config: MetaTagsConfig) {
  useEffect(() => {
    const previousValues: Record<string, string | null> = {};

    const setMeta = (selector: string, attribute: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (el) {
        previousValues[selector] = el.getAttribute(attribute);
        el.setAttribute(attribute, value);
      } else {
        // Create the meta tag if it doesn't exist
        el = document.createElement('meta');
        const selectorMatch = selector.match(/\[([a-z]+)="([^"]+)"\]/);
        if (selectorMatch) {
          el.setAttribute(selectorMatch[1], selectorMatch[2]);
        }
        el.setAttribute(attribute, value);
        document.head.appendChild(el);
        previousValues[selector] = null; // Mark as newly created
      }
    };

    const fullTitle = config.title
      ? `${config.title} | ${config.siteName || DEFAULT_SITE_NAME}`
      : 'Build Your Brand. Grow Your Fans. Create More Opportunities.';

    const description = config.description || DEFAULT_DESCRIPTION;
    const image = config.image || DEFAULT_OG_IMAGE;
    const url = config.url ? `${BASE_URL}${config.url}` : BASE_URL;
    const type = config.type || 'website';
    const twitterCard = config.twitterCard || 'summary_large_image';

    // Update document title
    const previousTitle = document.title;
    document.title = fullTitle;

    // Open Graph tags
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:site_name"]', 'content', config.siteName || DEFAULT_SITE_NAME);

    if (config.imageWidth) {
      setMeta('meta[property="og:image:width"]', 'content', config.imageWidth);
    }
    if (config.imageHeight) {
      setMeta('meta[property="og:image:height"]', 'content', config.imageHeight);
    }

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', 'content', twitterCard);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);
    setMeta('meta[name="twitter:url"]', 'content', url);

    // Standard meta description
    setMeta('meta[name="description"]', 'content', description);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const previousCanonical = canonical?.getAttribute('href') || null;
    if (canonical) {
      canonical.setAttribute('href', url);
    }

    // Cleanup: restore previous values on unmount
    return () => {
      document.title = previousTitle;
      Object.entries(previousValues).forEach(([selector, prevValue]) => {
        const el = document.querySelector(selector);
        if (el) {
          if (prevValue === null) {
            // Was newly created, remove it
            el.remove();
          } else {
            el.setAttribute('content', prevValue);
          }
        }
      });
      if (canonical && previousCanonical) {
        canonical.setAttribute('href', previousCanonical);
      }
    };
  }, [
    config.title,
    config.description,
    config.image,
    config.url,
    config.type,
    config.siteName,
    config.twitterCard,
    config.imageWidth,
    config.imageHeight,
  ]);
}

export { DEFAULT_OG_IMAGE, DEFAULT_SITE_NAME, DEFAULT_DESCRIPTION, BASE_URL };
