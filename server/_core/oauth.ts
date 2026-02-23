import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function parseState(state: string): string {
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    // State contains: origin + returnPath (e.g., "https://example.com/dashboard")
    return decoded;
  } catch (error) {
    console.error("[OAuth] Failed to parse state:", error);
    return "/";
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received with query:", req.query);
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    if (error) {
      console.error("[OAuth] OAuth server returned error:", error, errorDescription);
      return res.redirect(302, `/?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`);
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state", { code, state });
      return res.redirect(302, "/?error=missing_code_or_state");
    }

    try {
      console.log("[OAuth] Exchanging code for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange successful");
      
      console.log("[OAuth] Getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info received:", { openId: userInfo.openId, email: userInfo.email });

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        return res.redirect(302, "/?error=no_openid");
      }

      console.log("[OAuth] Upserting user...");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      console.log("[OAuth] User upserted successfully");

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[OAuth] Session token created");

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[OAuth] Cookie set");

      // Parse state to get the redirect URL (origin + path)
      const redirectUrl = parseState(state);
      console.log("[OAuth] Redirecting to:", redirectUrl);
      
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      if (error instanceof Error) {
        console.error("[OAuth] Error message:", error.message);
        console.error("[OAuth] Error stack:", error.stack);
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.redirect(302, `/?error=oauth_failed&details=${encodeURIComponent(errorMsg)}`);
    }
  });
}
