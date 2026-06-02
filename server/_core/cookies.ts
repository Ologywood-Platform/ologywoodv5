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

  // Do NOT set an explicit domain attribute.
  // Without a domain attribute, the browser creates a "host-only" cookie
  // scoped to the exact origin the browser sees (www.ologywood.com).
  // This is the most compatible approach and works for both XHR and navigation responses.

  return {
    httpOnly: true,
    path: "/",
    // Use "lax" for first-party session cookies.
    // "lax" is correct for same-site navigation and top-level redirects (OAuth callbacks).
    sameSite: "lax",
    secure: isSecure,
  };
}
