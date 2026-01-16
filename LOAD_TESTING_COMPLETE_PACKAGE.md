# Complete Load Testing Package

## Overview

This package contains everything needed to execute comprehensive load testing of the Ologywood platform. All scripts, data, and instructions are included.

## Package Contents

```
load-testing-package/
├── scripts/
│   ├── baseline-test.js          # 10 users, 1 minute
│   ├── ramp-up-test.js           # 50 users, 2 minutes
│   ├── stress-test.js            # 100 users, 2 minutes
│   ├── spike-test.js             # 500 users, 1 minute
│   ├── endurance-test.js         # 25 users, 10 minutes
│   └── common.js                 # Shared utilities
├── data/
│   ├── test-users.json           # Test user accounts
│   ├── test-contracts.json       # Sample contracts
│   ├── test-bookings.json        # Sample bookings
│   └── test-data-setup.sql       # Database setup
├── results/
│   ├── baseline-results.json     # Baseline results
│   ├── ramp-up-results.json      # Ramp-up results
│   └── analysis-report.html      # Visual analysis
├── config/
│   ├── staging-env.example       # Environment variables
│   ├── k6-config.json            # k6 configuration
│   └── thresholds.json           # Performance thresholds
└── README.md                     # Complete instructions
```

## Quick Start

### Prerequisites

```bash
# Install k6
brew install k6                    # macOS
# or
choco install k6                   # Windows
# or
sudo apt-get install k6            # Linux

# Verify installation
k6 version
```

### Environment Setup

```bash
# Copy example environment file
cp config/staging-env.example .env.staging

# Edit with your staging details
nano .env.staging

# Required variables:
# STAGING_API=https://your-staging-api.com
# STAGING_WS=wss://your-staging-ws.com
# TEST_USER_EMAIL=loadtest@ologywood.com
# TEST_USER_PASSWORD=LoadTest123!@#
# TEST_ADMIN_EMAIL=admin@ologywood.com
# TEST_ADMIN_PASSWORD=Admin123!@#
```

### Run Baseline Test

```bash
# Navigate to project
cd /home/ubuntu/ologywood

# Run baseline test (10 users, 1 minute)
k6 run \
  --vus 10 \
  --duration 1m \
  --env STAGING_API="https://your-staging-api.com" \
  --env TEST_USER_EMAIL="loadtest@ologywood.com" \
  --env TEST_USER_PASSWORD="LoadTest123!@#" \
  tests/load-testing.js

# Expected output:
# ✓ Login successful
# ✓ Get contracts
# ✓ Create booking
# ✓ Download PDF
# ...
# 
# checks.........................: 95.5% ✓ 1910 ✗ 90
# data_received..................: 2.5 MB 42 kB/s
# data_sent.......................: 150 kB 2.5 kB/s
# http_req_duration...............: avg=150ms min=50ms max=500ms p(90)=200ms p(95)=250ms
# http_reqs........................: 5000 83.33/s
# iterations.......................: 500 8.33/s
```

## Test Scenarios

### 1. Baseline Test (Recommended First)

**Purpose:** Establish baseline performance with minimal load

**Configuration:**
- Virtual Users: 10
- Duration: 1 minute
- Ramp-up: Immediate
- Ramp-down: Immediate

**Command:**
```bash
k6 run \
  --vus 10 \
  --duration 1m \
  --env STAGING_API="$STAGING_API" \
  tests/load-testing.js
```

**Success Criteria:**
- P95 response time < 200ms
- Error rate < 0.1%
- No cascading failures
- System recovers after test

### 2. Ramp-Up Test

**Purpose:** Observe performance degradation under increasing load

**Configuration:**
- Virtual Users: 50 (ramped from 10)
- Duration: 2 minutes
- Ramp-up: 1 minute
- Ramp-down: 1 minute

**Command:**
```bash
k6 run \
  --vus 50 \
  --duration 2m \
  --ramp-up 1m \
  --ramp-down 1m \
  --env STAGING_API="$STAGING_API" \
  tests/load-testing.js
```

**Success Criteria:**
- P95 response time < 300ms
- Error rate < 1%
- Database connections stable
- CPU usage < 80%

### 3. Stress Test

**Purpose:** Push system to breaking point

**Configuration:**
- Virtual Users: 100
- Duration: 2 minutes
- Ramp-up: 2 minutes
- Ramp-down: 2 minutes

**Command:**
```bash
k6 run \
  --vus 100 \
  --duration 2m \
  --ramp-up 2m \
  --ramp-down 2m \
  --env STAGING_API="$STAGING_API" \
  tests/load-testing.js
```

**Success Criteria:**
- P95 response time < 500ms
- Error rate < 5%
- System doesn't crash
- Graceful degradation observed

### 4. Spike Test

**Purpose:** Test system response to sudden traffic spike

**Configuration:**
- Virtual Users: 500 (sudden spike)
- Duration: 1 minute
- Ramp-up: Immediate
- Ramp-down: 1 minute

**Command:**
```bash
k6 run \
  --vus 500 \
  --duration 1m \
  --env STAGING_API="$STAGING_API" \
  tests/load-testing.js
```

**Success Criteria:**
- System handles spike without crashing
- Recovery time < 2 minutes
- Error rate < 10% during spike

### 5. Endurance Test

**Purpose:** Test system stability over extended period

**Configuration:**
- Virtual Users: 25
- Duration: 10 minutes
- Ramp-up: 1 minute
- Ramp-down: 1 minute

**Command:**
```bash
k6 run \
  --vus 25 \
  --duration 10m \
  --ramp-up 1m \
  --ramp-down 1m \
  --env STAGING_API="$STAGING_API" \
  tests/load-testing.js
```

**Success Criteria:**
- No memory leaks detected
- Response times stable
- Error rate < 1%
- Database connections stable

## Monitoring During Tests

### Real-Time Metrics

k6 displays live metrics during execution:

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

### System Monitoring

In separate terminal, monitor system resources:

```bash
# Monitor CPU and memory
watch -n 1 'top -bn1 | head -20'

# Monitor network traffic
iftop

# Monitor database connections
psql -U postgres -d ologywood -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor disk I/O
iostat -x 1

# Monitor open files
lsof -p $(pgrep -f "node.*server")
```

## Test Execution Workflow

### Step 1: Prepare Environment

```bash
# 1. Set environment variables
export STAGING_API="https://staging-api.ologywood.com"
export TEST_USER_EMAIL="loadtest@ologywood.com"
export TEST_USER_PASSWORD="LoadTest123!@#"

# 2. Verify staging is accessible
curl -I $STAGING_API/health

# 3. Create test user account
curl -X POST $STAGING_API/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_USER_EMAIL"'",
    "password": "'"$TEST_USER_PASSWORD"'",
    "role": "artist",
    "name": "Load Test User"
  }'

# 4. Verify test user login
curl -X POST $STAGING_API/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_USER_EMAIL"'",
    "password": "'"$TEST_USER_PASSWORD"'"
  }'
```

### Step 2: Run Baseline Test

```bash
# Run baseline test
k6 run \
  --vus 10 \
  --duration 1m \
  --env STAGING_API="$STAGING_API" \
  --env TEST_USER_EMAIL="$TEST_USER_EMAIL" \
  --env TEST_USER_PASSWORD="$TEST_USER_PASSWORD" \
  --out json=results/baseline-results.json \
  tests/load-testing.js

# Analyze results
cat results/baseline-results.json | jq '.metrics | {
  http_req_duration: .http_req_duration,
  http_req_failed: .http_req_failed,
  http_reqs: .http_reqs
}'
```

### Step 3: Analyze Baseline

```bash
# If baseline passes, proceed to ramp-up
# If baseline fails, troubleshoot:

# Check API health
curl -v $STAGING_API/health

# Check database
psql -U postgres -d ologywood -c "SELECT version();"

# Check application logs
docker logs ologywood-app | tail -50

# Check system resources
free -h
df -h
```

### Step 4: Run Progressive Tests

```bash
# Run ramp-up test
k6 run --vus 50 --duration 2m --out json=results/ramp-up-results.json tests/load-testing.js

# Run stress test
k6 run --vus 100 --duration 2m --out json=results/stress-results.json tests/load-testing.js

# Run endurance test
k6 run --vus 25 --duration 10m --out json=results/endurance-results.json tests/load-testing.js
```

### Step 5: Generate Report

```bash
# Create HTML report
k6 run \
  --out json=results/final-results.json \
  --summary-export=results/summary.json \
  tests/load-testing.js

# Analyze with k6 cloud (optional)
k6 cloud tests/load-testing.js
```

## Troubleshooting

### High Response Times

**Symptoms:** P95 > 500ms

**Diagnosis:**
```bash
# Check database performance
EXPLAIN ANALYZE SELECT * FROM contracts LIMIT 10;

# Check slow queries
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**Solutions:**
- Add database indexes
- Increase connection pool size
- Optimize slow queries
- Scale database vertically

### High Error Rate

**Symptoms:** Error rate > 1%

**Diagnosis:**
```bash
# Check application logs
docker logs ologywood-app | grep -i error

# Check rate limiting
curl -v -H "X-Forwarded-For: 127.0.0.1" $STAGING_API/trpc/contracts.list

# Check authentication
curl -X POST $STAGING_API/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "wrong"}'
```

**Solutions:**
- Adjust rate limiting thresholds
- Fix authentication issues
- Increase server capacity
- Fix application bugs

### Connection Timeouts

**Symptoms:** Connection refused or timeout

**Diagnosis:**
```bash
# Check server status
curl -I $STAGING_API/health

# Check network connectivity
ping staging-api.ologywood.com
traceroute staging-api.ologywood.com

# Check firewall
sudo iptables -L
```

**Solutions:**
- Restart application server
- Check firewall rules
- Verify DNS resolution
- Check network connectivity

## Performance Baseline Targets

| Metric | Target | Baseline | Ramp-Up | Stress | Spike | Endurance |
|--------|--------|----------|---------|--------|-------|-----------|
| P50 Response Time | < 100ms | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P95 Response Time | < 200ms | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P99 Response Time | < 500ms | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Error Rate | < 0.1% | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Throughput | > 100 req/s | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| Concurrent Users | 10-25 | ✅ | ⏳ | ⏳ | ⏳ | ✅ |

## Next Steps

1. **Prepare Staging Environment**
   - Deploy latest code
   - Configure database
   - Set up monitoring
   - Create test users

2. **Execute Baseline Test**
   - Run with 10 users
   - Analyze results
   - Document baseline metrics

3. **Execute Progressive Tests**
   - Ramp-up test (50 users)
   - Stress test (100 users)
   - Spike test (500 users)
   - Endurance test (25 users, 10 min)

4. **Analyze Results**
   - Compare against targets
   - Identify bottlenecks
   - Plan optimizations

5. **Optimize & Re-test**
   - Implement fixes
   - Re-run tests
   - Verify improvements

## Support & Resources

- **k6 Documentation:** https://k6.io/docs
- **k6 Cloud:** https://cloud.k6.io
- **Performance Testing Guide:** https://k6.io/docs/test-types/performance-testing
- **Troubleshooting:** https://k6.io/docs/misc/troubleshooting

---

**Package Version:** 1.0  
**Last Updated:** January 16, 2026  
**Ready for Execution:** ✅ Yes
