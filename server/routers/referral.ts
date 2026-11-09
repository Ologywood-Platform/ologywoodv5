import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { sendReferralSignupEmail, sendReferralCreditEarnedEmail } from "../referralEmails";

async function db() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database;
}
import { referrals, referralCredits, users } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { stripe } from "../stripe";
import { RateLimiter } from "../utils/rateLimiter";

const referralCodeSchema = z.string().trim().regex(/^[A-Z0-9_-]{8}$/u, 'Invalid referral code');
const publicReferralLimiter = new RateLimiter({ maxRequests: 60, windowMs: 60 * 1000 });

function clientIp(ctx: { req?: { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } } }): string {
  return ctx.req?.headers?.['x-forwarded-for']?.toString()?.split(',')[0]?.trim()
    || ctx.req?.socket?.remoteAddress || 'unknown';
}

function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!local || !domain) return null;
  return `${local.slice(0, 1)}***@${domain}`;
}

// Generate a short, readable referral code
function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

// Referral reward amount (in dollars)
const REFERRER_CREDIT_AMOUNT = 5.00;
const REFERRED_DISCOUNT_PERCENT = 50; // 50% off first month

export const referralRouter = router({
  /**
   * Get or create the current user's referral code
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const database = await db();
    
    // Check if user already has a referral code
    const existing = await database
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, ctx.user.id),
        sql`${referrals.referredId} IS NULL`
      ))
      .limit(1);

    if (existing.length > 0) {
      return { code: existing[0].referralCode };
    }

    // Create a new referral code for this user
    const code = generateReferralCode();
    await database.insert(referrals).values({
      referrerId: ctx.user.id,
      referralCode: code,
      status: "pending",
    });

    return { code };
  }),

  /**
   * Get referral stats for the current user
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const database = await db();

    // Count total referrals
    const totalReferrals = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, ctx.user.id),
        sql`${referrals.referredId} IS NOT NULL`
      ));

    // Count converted referrals
    const convertedReferrals = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, ctx.user.id),
        eq(referrals.status, "completed")
      ));

    // Get total credits earned (only non-expired)
    const creditsEarned = await database
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.userId, ctx.user.id),
        eq(referralCredits.type, "earned"),
        sql`(${referralCredits.expiresAt} IS NULL OR ${referralCredits.expiresAt} > NOW())`
      ));

    // Get total credits redeemed
    const creditsRedeemed = await database
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.userId, ctx.user.id),
        eq(referralCredits.type, "redeemed")
      ));

    // Get total expired credits
    const creditsExpired = await database
      .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.userId, ctx.user.id),
        eq(referralCredits.type, "expired")
      ));

    const earned = parseFloat(creditsEarned[0]?.total || "0");
    const redeemed = parseFloat(creditsRedeemed[0]?.total || "0");
    const expired = parseFloat(creditsExpired[0]?.total || "0");

    // Find the nearest expiration date for active credits
    const nextExpiry = await database
      .select({ expiresAt: referralCredits.expiresAt })
      .from(referralCredits)
      .where(and(
        eq(referralCredits.userId, ctx.user.id),
        eq(referralCredits.type, "earned"),
        sql`${referralCredits.expiresAt} IS NOT NULL AND ${referralCredits.expiresAt} > NOW()`
      ))
      .orderBy(referralCredits.expiresAt)
      .limit(1);

    return {
      totalReferrals: Number(totalReferrals[0]?.count || 0),
      convertedReferrals: Number(convertedReferrals[0]?.count || 0),
      creditsEarned: earned,
      creditsRedeemed: redeemed,
      creditsExpired: expired,
      creditBalance: earned - redeemed,
      nextExpiryDate: nextExpiry[0]?.expiresAt || null,
    };
  }),

  /**
   * Get referral history (who was referred and their status)
   */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const database = await db();

    const myReferrals = await database
      .select({
        id: referrals.id,
        referredId: referrals.referredId,
        referredName: users.name,
        referredEmail: users.email,
        status: referrals.status,
        rewardAmount: referrals.rewardAmount,
        convertedAt: referrals.convertedAt,
        createdAt: referrals.createdAt,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(and(
        eq(referrals.referrerId, ctx.user.id),
        sql`${referrals.referredId} IS NOT NULL`
      ))
      .orderBy(desc(referrals.createdAt))
      .limit(50);

    return myReferrals.map((referral) => ({
      ...referral,
      referredEmail: maskEmail(referral.referredEmail),
    }));
  }),

  /**
   * Get credit transaction history
   */
  getCreditHistory: protectedProcedure.query(async ({ ctx }) => {
    const database = await db();

    const history = await database
      .select({
        id: referralCredits.id,
        amount: referralCredits.amount,
        type: referralCredits.type,
        referralId: referralCredits.referralId,
        description: referralCredits.description,
        expiresAt: referralCredits.expiresAt,
        createdAt: referralCredits.createdAt,
      })
      .from(referralCredits)
      .where(eq(referralCredits.userId, ctx.user.id))
      .orderBy(desc(referralCredits.createdAt))
      .limit(50);

    return history;
  }),

  /**
   * Validate a referral code (public - used during signup)
   */
  validateCode: publicProcedure
    .input(z.object({ code: referralCodeSchema }).strict())
    .query(async ({ input, ctx }) => {
      if (!publicReferralLimiter.check(`ip:${clientIp(ctx)}`).allowed) return { valid: false, referrerName: null };
      const database = await db();

      const referral = await database
        .select({
          id: referrals.id,
          referrerId: referrals.referrerId,
          referrerName: users.name,
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referrerId, users.id))
        .where(and(
          eq(referrals.referralCode, input.code.toUpperCase()),
          sql`${referrals.referredId} IS NULL`,
          eq(referrals.status, "pending")
        ))
        .limit(1);

      if (referral.length === 0) {
        return { valid: false, referrerName: null };
      }

      return {
        valid: true,
        referrerName: referral[0].referrerName || "A friend",
      };
    }),

  /**
   * Apply a referral code to the current user (called after signup with a referral link)
   */
  applyCode: protectedProcedure
    .input(z.object({ code: referralCodeSchema }).strict())
    .mutation(async ({ ctx, input }) => {
      const database = await db();
      const code = input.code.toUpperCase();

      // Find the referral code entry
      const referral = await database
        .select()
        .from(referrals)
        .where(and(
          eq(referrals.referralCode, code),
          sql`${referrals.referredId} IS NULL`,
          eq(referrals.status, "pending")
        ))
        .limit(1);

      if (referral.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired referral code",
        });
      }

      // Can't refer yourself
      if (referral[0].referrerId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot use your own referral code",
        });
      }

      // Check if this user was already referred
      const alreadyReferred = await database
        .select()
        .from(referrals)
        .where(eq(referrals.referredId, ctx.user.id))
        .limit(1);

      if (alreadyReferred.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already used a referral code",
        });
      }

      // Update the referral with the referred user
      const updateResult = await database
        .update(referrals)
        .set({
          referredId: ctx.user.id,
          status: "completed",
          convertedAt: new Date(),
          rewardAmount: String(REFERRER_CREDIT_AMOUNT),
        })
        .where(and(
          eq(referrals.id, referral[0].id),
          sql`${referrals.referredId} IS NULL`,
          eq(referrals.status, "pending"),
        ));
      const affectedRows = Number((updateResult as any)?.[0]?.affectedRows ?? 0);
      if (affectedRows !== 1) {
        throw new TRPCError({ code: "CONFLICT", message: "This referral code has already been used" });
      }

      // Award credit to the referrer (expires in 90 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);
      await database.insert(referralCredits).values({
        userId: referral[0].referrerId,
        amount: String(REFERRER_CREDIT_AMOUNT),
        type: "earned",
        referralId: referral[0].id,
        description: `Referral reward — ${ctx.user.name || ctx.user.email || 'new user'} signed up`,
        expiresAt,
      });

      // Create a new pending referral code for the referrer (so they can keep referring)
      const newCode = generateReferralCode();
      await database.insert(referrals).values({
        referrerId: referral[0].referrerId,
        referralCode: newCode,
        status: "pending",
      });

      // Send email notifications to the referrer (non-blocking)
      const referrerInfo = await database
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, referral[0].referrerId))
        .limit(1);

      if (referrerInfo.length > 0 && referrerInfo[0].email) {
        const referrerName = referrerInfo[0].name || "there";
        const referrerEmail = referrerInfo[0].email;
        const referredName = ctx.user.name || ctx.user.email || "A new user";

        // Email 1: Friend signed up notification
        sendReferralSignupEmail({
          referrerEmail,
          referrerName,
          referredName,
        }).catch((err: unknown) => console.error("[Referral] Failed to send signup email:", err));

        // Email 2: Credit earned notification
        sendReferralCreditEarnedEmail({
          referrerEmail,
          referrerName,
          referredName,
          creditAmount: REFERRER_CREDIT_AMOUNT,
        }).catch((err: unknown) => console.error("[Referral] Failed to send credit email:", err));
      }

      return {
        success: true,
        discount: REFERRED_DISCOUNT_PERCENT,
        message: `Referral applied! You'll get ${REFERRED_DISCOUNT_PERCENT}% off your first month.`,
      };
    }),

  /**
   * Create a Stripe coupon for the referred user's first month discount
   */
  getDiscountCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["starter", "professional"]),
      interval: z.enum(["month", "year"]),
    }).strict())
    .mutation(async ({ ctx, input }) => {
      const database = await db();

      // Check if this user was referred (has a completed referral where they are the referredId)
      const wasReferred = await database
        .select()
        .from(referrals)
        .where(and(
          eq(referrals.referredId, ctx.user.id),
          eq(referrals.status, "completed")
        ))
        .limit(1);

      if (wasReferred.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No referral discount available",
        });
      }

      // Check if already redeemed (has a redeemed credit)
      const alreadyRedeemed = await database
        .select()
        .from(referralCredits)
        .where(and(
          eq(referralCredits.userId, ctx.user.id),
          eq(referralCredits.type, "redeemed")
        ))
        .limit(1);

      if (alreadyRedeemed.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Referral discount has already been used",
        });
      }

      return {
        hasDiscount: true,
        discountPercent: REFERRED_DISCOUNT_PERCENT,
      };
    }),
});
