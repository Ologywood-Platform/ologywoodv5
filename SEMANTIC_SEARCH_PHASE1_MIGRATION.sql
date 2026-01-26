-- ============================================================================
-- SEMANTIC SEARCH PHASE 1 MIGRATION
-- ============================================================================
-- 
-- Purpose: Add semantic search capabilities to the Ologywood platform
-- 
-- This migration:
-- 1. Adds 12 new columns to the FAQs table for semantic search
-- 2. Creates embeddingCache table for caching generated embeddings
-- 3. Creates semanticSearchLogs table for analytics
-- 4. Adds indexes for performance optimization
-- 5. Maintains backward compatibility (all new columns are nullable/have defaults)
--
-- Execution Time: ~2-5 seconds
-- Downtime: None (all operations are backward compatible)
-- Rollback: See ROLLBACK section at end of file
--
-- ============================================================================

-- ============================================================================
-- PHASE 1: ENHANCE FAQS TABLE WITH SEMANTIC SEARCH FIELDS
-- ============================================================================

-- Add embedding vector field (stores 1536-dimensional vector)
ALTER TABLE faqs 
ADD COLUMN embedding JSON 
DEFAULT (JSON_ARRAY())
COMMENT 'Vector representation of FAQ (1536 dimensions for text-embedding-3-small)';

-- Add embedding model tracking field
ALTER TABLE faqs 
ADD COLUMN embeddingModel VARCHAR(50) 
DEFAULT 'text-embedding-3-small'
COMMENT 'OpenAI model used to generate the embedding';

-- Add embedding dimension field
ALTER TABLE faqs 
ADD COLUMN embeddingDimension INT 
DEFAULT 1536
COMMENT 'Dimension of the embedding vector (1536 for text-embedding-3-small, 3072 for text-embedding-3-large)';

-- Add embedding generation timestamp
ALTER TABLE faqs 
ADD COLUMN embeddingGeneratedAt TIMESTAMP NULL
COMMENT 'Timestamp when the embedding was generated';

-- Add AI-generated semantic keywords
ALTER TABLE faqs 
ADD COLUMN semanticKeywords JSON 
DEFAULT (JSON_ARRAY())
COMMENT 'AI-generated keywords extracted from FAQ content for semantic understanding';

-- Add AI-classified semantic category
ALTER TABLE faqs 
ADD COLUMN semanticCategory VARCHAR(100) NULL
COMMENT 'AI-classified category for the FAQ (may differ from manual category)';

-- Add AI-generated semantic tags
ALTER TABLE faqs 
ADD COLUMN semanticTags JSON 
DEFAULT (JSON_ARRAY())
COMMENT 'AI-generated tags for improved searchability and categorization';

-- Add semantic search hit counter
ALTER TABLE faqs 
ADD COLUMN semanticSearchHits INT 
DEFAULT 0
COMMENT 'Number of times this FAQ was found via semantic search';

-- Add semantic search click counter
ALTER TABLE faqs 
ADD COLUMN semanticSearchClicks INT 
DEFAULT 0
COMMENT 'Number of times users clicked on this FAQ from semantic search results';

-- Add semantic search click-through rate
ALTER TABLE faqs 
ADD COLUMN semanticSearchCTR DECIMAL(5, 2) 
DEFAULT 0
COMMENT 'Click-through rate for semantic search (calculated as clicks/hits * 100)';

-- Add embedding quality score
ALTER TABLE faqs 
ADD COLUMN embeddingQualityScore DECIMAL(3, 2) NULL
COMMENT 'Quality score of the embedding (0-1), used to identify embeddings needing refresh';

-- Add flag to mark FAQs needing embedding refresh
ALTER TABLE faqs 
ADD COLUMN needsEmbeddingRefresh BOOLEAN 
DEFAULT FALSE
COMMENT 'Flag to indicate this FAQ needs its embedding regenerated';

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE (FAQs TABLE)
-- ============================================================================

-- Index for semantic category filtering
CREATE INDEX idx_faqs_semanticCategory 
ON faqs(semanticCategory);

-- Index for finding FAQs needing refresh
CREATE INDEX idx_faqs_needsEmbeddingRefresh 
ON faqs(needsEmbeddingRefresh);

-- Index for embedding generation timestamp (for batch operations)
CREATE INDEX idx_faqs_embeddingGeneratedAt 
ON faqs(embeddingGeneratedAt);

-- Index for semantic search hits (for trending FAQs)
CREATE INDEX idx_faqs_semanticSearchHits 
ON faqs(semanticSearchHits DESC);

-- Index for semantic search CTR (for quality metrics)
CREATE INDEX idx_faqs_semanticSearchCTR 
ON faqs(semanticSearchCTR DESC);

-- ============================================================================
-- PHASE 2: CREATE EMBEDDING CACHE TABLE
-- ============================================================================
--
-- Purpose: Cache generated embeddings to avoid regenerating the same text
-- 
-- Benefits:
-- - Reduces API calls to OpenAI
-- - Improves performance (cache hit: 10ms vs API call: 500ms)
-- - Reduces costs (80%+ savings typical)
-- - Enables LRU (Least Recently Used) eviction strategy
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS embeddingCache (
  -- Primary key
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incrementing primary key',

  -- Deduplication
  textHash VARCHAR(64) NOT NULL UNIQUE COMMENT 'SHA256 hash of text for deduplication',
  text LONGTEXT NOT NULL COMMENT 'Original text (for reference and debugging)',

  -- Embedding data
  embedding JSON NOT NULL COMMENT 'Generated embedding vector (1536 or 3072 dimensions)',
  model VARCHAR(50) NOT NULL COMMENT 'OpenAI model used (e.g., text-embedding-3-small)',
  dimension INT NOT NULL COMMENT 'Dimension of embedding (1536 or 3072)',

  -- Usage tracking (for LRU eviction)
  usageCount INT DEFAULT 1 COMMENT 'Number of times this embedding was retrieved',
  lastUsedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last time this cache entry was accessed',

  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this cache entry was created',

  -- Indexes for performance
  INDEX idx_embeddingCache_textHash (textHash),
  INDEX idx_embeddingCache_model (model),
  INDEX idx_embeddingCache_lastUsedAt (lastUsedAt),
  INDEX idx_embeddingCache_usageCount (usageCount DESC),
  INDEX idx_embeddingCache_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cache for generated text embeddings to reduce API calls and improve performance';

-- ============================================================================
-- PHASE 3: CREATE SEMANTIC SEARCH LOGS TABLE
-- ============================================================================
--
-- Purpose: Track all semantic search queries for analytics and optimization
-- 
-- Use cases:
-- - Track trending search queries
-- - Measure search quality (CTR, response time)
-- - Identify gaps in FAQ coverage
-- - Monitor fallback to keyword search
-- - User behavior analysis
-- - Performance monitoring
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS semanticSearchLogs (
  -- Primary key
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-incrementing primary key',

  -- User information
  userId INT COMMENT 'ID of user who performed the search',

  -- Search query information
  query VARCHAR(500) NOT NULL COMMENT 'The search query text',
  queryEmbedding JSON COMMENT 'Embedding of the search query (1536 dimensions)',

  -- Results information
  resultsCount INT DEFAULT 0 COMMENT 'Number of results returned to user',
  topResultId INT COMMENT 'FAQ ID of the top/best result',
  topResultScore DECIMAL(3, 2) COMMENT 'Similarity score of top result (0-1)',

  -- User interaction
  clickedFaqId INT COMMENT 'FAQ ID that user clicked on (if any)',
  clickedPosition INT COMMENT 'Position of clicked result (1-based, null if no click)',

  -- Performance metrics
  responseTimeMs INT COMMENT 'API response time in milliseconds',

  -- Fallback tracking
  fallbackToKeyword BOOLEAN DEFAULT FALSE COMMENT 'Whether semantic search failed and fell back to keyword search',

  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the search was performed',

  -- Indexes for analytics queries
  INDEX idx_semanticSearchLogs_userId (userId),
  INDEX idx_semanticSearchLogs_topResultId (topResultId),
  INDEX idx_semanticSearchLogs_clickedFaqId (clickedFaqId),
  INDEX idx_semanticSearchLogs_timestamp (timestamp DESC),
  INDEX idx_semanticSearchLogs_fallbackToKeyword (fallbackToKeyword),
  INDEX idx_semanticSearchLogs_responseTime (responseTimeMs),

  -- Composite indexes for common queries
  INDEX idx_semanticSearchLogs_userTimestamp (userId, timestamp DESC),
  INDEX idx_semanticSearchLogs_clickAnalytics (clickedFaqId, timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs for semantic search queries used for analytics and optimization';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
--
-- Run these queries to verify the migration was successful
--

-- Verify new columns were added to faqs table
-- Expected output: Should show 12 new columns
/*
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'faqs' 
  AND COLUMN_NAME IN (
    'embedding',
    'embeddingModel',
    'embeddingDimension',
    'embeddingGeneratedAt',
    'semanticKeywords',
    'semanticCategory',
    'semanticTags',
    'semanticSearchHits',
    'semanticSearchClicks',
    'semanticSearchCTR',
    'embeddingQualityScore',
    'needsEmbeddingRefresh'
  )
ORDER BY ORDINAL_POSITION;
*/

-- Verify new tables were created
-- Expected output: embeddingCache and semanticSearchLogs
/*
SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('embeddingCache', 'semanticSearchLogs')
ORDER BY TABLE_NAME;
*/

-- Verify indexes were created
-- Expected output: Should show all new indexes
/*
SELECT INDEX_NAME, TABLE_NAME, COLUMN_NAME, SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_NAME IN ('faqs', 'embeddingCache', 'semanticSearchLogs')
  AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
*/

-- ============================================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================================
--
-- Run these queries periodically to maintain performance
--

-- Analyze tables to update statistics (improves query planning)
-- Run after large data changes
/*
ANALYZE TABLE faqs;
ANALYZE TABLE embeddingCache;
ANALYZE TABLE semanticSearchLogs;
*/

-- Optimize tables to reclaim space and improve performance
-- Run periodically (e.g., weekly)
/*
OPTIMIZE TABLE faqs;
OPTIMIZE TABLE embeddingCache;
OPTIMIZE TABLE semanticSearchLogs;
*/

-- Check for missing indexes on frequently queried columns
/*
SELECT OBJECT_SCHEMA, OBJECT_NAME, COUNT_STAR
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_NAME IN ('faqs', 'embeddingCache', 'semanticSearchLogs')
  AND COUNT_STAR > 0
ORDER BY COUNT_STAR DESC;
*/

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================
--
-- Use these queries to monitor semantic search performance
--

-- Count FAQs with embeddings
-- Expected: Should increase as embeddings are generated
/*
SELECT 
  COUNT(*) as total_faqs,
  SUM(CASE WHEN embedding IS NOT NULL AND JSON_LENGTH(embedding) > 0 THEN 1 ELSE 0 END) as faqs_with_embeddings,
  ROUND(SUM(CASE WHEN embedding IS NOT NULL AND JSON_LENGTH(embedding) > 0 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as percent_embedded
FROM faqs
WHERE isPublished = TRUE;
*/

-- Cache statistics
-- Expected: Shows cache effectiveness
/*
SELECT 
  COUNT(*) as total_cached,
  AVG(usageCount) as avg_usage,
  MAX(usageCount) as max_usage,
  MIN(usageCount) as min_usage,
  SUM(usageCount) as total_usage
FROM embeddingCache;
*/

-- Search statistics (last 24 hours)
-- Expected: Shows search volume and quality
/*
SELECT 
  COUNT(*) as total_searches,
  COUNT(DISTINCT userId) as unique_users,
  SUM(CASE WHEN clickedFaqId IS NOT NULL THEN 1 ELSE 0 END) as clicked_searches,
  ROUND(SUM(CASE WHEN clickedFaqId IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as ctr_percent,
  AVG(responseTimeMs) as avg_response_time_ms,
  SUM(CASE WHEN fallbackToKeyword = TRUE THEN 1 ELSE 0 END) as fallback_count
FROM semanticSearchLogs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
*/

-- Top searched queries
/*
SELECT 
  query,
  COUNT(*) as search_count,
  SUM(CASE WHEN clickedFaqId IS NOT NULL THEN 1 ELSE 0 END) as clicks,
  ROUND(SUM(CASE WHEN clickedFaqId IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as ctr_percent
FROM semanticSearchLogs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY query
ORDER BY search_count DESC
LIMIT 20;
*/

-- Most clicked FAQs from semantic search
/*
SELECT 
  f.id,
  f.question,
  COUNT(ssl.id) as click_count,
  f.semanticSearchClicks as total_clicks,
  ROUND(f.semanticSearchCTR, 2) as ctr_percent
FROM semanticSearchLogs ssl
JOIN faqs f ON ssl.clickedFaqId = f.id
WHERE ssl.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY f.id
ORDER BY click_count DESC
LIMIT 20;
*/

-- ============================================================================
-- CLEANUP QUERIES
-- ============================================================================
--
-- Use these queries to maintain data quality
--

-- Remove old cache entries (older than 30 days, not used recently)
-- Run periodically (e.g., weekly)
/*
DELETE FROM embeddingCache
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND usageCount < 5;
*/

-- Archive old search logs (older than 90 days)
-- Run periodically (e.g., monthly)
/*
DELETE FROM semanticSearchLogs
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
*/

-- Reset semantic search metrics for FAQs with poor performance
-- Run periodically to recalculate CTR
/*
UPDATE faqs
SET semanticSearchCTR = ROUND(
  CASE 
    WHEN semanticSearchHits > 0 
    THEN (semanticSearchClicks / semanticSearchHits) * 100
    ELSE 0
  END, 2)
WHERE semanticSearchHits > 0;
*/

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
--
-- To rollback this migration, run the following commands:
--

/*
-- Drop new tables
DROP TABLE IF EXISTS semanticSearchLogs;
DROP TABLE IF EXISTS embeddingCache;

-- Drop new columns from faqs table
ALTER TABLE faqs DROP COLUMN embedding;
ALTER TABLE faqs DROP COLUMN embeddingModel;
ALTER TABLE faqs DROP COLUMN embeddingDimension;
ALTER TABLE faqs DROP COLUMN embeddingGeneratedAt;
ALTER TABLE faqs DROP COLUMN semanticKeywords;
ALTER TABLE faqs DROP COLUMN semanticCategory;
ALTER TABLE faqs DROP COLUMN semanticTags;
ALTER TABLE faqs DROP COLUMN semanticSearchHits;
ALTER TABLE faqs DROP COLUMN semanticSearchClicks;
ALTER TABLE faqs DROP COLUMN semanticSearchCTR;
ALTER TABLE faqs DROP COLUMN embeddingQualityScore;
ALTER TABLE faqs DROP COLUMN needsEmbeddingRefresh;

-- Drop indexes from faqs table
DROP INDEX idx_faqs_semanticCategory ON faqs;
DROP INDEX idx_faqs_needsEmbeddingRefresh ON faqs;
DROP INDEX idx_faqs_embeddingGeneratedAt ON faqs;
DROP INDEX idx_faqs_semanticSearchHits ON faqs;
DROP INDEX idx_faqs_semanticSearchCTR ON faqs;
*/

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
--
-- Changes Made:
-- 1. Added 12 new columns to faqs table
-- 2. Added 5 new indexes to faqs table
-- 3. Created embeddingCache table with 5 indexes
-- 4. Created semanticSearchLogs table with 8 indexes
--
-- Total New Indexes: 18
-- Total New Columns: 12
-- Total New Tables: 2
--
-- Backward Compatibility: YES
-- - All new columns have defaults
-- - Existing queries continue to work
-- - No data loss
--
-- Estimated Execution Time: 2-5 seconds
-- Estimated Downtime: None
--
-- Next Steps:
-- 1. Run embedding generation script
-- 2. Deploy semantic search router
-- 3. Monitor performance
-- 4. Collect user feedback
--
-- ============================================================================

-- End of Phase 1 Migration
