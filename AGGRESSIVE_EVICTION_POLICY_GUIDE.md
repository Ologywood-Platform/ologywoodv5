# Aggressive Eviction Policy - Complete Guide with Risk Analysis

## 🎯 Overview

The **Aggressive eviction policy** prioritizes **disk space management** over cache hit rate. It removes embeddings frequently to maintain a small cache footprint, ideal for resource-constrained environments.

---

## 📊 Policy Comparison

| Aspect | Conservative | Balanced | **Aggressive** |
|--------|--------------|----------|----------------|
| **Retention** | 90 days | 30 days | **7 days** |
| **Frequency** | Monthly | Weekly | **Daily** |
| **Deletion %** | 5-10% | 15-25% | **30-40%** |
| **Cache Size** | Large (>1GB) | Medium (100-500MB) | **Small (<100MB)** |
| **Hit Rate** | 80-85% | 70-80% | **50-60%** |
| **API Calls** | Low | Medium | **High** |
| **Cost** | Low | Medium | **High** |
| **Use Case** | Large storage | Balanced | **Limited storage** |

---

## 📝 Exact SQL Content for Aggressive Policy

### **Primary Aggressive Query**

```sql
-- Aggressive Eviction Policy: Delete embeddings unused for 7 days
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**Characteristics**:
- Deletes embeddings older than 7 days
- Simple, straightforward approach
- Maximum disk space recovery
- Minimum cache retention

---

## 🔄 Aggressive Policy Variations

### **Variation 1: Usage-Based Aggressive**

```sql
-- Delete low-usage embeddings regardless of age
DELETE FROM embedding_cache 
WHERE usageCount < 2;
```

**Logic**: Remove embeddings used less than twice

---

### **Variation 2: Combined Age + Usage Aggressive**

```sql
-- Delete embeddings that are BOTH old AND low-usage
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND usageCount < 2;
```

**Logic**: Age > 7 days AND usage < 2 times

---

### **Variation 3: Size-Based Aggressive**

```sql
-- Delete oldest embeddings until cache is under 100MB
DELETE FROM embedding_cache 
WHERE id IN (
  SELECT id FROM embedding_cache 
  ORDER BY lastUsedAt ASC
  LIMIT (
    SELECT CEIL(
      (SUM(JSON_LENGTH(embedding)) - 100 * 1024 * 1024) / 
      AVG(JSON_LENGTH(embedding))
    )
    FROM embedding_cache
  )
);
```

**Logic**: Maintain maximum 100MB cache size

---

### **Variation 4: Percentile-Based Aggressive**

```sql
-- Delete bottom 50% by usage (keep only top 50%)
DELETE FROM embedding_cache 
WHERE usageCount < (
  SELECT PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY usageCount)
  FROM embedding_cache
);
```

**Logic**: Keep only most-used embeddings

---

### **Variation 5: Time-Window Aggressive**

```sql
-- Delete embeddings in specific aggressive window (7-14 days old)
DELETE FROM embedding_cache 
WHERE lastUsedAt BETWEEN 
  DATE_SUB(NOW(), INTERVAL 14 DAY) AND 
  DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**Logic**: Aggressive cleanup of middle-aged embeddings

---

## 🧮 Mathematical Example

### **Scenario: 10,000 embeddings, 60MB cache**

**Before Aggressive Eviction**:
```
Total embeddings: 10,000
Cache size: 60MB
Average age: 45 days
Average usage: 3.5 times
```

**Aggressive Eviction (7-day threshold)**:
```
Embeddings older than 7 days: 8,500 (85%)
Embeddings to delete: 8,500
Remaining: 1,500 (15%)
```

**After Aggressive Eviction**:
```
Total embeddings: 1,500
Cache size: 9MB
Average age: 3 days
Average usage: 5.2 times
Space freed: 51MB (85% reduction)
```

---

## ⚠️ Potential Risks of Aggressive Policy

### **Risk 1: Low Cache Hit Rate** 🔴 CRITICAL

**Problem**: Aggressive eviction removes embeddings quickly, reducing cache effectiveness

**Impact**:
- Cache hit rate drops from 80% to 50-60%
- More API calls to OpenAI
- Higher latency (500-600ms vs 10-50ms)
- Increased costs

**Example**:
```
Balanced policy (30-day retention):
- 10,000 searches/day
- 80% hit rate = 8,000 cache hits
- 2,000 API calls = $0.06/day

Aggressive policy (7-day retention):
- 10,000 searches/day
- 55% hit rate = 5,500 cache hits
- 4,500 API calls = $0.135/day
- Cost increase: 125% (+$0.075/day)
```

**Mitigation**:
- Accept higher costs
- Implement Redis layer for additional caching
- Use aggressive policy only for non-critical searches

---

### **Risk 2: Increased API Calls** 🔴 CRITICAL

**Problem**: More cache misses = more OpenAI API calls

**Impact**:
- Rate limiting issues
- API quota exhaustion
- Potential service disruption
- Higher monthly bills

**Example**:
```
Aggressive policy impact:
- 10,000 searches/day
- 45% cache miss rate = 4,500 API calls/day
- 135,000 API calls/month
- Cost: ~$4.05/month (vs $1.80 for balanced)
```

**Mitigation**:
- Monitor API usage closely
- Set up billing alerts
- Implement request queuing
- Use batch API calls

---

### **Risk 3: Reduced Search Quality** 🟠 HIGH

**Problem**: Frequently regenerating embeddings may cause inconsistencies

**Impact**:
- Same query may produce different embeddings
- Inconsistent search results
- Poor user experience
- Reduced relevance scores

**Example**:
```
Query: "How do I pay artists?"

Time 1 (cached): embedding_v1 → 0.95 relevance
Time 2 (regenerated): embedding_v2 → 0.87 relevance
Time 3 (cached): embedding_v1 → 0.95 relevance

Result: Inconsistent rankings
```

**Mitigation**:
- Use deterministic embedding generation
- Implement embedding versioning
- Cache embeddings in Redis layer
- Monitor embedding consistency

---

### **Risk 4: Performance Degradation** 🟠 HIGH

**Problem**: Constant regeneration increases server load

**Impact**:
- Higher CPU usage
- Increased memory consumption
- Slower response times
- Potential timeouts

**Example**:
```
Balanced policy:
- 2,000 API calls/day
- CPU usage: 15%
- Avg response: 150ms

Aggressive policy:
- 4,500 API calls/day
- CPU usage: 35%
- Avg response: 350ms
```

**Mitigation**:
- Upgrade server resources
- Implement caching layers
- Use async processing
- Implement rate limiting

---

### **Risk 5: Database Churn** 🟡 MEDIUM

**Problem**: Frequent deletions and insertions stress the database

**Impact**:
- Increased disk I/O
- Table fragmentation
- Slower queries
- Potential data corruption

**Example**:
```
Balanced policy:
- 1,000 embeddings deleted/week
- 1,000 new embeddings/week
- Table fragmentation: 5%

Aggressive policy:
- 3,000 embeddings deleted/week
- 3,000 new embeddings/week
- Table fragmentation: 15%
```

**Mitigation**:
- Run OPTIMIZE TABLE more frequently
- Implement table partitioning
- Monitor table fragmentation
- Use SSD storage

---

### **Risk 6: Data Loss Risk** 🟡 MEDIUM

**Problem**: Aggressive deletion may remove valuable embeddings

**Impact**:
- Loss of historical data
- Inability to recover deleted embeddings
- Reduced analytics capabilities

**Mitigation**:
- Backup database before eviction
- Implement soft deletes (mark as deleted, don't remove)
- Archive old embeddings to separate table
- Test in staging first

---

### **Risk 7: Inconsistent User Experience** 🟡 MEDIUM

**Problem**: Different users may see different search results

**Impact**:
- Unpredictable behavior
- User frustration
- Support tickets
- Reduced trust

**Example**:
```
User A searches at 2 AM: Gets cached result (0.95 relevance)
User B searches at 3 AM: Gets regenerated result (0.87 relevance)
Different results for same query!
```

**Mitigation**:
- Implement sticky caching (same embedding for same text)
- Use Redis for distributed caching
- Monitor result consistency
- Document behavior to users

---

### **Risk 8: Compliance Issues** 🟡 MEDIUM

**Problem**: Aggressive deletion may violate data retention policies

**Impact**:
- Regulatory violations
- Audit failures
- Legal issues
- Fines

**Mitigation**:
- Check compliance requirements
- Implement archival instead of deletion
- Document retention policies
- Maintain audit logs

---

## 🚀 Complete Implementation

### **Step 1: Assess Risks**

```sql
-- Analyze current cache characteristics
SELECT 
  COUNT(*) as total_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  DATEDIFF(NOW(), MIN(lastUsedAt)) as oldest_days,
  DATEDIFF(NOW(), MAX(lastUsedAt)) as newest_days,
  ROUND(COUNT(*) * 6 / 1024, 2) as estimated_cost_per_day_usd
FROM embedding_cache;
```

### **Step 2: Preview Impact**

```sql
-- See what aggressive eviction will delete
SELECT 
  COUNT(*) as embeddings_to_delete,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as space_to_free_mb,
  ROUND(COUNT(*) / (SELECT COUNT(*) FROM embedding_cache) * 100, 2) as percent_deleted,
  MIN(lastUsedAt) as oldest_to_delete,
  MAX(lastUsedAt) as newest_to_delete
FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **Step 3: Backup Database**

```bash
# Create backup before aggressive eviction
mysqldump -u root -p ologywood > backup_aggressive_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 4: Execute Aggressive Eviction**

```sql
-- Execute the aggressive eviction
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **Step 5: Monitor Impact**

```sql
-- Track metrics after eviction
SELECT 
  COUNT(*) as remaining_embeddings,
  ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) as new_cache_size_mb,
  ROUND(AVG(usageCount), 2) as avg_usage,
  DATEDIFF(NOW(), MIN(lastUsedAt)) as oldest_days,
  DATEDIFF(NOW(), MAX(lastUsedAt)) as newest_days
FROM embedding_cache;
```

### **Step 6: Optimize Table**

```sql
OPTIMIZE TABLE embedding_cache;
```

---

## 📊 Risk Mitigation Strategies

### **Strategy 1: Hybrid Approach**

```sql
-- Combine aggressive age with conservative usage preservation
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND usageCount < (
    SELECT PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY usageCount)
    FROM embedding_cache
  );
```

**Benefit**: Aggressive on age, conservative on usage

---

### **Strategy 2: Gradual Rollout**

```sql
-- Week 1: Test with 14-day threshold
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 14 DAY);

-- Week 2: Move to 10-day threshold
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 10 DAY);

-- Week 3: Move to 7-day threshold
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

**Benefit**: Gradual transition reduces shock

---

### **Strategy 3: Redis Layer**

```typescript
// Add Redis caching layer above database cache
async function generateEmbeddingWithRedis(text: string) {
  // Try Redis first (very fast)
  const redisCache = await redis.get(`embedding:${hash}`);
  if (redisCache) return JSON.parse(redisCache);
  
  // Try database cache (medium speed)
  const dbCache = await db.select().from(embeddingCache).where(...);
  if (dbCache) {
    // Store in Redis for future hits
    await redis.setex(`embedding:${hash}`, 86400, JSON.stringify(dbCache));
    return dbCache;
  }
  
  // Generate from API (slow)
  const embedding = await openai.embeddings.create(...);
  
  // Store in both caches
  await redis.setex(`embedding:${hash}`, 86400, JSON.stringify(embedding));
  await db.insert(embeddingCache).values(embedding);
  
  return embedding;
}
```

**Benefit**: Multiple cache layers reduce API calls

---

### **Strategy 4: Monitoring & Alerts**

```sql
-- Monitor cache health and alert on issues
CREATE EVENT monitor_cache_health
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  INSERT INTO cache_metrics (
    timestamp,
    total_embeddings,
    cache_size_mb,
    avg_usage,
    estimated_hit_rate
  ) SELECT
    NOW(),
    COUNT(*),
    ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2),
    ROUND(AVG(usageCount), 2),
    ROUND(SUM(usageCount) / COUNT(*) / 10, 2)
  FROM embedding_cache;
  
  -- Alert if cache size drops below 20MB
  IF (SELECT ROUND(SUM(JSON_LENGTH(embedding)) / 1024 / 1024, 2) FROM embedding_cache) < 20 THEN
    INSERT INTO alerts (message, severity) VALUES ('Cache size critically low', 'CRITICAL');
  END IF;
END;
```

**Benefit**: Early warning of problems

---

## 🎯 When to Use Aggressive Policy

### **✅ Good Use Cases**

1. **Resource-Constrained Environments**
   - Limited disk space
   - Small VPS/container
   - IoT devices

2. **Non-Critical Searches**
   - Exploratory queries
   - One-time searches
   - Low-priority features

3. **High-Volume, Low-Retention**
   - Temporary data
   - Session-based searches
   - Real-time analytics

4. **Cost-Sensitive Scenarios**
   - Startup environment
   - Proof of concept
   - Development/testing

### **❌ Bad Use Cases**

1. **Production Systems**
   - Critical FAQ searches
   - User-facing features
   - High-traffic applications

2. **Performance-Critical**
   - Real-time systems
   - Low-latency requirements
   - High-concurrency scenarios

3. **Compliance-Heavy**
   - Regulated industries
   - Data retention requirements
   - Audit-heavy environments

4. **User Experience**
   - Consistent results required
   - High expectations
   - Premium services

---

## 📋 Decision Matrix

```
Is disk space critical?
├─ YES
│  ├─ Is cost also critical?
│  │  ├─ YES → Use Aggressive
│  │  └─ NO → Use Balanced + Redis
│  └─ NO
│     ├─ Is performance critical?
│     │  ├─ YES → Use Conservative
│     │  └─ NO → Use Balanced
└─ NO
   ├─ Is performance critical?
   │  ├─ YES → Use Conservative
   │  └─ NO → Use Balanced
```

---

## ⚠️ Risk Mitigation Checklist

- [ ] Assess current cache characteristics
- [ ] Calculate cost impact
- [ ] Identify compliance requirements
- [ ] Set up monitoring/alerts
- [ ] Implement Redis layer
- [ ] Create backup strategy
- [ ] Plan gradual rollout
- [ ] Test in staging environment
- [ ] Document decision
- [ ] Train team on risks
- [ ] Set up incident response
- [ ] Monitor metrics post-deployment

---

## 🎉 Summary

### **Exact SQL for Aggressive Policy**:
```sql
DELETE FROM embedding_cache 
WHERE lastUsedAt < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **Key Risks**:
1. 🔴 **Low Cache Hit Rate** (50-60% vs 80%)
2. 🔴 **Increased API Calls** (125% more)
3. 🟠 **Reduced Search Quality** (inconsistent results)
4. 🟠 **Performance Degradation** (slower responses)
5. 🟡 **Database Churn** (more I/O)
6. 🟡 **Data Loss Risk** (permanent deletion)
7. 🟡 **Inconsistent UX** (different results)
8. 🟡 **Compliance Issues** (retention violations)

### **Recommended Safeguards**:
✅ Implement Redis caching layer
✅ Set up comprehensive monitoring
✅ Use gradual rollout approach
✅ Maintain regular backups
✅ Test thoroughly in staging
✅ Document all decisions
✅ Train team on risks
✅ Set up incident response

**Use aggressive policy only when disk space is critical and you can accept higher costs and lower performance!**

