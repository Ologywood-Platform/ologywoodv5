import { useEffect } from 'react';
import { useLocation } from 'wouter';

const BASE_URL = 'https://www.ologywood.com';

/**
 * CanonicalUpdater: Updates the canonical link tag on every route change.
 * 
 * This ensures that even pages that don't call setMetaTags() explicitly
 * still get a correct canonical URL, preventing Google from flagging
 * "Duplicate without user-selected canonical" issues.
 * 
 * Pages that DO call setMetaTags() will override this with their specific canonical.
 * This component runs first (on route change), then the page's useEffect runs after
 * and sets the more specific canonical if available.
 */
export function CanonicalUpdater() {
  const [location] = useLocation();

  useEffect(() => {
    // Normalize path: remove trailing slashes (except root)
    const cleanPath = location === '/' ? '/' : location.replace(/\/+$/, '');
    const canonicalUrl = cleanPath === '/' ? `${BASE_URL}/` : `${BASE_URL}${cleanPath}`;

    // Update or create canonical link tag
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);

    // Also update og:url to match canonical for consistency
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
  }, [location]);

  return null;
}
