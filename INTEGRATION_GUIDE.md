# Phase 2 Integration Guide

## Overview

This guide covers integrating all security middleware, external logging services, and database optimization into your Express server for production readiness.

## 1. Security Middleware Integration

### Step 1: Import Configuration

```typescript
import { configureServer, applyAuthRateLimiter, applySensitiveRateLimiter } from './server/middleware/serverConfig';
```

### Step 2: Configure Express Server

In your main server file (e.g., `server/index.ts`):

```typescript
import express from 'express';
import { configureServer, printSecuritySetup } from './middleware/serverConfig';

const app = express();

// Configure all security middleware
configureServer(app);

// Print security setup summary
printSecuritySetup();

// Your routes here
app.use('/api', yourRoutes);

// Start server
app.listen(3000, () => {
  console.log('Server running with security middleware enabled');
});
```

### Step 3: Apply Endpoint-Specific Rate Limiting

```typescript
// Auth endpoints (strict rate limiting)
applyAuthRateLimiter(app, '/auth/login');
applyAuthRateLimiter(app, '/auth/register');

// Sensitive operations (moderate rate limiting)
applySensitiveRateLimiter(app, '/api/contracts/sign');
applySensitiveRateLimiter(app, '/api/payments');
```

## 2. External Logging Service Integration

### Step 1: Environment Configuration

Add to your `.env` file:

```env
# ELK Stack
LOGGING_PROVIDER=elk
EXTERNAL_LOGGING_ENABLED=true
LOGGING_ENDPOINT=http://elasticsearch:9200
LOGGING_INDEX=ologywood-logs
LOGGING_BATCH_SIZE=100
LOGGING_FLUSH_INTERVAL=30

# OR Splunk
LOGGING_PROVIDER=splunk
LOGGING_ENDPOINT=https://your-splunk-instance.splunkcloud.com
LOGGING_API_KEY=your-splunk-hec-token

# OR Datadog
LOGGING_PROVIDER=datadog
LOGGING_ENDPOINT=https://http-intake.logs.datadoghq.com
LOGGING_API_KEY=your-datadog-api-key
```

### Step 2: Initialize External Logging Service

In your server initialization:

```typescript
import { createExternalLoggingService } from './server/services/externalLoggingService';
import { logEvent, LogLevel, LogEventType } from './server/middleware/logging';

// Create external logging service
const externalLogger = createExternalLoggingService();

// When logging events, they'll automatically be sent to external service
logEvent({
  level: LogLevel.INFO,
  eventType: LogEventType.LOGIN_SUCCESS,
  userId: user.id,
  ipAddress: req.ip,
  message: 'User logged in successfully',
});

// On shutdown, flush remaining logs
process.on('SIGTERM', async () => {
  if (externalLogger) {
    await externalLogger.stop();
  }
});
```

### Step 3: Monitor External Logging Status

```typescript
// Check logging service status
if (externalLogger) {
  const status = externalLogger.getStatus();
  console.log('Logging service status:', status);
}
```

## 3. Database Optimization Integration

### Step 1: Create Indexes

Run the SQL index creation statements:

```typescript
import { indexCreationSQL } from './server/services/databaseOptimization';

// Execute these SQL statements in your database
const indexStatements = [
  ...indexCreationSQL.users,
  ...indexCreationSQL.contracts,
  ...indexCreationSQL.bookings,
  ...indexCreationSQL.signatures,
];

// Run each statement
for (const sql of indexStatements) {
  await db.execute(sql);
}
```

### Step 2: Initialize Query Caching

```typescript
import { DatabaseOptimizationService } from './server/services/databaseOptimization';

// Create optimization service
const dbOptimization = new DatabaseOptimizationService();
const queryCache = dbOptimization.getQueryCache();

// Use cache in queries
export async function getUserById(id: number) {
  const cacheKey = `user:${id}`;
  
  // Check cache first
  let user = queryCache.get(cacheKey);
  if (user) {
    return user;
  }
  
  // Query database if not cached
  user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  
  // Cache result (1 hour TTL)
  if (user) {
    queryCache.set(cacheKey, user, 3600);
  }
  
  return user;
}
```

### Step 3: Configure Connection Pool

In your database configuration:

```typescript
import { connectionPoolConfig } from './server/services/databaseOptimization';

const dbConfig = {
  ...connectionPoolConfig,
  // Other database config
};
```

### Step 4: Track Query Performance

```typescript
// Wrap database queries to track performance
async function executeQuery(query: any) {
  const startTime = Date.now();
  
  try {
    const result = await query;
    const queryTime = Date.now() - startTime;
    
    // Track metrics
    dbOptimization.trackQuery(queryTime);
    
    return result;
  } catch (error) {
    const queryTime = Date.now() - startTime;
    dbOptimization.trackQuery(queryTime);
    throw error;
  }
}
```

### Step 5: Monitor Performance

```typescript
// Get performance metrics
const metrics = dbOptimization.getMetrics();
console.log('Database Performance Metrics:', {
  queryCount: metrics.queryCount,
  averageQueryTime: `${metrics.averageQueryTime.toFixed(2)}ms`,
  slowQueryCount: metrics.slowQueryCount,
  cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`,
});

// Get optimization suggestions
const suggestions = dbOptimization.getOptimizationSuggestions();
if (suggestions.length > 0) {
  console.log('Optimization Suggestions:');
  suggestions.forEach(s => console.log(`  - ${s}`));
}
```

## 4. Complete Server Setup Example

```typescript
import express from 'express';
import { configureServer, printSecuritySetup } from './middleware/serverConfig';
import { createExternalLoggingService } from './services/externalLoggingService';
import { DatabaseOptimizationService } from './services/databaseOptimization';
import { logEvent, LogLevel, LogEventType } from './middleware/logging';

const app = express();
const externalLogger = createExternalLoggingService();
const dbOptimization = new DatabaseOptimizationService();

// Configure security middleware
configureServer(app);
printSecuritySetup();

// Initialize routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbMetrics = dbOptimization.getMetrics();
  res.json({
    status: 'ok',
    database: {
      avgQueryTime: dbMetrics.averageQueryTime,
      cacheHitRate: dbMetrics.cacheHitRate,
    },
    logging: externalLogger?.getStatus(),
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  
  // Flush logs
  if (externalLogger) {
    await externalLogger.stop();
  }
  
  // Close database connections
  // await db.close();
  
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`External logging: ${externalLogger ? 'enabled' : 'disabled'}`);
});
```

## 5. Testing Security Middleware

### Test Rate Limiting

```bash
# Should succeed
curl http://localhost:3000/api/test

# Should fail after 100 requests in 15 minutes
for i in {1..101}; do
  curl http://localhost:3000/api/test
done
```

### Test Security Headers

```bash
# Check security headers
curl -i http://localhost:3000/api/test

# Should include:
# Strict-Transport-Security
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy
```

### Test File Upload Security

```bash
# Test with valid file
curl -F "file=@test.pdf" http://localhost:3000/upload

# Test with invalid file type
curl -F "file=@test.exe" http://localhost:3000/upload
```

## 6. Monitoring & Alerts

### Set Up Log Monitoring

For ELK Stack:
```
GET /ologywood-logs/_search
{
  "query": {
    "match": {
      "level": "CRITICAL"
    }
  }
}
```

For Splunk:
```
index=ologywood level=CRITICAL
```

### Create Alerts

Set up alerts for:
- Rate limit exceeded (repeated)
- Failed authentication attempts (>5 in 15 min)
- Slow queries (>1 second)
- High error rate (>5% of requests)
- Security events (injection attempts, XSS, etc.)

## 7. Performance Tuning

### Optimize Cache TTLs

- User profiles: 3600s (1 hour)
- Contracts: 1800s (30 minutes)
- Bookings: 900s (15 minutes)
- Support tickets: 600s (10 minutes)
- Help articles: 300s (5 minutes)

### Adjust Connection Pool

```env
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

For high traffic, increase `DB_POOL_MAX` to 20-50.

### Monitor Slow Queries

```typescript
// Log queries taking > 500ms
if (queryTime > 500) {
  logEvent({
    level: LogLevel.WARN,
    eventType: LogEventType.WARNING,
    message: `Slow query detected: ${queryTime}ms`,
    details: { query, queryTime },
  });
}
```

## 8. Troubleshooting

### Rate Limiting Not Working

- Check `TRUST_PROXY` environment variable
- Verify rate limiter is applied to correct routes
- Check IP address detection (behind reverse proxy)

### External Logging Not Sending

- Verify endpoint URL is correct
- Check API key/credentials
- Review network connectivity
- Check batch size and flush interval

### Slow Queries

- Run `EXPLAIN` on slow queries
- Check if indexes are being used
- Review query plans
- Consider query optimization

## Next Steps

1. Deploy middleware to production
2. Set up external logging service
3. Create database indexes
4. Monitor performance metrics
5. Adjust caching and pooling based on metrics
6. Set up alerts and dashboards
