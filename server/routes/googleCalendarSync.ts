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
import crypto from 'crypto';
import { sdk } from '../_core/sdk';

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
  if (process.env.BASE_URL) {
    return `${process.env.BASE_URL}/api/calendar-sync/google/callback`;
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return `${proto}://${host}/api/calendar-sync/google/callback`;
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

  // Store userId in state for the callback
  const state = JSON.stringify({
    csrf: crypto.randomBytes(16).toString('hex'),
    userId,
  });
  const encodedState = Buffer.from(state).toString('base64url');

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
  const code = req.query.code as string;
  const stateParam = req.query.state as string;
  const error = req.query.error as string;

  const origin = process.env.BASE_URL || `${req.protocol}://${req.headers.host}`;

  if (error) {
    console.error('[Google Calendar Sync] OAuth error:', error);
    return res.redirect(`${origin}/dashboard?gcal=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !stateParam) {
    return res.redirect(`${origin}/dashboard?gcal=error&reason=missing_code`);
  }

  // Parse state to get userId
  let userId: number;
  try {
    const decoded = Buffer.from(stateParam, 'base64url').toString('utf-8');
    const stateObj = JSON.parse(decoded);
    userId = stateObj.userId;
  } catch {
    return res.redirect(`${origin}/dashboard?gcal=error&reason=invalid_state`);
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
      const errBody = await tokenResponse.text();
      console.error('[Google Calendar Sync] Token exchange failed:', errBody);
      return res.redirect(`${origin}/dashboard?gcal=error&reason=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };

    if (!tokens.access_token) {
      return res.redirect(`${origin}/dashboard?gcal=error&reason=no_access_token`);
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
      return res.redirect(`${origin}/dashboard?gcal=error&reason=db_unavailable`);
    }

    // Get artist profile ID from userId
    const { artistProfiles } = await import('../../drizzle/schema');
    const [artistProfile] = await database
      .select({ id: artistProfiles.id })
      .from(artistProfiles)
      .where(eq(artistProfiles.userId, userId))
      .limit(1);

    if (!artistProfile) {
      return res.redirect(`${origin}/dashboard?gcal=error&reason=not_an_artist`);
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
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existing.refreshToken,
          tokenExpiresAt,
          googleEmail,
          syncEnabled: true,
        })
        .where(eq(googleCalendarIntegrations.id, existing.id));
    } else {
      await database.insert(googleCalendarIntegrations).values({
        artistId: artistProfile.id,
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiresAt,
        calendarId: 'primary',
        syncEnabled: true,
      });
    }

    console.log(`[Google Calendar Sync] Connected for artist ${artistProfile.id} (${googleEmail})`);

    // Trigger initial sync
    await syncGoogleCalendarForArtist(artistProfile.id);

    return res.redirect(`${origin}/dashboard?gcal=connected`);
  } catch (err: any) {
    console.error('[Google Calendar Sync] Callback error:', err);
    return res.redirect(`${origin}/dashboard?gcal=error&reason=unknown`);
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
        refresh_token: integration.refreshToken,
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
        .set({ accessToken: tokens.access_token, tokenExpiresAt })
        .where(eq(googleCalendarIntegrations.id, integration.id));
    }

    return tokens.access_token;
  } catch (err) {
    console.error('[Google Calendar Sync] Token refresh error:', err);
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
  let accessToken = integration.accessToken;
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
      const errText = await eventsRes.text();
      console.error('[Google Calendar Sync] Events fetch failed:', errText);
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

    // Insert/update availability records for busy dates
    let synced = 0;
    for (const dateStr of busyDates) {
      // Check if there's already an availability record for this date
      const [existing] = await database
        .select()
        .from(availability)
        .where(and(
          eq(availability.artistId, artistId),
          eq(availability.date, dateStr),
        ))
        .limit(1);

      if (!existing) {
        // Only add unavailable if no record exists (don't override manual settings)
        await database.insert(availability).values({
          artistId,
          date: dateStr,
          status: 'unavailable',
        });
        synced++;
      } else if (existing.status === 'available') {
        // If currently marked as available, update to unavailable from Google
        await database
          .update(availability)
          .set({ status: 'unavailable' })
          .where(eq(availability.id, existing.id));
        synced++;
      }
      // If already booked or unavailable, leave it alone
    }

    // Update last synced timestamp
    await database
      .update(googleCalendarIntegrations)
      .set({ lastSyncedAt: new Date() })
      .where(eq(googleCalendarIntegrations.id, integration.id));

    console.log(`[Google Calendar Sync] Synced ${synced} busy dates for artist ${artistId}`);
    return { synced };
  } catch (err: any) {
    console.error('[Google Calendar Sync] Sync error:', err);
    return { synced: 0, error: err.message };
  }
}

export default router;
