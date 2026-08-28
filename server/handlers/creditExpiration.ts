import { Request, Response } from "express";
import { getDb } from "../db";
import { referralCredits, users } from "../../drizzle/schema";
import { eq, and, sql, lte } from "drizzle-orm";
import { sendEmail } from "../email";
import { ENV } from "../_core/env";
import { getEmailLogoImage } from "../../shared/emailBranding";

/**
 * Credit Expiration Handler
 * 
 * Runs daily via Heartbeat cron to:
 * 1. Expire credits that have passed their expiresAt date
 * 2. Send warning emails 7 days before credits expire
 * 
 * Endpoint: POST /api/scheduled/credit-expiration
 */
export async function creditExpirationHandler(req: Request, res: Response) {
  try {
    // Auth: trust platform gateway — /api/scheduled/* is restricted to cron callers
    const taskUid = req.headers['x-manus-cron-task-uid'] as string | undefined;
    if (!taskUid) {
      return res.status(403).json({ error: 'cron-only', message: 'Missing x-manus-cron-task-uid header' });
    }

    const database = await getDb();
    if (!database) {
      return res.status(500).json({ error: "Database not available" });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Step 1: Expire credits that have passed their expiresAt date
    const expiredCredits = await database
      .select({
        id: referralCredits.id,
        userId: referralCredits.userId,
        amount: referralCredits.amount,
      })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.type, "earned"),
        sql`${referralCredits.expiresAt} IS NOT NULL`,
        lte(referralCredits.expiresAt, now)
      ));

    let expiredCount = 0;
    for (const credit of expiredCredits) {
      // Mark the earned credit as expired
      await database
        .update(referralCredits)
        .set({ type: "expired", description: "Credit expired after 90 days of inactivity" })
        .where(eq(referralCredits.id, credit.id));
      expiredCount++;
    }

    // Step 2: Send warning emails for credits expiring within 7 days
    const soonExpiringCredits = await database
      .select({
        id: referralCredits.id,
        userId: referralCredits.userId,
        amount: referralCredits.amount,
        expiresAt: referralCredits.expiresAt,
        expirationWarned: referralCredits.expirationWarned,
      })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.type, "earned"),
        sql`${referralCredits.expiresAt} IS NOT NULL`,
        sql`${referralCredits.expiresAt} > NOW()`,
        lte(referralCredits.expiresAt, sevenDaysFromNow),
        sql`(${referralCredits.expirationWarned} = false OR ${referralCredits.expirationWarned} IS NULL)`
      ));

    let warnedCount = 0;
    for (const credit of soonExpiringCredits) {
      // Get user info for the email
      const userInfo = await database
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, credit.userId))
        .limit(1);

      if (userInfo.length > 0 && userInfo[0].email) {
        const userName = userInfo[0].name || "there";
        const userEmail = userInfo[0].email;
        const expiryDate = credit.expiresAt ? new Date(credit.expiresAt).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        }) : 'soon';
        const amount = Number(credit.amount).toFixed(2);
        const baseUrl = ENV.baseUrl;

        await sendEmail({
          to: userEmail,
          subject: `⏰ Your $${amount} referral credit expires on ${expiryDate}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6D28D9 0%, #00D9FF 100%); padding: 30px 20px; text-align: center;">
                ${getEmailLogoImage({ size: 88, marginBottom: 12 })}
                <p style="color: white; font-size: 14px; margin: 0; font-weight: 500;">Where Artists Meet Opportunities</p>
              </div>
              <div style="padding: 30px 24px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${userName},</p>
                
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b; text-align: center;">
                  <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Credit Expiring Soon</p>
                  <p style="color: #78350f; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">$${amount}</p>
                  <p style="color: #92400e; font-size: 14px; margin: 0;">Expires on ${expiryDate}</p>
                </div>

                <p style="color: #374151; font-size: 14px; margin: 0 0 20px 0;">
                  Your referral credit will expire in less than 7 days. Use it toward your next subscription payment before it's gone!
                </p>

                <a href="${baseUrl}/pricing" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Use Your Credit Now
                </a>

                <p style="color: #6b7280; font-size: 12px; margin: 20px 0 0 0;">
                  Credits expire 90 days after being earned to encourage timely use. Once expired, they cannot be recovered.
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&type=referral" style="color: #6D28D9; text-decoration: none;">Unsubscribe</a> | 
                  <a href="${baseUrl}/settings" style="color: #6D28D9; text-decoration: none;">Manage preferences</a>
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">&copy; 2026 Ologywood. All rights reserved.</p>
              </div>
            </div>
          `,
        }).catch((err: unknown) => console.error("[CreditExpiration] Failed to send warning email:", err));

        // Mark as warned so we don't send again
        await database
          .update(referralCredits)
          .set({ expirationWarned: true })
          .where(eq(referralCredits.id, credit.id));
        warnedCount++;
      }
    }

    res.json({
      ok: true,
      expiredCount,
      warnedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[CreditExpiration] Handler error:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
