/**
 * Promote Router — AI Ad Assistant + Boost My Event
 * Option A: AI-powered ad copy, hashtags, targeting, and budget calculator
 * Option B: Managed ad service intake form with Stripe payment
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { promotionRequests } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Helper: artist-only guard
const artistProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Artist access required' });
  }
  return next({ ctx });
});

export const promoteRouter = router({
  /**
   * Option A: AI Ad Copy Generator
   * Generates platform-specific ad copy, hashtags, targeting suggestions
   */
  generateAdCopy: artistProcedure
    .input(z.object({
      type: z.enum(["event", "release", "profile"]),
      name: z.string().min(1),
      description: z.string().optional(),
      genre: z.string().optional(),
      location: z.string().optional(),
      date: z.string().optional(),
      platform: z.enum(["instagram", "facebook", "tiktok", "youtube", "twitter"]),
      tone: z.enum(["hype", "professional", "casual", "urgent"]).default("hype"),
    }))
    .mutation(async ({ input }) => {
      const { type, name, description, genre, location, date, platform, tone } = input;

      const platformGuides: Record<string, string> = {
        instagram: "Instagram: Keep captions under 2200 chars. Use 5-10 relevant hashtags. Include a call-to-action. Suggest Story format (vertical 9:16) and Feed post (square 1:1).",
        facebook: "Facebook: Write a compelling post under 500 chars for best engagement. Include a clear CTA button suggestion. No hashtag overload (2-3 max).",
        tiktok: "TikTok: Write a hook-first caption under 150 chars. Suggest trending sounds/concepts. Use 3-5 hashtags including niche ones. Suggest video concept.",
        youtube: "YouTube: Write a click-worthy title (under 60 chars), description (first 2 lines are crucial), and 5-8 tags. Suggest thumbnail concept.",
        twitter: "X/Twitter: Write a punchy tweet under 280 chars. Include 1-2 hashtags max. Suggest a thread structure if needed.",
      };

      const toneGuides: Record<string, string> = {
        hype: "Energetic, exciting, use emojis sparingly, create FOMO",
        professional: "Clean, polished, industry-standard language",
        casual: "Conversational, relatable, like talking to a friend",
        urgent: "Time-sensitive, limited availability, act now energy",
      };

      const systemPrompt = `You are an expert social media ad copywriter for the entertainment industry. You specialize in promoting artists, athletes, and creators. Generate ad copy that converts.

RULES:
- Be specific and actionable
- Include relevant emojis (sparingly)
- Never use generic filler text
- Always include a clear call-to-action
- Tailor everything to the specific platform

Output format (JSON):
{
  "headline": "Short attention-grabbing headline",
  "primaryCopy": "Main ad copy text optimized for the platform",
  "hashtags": ["relevant", "hashtags", "here"],
  "callToAction": "Specific CTA text",
  "targetingTips": {
    "age": "Suggested age range",
    "interests": ["list", "of", "interests"],
    "locations": "Geographic targeting suggestion"
  },
  "creativeDirection": "Brief description of what the visual/creative should look like",
  "alternateVersions": ["A shorter version", "A different angle version"]
}`;

      const userPrompt = `Generate ${platform} ad copy for promoting ${type === "event" ? "an event" : type === "release" ? "a music release" : "an artist profile"}.

Details:
- Name: ${name}
${description ? `- Description: ${description}` : ""}
${genre ? `- Genre/Category: ${genre}` : ""}
${location ? `- Location: ${location}` : ""}
${date ? `- Date: ${date}` : ""}
- Tone: ${toneGuides[tone]}

Platform guidelines: ${platformGuides[platform]}

Generate compelling, ready-to-use ad copy.`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ad_copy",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  primaryCopy: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                  callToAction: { type: "string" },
                  targetingTips: {
                    type: "object",
                    properties: {
                      age: { type: "string" },
                      interests: { type: "array", items: { type: "string" } },
                      locations: { type: "string" },
                    },
                    required: ["age", "interests", "locations"],
                    additionalProperties: false,
                  },
                  creativeDirection: { type: "string" },
                  alternateVersions: { type: "array", items: { type: "string" } },
                },
                required: ["headline", "primaryCopy", "hashtags", "callToAction", "targetingTips", "creativeDirection", "alternateVersions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = result.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error("No content returned from LLM");
        }
        return JSON.parse(content);
      } catch (error: any) {
        console.error("[Promote] AI generation error:", error.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate ad copy. Please try again.",
        });
      }
    }),

  /**
   * Ad Budget Calculator
   * Estimates reach based on budget, platform, and location
   */
  calculateBudget: artistProcedure
    .input(z.object({
      dailyBudget: z.number().min(5).max(1000), // $5-$1000/day
      days: z.number().min(1).max(90),
      platform: z.enum(["instagram", "facebook", "tiktok", "youtube", "twitter"]),
      location: z.string().optional(),
    }))
    .query(({ input }) => {
      const { dailyBudget, days, platform, location } = input;
      const totalBudget = dailyBudget * days;

      // CPM estimates by platform (cost per 1000 impressions)
      const cpmRanges: Record<string, { low: number; high: number }> = {
        instagram: { low: 5, high: 12 },
        facebook: { low: 4, high: 10 },
        tiktok: { low: 3, high: 8 },
        youtube: { low: 6, high: 15 },
        twitter: { low: 4, high: 9 },
      };

      const cpm = cpmRanges[platform];
      const estimatedImpressions = {
        low: Math.round((totalBudget / cpm.high) * 1000),
        high: Math.round((totalBudget / cpm.low) * 1000),
      };

      // Engagement rate estimates
      const engagementRates: Record<string, number> = {
        instagram: 0.035,
        facebook: 0.02,
        tiktok: 0.05,
        youtube: 0.04,
        twitter: 0.015,
      };

      const engagementRate = engagementRates[platform];
      const estimatedEngagements = {
        low: Math.round(estimatedImpressions.low * engagementRate),
        high: Math.round(estimatedImpressions.high * engagementRate),
      };

      return {
        totalBudget,
        dailyBudget,
        days,
        platform,
        location: location || "Nationwide",
        estimatedReach: estimatedImpressions,
        estimatedEngagements,
        costPerEngagement: {
          low: +(totalBudget / estimatedEngagements.high).toFixed(2),
          high: +(totalBudget / estimatedEngagements.low).toFixed(2),
        },
        recommendation: totalBudget < 100
          ? "Consider increasing your budget for better results. $100+ campaigns typically see 3x better ROI."
          : totalBudget < 500
          ? "Good starting budget. Focus on one platform for maximum impact."
          : "Strong budget. Consider A/B testing different creatives to optimize performance.",
      };
    }),

  /**
   * Option B: Submit a "Boost My Event" managed service request
   */
  submitBoostRequest: artistProcedure
    .input(z.object({
      type: z.enum(["event", "release", "profile"]),
      targetId: z.number().optional(),
      targetName: z.string().min(1),
      budget: z.number().min(5000), // minimum $50 in cents
      goals: z.string().min(10),
      targetAudience: z.string().optional(),
      platforms: z.array(z.string()).min(1),
      timeline: z.string().optional(),
      additionalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Create Stripe payment intent for the service fee (budget amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: input.budget,
        currency: "usd",
        metadata: {
          type: "promotion_request",
          artistUserId: ctx.user.id.toString(),
          promotionType: input.type,
          targetName: input.targetName,
        },
      });

      // Insert the promotion request
      const [result] = await database.insert(promotionRequests).values({
        artistUserId: ctx.user.id,
        type: input.type,
        targetId: input.targetId || null,
        targetName: input.targetName,
        budget: input.budget,
        goals: input.goals,
        targetAudience: input.targetAudience || null,
        platforms: input.platforms,
        timeline: input.timeline || null,
        additionalNotes: input.additionalNotes || null,
        status: "submitted",
        stripePaymentIntentId: paymentIntent.id,
      });

      return {
        requestId: result.insertId,
        clientSecret: paymentIntent.client_secret,
        amount: input.budget,
      };
    }),

  /**
   * Get my promotion requests (artist view)
   */
  getMyRequests: artistProcedure.query(async ({ ctx }) => {
    const database = await db.getDb();
    if (!database) return [];

    const requests = await database
      .select()
      .from(promotionRequests)
      .where(eq(promotionRequests.artistUserId, ctx.user.id))
      .orderBy(desc(promotionRequests.createdAt));

    return requests;
  }),

  /**
   * Get all promotion requests (admin view)
   */
  getAllRequests: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const database = await db.getDb();
    if (!database) return [];

    const requests = await database
      .select()
      .from(promotionRequests)
      .orderBy(desc(promotionRequests.createdAt));

    return requests;
  }),

  /**
   * Update promotion request status (admin)
   */
  updateRequestStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      status: z.enum(["in_review", "in_progress", "completed", "cancelled"]),
      adminNotes: z.string().optional(),
      reportUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updates: Record<string, any> = { status: input.status };
      if (input.adminNotes) updates.adminNotes = input.adminNotes;
      if (input.reportUrl) updates.reportUrl = input.reportUrl;
      if (input.status === "completed") updates.completedAt = new Date();

      await database
        .update(promotionRequests)
        .set(updates)
        .where(eq(promotionRequests.id, input.requestId));

      return { success: true };
    }),

  /** Edit a pending boost request (only if status is 'submitted') */
  editBoostRequest: artistProcedure
    .input(z.object({
      requestId: z.number(),
      budget: z.number().min(5000).optional(),
      goals: z.string().min(10).optional(),
      targetAudience: z.string().optional(),
      timeline: z.string().optional(),
      additionalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify the request belongs to this user and is still editable
      const [request] = await database
        .select()
        .from(promotionRequests)
        .where(eq(promotionRequests.id, input.requestId));

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.artistUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not your request" });
      if (request.status !== "submitted") throw new TRPCError({ code: "BAD_REQUEST", message: "Can only edit pending requests" });

      const updates: Record<string, any> = {};
      if (input.budget !== undefined) updates.budget = input.budget;
      if (input.goals !== undefined) updates.goals = input.goals;
      if (input.targetAudience !== undefined) updates.targetAudience = input.targetAudience;
      if (input.timeline !== undefined) updates.timeline = input.timeline;
      if (input.additionalNotes !== undefined) updates.additionalNotes = input.additionalNotes;

      if (Object.keys(updates).length > 0) {
        await database
          .update(promotionRequests)
          .set(updates)
          .where(eq(promotionRequests.id, input.requestId));
      }

      return { success: true };
    }),
});
