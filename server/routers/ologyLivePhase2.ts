import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import {
  ologyLiveSessionContracts,
  ologyLiveBookings,
  ologyLiveExperiences,
  ologyLiveReviews,
  ologyLiveEarnings,
  ologyLiveQuestions,
  users,
} from "../../drizzle/schema";
import {
  generateSessionContract,
  getContractByBookingId,
  signContract,
  markContractViewed,
} from "../services/nilSessionContract";
import { ensureOlogyLiveBookingsSchema } from "../services/ologyLiveSchemaService";

export const ologyLivePhase2Router = router({
  // ============= SESSION CONTRACTS =============

  /** Generate a contract for a booking (auto-called on booking, or manually triggered) */
  generateContract: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      // Verify the user is either the talent or fan of this booking
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.talentId !== ctx.user.id && booking.fanId !== ctx.user.id) {
        throw new Error("Unauthorized: You are not part of this booking");
      }

      // Check if contract already exists
      const existing = await getContractByBookingId(input.bookingId);
      if (existing) return { contractId: existing.id, alreadyExists: true };

      const contractId = await generateSessionContract(input.bookingId);
      return { contractId, alreadyExists: false };
    }),

  /** Get contract for a booking */
  getContract: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.talentId !== ctx.user.id && booking.fanId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const contract = await getContractByBookingId(input.bookingId);
      if (!contract) return null;

      // Mark as viewed
      const viewerRole = ctx.user.id === booking.talentId ? "talent" : "fan";
      await markContractViewed(contract.id, viewerRole);

      return contract;
    }),

  /** Sign a contract */
  signContract: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signature: z.string().min(1, "Signature is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const contract = (await db.select().from(ologyLiveSessionContracts)
        .where(eq(ologyLiveSessionContracts.id, input.contractId)).limit(1))[0];

      if (!contract) throw new Error("Contract not found");

      let signerRole: "talent" | "fan";
      if (ctx.user.id === contract.talentId) {
        signerRole = "talent";
      } else if (ctx.user.id === contract.fanId) {
        signerRole = "fan";
      } else {
        throw new Error("Unauthorized: You are not a party to this contract");
      }

      await signContract(input.contractId, signerRole, input.signature);
      return { success: true, signerRole };
    }),

  /** Get all contracts for the current user (talent or fan) */
  getMyContracts: protectedProcedure
    .input(z.object({
      role: z.enum(["talent", "fan"]).optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const conditions = [];

      if (input?.role === "talent") {
        conditions.push(eq(ologyLiveSessionContracts.talentId, ctx.user.id));
      } else if (input?.role === "fan") {
        conditions.push(eq(ologyLiveSessionContracts.fanId, ctx.user.id));
      } else {
        // Show all contracts where user is either talent or fan
        conditions.push(
          sql`(${ologyLiveSessionContracts.talentId} = ${ctx.user.id} OR ${ologyLiveSessionContracts.fanId} = ${ctx.user.id})`
        );
      }

      if (input?.status) {
        conditions.push(eq(ologyLiveSessionContracts.status, input.status));
      }

      const contracts = await db.select().from(ologyLiveSessionContracts)
        .where(and(...conditions))
        .orderBy(desc(ologyLiveSessionContracts.createdAt))
        .limit(50);

      return contracts;
    }),

  // ============= REVIEWS =============

  /** Submit a review for a completed session */
  submitReview: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      rating: z.number().min(1).max(5),
      reviewText: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      // Verify booking exists and is completed
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.fanId !== ctx.user.id) throw new Error("Only the fan can submit a review");
      if (booking.status !== "completed") throw new Error("Can only review completed sessions");

      // Check if review already exists
      const existing = (await db.select().from(ologyLiveReviews)
        .where(eq(ologyLiveReviews.bookingId, input.bookingId)).limit(1))[0];
      if (existing) throw new Error("Review already submitted for this booking");

      const result = await db.insert(ologyLiveReviews).values({
        bookingId: input.bookingId,
        experienceId: booking.experienceId,
        talentId: booking.talentId,
        fanId: ctx.user.id,
        rating: input.rating,
        reviewText: input.reviewText || null,
      });

      // Update the booking to mark as reviewed
      await db.update(ologyLiveBookings)
        .set({ reviewedAt: new Date() })
        .where(eq(ologyLiveBookings.id, input.bookingId));

      return { reviewId: result[0].insertId };
    }),

  /** Talent responds to a review */
  respondToReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      response: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const review = (await db.select().from(ologyLiveReviews)
        .where(eq(ologyLiveReviews.id, input.reviewId)).limit(1))[0];

      if (!review) throw new Error("Review not found");
      if (review.talentId !== ctx.user.id) throw new Error("Only the talent can respond");
      if (review.talentResponse) throw new Error("Already responded to this review");

      await db.update(ologyLiveReviews)
        .set({ talentResponse: input.response, talentRespondedAt: new Date() })
        .where(eq(ologyLiveReviews.id, input.reviewId));

      return { success: true };
    }),

  /** Get reviews for an experience */
  getExperienceReviews: protectedProcedure
    .input(z.object({
      experienceId: z.number(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const reviews = await db.select({
        id: ologyLiveReviews.id,
        rating: ologyLiveReviews.rating,
        reviewText: ologyLiveReviews.reviewText,
        talentResponse: ologyLiveReviews.talentResponse,
        talentRespondedAt: ologyLiveReviews.talentRespondedAt,
        createdAt: ologyLiveReviews.createdAt,
        fanName: users.name,
      })
        .from(ologyLiveReviews)
        .leftJoin(users, eq(ologyLiveReviews.fanId, users.id))
        .where(and(
          eq(ologyLiveReviews.experienceId, input.experienceId),
          eq(ologyLiveReviews.isPublic, true)
        ))
        .orderBy(desc(ologyLiveReviews.createdAt))
        .limit(input.limit);

      return reviews;
    }),

  /** Get reviews for a talent (all their experiences) */
  getTalentReviews: protectedProcedure
    .input(z.object({
      talentId: z.number(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const reviews = await db.select({
        id: ologyLiveReviews.id,
        rating: ologyLiveReviews.rating,
        reviewText: ologyLiveReviews.reviewText,
        talentResponse: ologyLiveReviews.talentResponse,
        createdAt: ologyLiveReviews.createdAt,
        fanName: users.name,
        experienceTitle: ologyLiveExperiences.title,
      })
        .from(ologyLiveReviews)
        .leftJoin(users, eq(ologyLiveReviews.fanId, users.id))
        .leftJoin(ologyLiveExperiences, eq(ologyLiveReviews.experienceId, ologyLiveExperiences.id))
        .where(and(
          eq(ologyLiveReviews.talentId, input.talentId),
          eq(ologyLiveReviews.isPublic, true)
        ))
        .orderBy(desc(ologyLiveReviews.createdAt))
        .limit(input.limit);

      // Calculate average rating
      const avgResult = await db.select({
        avg: sql<string>`AVG(${ologyLiveReviews.rating})`,
        count: sql<number>`COUNT(*)`,
      })
        .from(ologyLiveReviews)
        .where(eq(ologyLiveReviews.talentId, input.talentId));

      return {
        reviews,
        averageRating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg) : 0,
        totalReviews: avgResult[0]?.count || 0,
      };
    }),

  // ============= EARNINGS & NIL TRACKING =============

  /** Record earnings after a completed session */
  recordEarnings: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.talentId !== ctx.user.id) throw new Error("Only talent can record earnings");

      // Check if earnings already recorded
      const existing = (await db.select().from(ologyLiveEarnings)
        .where(eq(ologyLiveEarnings.bookingId, input.bookingId)).limit(1))[0];
      if (existing) return { earningsId: existing.id, alreadyExists: true };

      const experience = (await db.select().from(ologyLiveExperiences)
        .where(eq(ologyLiveExperiences.id, booking.experienceId)).limit(1))[0];

      const grossAmount = parseFloat(booking.amount || "0");
      const platformFee = grossAmount * 0.15;
      const netAmount = grossAmount - platformFee;

      const result = await db.insert(ologyLiveEarnings).values({
        talentId: booking.talentId,
        bookingId: input.bookingId,
        experienceId: booking.experienceId,
        grossAmount: grossAmount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        netAmount: netAmount.toFixed(2),
        nilCategory: mapCategoryToNil(experience?.category || "other"),
        sessionDate: booking.scheduledAt || new Date(),
        sessionDuration: experience?.duration || 30,
        platform: experience?.platform || "other",
        payoutStatus: "pending",
      });

      return { earningsId: result[0].insertId, alreadyExists: false };
    }),

  /** Get earnings summary for a talent */
  getEarningsSummary: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const conditions = [eq(ologyLiveEarnings.talentId, ctx.user.id)];

      if (input?.startDate) {
        conditions.push(gte(ologyLiveEarnings.sessionDate, new Date(input.startDate)));
      }
      if (input?.endDate) {
        conditions.push(lte(ologyLiveEarnings.sessionDate, new Date(input.endDate)));
      }

      // Get totals
      const totals = await db.select({
        totalGross: sql<string>`COALESCE(SUM(${ologyLiveEarnings.grossAmount}), 0)`,
        totalFees: sql<string>`COALESCE(SUM(${ologyLiveEarnings.platformFee}), 0)`,
        totalNet: sql<string>`COALESCE(SUM(${ologyLiveEarnings.netAmount}), 0)`,
        totalSessions: sql<number>`COUNT(*)`,
      })
        .from(ologyLiveEarnings)
        .where(and(...conditions));

      // Get breakdown by category
      const byCategory = await db.select({
        category: ologyLiveEarnings.nilCategory,
        totalNet: sql<string>`SUM(${ologyLiveEarnings.netAmount})`,
        count: sql<number>`COUNT(*)`,
      })
        .from(ologyLiveEarnings)
        .where(and(...conditions))
        .groupBy(ologyLiveEarnings.nilCategory);

      // Get recent earnings
      const recent = await db.select().from(ologyLiveEarnings)
        .where(eq(ologyLiveEarnings.talentId, ctx.user.id))
        .orderBy(desc(ologyLiveEarnings.sessionDate))
        .limit(20);

      return {
        totals: {
          grossAmount: parseFloat(totals[0]?.totalGross || "0"),
          platformFees: parseFloat(totals[0]?.totalFees || "0"),
          netEarnings: parseFloat(totals[0]?.totalNet || "0"),
          totalSessions: totals[0]?.totalSessions || 0,
        },
        byCategory,
        recentEarnings: recent,
      };
    }),

  /** Get NIL earnings report for compliance/tax purposes */
  getNilReport: protectedProcedure
    .input(z.object({
      year: z.number().min(2024).max(2030),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const startDate = new Date(`${input.year}-01-01`);
      const endDate = new Date(`${input.year}-12-31`);

      const earnings = await db.select().from(ologyLiveEarnings)
        .where(and(
          eq(ologyLiveEarnings.talentId, ctx.user.id),
          gte(ologyLiveEarnings.sessionDate, startDate),
          lte(ologyLiveEarnings.sessionDate, endDate)
        ))
        .orderBy(desc(ologyLiveEarnings.sessionDate));

      // Monthly breakdown
      const monthlyBreakdown = await db.select({
        month: sql<string>`DATE_FORMAT(${ologyLiveEarnings.sessionDate}, '%Y-%m')`,
        totalGross: sql<string>`SUM(${ologyLiveEarnings.grossAmount})`,
        totalNet: sql<string>`SUM(${ologyLiveEarnings.netAmount})`,
        sessions: sql<number>`COUNT(*)`,
      })
        .from(ologyLiveEarnings)
        .where(and(
          eq(ologyLiveEarnings.talentId, ctx.user.id),
          gte(ologyLiveEarnings.sessionDate, startDate),
          lte(ologyLiveEarnings.sessionDate, endDate)
        ))
        .groupBy(sql`DATE_FORMAT(${ologyLiveEarnings.sessionDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${ologyLiveEarnings.sessionDate}, '%Y-%m')`);

      const totalGross = earnings.reduce((sum, e) => sum + parseFloat(e.grossAmount), 0);
      const totalNet = earnings.reduce((sum, e) => sum + parseFloat(e.netAmount), 0);

      return {
        year: input.year,
        totalGrossEarnings: totalGross,
        totalNetEarnings: totalNet,
        totalSessions: earnings.length,
        monthlyBreakdown,
        allTransactions: earnings,
        disclaimer: "This report is provided for informational purposes only. It is the athlete's responsibility to report all NIL income to their institution's compliance office and to file appropriate tax returns. Consult a tax professional for guidance.",
      };
    }),

  // ============= FAN MY SESSIONS =============

  /** Get fan's upcoming and past sessions */
  getMyFanSessions: protectedProcedure
    .input(z.object({
      status: z.enum(["upcoming", "past", "all"]).default("all"),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      await ensureOlogyLiveBookingsSchema(db);
      const conditions = [eq(ologyLiveBookings.fanId, ctx.user.id)];

      const now = new Date();
      if (input?.status === "upcoming") {
        conditions.push(gte(ologyLiveBookings.scheduledAt, now));
      } else if (input?.status === "past") {
        conditions.push(lte(ologyLiveBookings.scheduledAt, now));
      }

      const bookings = await db.select({
        id: ologyLiveBookings.id,
        experienceId: ologyLiveBookings.experienceId,
        status: ologyLiveBookings.status,
        scheduledAt: ologyLiveBookings.scheduledAt,
        amount: ologyLiveBookings.amount,
        joinLink: ologyLiveBookings.joinLink,
        notes: ologyLiveBookings.notes,
        reviewedAt: ologyLiveBookings.reviewedAt,
        createdAt: ologyLiveBookings.createdAt,
        experienceTitle: ologyLiveExperiences.title,
        experienceDuration: ologyLiveExperiences.duration,
        experiencePlatform: ologyLiveExperiences.platform,
        experienceCategory: ologyLiveExperiences.category,
        talentName: users.name,
      })
        .from(ologyLiveBookings)
        .leftJoin(ologyLiveExperiences, eq(ologyLiveBookings.experienceId, ologyLiveExperiences.id))
        .leftJoin(users, eq(ologyLiveBookings.talentId, users.id))
        .where(and(...conditions))
        .orderBy(desc(ologyLiveBookings.scheduledAt))
        .limit(50);

      return bookings;
    }),
  // ============= QUESTIONS (Submit in Advance) =============

  /** Fan submits a question for an upcoming session */
  submitQuestion: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      questionText: z.string().min(5, "Question must be at least 5 characters").max(500, "Question must be under 500 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      // Verify booking exists and belongs to this fan
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.fanId !== ctx.user.id) throw new Error("Only the booked fan can submit questions");
      if (booking.status === "cancelled") throw new Error("Cannot submit questions for cancelled sessions");

      // Limit to 5 questions per booking
      const existingQuestions = await db.select({ id: ologyLiveQuestions.id })
        .from(ologyLiveQuestions)
        .where(and(
          eq(ologyLiveQuestions.bookingId, input.bookingId),
          eq(ologyLiveQuestions.fanId, ctx.user.id)
        ));

      if (existingQuestions.length >= 5) {
        throw new Error("Maximum 5 questions per session");
      }

      const result = await db.insert(ologyLiveQuestions).values({
        bookingId: input.bookingId,
        experienceId: booking.experienceId,
        fanId: ctx.user.id,
        talentId: booking.talentId,
        questionText: input.questionText,
        status: "pending",
      });

      return { questionId: result[0].insertId };
    }),

  /** Get questions for a booking (fan sees their own, talent sees all for their session) */
  getQuestions: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const booking = (await db.select().from(ologyLiveBookings)
        .where(eq(ologyLiveBookings.id, input.bookingId)).limit(1))[0];

      if (!booking) throw new Error("Booking not found");
      if (booking.fanId !== ctx.user.id && booking.talentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const questions = await db.select({
        id: ologyLiveQuestions.id,
        questionText: ologyLiveQuestions.questionText,
        status: ologyLiveQuestions.status,
        answeredAt: ologyLiveQuestions.answeredAt,
        createdAt: ologyLiveQuestions.createdAt,
        fanName: users.name,
      })
        .from(ologyLiveQuestions)
        .leftJoin(users, eq(ologyLiveQuestions.fanId, users.id))
        .where(eq(ologyLiveQuestions.bookingId, input.bookingId))
        .orderBy(desc(ologyLiveQuestions.createdAt));

      return questions;
    }),

  /** Get all questions for a talent's upcoming sessions */
  getTalentQuestions: protectedProcedure
    .input(z.object({
      experienceId: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const conditions = [
        eq(ologyLiveQuestions.talentId, ctx.user.id),
        eq(ologyLiveQuestions.status, "pending"),
      ];

      if (input?.experienceId) {
        conditions.push(eq(ologyLiveQuestions.experienceId, input.experienceId));
      }

      const questions = await db.select({
        id: ologyLiveQuestions.id,
        questionText: ologyLiveQuestions.questionText,
        status: ologyLiveQuestions.status,
        createdAt: ologyLiveQuestions.createdAt,
        fanName: users.name,
        experienceTitle: ologyLiveExperiences.title,
        bookingId: ologyLiveQuestions.bookingId,
      })
        .from(ologyLiveQuestions)
        .leftJoin(users, eq(ologyLiveQuestions.fanId, users.id))
        .leftJoin(ologyLiveExperiences, eq(ologyLiveQuestions.experienceId, ologyLiveExperiences.id))
        .where(and(...conditions))
        .orderBy(desc(ologyLiveQuestions.createdAt))
        .limit(50);

      return questions;
    }),

  /** Talent marks a question as answered */
  markQuestionAnswered: protectedProcedure
    .input(z.object({
      questionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const question = (await db.select().from(ologyLiveQuestions)
        .where(eq(ologyLiveQuestions.id, input.questionId)).limit(1))[0];

      if (!question) throw new Error("Question not found");
      if (question.talentId !== ctx.user.id) throw new Error("Only the talent can mark questions");

      await db.update(ologyLiveQuestions)
        .set({ status: "answered", answeredAt: new Date() })
        .where(eq(ologyLiveQuestions.id, input.questionId));

      return { success: true };
    }),

  /** Fan deletes their own question */
  deleteQuestion: protectedProcedure
    .input(z.object({
      questionId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const question = (await db.select().from(ologyLiveQuestions)
        .where(eq(ologyLiveQuestions.id, input.questionId)).limit(1))[0];

      if (!question) throw new Error("Question not found");
      if (question.fanId !== ctx.user.id) throw new Error("Only the question author can delete it");

      await db.delete(ologyLiveQuestions)
        .where(eq(ologyLiveQuestions.id, input.questionId));

      return { success: true };
    }),
});

function mapCategoryToNil(category: string): string {
  const mapping: Record<string, string> = {
    gaming: "gaming_session",
    music: "virtual_performance",
    fitness: "fitness_session",
    qa: "qa_session",
    workshop: "workshop",
    cooking: "lifestyle_session",
    education: "educational_session",
    other: "virtual_appearance",
  };
  return mapping[category] || "virtual_appearance";
}
