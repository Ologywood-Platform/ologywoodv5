/**
 * iCal Calendar Feed
 * 
 * Provides a subscribable .ics calendar feed for artists.
 * Artists can subscribe to this URL in Google Calendar, Apple Calendar, or Outlook
 * to see their confirmed bookings automatically.
 * 
 * URL format: /api/calendar/:artistId/bookings.ics?token=<calendarToken>
 * 
 * The token is a simple hash of the artist's ID + a secret to prevent unauthorized access.
 */

import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { bookings, artistProfiles, venueProfiles } from '../../drizzle/schema';
import crypto from 'crypto';
import { bookingCalendarDateLines } from '../services/bookingCalendarFormatting';
import { ensureScheduleSchema } from '../services/scheduleSchemaService';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
function calendarSecret():string { if(!JWT_SECRET) throw new Error('Calendar signing is not configured'); return JWT_SECRET; }

/**
 * Generate a calendar token for an artist
 * This is a simple HMAC-based token that validates the artist has access
 */
export function generateCalendarToken(artistId: number): string {
  return crypto
    .createHmac('sha256', calendarSecret())
    .update(`calendar-feed-${artistId}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Validate a calendar token for an artist
 */
function validateCalendarToken(artistId: number, token: string): boolean {
  const expected = generateCalendarToken(artistId);
  const supplied=Buffer.from(token), reference=Buffer.from(expected);
  return supplied.length===reference.length && crypto.timingSafeEqual(supplied,reference);
}

/**
 * Format a Date to iCal DTSTART/DTEND format
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * GET /api/calendar/:artistId/bookings.ics
 * 
 * Returns an iCal feed of all confirmed/completed bookings for an artist.
 * Requires a valid token query parameter.
 */
router.get('/:artistId/bookings.ics', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.artistId, 10);
    const token = req.query.token as string;

    if (!artistId || isNaN(artistId)) {
      return res.status(400).send('Invalid artist ID');
    }

    if (typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token)) {
      return res.status(401).send('Invalid or missing calendar token');
    }

    // Validate token
    if (!validateCalendarToken(artistId, token)) {
      return res.status(403).send('Forbidden: Invalid calendar token');
    }

    // Get artist profile
    await ensureScheduleSchema();
    const database = await getDb();
    if (!database) {
      return res.status(500).send('Database not available');
    }
    const [artistProfile] = await database
      .select({ artistName: artistProfiles.artistName })
      .from(artistProfiles)
      .where(eq(artistProfiles.id, artistId))
      .limit(1);

    if (!artistProfile) {
      return res.status(404).send('Artist not found');
    }

    // Get confirmed and completed bookings
    const artistBookings = await database
      .select({
        id: bookings.id,
        eventDate: bookings.eventDate,
        eventTime: bookings.eventTime,
        scheduleStartAt: bookings.scheduleStartAt, scheduleEndAt: bookings.scheduleEndAt,
        scheduleTimezone: bookings.scheduleTimezone, scheduleAllDay: bookings.scheduleAllDay,
        eventDetails: bookings.eventDetails,
        status: bookings.status,
        totalFee: bookings.totalFee,
        venueName: bookings.venueName,
        venueAddress: bookings.venueAddress,
        venueId: bookings.venueId,
        eventType: bookings.eventType,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, artistId),
          sql`${bookings.status} IN ('confirmed', 'completed')`
        )
      );

    // Get venue names for bookings that don't have venueName set
    const venueIds: number[] = [...new Set(artistBookings.filter((b: any) => !b.venueName && b.venueId).map((b: any) => b.venueId as number))];
    const venueMap = new Map<number, string>();
    
    if (venueIds.length > 0) {
      for (const vid of venueIds) {
        const [venue] = await database
          .select({ id: venueProfiles.id, name: venueProfiles.organizationName })
          .from(venueProfiles)
          .where(eq(venueProfiles.id, vid))
          .limit(1);
        if (venue) venueMap.set(venue.id, venue.name || 'Venue');
      }
    }

    // Build iCal content
    const calName = `${artistProfile.artistName} - Bookings`;
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//Ologywood//Artist Bookings//EN`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(calName)}`,
      `X-WR-CALDESC:Confirmed bookings for ${escapeICalText(artistProfile.artistName)} on Ologywood`,
      'X-WR-TIMEZONE:UTC',
    ];

    for (const booking of artistBookings) {
      const dateLines = bookingCalendarDateLines(booking);

      const venueName = booking.venueName || venueMap.get(booking.venueId) || 'Venue';
      const location = booking.venueAddress || venueName;
      const eventTypeLabel = booking.eventType 
        ? booking.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Performance';

      const summary = `${eventTypeLabel} at ${venueName}`;
      const description = [
        `Booking #${booking.id}`,
        `Venue: ${venueName}`,
        booking.totalFee ? `Fee: $${booking.totalFee}` : '',
        booking.eventDetails || '',
        `Status: ${booking.status}`,
        `Timezone: ${booking.scheduleTimezone || 'Unspecified (date-level reservation)'}`,
        '',
        'Managed on Ologywood',
      ].filter(Boolean).join('\\n');

      const uid = `booking-${booking.id}@ologywood.com`;
      const dtstamp = formatICalDate(booking.createdAt || new Date());
      const lastModified = formatICalDate(booking.updatedAt || booking.createdAt || new Date());

      ical.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        ...dateLines,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${escapeICalText(location)}`,
        `LAST-MODIFIED:${lastModified}`,
        `STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    ical.push('END:VCALENDAR');

    // Set headers for iCal content
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.send(ical.join('\r\n'));
  } catch (error) {
    console.error('[Calendar Feed] Error generating iCal feed:', error);
    return res.status(500).send('Internal server error');
  }
});

/**
 * Generate a calendar token for a venue
 */
export function generateVenueCalendarToken(venueId: number): string {
  return crypto
    .createHmac('sha256', calendarSecret())
    .update(`venue-calendar-feed-${venueId}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Validate a calendar token for a venue
 */
function validateVenueCalendarToken(venueId: number, token: string): boolean {
  const expected = generateVenueCalendarToken(venueId);
  const supplied=Buffer.from(token), reference=Buffer.from(expected);
  return supplied.length===reference.length && crypto.timingSafeEqual(supplied,reference);
}

/**
 * GET /api/calendar/venue/:venueId/events.ics
 * 
 * Returns an iCal feed of all confirmed/completed bookings for a venue.
 * Requires a valid token query parameter.
 */
router.get('/venue/:venueId/events.ics', async (req: Request, res: Response) => {
  try {
    const venueId = parseInt(req.params.venueId, 10);
    const token = req.query.token as string;

    if (!venueId || isNaN(venueId)) {
      return res.status(400).send('Invalid venue ID');
    }

    if (typeof token !== 'string' || !/^[a-f0-9]{32}$/.test(token)) {
      return res.status(401).send('Invalid or missing calendar token');
    }

    // Validate token
    if (!validateVenueCalendarToken(venueId, token)) {
      return res.status(403).send('Forbidden: Invalid calendar token');
    }

    // Get venue profile
    await ensureScheduleSchema();
    const database = await getDb();
    if (!database) {
      return res.status(500).send('Database not available');
    }
    const [venueProfile] = await database
      .select({ name: venueProfiles.organizationName })
      .from(venueProfiles)
      .where(eq(venueProfiles.id, venueId))
      .limit(1);

    if (!venueProfile) {
      return res.status(404).send('Venue not found');
    }

    // Get confirmed and completed bookings for this venue
    const venueBookings = await database
      .select({
        id: bookings.id,
        eventDate: bookings.eventDate,
        eventTime: bookings.eventTime,
        scheduleStartAt: bookings.scheduleStartAt, scheduleEndAt: bookings.scheduleEndAt,
        scheduleTimezone: bookings.scheduleTimezone, scheduleAllDay: bookings.scheduleAllDay,
        eventDetails: bookings.eventDetails,
        status: bookings.status,
        totalFee: bookings.totalFee,
        artistId: bookings.artistId,
        eventType: bookings.eventType,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.venueId, venueId),
          sql`${bookings.bookingSource} <> 'client_booking'`,
          sql`${bookings.status} IN ('confirmed', 'completed')`
        )
      );

    // Get artist names for bookings
    const artistIds: number[] = [...new Set(venueBookings.filter((b: any) => b.artistId).map((b: any) => b.artistId as number))];
    const artistMap = new Map<number, string>();
    
    if (artistIds.length > 0) {
      for (const aid of artistIds) {
        const [artist] = await database
          .select({ id: artistProfiles.id, name: artistProfiles.artistName })
          .from(artistProfiles)
          .where(eq(artistProfiles.id, aid))
          .limit(1);
        if (artist) artistMap.set(artist.id, artist.name || 'Artist');
      }
    }

    // Build iCal content
    const calName = `${venueProfile.name} - Bookings`;
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//Ologywood//Venue Bookings//EN`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICalText(calName)}`,
      `X-WR-CALDESC:Confirmed bookings for ${escapeICalText(venueProfile.name || 'Venue')} on Ologywood`,
      'X-WR-TIMEZONE:UTC',
    ];

    for (const booking of venueBookings) {
      const dateLines = bookingCalendarDateLines(booking);

      const artistName = artistMap.get(booking.artistId) || 'Artist';
      const eventTypeLabel = booking.eventType 
        ? booking.eventType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Performance';

      const summary = `${eventTypeLabel} — ${artistName}`;
      const description = [
        `Booking #${booking.id}`,
        `Artist: ${artistName}`,
        booking.totalFee ? `Fee: $${booking.totalFee}` : '',
        booking.eventDetails || '',
        `Status: ${booking.status}`,
        `Timezone: ${booking.scheduleTimezone || 'Unspecified (date-level reservation)'}`,
        '',
        'Managed on Ologywood',
      ].filter(Boolean).join('\\n');

      const uid = `venue-booking-${booking.id}@ologywood.com`;
      const dtstamp = formatICalDate(booking.createdAt || new Date());
      const lastModified = formatICalDate(booking.updatedAt || booking.createdAt || new Date());

      ical.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        ...dateLines,
        `SUMMARY:${escapeICalText(summary)}`,
        `DESCRIPTION:${description}`,
        `LAST-MODIFIED:${lastModified}`,
        `STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    ical.push('END:VCALENDAR');

    // Set headers for iCal content
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.send(ical.join('\r\n'));
  } catch (error) {
    console.error('[Calendar Feed] Error generating venue iCal feed:', error);
    return res.status(500).send('Internal server error');
  }
});

export default router;
