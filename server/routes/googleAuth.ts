import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sdk } from '../_core/sdk';
import { getSessionCookieOptions } from '../_core/cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { FreeTrialService } from '../services/freeTrialService';
import { getUserSubscription } from '../services/pricingTierService';
import { persistAvatarToS3 } from '../utils/persistAvatar';
import { createOAuthState, safeOAuthReturnPath, verifyOAuthState } from '../services/oauthState';
import { singleQueryString } from './routeInput';

const router = Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_REQUEST_TIMEOUT_MS = 5_000;

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

function getRedirectUri(req: Request): string {
  // In production, always use BASE_URL to avoid Cloud Run internal hostname mismatch
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}/api/auth/google/callback`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}/api/auth/google/callback`;
}

function getOrigin(req: Request): string {
  // Production uses the configured public origin; local/dev callbacks use relative redirects.
  return process.env.BASE_URL || '';
}

/**
 * GET /api/auth/google
 * Redirects user to Google's OAuth consent screen
 */
router.get('/google', (req: Request, res: Response) => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const redirectUri = getRedirectUri(req);
  const returnPath = safeOAuthReturnPath(req.query.returnPath);
  const encodedState = createOAuthState({ returnPath });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state: encodedState,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  res.redirect(302, authUrl);
});

/**
 * GET /api/auth/google/callback
 * Handles the OAuth callback from Google
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = singleQueryString(req.query.code);
  const stateParam = singleQueryString(req.query.state);
  const error = singleQueryString(req.query.error, 256);

  const state = verifyOAuthState(stateParam);
  const origin = getOrigin(req);
  if (!state) return res.redirect(302, `${origin}/get-started?oauth_error=INVALID_STATE`);
  const returnPath = safeOAuthReturnPath(state.returnPath);

  if (error) {
    console.error('[Google OAuth] Provider denied authorization');
    return res.redirect(302, `${origin}/get-started?oauth_error=PROVIDER_DENIED`);
  }

  if (!code) {
    console.error('[Google OAuth] No code received');
    return res.redirect(302, `${origin}/get-started?oauth_error=NO_CODE`);
  }

  try {
    // Exchange code for tokens
    const redirectUri = getRedirectUri(req);
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
    });

    if (!tokenResponse.ok) {
      await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed');
      return res.redirect(302, `${origin}/get-started?oauth_error=TOKEN_EXCHANGE_FAILED`);
    }

    const tokens = await tokenResponse.json() as { access_token: string; id_token?: string };

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
    });

    if (!userInfoResponse.ok) {
      console.error('[Google OAuth] Failed to get user info');
      return res.redirect(302, `${origin}/get-started?oauth_error=USERINFO_FAILED`);
    }

    const googleUser = await userInfoResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
      verified_email?: boolean;
    };

    console.log('[Google OAuth] User info received');

    const db = await getDb();
    if (!db) {
      return res.redirect(302, `${origin}/get-started?oauth_error=DB_ERROR`);
    }

    // Persist Google avatar to S3 for a permanent URL
    let avatarUrl: string | null = null;
    if (googleUser.picture) {
      avatarUrl = await persistAvatarToS3(googleUser.picture, googleUser.id, 'google');
      if (!avatarUrl) avatarUrl = googleUser.picture; // fallback to original if S3 upload fails
    }

    // Check if user already exists with this Google ID
    const existingGoogleUser = await db.select().from(users)
      .where(eq(users.oauthProviderId, googleUser.id))
      .limit(1);

    let user;

    if (existingGoogleUser.length > 0) {
      // Existing Google user — update last sign in
      user = existingGoogleUser[0];
      await db.update(users).set({
        lastSignedIn: new Date(),
        avatarUrl: avatarUrl || user.avatarUrl,
      }).where(eq(users.id, user.id));
      console.log('[Google OAuth] Existing user login');
    } else {
      // Check if there's an existing account with the same email (account linking)
      const existingEmailUser = await db.select().from(users)
        .where(eq(users.email, googleUser.email.toLowerCase()))
        .limit(1);

      if (existingEmailUser.length > 0) {
        // Link Google to existing email account
        user = existingEmailUser[0];
        await db.update(users).set({
          oauthProvider: 'google',
          oauthProviderId: googleUser.id,
          avatarUrl: avatarUrl || user.avatarUrl,
          emailVerified: true, // Google verified the email
          lastSignedIn: new Date(),
        }).where(eq(users.id, user.id));
        console.log('[Google OAuth] Linked Google to existing account');
      } else {
        // Create brand new user
        const openId = `google_${googleUser.id}`;
        const result = await db.insert(users).values({
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          role: 'user',
          loginMethod: 'google',
          openId,
          oauthProvider: 'google',
          oauthProviderId: googleUser.id,
          avatarUrl: avatarUrl || null,
          emailVerified: true, // Google verified the email
          lastSignedIn: new Date(),
        });

        const newUserId = (result as any)[0]?.insertId ?? (result as any).insertId;
        const newUserResult = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
        user = newUserResult[0];

        // Create default FREE subscription for new user
        await getUserSubscription(newUserId);

        // Check if user is eligible for free trial
        await FreeTrialService.assignFreeTrialIfEligible(newUserId);

        console.log('[Google OAuth] New user created');
      }
    }

    // Create session token
    const sessionToken = await sdk.createSessionToken(
      user.openId || `google_${googleUser.id}`,
      { name: user.name || googleUser.name, expiresInMs: ONE_YEAR_MS }
    );

    // Set session cookie and redirect via HTML page.
    // We use a 200 HTML response instead of a 302 redirect because the CDN/proxy
    // between the browser and Cloud Run can strip Set-Cookie headers from redirect responses.
    // The HTML page receives the cookie on a normal 200 response, then redirects client-side.
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    console.log('[Google OAuth] Login successful; setting cookie and redirecting');

    // Include session token in URL hash as fallback for mobile browsers where
    // Set-Cookie may not persist across OAuth redirect chains (Android Spotify app, etc.)
    const redirectUrl = `${origin}${returnPath}#__session_token=${encodeURIComponent(sessionToken)}`;
    res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Signing in...</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151;}</style>
</head><body><p>Signing you in...</p>
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</body></html>`);
  } catch (error) {
    console.error('[Google OAuth] Callback error', { error: error instanceof Error ? error.name : 'UnknownError' });
    return res.redirect(302, `${origin}/get-started?oauth_error=UNKNOWN_ERROR`);
  }
});

export default router;
