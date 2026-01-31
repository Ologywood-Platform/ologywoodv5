/**
 * Load Testing Script for Ologywood Platform
 * Uses autocannon for performance testing
 * 
 * Run with: node load-test-autocannon.mjs
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test scenarios
const scenarios = [
  {
    name: 'Artist List (Browse)',
    path: '/api/trpc/artist.getAll',
    method: 'GET',
  },
  {
    name: 'Auth Check',
    path: '/api/trpc/auth.me',
    method: 'GET',
  },
  {
    name: 'Venue Directory',
    path: '/api/trpc/venueDirectory.getAll',
    method: 'GET',
  },
];

async function runLoadTest(scenario, connections, duration) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${scenario.name}`);
  console.log(`Connections: ${connections} | Duration: ${duration}s`);
  console.log(`${'='.repeat(70)}\n`);

  const result = await autocannon({
    url: `${BASE_URL}${scenario.path}`,
    connections,
    duration,
    pipelining: 1,
    requests: [
      {
        path: scenario.path,
        method: scenario.method,
      },
    ],
  });

  return result;
}

function formatResults(result) {
  console.log(`\n✓ Total Requests: ${result.requests.total}`);
  console.log(`✓ Successful: ${result.requests.total - (result.errors || 0)}`);
  console.log(`✓ Failed: ${result.errors || 0}`);
  console.log(`✓ Throughput: ${result.throughput.total} bytes/sec`);
  console.log(`✓ Response Time (avg): ${result.latency.mean.toFixed(2)}ms`);
  console.log(`✓ Response Time (p50): ${result.latency.p50}ms`);
  console.log(`✓ Response Time (p95): ${result.latency.p95}ms`);
  console.log(`✓ Response Time (p99): ${result.latency.p99}ms`);
  console.log(`✓ Requests/sec: ${result.rps.mean.toFixed(2)}`);
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         OLOGYWOOD PLATFORM - LOAD TEST SIMULATION                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const testConfigs = [
    { connections: 10, duration: 10, name: 'Light Load (10 users)' },
    { connections: 25, duration: 15, name: 'Moderate Load (25 users)' },
    { connections: 50, duration: 20, name: 'Heavy Load (50 users)' },
    { connections: 100, duration: 20, name: 'Peak Load (100 users)' },
  ];

  const allResults = [];

  for (const scenario of scenarios) {
    console.log(`\n\n╔════════════════════════════════════════════════════════════════════╗`);
    console.log(`║ SCENARIO: ${scenario.name.padEnd(60)} ║`);
    console.log(`╚════════════════════════════════════════════════════════════════════╝`);

    for (const config of testConfigs) {
      try {
        const result = await runLoadTest(scenario, config.connections, config.duration);
        formatResults(result);
        
        allResults.push({
          scenario: scenario.name,
          config: config.name,
          requests: result.requests.total,
          errors: result.errors || 0,
          avgLatency: result.latency.mean,
          p95Latency: result.latency.p95,
          p99Latency: result.latency.p99,
          rps: result.rps.mean,
        });

        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error running test: ${error.message}`);
      }
    }
  }

  // Print summary table
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                        SUMMARY TABLE                              ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════╝\n`);

  console.log('Scenario                    | Config              | Requests | Errors | Avg Latency | p95 Latency');
  console.log('-'.repeat(110));

  for (const result of allResults) {
    const scenario = result.scenario.padEnd(27);
    const config = result.config.padEnd(19);
    const requests = String(result.requests).padEnd(8);
    const errors = String(result.errors).padEnd(6);
    const avgLatency = `${result.avgLatency.toFixed(2)}ms`.padEnd(11);
    const p95Latency = `${result.p95Latency}ms`;

    console.log(`${scenario}| ${config}| ${requests}| ${errors}| ${avgLatency}| ${p95Latency}`);
  }

  // Performance assessment
  console.log(`\n\n╔════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                    PERFORMANCE ASSESSMENT                          ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════╝\n`);

  const avgLatencies = allResults.map(r => r.avgLatency);
  const overallAvg = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors, 0);
  const totalRequests = allResults.reduce((sum, r) => sum + r.requests, 0);
  const errorRate = (totalErrors / totalRequests * 100).toFixed(2);

  console.log(`Overall Average Latency: ${overallAvg.toFixed(2)}ms`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Error Rate: ${errorRate}%`);

  // Recommendations
  console.log(`\n📊 RECOMMENDATIONS:\n`);
  
  if (overallAvg < 100) {
    console.log('✅ Excellent response times - platform handles load well');
  } else if (overallAvg < 300) {
    console.log('⚠️  Good response times - monitor performance at peak load');
  } else {
    console.log('❌ Slow response times - consider optimization and scaling');
  }

  if (errorRate < 1) {
    console.log('✅ Very low error rate - excellent stability');
  } else if (errorRate < 5) {
    console.log('⚠️  Acceptable error rate - monitor for issues');
  } else {
    console.log('❌ High error rate - investigate and fix issues');
  }

  console.log('\n');
}

main().catch(console.error);
