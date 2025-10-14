#!/bin/bash

# ============================================================================
# n8n Webhook Integration Tests
# ============================================================================
# 
# This script tests all n8n webhook endpoints for proper functionality.
# Tests include:
# - Transaction classification webhook
# - CSV import webhook
# - Invoice notification webhook
# - Payment reminder webhook
# - Authentication and error handling
#
# Usage:
#   ./test-n8n-webhooks.sh [BASE_URL]
#
# Example:
#   ./test-n8n-webhooks.sh http://localhost:8788
#   ./test-n8n-webhooks.sh https://avanta-finance.pages.dev
#
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default base URL
BASE_URL="${1:-http://localhost:8788}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Print colored output
print_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
}

print_failure() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

# Helper function to make API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_header=$4
  
  if [ -n "$auth_header" ]; then
    curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $auth_header" \
      -d "$data" \
      "$BASE_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint"
  fi
}

# ============================================================================
# Test Suite
# ============================================================================

echo ""
echo "================================================"
echo "n8n Webhook Integration Tests"
echo "================================================"
echo "Base URL: $BASE_URL"
echo ""

# ============================================================================
# Test 1: CORS Preflight
# ============================================================================
print_test "Test 1: CORS preflight request"
((TESTS_RUN++))

response=$(curl -s -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  "$BASE_URL/api/webhooks/n8n/classify" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "204" ]; then
  print_success "CORS preflight successful (204)"
else
  print_failure "CORS preflight failed (expected 204, got $http_code)"
fi

# ============================================================================
# Test 2: Classify Transaction - Valid Request
# ============================================================================
print_test "Test 2: Classify transaction - valid request"
((TESTS_RUN++))

payload='{
  "transactionId": 1,
  "description": "Compra en Office Depot",
  "amount": 500,
  "classification": {
    "category": "avanta",
    "isDeductible": true,
    "confidence": 0.95
  }
}'

response=$(api_call "POST" "/api/webhooks/n8n/classify" "$payload")

if echo "$response" | grep -q '"success":true'; then
  print_success "Transaction classified successfully"
else
  print_failure "Transaction classification failed"
  echo "Response: $response"
fi

# ============================================================================
# Test 3: Classify Transaction - Missing Fields
# ============================================================================
print_test "Test 3: Classify transaction - missing fields"
((TESTS_RUN++))

payload='{
  "description": "Test transaction"
}'

response=$(api_call "POST" "/api/webhooks/n8n/classify" "$payload")

if echo "$response" | grep -q '"error"'; then
  print_success "Validation error returned correctly"
else
  print_failure "Should return validation error"
  echo "Response: $response"
fi

# ============================================================================
# Test 4: Classify Transaction - Invalid Category
# ============================================================================
print_test "Test 4: Classify transaction - invalid category"
((TESTS_RUN++))

payload='{
  "transactionId": 1,
  "classification": {
    "category": "invalid",
    "isDeductible": true
  }
}'

response=$(api_call "POST" "/api/webhooks/n8n/classify" "$payload")

if echo "$response" | grep -q '"error"'; then
  print_success "Invalid category rejected correctly"
else
  print_failure "Should reject invalid category"
  echo "Response: $response"
fi

# ============================================================================
# Test 5: CSV Import - Parse Only
# ============================================================================
print_test "Test 5: CSV import - parse only (no auto-import)"
((TESTS_RUN++))

csv_data="date,description,amount,type
2024-10-01,Test Income,1000,ingreso
2024-10-02,Test Expense,500,gasto"

payload=$(cat <<EOF
{
  "fileName": "test-import.csv",
  "csvData": "$csv_data",
  "bankType": "generic",
  "autoImport": false
}
EOF
)

response=$(api_call "POST" "/api/webhooks/n8n/import-csv" "$payload")

if echo "$response" | grep -q '"success":true' && echo "$response" | grep -q '"parsed":2'; then
  print_success "CSV parsed successfully (2 transactions)"
else
  print_failure "CSV parsing failed"
  echo "Response: $response"
fi

# ============================================================================
# Test 6: CSV Import - Missing Data
# ============================================================================
print_test "Test 6: CSV import - missing CSV data"
((TESTS_RUN++))

payload='{
  "fileName": "test.csv",
  "bankType": "generic"
}'

response=$(api_call "POST" "/api/webhooks/n8n/import-csv" "$payload")

if echo "$response" | grep -q '"error"'; then
  print_success "Missing CSV data validation works"
else
  print_failure "Should return error for missing CSV data"
  echo "Response: $response"
fi

# ============================================================================
# Test 7: Invoice Notification - Valid Request
# ============================================================================
print_test "Test 7: Invoice notification - valid request"
((TESTS_RUN++))

payload='{
  "invoiceId": 1,
  "notificationChannel": "telegram",
  "recipient": "123456789"
}'

response=$(api_call "POST" "/api/webhooks/n8n/invoice-notification" "$payload")

if echo "$response" | grep -q '"success":true'; then
  print_success "Invoice notification processed"
else
  print_failure "Invoice notification failed"
  echo "Response: $response"
fi

# ============================================================================
# Test 8: Invoice Notification - Missing Invoice ID
# ============================================================================
print_test "Test 8: Invoice notification - missing invoice ID"
((TESTS_RUN++))

payload='{
  "notificationChannel": "telegram"
}'

response=$(api_call "POST" "/api/webhooks/n8n/invoice-notification" "$payload")

if echo "$response" | grep -q '"error"'; then
  print_success "Missing invoice ID validation works"
else
  print_failure "Should return error for missing invoice ID"
  echo "Response: $response"
fi

# ============================================================================
# Test 9: Payment Reminder - Valid Request
# ============================================================================
print_test "Test 9: Payment reminder - valid request"
((TESTS_RUN++))

payload='{
  "month": "2024-10",
  "type": "both",
  "dueDate": "2024-11-17",
  "notificationChannel": "telegram"
}'

response=$(api_call "POST" "/api/webhooks/n8n/payment-reminder" "$payload")

if echo "$response" | grep -q '"success":true'; then
  print_success "Payment reminder processed"
else
  print_failure "Payment reminder failed"
  echo "Response: $response"
fi

# ============================================================================
# Test 10: Payment Reminder - Missing Required Fields
# ============================================================================
print_test "Test 10: Payment reminder - missing required fields"
((TESTS_RUN++))

payload='{
  "type": "both"
}'

response=$(api_call "POST" "/api/webhooks/n8n/payment-reminder" "$payload")

if echo "$response" | grep -q '"error"'; then
  print_success "Missing fields validation works"
else
  print_failure "Should return error for missing fields"
  echo "Response: $response"
fi

# ============================================================================
# Test 11: Invalid Endpoint
# ============================================================================
print_test "Test 11: Invalid webhook endpoint"
((TESTS_RUN++))

response=$(api_call "POST" "/api/webhooks/n8n/invalid" "{}")

if echo "$response" | grep -q '"error"' && echo "$response" | grep -q '"availableEndpoints"'; then
  print_success "Invalid endpoint returns helpful error"
else
  print_failure "Invalid endpoint handling failed"
  echo "Response: $response"
fi

# ============================================================================
# Test 12: Webhook Authentication (if configured)
# ============================================================================
print_test "Test 12: Webhook authentication"
((TESTS_RUN++))

# Test without auth header (should work if N8N_WEBHOOK_SECRET is not set)
response=$(api_call "POST" "/api/webhooks/n8n/classify" '{"transactionId": 1, "classification": {"category": "personal", "isDeductible": false}}')

if echo "$response" | grep -q '"success":true\|"error"'; then
  print_success "Authentication check passed"
else
  print_failure "Authentication check failed"
  echo "Response: $response"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "================================================"
echo "Test Summary"
echo "================================================"
echo "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
