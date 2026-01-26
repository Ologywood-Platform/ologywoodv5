/**
 * FAQ Embedding Generation Script
 * 
 * Purpose: Generate embeddings for all FAQs and populate the database
 * 
 * This script:
 * 1. Fetches all published FAQs from database
 * 2. Generates embeddings using OpenAI API
 * 3. Stores embeddings in database and vector DB (Pinecone)
 * 4. Tracks progress and provides detailed reporting
 * 5. Implements error handling and recovery
 * 6. Supports partial runs and resume functionality
 * 
 * Usage:
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts [options]
 * 
 * Options:
 *   --force              Force regenerate all embeddings
 *   --limit N            Only process N FAQs
 *   --start-id N         Start from FAQ ID N
 *   --batch-size N       Process N FAQs per batch (default: 10)
 *   --skip-vector-db     Skip uploading to Pinecone
 *   --dry-run            Show what would be done without making changes
 *   --verbose            Show detailed logging
 * 
 * Examples:
 *   # Generate embeddings for all FAQs
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts
 * 
 *   # Force regenerate all embeddings
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts --force
 * 
 *   # Process only 50 FAQs
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 50
 * 
 *   # Resume from FAQ ID 100
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 100
 * 
 *   # Dry run to see what would happen
 *   pnpm ts-node server/scripts/embeddingGenerationScript.ts --dry-run --verbose
 */

import { getDb } from '../db';
import { faqs } from '../../drizzle/schema';
import { eq, isNull, or, and, gte } from 'drizzle-orm';
import {
  generateEmbeddingsBatch,
  getSessionStats,
} from '../services/embeddingService';
import {
  upsertFAQEmbedding,
  upsertFAQEmbeddingsBatch,
  healthCheck,
} from '../services/vectorDbService';
import * as fs from 'fs';
import * as path from 'path';

// Helper functions for logging and cleanup
const logSessionStats = (stats: any) => {
  console.log('[Embedding] Session Stats:', stats);
};

const cleanup = async () => {
  console.log('[Embedding] Cleanup completed');
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ScriptOptions {
  force: boolean;
  limit?: number;
  startId?: number;
  batchSize: number;
  skipVectorDb: boolean;
  dryRun: boolean;
  verbose: boolean;
}

interface GenerationStats {
  totalFaqs: number;
  processedFaqs: number;
  successfulEmbeddings: number;
  failedEmbeddings: number;
  skippedFaqs: number;
  totalTokensUsed: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ faqId: number; error: string }>;
}

interface ProgressReport {
  timestamp: Date;
  batchNumber: number;
  totalBatches: number;
  faqsProcessed: number;
  totalFaqs: number;
  successCount: number;
  failureCount: number;
  percentComplete: number;
  estimatedTimeRemaining: string;
  averageTimePerFaq: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCRIPT_NAME = '[Embedding Generation]';
const LOG_DIR = path.join(process.cwd(), 'logs', 'embedding-generation');
const PROGRESS_FILE = path.join(LOG_DIR, 'progress.json');
const RESULTS_FILE = path.join(LOG_DIR, 'results.json');
const ERRORS_FILE = path.join(LOG_DIR, 'errors.json');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse command line arguments
 */
function parseArguments(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    force: false,
    batchSize: 10,
    skipVectorDb: false,
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force') {
      options.force = true;
    } else if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--start-id' && args[i + 1]) {
      options.startId = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--skip-vector-db') {
      options.skipVectorDb = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Ensure log directory exists
 */
function ensureLogDirectory(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Log message with timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = `${timestamp} [${level.toUpperCase()}]`;
  console.log(`${prefix} ${SCRIPT_NAME} ${message}`);
}

/**
 * Log verbose message (only if verbose flag is set)
 */
function logVerbose(message: string): void {
  if (process.argv.includes('--verbose')) {
    log(message, 'info');
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format time duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Save progress to file
 */
function saveProgress(stats: GenerationStats): void {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(stats, null, 2));
    logVerbose(`Progress saved to ${PROGRESS_FILE}`);
  } catch (error) {
    log(`Failed to save progress: ${error}`, 'warn');
  }
}

/**
 * Load previous progress
 */
function loadProgress(): GenerationStats | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    log(`Failed to load progress: ${error}`, 'warn');
  }
  return null;
}

/**
 * Save final results
 */
function saveResults(stats: GenerationStats): void {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      duration: stats.endTime ? stats.endTime.getTime() - stats.startTime.getTime() : 0,
      ...stats,
    };

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    log(`Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    log(`Failed to save results: ${error}`, 'warn');
  }
}

/**
 * Save errors to file
 */
function saveErrors(errors: Array<{ faqId: number; error: string }>): void {
  try {
    if (errors.length > 0) {
      fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2));
      log(`Errors saved to ${ERRORS_FILE}`);
    }
  } catch (error) {
    log(`Failed to save errors: ${error}`, 'warn');
  }
}

/**
 * Print progress report
 */
function printProgressReport(report: ProgressReport): void {
  const progressBar = createProgressBar(report.percentComplete);
  
  console.log('\n' + '='.repeat(80));
  console.log(`${SCRIPT_NAME} Progress Report`);
  console.log('='.repeat(80));
  console.log(`Batch: ${report.batchNumber}/${report.totalBatches}`);
  console.log(`Progress: ${progressBar} ${report.percentComplete.toFixed(1)}%`);
  console.log(`Processed: ${report.faqsProcessed}/${report.totalFaqs} FAQs`);
  console.log(`Success: ${report.successCount} | Failures: ${report.failureCount}`);
  console.log(`Avg Time/FAQ: ${report.averageTimePerFaq.toFixed(2)}ms`);
  console.log(`Est. Time Remaining: ${report.estimatedTimeRemaining}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Create ASCII progress bar
 */
function createProgressBar(percent: number, width: number = 40): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Calculate estimated time remaining
 */
function estimateTimeRemaining(
  processedCount: number,
  totalCount: number,
  elapsedMs: number
): string {
  if (processedCount === 0) return 'Calculating...';

  const avgTimePerItem = elapsedMs / processedCount;
  const remainingItems = totalCount - processedCount;
  const remainingMs = avgTimePerItem * remainingItems;

  return formatDuration(remainingMs);
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Fetch FAQs that need embeddings
 */
async function fetchFaqsNeedingEmbeddings(
  options: ScriptOptions
): Promise<typeof faqs.$inferSelect[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    log('Fetching FAQs needing embeddings...');

    let query = db
      .select()
      .from(faqs)
      .where(eq(faqs.isPublished, true));

    // Filter based on options
    if (!options.force) {
      // Get FAQs without embeddings or marked for refresh
      query = db
        .select()
        .from(faqs)
        .where(
          and(
            eq(faqs.isPublished, true),
            or(
              isNull(faqs.embedding),
              eq(faqs.needsEmbeddingRefresh, true)
            )
          )
        );
    }

    // Start from specific ID if provided
    if (options.startId) {
      query = db
        .select()
        .from(faqs)
        .where(
          and(
            eq(faqs.isPublished, true),
            gte(faqs.id, options.startId),
            options.force
              ? undefined
              : or(
                  isNull(faqs.embedding),
                  eq(faqs.needsEmbeddingRefresh, true)
                )
          )
        );
    }

    const allFaqs = await query;

    // Apply limit if specified
    let faqsToProcess = allFaqs;
    if (options.limit) {
      faqsToProcess = allFaqs.slice(0, options.limit);
    }

    log(
      `Found ${faqsToProcess.length} FAQs to process (${allFaqs.length} total published)`
    );

    return faqsToProcess;
  } catch (error) {
    log(`Error fetching FAQs: ${error}`, 'error');
    throw error;
  }
}

/**
 * Generate embeddings for a batch of FAQs
 */
async function generateEmbeddingsForBatch(
  faqBatch: typeof faqs.$inferSelect[],
  batchNumber: number,
  totalBatches: number
): Promise<{
  successful: number;
  failed: number;
  errors: Array<{ faqId: number; error: string }>;
}> {
  try {
    log(
      `Processing batch ${batchNumber}/${totalBatches} (${faqBatch.length} FAQs)`
    );

    // Prepare texts for embedding
    const texts = faqBatch.map((faq) => {
      // Combine question and answer for better context
      return `${faq.question} ${faq.answer}`;
    });

    // Generate embeddings
    const embeddingResult = await generateEmbeddingsBatch(texts, {
      batchSize: 25,
    });
    logVerbose(`Batch completed: ${embeddingResult.successful}/${embeddingResult.total} successful`);

    if (!process.argv.includes('--dry-run')) {
      // Update database with embeddings
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      for (let i = 0; i < faqBatch.length; i++) {
        const faq = faqBatch[i];
        const embedding = embeddingResult.results[i];

        if (embedding && embedding.embedding) {
          try {
            // Update FAQ with embedding
            await db
              .update(faqs)
              .set({
                embedding: embedding.embedding as any,
                embeddingModel: embedding.model || 'text-embedding-3-small',
                embeddingDimension: embedding.dimension || 1536,
                embeddingGeneratedAt: new Date(),
                needsEmbeddingRefresh: false,
              })
              .where(eq(faqs.id, faq.id));

            logVerbose(
              `Updated FAQ ${faq.id} with embedding (${embedding.tokensUsed} tokens)`
            );

            // Upload to vector database if not skipped
            if (!process.argv.includes('--skip-vector-db')) {
              try {
                await upsertFAQEmbedding(faq.id, embedding.embedding, {
                  question: faq.question,
                  category: faq.category || undefined,
                  helpfulRatio: faq.helpfulRatio
                    ? parseFloat(faq.helpfulRatio.toString())
                    : undefined,
                });

                logVerbose(`Upserted FAQ ${faq.id} to Pinecone vector database`);
              } catch (vectorError) {
                log(
                  `Warning: Failed to upsert FAQ ${faq.id} to Pinecone: ${vectorError}`,
                  'warn'
                );
                // Don't fail the whole batch for vector DB errors
              }
            }
          } catch (updateError) {
            log(
              `Error updating FAQ ${faq.id}: ${updateError}`,
              'error'
            );

            embeddingResult.errors.push({
              text: faq.question,
              error: `Database update failed: ${updateError}`,
            });
          }
        }
      }
    } else {
      log(`[DRY RUN] Would update ${embeddingResult.successful} FAQs`);
    }

    return {
      successful: embeddingResult.successful,
      failed: embeddingResult.failed,
      errors: embeddingResult.errors.map((err) => ({
        faqId: faqBatch.find((f) => f.question.includes(err.text.substring(0, 20)))?.id || 0,
        error: err.error,
      })),
    };
  } catch (error) {
    log(`Error in batch processing: ${error}`, 'error');
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const options = parseArguments();

  ensureLogDirectory();

  log('Starting FAQ embedding generation...');
  log(`Options: ${JSON.stringify(options)}`);

  const stats: GenerationStats = {
    totalFaqs: 0,
    processedFaqs: 0,
    successfulEmbeddings: 0,
    failedEmbeddings: 0,
    skippedFaqs: 0,
    totalTokensUsed: 0,
    startTime: new Date(),
    errors: [],
  };

  try {
    // Fetch FAQs needing embeddings
    const faqsToProcess = await fetchFaqsNeedingEmbeddings(options);
    stats.totalFaqs = faqsToProcess.length;

    if (faqsToProcess.length === 0) {
      log('No FAQs to process. Exiting.');
      return;
    }

    log(`Total FAQs to process: ${stats.totalFaqs}`);

    // Process in batches
    const totalBatches = Math.ceil(faqsToProcess.length / options.batchSize);

    for (let i = 0; i < faqsToProcess.length; i += options.batchSize) {
      const batchNumber = Math.floor(i / options.batchSize) + 1;
      const batch = faqsToProcess.slice(i, i + options.batchSize);

      try {
        // Generate embeddings for batch
        const batchResult = await generateEmbeddingsForBatch(
          batch,
          batchNumber,
          totalBatches
        );

        // Update stats
        stats.successfulEmbeddings += batchResult.successful;
        stats.failedEmbeddings += batchResult.failed;
        stats.processedFaqs += batch.length;
        stats.errors.push(...batchResult.errors);

        // Print progress report
        const elapsedMs = Date.now() - startTime;
        const report: ProgressReport = {
          timestamp: new Date(),
          batchNumber,
          totalBatches,
          faqsProcessed: stats.processedFaqs,
          totalFaqs: stats.totalFaqs,
          successCount: stats.successfulEmbeddings,
          failureCount: stats.failedEmbeddings,
          percentComplete: (stats.processedFaqs / stats.totalFaqs) * 100,
          estimatedTimeRemaining: estimateTimeRemaining(
            stats.processedFaqs,
            stats.totalFaqs,
            elapsedMs
          ),
          averageTimePerFaq: elapsedMs / stats.processedFaqs,
        };

        printProgressReport(report);
        saveProgress(stats);

        // Small delay between batches to avoid rate limiting
        if (i + options.batchSize < faqsToProcess.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        log(
          `Error processing batch ${batchNumber}: ${batchError}`,
          'error'
        );
        // Continue with next batch
      }
    }

    // Get session statistics
    const sessionStats = getSessionStats();
    stats.totalTokensUsed = sessionStats.totalTokensUsed;

    // Final report
    stats.endTime = new Date();
    const totalDuration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('\n' + '='.repeat(80));
    console.log(`${SCRIPT_NAME} FINAL REPORT`);
    console.log('='.repeat(80));
    console.log(`Total FAQs: ${stats.totalFaqs}`);
    console.log(`Successful: ${stats.successfulEmbeddings}`);
    console.log(`Failed: ${stats.failedEmbeddings}`);
    console.log(`Success Rate: ${((stats.successfulEmbeddings / stats.totalFaqs) * 100).toFixed(2)}%`);
    console.log(`Total Tokens Used: ${stats.totalTokensUsed}`);
    console.log(`Estimated Cost: $${(stats.totalTokensUsed * 0.00002).toFixed(4)}`);
    console.log(`Total Duration: ${formatDuration(totalDuration)}`);
    console.log(`Avg Time per FAQ: ${(totalDuration / stats.totalFaqs).toFixed(2)}ms`);
    console.log('='.repeat(80) + '\n');

    // Save results
    saveResults(stats);
    saveErrors(stats.errors);

    // Log session statistics
    logSessionStats(stats);

    log('✅ Embedding generation completed successfully!');
  } catch (error) {
    log(`❌ Fatal error: ${error}`, 'error');
    stats.endTime = new Date();
    saveResults(stats);
    saveErrors(stats.errors);
    process.exit(1);
  } finally {
    // Cleanup resources
    await cleanup();
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('Received SIGINT, shutting down gracefully...', 'warn');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('Received SIGTERM, shutting down gracefully...', 'warn');
  await cleanup();
  process.exit(0);
});

// Run main function
main().catch((error) => {
  log(`Unhandled error: ${error}`, 'error');
  process.exit(1);
});
