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

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const userAgent = req.headers["user-agent"] || "unknown";
    const isMobile = isMobileUserAgent(userAgent);

    console.log(`[OAuth] Callback received - mobile: ${isMobile}, UA: ${userAgent.substring(0, 80)}`);

    if (!code || !state) {
      console.error("[OAuth] Missing code or state params", { code: !!code, state: !!state, isMobile });
      // Redirect to home with error instead of showing JSON (better for mobile)
      return res.redirect(302, "/?oauth_error=INVALID_CODE");
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        console.error("[OAuth] Missing openId from user info", { isMobile });
        return res.redirect(302, "/?oauth_error=MISSING_EMAIL");
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

      console.log(`[OAuth] Login successful - user: ${userInfo.name || userInfo.openId}, mobile: ${isMobile}`);

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", { error, isMobile, userAgent: userAgent.substring(0, 80) });
      // Redirect to home with error instead of showing JSON error page (much better UX on mobile)
      return res.redirect(302, "/?oauth_error=UNKNOWN_ERROR");
    }
  });
}
