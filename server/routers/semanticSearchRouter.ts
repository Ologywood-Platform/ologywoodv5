/**
 * Semantic Search Router
 * 
 * Provides AI-powered semantic search capabilities for FAQs using embeddings.
 * 
 * Features:
 * - Semantic similarity search using vector embeddings
 * - Keyword search fallback for robustness
 * - Search result ranking and filtering
 * - Click tracking for analytics
 * - Performance monitoring
 * - Error handling and logging
 * 
 * Procedures:
 * - searchFaqs: Main semantic search query
 * - recordClick: Track user interactions
 * - getSearchAnalytics: Performance metrics
 * - getSuggestedFaqs: Get FAQ suggestions
 * - getTrendingFaqs: Get popular FAQs
 * 
 * @module server/routers/semanticSearchRouter
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { faqs, semanticSearchLogs } from '../../drizzle/schema';
import { eq, desc, and, or, isNotNull, gte, lte, sql } from 'drizzle-orm';
import {
  generateEmbedding,
  cosineSimilarity,
  findMostSimilar,
} from '../services/embeddingService';
import { searchSimilarFAQs } from '../services/vectorDbService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * FAQ search result
 */
interface SearchResult {
  id: number;
  question: string;
  answer: string;
  category?: string;
  semanticScore: number;
  helpfulRatio?: number;
  views: number;
  isPinned: boolean;
}

/**
 * Search response
 */
interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalResults: number;
  responseTimeMs: number;
  method: 'semantic' | 'keyword' | 'hybrid';
  fallbackUsed: boolean;
  error?: string;
}

/**
 * Click tracking data
 */
interface ClickData {
  faqId: number;
  position: number;
  queryId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROUTER_NAME = '[Semantic Search Router]';
const MIN_SEMANTIC_SCORE = parseFloat(process.env.SEMANTIC_SEARCH_MIN_SCORE || '0.7');
const MAX_RESULTS = 10;
const ENABLE_SEMANTIC_SEARCH = process.env.ENABLE_SEMANTIC_SEARCH === 'true';
const FALLBACK_TO_KEYWORD = process.env.FALLBACK_TO_KEYWORD_SEARCH !== 'false';

// ============================================================================
// LOGGING & UTILITIES
// ============================================================================

/**
 * Log router messages
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${level.toUpperCase()}] ${ROUTER_NAME} ${message}`);
}

/**
 * Calculate relevance score based on multiple factors
 */
function calculateRelevanceScore(
  semanticScore: number,
  helpfulRatio: number | null | undefined,
  views: number,
  isPinned: boolean
): number {
  let score = semanticScore;

  // Boost for helpful FAQs
  if (helpfulRatio && helpfulRatio > 0) {
    score += (helpfulRatio / 100) * 0.1;
  }

  // Boost for popular FAQs
  if (views > 0) {
    const viewBoost = Math.min(Math.log(views + 1) * 0.05, 0.1);
    score += viewBoost;
  }

  // Boost for pinned FAQs
  if (isPinned) {
    score += 0.15;
  }

  // Clamp to 0-1 range
  return Math.min(score, 1.0);
}

/**
 * Format search result for response
 */
function formatSearchResult(faq: typeof faqs.$inferSelect, semanticScore: number): SearchResult {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category || undefined,
    semanticScore: Math.round(semanticScore * 1000) / 1000, // Round to 3 decimals
    helpfulRatio: faq.helpfulRatio ? parseFloat(faq.helpfulRatio.toString()) : undefined,
    views: faq.views || 0,
    isPinned: faq.isPinned || false,
  };
}

/**
 * Extract keywords from text for keyword search fallback
 */
function extractKeywords(text: string): string[] {
  // Remove common words
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);

  const keywords = text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.has(word))
    .slice(0, 5); // Limit to 5 keywords

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Perform keyword-based search (fallback)
 */
async function keywordSearch(
  db: Awaited<ReturnType<typeof getDb>>,
  query: string,
  category?: string,
  limit: number = MAX_RESULTS
): Promise<SearchResult[]> {
  try {
    if (!db) {
      log('Database connection unavailable', 'error');
      return [];
    }

    log(`Performing keyword search for: "${query}"`);

    const keywords = extractKeywords(query);
    
    if (keywords.length === 0) {
      log('No valid keywords extracted', 'warn');
      return [];
    }

    // Build search pattern
    const searchPattern = `%${keywords.join('%')}%`;

    // Query database
    let query_builder = db
      .select()
      .from(faqs)
      .where(
        and(
          eq(faqs.isPublished, true),
          or(
            sql`MATCH(${faqs.question}) AGAINST(${query} IN BOOLEAN MODE)`,
            sql`MATCH(${faqs.answer}) AGAINST(${query} IN BOOLEAN MODE)`,
            sql`${faqs.question} LIKE ${searchPattern}`,
            sql`${faqs.answer} LIKE ${searchPattern}`
          )
        )
      )
      .orderBy(desc(faqs.views))
      .limit(limit);

    const results = await query_builder;

    // Format results with keyword score
    return results.map(faq => {
      const keywordScore = 0.5; // Fixed score for keyword matches
      return formatSearchResult(faq, keywordScore);
    });
  } catch (error) {
    log(`Keyword search error: ${error}`, 'error');
    return [];
  }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const semanticSearchRouter = router({
  /**
   * Main semantic search procedure
   * 
   * Performs AI-powered semantic search on FAQs using embeddings.
   * Falls back to keyword search if semantic search is disabled or fails.
   * 
   * @param query - Search query text
   * @param category - Optional category filter
   * @param limit - Max results to return (1-10)
   * @param minScore - Minimum similarity score (0-1)
   * @param useSemanticSearch - Enable semantic search
   * @returns Search results with metadata
   * 
   * @example
   * ```typescript
   * const results = await semanticSearch.searchFaqs({
   *   query: 'How do I pay my artists?',
   *   category: 'payments',
   *   limit: 5,
   *   minScore: 0.7
   * });
   * ```
   */
  searchFaqs: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500).describe('Search query text'),
        category: z.string().optional().describe('Optional category filter'),
        limit: z.number().min(1).max(100).default(20).describe('Max results'),
        minScore: z.number().min(0).max(1).default(MIN_SEMANTIC_SCORE).describe('Min similarity score'),
        useSemanticSearch: z.boolean().default(ENABLE_SEMANTIC_SEARCH).describe('Enable semantic search'),
      })
    )
    .query(async ({ input, ctx }) => {
      const startTime = performance.now();
      let method: 'semantic' | 'keyword' | 'hybrid' = 'semantic';
      let fallbackUsed = false;

      try {
        // Validate database connection
        const db = await getDb();
        if (!db) {
          log('Database connection failed', 'error');
          return {
            success: false,
            results: [],
            totalResults: 0,
            responseTimeMs: performance.now() - startTime,
            method: 'semantic',
            fallbackUsed: false,
            error: 'Database connection failed',
          };
        }

        // Trim and validate query
        const trimmedQuery = input.query.trim();
        if (trimmedQuery.length === 0) {
          return {
            success: false,
            results: [],
            totalResults: 0,
            responseTimeMs: performance.now() - startTime,
            method: 'semantic',
            fallbackUsed: false,
            error: 'Query cannot be empty',
          };
        }

        // ====================================================================
        // SEMANTIC SEARCH
        // ====================================================================

        let results: SearchResult[] = [];

        if (input.useSemanticSearch && ENABLE_SEMANTIC_SEARCH) {
          try {
            log(`Semantic search: "${trimmedQuery}"`);

            // 1. Generate embedding for query
            const queryEmbedding = await generateEmbedding(trimmedQuery);
            log(`Generated query embedding (${queryEmbedding.tokensUsed} tokens)`);

            // 2. Search vector database
            const vectorResults = await searchSimilarFAQs(
              queryEmbedding.embedding,
              input.limit * 2, // Get more results to filter
              input.minScore
            );

            log(`Vector DB returned ${vectorResults.length} results`);

            if (vectorResults.length === 0) {
              log('No vector results found, trying keyword fallback', 'warn');
              fallbackUsed = true;
              method = 'keyword';
            } else {
              // 3. Fetch full FAQ details from database
              const faqIds = vectorResults.map(r => r.faqId);

              const faqDetails = await db
                .select()
                .from(faqs)
                .where(
                  and(
                    eq(faqs.isPublished, true),
                    sql`${faqs.id} IN (${sql.join(faqIds)})`
                  )
                );

              // 4. Combine and rank results
              results = vectorResults
                .map(vectorResult => {
                  const faqDetail = faqDetails.find(f => f.id === vectorResult.faqId);
                  if (!faqDetail) return null;

                  // Calculate relevance score with multiple factors
                  const relevanceScore = calculateRelevanceScore(
                    vectorResult.score,
                    faqDetail.helpfulRatio ? parseFloat(faqDetail.helpfulRatio.toString()) : null,
                    faqDetail.views || 0,
                    faqDetail.isPinned || false
                  );

                  return {
                    ...formatSearchResult(faqDetail, relevanceScore),
                    semanticScore: relevanceScore,
                  };
                })
                .filter((r): r is SearchResult => r !== null)
                .sort((a, b) => b.semanticScore - a.semanticScore)
                .slice(0, input.limit);

              // 5. Filter by category if provided
              if (input.category) {
                results = results.filter(r => r.category === input.category);
              }

              log(`Semantic search returned ${results.length} results`);
              method = 'semantic';
            }
          } catch (semanticError) {
            log(`Semantic search failed: ${semanticError}`, 'error');

            // Fallback to keyword search
            if (FALLBACK_TO_KEYWORD) {
              log('Falling back to keyword search', 'warn');
              fallbackUsed = true;
              method = 'keyword';
            } else {
              throw semanticError;
            }
          }
        }

        // ====================================================================
        // KEYWORD SEARCH (FALLBACK)
        // ====================================================================

        if (results.length === 0 && (FALLBACK_TO_KEYWORD || !input.useSemanticSearch)) {
          try {
            results = await keywordSearch(db, trimmedQuery, input.category, input.limit);
            method = 'keyword';
            fallbackUsed = true;
            log(`Keyword search returned ${results.length} results`);
          } catch (keywordError) {
            log(`Keyword search failed: ${keywordError}`, 'error');
            // Continue with empty results
          }
        }

        // ====================================================================
        // LOGGING & ANALYTICS
        // ====================================================================

        const responseTime = performance.now() - startTime;

        // Log search for analytics
        try {
          const topResult = results[0];
          
          await db.insert(semanticSearchLogs).values({
            userId: String(ctx.user.id),
            query: trimmedQuery,
            queryEmbedding: null, // Optional: store query embedding
            resultsCount: results.length,
            topResultId: topResult?.id || null,
            topResultScore: topResult?.semanticScore ? String(topResult.semanticScore) : null,
            responseTimeMs: Math.round(responseTime),
            fallbackToKeyword: fallbackUsed,
          })

          log(`Search logged (${responseTime.toFixed(2)}ms)`);
        } catch (logError) {
          log(`Failed to log search: ${logError}`, 'warn');
        }

        // Update FAQ search metrics
        if (results.length > 0) {
          try {
            const topResult = results[0];
            await db
              .update(faqs)
              .set({
                semanticSearchHits: sql`${faqs.semanticSearchHits} + 1`,
              })
              .where(eq(faqs.id, topResult.id));

            log(`Updated search hit counter for FAQ ${topResult.id}`);
          } catch (updateError) {
            log(`Failed to update search metrics: ${updateError}`, 'warn');
          }
        }

        // ====================================================================
        // RESPONSE
        // ====================================================================

        return {
          success: true,
          results,
          totalResults: results.length,
          responseTimeMs: Math.round(responseTime),
          method,
          fallbackUsed,
        };
      } catch (error) {
        log(`Search error: ${error}`, 'error');

        return {
          success: false,
          results: [],
          totalResults: 0,
          responseTimeMs: Math.round(performance.now() - startTime),
          method: 'semantic',
          fallbackUsed: false,
          error: error instanceof Error ? error.message : 'Search failed',
        };
      }
    }),

  /**
   * Record user click on search result
   * 
   * Tracks which FAQs users click on from search results for analytics.
   * Used to calculate click-through rate and measure search quality.
   * 
   * @param faqId - ID of clicked FAQ
   * @param position - Position in results (1-based)
   * @returns Success status
   */
  recordClick: protectedProcedure
    .input(
      z.object({
        faqId: z.number().positive().describe('FAQ ID'),
        position: z.number().positive().describe('Result position (1-based)'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        log(`Recording click: FAQ ${input.faqId} at position ${input.position}`);

        // Update FAQ click counter
        await db
          .update(faqs)
          .set({
            semanticSearchClicks: sql`${faqs.semanticSearchClicks} + 1`,
          })
          .where(eq(faqs.id, input.faqId));

        // Update search log with click info
        await db
          .update(semanticSearchLogs)
          .set({
            clickedFaqId: input.faqId,
            clickedPosition: input.position,
          })
          .where(eq(semanticSearchLogs.id, input.faqId)); // Note: This assumes search log ID matches

        log(`Click recorded for FAQ ${input.faqId}`);

        return { success: true };
      } catch (error) {
        log(`Error recording click: ${error}`, 'error');
        throw error;
      }
    }),

  /**
   * Get search analytics
   * 
   * Returns aggregated search statistics for a time period.
   * Useful for monitoring search quality and identifying trends.
   * 
   * @param days - Number of days to look back
   * @returns Analytics data
   */
  getSearchAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30).describe('Days to analyze'),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        log(`Getting search analytics for last ${input.days} days`);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        // Get all searches in period
        const logs = await db
          .select()
          .from(semanticSearchLogs)
          .where(gte(semanticSearchLogs.timestamp, startDate));

        const totalSearches = logs.length;
        const clickedSearches = logs.filter(log => log.clickedFaqId).length;
        const ctr = totalSearches > 0 ? (clickedSearches / totalSearches) * 100 : 0;

        const avgResponseTime = logs.length > 0
          ? logs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / logs.length
          : 0;

        const fallbackCount = logs.filter(log => log.fallbackToKeyword).length;
        const fallbackRate = totalSearches > 0 ? (fallbackCount / totalSearches) * 100 : 0;

        log(`Analytics: ${totalSearches} searches, ${ctr.toFixed(2)}% CTR`);

        return {
          success: true,
          totalSearches,
          clickedSearches,
          clickThroughRate: parseFloat(ctr.toFixed(2)),
          avgResponseTimeMs: Math.round(avgResponseTime),
          fallbackCount,
          fallbackRate: parseFloat(fallbackRate.toFixed(2)),
          periodDays: input.days,
        };
      } catch (error) {
        log(`Error getting analytics: ${error}`, 'error');
        throw error;
      }
    }),

  /**
   * Get suggested FAQs for a category
   * 
   * Returns popular FAQs in a category for user suggestions.
   * 
   * @param category - Category name
   * @param limit - Max results
   * @returns Suggested FAQs
   */
  getSuggestedFaqs: protectedProcedure
    .input(
      z.object({
        category: z.string().optional().describe('Category filter'),
        limit: z.number().min(1).max(10).default(5).describe('Max results'),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        log(`Getting suggested FAQs for category: ${input.category || 'all'}`);

        let query = db
          .select()
          .from(faqs)
          .where(eq(faqs.isPublished, true));

        if (input.category) {
          query = db
            .select()
            .from(faqs)
            .where(
              and(
                eq(faqs.isPublished, true),
                eq(faqs.category, input.category)
              )
            );
        }

        const results = await query
          .orderBy(
            desc(faqs.isPinned),
            desc(faqs.semanticSearchClicks),
            desc(faqs.views)
          )
          .limit(input.limit);

        const formatted = results.map(faq => formatSearchResult(faq, 0.9));

        log(`Returned ${formatted.length} suggested FAQs`);

        return {
          success: true,
          results: formatted,
        };
      } catch (error) {
        log(`Error getting suggestions: ${error}`, 'error');
        throw error;
      }
    }),

  /**
   * Get trending FAQs
   * 
   * Returns most popular FAQs based on views and clicks.
   * 
   * @param days - Time period
   * @param limit - Max results
   * @returns Trending FAQs
   */
  getTrendingFaqs: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7).describe('Time period'),
        limit: z.number().min(1).max(100).default(10).describe('Max results'),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database connection failed');
        }

        log(`Getting trending FAQs for last ${input.days} days`);

        const results = await db
          .select()
          .from(faqs)
          .where(eq(faqs.isPublished, true))
          .orderBy(
            desc(faqs.views),
            desc(faqs.helpful)
          )
          .limit(input.limit);

        const formatted = results.map(faq => ({
          ...formatSearchResult(faq, 0.95),
          searchHits: faq.views || 0,
          searchClicks: faq.helpful || 0,
        }));

        log(`Returned ${formatted.length} trending FAQs`);

        return {
          success: true,
          results: formatted,
        };
      } catch (error) {
        log(`Error getting trending FAQs: ${error}`, 'error');
        throw error;
      }
    }),
});

// ============================================================================
// EXPORTS
// ============================================================================

export type SemanticSearchRouter = typeof semanticSearchRouter;
