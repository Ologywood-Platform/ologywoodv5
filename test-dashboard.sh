#!/bin/bash

BASE_URL="http://localhost:3000/api/trpc"

echo "🧪 Testing Artist Dashboard Endpoints"
echo ""

echo "✅ Testing: Get artist profile"
curl -s -X GET "$BASE_URL/artist.getMyProfile" | jq '.' || echo "Failed"

echo ""
echo "✅ Testing: Update artist profile"
curl -s -X POST "$BASE_URL/artist.updateProfile" \
  -H "Content-Type: application/json" \
  -d '{
    "artistName": "Test Artist",
    "bio": "Test bio",
    "location": "New York"
  }' | jq '.' || echo "Failed"

echo ""
echo "🧪 Testing Venue Dashboard Endpoints"
echo ""

echo "✅ Testing: Get venue profile"
curl -s -X GET "$BASE_URL/venue.getMyProfile" | jq '.' || echo "Failed"

echo ""
echo "✅ Testing: Update venue profile with all fields"
curl -s -X POST "$BASE_URL/venue.updateProfile" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Venue",
    "location": "Los Angeles",
    "capacity": 500,
    "phone": "555-1234",
    "website": "https://example.com",
    "bio": "Test venue bio"
  }' | jq '.' || echo "Failed"

echo ""
echo "🧪 Testing Account Endpoints"
echo ""

echo "✅ Testing: Validate account deletion"
curl -s -X GET "$BASE_URL/account.validateDeletion" | jq '.' || echo "Failed"

echo ""
echo "✨ Dashboard endpoint tests complete!"
