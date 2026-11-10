import { Request, Response } from "express";
import { getDb } from "../db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import {
  ologyLiveBookings,
  ologyLiveExperiences,
  users,
} from "../../drizzle/schema";
import { requireVerifiedCronTask } from "../services/cronAuth";
import { sanitizeFanEmailSubject } from "../services/fanEmailFormatting";

/**
 * Session Reminders Handler
 * Called by Heartbeat cron every 15 minutes to check for upcoming sessions
 * and send reminder notifications to both talent and fans.
 */
export async function sessionRemindersHandler(req: Request, res: Response) {
  const handlerStarted = Date.now();
  try {
    const taskUid = await requireVerifiedCronTask(req, res);
    if (!taskUid) return;

    const db = (await getDb())!;
    const now = new Date();

    // Find sessions starting in the next 1 hour that haven't been reminded yet
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingBookings = await db.select({
      bookingId: ologyLiveBookings.id,
      scheduledAt: ologyLiveBookings.scheduledAt,
      joinLink: ologyLiveBookings.joinLink,
      fanId: ologyLiveBookings.fanId,
      talentId: ologyLiveBookings.talentId,
      experienceTitle: ologyLiveExperiences.title,
      experiencePlatform: ologyLiveExperiences.platform,
      experienceDuration: ologyLiveExperiences.duration,
    })
      .from(ologyLiveBookings)
      .leftJoin(ologyLiveExperiences, eq(ologyLiveBookings.experienceId, ologyLiveExperiences.id))
      .where(and(
        gte(ologyLiveBookings.scheduledAt, now),
        lte(ologyLiveBookings.scheduledAt, oneHourFromNow),
        eq(ologyLiveBookings.status, "confirmed"),
        ne(ologyLiveBookings.status, "cancelled")
      ))
      .limit(100);

    let remindersSent = 0;

    for (const booking of upcomingBookings) {
      try {
        // Get talent and fan info
        const talent = booking.talentId ? (await db.select().from(users)
          .where(eq(users.id, booking.talentId)).limit(1))[0] : null;
        const fan = booking.fanId ? (await db.select().from(users)
          .where(eq(users.id, booking.fanId)).limit(1))[0] : null;

        const minutesUntil = Math.round(
          ((booking.scheduledAt?.getTime() || 0) - now.getTime()) / (1000 * 60)
        );

        // Send reminder to fan
        if (fan?.email) {
          await sendReminderEmail({
            to: fan.email,
            recipientName: fan.name || "Fan",
            sessionTitle: booking.experienceTitle || "Live Session",
            talentName: talent?.name || "Your host",
            platform: booking.experiencePlatform || "the session platform",
            joinLink: booking.joinLink || "",
            minutesUntil,
            duration: booking.experienceDuration || 30,
          });
          remindersSent++;
        }

        // Send reminder to talent
        if (talent?.email) {
          await sendReminderEmail({
            to: talent.email,
            recipientName: talent.name || "Talent",
            sessionTitle: booking.experienceTitle || "Live Session",
            talentName: fan?.name || "Your guest",
            platform: booking.experiencePlatform || "the session platform",
            joinLink: booking.joinLink || "",
            minutesUntil,
            duration: booking.experienceDuration || 30,
            isTalent: true,
          });
          remindersSent++;
        }
      } catch (err) {
        console.error('[SessionReminders] Error sending reminder', {
          bookingId: booking.bookingId,
          errorType: err instanceof Error ? err.name : 'UnknownError',
        });
      }
    }

    // Reuse the deployed project-owned scheduler. No in-process timer or new
    // registration is introduced; provider modes remain strictly independent.
    const eduLifecycle: Array<{ mode: string; checked: number; blocked: number; hasMore: boolean; nextCursor: number }> = [];
    let eduLifecycleUnavailable = false;
    let eduLifecycleDeferred = false;
    try {
      const { sql } = await import('drizzle-orm');
      const [dueRows] = await db.execute(sql`SELECT COUNT(*) AS total FROM edu_verifications WHERE (billingMode IS NOT NULL OR status = 'approved') AND (billingReconcileAfter IS NULL OR billingReconcileAfter <= UTC_TIMESTAMP())`);
      const due = Array.isArray(dueRows) ? Number((dueRows[0] as any)?.total || 0) : 0;
      if (due > 0) {
        const { defaultEduBillingDependencies, runEduLifecycleBatch } = await import('../services/eduBillingService');
        const modes: Array<'live' | 'test'> = [];
        const primary = process.env.STRIPE_SECRET_KEY || '';
        if (primary.startsWith('sk_live_') || process.env.STRIPE_LIVE_SECRET_KEY?.startsWith('sk_live_')) modes.push('live');
        if (primary.startsWith('sk_test_') || process.env.STRIPE_TEST_SECRET_KEY?.startsWith('sk_test_')) modes.push('test');
        for (const mode of modes) {
          if (Date.now() - handlerStarted >= 35_000) { eduLifecycleDeferred = true; break; }
          const dependencies = await defaultEduBillingDependencies(mode);
          let cursor = 0, checked = 0, blocked = 0, hasMore = true, pages = 0;
          while (hasMore && pages++ < 20 && Date.now() - handlerStarted < 35_000) {
            const result = await runEduLifecycleBatch({ mode, limit: 1, afterUserId: cursor, maxDurationMs: 30_000 }, dependencies);
            checked += result.results.length; blocked += result.blocked; hasMore = result.hasMore;
            if (result.nextCursor <= cursor) break;
            cursor = result.nextCursor;
          }
          if (hasMore) eduLifecycleDeferred = true;
          eduLifecycle.push({ mode, checked, blocked, hasMore, nextCursor: cursor });
        }
      }
    } catch (error) {
      // Never interfere with Ology Live reminders. Surface the separate EDU
      // dependency failure to the scheduler rather than reporting completion.
      eduLifecycleUnavailable = true;
      console.error('[EDU Lifecycle] Scheduled batch unavailable', { kind: error instanceof Error ? error.name : 'UnknownError' });
    }

    res.json({
      ok: true,
      upcomingSessionsFound: upcomingBookings.length,
      remindersSent,
      eduLifecycle,
      eduLifecycleUnavailable,
      eduLifecycleDeferred,
      checkedAt: now.toISOString(),
    });
  } catch (error: unknown) {
    console.error("[SessionReminders] Handler error", {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    res.status(500).json({
      error: "Unable to process scheduled session reminders",
      timestamp: new Date().toISOString(),
    });
  }
}

interface ReminderEmailParams {
  to: string;
  recipientName: string;
  sessionTitle: string;
  talentName: string;
  platform: string;
  joinLink: string;
  minutesUntil: number;
  duration: number;
  isTalent?: boolean;
}

async function sendReminderEmail(params: ReminderEmailParams): Promise<void> {
  const { to, recipientName, sessionTitle, talentName, platform, joinLink, minutesUntil, duration, isTalent } = params;

  const subject = sanitizeFanEmailSubject(`⏰ Your Ology Live session "${sessionTitle}" starts in ${minutesUntil} minutes!`);

  const body = isTalent
    ? `Hi ${recipientName},\n\nYour Ology Live session "${sessionTitle}" with ${talentName} starts in ${minutesUntil} minutes.\n\nSession Details:\n- Platform: ${platform}\n- Duration: ${duration} minutes\n${joinLink ? `- Join Link: ${joinLink}` : "- Please share the join link with your guest"}\n\nPlease be ready a few minutes early. Have a great session!\n\nBest,\nThe Ologywood Team`
    : `Hi ${recipientName},\n\nYour Ology Live session "${sessionTitle}" with ${talentName} starts in ${minutesUntil} minutes!\n\nSession Details:\n- Platform: ${platform}\n- Duration: ${duration} minutes\n${joinLink ? `- Join Link: ${joinLink}` : "- The host will share the join link shortly"}\n\nGet ready for an amazing experience!\n\nBest,\nThe Ologywood Team`;

  // Use SendGrid if available
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL, name: "Ologywood" },
          subject,
          content: [{ type: "text/plain", value: body }],
        }),
      });

      if (!response.ok) {
        console.error(`[SessionReminders] SendGrid error: ${response.status}`);
      }
    } catch (err) {
        console.error("[SessionReminders] Email send failed", {
          errorType: err instanceof Error ? err.name : 'UnknownError',
        });
    }
  } else {
    console.log(`[SessionReminders] Email delivery skipped: provider not configured`);
  }
}
