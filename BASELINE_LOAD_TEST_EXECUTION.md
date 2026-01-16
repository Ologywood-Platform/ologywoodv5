# Baseline Load Test Execution Guide

## Quick Start

### Prerequisites
```bash
# Install k6
brew install k6

# Verify installation
k6 version

# Set environment variables
export STAGING_API="https://staging-api.ologywood.com"
export BASE_URL=$STAGING_API
export ADMIN_EMAIL="loadtest@ologywood.com"
export ADMIN_PASSWORD="LoadTest123!@#"
```

### Run Baseline Test (10 minutes)

```bash
# Execute baseline test with 10 concurrent users for 1 minute
cd /home/ubuntu/ologywood
k6 run \
  --vus 10 \
  --duration 1m \
  --env BASE_URL=$BASE_URL \
  tests/load-testing.js
```

### Expected Output

```
     data_received..................: 2.5 MB  42 kB/s
     data_sent.......................: 150 kB  2.5 kB/s
     http_req_blocked................: avg=1.2ms    min=0s      max=50ms    p(90)=2ms     p(95)=3ms
     http_req_connecting.............: avg=0.8ms    min=0s      max=40ms    p(90)=1ms     p(95)=2ms
     http_req_duration...............: avg=150ms    min=50ms    max=500ms   p(90)=200ms   p(95)=250ms
     http_req_failed.................: 0%
     http_req_receiving..............: avg=50ms     min=10ms    max=200ms   p(90)=75ms    p(95)=100ms
     http_req_sending................: avg=10ms     min=5ms     max=50ms    p(90)=15ms    p(95)=20ms
     http_req_tls_handshaking........: avg=0.5ms    min=0s      max=30ms    p(90)=1ms     p(95)=1ms
     http_req_waiting................: avg=90ms     min=30ms    max=400ms   p(90)=120ms   p(95)=150ms
     http_reqs........................: 5000    83.33/s
     iteration_duration..............: avg=2s       min=1.5s    max=5s      p(90)=2.2s    p(95)=2.5s
     iterations.......................: 500     8.33/s
     vus.............................: 10      min=10     max=10
     vus_max..........................: 10      min=10     max=10
```

## Step-by-Step Execution

### Step 1: Verify Staging Environment

```bash
# Check if staging API is accessible
curl -I https://staging-api.ologywood.com/health

# Expected response: HTTP 200 OK
```

### Step 2: Create Test User Account

```bash
# Create test user for load testing
curl -X POST https://staging-api.ologywood.com/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@ologywood.com",
    "password": "LoadTest123!@#",
    "role": "artist",
    "name": "Load Test User"
  }'

# Expected response: 200 OK with user data
```

### Step 3: Run Baseline Test

```bash
# Navigate to project directory
cd /home/ubuntu/ologywood

# Run baseline load test
k6 run \
  --vus 10 \
  --duration 1m \
  --env BASE_URL="https://staging-api.ologywood.com" \
  --env ADMIN_EMAIL="loadtest@ologywood.com" \
  --env ADMIN_PASSWORD="LoadTest123!@#" \
  tests/load-testing.js
```

### Step 4: Analyze Results

```bash
# Save results to JSON for analysis
k6 run \
  --vus 10 \
  --duration 1m \
  --env BASE_URL="https://staging-api.ologywood.com" \
  --out json=baseline-results.json \
  tests/load-testing.js

# Extract key metrics
cat baseline-results.json | jq '.metrics | {
  http_req_duration: .http_req_duration,
  http_req_failed: .http_req_failed,
  http_reqs: .http_reqs
}'
```

## Performance Baseline Targets

| Metric | Target | Status |
|--------|--------|--------|
| P95 Response Time | < 200ms | ⏳ Pending |
| P99 Response Time | < 500ms | ⏳ Pending |
| Error Rate | < 0.1% | ⏳ Pending |
| Throughput | > 100 req/s | ⏳ Pending |
| Concurrent Users | 10+ | ⏳ Pending |

## Monitoring During Test

### Real-time Metrics

k6 displays real-time metrics during test execution. Key metrics to watch:

- **http_req_duration**: Average response time
- **http_req_failed**: Failed request count
- **vus**: Current virtual users
- **http_reqs**: Total requests completed

### System Monitoring

While test is running, monitor system resources:

```bash
# In separate terminal, monitor CPU and memory
watch -n 1 'top -bn1 | head -20'

# Monitor network traffic
iftop

# Monitor database connections
psql -U postgres -d ologywood -c "SELECT count(*) FROM pg_stat_activity;"
```

## Test Progression

### Phase 1: Baseline (10 users, 1 minute)
- Establish baseline performance
- Identify any immediate issues
- Verify test infrastructure works

### Phase 2: Ramp-Up (50 users, 2 minutes)
- Observe performance degradation
- Identify breaking points
- Test auto-scaling if enabled

### Phase 3: Stress (100 users, 2 minutes)
- Push system to limits
- Identify bottlenecks
- Verify error handling

### Phase 4: Recovery (0 users, 1 minute)
- Verify system recovers
- Check for memory leaks
- Confirm graceful shutdown

## Troubleshooting

### High Response Times

**Symptoms:** P95 response time > 500ms

**Check:**
```bash
# 1. Database performance
EXPLAIN ANALYZE SELECT * FROM contracts LIMIT 10;

# 2. Database connections
psql -U postgres -d ologywood -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Application logs
docker logs ologywood-app | tail -50

# 4. System resources
free -h
df -h
```

### High Error Rate

**Symptoms:** Error rate > 1%

**Check:**
```bash
# 1. Rate limiting
curl -X GET https://staging-api.ologywood.com/trpc/contractManagement.getArtistContracts \
  -H "Authorization: Bearer token" \
  -v

# 2. Database errors
tail -100 /var/log/postgresql/postgresql.log

# 3. Application errors
docker logs ologywood-app | grep -i error
```

### Connection Timeouts

**Symptoms:** Connection refused or timeout errors

**Check:**
```bash
# 1. Server status
curl -I https://staging-api.ologywood.com/health

# 2. Network connectivity
ping staging-api.ologywood.com
traceroute staging-api.ologywood.com

# 3. Firewall rules
sudo iptables -L
```

## Post-Test Analysis

### Generate Report

```bash
# Run test with detailed output
k6 run \
  --vus 10 \
  --duration 1m \
  --env BASE_URL="https://staging-api.ologywood.com" \
  --out json=baseline-results.json \
  tests/load-testing.js

# Create summary
cat > analyze_baseline.js << 'EOF'
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('baseline-results.json', 'utf8'));
const metrics = data.metrics;

console.log('=== Baseline Load Test Results ===\n');
console.log(`Total Requests: ${metrics.http_reqs.value}`);
console.log(`Failed Requests: ${metrics.http_req_failed.value}`);
console.log(`Error Rate: ${(metrics.http_req_failed.value / metrics.http_reqs.value * 100).toFixed(2)}%`);
console.log(`\nResponse Times:`);
console.log(`  Average: ${metrics.http_req_duration.avg.toFixed(2)}ms`);
console.log(`  P50: ${metrics.http_req_duration['p(50)'].toFixed(2)}ms`);
console.log(`  P90: ${metrics.http_req_duration['p(90)'].toFixed(2)}ms`);
console.log(`  P95: ${metrics.http_req_duration['p(95)'].toFixed(2)}ms`);
console.log(`  P99: ${metrics.http_req_duration['p(99)'].toFixed(2)}ms`);
console.log(`  Max: ${metrics.http_req_duration.max.toFixed(2)}ms`);
console.log(`\nThroughput: ${(metrics.http_reqs.value / 60).toFixed(2)} req/s`);
EOF

node analyze_baseline.js
```

## Next Steps

1. **Review Results** - Compare against targets
2. **Identify Bottlenecks** - Database, CPU, memory, network
3. **Optimize** - Implement improvements
4. **Re-test** - Verify optimizations
5. **Scale Up** - Run ramp-up test with 50+ users
6. **Document** - Record baseline for future comparison

## Success Criteria

✅ **Baseline test passes if:**
- P95 response time < 200ms
- Error rate < 0.1%
- No cascading failures
- System recovers after test

❌ **Baseline test fails if:**
- P95 response time > 500ms
- Error rate > 1%
- Cascading failures occur
- System doesn't recover

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Next Review:** After baseline test execution
