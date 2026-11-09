/**
 * Google Calendar Sync for Artists
 * 
 * Allows artists to connect their Google Calendar and import busy times
 * as "unavailable" blocks in their Ologywood availability.
 * 
 * Flow:
 * 1. Artist clicks "Connect Google Calendar" → redirected to Google OAuth with calendar scope
 * 2. Google callback stores access/refresh tokens in google_calendar_integrations table
 * 3. Sync endpoint fetches busy times from Google Calendar and marks those dates as unavailable
 */

import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { googleCalendarIntegrations, availability } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { sdk } from '../_core/sdk';
import { setScheduledAvailability } from '../services/bookingScheduleService';
import { decryptOAuthToken, encryptOAuthToken } from '../services/oauthTokenEncryption';
import { createOAuthState, verifyOAuthState } from '../services/oauthState';
import { trustedCheckoutOrigin } from '../services/trustedOrigin';
import { artistProfiles } from '../../drizzle/schema';
import { TRPCError } from '@trpc/server';
import { singleQueryString } from './routeInput';

const router = Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

function getRedirectUri(req: Request): string {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const requestOrigin = host ? `${proto}://${host}` : undefined;
  return `${trustedCheckoutOrigin(process.env.BASE_URL, requestOrigin)}/api/calendar-sync/google/callback`;
}

/**
 * GET /api/calendar-sync/google/connect
 * Initiates Google OAuth flow with calendar read scope.
 * Requires user to be logged in (session cookie).
 */
router.get('/google/connect', async (req: Request, res: Response) => {
  let userId: number;
  try {
    const user = await sdk.authenticateRequest(req);
    userId = user.id;
  } catch {
    return res.status(401).json({ error: 'Must be logged in' });
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const redirectUri = getRedirectUri(req);

  const encodedState = createOAuthState({ userId });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: encodedState,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  res.redirect(302, authUrl);
});

/**
 * GET /api/calendar-sync/google/callback
 * Handles the OAuth callback from Google, stores tokens.
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = singleQueryString(req.query.code);
  const stateParam = singleQueryString(req.query.state);
  const error = singleQueryString(req.query.error, 256);

  const state = verifyOAuthState(stateParam);
  const userId = state?.userId;
  if (!Number.isSafeInteger(userId) || (userId as number) <= 0) {
    return res.redirect('/dashboard?gcal=error&reason=invalid_state');
  }

  if (error) {
    console.error('[Google Calendar Sync] OAuth provider error');
    return res.redirect('/dashboard?gcal=error&reason=provider_denied');
  }

  if (!code) {
    return res.redirect('/dashboard?gcal=error&reason=missing_code');
  }

  try {
    const callbackUser = await sdk.authenticateRequest(req);
    if (callbackUser.id !== userId) {
      return res.redirect('/dashboard?gcal=error&reason=invalid_state');
    }
  } catch {
    return res.redirect('/dashboard?gcal=error&reason=authentication_required');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        redirect_uri: getRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      await tokenResponse.text();
      console.error('[Google Calendar Sync] Token exchange failed');
      return res.redirect('/dashboard?gcal=error&reason=token_exchange_failed');
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };

    if (!tokens.access_token) {
      return res.redirect('/dashboard?gcal=error&reason=no_access_token');
    }

    // Get the user's Google email from the calendar API
    let googleEmail = '';
    try {
      const calListRes = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList/primary`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (calListRes.ok) {
        const calData = await calListRes.json() as any;
        googleEmail = calData.id || '';
      }
    } catch { /* ignore */ }

    const database = await getDb();
    if (!database) {
      return res.redirect('/dashboard?gcal=error&reason=db_unavailable');
    }

    // Get artist profile ID from userId
    const { artistProfiles } = await import('../../drizzle/schema');
    const [artistProfile] = await database
      .select({ id: artistProfiles.id })
      .from(artistProfiles)
      .where(eq(artistProfiles.userId, userId))
      .limit(1);

    if (!artistProfile) {
      return res.redirect('/dashboard?gcal=error&reason=not_an_artist');
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert: check if integration already exists
    const [existing] = await database
      .select()
      .from(googleCalendarIntegrations)
      .where(eq(googleCalendarIntegrations.artistId, artistProfile.id))
      .limit(1);

    if (existing) {
      await database
        .update(googleCalendarIntegrations)
        .set({
          accessToken: encryptOAuthToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? encryptOAuthToken(tokens.refresh_token) : encryptOAuthToken(existing.refreshToken),
          tokenExpiresAt,
          googleEmail,
          syncEnabled: true,
        })
        .where(eq(googleCalendarIntegrations.id, existing.id));
    } else {
      await database.insert(googleCalendarIntegrations).values({
        artistId: artistProfile.id,
        googleEmail,
        accessToken: encryptOAuthToken(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptOAuthToken(tokens.refresh_token) : '',
        tokenExpiresAt,
        calendarId: 'primary',
        syncEnabled: true,
      });
    }

    console.log('[Google Calendar Sync] Calendar connected');

    // Trigger initial sync
    await syncGoogleCalendarForArtist(artistProfile.id);

    return res.redirect('/dashboard?gcal=connected');
  } catch (err: any) {
    console.error('[Google Calendar Sync] Callback error', { kind: err instanceof Error ? err.name : 'UnknownError' });
    return res.redirect('/dashboard?gcal=error&reason=unknown');
  }
});

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(integration: any): Promise<string | null> {
  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        refresh_token: decryptOAuthToken(String(integration.refreshToken || '')),
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('[Google Calendar Sync] Token refresh failed');
      return null;
    }

    const tokens = await tokenResponse.json() as { access_token: string; expires_in: number };
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const database = await getDb();
    if (database) {
      await database
        .update(googleCalendarIntegrations)
        .set({ accessToken: encryptOAuthToken(tokens.access_token), tokenExpiresAt })
        .where(eq(googleCalendarIntegrations.id, integration.id));
    }

    return tokens.access_token;
  } catch (err) {
    console.error('[Google Calendar Sync] Token refresh error', { kind: err instanceof Error ? err.name : 'UnknownError' });
    return null;
  }
}

/**
 * Sync Google Calendar busy times for a specific artist.
 * Fetches the next 90 days of events and marks those dates as "unavailable" in the availability table.
 */
export async function syncGoogleCalendarForArtist(artistId: number): Promise<{ synced: number; error?: string }> {
  const database = await getDb();
  if (!database) return { synced: 0, error: 'Database not available' };

  const [integration] = await database
    .select()
    .from(googleCalendarIntegrations)
    .where(and(
      eq(googleCalendarIntegrations.artistId, artistId),
      eq(googleCalendarIntegrations.syncEnabled, true),
    ))
    .limit(1);

  if (!integration) {
    return { synced: 0, error: 'No Google Calendar integration found' };
  }

  // Check if token needs refresh
  let accessToken = decryptOAuthToken(String(integration.accessToken || ''));
  if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < new Date()) {
    const refreshed = await refreshAccessToken(integration);
    if (!refreshed) {
      return { synced: 0, error: 'Failed to refresh token' };
    }
    accessToken = refreshed;
  }

  // Fetch events for the next 90 days
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 90);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  try {
    const calendarId = integration.calendarId || 'primary';
    const eventsRes = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!eventsRes.ok) {
      await eventsRes.text();
      console.error('[Google Calendar Sync] Events fetch failed');
      return { synced: 0, error: 'Failed to fetch calendar events' };
    }

    const eventsData = await eventsRes.json() as { items?: any[] };
    const events = eventsData.items || [];

    // Extract unique dates that have events (busy times)
    const busyDates = new Set<string>();
    for (const event of events) {
      // Skip cancelled events
      if (event.status === 'cancelled') continue;
      // Skip transparent (free) events
      if (event.transparency === 'transparent') continue;

      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;

      if (start) {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : startDate;

        // Add all dates in the range
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const endDay = new Date(endDate);
        endDay.setHours(0, 0, 0, 0);

        while (current <= endDay) {
          const dateStr = current.toISOString().split('T')[0];
          busyDates.add(dateStr);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    // Imported busy days remain whole-day blocks, but cannot overwrite a booking or timed appointment.
    const [profile] = await database.select({ userId: artistProfiles.userId }).from(artistProfiles).where(eq(artistProfiles.id,artistId)).limit(1);
    if(!profile) return {synced:0,error:'Artist profile not found'};
    let synced = 0;
    for(const dateStr of busyDates){
      try { await setScheduledAvailability(profile.userId,artistId,[dateStr],'unavailable'); synced++; }
      catch(error){ if(!(error instanceof TRPCError) || error.code!=='CONFLICT')throw error; }
    }

    // Update last synced timestamp
    await database
      .update(googleCalendarIntegrations)
      .set({ lastSyncedAt: new Date() })
      .where(eq(googleCalendarIntegrations.id, integration.id));

    console.log(`[Google Calendar Sync] Synced ${synced} busy dates`);
    return { synced };
  } catch (err: any) {
    console.error('[Google Calendar Sync] Sync error', { kind: err instanceof Error ? err.name : 'UnknownError' });
    return { synced: 0, error: 'Unable to sync Google Calendar availability' };
  }
}

export default router;
