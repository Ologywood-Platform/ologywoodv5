export type ExternalStoreDestination = {
  url: string;
  hostname: string;
  displayDomain: string;
  storeName: string;
};

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
];

const UNSAFE_DESTINATION_PATH = /\/(admin|account|dashboard|editor|login|preview|signin)(\/|$)/i;

function storeNameForHostname(hostname: string): string {
  if (hostname === 'etsy.com' || hostname.endsWith('.etsy.com')) return 'Etsy';
  if (hostname === 'shopify.com' || hostname.endsWith('.shopify.com') || hostname.endsWith('.myshopify.com')) return 'Shopify';
  if (hostname === 'bigcartel.com' || hostname.endsWith('.bigcartel.com')) return 'Big Cartel';
  if (hostname === 'bandcamp.com' || hostname.endsWith('.bandcamp.com')) return 'Bandcamp';
  return 'the creator’s store';
}

export function normalizeExternalStoreUrl(value: string): string {
  const input = value.trim();
  if (!input) throw new Error('Enter a public product or store link.');

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Enter a complete public link beginning with https://.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('External store links must use http or https.');
  }
  if (url.username || url.password) {
    throw new Error('External store links cannot include login credentials.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    throw new Error('Use a public store link that fans can open from any device.');
  }
  if (UNSAFE_DESTINATION_PATH.test(url.pathname)) {
    throw new Error('Use the public product page, not an editor, preview, account, or login link.');
  }

  url.protocol = 'https:';
  url.username = '';
  url.password = '';
  url.hash = '';

  if (hostname === 'etsy.com' || hostname.endsWith('.etsy.com')) {
    const listingMatch = url.pathname.match(/^\/listing\/(\d+)(?:\/([^/]+))?\/?$/i);
    if (!listingMatch) {
      throw new Error('Use the public Etsy listing link, such as etsy.com/listing/123456/product-name.');
    }
    url.hostname = 'www.etsy.com';
    url.pathname = `/listing/${listingMatch[1]}${listingMatch[2] ? `/${listingMatch[2]}` : ''}`;
    url.search = '';
  } else {
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    }
  }

  return url.toString().replace(/\/$/, '');
}

export function getExternalStoreDestination(value: string): ExternalStoreDestination {
  const normalizedUrl = normalizeExternalStoreUrl(value);
  const url = new URL(normalizedUrl);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

  return {
    url: normalizedUrl,
    hostname,
    displayDomain: hostname,
    storeName: storeNameForHostname(hostname),
  };
}
