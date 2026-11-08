const DEFAULT_PUBLIC_ORIGIN = 'https://www.ologywood.com';

function parseOrigin(value: unknown): URL | null {
  if (typeof value !== 'string' || value.length > 300) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function trustedCheckoutOrigin(configuredBaseUrl: unknown, requestOrigin: unknown): string {
  const configured = parseOrigin(configuredBaseUrl);
  if (configured) return configured.origin;

  const requested = parseOrigin(requestOrigin);
  if (requested) {
    const hostname = requested.hostname.toLowerCase();
    const allowed = hostname === 'ologywood.com'
      || hostname === 'www.ologywood.com'
      || hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.endsWith('.manus.computer')
      || hostname.endsWith('.manus.space');
    if (allowed) return requested.origin;
  }

  return DEFAULT_PUBLIC_ORIGIN;
}
