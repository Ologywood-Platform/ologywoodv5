import { Request, Response } from 'express';
import { getDb } from '../db';
import { bookings, users, artistProfiles } from '../../drizzle/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendSettlementReminderEmail } from '../email';

/**
 * Heartbeat handler: POST /api/scheduled/auto-complete-bookings
 * 
 * Runs daily at 6:00 AM UTC via manus-heartbeat (project-level cron §4a).
 * 
 * Finds confirmed bookings where the event date has passed (yesterday or earlier)
 * and automatically marks them as "completed". Also triggers settlement reminder
 * emails for bookings with door-split or guarantee-vs-percentage payment terms.
 * 
 * Auth: Platform gateway restricts /api/scheduled/* to cron callers only.
 * We verify via x-manus-cron-task-uid header (no §5c patches needed).
 */
export async function autoCompleteBookingsHandler(req: Request, res: Response) {
  try {
    // Auth: trust platform gateway — /api/scheduled/* is restricted to cron callers
    const taskUid = req.headers['x-manus-cron-task-uid'] as string | undefined;
    if (!taskUid) {
      return res.status(403).json({ error: 'cron-only', message: 'Missing x-manus-cron-task-uid header' });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    const now = new Date();
    // Find all confirmed bookings where eventDate is before today
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Get confirmed bookings with past event dates
    const pastBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed'),
          lte(bookings.eventDate, yesterday)
        )
      );

    if (pastBookings.length === 0) {
      return res.json({
        ok: true,
        message: 'No bookings to auto-complete',
        completed: 0,
        timestamp: now.toISOString(),
      });
    }

    let completedCount = 0;
    let settlementEmailsSent = 0;

    for (const booking of pastBookings) {
      // Mark as completed
      await db
        .update(bookings)
        .set({
          status: 'completed',
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id));

      completedCount++;

      // Send settlement reminder for door-split or guarantee-vs-percentage bookings
      const paymentTermsType = booking.paymentTermsType;
      if (paymentTermsType === 'door_split' || paymentTermsType === 'guarantee_vs_percentage') {
        try {
          // Get venue user info for the email
          const venueUser = await db.select().from(users).where(eq(users.id, booking.venueId)).limit(1);
          
          // Get artist name from artist profiles
          const artistProfile = await db.select().from(artistProfiles).where(eq(artistProfiles.userId, booking.artistId)).limit(1);
          const artistName = artistProfile.length > 0 ? artistProfile[0].artistName : 'Artist';

          if (venueUser.length > 0 && venueUser[0].email) {
            await sendSettlementReminderEmail({
              venueEmail: venueUser[0].email,
              venueName: venueUser[0].name || 'Venue',
              artistName,
              eventDate: booking.eventDate ? new Date(booking.eventDate).toISOString() : new Date().toISOString(),
              bookingId: booking.id,
              paymentTermsType,
              doorSplitArtistPercent: booking.doorSplitArtistPercent ?? undefined,
              guaranteeAmount: booking.guaranteeAmount ?? undefined,
            });
            settlementEmailsSent++;
          }
        } catch (emailErr) {
          // Don't fail the whole job if one email fails
          console.error(`[AutoComplete] Failed to send settlement email for booking ${booking.id}:`, emailErr);
        }
      }
    }

    console.log(`[AutoComplete] Completed ${completedCount} bookings, sent ${settlementEmailsSent} settlement emails`);

    return res.json({
      ok: true,
      message: `Auto-completed ${completedCount} bookings`,
      completed: completedCount,
      settlementEmailsSent,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[AutoComplete] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context: { url: req.url, taskUid: req.headers['x-manus-cron-task-uid'] },
      timestamp: new Date().toISOString(),
    });
  }
}
