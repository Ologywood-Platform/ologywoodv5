# Ologywood - Load Testing Plan & Execution

**Version:** 1.0  
**Date:** February 19, 2026  
**Purpose:** Verify platform performance under production-like traffic  
**Estimated Duration:** 2-3 hours

---

## Overview

This document outlines the comprehensive load testing strategy to verify the Ologywood platform can handle expected production traffic and identify performance bottlenecks.

---

## Testing Objectives

1. **Baseline Performance** - Measure response times with normal traffic
2. **Load Testing** - Verify performance with 100-1000 concurrent users
3. **Stress Testing** - Find breaking point and recovery behavior
4. **Spike Testing** - Test sudden traffic increases
5. **Soak Testing** - Verify stability over extended periods

---

## Test Scenarios

### Scenario 1: Normal Traffic (Baseline)
- **Users:** 10 concurrent
- **Duration:** 5 minutes
- **Expected:** < 100ms response time
- **Purpose:** Establish baseline metrics

### Scenario 2: Light Load
- **Users:** 50 concurrent
- **Duration:** 10 minutes
- **Expected:** < 200ms response time
- **Purpose:** Verify performance with moderate traffic

### Scenario 3: Medium Load
- **Users:** 200 concurrent
- **Duration:** 15 minutes
- **Expected:** < 500ms response time
- **Purpose:** Test with realistic production load

### Scenario 4: Heavy Load
- **Users:** 500 concurrent
- **Duration:** 20 minutes
- **Expected:** < 1000ms response time
- **Purpose:** Stress test the system

### Scenario 5: Peak Load
- **Users:** 1000 concurrent
- **Duration:** 10 minutes
- **Expected:** System should remain stable
- **Purpose:** Find breaking point

### Scenario 6: Spike Test
- **Users:** 0 → 500 in 30 seconds
- **Duration:** 5 minutes
- **Expected:** Graceful handling of spike
- **Purpose:** Test auto-scaling and recovery

### Scenario 7: Soak Test
- **Users:** 100 concurrent
- **Duration:** 1 hour
- **Expected:** No memory leaks or degradation
- **Purpose:** Verify long-term stability

---

## Test Tools

### Apache Bench (ab)
```bash
# Simple HTTP load testing
ab -n 1000 -c 100 http://localhost:3000/
```

### wrk (Modern Load Testing)
```bash
# High-performance load testing
wrk -t12 -c400 -d30s http://localhost:3000/
```

### k6 (Scriptable Load Testing)
```bash
# Advanced scenarios with scripts
k6 run load-test.js
```

### Artillery (Node.js Load Testing)
```bash
# Easy-to-use load testing
artillery quick --count 100 --num 1000 http://localhost:3000/
```

---

## Metrics to Measure

### Response Time
- **Min:** Minimum response time
- **Max:** Maximum response time
- **Avg:** Average response time
- **P95:** 95th percentile (95% of requests faster than this)
- **P99:** 99th percentile (99% of requests faster than this)

### Throughput
- **RPS:** Requests per second
- **Bandwidth:** Bytes per second

### Error Rate
- **4xx Errors:** Client errors (bad requests)
- **5xx Errors:** Server errors
- **Timeouts:** Requests that timeout

### Resource Usage
- **CPU:** CPU utilization percentage
- **Memory:** RAM usage
- **Disk I/O:** Disk read/write operations
- **Network:** Network bandwidth usage

### Database Metrics
- **Query Time:** Average query execution time
- **Connection Pool:** Active connections
- **Lock Wait Time:** Time waiting for locks

---

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| Response Time (Avg) | < 100ms | < 200ms | > 500ms |
| Response Time (P95) | < 200ms | < 500ms | > 1000ms |
| Response Time (P99) | < 500ms | < 1000ms | > 2000ms |
| Error Rate | < 0.1% | < 1% | > 5% |
| CPU Usage | < 50% | < 75% | > 90% |
| Memory Usage | < 60% | < 80% | > 95% |
| Throughput | > 1000 RPS | > 500 RPS | < 100 RPS |

---

## Test Execution Plan

### Phase 1: Setup (15 minutes)
- [ ] Install load testing tools
- [ ] Start development server
- [ ] Verify application is running
- [ ] Prepare test scripts

### Phase 2: Baseline Testing (15 minutes)
- [ ] Run baseline test (10 concurrent users)
- [ ] Record baseline metrics
- [ ] Verify no errors
- [ ] Document results

### Phase 3: Progressive Load Testing (45 minutes)
- [ ] Test with 50 concurrent users
- [ ] Test with 200 concurrent users
- [ ] Test with 500 concurrent users
- [ ] Test with 1000 concurrent users
- [ ] Record metrics at each level

### Phase 4: Advanced Testing (30 minutes)
- [ ] Spike test (sudden increase)
- [ ] Soak test (1 hour at 100 users)
- [ ] Recovery test (after spike)

### Phase 5: Analysis (30 minutes)
- [ ] Analyze results
- [ ] Identify bottlenecks
- [ ] Generate report
- [ ] Recommend optimizations

---

## Installation & Setup

### Install Load Testing Tools

```bash
# Install Apache Bench (usually pre-installed)
# macOS
brew install httpd

# Ubuntu
sudo apt install apache2-utils

# Install wrk
# macOS
brew install wrk

# Ubuntu
sudo apt install wrk

# Install k6
# macOS
brew install k6

# Ubuntu
sudo apt install k6

# Install Artillery
npm install -g artillery
```

### Verify Installation

```bash
ab -h
wrk --help
k6 version
artillery --version
```

---

## Load Testing Scripts

### Apache Bench - Simple Test

```bash
# Baseline test (10 concurrent, 100 requests)
ab -n 100 -c 10 http://localhost:3000/

# Light load (50 concurrent, 5000 requests)
ab -n 5000 -c 50 http://localhost:3000/

# Medium load (200 concurrent, 10000 requests)
ab -n 10000 -c 200 http://localhost:3000/

# Heavy load (500 concurrent, 20000 requests)
ab -n 20000 -c 500 http://localhost:3000/
```

### wrk - Advanced Test

```bash
# Baseline (10 threads, 100 connections, 30 seconds)
wrk -t10 -c100 -d30s http://localhost:3000/

# Light load (12 threads, 200 connections, 60 seconds)
wrk -t12 -c200 -d60s http://localhost:3000/

# Medium load (12 threads, 500 connections, 60 seconds)
wrk -t12 -c500 -d60s http://localhost:3000/

# Heavy load (12 threads, 1000 connections, 60 seconds)
wrk -t12 -c1000 -d60s http://localhost:3000/
```

### k6 - Scriptable Test

Create `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
};

export default function () {
  // Test homepage
  let res = http.get('http://localhost:3000/');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);

  // Test API
  res = http.get('http://localhost:3000/api/trpc/artist.getAll');
  check(res, { 'api status is 200': (r) => r.status === 200 });
  sleep(1);

  // Test search
  res = http.get('http://localhost:3000/api/trpc/artist.search?query=jazz');
  check(res, { 'search status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

Run with k6:
```bash
k6 run load-test.js
```

### Artillery - Scenario Test

Create `load-test.yml`:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Light load"
    - duration: 300
      arrivalRate: 100
      name: "Medium load"
    - duration: 300
      arrivalRate: 200
      name: "Heavy load"
    - duration: 60
      arrivalRate: 10
      name: "Cool down"

scenarios:
  - name: "User Journey"
    flow:
      - get:
          url: "/"
      - think: 2
      - get:
          url: "/api/trpc/artist.getAll"
      - think: 2
      - get:
          url: "/api/trpc/artist.search?query=jazz"
      - think: 2
```

Run with Artillery:
```bash
artillery run load-test.yml
```

---

## Monitoring During Tests

### Monitor CPU & Memory

```bash
# Real-time monitoring
top

# Or use htop
htop

# Or use watch with free
watch -n 1 free -h
```

### Monitor Network

```bash
# Monitor network connections
netstat -an | grep ESTABLISHED | wc -l

# Or use ss
ss -tan | grep ESTABLISHED | wc -l
```

### Monitor Database

```bash
# Check active connections
mysql -u ologywood_user -p ologywood_prod -e "SHOW PROCESSLIST;"

# Check slow queries
mysql -u ologywood_user -p ologywood_prod -e "SHOW VARIABLES LIKE 'slow_query%';"
```

### Monitor Application Logs

```bash
# Watch logs in real-time
tail -f /var/log/ologywood/app.log

# Or grep for errors
grep ERROR /var/log/ologywood/app.log
```

---

## Test Execution Steps

### Step 1: Start Application

```bash
# Terminal 1: Start application
cd /home/ubuntu/ologywood
pnpm dev

# Wait for: "Server running on http://localhost:3000/"
```

### Step 2: Open Monitoring

```bash
# Terminal 2: Monitor system
htop

# Terminal 3: Monitor logs
tail -f /var/log/ologywood/app.log

# Terminal 4: Monitor database
watch -n 1 'mysql -u ologywood_user -p ologywood_prod -e "SHOW PROCESSLIST;" 2>/dev/null | wc -l'
```

### Step 3: Run Baseline Test

```bash
# Terminal 5: Run baseline test
ab -n 100 -c 10 http://localhost:3000/

# Record results
# Example output:
# Requests per second:    1000.00 [#/sec]
# Time per request:       10.000 [ms]
# Failed requests:        0
```

### Step 4: Run Progressive Load Tests

```bash
# Light load
ab -n 5000 -c 50 http://localhost:3000/

# Medium load
ab -n 10000 -c 200 http://localhost:3000/

# Heavy load
ab -n 20000 -c 500 http://localhost:3000/

# Peak load
ab -n 30000 -c 1000 http://localhost:3000/
```

### Step 5: Run Advanced Tests

```bash
# Spike test with wrk
wrk -t12 -c1000 -d30s http://localhost:3000/

# Soak test with k6
k6 run load-test.js
```

---

## Results Analysis

### Expected Results (Baseline)

```
Requests per second:    1000+
Time per request:       < 100ms
Failed requests:        0
CPU usage:              < 30%
Memory usage:           < 40%
```

### Expected Results (Light Load)

```
Requests per second:    800+
Time per request:       < 200ms
Failed requests:        0
CPU usage:              < 50%
Memory usage:           < 50%
```

### Expected Results (Medium Load)

```
Requests per second:    500+
Time per request:       < 500ms
Failed requests:        < 1%
CPU usage:              < 75%
Memory usage:           < 70%
```

### Expected Results (Heavy Load)

```
Requests per second:    200+
Time per request:       < 1000ms
Failed requests:        < 5%
CPU usage:              < 90%
Memory usage:           < 85%
```

---

## Troubleshooting

### High Response Times
- Check CPU usage
- Check database query performance
- Check network latency
- Optimize slow endpoints

### High Error Rate
- Check application logs
- Check database connections
- Check memory usage
- Verify database is responsive

### Memory Leak
- Monitor memory over time
- Check for unclosed connections
- Review code for memory leaks
- Restart application if needed

### Database Bottleneck
- Check active connections
- Check slow queries
- Add indexes if needed
- Optimize queries

---

## Optimization Recommendations

### If Performance is Poor

1. **Add Caching**
   - Cache frequently accessed data
   - Use Redis for session storage
   - Implement HTTP caching headers

2. **Optimize Database**
   - Add indexes on frequently queried columns
   - Optimize slow queries
   - Use connection pooling
   - Consider read replicas

3. **Optimize Code**
   - Profile application
   - Remove unnecessary computations
   - Implement lazy loading
   - Use pagination for large datasets

4. **Scale Infrastructure**
   - Add more CPU cores
   - Increase RAM
   - Use load balancer
   - Add multiple application servers

---

## Success Criteria

✅ **Platform is ready for production if:**
- [ ] Baseline response time < 100ms
- [ ] Light load response time < 200ms
- [ ] Medium load response time < 500ms
- [ ] Error rate < 1% under heavy load
- [ ] CPU usage < 90% under peak load
- [ ] Memory usage < 85% under peak load
- [ ] No memory leaks detected
- [ ] Graceful recovery after spike
- [ ] Stable performance over 1 hour soak test

---

## Next Steps

1. **Execute Baseline Test** - Establish baseline metrics
2. **Run Progressive Tests** - Test with increasing load
3. **Run Advanced Tests** - Test spikes and soak
4. **Analyze Results** - Identify bottlenecks
5. **Optimize** - Implement improvements if needed
6. **Re-test** - Verify optimizations
7. **Document** - Create final report

---

**Document Version:** 1.0  
**Last Updated:** February 19, 2026  
**Status:** READY FOR EXECUTION

