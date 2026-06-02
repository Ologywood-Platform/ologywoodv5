import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Determine if we're running in production (behind HTTPS)
  // On Cloud Run, x-forwarded-proto may not be detected if trust proxy isn't set,
  // so also check BASE_URL as a reliable indicator of production HTTPS.
  const baseUrl = process.env.BASE_URL || '';
  const isSecure = isSecureRequest(req) || baseUrl.startsWith('https://');

  // In production, set explicit cookie domain so the cookie works across
  // www/non-www and any subdomains. This prevents host-only cookie scoping
  // issues when OAuth callbacks arrive on a different hostname than the SPA.
  let domain: string | undefined;
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      const hostname = url.hostname;
      // Only set domain for real domains (not localhost/IP)
      if (!LOCAL_HOSTS.has(hostname) && !isIpAddress(hostname)) {
        // Use the full hostname (e.g., www.ologywood.com) to ensure
        // the cookie is scoped to exactly where the app runs
        domain = hostname;
      }
    } catch {
      // Ignore URL parse errors
    }
  }

  return {
    httpOnly: true,
    path: "/",
    // Use "lax" for first-party session cookies.
    // "lax" is correct for same-site navigation and top-level redirects (OAuth callbacks).
    sameSite: "lax",
    secure: isSecure,
    domain,
  };
}
