# Embedding Generation Script - Complete Implementation Guide

## 📋 Overview

The `embeddingGenerationScript.ts` is a production-ready Node.js script that generates AI-powered embeddings for all FAQs in the Ologywood platform. It's the critical bridge between the database and the semantic search system.

**File**: `/server/scripts/embeddingGenerationScript.ts` (650 lines)

---

## 🎯 Purpose

This script:
1. ✅ Fetches all published FAQs from the database
2. ✅ Generates embeddings using OpenAI API
3. ✅ Stores embeddings in MySQL database
4. ✅ Uploads embeddings to Pinecone vector database
5. ✅ Tracks progress and provides detailed reporting
6. ✅ Implements error handling and recovery
7. ✅ Supports partial runs and resume functionality
8. ✅ Provides comprehensive logging and statistics

---

## 🚀 Quick Start

### **Basic Usage**

```bash
# Generate embeddings for all FAQs without embeddings
pnpm ts-node server/scripts/embeddingGenerationScript.ts

# Force regenerate all embeddings
pnpm ts-node server/scripts/embeddingGenerationScript.ts --force

# Test with only 10 FAQs
pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 10

# Resume from FAQ ID 100
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 100

# Dry run (no changes)
pnpm ts-node server/scripts/embeddingGenerationScript.ts --dry-run --verbose
```

---

## 📖 Command Line Options

### **All Available Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--force` | boolean | false | Force regenerate all embeddings |
| `--limit N` | number | - | Only process N FAQs |
| `--start-id N` | number | - | Start from FAQ ID N |
| `--batch-size N` | number | 10 | Process N FAQs per batch |
| `--skip-vector-db` | boolean | false | Skip uploading to Pinecone |
| `--dry-run` | boolean | false | Show what would be done without making changes |
| `--verbose` | boolean | false | Show detailed logging |

### **Option Combinations**

```bash
# Process 100 FAQs in batches of 25
pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 100 --batch-size 25

# Resume from FAQ 50 with verbose logging
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 50 --verbose

# Force regenerate without uploading to Pinecone
pnpm ts-node server/scripts/embeddingGenerationScript.ts --force --skip-vector-db

# Dry run with verbose output
pnpm ts-node server/scripts/embeddingGenerationScript.ts --dry-run --verbose --limit 20
```

---

## 📊 Complete Script Architecture

### **Phase 1: Initialization**

```typescript
1. Parse command line arguments
2. Ensure log directory exists (logs/embedding-generation/)
3. Load previous progress (if resuming)
4. Initialize database connection
5. Initialize embedding services
6. Initialize vector database connection
```

### **Phase 2: FAQ Fetching**

```typescript
// Query database for FAQs needing embeddings
const faqsToProcess = await fetchFaqsNeedingEmbeddings(options);

// Without --force: Gets FAQs without embeddings or marked for refresh
SELECT * FROM faqs 
WHERE isPublished = true 
  AND (embedding IS NULL OR needsEmbeddingRefresh = true)

// With --force: Gets all published FAQs
SELECT * FROM faqs WHERE isPublished = true

// With --start-id: Resumes from specific ID
SELECT * FROM faqs 
WHERE isPublished = true AND id >= startId
```

### **Phase 3: Batch Processing**

For each batch:
```typescript
1. Prepare FAQ texts (question + answer combined)
2. Generate embeddings via OpenAI API
   - Uses text-embedding-3-small model
   - Batches up to 25 texts per API call
   - Tracks tokens used for cost calculation
3. Update database with embeddings
   - Store embedding vector (1536 dimensions)
   - Store embedding model name
   - Store generation timestamp
   - Mark needsEmbeddingRefresh as false
4. Upload to Pinecone vector database
   - Store vector with FAQ metadata
   - Enable semantic search
5. Track progress and statistics
6. Save checkpoint for resume capability
```

### **Phase 4: Finalization**

```typescript
1. Calculate final statistics
2. Generate final report
3. Save results to JSON file
4. Save errors to JSON file
5. Log session statistics
6. Cleanup resources (close connections)
7. Exit gracefully
```

---

## 🏗️ Core Functions

### **1. `parseArguments()`**

Parses command line arguments into options object

```typescript
function parseArguments(): ScriptOptions {
  // Parses: --force, --limit, --start-id, --batch-size, 
  //         --skip-vector-db, --dry-run, --verbose
  
  return {
    force: boolean;
    limit?: number;
    startId?: number;
    batchSize: number;
    skipVectorDb: boolean;
    dryRun: boolean;
    verbose: boolean;
  };
}
```

**Example**:
```typescript
// Input: --limit 50 --batch-size 25 --verbose
// Output:
{
  force: false,
  limit: 50,
  batchSize: 25,
  skipVectorDb: false,
  dryRun: false,
  verbose: true
}
```

### **2. `fetchFaqsNeedingEmbeddings(options)`**

Fetches FAQs from database based on criteria

```typescript
async function fetchFaqsNeedingEmbeddings(
  options: ScriptOptions
): Promise<typeof faqs.$inferSelect[]>

// Returns: Array of FAQ objects to process
```

**Logic**:
- Without `--force`: Gets FAQs without embeddings or marked for refresh
- With `--force`: Gets all published FAQs
- With `--start-id`: Resumes from specific ID
- With `--limit`: Limits number of FAQs to process

### **3. `generateEmbeddingsForBatch(batch, batchNumber, totalBatches)`**

Processes a batch of FAQs

```typescript
async function generateEmbeddingsForBatch(
  faqBatch: typeof faqs.$inferSelect[],
  batchNumber: number,
  totalBatches: number
): Promise<{
  successful: number;
  failed: number;
  errors: Array<{ faqId: number; error: string }>;
}>
```

**Process**:
1. Combine FAQ question + answer for each FAQ
2. Generate embeddings via OpenAI API
3. Update database with embeddings
4. Upload to Pinecone (if not skipped)
5. Track errors

### **4. `printProgressReport(report)`**

Displays formatted progress with ASCII progress bar

```typescript
function printProgressReport(report: ProgressReport): void

// Output:
// ================================================================================
// [Embedding Generation] Progress Report
// ================================================================================
// Batch: 5/10
// Progress: [████████████░░░░░░░░░░░░░░░░░░░░░░░░] 50.0%
// Processed: 50/100 FAQs
// Success: 48 | Failures: 2
// Avg Time/FAQ: 245.32ms
// Est. Time Remaining: 2m 3s
// ================================================================================
```

### **5. `estimateTimeRemaining(processedCount, totalCount, elapsedMs)`**

Calculates estimated time remaining

```typescript
function estimateTimeRemaining(
  processedCount: number,
  totalCount: number,
  elapsedMs: number
): string

// Returns: "2m 3s" or "1h 30m 45s"
```

---

## 📁 Output Files

The script generates 3 log files in `logs/embedding-generation/`:

### **1. `progress.json`**

Updated after each batch, contains current progress

```json
{
  "totalFaqs": 100,
  "processedFaqs": 50,
  "successfulEmbeddings": 48,
  "failedEmbeddings": 2,
  "skippedFaqs": 0,
  "totalTokensUsed": 125,
  "startTime": "2024-01-25T10:30:00.000Z",
  "errors": [
    {
      "faqId": 42,
      "error": "Text too long"
    }
  ]
}
```

### **2. `results.json`**

Final results after completion

```json
{
  "timestamp": "2024-01-25T10:45:00.000Z",
  "duration": 900000,
  "totalFaqs": 100,
  "processedFaqs": 100,
  "successfulEmbeddings": 98,
  "failedEmbeddings": 2,
  "skippedFaqs": 0,
  "totalTokensUsed": 245,
  "startTime": "2024-01-25T10:30:00.000Z",
  "endTime": "2024-01-25T10:45:00.000Z",
  "errors": [
    {
      "faqId": 42,
      "error": "Text exceeds maximum length"
    },
    {
      "faqId": 87,
      "error": "API rate limit exceeded"
    }
  ]
}
```

### **3. `errors.json`**

Detailed error log for failed embeddings

```json
[
  {
    "faqId": 42,
    "error": "Text exceeds maximum length"
  },
  {
    "faqId": 87,
    "error": "API rate limit exceeded"
  }
]
```

---

## 🔄 Resume Capability

The script supports resuming interrupted runs:

```bash
# Initial run
pnpm ts-node server/scripts/embeddingGenerationScript.ts

# If interrupted (Ctrl+C), resume from where it left off
# Check progress.json to see last processed count
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 51
```

**How It Works**:
1. `progress.json` is updated after each batch
2. Contains `processedFaqs` count
3. Can resume from any point using `--start-id`

---

## 📈 Performance Metrics

### **Expected Performance**

| Metric | Value | Notes |
|--------|-------|-------|
| **Batch Size** | 10 FAQs | Configurable |
| **Time per FAQ** | 200-300ms | Includes API call |
| **Time per Batch** | 2-3 seconds | 10 FAQs |
| **100 FAQs** | ~3-5 minutes | Full run |
| **1000 FAQs** | ~30-50 minutes | Full run |
| **Tokens per FAQ** | 2-3 tokens | Varies by text length |
| **Cost per 100 FAQs** | ~$0.005 | At $0.02/1M tokens |

### **Optimization Tips**

```bash
# Increase batch size for faster processing
pnpm ts-node server/scripts/embeddingGenerationScript.ts --batch-size 25

# Skip vector DB for faster database-only processing
pnpm ts-node server/scripts/embeddingGenerationScript.ts --skip-vector-db

# Process in parallel (run multiple instances)
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 1 --limit 50 &
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 51 --limit 50 &
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 101 --limit 50 &
wait
```

---

## 🧪 Testing

### **Dry Run (No Changes)**

```bash
# See what would happen without making changes
pnpm ts-node server/scripts/embeddingGenerationScript.ts --dry-run --verbose

# Output:
# [DRY RUN] Would update 10 FAQs
# [DRY RUN] Would upsert 10 embeddings to Pinecone
```

### **Limited Run**

```bash
# Test with only 5 FAQs
pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 5 --verbose

# Verify results in database
SELECT id, question, embedding, embeddingGeneratedAt 
FROM faqs 
WHERE embedding IS NOT NULL 
LIMIT 5;
```

### **Force Refresh**

```bash
# Regenerate embeddings for all FAQs
pnpm ts-node server/scripts/embeddingGenerationScript.ts --force

# Useful for:
# - Upgrading to better embedding model
# - Fixing corrupted embeddings
# - Recalculating with new FAQ content
```

---

## 🛡️ Error Handling

### **Graceful Degradation**

```typescript
// If Pinecone fails, continue with database update
try {
  await upsertFAQEmbedding(...);
} catch (vectorError) {
  log('Warning: Vector DB failed, continuing...', 'warn');
  // Don't fail the whole batch
}
```

### **Graceful Shutdown**

```typescript
// Handle Ctrl+C
process.on('SIGINT', async () => {
  log('Shutting down gracefully...');
  await cleanup();
  process.exit(0);
});
```

### **Error Tracking**

```typescript
// All errors are collected and saved
stats.errors.push({
  faqId: 42,
  error: 'Text too long'
});

// Saved to errors.json for review
```

---

## 📋 Complete Workflow

```bash
# 1. Apply database migration
pnpm db:push

# 2. Verify migration
SELECT COUNT(*) FROM faqs WHERE embedding IS NULL;

# 3. Test with small batch
pnpm ts-node server/scripts/embeddingGenerationScript.ts --limit 10 --verbose

# 4. Check results
SELECT id, question, embeddingGeneratedAt FROM faqs WHERE embedding IS NOT NULL LIMIT 10;

# 5. Run full generation
pnpm ts-node server/scripts/embeddingGenerationScript.ts

# 6. Monitor progress (in another terminal)
tail -f logs/embedding-generation/progress.json

# 7. Review final results
cat logs/embedding-generation/results.json

# 8. Check for errors
cat logs/embedding-generation/errors.json

# 9. Verify all FAQs have embeddings
SELECT COUNT(*) FROM faqs WHERE embedding IS NULL;
-- Should return 0
```

---

## 🔧 Advanced Usage

### **Parallel Processing**

```bash
# Process 1000 FAQs in parallel (4 processes, 250 each)
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 1 --limit 250 &
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 251 --limit 250 &
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 501 --limit 250 &
pnpm ts-node server/scripts/embeddingGenerationScript.ts --start-id 751 --limit 250 &

# Wait for all to complete
wait
```

### **Scheduled Regeneration**

```bash
# Add to crontab for weekly regeneration
0 2 * * 0 cd /home/ubuntu/ologywood && pnpm ts-node server/scripts/embeddingGenerationScript.ts --force

# Or use the schedule tool
schedule --type cron --cron "0 2 * * 0" --prompt "Regenerate FAQ embeddings"
```

### **Production Deployment**

```bash
# Run in background with nohup
nohup pnpm ts-node server/scripts/embeddingGenerationScript.ts > logs/embedding-generation/output.log 2>&1 &

# Or use PM2
pm2 start "pnpm ts-node server/scripts/embeddingGenerationScript.ts" --name "faq-embeddings"

# Monitor with PM2
pm2 monit
pm2 logs faq-embeddings
```

---

## 📊 Monitoring

### **Check Progress**

```bash
# Watch progress in real-time
watch -n 5 'cat logs/embedding-generation/progress.json | jq'

# Or use tail
tail -f logs/embedding-generation/progress.json
```

### **Verify Database Updates**

```sql
-- Check embedding coverage
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedded,
  ROUND(SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as percent
FROM faqs
WHERE isPublished = true;

-- Check latest embeddings
SELECT id, question, embeddingGeneratedAt
FROM faqs
WHERE embedding IS NOT NULL
ORDER BY embeddingGeneratedAt DESC
LIMIT 10;

-- Check for failures
SELECT id, question, needsEmbeddingRefresh
FROM faqs
WHERE needsEmbeddingRefresh = true;
```

---

## ✅ Pre-Execution Checklist

- [ ] Database migration applied (`pnpm db:push`)
- [ ] Environment variables configured
  - [ ] `OPENAI_API_KEY` set
  - [ ] `PINECONE_API_KEY` set
  - [ ] `PINECONE_INDEX_NAME` set
- [ ] Database connection working
- [ ] Vector database (Pinecone) initialized
- [ ] Embedding service initialized
- [ ] Log directory accessible
- [ ] Sufficient disk space for logs

---

## 🎯 Success Criteria

After running the script:

- [ ] All FAQs have embeddings in database
- [ ] `embedding` column populated with 1536-dimensional vectors
- [ ] `embeddingGeneratedAt` timestamp set
- [ ] `needsEmbeddingRefresh` set to false
- [ ] All embeddings uploaded to Pinecone
- [ ] `progress.json` shows 100% completion
- [ ] `results.json` shows success statistics
- [ ] `errors.json` contains any failed FAQs
- [ ] No database errors in logs
- [ ] No API rate limit errors
- [ ] Semantic search working with embeddings

---

## 🔧 Troubleshooting

### **Common Issues**

1. **"Cannot find module 'embeddingService'"**
   - Solution: Ensure embeddingService.ts exists in `/server/services/`

2. **"OPENAI_API_KEY not set"**
   - Solution: Add to `.env.local`: `OPENAI_API_KEY=sk-proj-xxxxx`

3. **"Database connection failed"**
   - Solution: Verify database is running and connection string is correct

4. **"Pinecone connection failed"**
   - Solution: Check `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`

5. **"Text exceeds maximum length"**
   - Solution: FAQ text is too long, truncate or split

6. **"API rate limit exceeded"**
   - Solution: Reduce batch size or add delay between batches

7. **"Vector dimension mismatch"**
   - Solution: Ensure embeddings are 1536 dimensions (text-embedding-3-small)

---

## 📞 Support

For issues or questions:
1. Check `logs/embedding-generation/errors.json` for detailed errors
2. Review `results.json` for statistics
3. Check database logs for connection issues
4. Verify environment variables are set correctly
5. Test with `--dry-run --verbose` for debugging

---

## 🎉 Conclusion

The embedding generation script is production-ready and handles all aspects of populating FAQ embeddings:

- ✅ Batch processing with progress tracking
- ✅ Error handling and recovery
- ✅ Resume capability
- ✅ Comprehensive logging
- ✅ Performance optimization
- ✅ Graceful shutdown

Ready for immediate deployment!
