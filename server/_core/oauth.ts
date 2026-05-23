import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isMobileUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
}

/**
 * Parse the OAuth state parameter.
 * 
 * The new format is a JSON string containing:
 *   { origin: string, returnPath: string, redirectUri: string }
 * 
 * For backward compatibility, if the state is a base64-encoded URL (old format),
 * we extract the origin from that URL.
 */
function parseState(state: string): { origin: string; returnPath: string; redirectUri: string } {
  try {
    const parsed = JSON.parse(state);
    if (parsed.origin && parsed.redirectUri) {
      return {
        origin: parsed.origin,
        returnPath: parsed.returnPath || "/",
        redirectUri: parsed.redirectUri,
      };
    }
  } catch {
    try {
      const decoded = Buffer.from(state, "base64").toString("utf-8");
      if (decoded.startsWith("http")) {
        const url = new URL(decoded);
        return {
          origin: url.origin,
          returnPath: "/",
          redirectUri: decoded,
        };
      }
    } catch {
      // Fall through
    }
  }
  return { origin: "", returnPath: "/", redirectUri: "" };
}

/**
 * Process the OAuth authorization code — shared by both /api/oauth/callback
 * and the root-level interceptor.
 */
async function processOAuthCode(req: Request, res: Response, code: string, state: string | undefined) {
  const userAgent = req.headers["user-agent"] || "unknown";
  const isMobile = isMobileUserAgent(userAgent);

  console.log(`[OAuth] Processing code - mobile: ${isMobile}, has state: ${!!state}`);

  // Parse state if available; otherwise use request origin
  let frontendOrigin = "";
  let returnPath = "/";

  if (state) {
    const parsedState = parseState(state);
    frontendOrigin = parsedState.origin;
    returnPath = parsedState.returnPath;
    console.log(`[OAuth] Parsed state - origin: ${frontendOrigin}, returnPath: ${returnPath}`);
  }

  // If no origin from state, try to determine from request headers
  if (!frontendOrigin) {
    const referer = req.headers.referer || req.headers.origin;
    if (referer) {
      try {
        const url = new URL(typeof referer === "string" ? referer : referer[0] || "");
        frontendOrigin = url.origin;
      } catch {
        // ignore
      }
    }
    // Last resort: use the request's own origin (protocol + host)
    if (!frontendOrigin) {
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "";
      if (host) {
        frontendOrigin = `${proto}://${host}`;
      }
    }
    console.log(`[OAuth] No state origin, derived from request: ${frontendOrigin}`);
  }

  try {
    // Build the redirectUri for the token exchange.
    // The Manus OAuth server needs to know the redirect_uri that was used when
    // initiating the login. Since the portal redirects to /?code=..., we need
    // to construct the redirectUri that matches what the frontend sent.
    const redirectUri = state
      ? (() => {
          try {
            const parsed = JSON.parse(state);
            return parsed.redirectUri || `${frontendOrigin}/api/oauth/callback`;
          } catch {
            try {
              const decoded = Buffer.from(state, "base64").toString("utf-8");
              if (decoded.startsWith("http")) return decoded;
            } catch { /* ignore */ }
            return `${frontendOrigin}/api/oauth/callback`;
          }
        })()
      : `${frontendOrigin}/api/oauth/callback`;

    console.log(`[OAuth] Exchanging code with redirectUri: ${redirectUri}`);

    const tokenResponse = await sdk.exchangeCodeForToken(code, state || "");
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      console.error("[OAuth] Missing openId from user info", { isMobile });
      return res.redirect(302, `${frontendOrigin}/?oauth_error=MISSING_OPENID`);
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    console.log(`[OAuth] Login successful - user: ${userInfo.name || userInfo.openId}, mobile: ${isMobile}, redirecting to: ${frontendOrigin}${returnPath}`);

    // Redirect to the frontend origin (per Manus support: use origin from state)
    const redirectUrl = frontendOrigin ? `${frontendOrigin}${returnPath}` : returnPath || "/";
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("[OAuth] Callback failed", { error, isMobile, userAgent: userAgent.substring(0, 80) });
    const errorUrl = frontendOrigin
      ? `${frontendOrigin}/?oauth_error=UNKNOWN_ERROR`
      : "/?oauth_error=UNKNOWN_ERROR";
    return res.redirect(302, errorUrl);
  }
}

export function registerOAuthRoutes(app: Express) {
  // Primary callback route at /api/oauth/callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      console.error("[OAuth] /api/oauth/callback - Missing code param");
      return res.redirect(302, "/?oauth_error=INVALID_CODE");
    }

    await processOAuthCode(req, res, code, state);
  });

  // Root-level interceptor: Manus OAuth portal may redirect to /?code=...
  // instead of /api/oauth/callback?code=...&state=...
  // This middleware catches that case and processes the OAuth code.
  app.get("/", (req: Request, res: Response, next) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    // Only intercept if there's an OAuth code parameter
    if (!code) {
      return next(); // Not an OAuth callback, pass to Vite/SPA
    }

    console.log(`[OAuth] Root-level interceptor caught /?code=... (state: ${state ? "present" : "missing"})`);
    processOAuthCode(req, res, code, state);
  });
}
