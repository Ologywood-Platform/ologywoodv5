/**
 * Support Tickets Router
 * Handles FAQ suggestions and support ticket related queries
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { faqs } from "../../drizzle/schema";
import { eq, like, and, or } from "drizzle-orm";

export const supportTicketsRouter = router({
  /**
   * Get FAQ suggestions based on category and description
   * Used for intelligent FAQ recommendations when creating support tickets
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        description: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            shouldSuggestFAQ: false,
            suggestions: [],
            error: "Database not available",
          };
        }

        // Extract keywords from description for better matching
        const keywords = input.description
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 3)
          .slice(0, 5); // Limit to first 5 keywords

        // Build search conditions
        const conditions = [];

        // If category is provided, filter by category
        if (input.category) {
          conditions.push(eq(faqs.category, input.category));
        }

        // Only show published FAQs
        conditions.push(eq(faqs.isPublished, true));

        // Search in question, answer, and keywords
        const searchConditions = keywords.map((keyword) =>
          or(
            like(faqs.question, `%${keyword}%`),
            like(faqs.answer, `%${keyword}%`),
            like(faqs.keywords, `%${keyword}%`),
            like(faqs.searchContent, `%${keyword}%`)
          )
        );

        // Combine all conditions
        const finalCondition =
          conditions.length > 0
            ? and(...conditions, or(...searchConditions))
            : or(...searchConditions);

        // Query FAQs with relevance scoring
        const suggestions = await db
          .select({
            id: faqs.id,
            question: faqs.question,
            answer: faqs.answer,
            category: faqs.category,
            views: faqs.views,
            helpfulRatio: faqs.helpfulRatio,
          })
          .from(faqs)
          .where(finalCondition)
          .orderBy(faqs.helpfulRatio) // Sort by helpfulness
          .limit(5);

        return {
          shouldSuggestFAQ: suggestions.length > 0,
          suggestions: suggestions,
          relatedArticles: suggestions.map((faq) => ({
            id: faq.id,
            title: faq.question,
            content: faq.answer,
            category: faq.category,
          })),
          count: suggestions.length,
        };
      } catch (error) {
        console.error("[Support Tickets] Error getting FAQ suggestions:", error);
        return {
          shouldSuggestFAQ: false,
          suggestions: [],
          error:
            error instanceof Error ? error.message : "Failed to get suggestions",
        };
      }
    }),

  /**
   * Get all FAQs by category
   * Used for browsing FAQs by topic
   */
  getFAQsByCategory: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { faqs: [], total: 0 };

        const results = await db
          .select()
          .from(faqs)
          .where(
            and(
              eq(faqs.category, input.category),
              eq(faqs.isPublished, true)
            )
          )
          .limit(input.limit)
          .offset(input.offset);

        return {
          faqs: results,
          total: results.length,
        };
      } catch (error) {
        console.error("[Support Tickets] Error getting FAQs by category:", error);
        return { faqs: [], total: 0 };
      }
    }),

  /**
   * Search FAQs with full-text search
   * Used for FAQ search functionality
   */
  searchFAQs: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { results: [] };

        const searchTerm = `%${input.query}%`;

        const results = await db
          .select()
          .from(faqs)
          .where(
            and(
              eq(faqs.isPublished, true),
              or(
                like(faqs.question, searchTerm),
                like(faqs.answer, searchTerm),
                like(faqs.keywords, searchTerm)
              )
            )
          )
          .limit(input.limit);

        return { results };
      } catch (error) {
        console.error("[Support Tickets] Error searching FAQs:", error);
        return { results: [] };
      }
    }),

  /**
   * Mark FAQ as helpful
   * Used to track FAQ usefulness
   */
  markFAQAsHelpful: protectedProcedure
    .input(
      z.object({
        faqId: z.number(),
        helpful: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const faq = await db
          .select()
          .from(faqs)
          .where(eq(faqs.id, input.faqId))
          .limit(1);

        if (!faq || faq.length === 0) {
          throw new Error("FAQ not found");
        }

        const currentFAQ = faq[0];
        const newHelpful = input.helpful
          ? (currentFAQ.helpful || 0) + 1
          : currentFAQ.helpful || 0;
        const newNotHelpful = !input.helpful
          ? (currentFAQ.notHelpful || 0) + 1
          : currentFAQ.notHelpful || 0;

        // Calculate helpful ratio
        const total = newHelpful + newNotHelpful;
        const helpfulRatio = total > 0 ? (newHelpful / total) * 100 : 0;

        await db
          .update(faqs)
          .set({
            helpful: newHelpful,
            notHelpful: newNotHelpful,
            helpfulRatio: helpfulRatio as any,
            updatedAt: new Date(),
          })
          .where(eq(faqs.id, input.faqId));

        return {
          success: true,
          helpful: newHelpful,
          notHelpful: newNotHelpful,
          helpfulRatio: parseFloat(helpfulRatio.toFixed(2)),
        };
      } catch (error) {
        console.error("[Support Tickets] Error marking FAQ as helpful:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to update FAQ"
        );
      }
    }),

  /**
   * Increment FAQ view count
   * Used to track FAQ popularity
   */
  incrementFAQViews: protectedProcedure
    .input(z.object({ faqId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const faq = await db
          .select()
          .from(faqs)
          .where(eq(faqs.id, input.faqId))
          .limit(1);

        if (!faq || faq.length === 0) {
          throw new Error("FAQ not found");
        }

        const newViews = (faq[0].views || 0) + 1;

        await db
          .update(faqs)
          .set({
            views: newViews,
            updatedAt: new Date(),
          })
          .where(eq(faqs.id, input.faqId));

        return { success: true, views: newViews };
      } catch (error) {
        console.error("[Support Tickets] Error incrementing FAQ views:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to update FAQ views"
        );
      }
    }),

  /**
   * Get trending FAQs
   * Used for displaying popular FAQs on dashboard
   */
  getTrendingFAQs: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { faqs: [] };

        const results = await db
          .select({
            id: faqs.id,
            question: faqs.question,
            category: faqs.category,
            views: faqs.views,
            helpfulRatio: faqs.helpfulRatio,
          })
          .from(faqs)
          .where(eq(faqs.isPublished, true))
          .orderBy(faqs.views)
          .limit(input.limit);

        return { faqs: results };
      } catch (error) {
        console.error("[Support Tickets] Error getting trending FAQs:", error);
        return { faqs: [] };
      }
    }),
});
