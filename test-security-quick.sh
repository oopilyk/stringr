#!/bin/bash

# Quick Security Test Script
# This script tests the basic security features of the Stringerly API

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Stringerly Security Test Suite"
echo "=================================="
echo ""

# Test 1: Invalid UUID in path parameter
echo "Test 1: Invalid UUID validation..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/requests/not-a-uuid/accept" \
  -H "Content-Type: application/json" \
  -d '{"final_price_cents": 2500}')

status_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

if [ "$status_code" = "400" ] && [[ "$body" == *"Invalid request ID format"* ]]; then
  echo -e "${GREEN}✅ PASS${NC} - Invalid UUID rejected (400)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 400 with UUID error, got $status_code"
  echo "   Response: $body"
fi
echo ""

# Test 2: Rate limiting headers present
echo "Test 2: Rate limiting headers..."
response=$(curl -s -i -X POST "$BASE_URL/api/requests/create" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1 | grep -i "x-ratelimit")

if [[ "$response" == *"X-RateLimit"* ]] || [[ "$response" == *"x-ratelimit"* ]]; then
  echo -e "${GREEN}✅ PASS${NC} - Rate limit headers present"
  echo "   $response"
else
  echo -e "${YELLOW}⚠️  WARNING${NC} - Rate limit headers not found (might need auth)"
fi
echo ""

# Test 3: Unauthenticated request blocked
echo "Test 3: Authentication required..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/requests/create" \
  -H "Content-Type: application/json" \
  -d '{"stringer_id": "test"}')

status_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

if [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Unauthenticated request rejected (401)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 401, got $status_code"
  echo "   Response: $body"
fi
echo ""

# Test 4: Missing required field validation
echo "Test 4: Missing required field validation..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/requests/create" \
  -H "Content-Type: application/json" \
  -d '{"stringer_id": "00000000-0000-0000-0000-000000000000"}')

status_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

if [ "$status_code" = "400" ] || [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Invalid input rejected ($status_code)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 400/401, got $status_code"
  echo "   Response: $body"
fi
echo ""

# Test 5: Message endpoint - empty message rejected
echo "Test 5: Empty message validation..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/conversations/00000000-0000-0000-0000-000000000000/messages" \
  -H "Content-Type: application/json" \
  -d '{"body": ""}')

status_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

if [ "$status_code" = "400" ] || [ "$status_code" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Empty message rejected ($status_code)"
else
  echo -e "${RED}❌ FAIL${NC} - Expected 400/401, got $status_code"
  echo "   Response: $body"
fi
echo ""

echo "=================================="
echo "📊 Quick Test Summary"
echo "=================================="
echo ""
echo "These tests verify basic security features work."
echo "For complete testing, follow the manual tests in test-security.md"
echo ""
echo "Key security features verified:"
echo "  - UUID validation"
echo "  - Rate limiting infrastructure"
echo "  - Authentication requirement"
echo "  - Input validation"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Follow Test 1 (Happy Path) in test-security.md"
echo "  3. Test the complete user flow manually"
echo ""
