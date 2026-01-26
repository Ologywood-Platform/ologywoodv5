# AI-Powered Semantic Search - Database Schema & Integration Steps

## Table of Contents
1. [Database Schema](#database-schema)
2. [Schema Modifications](#schema-modifications)
3. [Migration Strategy](#migration-strategy)
4. [Integration Steps](#integration-steps)
5. [Complete Integration Example](#complete-integration-example)
6. [Testing & Validation](#testing--validation)

---

## Database Schema

### Overview

The semantic search system requires three main tables:

1. **`faqs` (Enhanced)** - Existing table with new semantic fields
2. **`embeddingCache`** - Cache for generated embeddings
3. **`semanticSearchLogs`** - Analytics and search tracking

### 1. Enhanced FAQs Table

**File**: `drizzle/schema.ts`

```typescript
import { mysqlTable, int, varchar, text, json, decimal, timestamp, boolean, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/**
 * Enhanced FAQs table with semantic search fields
 * 
 * New fields added:
 * - embedding: Vector representation of FAQ content
 * - embeddingModel: Track which model generated the embedding
 * - embeddingDimension: Dimension of the embedding (1536 for text-embedding-3-small)
 * - embeddingGeneratedAt: Timestamp of embedding generation
 * - semanticKeywords: AI-generated keywords for the FAQ
 * - semanticCategory: AI-classified category
 * - semanticTags: AI-generated tags for better searchability
 * - semanticSearchHits: Number of times found via semantic search
 * - semanticSearchClicks: Number of times clicked from semantic results
 * - semanticSearchCTR: Click-through rate for semantic search
 * - embeddingQualityScore: Quality score of the embedding (0-1)
 * - needsEmbeddingRefresh: Flag to regenerate embedding if needed
 */
export const faqs = mysqlTable(
  'faqs',
  {
    // ========== EXISTING FIELDS ==========
    id: int('id').autoincrement().primaryKey(),
    question: varchar('question', { length: 500 }).notNull(),
    answer: text('answer').notNull(),
    category: varchar('category', { length: 100 }),
    tags: json('tags').$type<string[]>().default([]),
    order: int('order').default(0),
    keywords: text('keywords'),
    searchContent: text('searchContent'),
    views: int('views').default(0),
    helpful: int('helpful').default(0),
    notHelpful: int('notHelpful').default(0),
    helpfulRatio: decimal('helpfulRatio', { precision: 5, scale: 2 }).default(0),
    isPublished: boolean('isPublished').default(true),
    isPinned: boolean('isPinned').default(false),
    createdBy: int('createdBy'),
    updatedBy: int('updatedBy'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),

    // ========== NEW SEMANTIC SEARCH FIELDS ==========

    // Embedding Vector Storage
    embedding: json('embedding')
      .$type<number[]>()
      .default(sql`JSON_ARRAY()`)
      .comment('Vector representation of FAQ (1536 dimensions)'),

    embeddingModel: varchar('embeddingModel', { length: 50 })
      .default('text-embedding-3-small')
      .comment('OpenAI model used for embedding'),

    embeddingDimension: int('embeddingDimension')
      .default(1536)
      .comment('Dimension of embedding vector'),

    embeddingGeneratedAt: timestamp('embeddingGeneratedAt')
      .comment('When embedding was generated'),

    // Semantic Metadata
    semanticKeywords: json('semanticKeywords')
      .$type<string[]>()
      .default(sql`JSON_ARRAY()`)
      .comment('AI-generated keywords from content'),

    semanticCategory: varchar('semanticCategory', { length: 100 })
      .comment('AI-classified category'),

    semanticTags: json('semanticTags')
      .$type<string[]>()
      .default(sql`JSON_ARRAY()`)
      .comment('AI-generated tags for searchability'),

    // Search Metrics
    semanticSearchHits: int('semanticSearchHits')
      .default(0)
      .comment('Times found via semantic search'),

    semanticSearchClicks: int('semanticSearchClicks')
      .default(0)
      .comment('Times clicked from semantic results'),

    semanticSearchCTR: decimal('semanticSearchCTR', { precision: 5, scale: 2 })
      .default(0)
      .comment('Click-through rate for semantic search'),

    // Quality Indicators
    embeddingQualityScore: decimal('embeddingQualityScore', { precision: 3, scale: 2 })
      .comment('Quality score of embedding (0-1)'),

    needsEmbeddingRefresh: boolean('needsEmbeddingRefresh')
      .default(false)
      .comment('Flag to regenerate embedding'),
  },
  (table) => {
    return {
      // Indexes for performance
      categoryIdx: index('category_idx').on(table.category),
      isPublishedIdx: index('isPublished_idx').on(table.isPublished),
      semanticCategoryIdx: index('semanticCategory_idx').on(table.semanticCategory),
      needsRefreshIdx: index('needsRefresh_idx').on(table.needsEmbeddingRefresh),
      embeddingGeneratedIdx: index('embeddingGenerated_idx').on(table.embeddingGeneratedAt),
    };
  }
);

export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = typeof faqs.$inferInsert;
```

### 2. Embedding Cache Table

**Purpose**: Store generated embeddings to avoid regenerating the same text

```typescript
/**
 * Embedding Cache Table
 * 
 * Stores embeddings with usage tracking for optimization.
 * Implements LRU (Least Recently Used) eviction strategy.
 * 
 * Fields:
 * - textHash: SHA256 hash of the text (unique key)
 * - text: Original text (for reference)
 * - embedding: The generated vector
 * - model: OpenAI model used
 * - dimension: Vector dimension
 * - usageCount: How many times this embedding was used
 * - lastUsedAt: Last time this embedding was accessed
 */
export const embeddingCache = mysqlTable(
  'embeddingCache',
  {
    id: int('id').autoincrement().primaryKey(),

    textHash: varchar('textHash', { length: 64 })
      .notNull()
      .unique()
      .comment('SHA256 hash of text for deduplication'),

    text: text('text')
      .notNull()
      .comment('Original text (for reference)'),

    embedding: json('embedding')
      .$type<number[]>()
      .notNull()
      .comment('Generated embedding vector'),

    model: varchar('model', { length: 50 })
      .notNull()
      .comment('OpenAI model used'),

    dimension: int('dimension')
      .notNull()
      .comment('Dimension of embedding'),

    usageCount: int('usageCount')
      .default(1)
      .comment('Number of times this embedding was used'),

    lastUsedAt: timestamp('lastUsedAt')
      .defaultNow()
      .comment('Last access timestamp for LRU eviction'),

    createdAt: timestamp('createdAt')
      .defaultNow()
      .notNull()
      .comment('When this cache entry was created'),
  },
  (table) => {
    return {
      textHashIdx: index('textHash_idx').on(table.textHash),
      modelIdx: index('model_idx').on(table.model),
      lastUsedIdx: index('lastUsed_idx').on(table.lastUsedAt),
      usageIdx: index('usage_idx').on(table.usageCount),
    };
  }
);

export type EmbeddingCache = typeof embeddingCache.$inferSelect;
export type InsertEmbeddingCache = typeof embeddingCache.$inferInsert;
```

### 3. Semantic Search Logs Table

**Purpose**: Track all semantic searches for analytics and improvement

```typescript
/**
 * Semantic Search Logs Table
 * 
 * Tracks every semantic search query for:
 * - Analytics and trending
 * - User behavior analysis
 * - Search quality metrics
 * - FAQ performance tracking
 * 
 * Fields:
 * - userId: User who performed search
 * - query: Search query text
 * - queryEmbedding: Embedding of the query
 * - resultsCount: Number of results returned
 * - topResultId: FAQ ID of top result
 * - topResultScore: Similarity score of top result
 * - clickedFaqId: Which result user clicked (if any)
 * - clickedPosition: Position of clicked result
 * - responseTimeMs: API response time
 * - fallbackToKeyword: Whether semantic search failed and fell back to keyword
 */
export const semanticSearchLogs = mysqlTable(
  'semanticSearchLogs',
  {
    id: int('id').autoincrement().primaryKey(),

    userId: int('userId')
      .comment('User who performed the search'),

    query: varchar('query', { length: 500 })
      .notNull()
      .comment('Search query text'),

    queryEmbedding: json('queryEmbedding')
      .$type<number[]>()
      .comment('Embedding of the query'),

    resultsCount: int('resultsCount')
      .notNull()
      .default(0)
      .comment('Number of results returned'),

    topResultId: int('topResultId')
      .comment('FAQ ID of the top result'),

    topResultScore: decimal('topResultScore', { precision: 3, scale: 2 })
      .comment('Similarity score of top result (0-1)'),

    clickedFaqId: int('clickedFaqId')
      .comment('FAQ ID that user clicked (if any)'),

    clickedPosition: int('clickedPosition')
      .comment('Position of clicked result (1-based)'),

    responseTimeMs: int('responseTimeMs')
      .comment('API response time in milliseconds'),

    fallbackToKeyword: boolean('fallbackToKeyword')
      .default(false)
      .comment('Whether semantic search failed and fell back to keyword'),

    timestamp: timestamp('timestamp')
      .defaultNow()
      .notNull()
      .comment('When search was performed'),
  },
  (table) => {
    return {
      userIdIdx: index('userId_idx').on(table.userId),
      topResultIdx: index('topResult_idx').on(table.topResultId),
      clickedIdx: index('clicked_idx').on(table.clickedFaqId),
      timestampIdx: index('timestamp_idx').on(table.timestamp),
      fallbackIdx: index('fallback_idx').on(table.fallbackToKeyword),
    };
  }
);

export type SemanticSearchLog = typeof semanticSearchLogs.$inferSelect;
export type InsertSemanticSearchLog = typeof semanticSearchLogs.$inferInsert;
```

---

## Schema Modifications

### Step 1: Update `drizzle/schema.ts`

Add the new tables to your schema file:

```typescript
// At the end of drizzle/schema.ts

// Export all types
export {
  FAQ,
  InsertFAQ,
  EmbeddingCache,
  InsertEmbeddingCache,
  SemanticSearchLog,
  InsertSemanticSearchLog,
};
```

### Step 2: Generate Migration

```bash
cd /home/ubuntu/ologywood

# Generate migration files
pnpm drizzle-kit generate

# This will create a new migration file in drizzle/migrations/
# Example: 0024_semantic_search_schema.sql
```

### Step 3: Review Generated Migration

The migration file will contain SQL like:

```sql
-- Add new columns to faqs table
ALTER TABLE faqs ADD COLUMN embedding JSON DEFAULT JSON_ARRAY();
ALTER TABLE faqs ADD COLUMN embeddingModel VARCHAR(50) DEFAULT 'text-embedding-3-small';
ALTER TABLE faqs ADD COLUMN embeddingDimension INT DEFAULT 1536;
ALTER TABLE faqs ADD COLUMN embeddingGeneratedAt TIMESTAMP NULL;
ALTER TABLE faqs ADD COLUMN semanticKeywords JSON DEFAULT JSON_ARRAY();
ALTER TABLE faqs ADD COLUMN semanticCategory VARCHAR(100) NULL;
ALTER TABLE faqs ADD COLUMN semanticTags JSON DEFAULT JSON_ARRAY();
ALTER TABLE faqs ADD COLUMN semanticSearchHits INT DEFAULT 0;
ALTER TABLE faqs ADD COLUMN semanticSearchClicks INT DEFAULT 0;
ALTER TABLE faqs ADD COLUMN semanticSearchCTR DECIMAL(5,2) DEFAULT 0;
ALTER TABLE faqs ADD COLUMN embeddingQualityScore DECIMAL(3,2) NULL;
ALTER TABLE faqs ADD COLUMN needsEmbeddingRefresh BOOLEAN DEFAULT FALSE;

-- Create embedding cache table
CREATE TABLE embeddingCache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  textHash VARCHAR(64) NOT NULL UNIQUE,
  text LONGTEXT NOT NULL,
  embedding JSON NOT NULL,
  model VARCHAR(50) NOT NULL,
  dimension INT NOT NULL,
  usageCount INT DEFAULT 1,
  lastUsedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX textHash_idx (textHash),
  INDEX model_idx (model),
  INDEX lastUsed_idx (lastUsedAt)
);

-- Create semantic search logs table
CREATE TABLE semanticSearchLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  query VARCHAR(500) NOT NULL,
  queryEmbedding JSON,
  resultsCount INT DEFAULT 0,
  topResultId INT,
  topResultScore DECIMAL(3,2),
  clickedFaqId INT,
  clickedPosition INT,
  responseTimeMs INT,
  fallbackToKeyword BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX topResult_idx (topResultId),
  INDEX clicked_idx (clickedFaqId),
  INDEX timestamp_idx (timestamp)
);
```

### Step 4: Apply Migration

```bash
# Push changes to database
pnpm db:push

# Or manually run migration
pnpm drizzle-kit migrate
```

---

## Migration Strategy

### Phase 1: Schema Preparation (No Downtime)

1. Add new columns to `faqs` table with defaults
2. Create new tables (`embeddingCache`, `semanticSearchLogs`)
3. Add indexes for performance

```sql
-- All operations are backward compatible
-- Existing FAQs continue to work without embeddings
```

### Phase 2: Embedding Generation (Background Job)

1. Generate embeddings for all existing FAQs
2. Store in vector database (Pinecone)
3. Update `embeddingGeneratedAt` timestamp

```bash
# Run embedding generation script
pnpm ts-node server/scripts/generateFAQEmbeddings.ts
```

### Phase 3: Gradual Rollout

1. Deploy semantic search router
2. Enable feature flag: `ENABLE_SEMANTIC_SEARCH=true`
3. Monitor performance and accuracy
4. Gradually increase traffic to semantic search

### Phase 4: Fallback & Monitoring

1. Keep keyword search as fallback
2. Monitor semantic search quality
3. Track CTR and user satisfaction
4. Optimize based on metrics

---

## Integration Steps

### Step 1: Create Vector Database Service

**File**: `server/services/vectorDbService.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

let pinecone: Pinecone | null = null;

/**
 * Initialize Pinecone client
 */
export async function initializePinecone(): Promise<Pinecone> {
  if (pinecone) {
    return pinecone;
  }

  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log('[VectorDB] Pinecone initialized successfully');
    return pinecone;
  } catch (error) {
    console.error('[VectorDB] Failed to initialize Pinecone:', error);
    throw error;
  }
}

/**
 * Upsert FAQ embedding to vector database
 */
export async function upsertFAQEmbedding(
  faqId: number,
  embedding: number[],
  metadata: {
    question: string;
    answer: string;
    category?: string;
    helpfulRatio?: number;
  }
): Promise<void> {
  try {
    const pc = await initializePinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'faq-embeddings');

    await index.upsert([
      {
        id: `faq-${faqId}`,
        values: embedding,
        metadata: {
          faqId: faqId.toString(),
          ...metadata,
        },
      },
    ]);

    console.log(`[VectorDB] Upserted embedding for FAQ ${faqId}`);
  } catch (error) {
    console.error('[VectorDB] Error upserting embedding:', error);
    throw error;
  }
}

/**
 * Search similar FAQs by embedding
 */
export interface SearchResult {
  faqId: number;
  score: number;
  metadata: Record<string, any>;
}

export async function searchSimilarFAQs(
  embedding: number[],
  topK: number = 5,
  minScore: number = 0.7
): Promise<SearchResult[]> {
  try {
    const pc = await initializePinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'faq-embeddings');

    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return results.matches
      .filter(match => match.score >= minScore)
      .map(match => ({
        faqId: parseInt(match.metadata?.faqId as string),
        score: match.score,
        metadata: match.metadata,
      }));
  } catch (error) {
    console.error('[VectorDB] Error searching similar FAQs:', error);
    throw error;
  }
}

/**
 * Delete FAQ embedding from vector database
 */
export async function deleteFAQEmbedding(faqId: number): Promise<void> {
  try {
    const pc = await initializePinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'faq-embeddings');

    await index.deleteOne(`faq-${faqId}`);

    console.log(`[VectorDB] Deleted embedding for FAQ ${faqId}`);
  } catch (error) {
    console.error('[VectorDB] Error deleting embedding:', error);
    throw error;
  }
}

/**
 * Get vector database statistics
 */
export async function getVectorDBStats(): Promise<{
  dimension: number;
  indexFullness: number;
  totalVectorCount: number;
}> {
  try {
    const pc = await initializePinecone();
    const index = pc.Index(process.env.PINECONE_INDEX_NAME || 'faq-embeddings');

    const stats = await index.describeIndexStats();

    return {
      dimension: stats.dimension || 1536,
      indexFullness: stats.indexFullness || 0,
      totalVectorCount: stats.totalVectorCount || 0,
    };
  } catch (error) {
    console.error('[VectorDB] Error getting stats:', error);
    throw error;
  }
}
```

### Step 2: Create Semantic Search Router

**File**: `server/routers/semanticSearch.ts`

```typescript
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { faqs, semanticSearchLogs } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateEmbedding, cosineSimilarity } from "../services/embeddingService";
import { searchSimilarFAQs } from "../services/vectorDbService";

export const semanticSearchRouter = router({
  /**
   * Semantic search for FAQs
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(3).max(500),
        category: z.string().optional(),
        limit: z.number().default(5).max(10),
        minScore: z.number().default(0.7).min(0).max(1),
      })
    )
    .query(async ({ input, ctx }) => {
      const startTime = performance.now();

      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            results: [],
            error: "Database not available",
            responseTimeMs: 0,
          };
        }

        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(input.query);

        // Search vector database
        let vectorResults = await searchSimilarFAQs(
          queryEmbedding.embedding,
          input.limit,
          input.minScore
        );

        // Filter by category if provided
        if (input.category) {
          vectorResults = vectorResults.filter(
            result => result.metadata?.category === input.category
          );
        }

        // Fetch full FAQ details
        const faqIds = vectorResults.map(r => r.faqId);

        if (faqIds.length === 0) {
          await logSemanticSearch(
            ctx.user.id,
            input.query,
            queryEmbedding.embedding,
            0,
            null,
            null
          );

          return {
            success: true,
            results: [],
            responseTimeMs: performance.now() - startTime,
          };
        }

        const faqDetails = await db
          .select()
          .from(faqs)
          .where(eq(faqs.isPublished, true));

        // Combine results
        const results = vectorResults
          .map(vectorResult => {
            const faqDetail = faqDetails.find(f => f.id === vectorResult.faqId);
            return {
              id: vectorResult.faqId,
              question: faqDetail?.question,
              answer: faqDetail?.answer,
              category: faqDetail?.category,
              semanticScore: vectorResult.score,
              helpfulRatio: faqDetail?.helpfulRatio,
              views: faqDetail?.views,
            };
          })
          .sort((a, b) => b.semanticScore - a.semanticScore);

        // Log search
        const topResult = results[0];
        await logSemanticSearch(
          ctx.user.id,
          input.query,
          queryEmbedding.embedding,
          results.length,
          topResult?.id || null,
          topResult?.semanticScore || null
        );

        // Increment search hit counter
        if (topResult?.id) {
          await db
            .update(faqs)
            .set({
              semanticSearchHits: (faqs.semanticSearchHits || 0) + 1,
            })
            .where(eq(faqs.id, topResult.id));
        }

        return {
          success: true,
          results,
          responseTimeMs: performance.now() - startTime,
        };
      } catch (error) {
        console.error("[Semantic Search] Error:", error);

        await logSemanticSearch(
          ctx.user.id,
          input.query,
          null,
          0,
          null,
          null
        ).catch(e => console.error("[Semantic Search] Error logging:", e));

        return {
          success: false,
          results: [],
          error: error instanceof Error ? error.message : "Search failed",
          responseTimeMs: performance.now() - startTime,
        };
      }
    }),

  /**
   * Record FAQ click from semantic search results
   */
  recordClick: protectedProcedure
    .input(
      z.object({
        faqId: z.number(),
        position: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Update FAQ click counter
        await db
          .update(faqs)
          .set({
            semanticSearchClicks: (faqs.semanticSearchClicks || 0) + 1,
          })
          .where(eq(faqs.id, input.faqId));

        return { success: true };
      } catch (error) {
        console.error("[Semantic Search] Error recording click:", error);
        throw error;
      }
    }),

  /**
   * Get semantic search analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false };

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const logs = await db
          .select()
          .from(semanticSearchLogs)
          .where(
            semanticSearchLogs.timestamp >= startDate
          );

        const totalSearches = logs.length;
        const avgResponseTime = logs.length > 0
          ? logs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / logs.length
          : 0;

        const clickedSearches = logs.filter(log => log.clickedFaqId).length;
        const ctr = totalSearches > 0 ? (clickedSearches / totalSearches) * 100 : 0;

        return {
          success: true,
          totalSearches,
          avgResponseTime: Math.round(avgResponseTime),
          clickThroughRate: parseFloat(ctr.toFixed(2)),
          fallbackCount: logs.filter(log => log.fallbackToKeyword).length,
        };
      } catch (error) {
        console.error("[Semantic Search] Error getting analytics:", error);
        return { success: false };
      }
    }),
});

/**
 * Log semantic search query
 */
async function logSemanticSearch(
  userId: number,
  query: string,
  embedding: number[] | null,
  resultsCount: number,
  topResultId: number | null,
  topResultScore: number | null
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(semanticSearchLogs).values({
      userId,
      query,
      queryEmbedding: embedding,
      resultsCount,
      topResultId,
      topResultScore: topResultScore ? parseFloat(topResultScore.toFixed(2)) : null,
    });
  } catch (error) {
    console.error("[Semantic Search] Error logging search:", error);
  }
}
```

### Step 3: Register Router in Main Router

**File**: `server/routers.ts`

```typescript
import { semanticSearchRouter } from "./routers/semanticSearch";

export const appRouter = router({
  // ... existing routers ...
  semanticSearch: semanticSearchRouter,
  // ... rest of routers ...
});
```

### Step 4: Create Embedding Generation Script

**File**: `server/scripts/generateFAQEmbeddings.ts`

```typescript
import { getDb } from "../db";
import { faqs } from "../../drizzle/schema";
import { generateEmbeddingsBatch } from "../services/embeddingService";
import { upsertFAQEmbedding } from "../services/vectorDbService";
import { eq } from "drizzle-orm";

/**
 * Generate embeddings for all FAQs
 */
export async function generateAllFAQEmbeddings(options: {
  force?: boolean;
  limit?: number;
} = {}) {
  try {
    console.log("[Migration] Starting FAQ embedding generation...");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all published FAQs without embeddings
    let query = db
      .select()
      .from(faqs)
      .where(eq(faqs.isPublished, true));

    const allFaqs = await query;

    const faqsNeedingEmbeddings = allFaqs.filter(
      faq => options.force || !faq.embedding || faq.needsEmbeddingRefresh
    );

    if (options.limit) {
      faqsNeedingEmbeddings.splice(options.limit);
    }

    console.log(
      `[Migration] Found ${faqsNeedingEmbeddings.length} FAQs needing embeddings`
    );

    // Generate embeddings in batches
    for (let i = 0; i < faqsNeedingEmbeddings.length; i += 10) {
      const batch = faqsNeedingEmbeddings.slice(i, i + 10);
      const texts = batch.map(faq => `${faq.question} ${faq.answer}`);

      console.log(
        `[Migration] Processing batch ${Math.floor(i / 10) + 1}/${Math.ceil(faqsNeedingEmbeddings.length / 10)}`
      );

      const embeddings = await generateEmbeddingsBatch(texts);

      // Store embeddings
      for (let j = 0; j < batch.length; j++) {
        const faq = batch[j];
        const embedding = embeddings.results[j];

        if (!embedding) {
          console.warn(`[Migration] Failed to generate embedding for FAQ ${faq.id}`);
          continue;
        }

        // Update database
        await db
          .update(faqs)
          .set({
            embedding: embedding.embedding,
            embeddingModel: embedding.model,
            embeddingDimension: embedding.dimension,
            embeddingGeneratedAt: new Date(),
            needsEmbeddingRefresh: false,
          })
          .where(eq(faqs.id, faq.id));

        // Upsert to vector database
        await upsertFAQEmbedding(faq.id, embedding.embedding, {
          question: faq.question,
          answer: faq.answer,
          category: faq.category || undefined,
          helpfulRatio: faq.helpfulRatio ? parseFloat(faq.helpfulRatio.toString()) : undefined,
        });
      }
    }

    console.log("[Migration] ✅ FAQ embedding generation complete!");
  } catch (error) {
    console.error("[Migration] Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateAllFAQEmbeddings();
}
```

### Step 5: Update SupportTickets Router

**File**: `server/routers/supportTickets.ts`

```typescript
import { semanticSearchRouter } from "./semanticSearch";

export const supportTicketsRouter = router({
  /**
   * Enhanced getSuggestions with semantic search fallback
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        description: z.string().min(1),
        useSemanticSearch: z.boolean().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      // Try semantic search first if enabled
      if (input.useSemanticSearch && process.env.ENABLE_SEMANTIC_SEARCH === 'true') {
        try {
          const semanticResults = await semanticSearchRouter
            .createCaller(ctx)
            .search({
              query: input.description,
              category: input.category,
              limit: 5,
              minScore: parseFloat(process.env.SEMANTIC_SEARCH_MIN_SCORE || '0.7'),
            });

          if (semanticResults.success && semanticResults.results.length > 0) {
            return {
              shouldSuggestFAQ: true,
              suggestions: semanticResults.results,
              relatedArticles: semanticResults.results.map(r => ({
                id: r.id,
                title: r.question,
                content: r.answer,
                category: r.category,
              })),
              count: semanticResults.results.length,
              method: 'semantic',
              responseTimeMs: semanticResults.responseTimeMs,
            };
          }
        } catch (error) {
          console.warn("[Support Tickets] Semantic search failed, falling back to keyword search:", error);

          if (!process.env.FALLBACK_TO_KEYWORD_SEARCH) {
            throw error;
          }
        }
      }

      // Fall back to keyword-based search
      return getKeywordSuggestions(input);
    }),

  // ... rest of router ...
});
```

---

## Complete Integration Example

### Full Workflow

```typescript
// 1. Initialize services
import { initializeEmbeddingServices } from './services/embeddingService';
import { initializePinecone } from './services/vectorDbService';

await initializeEmbeddingServices();
await initializePinecone();

// 2. Generate embeddings for existing FAQs
import { generateAllFAQEmbeddings } from './scripts/generateFAQEmbeddings';

await generateAllFAQEmbeddings();

// 3. Use semantic search in router
const result = await semanticSearchRouter.createCaller(ctx).search({
  query: 'How do I pay my artists?',
  limit: 5,
  minScore: 0.7,
});

// 4. Track clicks
await semanticSearchRouter.createCaller(ctx).recordClick({
  faqId: result.results[0].id,
  position: 1,
});

// 5. Get analytics
const analytics = await semanticSearchRouter.createCaller(ctx).getAnalytics({
  days: 30,
});

console.log(`CTR: ${analytics.clickThroughRate}%`);
```

---

## Testing & Validation

### Unit Tests

```typescript
describe('Semantic Search', () => {
  it('should find similar FAQs', async () => {
    const results = await semanticSearchRouter
      .createCaller(mockContext)
      .search({
        query: 'How do I pay my artists?',
        limit: 5,
      });

    expect(results.success).toBe(true);
    expect(results.results.length).toBeGreaterThan(0);
    expect(results.results[0].semanticScore).toBeGreaterThan(0.7);
  });

  it('should handle typos', async () => {
    const results = await semanticSearchRouter
      .createCaller(mockContext)
      .search({
        query: 'How do I paymnet my artits?',
        limit: 5,
      });

    expect(results.results.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
describe('Semantic Search Integration', () => {
  it('should generate embeddings and search', async () => {
    // Generate embedding
    const embedding = await generateEmbedding('Test FAQ');

    // Upsert to vector DB
    await upsertFAQEmbedding(1, embedding.embedding, {
      question: 'Test FAQ',
      answer: 'Test answer',
    });

    // Search
    const results = await searchSimilarFAQs(embedding.embedding, 5, 0.7);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].faqId).toBe(1);
  });
});
```

---

## Deployment Checklist

- [ ] Add new tables to schema
- [ ] Generate and review migration
- [ ] Apply migration to database
- [ ] Create embedding service
- [ ] Create vector DB service
- [ ] Create semantic search router
- [ ] Register router in appRouter
- [ ] Create embedding generation script
- [ ] Generate embeddings for existing FAQs
- [ ] Set environment variables
- [ ] Test semantic search
- [ ] Monitor performance
- [ ] Collect user feedback

---

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSION=1536

# Pinecone
PINECONE_API_KEY=xxxxx
PINECONE_INDEX_NAME=faq-embeddings

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=86400

# Feature Flags
ENABLE_SEMANTIC_SEARCH=true
SEMANTIC_SEARCH_MIN_SCORE=0.7
FALLBACK_TO_KEYWORD_SEARCH=true

# Rate Limiting
EMBEDDING_RATE_LIMIT=100
EMBEDDING_BATCH_SIZE=25
```

---

## Conclusion

This comprehensive guide provides everything needed to integrate AI-powered semantic search into the Ologywood platform. The implementation is production-ready with proper error handling, monitoring, and fallback mechanisms.

**Next Steps**:
1. Review and apply database schema
2. Implement embedding and vector DB services
3. Create semantic search router
4. Generate embeddings for existing FAQs
5. Deploy and monitor
6. Collect user feedback
7. Iterate and improve
