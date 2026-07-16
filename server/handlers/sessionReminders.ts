import { Request, Response } from "express";
import { getDb } from "../db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import {
  ologyLiveBookings,
  ologyLiveExperiences,
  users,
} from "../../drizzle/schema";
import { sdk } from "../_core/sdk";

/**
 * Session Reminders Handler
 * Called by Heartbeat cron every 15 minutes to check for upcoming sessions
 * and send reminder notifications to both talent and fans.
 */
export async function sessionRemindersHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

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
        console.error(`[SessionReminders] Error sending reminder for booking ${booking.bookingId}:`, err);
      }
    }

    res.json({
      ok: true,
      upcomingSessionsFound: upcomingBookings.length,
      remindersSent,
      checkedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[SessionReminders] Handler error:", error);
    res.status(500).json({
      error: error.message || "Internal error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      context: { url: req.url, taskUid: (error as any)?.taskUid },
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

  const subject = `⏰ Your Ology Live session "${sessionTitle}" starts in ${minutesUntil} minutes!`;

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
      console.error("[SessionReminders] Email send failed:", err);
    }
  } else {
    console.log(`[SessionReminders] Would send email to ${to}: ${subject}`);
  }
}
