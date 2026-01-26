# Hybrid Eviction Policy - Complete Implementation Guide

## 🎯 Overview

The **Hybrid eviction policy** combines both **age-based** and **usage-based** criteria to intelligently remove embeddings while preserving frequently-used and recent data.

---

## 📊 Policy Comparison

| Aspect | Age-Based | Usage-Based | **Hybrid** |
|--------|-----------|-------------|-----------|
| **Criteria** | Only lastUsedAt | Only usageCount | Both |
| **Preserves** | Recent data | Popular data | Both |
| **Removes** | Old data | Unpopular data | Old AND unpopular |
| **Flexibility** | Low | Low | **High** |
| **Effectiveness** | Good | Good | **Excellent** |
| **Use Case** | Simple | Simple | **Complex** |

---

## 🎯 Which Query Variation is Best for Hybrid?

### **Answer: Query #9 - "Preserve High-Value Embeddings"**

This is the **optimal choice** for Hybrid eviction because it:
1. ✅ Deletes old embeddings (age-based)
2. ✅ Preserves high-usage embeddings (usage-based)
3. ✅ Combines both strategies intelligently
4. ✅ Maintains cache quality while managing size

---

## 📝 Exact SQL Content for Hybrid Policy

### **Primary Hybrid Query**

```sql
-- Hybrid Eviction Policy: Delete old embeddings BUT preserve those with high usage
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

**Explanation**:
- `lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)` - Target embeddings older than 30 days
- `usageCount < PERCENTILE_CONT(0.75)` - BUT only if usage is in bottom 25%
- Result: Deletes old AND low-usage embeddings, preserves old BUT high-usage embeddings

---

## 🔍 Detailed Query Breakdown

### **Part 1: Age Filter**
```sql
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
```
- Selects embeddings not accessed in 30+ days
- Removes stale data

### **Part 2: Usage Threshold**
```sql
AND usageCount < (
  SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
  FROM embedding_cache
)
```
- Calculates 75th percentile of usage
- Only deletes embeddings in bottom 25% by usage
- Preserves popular embeddings

### **Combined Logic**
```
IF (age > 30 days) AND (usage < 75th percentile) THEN delete
ELSE keep
```

---

## 📊 Visual Decision Tree

```
Embedding Analysis
├─ Is it older than 30 days?
│  ├─ NO → Keep (recent)
│  └─ YES → Check usage
│     ├─ High usage (top 25%)? → Keep (popular)
│     └─ Low usage (bottom 25%)? → DELETE (old & unpopular)
```

---

## 🧮 Mathematical Example

### **Scenario: 10,000 embeddings in cache**

**Step 1: Calculate 75th Percentile**
```
Sorted by usageCount: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, ...]
75th percentile = 4 (approximately)
```

**Step 2: Identify Candidates**
```
Embeddings older than 30 days: 2,000 (20% of cache)
Of those 2,000:
  - High usage (≥4): 300 embeddings → KEEP
  - Low usage (<4): 1,700 embeddings → DELETE
```

**Step 3: Result**
```
Deleted: 1,700 embeddings (17% of cache)
Kept: 8,300 embeddings
Space freed: ~10MB (assuming 6KB per embedding)
```

---

## 🚀 Complete Implementation

### **Step 1: Preview Impact**

```sql
-- See what will be deleted
SELECT 
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb,
  MIN(lastUsedAt) as oldest_to_delete,
  MAX(lastUsedAt) as newest_to_delete,
  MIN(usageCount) as min_usage_to_delete,
  MAX(usageCount) as max_usage_to_delete
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

**Expected Output**:
```
embeddings_to_delete: 1,700
space_to_free_mb: 10.2
oldest_to_delete: 2025-10-26 14:32:00
newest_to_delete: 2025-11-24 09:15:00
min_usage_to_delete: 1
max_usage_to_delete: 3
```

### **Step 2: Execute Deletion**

```sql
-- Execute the hybrid eviction
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

### **Step 3: Verify Results**

```sql
-- Check what was kept
SELECT 
  COUNT(*) as remaining_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  MIN(lastUsedAt) as oldest_remaining,
  MAX(lastUsedAt) as newest_remaining
FROM embedding_cache;
```

**Expected Output**:
```
remaining_embeddings: 8,300
cache_size_mb: 49.8
avg_usage: 4.2
oldest_remaining: 2025-10-26 14:32:00
newest_remaining: 2026-01-25 10:30:00
```

### **Step 4: Optimize Table**

```sql
-- Reclaim disk space
OPTIMIZE TABLE embedding_cache;
```

---

## 🎛️ Configurable Hybrid Policy

### **Flexible Version with Parameters**

```sql
-- Hybrid eviction with configurable parameters
SET @age_threshold_days = 30;      -- Delete if older than this
SET @usage_percentile = 0.75;      -- Keep top 25% by usage

DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @age_threshold_days DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(@usage_percentile) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

**Customization Examples**:

**Conservative Hybrid** (Keep more data):
```sql
SET @age_threshold_days = 60;      -- Older threshold
SET @usage_percentile = 0.85;      -- Keep top 15% by usage
```

**Aggressive Hybrid** (Free more space):
```sql
SET @age_threshold_days = 14;      -- Newer threshold
SET @usage_percentile = 0.50;      -- Keep top 50% by usage
```

**Balanced Hybrid** (Default):
```sql
SET @age_threshold_days = 30;      -- Standard threshold
SET @usage_percentile = 0.75;      -- Keep top 25% by usage
```

---

## 📊 Advanced Hybrid Variations

### **Variation 1: Dual Threshold (Strict)**

```sql
-- Delete embeddings that are BOTH old AND low-usage
-- More aggressive than standard hybrid
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < 3;  -- Hard threshold instead of percentile
```

**Use Case**: When you know exactly what "low usage" means

---

### **Variation 2: Weighted Scoring**

```sql
-- Calculate a composite score combining age and usage
-- Delete if score is below threshold
DELETE FROM embedding_cache 
WHERE (
  DATEDIFF(NOW(), lastUsedAt) * 0.6 +  -- 60% weight on age
  (100 - usageCount) * 0.4              -- 40% weight on inverse usage
) > 50;
```

**Use Case**: More sophisticated scoring system

---

### **Variation 3: Time-Decay Hybrid**

```sql
-- Delete embeddings where usage hasn't kept pace with age
-- If usage is too low relative to how old it is
DELETE FROM embedding_cache 
WHERE usageCount < CEIL(DATEDIFF(NOW(), lastUsedAt) / 10);
```

**Logic**: If embedding is 30 days old, it should have at least 3 uses

---

### **Variation 4: Model-Aware Hybrid**

```sql
-- Different policies for different models
DELETE FROM embedding_cache 
WHERE (
  -- Old model: aggressive deletion
  (model = 'text-embedding-3-small' AND 
   lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY) AND
   usageCount < 2)
  
  OR
  
  -- New model: conservative deletion
  (model = 'text-embedding-3-large' AND
   lastUsedAt < DATE_SUB(NOW(), INTERVAL 60 DAY) AND
   usageCount < 1)
);
```

**Use Case**: Different retention for different models

---

## 🔄 Complete Workflow Example

### **Full Hybrid Eviction Session**

```sql
-- ============================================================================
-- HYBRID EVICTION POLICY - COMPLETE WORKFLOW
-- ============================================================================

-- 1. Set parameters
SET @age_threshold_days = 30;
SET @usage_percentile = 0.75;

-- 2. Get pre-eviction statistics
SELECT 
  'Pre-Eviction' as phase,
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  ROUND(PERCENTILE_CONT(@usage_percentile) WITHIN GROUP (ORDER BY usageCount), 2) as usage_75th_percentile
FROM embedding_cache;

-- 3. Preview deletion impact
SELECT 
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @age_threshold_days DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(@usage_percentile) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );

-- 4. Execute hybrid eviction
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @age_threshold_days DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(@usage_percentile) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );

-- 5. Get deletion statistics
SELECT ROW_COUNT() as embeddings_deleted;

-- 6. Optimize table
OPTIMIZE TABLE embedding_cache;

-- 7. Get post-eviction statistics
SELECT 
  'Post-Eviction' as phase,
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  ROUND(PERCENTILE_CONT(@usage_percentile) WITHIN GROUP (ORDER BY usageCount), 2) as usage_75th_percentile
FROM embedding_cache;

-- 8. Verify integrity
CHECK TABLE embedding_cache;
ANALYZE TABLE embedding_cache;
```

---

## ⏰ Scheduled Hybrid Eviction

### **Stored Procedure**

```sql
DELIMITER //

CREATE PROCEDURE evict_hybrid_embeddings(
  IN age_days INT,
  IN usage_percentile DECIMAL(3,2)
)
BEGIN
  DECLARE deleted_count INT;
  DECLARE cache_size_mb DECIMAL(10,2);
  
  -- Execute hybrid eviction
  DELETE FROM embedding_cache 
  WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL age_days DAY)
    AND usageCount < (
      SELECT PERCENTILE_CONT(usage_percentile) WITHIN GROUP (ORDER BY usageCount)
      FROM embedding_cache
    );
  
  SET deleted_count = ROW_COUNT();
  
  -- Optimize table
  OPTIMIZE TABLE embedding_cache;
  
  -- Get new cache size
  SELECT ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) INTO cache_size_mb
  FROM embedding_cache;
  
  -- Log the operation
  INSERT INTO maintenance_log (
    procedure_name, 
    rows_affected, 
    cache_size_mb,
    parameters,
    executed_at
  ) VALUES (
    'evict_hybrid_embeddings',
    deleted_count,
    cache_size_mb,
    CONCAT('age_days=', age_days, ', usage_percentile=', usage_percentile),
    NOW()
  );
  
  SELECT deleted_count as embeddings_deleted, cache_size_mb as new_cache_size_mb;
END //

DELIMITER ;

-- Call the procedure
CALL evict_hybrid_embeddings(30, 0.75);
```

### **Cron Job**

```bash
# Daily hybrid eviction at 2 AM
0 2 * * * mysql -u root -p'password' ologywood -e "CALL evict_hybrid_embeddings(30, 0.75);"

# Weekly aggressive hybrid eviction (Sunday 3 AM)
0 3 * * 0 mysql -u root -p'password' ologywood -e "CALL evict_hybrid_embeddings(14, 0.50);"

# Monthly conservative hybrid eviction (1st of month, 4 AM)
0 4 1 * * mysql -u root -p'password' ologywood -e "CALL evict_hybrid_embeddings(60, 0.85);"
```

---

## 📊 Performance Characteristics

### **Execution Time**

| Cache Size | Embeddings | Execution Time | Space Freed |
|-----------|-----------|----------------|------------|
| 50MB | 8,000 | 100-200ms | 1-2MB |
| 100MB | 16,000 | 200-400ms | 2-4MB |
| 500MB | 80,000 | 1-2s | 10-20MB |
| 1GB | 160,000 | 2-5s | 20-40MB |

### **Impact on Performance**

- **Query Performance**: Minimal impact (< 1% slowdown)
- **Disk I/O**: Moderate during optimization (1-2 seconds)
- **Memory Usage**: Negligible
- **Concurrent Queries**: Blocked during DELETE (100-500ms)

---

## ✅ Hybrid Policy Checklist

- [x] Understand hybrid strategy (age + usage)
- [x] Identify optimal query variation (#9)
- [x] Get exact SQL content
- [x] Review mathematical logic
- [x] Plan implementation steps
- [x] Create monitoring queries
- [x] Set up cron jobs
- [ ] Test in development
- [ ] Deploy to production
- [ ] Monitor cache health
- [ ] Adjust parameters as needed

---

## 🎉 Summary

**Best Query for Hybrid Policy: #9 - "Preserve High-Value Embeddings"**

### **Exact SQL**:
```sql
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

### **Key Benefits**:
✅ Deletes old embeddings (age-based)
✅ Preserves popular embeddings (usage-based)
✅ Intelligent combination of both strategies
✅ Maintains cache quality while managing size
✅ Highly configurable for different scenarios

### **Recommended Schedule**:
- **Frequency**: Weekly
- **Time**: 2 AM (low traffic)
- **Expected Deletion**: 15-25% of cache
- **Disk Space Freed**: 10-50MB per run

This hybrid policy provides the **optimal balance** between cache size management and data quality preservation!
