import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * RobotsMetaTag: Dynamically sets <meta name="robots"> based on the current route.
 * 
 * Private/protected pages get "noindex, nofollow" to prevent Google from indexing them.
 * Public pages get "index, follow" to ensure they are crawlable.
 * 
 * This is critical because the hosting platform auto-generates a sitemap that includes
 * ALL client-side routes (including private ones). When Googlebot visits private pages,
 * the SPA redirects to login via JavaScript, causing "Page with redirect" errors in
 * Google Search Console. The noindex directive tells Google to ignore these pages.
 */

// Pages that should NOT be indexed by search engines
const NOINDEX_PATHS = new Set([
  '/get-started',
  '/onboarding/artist',
  '/onboarding/venue',
  '/profile/edit',
  '/dashboard',
  '/venue-dashboard',
  '/verify-email',
  '/revert-email',
  '/reset-password',
  '/earnings',
  '/earnings-dashboard',
  '/venue-invoices',
  '/admin',
  '/admin/payouts',
  '/artist-tax-reporting',
  '/booking/create',
  '/bookings',
  '/contracts',
  '/events/create',
  '/releases',
  '/rider-builder',
  '/rider-templates',
  '/saved-riders',
  '/favorites',
  '/riders',
  '/messages',
  '/following',
  '/availability',
  '/unsubscribe',
]);

// Paths that start with these prefixes should also be noindex
const NOINDEX_PREFIXES = [
  '/booking/',
  '/booking-confirmation/',
  '/messages/',
  '/artists/',  // /artists/:id/history (private history pages)
];

// Duplicate paths that should point to their canonical version
const CANONICAL_REDIRECTS: Record<string, string> = {
  '/home': '/',
  '/privacy': '/privacy-policy',
  '/terms': '/terms-of-service',
};

function shouldNoIndex(path: string): boolean {
  // Exact match
  if (NOINDEX_PATHS.has(path)) return true;
  
  // Prefix match
  for (const prefix of NOINDEX_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  
  return false;
}

export function RobotsMetaTag() {
  const [location] = useLocation();

  useEffect(() => {
    const cleanPath = location === '/' ? '/' : location.replace(/\/+$/, '');
    
    // Set robots meta tag
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    const noIndex = shouldNoIndex(cleanPath);
    robotsMeta.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Handle canonical for duplicate pages
    const canonicalTarget = CANONICAL_REDIRECTS[cleanPath];
    if (canonicalTarget) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `https://www.ologywood.com${canonicalTarget}`);
    }
  }, [location]);

  return null;
}
