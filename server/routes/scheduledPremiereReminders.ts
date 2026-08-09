import { Request, Response } from 'express';
import { getDb } from '../db';
import { contentReleases, contentReleasePurchases, artistProfiles, users } from '../../drizzle/schema';
import { eq, and, lte, gt, gte } from 'drizzle-orm';
import { sendPremiereReminderEmail } from '../email';

/**
 * Heartbeat handler: POST /api/scheduled/premiere-reminders
 * 
 * Runs daily at 9:00 AM UTC via manus-heartbeat (project-level cron).
 * 
 * Finds content releases with a premiere date within the next 24 hours,
 * then sends reminder emails to all ticket holders for those releases.
 * 
 * Auth: Platform gateway restricts /api/scheduled/* to cron callers only.
 */
export async function premiereRemindersHandler(req: Request, res: Response) {
  try {
    const taskUid = req.headers['x-manus-cron-task-uid'] as string | undefined;
    if (!taskUid) {
      return res.status(403).json({ error: 'cron-only', message: 'Missing x-manus-cron-task-uid header' });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find published releases with premiere dates in the next 24 hours
    const upcomingReleases = await db.select()
      .from(contentReleases)
      .where(
        and(
          eq(contentReleases.isPublished, true),
          gte(contentReleases.premiereDate, now),
          lte(contentReleases.premiereDate, in24Hours)
        )
      );

    if (upcomingReleases.length === 0) {
      return res.json({ success: true, message: 'No upcoming premieres', reminders_sent: 0 });
    }

    let totalSent = 0;

    for (const release of upcomingReleases) {
      // Get the creator name
      const [artist] = await db.select().from(artistProfiles)
        .where(eq(artistProfiles.id, release.artistProfileId)).limit(1);
      const creatorName = artist?.artistName || 'Creator';

      // Get all purchasers of this release
      const purchases = await db.select()
        .from(contentReleasePurchases)
        .where(eq(contentReleasePurchases.releaseId, release.id));

      for (const purchase of purchases) {
        // Get buyer info
        const [buyer] = await db.select().from(users)
          .where(eq(users.id, purchase.userId)).limit(1);
        if (!buyer || !buyer.email) continue;

        try {
          await sendPremiereReminderEmail({
            buyerEmail: buyer.email,
            buyerName: buyer.name || '',
            releaseTitle: release.title,
            creatorName,
            premiereDate: release.premiereDate!,
            contentUrl: release.contentUrl,
            hostingPlatform: release.hostingPlatform,
          });
          totalSent++;
        } catch (emailErr) {
          console.error(`[Premiere Reminder] Failed to send to ${buyer.email}:`, emailErr);
        }
      }
    }

    return res.json({
      success: true,
      message: `Sent ${totalSent} premiere reminders for ${upcomingReleases.length} releases`,
      reminders_sent: totalSent,
      releases_count: upcomingReleases.length,
    });
  } catch (error: any) {
    console.error('[Premiere Reminders] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
