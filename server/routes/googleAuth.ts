import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sdk } from '../_core/sdk';
import { getSessionCookieOptions } from '../_core/cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { FreeTrialService } from '../services/freeTrialService';
import { getUserSubscription } from '../services/pricingTierService';
import crypto from 'crypto';

const router = Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

function getRedirectUri(req: Request): string {
  // Always use BASE_URL in production to avoid Cloud Run URL mismatches
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    return `${baseUrl}/api/auth/google/callback`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}/api/auth/google/callback`;
}

function getOrigin(req: Request): string {
  // Always use BASE_URL in production for consistent redirects
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    return baseUrl;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
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
  const returnPath = (req.query.returnPath as string) || '/';
  
  // Generate a state parameter for CSRF protection
  const state = JSON.stringify({
    csrf: crypto.randomBytes(16).toString('hex'),
    returnPath,
    origin: getOrigin(req),
  });
  const encodedState = Buffer.from(state).toString('base64url');

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
  const code = req.query.code as string;
  const stateParam = req.query.state as string;
  const error = req.query.error as string;

  // Parse state to get return path and origin
  let returnPath = '/';
  let origin = getOrigin(req);
  
  if (stateParam) {
    try {
      const decoded = Buffer.from(stateParam, 'base64url').toString('utf-8');
      const stateObj = JSON.parse(decoded);
      returnPath = stateObj.returnPath || '/';
      origin = stateObj.origin || origin;
    } catch {
      // Ignore state parse errors
    }
  }

  if (error) {
    console.error('[Google OAuth] Error from Google:', error);
    return res.redirect(302, `${origin}/get-started?oauth_error=${error}`);
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
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', errorData);
      return res.redirect(302, `${origin}/get-started?oauth_error=TOKEN_EXCHANGE_FAILED`);
    }

    const tokens = await tokenResponse.json() as { access_token: string; id_token?: string };

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
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

    console.log(`[Google OAuth] User info received: ${googleUser.email}, id: ${googleUser.id}`);

    const db = await getDb();
    if (!db) {
      return res.redirect(302, `${origin}/get-started?oauth_error=DB_ERROR`);
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
        avatarUrl: googleUser.picture || user.avatarUrl,
      }).where(eq(users.id, user.id));
      console.log(`[Google OAuth] Existing user login: ${user.email} (id: ${user.id})`);
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
          avatarUrl: googleUser.picture || user.avatarUrl,
          emailVerified: true, // Google verified the email
          lastSignedIn: new Date(),
        }).where(eq(users.id, user.id));
        console.log(`[Google OAuth] Linked Google to existing account: ${user.email} (id: ${user.id})`);
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
          avatarUrl: googleUser.picture || null,
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

        console.log(`[Google OAuth] New user created: ${user.email} (id: ${user.id})`);
      }
    }

    // Create session token
    const sessionToken = await sdk.createSessionToken(
      user.openId || `google_${googleUser.id}`,
      { name: user.name || googleUser.name, expiresInMs: ONE_YEAR_MS }
    );

    console.log(`[Google OAuth] Login successful, setting cookie and redirecting to: ${origin}${returnPath}`);

    // Instead of setting cookie on a 302 redirect (which some browsers/CDNs strip),
    // serve an HTML page that sets the cookie via the Set-Cookie header on a 200 response,
    // then redirects client-side via JavaScript.
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    
    const redirectUrl = `${origin}${returnPath}`;
    res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Signing in...</title></head>
<body>
<p>Signing you in...</p>
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</body></html>`);
  } catch (error) {
    console.error('[Google OAuth] Callback error:', error);
    return res.redirect(302, `${origin}/get-started?oauth_error=UNKNOWN_ERROR`);
  }
});

/**
 * GET /api/auth/google/debug-cookie
 * Diagnostic endpoint to test cookie behavior in production
 */
router.get('/google/debug-cookie', (req: Request, res: Response) => {
  const cookieOptions = getSessionCookieOptions(req);
  const cookies = req.headers.cookie || 'none';
  const hasSession = cookies.includes(COOKIE_NAME);
  
  res.json({
    cookieOptions,
    requestHeaders: {
      host: req.headers.host,
      xForwardedHost: req.headers['x-forwarded-host'],
      xForwardedProto: req.headers['x-forwarded-proto'],
      origin: req.headers.origin,
    },
    env: {
      BASE_URL: process.env.BASE_URL || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
    trustProxy: req.app.get('trust proxy'),
    protocol: req.protocol,
    secure: req.secure,
    hostname: req.hostname,
    hasSessionCookie: hasSession,
    cookieHeader: cookies.substring(0, 100) + (cookies.length > 100 ? '...' : ''),
  });
});

export default router;
