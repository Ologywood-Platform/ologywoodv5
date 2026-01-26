/**
 * Vector Database Service
 * 
 * Manages interactions with Pinecone vector database for semantic search.
 * 
 * Features:
 * - Upsert FAQ embeddings to Pinecone
 * - Search similar FAQs by embedding
 * - Delete embeddings
 * - Batch operations
 * - Error handling and logging
 * 
 * @module server/services/vectorDbService
 */

import { Pinecone } from '@pinecone-database/pinecone';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface UpsertOptions {
  question?: string;
  answer?: string;
  category?: string;
  helpfulRatio?: number;
  [key: string]: any;
}

interface SearchResult {
  faqId: number;
  score: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const SERVICE_NAME = '[Vector DB Service]';
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'faq-embeddings';
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp';
const EMBEDDING_DIMENSION = 1536; // For text-embedding-3-small

// ============================================================================
// LOGGING
// ============================================================================

function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${level.toUpperCase()}] ${SERVICE_NAME} ${message}`);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let pineconeInstance: Pinecone | null = null;
let indexInstance: any = null;

/**
 * Initialize Pinecone client
 */
async function initializePinecone(): Promise<Pinecone> {
  if (pineconeInstance) {
    return pineconeInstance;
  }

  if (!PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }

  try {
    log('Initializing Pinecone client...');

    pineconeInstance = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    log('Pinecone client initialized successfully');
    return pineconeInstance;
  } catch (error) {
    log(`Failed to initialize Pinecone: ${error}`, 'error');
    throw error;
  }
}

/**
 * Get Pinecone index
 */
async function getIndex(): Promise<any> {
  if (indexInstance) {
    return indexInstance;
  }

  try {
    const client = await initializePinecone();
    indexInstance = client.Index(PINECONE_INDEX_NAME);

    log(`Connected to index: ${PINECONE_INDEX_NAME}`);
    return indexInstance;
  } catch (error) {
    log(`Failed to get index: ${error}`, 'error');
    throw error;
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Upsert a single FAQ embedding to Pinecone
 * 
 * @param faqId - FAQ ID
 * @param embedding - Embedding vector (1536 dimensions)
 * @param metadata - Optional metadata to store with embedding
 * @returns Success status
 */
export async function upsertFAQEmbedding(
  faqId: number,
  embedding: number[],
  metadata?: UpsertOptions
): Promise<{ success: boolean }> {
  try {
    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    const index = await getIndex();

    // Prepare vector record
    const vectorRecord = {
      id: `faq-${faqId}`,
      values: embedding,
      metadata: {
        faqId,
        ...metadata,
      },
    };

    log(`Upserting FAQ ${faqId} to Pinecone`);

    // Upsert to Pinecone
    await index.upsert([vectorRecord]);

    log(`Successfully upserted FAQ ${faqId}`);
    return { success: true };
  } catch (error) {
    log(`Error upserting FAQ ${faqId}: ${error}`, 'error');
    throw error;
  }
}

/**
 * Upsert multiple FAQ embeddings in batch
 * 
 * @param embeddings - Array of { faqId, embedding, metadata }
 * @param batchSize - Batch size for upsert (default: 100)
 * @returns Success count and error count
 */
export async function upsertFAQEmbeddingsBatch(
  embeddings: Array<{
    faqId: number;
    embedding: number[];
    metadata?: UpsertOptions;
  }>,
  batchSize: number = 100
): Promise<{ successful: number; failed: number }> {
  try {
    const index = await getIndex();
    let successful = 0;
    let failed = 0;

    log(`Upserting ${embeddings.length} embeddings in batches of ${batchSize}`);

    // Process in batches
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);

      try {
        const vectorRecords = batch.map(item => ({
          id: `faq-${item.faqId}`,
          values: item.embedding,
          metadata: {
            faqId: item.faqId,
            ...item.metadata,
          },
        }));

        await index.upsert(vectorRecords);

        successful += batch.length;
        log(`Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
      } catch (batchError) {
        log(`Batch upsert failed: ${batchError}`, 'error');
        failed += batch.length;
      }
    }

    log(`Batch upsert complete: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  } catch (error) {
    log(`Error in batch upsert: ${error}`, 'error');
    throw error;
  }
}

/**
 * Search for similar FAQs by embedding
 * 
 * @param queryEmbedding - Query embedding vector (1536 dimensions)
 * @param topK - Number of results to return (default: 5)
 * @param minScore - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of search results
 */
export async function searchSimilarFAQs(
  queryEmbedding: number[],
  topK: number = 5,
  minScore: number = 0.7
): Promise<SearchResult[]> {
  try {
    if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Invalid query embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${queryEmbedding.length}`
      );
    }

    const index = await getIndex();

    log(`Searching for ${topK} similar FAQs (minScore: ${minScore})`);

    // Query Pinecone
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    // Filter by minimum score and format results
    const results: SearchResult[] = queryResponse.matches
      .filter((match: any) => match.score >= minScore)
      .map((match: any) => ({
        faqId: match.metadata?.faqId || parseInt(match.id.replace('faq-', '')),
        score: match.score,
        metadata: match.metadata,
      }));

    log(`Found ${results.length} similar FAQs`);
    return results;
  } catch (error) {
    log(`Error searching similar FAQs: ${error}`, 'error');
    throw error;
  }
}

/**
 * Delete an FAQ embedding from Pinecone
 * 
 * @param faqId - FAQ ID to delete
 * @returns Success status
 */
export async function deleteFAQEmbedding(faqId: number): Promise<{ success: boolean }> {
  try {
    const index = await getIndex();

    log(`Deleting FAQ ${faqId} from Pinecone`);

    await index.deleteOne(`faq-${faqId}`);

    log(`Successfully deleted FAQ ${faqId}`);
    return { success: true };
  } catch (error) {
    log(`Error deleting FAQ ${faqId}: ${error}`, 'error');
    throw error;
  }
}

/**
 * Delete multiple FAQ embeddings in batch
 * 
 * @param faqIds - Array of FAQ IDs to delete
 * @returns Success count and error count
 */
export async function deleteFAQEmbeddingsBatch(
  faqIds: number[]
): Promise<{ successful: number; failed: number }> {
  try {
    const index = await getIndex();
    let successful = 0;
    let failed = 0;

    log(`Deleting ${faqIds.length} embeddings`);

    const vectorIds = faqIds.map(id => `faq-${id}`);

    try {
      await index.deleteMany(vectorIds);
      successful = faqIds.length;
      log(`Successfully deleted ${successful} embeddings`);
    } catch (batchError) {
      log(`Batch delete failed: ${batchError}`, 'error');
      failed = faqIds.length;
    }

    return { successful, failed };
  } catch (error) {
    log(`Error in batch delete: ${error}`, 'error');
    throw error;
  }
}

/**
 * Get index statistics
 * 
 * @returns Index stats including dimension, vector count, etc.
 */
export async function getIndexStats(): Promise<any> {
  try {
    const index = await getIndex();

    log('Fetching index statistics...');

    const stats = await index.describeIndexStats();

    log(`Index stats: ${JSON.stringify(stats)}`);
    return stats;
  } catch (error) {
    log(`Error getting index stats: ${error}`, 'error');
    throw error;
  }
}

/**
 * Fetch a vector by ID
 * 
 * @param faqId - FAQ ID
 * @returns Vector data with metadata
 */
export async function fetchVector(faqId: number): Promise<any> {
  try {
    const index = await getIndex();

    log(`Fetching vector for FAQ ${faqId}`);

    const response = await index.fetch([`faq-${faqId}`]);

    log(`Successfully fetched vector for FAQ ${faqId}`);
    return response;
  } catch (error) {
    log(`Error fetching vector for FAQ ${faqId}: ${error}`, 'error');
    throw error;
  }
}

/**
 * Update vector metadata
 * 
 * @param faqId - FAQ ID
 * @param embedding - Embedding vector
 * @param metadata - New metadata
 * @returns Success status
 */
export async function updateVectorMetadata(
  faqId: number,
  embedding: number[],
  metadata: UpsertOptions
): Promise<{ success: boolean }> {
  try {
    const index = await getIndex();

    log(`Updating metadata for FAQ ${faqId}`);

    await index.update({
      id: `faq-${faqId}`,
      values: embedding,
      metadata,
    });

    log(`Successfully updated metadata for FAQ ${faqId}`);
    return { success: true };
  } catch (error) {
    log(`Error updating metadata for FAQ ${faqId}: ${error}`, 'error');
    throw error;
  }
}

/**
 * Clear all vectors from index (use with caution!)
 * 
 * @returns Success status
 */
export async function clearIndex(): Promise<{ success: boolean }> {
  try {
    const index = await getIndex();

    log('WARNING: Clearing all vectors from index');

    await index.deleteAll();

    log('Successfully cleared index');
    return { success: true };
  } catch (error) {
    log(`Error clearing index: ${error}`, 'error');
    throw error;
  }
}

/**
 * Health check - verify Pinecone connection
 * 
 * @returns Health status
 */
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
  try {
    log('Running health check...');

    const index = await getIndex();
    const stats = await index.describeIndexStats();

    log('Health check passed');
    return {
      healthy: true,
      message: `Connected to ${PINECONE_INDEX_NAME}. Vectors: ${stats.totalVectorCount}`,
    };
  } catch (error) {
    log(`Health check failed: ${error}`, 'error');
    return {
      healthy: false,
      message: `Connection failed: ${error}`,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type VectorDbService = typeof upsertFAQEmbedding;
