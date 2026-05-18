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
    // Try parsing as JSON first (new format)
    const parsed = JSON.parse(state);
    if (parsed.origin && parsed.redirectUri) {
      return {
        origin: parsed.origin,
        returnPath: parsed.returnPath || "/",
        redirectUri: parsed.redirectUri,
      };
    }
  } catch {
    // Not JSON — try base64 decode (old format for backward compatibility)
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
      // Fall through to default
    }
  }

  // Fallback: cannot determine origin from state
  return {
    origin: "",
    returnPath: "/",
    redirectUri: "",
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const userAgent = req.headers["user-agent"] || "unknown";
    const isMobile = isMobileUserAgent(userAgent);

    console.log(`[OAuth] Callback received - mobile: ${isMobile}, UA: ${userAgent.substring(0, 80)}`);

    // Parse the state to extract the frontend origin
    const parsedState = state ? parseState(state) : { origin: "", returnPath: "/", redirectUri: "" };
    const frontendOrigin = parsedState.origin;

    console.log(`[OAuth] Parsed state - origin: ${frontendOrigin}, returnPath: ${parsedState.returnPath}`);

    if (!code || !state) {
      console.error("[OAuth] Missing code or state params", { code: !!code, state: !!state, isMobile });
      // Redirect using the origin from state, or fall back to relative redirect
      const errorUrl = frontendOrigin
        ? `${frontendOrigin}/?oauth_error=INVALID_CODE`
        : "/?oauth_error=INVALID_CODE";
      return res.redirect(302, errorUrl);
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        console.error("[OAuth] Missing openId from user info", { isMobile });
        const errorUrl = frontendOrigin
          ? `${frontendOrigin}/?oauth_error=MISSING_EMAIL`
          : "/?oauth_error=MISSING_EMAIL";
        return res.redirect(302, errorUrl);
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

      console.log(`[OAuth] Login successful - user: ${userInfo.name || userInfo.openId}, mobile: ${isMobile}, redirecting to: ${frontendOrigin}${parsedState.returnPath}`);

      // Redirect using the origin from state (per Manus support instructions)
      // This ensures the user is redirected back to the correct domain they came from
      const redirectUrl = frontendOrigin
        ? `${frontendOrigin}${parsedState.returnPath}`
        : parsedState.returnPath || "/";
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", { error, isMobile, userAgent: userAgent.substring(0, 80) });
      const errorUrl = frontendOrigin
        ? `${frontendOrigin}/?oauth_error=UNKNOWN_ERROR`
        : "/?oauth_error=UNKNOWN_ERROR";
      return res.redirect(302, errorUrl);
    }
  });
}
