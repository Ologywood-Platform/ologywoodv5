#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Test data
const artistUserId = 450137; // From the logs
const venueUserId = 450138; // Assuming this exists

async function testEndpoint(method, path, body = null, description = '') {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${description}`);
    if (!response.ok) {
      console.log(`   Error: ${data.message || JSON.stringify(data)}`);
    }
    return response.ok;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Testing Artist Dashboard Endpoints\n');
  
  // Test artist profile endpoints
  await testEndpoint('GET', '/api/trpc/artist.getMyProfile', null, 'Get artist profile');
  await testEndpoint('POST', '/api/trpc/artist.updateProfile', {
    artistName: 'Test Artist',
    bio: 'Test bio',
    location: 'New York',
  }, 'Update artist profile');
  
  console.log('\n🧪 Testing Venue Dashboard Endpoints\n');
  
  // Test venue profile endpoints
  await testEndpoint('GET', '/api/trpc/venue.getMyProfile', null, 'Get venue profile');
  await testEndpoint('POST', '/api/trpc/venue.updateProfile', {
    organizationName: 'Test Venue',
    location: 'Los Angeles',
    capacity: 500,
    phone: '555-1234',
    website: 'https://example.com',
    bio: 'Test venue bio',
  }, 'Update venue profile with all fields');
  
  console.log('\n🧪 Testing Account Endpoints\n');
  
  // Test account endpoints
  await testEndpoint('GET', '/api/trpc/account.validateDeletion', null, 'Validate account deletion');
  
  console.log('\n✨ Dashboard endpoint tests complete!\n');
}

runTests().catch(console.error);
