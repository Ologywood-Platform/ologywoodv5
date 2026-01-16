/**
 * Load Testing Suite for Ologywood Platform
 * Uses k6 for performance and stress testing
 * 
 * Installation:
 * brew install k6
 * 
 * Usage:
 * k6 run tests/load-testing.js
 * k6 run --vus 100 --duration 30s tests/load-testing.js
 * k6 run --stage 30s:20 --stage 1m30s:100 --stage 20s:0 tests/load-testing.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const contractSigningTime = new Trend('contract_signing_time');
const pdfGenerationTime = new Trend('pdf_generation_time');
const supportTicketCreationTime = new Trend('support_ticket_creation_time');
const authenticationTime = new Trend('authentication_time');
const requestCount = new Counter('requests');
const activeConnections = new Gauge('active_connections');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@ologywood.com';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'password123';

// Test scenarios
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up to 20 users
    { duration: '1m30s', target: 100 }, // Ramp-up to 100 users
    { duration: '20s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.1'],                  // Error rate < 10%
    'errors': ['rate<0.1'],                           // Custom error rate < 10%
  },
};

// Helper function to make authenticated requests
function authenticatedRequest(method, url, payload = null, params = {}) {
  const defaultParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN || ''}`,
    },
  };

  const mergedParams = { ...defaultParams, ...params };
  let response;

  if (method === 'GET') {
    response = http.get(url, mergedParams);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(payload), mergedParams);
  } else if (method === 'PUT') {
    response = http.put(url, JSON.stringify(payload), mergedParams);
  } else if (method === 'DELETE') {
    response = http.del(url, mergedParams);
  }

  requestCount.add(1);
  activeConnections.add(1);

  return response;
}

// Test 1: Authentication
export function testAuthentication() {
  group('Authentication', () => {
    const startTime = new Date();

    const response = http.post(`${BASE_URL}/trpc/auth.login`, JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const duration = new Date() - startTime;
    authenticationTime.add(duration);

    check(response, {
      'login successful': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 2: Contract Management
export function testContractManagement() {
  group('Contract Management', () => {
    // Get contracts
    const contractsResponse = authenticatedRequest(
      'GET',
      `${BASE_URL}/trpc/contractManagement.getArtistContracts`
    );

    check(contractsResponse, {
      'get contracts successful': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    // Create contract
    const createResponse = authenticatedRequest(
      'POST',
      `${BASE_URL}/trpc/contractManagement.createContract`,
      {
        bookingId: 'test-booking-123',
        artistId: 'test-artist-123',
        venueId: 'test-venue-123',
        templateId: 'default',
        customFields: {
          performanceFee: 5000,
          eventDate: new Date().toISOString(),
        },
      }
    );

    check(createResponse, {
      'create contract successful': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 3: Contract Signing
export function testContractSigning() {
  group('Contract Signing', () => {
    const startTime = new Date();

    const signResponse = authenticatedRequest(
      'POST',
      `${BASE_URL}/trpc/contractManagement.signContract`,
      {
        contractId: 'test-contract-123',
        signatureData: 'base64-encoded-signature',
        signerName: 'Test Artist',
        signerEmail: 'artist@test.com',
      }
    );

    const duration = new Date() - startTime;
    contractSigningTime.add(duration);

    check(signResponse, {
      'sign contract successful': (r) => r.status === 200,
      'response time < 2000ms': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 4: PDF Generation
export function testPdfGeneration() {
  group('PDF Generation', () => {
    const startTime = new Date();

    const pdfResponse = authenticatedRequest(
      'POST',
      `${BASE_URL}/trpc/contractPdf.generatePdf`,
      {
        contractId: 'test-contract-123',
        includeSignatures: true,
      }
    );

    const duration = new Date() - startTime;
    pdfGenerationTime.add(duration);

    check(pdfResponse, {
      'generate PDF successful': (r) => r.status === 200,
      'response time < 3000ms': (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 5: Support Tickets
export function testSupportTickets() {
  group('Support Tickets', () => {
    const startTime = new Date();

    const ticketResponse = authenticatedRequest(
      'POST',
      `${BASE_URL}/trpc/helpAndSupport.createTicket`,
      {
        subject: 'Test Support Ticket',
        description: 'This is a test support ticket for load testing',
        category: 'technical',
        priority: 'medium',
      }
    );

    const duration = new Date() - startTime;
    supportTicketCreationTime.add(duration);

    check(ticketResponse, {
      'create ticket successful': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 6: Analytics Dashboard
export function testAnalyticsDashboard() {
  group('Analytics Dashboard', () => {
    const analyticsResponse = authenticatedRequest(
      'GET',
      `${BASE_URL}/trpc/analytics.getDashboard`
    );

    check(analyticsResponse, {
      'get analytics successful': (r) => r.status === 200,
      'response time < 2000ms': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 7: Help Center Search
export function testHelpCenterSearch() {
  group('Help Center', () => {
    const searchResponse = authenticatedRequest(
      'GET',
      `${BASE_URL}/trpc/helpAndSupport.searchArticles?query=contract`
    );

    check(searchResponse, {
      'search articles successful': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Test 8: Certificate Verification
export function testCertificateVerification() {
  group('Certificate Verification', () => {
    const verifyResponse = authenticatedRequest(
      'POST',
      `${BASE_URL}/trpc/contractManagement.verifyCertificate`,
      {
        certificateNumber: 'CERT-2024-001-ABC123',
      }
    );

    check(verifyResponse, {
      'verify certificate successful': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
  });
}

// Main test function
export default function () {
  activeConnections.add(1);

  testAuthentication();
  testContractManagement();
  testContractSigning();
  testPdfGeneration();
  testSupportTickets();
  testAnalyticsDashboard();
  testHelpCenterSearch();
  testCertificateVerification();

  activeConnections.add(-1);
  sleep(1);
}

// Summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}
