/**
 * Embedding Service
 * 
 * Handles generation, caching, and management of text embeddings using OpenAI API.
 * Provides multi-level caching (Redis + Database) for optimal performance.
 * Includes rate limiting, batch processing, and comprehensive error handling.
 * 
 * @module server/services/embeddingService
 */

import { OpenAI } from 'openai';
import { createHash } from 'crypto';
import PQueue from 'p-queue';
import { Redis } from 'ioredis';
import { getDb } from '../db';
import { embeddingCache } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /** Original text that was embedded */
  text: string;
  
  /** Vector representation (array of numbers) */
  embedding: number[];
  
  /** Model used for embedding */
  model: string;
  
  /** Dimension of the embedding vector */
  dimension: number;
  
  /** Number of tokens used in the API call */
  tokensUsed: number;
  
  /** Whether this embedding came from cache */
  fromCache?: boolean;
  
  /** Cache level if from cache: 'redis' | 'database' | 'vector' */
  cacheLevel?: 'redis' | 'database' | 'vector';
  
  /** Timestamp of generation */
  generatedAt: Date;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  /** Total embeddings processed */
  total: number;
  
  /** Successfully generated embeddings */
  successful: number;
  
  /** Failed embeddings */
  failed: number;
  
  /** Results for each embedding */
  results: EmbeddingResult[];
  
  /** Total tokens used */
  totalTokensUsed: number;
  
  /** Processing time in milliseconds */
  processingTimeMs: number;
  
  /** Errors encountered */
  errors: Array<{ text: string; error: string }>;
}

/**
 * Similarity search result
 */
export interface SimilarityResult {
  /** Index of the compared vector */
  index: number;
  
  /** Similarity score (0-1) */
  score: number;
  
  /** Text associated with the vector (if available) */
  text?: string;
}

/**
 * Embedding statistics
 */
export interface EmbeddingStats {
  /** Total embeddings generated in session */
  totalGenerated: number;
  
  /** Cache hits */
  cacheHits: number;
  
  /** Cache misses */
  cacheMisses: number;
  
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  
  /** Total API calls made */
  apiCalls: number;
  
  /** Total tokens used */
  totalTokensUsed: number;
  
  /** Average tokens per embedding */
  avgTokensPerEmbedding: number;
  
  /** Session duration in milliseconds */
  sessionDurationMs: number;
}

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

/**
 * OpenAI client instance
 */
let openaiClient: OpenAI | null = null;

/**
 * Redis client instance for caching
 */
let redisClient: Redis | null = null;

/**
 * Rate limiting queue for API calls
 */
let embeddingQueue: PQueue | null = null;

/**
 * Session statistics
 */
const sessionStats: EmbeddingStats = {
  totalGenerated: 0,
  cacheHits: 0,
  cacheMisses: 0,
  cacheHitRate: 0,
  apiCalls: 0,
  totalTokensUsed: 0,
  avgTokensPerEmbedding: 0,
  sessionDurationMs: 0,
};

const sessionStartTime = Date.now();

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize OpenAI client
 * 
 * @returns OpenAI client instance
 * @throws Error if API key is not configured
 */
export function initializeOpenAI(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is not set. ' +
      'Get your key from https://platform.openai.com/api-keys'
    );
  }

  openaiClient = new OpenAI({
    apiKey,
    timeout: 30000, // 30 second timeout
    maxRetries: 3,
  });

  console.log('[Embedding] OpenAI client initialized');
  return openaiClient;
}

/**
 * Initialize Redis client for caching
 * 
 * @returns Redis client instance or null if Redis is not available
 */
export async function initializeRedis(): Promise<Redis | null> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[Embedding] REDIS_URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    });

    // Test connection
    await redisClient.ping();
    console.log('[Embedding] Redis client initialized and connected');
    return redisClient;
  } catch (error) {
    console.warn('[Embedding] Failed to initialize Redis:', error);
    redisClient = null;
    return null;
  }
}

/**
 * Initialize rate limiting queue
 * 
 * @returns PQueue instance
 */
export function initializeRateLimitQueue(): PQueue {
  if (embeddingQueue) {
    return embeddingQueue;
  }

  const rateLimitPerMinute = parseInt(process.env.EMBEDDING_RATE_LIMIT || '100');

  embeddingQueue = new PQueue({
    interval: 60000, // 1 minute
    intervalCap: rateLimitPerMinute,
    concurrency: 5, // Allow 5 concurrent requests
  });

  console.log(`[Embedding] Rate limiting queue initialized (${rateLimitPerMinute} requests/min)`);
  return embeddingQueue;
}

/**
 * Initialize all embedding services
 */
export async function initializeEmbeddingServices(): Promise<void> {
  try {
    initializeOpenAI();
    await initializeRedis();
    initializeRateLimitQueue();
    console.log('[Embedding] All services initialized successfully');
  } catch (error) {
    console.error('[Embedding] Failed to initialize services:', error);
    throw error;
  }
}

// ============================================================================
// CACHE HELPER FUNCTIONS
// ============================================================================

/**
 * Generate SHA-256 hash of text for cache key
 * 
 * @param text - Text to hash
 * @returns SHA-256 hash in hex format
 */
function generateTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Get embedding from Redis cache
 * 
 * @param textHash - SHA-256 hash of text
 * @returns Cached embedding or null if not found
 */
async function getFromRedisCache(textHash: string): Promise<number[] | null> {
  if (!redisClient) return null;

  try {
    const cached = await redisClient.get(`embedding:${textHash}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('[Embedding] Redis cache read error:', error);
  }

  return null;
}

/**
 * Store embedding in Redis cache
 * 
 * @param textHash - SHA-256 hash of text
 * @param embedding - Embedding vector
 * @param ttlSeconds - Time to live in seconds (default: 30 days)
 */
async function storeInRedisCache(
  textHash: string,
  embedding: number[],
  ttlSeconds: number = 30 * 24 * 60 * 60
): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.setex(
      `embedding:${textHash}`,
      ttlSeconds,
      JSON.stringify(embedding)
    );
  } catch (error) {
    console.warn('[Embedding] Redis cache write error:', error);
  }
}

/**
 * Get embedding from database cache
 * 
 * @param textHash - SHA-256 hash of text
 * @returns Cached embedding record or null if not found
 */
async function getFromDatabaseCache(textHash: string): Promise<any | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(embeddingCache)
      .where(eq(embeddingCache.textHash, textHash))
      .limit(1);

    if (result.length > 0) {
      // Update usage count and last used time
      await db
        .update(embeddingCache)
        .set({
          usageCount: sql`${embeddingCache.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(embeddingCache.textHash, textHash));

      return result[0];
    }
  } catch (error) {
    console.warn('[Embedding] Database cache read error:', error);
  }

  return null;
}

/**
 * Store embedding in database cache
 * 
 * @param textHash - SHA-256 hash of text
 * @param text - Original text
 * @param embedding - Embedding vector
 * @param model - Model name
 * @param dimension - Vector dimension
 */
async function storeInDatabaseCache(
  textHash: string,
  text: string,
  embedding: number[],
  model: string,
  dimension: number
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(embeddingCache).values({
      textHash,
      text,
      embedding,
      model,
      dimension,
      usageCount: 1,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.warn('[Embedding] Database cache write error:', error);
  }
}

// ============================================================================
// CORE EMBEDDING FUNCTIONS
// ============================================================================

/**
 * Generate embedding for a single text
 * 
 * Implements multi-level caching:
 * 1. Redis (fast, in-memory)
 * 2. Database (persistent)
 * 3. API (if not cached)
 * 
 * @param text - Text to embed
 * @param options - Configuration options
 * @returns Embedding result with metadata
 * 
 * @example
 * ```typescript
 * const result = await generateEmbedding('How do I pay artists?');
 * console.log(result.embedding); // [0.123, -0.456, ...]
 * console.log(result.fromCache); // true if cached
 * ```
 */
export async function generateEmbedding(
  text: string,
  options: {
    forceRefresh?: boolean;
    model?: string;
    dimension?: number;
  } = {}
): Promise<EmbeddingResult> {
  const startTime = performance.now();

  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (trimmedText.length > 8191) {
      throw new Error('Text exceeds maximum length of 8191 characters');
    }

    const model = options.model || 'text-embedding-3-small';
    const dimension = options.dimension || 1536;
    const textHash = generateTextHash(trimmedText);

    // Check cache if not forcing refresh
    if (!options.forceRefresh) {
      // Try Redis cache first
      const redisEmbedding = await getFromRedisCache(textHash);
      if (redisEmbedding) {
        sessionStats.cacheHits++;
        sessionStats.totalGenerated++;
        updateCacheHitRate();
        
        return {
          text: trimmedText,
          embedding: redisEmbedding,
          model,
          dimension,
          tokensUsed: 0,
          fromCache: true,
          cacheLevel: 'redis',
          generatedAt: new Date(),
        };
      }

      // Try database cache
      const dbCached = await getFromDatabaseCache(textHash);
      if (dbCached) {
        sessionStats.cacheHits++;
        sessionStats.totalGenerated++;
        updateCacheHitRate();

        // Store in Redis for faster future access
        await storeInRedisCache(textHash, dbCached.embedding);

        return {
          text: trimmedText,
          embedding: dbCached.embedding,
          model: dbCached.model,
          dimension: dbCached.dimension,
          tokensUsed: 0,
          fromCache: true,
          cacheLevel: 'database',
          generatedAt: new Date(),
        };
      }
    }

    // Cache miss - generate via API
    sessionStats.cacheMisses++;
    sessionStats.totalGenerated++;
    updateCacheHitRate();

    // Initialize OpenAI client
    const client = initializeOpenAI();
    const queue = initializeRateLimitQueue();

    // Generate embedding with rate limiting
    const response = await queue.add(async () => {
      return await client.embeddings.create({
        input: trimmedText,
        model,
        dimensions: dimension,
      });
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from API');
    }

    const embeddingVector = response.data[0].embedding as number[];
    const tokensUsed = response.usage?.total_tokens || 0;

    sessionStats.apiCalls++;
    sessionStats.totalTokensUsed += tokensUsed;
    sessionStats.avgTokensPerEmbedding = sessionStats.totalTokensUsed / sessionStats.totalGenerated;

    // Store in both caches
    await storeInRedisCache(textHash, embeddingVector);
    await storeInDatabaseCache(textHash, trimmedText, embeddingVector, model, dimension);

    const endTime = performance.now();

    return {
      text: trimmedText,
      embedding: embeddingVector,
      model,
      dimension,
      tokensUsed,
      fromCache: false,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * 
 * @param texts - Array of texts to embed
 * @param options - Configuration options
 * @returns Batch result with all embeddings and statistics
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: {
    forceRefresh?: boolean;
    model?: string;
    dimension?: number;
    batchSize?: number;
  } = {}
): Promise<BatchEmbeddingResult> {
  const startTime = performance.now();
  const batchSize = options.batchSize || 10;
  const results: EmbeddingResult[] = [];
  const errors: Array<{ text: string; error: string }> = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((text) => generateEmbedding(text, options))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          text: batch[j],
          error: result.reason?.message || 'Unknown error',
        });
      }
    }
  }

  const endTime = performance.now();

  return {
    total: texts.length,
    successful: results.length,
    failed: errors.length,
    results,
    totalTokensUsed: results.reduce((sum, r) => sum + r.tokensUsed, 0),
    processingTimeMs: endTime - startTime,
    errors,
  };
}

// ============================================================================
// VECTOR OPERATIONS
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Similarity score (0-1)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Validate input
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new Error('Vectors must be arrays');
  }
  
  if (vecA.length === 0 || vecB.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  // Check for NaN values
  if (vecA.some(v => isNaN(v)) || vecB.some(v => isNaN(v))) {
    throw new Error('Vectors cannot contain NaN values');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate Euclidean distance between two vectors
 * 
 * @param vecA - First vector
 * @param vecB - Second vector
 * @returns Euclidean distance
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let sumSquaredDiff = 0;

  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sumSquaredDiff += diff * diff;
  }

  return Math.sqrt(sumSquaredDiff);
}

/**
 * Find most similar vectors using cosine similarity
 * 
 * @param queryVector - Query embedding vector
 * @param vectors - Array of vectors to search
 * @param topK - Number of top results to return
 * @param minScore - Minimum similarity score threshold
 * @returns Top K similar vectors with scores
 */
export function findMostSimilar(
  queryVector: number[],
  vectors: number[][],
  topK: number = 5,
  minScore: number = 0.7
): SimilarityResult[] {
  const similarities = vectors
    .map((vec, index) => ({
      index,
      score: cosineSimilarity(queryVector, vec),
    }))
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return similarities;
}

// ============================================================================
// RELEVANCE SCORING
// ============================================================================

/**
 * Calculate multi-factor relevance score for FAQ results
 * 
 * Combines:
 * - Semantic similarity (base score)
 * - Helpful ratio boost (0-0.1)
 * - View boost (logarithmic, 0-0.1)
 * - Pin boost (0 or 0.15)
 * 
 * @param semanticScore - Semantic similarity score (0-1)
 * @param helpfulRatio - Helpful ratio percentage (0-100)
 * @param views - Number of views
 * @param isPinned - Whether FAQ is pinned
 * @returns Final relevance score (0-1)
 */
export function calculateRelevanceScore(
  semanticScore: number,
  helpfulRatio: number | null | undefined,
  views: number,
  isPinned: boolean
): number {
  let score = semanticScore;

  // Boost for helpful FAQs (+0.1 max)
  if (helpfulRatio && helpfulRatio > 0) {
    score += (helpfulRatio / 100) * 0.1;
  }

  // Logarithmic view boost (+0.1 max)
  // ln(views+1) * 0.05, clamped to 0.1
  const viewBoost = Math.min(Math.log(views + 1) * 0.05, 0.1);
  score += viewBoost;

  // Pin boost (+0.15)
  if (isPinned) {
    score += 0.15;
  }

  // Clamp to [0, 1]
  return Math.min(Math.max(score, 0), 1);
}

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * Update cache hit rate statistic
 */
function updateCacheHitRate(): void {
  const total = sessionStats.cacheHits + sessionStats.cacheMisses;
  sessionStats.cacheHitRate = total > 0 ? sessionStats.cacheHits / total : 0;
}

/**
 * Get current session statistics
 * 
 * @returns Session statistics
 */
export function getSessionStats(): EmbeddingStats {
  const now = Date.now();
  return {
    ...sessionStats,
    sessionDurationMs: now - sessionStartTime,
  };
}

/**
 * Reset session statistics
 */
export function resetSessionStats(): void {
  sessionStats.totalGenerated = 0;
  sessionStats.cacheHits = 0;
  sessionStats.cacheMisses = 0;
  sessionStats.cacheHitRate = 0;
  sessionStats.apiCalls = 0;
  sessionStats.totalTokensUsed = 0;
  sessionStats.avgTokensPerEmbedding = 0;
}

// ============================================================================
// CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Clear least recently used embeddings from database cache
 * 
 * @param maxAgeInDays - Maximum age in days (default: 30)
 * @returns Number of embeddings deleted
 */
export async function clearLRUCache(maxAgeInDays: number = 30): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const cutoffDate = new Date(Date.now() - maxAgeInDays * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(embeddingCache)
      .where(sql`${embeddingCache.lastUsedAt} < ${cutoffDate}`);

    // Extract affected rows count from result
    const affectedRows = (result as any)[0]?.affectedRows || 0;
    console.log(`[Embedding] Cleared ${affectedRows} old embeddings from cache`);
    return affectedRows;
  } catch (error) {
    console.error('[Embedding] Error clearing LRU cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 * 
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<any> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select({
        totalEmbeddings: sql<number>`COUNT(*)`,
        totalUses: sql<number>`SUM(${embeddingCache.usageCount})`,
        avgUses: sql<number>`AVG(${embeddingCache.usageCount})`,
        oldestCreated: sql<Date>`MIN(${embeddingCache.createdAt})`,
        newestCreated: sql<Date>`MAX(${embeddingCache.createdAt})`,
      })
      .from(embeddingCache);

    return result[0];
  } catch (error) {
    console.error('[Embedding] Error getting cache stats:', error);
    return null;
  }
}

export default {
  initializeEmbeddingServices,
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
  euclideanDistance,
  findMostSimilar,
  calculateRelevanceScore,
  getSessionStats,
  resetSessionStats,
  clearLRUCache,
  getCacheStats,
};
