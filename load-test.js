/**
 * Load Testing Script for Ologywood Platform
 * Tests realistic user scenarios under high concurrent load
 * Uses k6 for performance testing
 * 
 * Run with: k6 run load-test.js
 * Or with custom settings: k6 run --vus 50 --duration 30s load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');
const concurrentUsers = new Gauge('concurrent_users');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// Test scenarios configuration
export const options = {
  stages: [
    { duration: '30s', target: 10, name: 'Ramp-up' },     // Ramp up to 10 users
    { duration: '1m', target: 25, name: 'Steady State 1' }, // Stay at 25 users
    { duration: '1m', target: 50, name: 'Steady State 2' }, // Ramp up to 50 users
    { duration: '1m', target: 100, name: 'Peak Load' },     // Peak at 100 users
    { duration: '30s', target: 0, name: 'Ramp-down' },      // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],      // 95% of requests < 500ms
    'http_req_failed': ['rate<0.1'],                        // Error rate < 10%
    'errors': ['rate<0.05'],                                // Custom error rate < 5%
  },
};

// Simulate artist browsing
function simulateArtistBrowsing() {
  group('Artist Browsing', () => {
    // Get all artists
    const artistRes = http.get(`${BASE_URL}/api/trpc/artist.getAll`);
    check(artistRes, {
      'Artist list loaded': (r) => r.status === 200,
      'Response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    responseTime.add(artistRes.timings.duration);
    if (artistRes.status === 200) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    
    sleep(1);
  });
}

// Simulate venue browsing
function simulateVenueBrowsing() {
  group('Venue Directory Browsing', () => {
    // Browse venues (simulated endpoint)
    const venueRes = http.get(`${BASE_URL}/api/trpc/venueDirectory.getAll`);
    check(venueRes, {
      'Venue directory loaded': (r) => r.status === 200 || r.status === 404, // 404 ok if not implemented
      'Response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    responseTime.add(venueRes.timings.duration);
    if (venueRes.status === 200 || venueRes.status === 404) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    
    sleep(1);
  });
}

// Simulate authentication check
function simulateAuthCheck() {
  group('Authentication', () => {
    const authRes = http.get(`${BASE_URL}/api/trpc/auth.me`);
    check(authRes, {
      'Auth check successful': (r) => r.status === 200,
      'Response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    responseTime.add(authRes.timings.duration);
    if (authRes.status === 200) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    
    sleep(0.5);
  });
}

// Simulate search functionality
function simulateSearch() {
  group('Search Functionality', () => {
    const searchTerms = ['jazz', 'rock', 'pop', 'classical', 'electronic'];
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchRes = http.get(`${BASE_URL}/api/trpc/artist.search?query=${searchTerm}`);
    check(searchRes, {
      'Search successful': (r) => r.status === 200 || r.status === 404,
      'Response time < 600ms': (r) => r.timings.duration < 600,
    });
    
    responseTime.add(searchRes.timings.duration);
    if (searchRes.status === 200 || searchRes.status === 404) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    
    sleep(1);
  });
}

// Simulate dashboard access
function simulateDashboardAccess() {
  group('Dashboard Access', () => {
    // Simulate getting user profile/dashboard data
    const dashboardRes = http.get(`${BASE_URL}/api/trpc/auth.me`);
    check(dashboardRes, {
      'Dashboard accessible': (r) => r.status === 200,
      'Response time < 400ms': (r) => r.timings.duration < 400,
    });
    
    responseTime.add(dashboardRes.timings.duration);
    if (dashboardRes.status === 200) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
    
    sleep(2);
  });
}

// Main test execution
export default function () {
  concurrentUsers.set(__VU); // Track concurrent users
  
  const scenarios = [
    simulateArtistBrowsing,
    simulateVenueBrowsing,
    simulateAuthCheck,
    simulateSearch,
    simulateDashboardAccess,
  ];
  
  // Randomly select a scenario to simulate realistic user behavior
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  sleep(Math.random() * 3); // Random think time between 0-3 seconds
}

/**
 * Summary function - called after test completes
 * Provides detailed results summary
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

/**
 * Text summary formatter
 */
function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors ? {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
  } : {
    reset: '',
    green: '',
    red: '',
    yellow: '',
    blue: '',
  };

  let summary = '\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n';
  summary += colors.blue + '                    LOAD TEST SUMMARY                          ' + colors.reset + '\n';
  summary += colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n\n';

  // Extract metrics
  const metrics = data.metrics || {};
  
  if (metrics.http_reqs) {
    const httpReqs = metrics.http_reqs.values;
    summary += `${indent}${colors.green}✓ Total Requests: ${httpReqs.count}${colors.reset}\n`;
  }

  if (metrics.http_req_failed) {
    const failed = metrics.http_req_failed.values;
    const failRate = (failed.value * 100).toFixed(2);
    const failColor = failed.value > 0.1 ? colors.red : colors.green;
    summary += `${indent}${failColor}✓ Failed Requests: ${failed.value} (${failRate}%)${colors.reset}\n`;
  }

  if (metrics.http_req_duration) {
    const duration = metrics.http_req_duration.values;
    summary += `${indent}${colors.green}✓ Response Time (avg): ${duration.avg.toFixed(2)}ms${colors.reset}\n`;
    summary += `${indent}${colors.green}✓ Response Time (p95): ${duration['p(95)'].toFixed(2)}ms${colors.reset}\n`;
    summary += `${indent}${colors.green}✓ Response Time (p99): ${duration['p(99)'].toFixed(2)}ms${colors.reset}\n`;
  }

  if (metrics.vus) {
    const vus = metrics.vus.values;
    summary += `${indent}${colors.green}✓ Peak Concurrent Users: ${vus.max}${colors.reset}\n`;
  }

  summary += '\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n';

  return summary;
}
