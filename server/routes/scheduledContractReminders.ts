import { Request, Response } from 'express';
import { getDb } from '../db';
import { venueContracts, bookings, users } from '../../drizzle/schema';
import { eq, and, lte, gt, inArray } from 'drizzle-orm';
import { sendEmail } from '../email';

/**
 * Heartbeat handler: POST /api/scheduled/contract-expiry-reminders
 * 
 * Runs daily at 9:00 AM UTC via manus-heartbeat (project-level cron §4a).
 * 
 * 1. Finds contracts expiring within 24 hours → sends reminder emails to artists
 * 2. Auto-expires contracts past their deadline → updates status to 'declined'
 * 
 * Auth: Platform gateway restricts /api/scheduled/* to cron callers only.
 * We verify via x-manus-cron-task-uid header (no §5c patches needed).
 */
export async function contractExpiryRemindersHandler(req: Request, res: Response) {
  try {
    // Auth: trust platform gateway — /api/scheduled/* is restricted to cron callers
    const taskUid = req.headers['x-manus-cron-task-uid'] as string | undefined;
    if (!taskUid) {
      return res.status(403).json({ error: 'cron-only', message: 'Missing x-manus-cron-task-uid header' });
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    // === PART 1: Send reminders for contracts expiring within 24 hours ===
    const expiringContracts = await db.select()
      .from(venueContracts)
      .where(
        and(
          inArray(venueContracts.status, ['sent', 'viewed', 'signed_by_venue']),
          lte(venueContracts.expiresAt, in24Hours),
          gt(venueContracts.expiresAt, now)
        )
      );

    let reminders = 0;

    for (const contract of expiringContracts) {
      try {
        // Look up the booking to find the artist
        const [booking] = await db.select()
          .from(bookings)
          .where(eq(bookings.id, contract.bookingId))
          .limit(1);

        if (!booking) continue;

        // Look up the artist's email
        const [artist] = await db.select()
          .from(users)
          .where(eq(users.id, booking.artistId))
          .limit(1);

        if (!artist?.email) continue;

        const hoursLeft = Math.round((new Date(contract.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60));

        await sendEmail({
          to: artist.email,
          subject: `⏰ Contract "${contract.title}" expires in ${hoursLeft} hours`,
          html: `
            <h2>Contract Signature Reminder</h2>
            <p>Hi ${artist.name || 'there'},</p>
            <p>The venue contract "<strong>${contract.title}</strong>" is expiring in approximately <strong>${hoursLeft} hours</strong>.</p>
            <p>Please log in to Ologywood to review and sign the contract before the deadline.</p>
            <p><a href="https://www.ologywood.com/booking/${contract.bookingId}" style="display:inline-block;padding:12px 24px;background:#6B21A8;color:#fff;text-decoration:none;border-radius:6px;">Review Contract</a></p>
            <p>If you have questions about the contract terms, please message the venue directly through the platform.</p>
            <hr />
            <p style="font-size:12px;color:#666;">You're receiving this because you have a pending contract on Ologywood. <a href="https://www.ologywood.com/settings">Manage email preferences</a></p>
          `,
        });
        reminders++;
      } catch (emailErr) {
        console.error(`[Scheduled] Failed to send reminder for contract ${contract.id}:`, emailErr);
      }
    }

    // === PART 2: Auto-expire contracts past their deadline ===
    const expiredContracts = await db.select()
      .from(venueContracts)
      .where(
        and(
          inArray(venueContracts.status, ['sent', 'viewed', 'signed_by_venue']),
          lte(venueContracts.expiresAt, now)
        )
      );

    let expired = 0;

    for (const contract of expiredContracts) {
      try {
        await db.update(venueContracts)
          .set({ status: 'declined', updatedAt: now })
          .where(eq(venueContracts.id, contract.id));
        expired++;

        // Notify the venue that the contract expired
        const [booking] = await db.select()
          .from(bookings)
          .where(eq(bookings.id, contract.bookingId))
          .limit(1);

        if (booking) {
          const [venue] = await db.select()
            .from(users)
            .where(eq(users.id, booking.venueId))
            .limit(1);

          if (venue?.email) {
            await sendEmail({
              to: venue.email,
              subject: `Contract "${contract.title}" has expired`,
              html: `
                <h2>Contract Expired</h2>
                <p>Hi ${venue.name || 'there'},</p>
                <p>Your venue contract "<strong>${contract.title}</strong>" has expired without being signed by the artist.</p>
                <p>You can create a new contract with an extended deadline from the booking detail page.</p>
                <p><a href="https://www.ologywood.com/booking/${contract.bookingId}" style="display:inline-block;padding:12px 24px;background:#6B21A8;color:#fff;text-decoration:none;border-radius:6px;">View Booking</a></p>
                <hr />
                <p style="font-size:12px;color:#666;">You're receiving this because you have contracts on Ologywood. <a href="https://www.ologywood.com/settings">Manage email preferences</a></p>
              `,
            });
          }
        }
      } catch (expireErr) {
        console.error(`[Scheduled] Failed to expire contract ${contract.id}:`, expireErr);
      }
    }

    console.log(`[Scheduled] Contract expiry check: ${reminders} reminders sent, ${expired} contracts expired`);

    res.json({
      ok: true,
      reminders_sent: reminders,
      contracts_expired: expired,
      checked_at: now.toISOString(),
      task_uid: taskUid,
    });
  } catch (error: any) {
    console.error('[Scheduled] Contract expiry check failed:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid: req.headers['x-manus-cron-task-uid'] },
      timestamp: new Date().toISOString(),
    });
  }
}
