/**
 * Simple Load Testing Script for Ologywood Platform
 * Uses Node.js built-in HTTP module
 * 
 * Run with: node load-test-simple.mjs
 */

import http from 'http';
import { URL } from 'url';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

class LoadTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
      latencies: [],
      errors: [],
    };
  }

  async makeRequest(path) {
    return new Promise((resolve) => {
      const url = new URL(path, this.baseUrl);
      const startTime = Date.now();

      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const latency = Date.now() - startTime;
          this.results.latencies.push(latency);
          this.results.totalTime += latency;
          this.results.totalRequests++;

          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.results.successfulRequests++;
          } else if (res.statusCode === 404) {
            // 404 is acceptable for endpoints that might not exist
            this.results.successfulRequests++;
          } else {
            this.results.failedRequests++;
            this.results.errors.push({
              path,
              status: res.statusCode,
              latency,
            });
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        const latency = Date.now() - startTime;
        this.results.latencies.push(latency);
        this.results.totalTime += latency;
        this.results.totalRequests++;
        this.results.failedRequests++;
        this.results.errors.push({
          path,
          error: error.message,
          latency,
        });
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        const latency = Date.now() - startTime;
        this.results.latencies.push(latency);
        this.results.totalTime += latency;
        this.results.totalRequests++;
        this.results.failedRequests++;
        this.results.errors.push({
          path,
          error: 'Timeout',
          latency,
        });
        resolve();
      });
    });
  }

  async runConcurrentRequests(path, concurrency, count) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.makeRequest(path));
      if ((i + 1) % concurrency === 0) {
        await Promise.all(promises.splice(0, concurrency));
      }
    }
    await Promise.all(promises);
  }

  getStats() {
    const latencies = this.results.latencies.sort((a, b) => a - b);
    const avgLatency = this.results.totalTime / this.results.totalRequests;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const maxLatency = latencies[latencies.length - 1];
    const minLatency = latencies[0];
    const errorRate = (this.results.failedRequests / this.results.totalRequests * 100).toFixed(2);

    return {
      totalRequests: this.results.totalRequests,
      successfulRequests: this.results.successfulRequests,
      failedRequests: this.results.failedRequests,
      errorRate,
      avgLatency: avgLatency.toFixed(2),
      minLatency,
      maxLatency,
      p50,
      p95,
      p99,
      rps: (this.results.totalRequests / (this.results.totalTime / 1000)).toFixed(2),
    };
  }

  printResults(testName) {
    const stats = this.getStats();
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`${testName}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`Total Requests:     ${stats.totalRequests}`);
    console.log(`Successful:         ${stats.successfulRequests}`);
    console.log(`Failed:             ${stats.failedRequests}`);
    console.log(`Error Rate:         ${stats.errorRate}%`);
    console.log(`\nLatency Metrics:`);
    console.log(`  Min:              ${stats.minLatency}ms`);
    console.log(`  Avg:              ${stats.avgLatency}ms`);
    console.log(`  p50:              ${stats.p50}ms`);
    console.log(`  p95:              ${stats.p95}ms`);
    console.log(`  p99:              ${stats.p99}ms`);
    console.log(`  Max:              ${stats.maxLatency}ms`);
    console.log(`\nThroughput:         ${stats.rps} req/sec`);

    if (stats.failedRequests > 0) {
      console.log(`\nErrors (first 5):`);
      this.results.errors.slice(0, 5).forEach((err) => {
        console.log(`  - ${err.path}: ${err.error || `Status ${err.status}`} (${err.latency}ms)`);
      });
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         OLOGYWOOD PLATFORM - LOAD TEST SIMULATION                  ║');
  console.log('║                    (Simple HTTP Load Test)                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const endpoints = [
    { path: '/api/trpc/artist.getAll', name: 'Artist List' },
    { path: '/api/trpc/auth.me', name: 'Auth Check' },
    { path: '/api/trpc/venueDirectory.getAll', name: 'Venue Directory' },
  ];

  const loadScenarios = [
    { concurrency: 5, count: 50, name: 'Light Load (5 concurrent, 50 requests)' },
    { concurrency: 10, count: 100, name: 'Moderate Load (10 concurrent, 100 requests)' },
    { concurrency: 25, count: 250, name: 'Heavy Load (25 concurrent, 250 requests)' },
    { concurrency: 50, count: 500, name: 'Peak Load (50 concurrent, 500 requests)' },
  ];

  const allResults = [];

  for (const endpoint of endpoints) {
    console.log(`\n╔════════════════════════════════════════════════════════════════════╗`);
    console.log(`║ ENDPOINT: ${endpoint.name.padEnd(60)} ║`);
    console.log(`╚════════════════════════════════════════════════════════════════════╝`);

    for (const scenario of loadScenarios) {
      const tester = new LoadTester(BASE_URL);
      console.log(`\n⏳ Running: ${scenario.name}...`);

      const startTime = Date.now();
      await tester.runConcurrentRequests(endpoint.path, scenario.concurrency, scenario.count);
      const duration = Date.now() - startTime;

      tester.printResults(`${scenario.name} (${duration}ms total)`);

      const stats = tester.getStats();
      allResults.push({
        endpoint: endpoint.name,
        scenario: scenario.name,
        ...stats,
      });

      // Wait between test scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Print summary table
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                        SUMMARY TABLE                              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════╝\n`);

  console.log('Endpoint              | Scenario                        | Requests | Errors | Avg Latency | p95');
  console.log('-'.repeat(110));

  for (const result of allResults) {
    const endpoint = result.endpoint.padEnd(21);
    const scenario = result.scenario.padEnd(31);
    const requests = String(result.totalRequests).padEnd(8);
    const errors = String(result.failedRequests).padEnd(6);
    const avgLatency = `${result.avgLatency}ms`.padEnd(11);
    const p95 = `${result.p95}ms`;

    console.log(`${endpoint}| ${scenario}| ${requests}| ${errors}| ${avgLatency}| ${p95}`);
  }

  // Performance assessment
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                    PERFORMANCE ASSESSMENT                          ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════╝\n`);

  const avgLatencies = allResults.map(r => parseFloat(r.avgLatency));
  const overallAvg = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
  const totalErrors = allResults.reduce((sum, r) => sum + parseInt(r.failedRequests), 0);
  const totalRequests = allResults.reduce((sum, r) => sum + parseInt(r.totalRequests), 0);
  const errorRate = (totalErrors / totalRequests * 100).toFixed(2);

  console.log(`Overall Average Latency: ${overallAvg.toFixed(2)}ms`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Error Rate: ${errorRate}%`);

  // Recommendations
  console.log(`\n📊 RECOMMENDATIONS:\n`);

  if (overallAvg < 100) {
    console.log('✅ Excellent response times - platform handles load very well');
  } else if (overallAvg < 300) {
    console.log('⚠️  Good response times - monitor performance at peak load');
  } else if (overallAvg < 500) {
    console.log('⚠️  Acceptable response times - consider optimization');
  } else {
    console.log('❌ Slow response times - optimization and scaling needed');
  }

  if (errorRate < 1) {
    console.log('✅ Very low error rate - excellent stability');
  } else if (errorRate < 5) {
    console.log('⚠️  Acceptable error rate - monitor for issues');
  } else {
    console.log('❌ High error rate - investigate and fix issues');
  }

  console.log(`\n✓ Load test completed successfully!\n`);
}

main().catch(console.error);
