# Load Testing Execution Guide

## Overview

This guide provides step-by-step instructions for executing load tests against the Ologywood platform to validate performance under concurrent user load and identify bottlenecks.

## Prerequisites

### Software Installation

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Linux
# or download from https://k6.io/docs/getting-started/installation/

# Verify installation
k6 version
```

### Staging Environment Setup

```bash
# 1. Deploy to staging
git push staging main

# 2. Verify staging is running
curl https://staging-api.ologywood.com/health

# 3. Get staging API endpoint
export STAGING_API="https://staging-api.ologywood.com"

# 4. Create test user account
curl -X POST $STAGING_API/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@ologywood.com",
    "password": "LoadTest123!@#",
    "role": "artist"
  }'
```

## Load Testing Scenarios

### Scenario 1: Baseline Performance (Low Load)

**Objective:** Establish baseline metrics with minimal load

**Configuration:**
```bash
k6 run --vus 10 --duration 1m \
  --env BASE_URL=$STAGING_API \
  tests/load-testing.js
```

**Expected Results:**
- Response time: < 200ms (p95)
- Error rate: < 1%
- Throughput: > 100 req/s

**Success Criteria:**
- ✅ All requests succeed
- ✅ Response times consistent
- ✅ No memory leaks

### Scenario 2: Ramp-Up Test (Gradual Load Increase)

**Objective:** Identify performance degradation as load increases

**Configuration:**
```bash
k6 run \
  --stage 1m:10 \
  --stage 2m:50 \
  --stage 2m:100 \
  --stage 1m:200 \
  --stage 1m:0 \
  --env BASE_URL=$STAGING_API \
  tests/load-testing.js
```

**Expected Results:**
- Smooth performance degradation
- No sudden failures
- Recovery after load decrease

**Success Criteria:**
- ✅ P95 response time < 1s at 100 users
- ✅ Error rate remains < 5%
- ✅ Server recovers after load decrease

### Scenario 3: Stress Test (Peak Load)

**Objective:** Find breaking point of the system

**Configuration:**
```bash
k6 run \
  --stage 2m:500 \
  --stage 5m:500 \
  --stage 2m:0 \
  --env BASE_URL=$STAGING_API \
  tests/load-testing.js
```

**Expected Results:**
- System remains stable at 500 concurrent users
- Graceful degradation if exceeded
- No cascading failures

**Success Criteria:**
- ✅ Handles 500+ concurrent users
- ✅ Error rate < 10% at peak
- ✅ No database connection pool exhaustion

### Scenario 4: Spike Test (Sudden Load Increase)

**Objective:** Test system behavior during traffic spikes

**Configuration:**
```bash
k6 run \
  --stage 1m:10 \
  --stage 30s:500 \
  --stage 1m:10 \
  --stage 30s:0 \
  --env BASE_URL=$STAGING_API \
  tests/load-testing.js
```

**Expected Results:**
- Quick recovery from spike
- No cascading failures
- Requests queued, not dropped

**Success Criteria:**
- ✅ Recovery time < 2 minutes
- ✅ No data loss
- ✅ Error rate < 15% during spike

### Scenario 5: Endurance Test (Sustained Load)

**Objective:** Verify system stability over extended period

**Configuration:**
```bash
k6 run \
  --stage 5m:0 \
  --stage 30m:100 \
  --stage 5m:0 \
  --env BASE_URL=$STAGING_API \
  tests/load-testing.js
```

**Expected Results:**
- Consistent performance over 30 minutes
- No memory leaks
- No connection pool issues

**Success Criteria:**
- ✅ Response time stable throughout
- ✅ Error rate < 1%
- ✅ Memory usage stable

## Running Load Tests

### Step 1: Prepare Test Environment

```bash
# 1. Set environment variables
export BASE_URL="https://staging-api.ologywood.com"
export ADMIN_EMAIL="loadtest@ologywood.com"
export ADMIN_PASSWORD="LoadTest123!@#"

# 2. Verify connectivity
curl $BASE_URL/health

# 3. Check database status
# Connect to staging database and verify it's responsive
```

### Step 2: Execute Test

```bash
# Run baseline test
k6 run \
  --vus 10 \
  --duration 1m \
  --env BASE_URL=$BASE_URL \
  tests/load-testing.js

# Or use a specific scenario
k6 run \
  --stage 1m:10 \
  --stage 2m:50 \
  --stage 2m:100 \
  --stage 1m:200 \
  --stage 1m:0 \
  --env BASE_URL=$BASE_URL \
  tests/load-testing.js
```

### Step 3: Monitor Results

During test execution, k6 displays real-time metrics:

```
     data_received..................: 45 MB   750 kB/s
     data_sent.......................: 2.5 MB  42 kB/s
     http_req_blocked................: avg=1.2ms    min=0s      max=50ms    p(90)=2ms     p(95)=3ms
     http_req_connecting.............: avg=0.8ms    min=0s      max=40ms    p(90)=1ms     p(95)=2ms
     http_req_duration...............: avg=150ms    min=50ms    max=2s      p(90)=200ms   p(95)=300ms
     http_req_failed.................: 0.5%
     http_req_receiving..............: avg=50ms     min=10ms    max=500ms   p(90)=75ms    p(95)=100ms
     http_req_sending................: avg=10ms     min=5ms     max=50ms    p(90)=15ms    p(95)=20ms
     http_req_tls_handshaking........: avg=0.5ms    min=0s      max=30ms    p(90)=1ms     p(95)=1ms
     http_req_waiting................: avg=90ms     min=30ms    max=1.5s    p(90)=120ms   p(95)=150ms
     http_reqs........................: 50000   833.33/s
     iteration_duration..............: avg=2s       min=1.5s    max=5s      p(90)=2.2s    p(95)=2.5s
     iterations.......................: 5000    83.33/s
     vus.............................: 10      min=10     max=10
     vus_max..........................: 10      min=10     max=10
```

### Step 4: Analyze Results

```bash
# Generate JSON summary
k6 run \
  --vus 100 \
  --duration 5m \
  --env BASE_URL=$BASE_URL \
  --out json=results.json \
  tests/load-testing.js

# Parse results
cat results.json | jq '.metrics'
```

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| P95 Response Time | < 200ms | < 500ms | > 1s |
| P99 Response Time | < 500ms | < 1s | > 2s |
| Error Rate | < 0.1% | < 1% | > 5% |
| Throughput | > 1000 req/s | > 500 req/s | < 100 req/s |
| Concurrent Users | 1000+ | 500+ | < 100 |
| Memory Usage | Stable | < 2GB growth | > 5GB growth |

## Troubleshooting

### High Response Times

**Symptoms:**
- P95 response time > 500ms
- Increasing response times over time

**Causes:**
- Database query performance
- Insufficient database connections
- Memory pressure
- CPU throttling

**Solutions:**
```bash
# 1. Check database performance
EXPLAIN ANALYZE SELECT * FROM contracts WHERE status = 'pending';

# 2. Verify indexes are used
SELECT * FROM pg_stat_user_indexes;

# 3. Check connection pool
SELECT count(*) FROM pg_stat_activity;

# 4. Monitor CPU/Memory
top
```

### High Error Rate

**Symptoms:**
- Error rate > 1%
- Specific endpoints failing

**Causes:**
- Rate limiting triggered
- Database connection pool exhausted
- Memory exhaustion
- Application crashes

**Solutions:**
```bash
# 1. Check rate limiter status
curl $BASE_URL/metrics | jq '.rate_limiter'

# 2. Check database connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# 3. Check application logs
docker logs ologywood-app | tail -100

# 4. Check memory usage
free -h
```

### Connection Timeouts

**Symptoms:**
- Connection refused errors
- Timeout errors

**Causes:**
- Server overloaded
- Network issues
- Firewall blocking

**Solutions:**
```bash
# 1. Verify server is running
curl -v $BASE_URL/health

# 2. Check network connectivity
ping staging-api.ologywood.com
traceroute staging-api.ologywood.com

# 3. Check firewall rules
sudo iptables -L

# 4. Increase connection timeout in k6
# Modify tests/load-testing.js timeout settings
```

## Optimization Recommendations

### Based on Test Results

**If P95 response time > 200ms:**
- Add database indexes
- Implement query caching
- Optimize slow queries
- Increase database resources

**If error rate > 1%:**
- Increase rate limiting thresholds
- Add database connection pool
- Increase server resources
- Implement circuit breaker

**If throughput < 1000 req/s:**
- Profile application code
- Optimize hot paths
- Implement caching
- Scale horizontally

## Post-Test Analysis

### Generate Report

```bash
# Run test with output
k6 run \
  --vus 100 \
  --duration 5m \
  --env BASE_URL=$BASE_URL \
  --out json=results.json \
  tests/load-testing.js

# Create summary report
cat > analyze_results.js << 'EOF'
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('results.json', 'utf8'));

const metrics = data.metrics;
console.log('=== Load Test Results ===');
console.log(`Total Requests: ${metrics.http_reqs.value}`);
console.log(`Failed Requests: ${metrics.http_req_failed.value}`);
console.log(`Error Rate: ${(metrics.http_req_failed.value / metrics.http_reqs.value * 100).toFixed(2)}%`);
console.log(`P95 Response Time: ${metrics.http_req_duration['p(95)']}ms`);
console.log(`P99 Response Time: ${metrics.http_req_duration['p(99)']}ms`);
console.log(`Average Response Time: ${metrics.http_req_duration.avg}ms`);
EOF

node analyze_results.js
```

### Create Comparison Report

```bash
# Run baseline test
k6 run --vus 10 --duration 1m \
  --env BASE_URL=$BASE_URL \
  --out json=baseline.json \
  tests/load-testing.js

# Run optimized test
k6 run --vus 10 --duration 1m \
  --env BASE_URL=$BASE_URL \
  --out json=optimized.json \
  tests/load-testing.js

# Compare results
echo "Baseline vs Optimized:"
echo "Baseline P95: $(jq '.metrics.http_req_duration["p(95)"]' baseline.json)"
echo "Optimized P95: $(jq '.metrics.http_req_duration["p(95)"]' optimized.json)"
```

## Next Steps

1. **Run Baseline Test** - Execute baseline scenario to establish current performance
2. **Run Ramp-Up Test** - Identify performance degradation curve
3. **Run Stress Test** - Find system breaking point
4. **Analyze Results** - Compare against targets
5. **Optimize** - Implement improvements based on findings
6. **Re-test** - Verify optimizations improved performance
7. **Document** - Record results and recommendations

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/load-testing/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/performance-testing/)
- [Thresholds and Alerts](https://k6.io/docs/using-k6/thresholds/)

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Next Review:** After first load test execution
