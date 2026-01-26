# LRU Eviction Maintenance Query Guide

## Overview

This guide provides complete SQL content for the LRU (Least Recently Used) eviction maintenance query template. LRU eviction removes old embeddings from the cache to manage disk space and maintain performance.

---

## 🎯 Core LRU Eviction Query

### **Basic LRU Eviction - Delete Embeddings Unused for 30 Days**

```sql
-- Delete embeddings not used in the last 30 days
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Explanation**:
- `lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)` - Select embeddings older than 30 days
- `DELETE FROM embedding_cache` - Remove matching embeddings
- Simple and straightforward

**Performance**:
- Execution time: 100-500ms (depends on table size)
- Rows affected: Typically 10-20% of cache
- Disk space freed: 5-10MB per 10,000 embeddings

---

## 📊 Advanced LRU Eviction Queries

### **1. Safe Deletion with Preview**

```sql
-- STEP 1: Preview what will be deleted (DRY RUN)
SELECT 
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb,
  MIN(lastUsedAt) as oldest_unused,
  MAX(lastUsedAt) as newest_unused
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- STEP 2: Review the numbers, then execute deletion
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- STEP 3: Verify deletion
SELECT COUNT(*) as remaining_embeddings FROM embedding_cache;
```

**Use Case**: Safe deletion with verification before and after

**Output Example**:
```
embeddings_to_delete: 1,234
space_to_free_mb: 7.5
oldest_unused: 2025-10-26 14:32:00
newest_unused: 2025-11-24 09:15:00
```

---

### **2. Configurable Age Threshold**

```sql
-- Delete embeddings unused for N days (customize @days_threshold)
SET @days_threshold = 30;

DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @days_threshold DAY);

-- Verify
SELECT 
  COUNT(*) as remaining_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as total_cache_size_mb
FROM embedding_cache;
```

**Use Case**: Flexible threshold for different retention policies

**Examples**:
```sql
SET @days_threshold = 7;   -- Delete weekly
SET @days_threshold = 30;  -- Delete monthly
SET @days_threshold = 90;  -- Delete quarterly
```

---

### **3. Size-Based Eviction**

```sql
-- Delete oldest embeddings until cache size is under 500MB
DELETE FROM embedding_cache 
WHERE id IN (
  SELECT id FROM embedding_cache 
  ORDER BY lastUsedAt ASC
  LIMIT (
    SELECT CEIL(
      (SUM(JSON_LENGTH(embedding)) - 500 * 1024 * 1024) / 
      AVG(JSON_LENGTH(embedding))
    )
    FROM embedding_cache
  )
);
```

**Use Case**: Maintain maximum cache size regardless of age

**Features**:
- Automatically calculates how many embeddings to delete
- Deletes oldest first (LRU strategy)
- Stops when cache is under 500MB

---

### **4. Usage-Based Eviction**

```sql
-- Delete low-usage embeddings (used less than 5 times)
DELETE FROM embedding_cache 
WHERE usageCount < 5 
  AND lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**Use Case**: Remove embeddings that are rarely used

**Features**:
- Combines age and usage metrics
- Preserves frequently-used embeddings
- Good for identifying stale data

---

### **5. Model-Specific Eviction**

```sql
-- Delete old embeddings from deprecated model
DELETE FROM embedding_cache 
WHERE model = 'text-embedding-3-small' 
  AND lastUsedAt < DATE_SUB(NOW(), INTERVAL 60 DAY);
```

**Use Case**: Clean up embeddings from older models during migration

**Scenario**: When upgrading from one OpenAI model to another

---

### **6. Batch Deletion (Safe for Large Tables)**

```sql
-- Delete in batches to avoid locking table for too long
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
LIMIT 10000;

-- Repeat until no more rows deleted
-- Check with: SELECT COUNT(*) FROM embedding_cache WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Use Case**: Large tables (millions of rows)

**Benefits**:
- Prevents long table locks
- Allows concurrent reads
- Can be run in a loop

**Complete Batch Script**:
```sql
-- Batch delete with loop
SET @batch_size = 10000;
SET @deleted = 1;

WHILE @deleted > 0 DO
  DELETE FROM embedding_cache 
  WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  LIMIT @batch_size;
  
  SET @deleted = ROW_COUNT();
  SELECT CONCAT('Deleted ', @deleted, ' embeddings');
END WHILE;
```

---

### **7. Scheduled Eviction (Cron Job)**

```sql
-- Run daily at 2 AM to delete embeddings unused for 30 days
-- Add to cron: 0 2 * * * mysql -u root -p ologywood -e "DELETE FROM embedding_cache WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);"

-- Or create a stored procedure:
DELIMITER //

CREATE PROCEDURE evict_old_embeddings()
BEGIN
  DECLARE deleted_count INT;
  
  DELETE FROM embedding_cache 
  WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  SET deleted_count = ROW_COUNT();
  
  INSERT INTO maintenance_log (procedure_name, rows_affected, executed_at)
  VALUES ('evict_old_embeddings', deleted_count, NOW());
END //

DELIMITER ;

-- Call the procedure
CALL evict_old_embeddings();
```

**Use Case**: Automated daily maintenance

---

### **8. Comprehensive Eviction Report**

```sql
-- Generate detailed eviction report before deletion
SELECT 
  'Pre-Eviction Statistics' as report_type,
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as total_size_mb,
  ROUND(AVG(JSON_LENGTH(embedding)), 2) as avg_size_bytes,
  MIN(usageCount) as min_usage,
  MAX(usageCount) as max_usage,
  ROUND(AVG(usageCount), 2) as avg_usage,
  MIN(lastUsedAt) as oldest_access,
  MAX(lastUsedAt) as newest_access
FROM embedding_cache

UNION ALL

SELECT 
  'To Be Deleted' as report_type,
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as total_size_mb,
  ROUND(AVG(JSON_LENGTH(embedding)), 2) as avg_size_bytes,
  MIN(usageCount) as min_usage,
  MAX(usageCount) as max_usage,
  ROUND(AVG(usageCount), 2) as avg_usage,
  MIN(lastUsedAt) as oldest_access,
  MAX(lastUsedAt) as newest_access
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Now delete
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Post-deletion statistics
SELECT 
  'Post-Eviction Statistics' as report_type,
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as total_size_mb,
  ROUND(AVG(JSON_LENGTH(embedding)), 2) as avg_size_bytes,
  MIN(usageCount) as min_usage,
  MAX(usageCount) as max_usage,
  ROUND(AVG(usageCount), 2) as avg_usage,
  MIN(lastUsedAt) as oldest_access,
  MAX(lastUsedAt) as newest_access
FROM embedding_cache;
```

**Output**: Before/after comparison showing impact

---

### **9. Preserve High-Value Embeddings**

```sql
-- Delete old embeddings BUT preserve those with high usage
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

**Use Case**: Keep popular embeddings even if old

**Strategy**: Delete only bottom 25% by usage

---

### **10. Time-Window Eviction**

```sql
-- Delete embeddings in specific time window
DELETE FROM embedding_cache 
WHERE lastUsedAt BETWEEN 
  DATE_SUB(NOW(), INTERVAL 60 DAY) AND 
  DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Use Case**: Clean up specific time period

**Scenario**: Maintenance window between 30-60 days old

---

## 📋 Recommended Eviction Policies

### **Policy 1: Conservative (Large Cache)**

```sql
-- Keep embeddings for 90 days
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Run: Monthly
-- Expected deletion: 5-10% of cache
```

**Use Case**: Large cache (>1GB), low storage constraints

---

### **Policy 2: Balanced (Medium Cache)**

```sql
-- Keep embeddings for 30 days
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Run: Weekly
-- Expected deletion: 10-20% of cache
```

**Use Case**: Medium cache (100-500MB), balanced approach

---

### **Policy 3: Aggressive (Small Cache)**

```sql
-- Keep embeddings for 7 days
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Run: Daily
-- Expected deletion: 15-30% of cache
```

**Use Case**: Small cache (<100MB), storage constraints

---

### **Policy 4: Hybrid (Usage + Age)**

```sql
-- Delete old AND low-usage embeddings
DELETE FROM embedding_cache 
WHERE (
  -- Old embeddings (>60 days unused)
  lastUsedAt < DATE_SUB(NOW(), INTERVAL 60 DAY)
) OR (
  -- Low-usage embeddings (used <3 times and >30 days old)
  usageCount < 3 AND lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
);

-- Run: Weekly
-- Expected deletion: 20-30% of cache
```

**Use Case**: Optimize for both space and performance

---

## 🔧 Implementation Steps

### **Step 1: Choose a Policy**

```sql
-- Example: Balanced policy (30-day retention)
SET @retention_days = 30;
```

### **Step 2: Preview Impact**

```sql
SELECT 
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @retention_days DAY);
```

### **Step 3: Execute Eviction**

```sql
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL @retention_days DAY);
```

### **Step 4: Optimize Table**

```sql
OPTIMIZE TABLE embedding_cache;
```

### **Step 5: Verify Results**

```sql
SELECT 
  COUNT(*) as remaining_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb
FROM embedding_cache;
```

---

## 📊 Monitoring & Metrics

### **Cache Health Check**

```sql
SELECT 
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  ROUND(AVG(JSON_LENGTH(embedding)), 2) as avg_embedding_size,
  DATEDIFF(NOW(), MIN(lastUsedAt)) as oldest_days,
  DATEDIFF(NOW(), MAX(lastUsedAt)) as newest_days
FROM embedding_cache;
```

### **Eviction Impact**

```sql
-- Compare before/after eviction
SELECT 
  'Before' as phase,
  COUNT(*) as embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as size_mb
FROM embedding_cache

UNION ALL

SELECT 
  'After' as phase,
  COUNT(*) as embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as size_mb
FROM embedding_cache 
WHERE lastUsedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## ⚠️ Safety Precautions

### **Before Running Eviction**

1. **Backup Database**
   ```bash
   mysqldump -u root -p ologywood > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Preview Impact**
   ```sql
   SELECT COUNT(*) FROM embedding_cache 
   WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```

3. **Check Disk Space**
   ```bash
   df -h
   ```

4. **Monitor Performance**
   ```sql
   SHOW PROCESSLIST;
   ```

### **After Running Eviction**

1. **Optimize Table**
   ```sql
   OPTIMIZE TABLE embedding_cache;
   ```

2. **Verify Data Integrity**
   ```sql
   CHECK TABLE embedding_cache;
   ```

3. **Update Statistics**
   ```sql
   ANALYZE TABLE embedding_cache;
   ```

---

## 🎯 Quick Reference

| Policy | Retention | Frequency | Deletion % | Use Case |
|--------|-----------|-----------|-----------|----------|
| Conservative | 90 days | Monthly | 5-10% | Large cache |
| Balanced | 30 days | Weekly | 10-20% | Medium cache |
| Aggressive | 7 days | Daily | 15-30% | Small cache |
| Hybrid | 30/60 days | Weekly | 20-30% | Mixed strategy |

---

## 📝 Example Cron Jobs

### **Daily Eviction (2 AM)**

```bash
0 2 * * * mysql -u root -p'password' ologywood -e "DELETE FROM embedding_cache WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);"
```

### **Weekly Eviction (Sunday 2 AM)**

```bash
0 2 * * 0 mysql -u root -p'password' ologywood -e "DELETE FROM embedding_cache WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);"
```

### **Monthly Eviction (1st of month, 2 AM)**

```bash
0 2 1 * * mysql -u root -p'password' ologywood -e "DELETE FROM embedding_cache WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 90 DAY);"
```

---

## 🎉 Summary

This guide provides:

✅ **10 SQL query variations** for LRU eviction
✅ **4 recommended policies** for different scenarios
✅ **Complete implementation steps**
✅ **Monitoring and metrics queries**
✅ **Safety precautions**
✅ **Cron job examples**

Choose the policy that best fits your use case and implement automated eviction to maintain optimal cache performance!
