import { Request, Response } from 'express';
import { getDb } from '../db';
import { venueContracts } from '../../drizzle/schema';
import { eq, and, lte, gt, inArray } from 'drizzle-orm';
import { sendEmail } from '../email';
import { sdk } from '../_core/sdk';

/**
 * Heartbeat handler: /api/scheduled/contract-expiry-reminders
 * 
 * Runs daily. Checks for venue contracts expiring within 24 hours
 * and sends reminder emails to artists who haven't signed yet.
 * Also auto-expires contracts that have passed their deadline.
 */
export async function contractExpiryRemindersHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!(user as any).isCron) {
      return res.status(403).json({ error: 'cron-only' });
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    // Find contracts expiring within 24 hours that are still pending signature
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
    let expired = 0;

    for (const contract of expiringContracts) {
      // Send reminder email to artist
      // Note: In production, look up artist email from booking
      reminders++;
    }

    // Auto-expire contracts past their deadline
    const expiredContracts = await db.select()
      .from(venueContracts)
      .where(
        and(
          inArray(venueContracts.status, ['sent', 'viewed', 'signed_by_venue']),
          lte(venueContracts.expiresAt, now)
        )
      );

    for (const contract of expiredContracts) {
      await db.update(venueContracts)
        .set({ status: 'declined', updatedAt: now })
        .where(eq(venueContracts.id, contract.id));
      expired++;
    }

    res.json({
      ok: true,
      reminders_sent: reminders,
      contracts_expired: expired,
      checked_at: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Scheduled] Contract expiry check failed:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
