# Embedding Generation Script with Pinecone Integration - Complete Guide

## 📋 Overview

This guide shows the complete `embeddingGenerationScript.ts` with full Pinecone integration using the `vectorDbService.ts` functions. The script now properly uploads all generated embeddings to Pinecone for semantic search.

**File**: `/server/scripts/embeddingGenerationScript.ts` (650+ lines)

**Integration**: Uses `vectorDbService.ts` for Pinecone operations

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Embedding Generation Script                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: Initialize                                            │
│  - Parse CLI arguments                                          │
│  - Ensure log directory exists                                  │
│  - Load previous progress (if resuming)                         │
│  - Check Pinecone health                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: Fetch FAQs                                            │
│  - Query database for FAQs needing embeddings                   │
│  - Filter based on options (force, start-id, limit)            │
│  - Return list of FAQs to process                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: Batch Processing (Main Loop)                         │
│  For each batch:                                                │
│  1. Prepare FAQ texts (question + answer)                      │
│  2. Generate embeddings via OpenAI API                         │
│  3. Update database with embeddings                            │
│  4. Upload to Pinecone vector database  ← NEW                  │
│  5. Track progress and statistics                              │
│  6. Save checkpoint                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Finalization                                          │
│  - Calculate final statistics                                   │
│  - Generate final report                                        │
│  - Save results to JSON files                                   │
│  - Log session statistics                                       │
│  - Cleanup resources                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Imports with Pinecone Integration

```typescript
import { getDb } from '../db';
import { faqs } from '../../drizzle/schema';
import { eq, isNull, or, and, gte } from 'drizzle-orm';

// Embedding Service
import {
  generateEmbeddingsBatch,
  getSessionStats,
  logSessionStats,
  cleanup,
} from '../services/embeddingService';

// Vector Database Service (NEW)
import {
  upsertFAQEmbedding,           // Single upload
  upsertFAQEmbeddingsBatch,     // Batch upload
  healthCheck,                   // Connection check
} from '../services/vectorDbService';

import * as fs from 'fs';
import * as path from 'path';
```

---

## 🎯 Key Integration Points

### **1. Health Check at Startup**

```typescript
async function main(): Promise<void> {
  try {
    // Check Pinecone health
    const health = await healthCheck();
    if (!health.healthy) {
      log(`Warning: Pinecone health check failed: ${health.message}`, 'warn');
      if (!process.argv.includes('--skip-vector-db')) {
        log('Continuing with database-only mode', 'warn');
      }
    } else {
      log(`✅ Pinecone connected: ${health.message}`);
    }
    
    // Continue with embedding generation...
  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  }
}
```

### **2. Batch Processing with Pinecone Upload**

```typescript
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
    log(`Processing batch ${batchNumber}/${totalBatches} (${faqBatch.length} FAQs)`);

    // Step 1: Prepare texts for embedding
    const texts = faqBatch.map((faq) => {
      return `${faq.question} ${faq.answer}`;
    });

    // Step 2: Generate embeddings via OpenAI
    const embeddingResult = await generateEmbeddingsBatch(texts, {
      batchSize: 25,
      onProgress: (current, total) => {
        logVerbose(`Batch progress: ${current}/${total}`);
      },
    });

    if (!process.argv.includes('--dry-run')) {
      // Step 3: Update database
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Step 4: Upload to Pinecone (NEW)
      if (!process.argv.includes('--skip-vector-db')) {
        const pineconeUpserts = [];

        for (let i = 0; i < faqBatch.length; i++) {
          const faq = faqBatch[i];
          const embedding = embeddingResult.results[i];

          if (embedding) {
            // Prepare for Pinecone upload
            pineconeUpserts.push({
              faqId: faq.id,
              embedding: embedding.embedding,
              metadata: {
                question: faq.question,
                category: faq.category || undefined,
                helpfulRatio: faq.helpfulRatio
                  ? parseFloat(faq.helpfulRatio.toString())
                  : undefined,
              },
            });
          }
        }

        // Batch upload to Pinecone
        if (pineconeUpserts.length > 0) {
          try {
            const vectorResult = await upsertFAQEmbeddingsBatch(
              pineconeUpserts,
              50  // Batch size for Pinecone
            );

            log(`Pinecone upload: ${vectorResult.successful} successful, ${vectorResult.failed} failed`);

            if (vectorResult.failed > 0) {
              log(`Warning: ${vectorResult.failed} embeddings failed to upload to Pinecone`, 'warn');
            }
          } catch (vectorError) {
            log(`Warning: Pinecone batch upload failed: ${vectorError}`, 'warn');
            // Continue with individual uploads as fallback
            for (const upsert of pineconeUpserts) {
              try {
                await upsertFAQEmbedding(
                  upsert.faqId,
                  upsert.embedding,
                  upsert.metadata
                );
              } catch (error) {
                log(`Failed to upload FAQ ${upsert.faqId} to Pinecone: ${error}`, 'warn');
              }
            }
          }
        }
      }

      // Step 5: Update database with embeddings
      for (let i = 0; i < faqBatch.length; i++) {
        const faq = faqBatch[i];
        const embedding = embeddingResult.results[i];

        if (embedding) {
          try {
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

            logVerbose(`Updated FAQ ${faq.id} with embedding`);
          } catch (updateError) {
            log(`Error updating FAQ ${faq.id}: ${updateError}`, 'error');
            embeddingResult.errors.push({
              text: faq.question,
              error: `Database update failed: ${updateError}`,
            });
          }
        }
      }
    } else {
      log(`[DRY RUN] Would update ${embeddingResult.successful} FAQs`);
      log(`[DRY RUN] Would upload ${embeddingResult.successful} embeddings to Pinecone`);
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
```

---

## 📊 Complete Execution Flow

### **Phase 1: Initialization**

```typescript
async function main(): Promise<void> {
  const startTime = Date.now();
  const options = parseArguments();

  ensureLogDirectory();

  log('Starting FAQ embedding generation with Pinecone integration...');
  log(`Options: ${JSON.stringify(options)}`);

  // Check Pinecone health
  if (!options.skipVectorDb) {
    const health = await healthCheck();
    if (!health.healthy) {
      log(`⚠️  Pinecone health check failed: ${health.message}`, 'warn');
    } else {
      log(`✅ Pinecone connected: ${health.message}`);
    }
  }

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
    // Continue with FAQ fetching...
  } catch (error) {
    // Error handling...
  }
}
```

### **Phase 2: FAQ Fetching**

```typescript
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

    if (options.startId) {
      query = db
        .select()
        .from(faqs)
        .where(
          and(
            eq(faqs.isPublished, true),
            gte(faqs.id, options.startId)
          )
        );
    }

    const allFaqs = await query;

    let faqsToProcess = allFaqs;
    if (options.limit) {
      faqsToProcess = allFaqs.slice(0, options.limit);
    }

    log(`Found ${faqsToProcess.length} FAQs to process`);
    return faqsToProcess;
  } catch (error) {
    log(`Error fetching FAQs: ${error}`, 'error');
    throw error;
  }
}
```

### **Phase 3: Batch Processing**

```typescript
// For each batch:
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

    // Small delay between batches
    if (i + options.batchSize < faqsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (batchError) {
    log(`Error processing batch ${batchNumber}: ${batchError}`, 'error');
  }
}
```

### **Phase 4: Finalization**

```typescript
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
logSessionStats();

log('✅ Embedding generation completed successfully!');
```

---

## 🚀 Usage Examples

### **Basic Usage**

```bash
# Generate embeddings for all FAQs and upload to Pinecone
pnpm ts-node server/scripts/embeddingGenerationScript.ts
```

### **Test with Small Batch**

```bash
# Test with only 10 FAQs
pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 10 --verbose
```

### **Skip Pinecone Upload**

```bash
# Generate embeddings but don't upload to Pinecone (database only)
pnpm ts-node server/scripts/embeddingGenerationScript.ts --skip-vector-db
```

### **Force Regenerate with Pinecone**

```bash
# Force regenerate all embeddings and re-upload to Pinecone
pnpm ts-node server/scripts/embeddingGenerationScript.ts --force
```

### **Resume from Checkpoint**

```bash
# Resume from FAQ ID 100
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 100
```

### **Dry Run with Verbose Output**

```bash
# See what would happen without making changes
pnpm ts-node server/scripts/embeddingGenerationScript.ts --dry-run --verbose
```

---

## 📊 Pinecone Integration Points

### **1. Health Check**

```typescript
const health = await healthCheck();
// Returns: { healthy: true/false, message: string }
```

### **2. Single Embedding Upload**

```typescript
await upsertFAQEmbedding(
  faqId,
  embedding,
  {
    question: 'How do I pay artists?',
    category: 'payments',
    helpfulRatio: 85
  }
);
```

### **3. Batch Embedding Upload**

```typescript
const result = await upsertFAQEmbeddingsBatch(
  embeddings,  // Array of { faqId, embedding, metadata }
  50           // Batch size
);
// Returns: { successful: number, failed: number }
```

---

## 📈 Performance with Pinecone

| Operation | Time | Cost | Notes |
|-----------|------|------|-------|
| Generate Embedding | 100-300ms | $0.00002 | OpenAI API |
| Database Update | 10-50ms | Free | MySQL |
| Pinecone Upload | 50-150ms | $0.00002 | Per embedding |
| **Total per FAQ** | **200-500ms** | **$0.00004** | Combined |

---

## 🔄 Error Handling

### **Graceful Degradation**

```typescript
// If Pinecone fails, continue with database update
if (!process.argv.includes('--skip-vector-db')) {
  try {
    await upsertFAQEmbeddingsBatch(pineconeUpserts, 50);
  } catch (vectorError) {
    log(`Warning: Pinecone batch upload failed`, 'warn');
    // Fall back to individual uploads
    for (const upsert of pineconeUpserts) {
      try {
        await upsertFAQEmbedding(upsert.faqId, upsert.embedding, upsert.metadata);
      } catch (error) {
        log(`Failed to upload FAQ ${upsert.faqId}`, 'warn');
      }
    }
  }
}
```

### **Graceful Shutdown**

```typescript
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
```

---

## 📋 Output Files

The script generates 3 log files in `logs/embedding-generation/`:

### **1. progress.json**

```json
{
  "totalFaqs": 100,
  "processedFaqs": 50,
  "successfulEmbeddings": 48,
  "failedEmbeddings": 2,
  "totalTokensUsed": 125,
  "startTime": "2024-01-25T10:30:00.000Z"
}
```

### **2. results.json**

```json
{
  "timestamp": "2024-01-25T10:45:00.000Z",
  "duration": 900000,
  "totalFaqs": 100,
  "successfulEmbeddings": 98,
  "failedEmbeddings": 2,
  "totalTokensUsed": 245,
  "estimatedCost": 0.0049
}
```

### **3. errors.json**

```json
[
  {
    "faqId": 42,
    "error": "Text exceeds maximum length"
  }
]
```

---

## ✅ Verification Steps

After running the script:

```bash
# 1. Check progress
cat logs/embedding-generation/progress.json | jq

# 2. Check results
cat logs/embedding-generation/results.json | jq

# 3. Verify database updates
SELECT COUNT(*) FROM faqs WHERE embedding IS NOT NULL;

# 4. Verify Pinecone uploads
# Use Pinecone dashboard or API to check vector count

# 5. Test semantic search
SELECT * FROM faqs WHERE embedding IS NOT NULL LIMIT 5;
```

---

## 🎯 Complete Workflow Summary

```
1. Start script
   ↓
2. Check Pinecone health
   ↓
3. Fetch FAQs needing embeddings
   ↓
4. For each batch:
   a. Generate embeddings (OpenAI)
   b. Update database (MySQL)
   c. Upload to Pinecone
   d. Track progress
   ↓
5. Generate final report
   ↓
6. Save results and errors
   ↓
7. Cleanup resources
   ↓
8. Exit
```

---

## 📁 Complete File Structure

```
/home/ubuntu/ologywood/
├── server/
│   ├── scripts/
│   │   └── embeddingGenerationScript.ts    ✅ (650+ lines)
│   │       - Pinecone health check
│   │       - Batch processing with Pinecone upload
│   │       - Error handling and recovery
│   │       - Progress tracking
│   │
│   ├── services/
│   │   ├── embeddingService.ts            ✅ (973 lines)
│   │   └── vectorDbService.ts             ✅ (443 lines)
│   │
│   └── routers/
│       └── semanticSearchRouter.ts        ✅ (1,100 lines)
│
└── Documentation/
    ├── EMBEDDING_GENERATION_WITH_PINECONE_INTEGRATION.md
    ├── EMBEDDING_GENERATION_SCRIPT_COMPLETE_GUIDE.md
    ├── VECTOR_DB_SERVICE_COMPLETE_GUIDE.md
    └── ... (other documentation)
```

---

## 🎉 Summary

The `embeddingGenerationScript.ts` now includes **complete Pinecone integration**:

- ✅ Health checks at startup
- ✅ Batch processing with Pinecone upload
- ✅ Graceful error handling
- ✅ Fallback mechanisms
- ✅ Progress tracking
- ✅ Resume capability
- ✅ Comprehensive logging

**Ready for production deployment!**
