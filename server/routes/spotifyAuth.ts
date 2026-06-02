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

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_USERINFO_URL = 'https://api.spotify.com/v1/me';

function getSpotifyClientId(): string {
  return process.env.SPOTIFY_CLIENT_ID || '';
}

function getSpotifyClientSecret(): string {
  return process.env.SPOTIFY_CLIENT_SECRET || '';
}

function getRedirectUri(req: Request): string {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}/api/auth/spotify/callback`;
}

function getOrigin(req: Request): string {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}`;
}

/**
 * GET /api/auth/spotify
 * Redirects user to Spotify's OAuth consent screen
 */
router.get('/spotify', (req: Request, res: Response) => {
  const clientId = getSpotifyClientId();
  if (!clientId) {
    return res.status(500).json({ error: 'Spotify OAuth not configured' });
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

  const scopes = ['user-read-email', 'user-read-private'];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    show_dialog: 'true',
    state: encodedState,
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  res.redirect(302, authUrl);
});

/**
 * GET /api/auth/spotify/callback
 * Handles the OAuth callback from Spotify
 */
router.get('/spotify/callback', async (req: Request, res: Response) => {
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
    console.error('[Spotify OAuth] Error from Spotify:', error);
    return res.redirect(302, `${origin}/get-started?oauth_error=${error}`);
  }

  if (!code) {
    console.error('[Spotify OAuth] No code received');
    return res.redirect(302, `${origin}/get-started?oauth_error=NO_CODE`);
  }

  try {
    // Exchange code for tokens
    const redirectUri = getRedirectUri(req);
    const basicAuth = Buffer.from(`${getSpotifyClientId()}:${getSpotifyClientSecret()}`).toString('base64');

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Spotify OAuth] Token exchange failed:', errorData);
      return res.redirect(302, `${origin}/get-started?oauth_error=TOKEN_EXCHANGE_FAILED`);
    }

    const tokens = await tokenResponse.json() as { access_token: string; refresh_token?: string };

    // Get user info from Spotify
    const userInfoResponse = await fetch(SPOTIFY_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Spotify OAuth] Failed to get user info');
      return res.redirect(302, `${origin}/get-started?oauth_error=USERINFO_FAILED`);
    }

    const spotifyUser = await userInfoResponse.json() as {
      id: string;
      email: string;
      display_name: string;
      images?: Array<{ url: string; height: number; width: number }>;
    };

    console.log(`[Spotify OAuth] User info received: ${spotifyUser.email}, id: ${spotifyUser.id}`);

    const db = await getDb();
    if (!db) {
      return res.redirect(302, `${origin}/get-started?oauth_error=DB_ERROR`);
    }

    // Get the best profile image (largest available)
    const avatarUrl = spotifyUser.images && spotifyUser.images.length > 0
      ? spotifyUser.images[spotifyUser.images.length - 1].url
      : null;

    // Check if user already exists with this Spotify ID
    const existingSpotifyUser = await db.select().from(users)
      .where(eq(users.oauthProviderId, spotifyUser.id))
      .limit(1);

    let user;

    if (existingSpotifyUser.length > 0) {
      // Existing Spotify user — update last sign in
      user = existingSpotifyUser[0];
      await db.update(users).set({
        lastSignedIn: new Date(),
        avatarUrl: avatarUrl || user.avatarUrl,
      }).where(eq(users.id, user.id));
      console.log(`[Spotify OAuth] Existing user login: ${user.email} (id: ${user.id})`);
    } else {
      // Check if there's an existing account with the same email (account linking)
      const normalizedEmail = spotifyUser.email?.toLowerCase();
      if (normalizedEmail) {
        const existingEmailUser = await db.select().from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existingEmailUser.length > 0) {
          // Link Spotify to existing email account
          user = existingEmailUser[0];
          await db.update(users).set({
            oauthProvider: 'spotify',
            oauthProviderId: spotifyUser.id,
            avatarUrl: avatarUrl || user.avatarUrl,
            emailVerified: true,
            lastSignedIn: new Date(),
          }).where(eq(users.id, user.id));
          console.log(`[Spotify OAuth] Linked Spotify to existing account: ${user.email} (id: ${user.id})`);
        } else {
          // Create brand new user
          const openId = `spotify_${spotifyUser.id}`;
          const result = await db.insert(users).values({
            email: normalizedEmail,
            name: spotifyUser.display_name || 'Spotify User',
            role: 'user',
            loginMethod: 'spotify',
            openId,
            oauthProvider: 'spotify',
            oauthProviderId: spotifyUser.id,
            avatarUrl,
            emailVerified: true,
            lastSignedIn: new Date(),
          });

          const newUserId = (result as any)[0]?.insertId ?? (result as any).insertId;
          const newUserResult = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
          user = newUserResult[0];

          // Create default FREE subscription for new user
          await getUserSubscription(newUserId);

          // Check if user is eligible for free trial
          await FreeTrialService.assignFreeTrialIfEligible(newUserId);

          console.log(`[Spotify OAuth] New user created: ${user.email} (id: ${user.id})`);
        }
      } else {
        // No email from Spotify (rare) — create user without email
        const openId = `spotify_${spotifyUser.id}`;
        const result = await db.insert(users).values({
          name: spotifyUser.display_name || 'Spotify User',
          role: 'user',
          loginMethod: 'spotify',
          openId,
          oauthProvider: 'spotify',
          oauthProviderId: spotifyUser.id,
          avatarUrl,
          lastSignedIn: new Date(),
        });

        const newUserId = (result as any)[0]?.insertId ?? (result as any).insertId;
        const newUserResult = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);
        user = newUserResult[0];

        await getUserSubscription(newUserId);
        await FreeTrialService.assignFreeTrialIfEligible(newUserId);

        console.log(`[Spotify OAuth] New user created (no email): ${spotifyUser.display_name} (id: ${user.id})`);
      }
    }

    // Create session token
    const sessionToken = await sdk.createSessionToken(
      user.openId || `spotify_${spotifyUser.id}`,
      { name: user.name || spotifyUser.display_name, expiresInMs: ONE_YEAR_MS }
    );

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    console.log(`[Spotify OAuth] Login successful, redirecting to: ${origin}${returnPath}`);

    // Redirect to the app
    res.redirect(302, `${origin}${returnPath}`);
  } catch (error) {
    console.error('[Spotify OAuth] Callback error:', error);
    return res.redirect(302, `${origin}/get-started?oauth_error=UNKNOWN_ERROR`);
  }
});

export default router;
