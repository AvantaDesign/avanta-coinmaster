#!/bin/bash

# ============================================================================
# Avanta Finance API Testing Script
# ============================================================================
#
# This script tests all API endpoints to ensure they're working correctly.
# It can be used for both local development and production testing.
#
# Usage:
#   ./test-api.sh [BASE_URL]
#
# Examples:
#   ./test-api.sh                                    # Test local dev server
#   ./test-api.sh http://localhost:8788              # Test Wrangler preview
#   ./test-api.sh https://avanta-finance.pages.dev   # Test production
#
# Requirements:
#   - curl (for making HTTP requests)
#   - jq (for pretty-printing JSON responses)
#
# Install jq:
#   macOS:    brew install jq
#   Ubuntu:   sudo apt-get install jq
#   Windows:  choco install jq
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (default to local dev server)
BASE_URL="${1:-http://localhost:8788}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. JSON output will not be formatted.${NC}"
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# Helper Functions
# ============================================================================

print_section() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASSED:${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAILED:${NC} $1"
    ((TESTS_FAILED++))
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    print_test "$description"
    
    local url="${BASE_URL}${endpoint}"
    local response_file=$(mktemp)
    local http_code
    
    if [ -n "$data" ]; then
        http_code=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" -o "$response_file")
    else
        http_code=$(curl -s -w "%{http_code}" -X "$method" "$url" -o "$response_file")
    fi
    
    echo "  HTTP Status: $http_code"
    echo "  Response:"
    cat "$response_file" | $JQ_CMD | sed 's/^/    /'
    
    rm "$response_file"
    
    return $http_code
}

# ============================================================================
# Start Testing
# ============================================================================

print_section "Avanta Finance API Testing"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"

# ============================================================================
# Test Dashboard API
# ============================================================================

print_section "1. Dashboard API Tests"

# Test 1.1: Get dashboard (basic)
if test_endpoint GET "/api/dashboard" "Get dashboard summary"; then
    if [ $? -eq 200 ]; then
        print_success "Dashboard endpoint accessible"
    else
        print_failure "Dashboard endpoint returned non-200 status"
    fi
else
    print_failure "Dashboard endpoint request failed"
fi

# Test 1.2: Get dashboard with options
if test_endpoint GET "/api/dashboard?period=month&include_categories=true&include_accounts=true&include_trends=true" \
    "Get dashboard with all options"; then
    if [ $? -eq 200 ]; then
        print_success "Dashboard with options works"
    else
        print_failure "Dashboard with options failed"
    fi
fi

# Test 1.3: Get dashboard for year
if test_endpoint GET "/api/dashboard?period=year" "Get yearly dashboard"; then
    if [ $? -eq 200 ]; then
        print_success "Yearly dashboard works"
    else
        print_failure "Yearly dashboard failed"
    fi
fi

# Test 1.4: CORS preflight
if test_endpoint OPTIONS "/api/dashboard" "Dashboard CORS preflight"; then
    if [ $? -eq 204 ]; then
        print_success "Dashboard CORS works"
    else
        print_failure "Dashboard CORS failed"
    fi
fi

# ============================================================================
# Test Transactions API - Read Operations
# ============================================================================

print_section "2. Transactions API - Read Operations"

# Test 2.1: List all transactions
if test_endpoint GET "/api/transactions" "List all transactions (default)"; then
    if [ $? -eq 200 ]; then
        print_success "List transactions works"
    else
        print_failure "List transactions failed"
    fi
fi

# Test 2.2: List with limit
if test_endpoint GET "/api/transactions?limit=10" "List transactions with limit"; then
    if [ $? -eq 200 ]; then
        print_success "List with limit works"
    else
        print_failure "List with limit failed"
    fi
fi

# Test 2.3: List with pagination
if test_endpoint GET "/api/transactions?limit=10&offset=5" "List transactions with pagination"; then
    if [ $? -eq 200 ]; then
        print_success "Pagination works"
    else
        print_failure "Pagination failed"
    fi
fi

# Test 2.4: Filter by category
if test_endpoint GET "/api/transactions?category=avanta" "Filter by category (avanta)"; then
    if [ $? -eq 200 ]; then
        print_success "Category filter works"
    else
        print_failure "Category filter failed"
    fi
fi

# Test 2.5: Filter by type
if test_endpoint GET "/api/transactions?type=ingreso" "Filter by type (ingreso)"; then
    if [ $? -eq 200 ]; then
        print_success "Type filter works"
    else
        print_failure "Type filter failed"
    fi
fi

# Test 2.6: Search in description
if test_endpoint GET "/api/transactions?search=test" "Search in description"; then
    if [ $? -eq 200 ]; then
        print_success "Search works"
    else
        print_failure "Search failed"
    fi
fi

# Test 2.7: Date range filter
if test_endpoint GET "/api/transactions?date_from=2024-01-01&date_to=2024-12-31" "Filter by date range"; then
    if [ $? -eq 200 ]; then
        print_success "Date range filter works"
    else
        print_failure "Date range filter failed"
    fi
fi

# Test 2.8: Amount range filter
if test_endpoint GET "/api/transactions?amount_min=100&amount_max=1000" "Filter by amount range"; then
    if [ $? -eq 200 ]; then
        print_success "Amount range filter works"
    else
        print_failure "Amount range filter failed"
    fi
fi

# Test 2.9: Deductible filter
if test_endpoint GET "/api/transactions?is_deductible=true" "Filter deductible expenses"; then
    if [ $? -eq 200 ]; then
        print_success "Deductible filter works"
    else
        print_failure "Deductible filter failed"
    fi
fi

# Test 2.10: Sorting
if test_endpoint GET "/api/transactions?sort_by=amount&sort_order=desc" "Sort by amount descending"; then
    if [ $? -eq 200 ]; then
        print_success "Sorting works"
    else
        print_failure "Sorting failed"
    fi
fi

# Test 2.11: Include statistics
if test_endpoint GET "/api/transactions?include_stats=true" "Include statistics"; then
    if [ $? -eq 200 ]; then
        print_success "Statistics inclusion works"
    else
        print_failure "Statistics inclusion failed"
    fi
fi

# Test 2.12: Combined filters
if test_endpoint GET "/api/transactions?category=avanta&type=gasto&is_deductible=true&sort_by=date&limit=20&include_stats=true" \
    "Combined filters and options"; then
    if [ $? -eq 200 ]; then
        print_success "Combined filters work"
    else
        print_failure "Combined filters failed"
    fi
fi

# ============================================================================
# Test Transactions API - Create Operations
# ============================================================================

print_section "3. Transactions API - Create Operations"

# Test 3.1: Create valid transaction
TRANSACTION_DATA='{
  "date": "2024-10-14",
  "description": "Test Transaction - API Testing",
  "amount": 1500.00,
  "type": "ingreso",
  "category": "avanta",
  "account": "BBVA Cuenta",
  "is_deductible": false
}'

if test_endpoint POST "/api/transactions" "Create valid transaction" "$TRANSACTION_DATA"; then
    http_code=$?
    if [ $http_code -eq 201 ] || [ $http_code -eq 200 ]; then
        print_success "Transaction creation works"
        CREATED_ID=$(echo "$TRANSACTION_DATA" | jq -r '.id' 2>/dev/null || echo "")
    else
        print_failure "Transaction creation failed with status $http_code"
    fi
fi

# Test 3.2: Create with minimal data
MINIMAL_DATA='{
  "date": "2024-10-14",
  "description": "Minimal Transaction",
  "amount": 100,
  "type": "gasto",
  "category": "personal"
}'

if test_endpoint POST "/api/transactions" "Create with minimal required fields" "$MINIMAL_DATA"; then
    http_code=$?
    if [ $http_code -eq 201 ] || [ $http_code -eq 200 ]; then
        print_success "Minimal transaction creation works"
    else
        print_failure "Minimal transaction creation failed"
    fi
fi

# Test 3.3: Create with all optional fields
FULL_DATA='{
  "date": "2024-10-14",
  "description": "Full Transaction with All Fields",
  "amount": 2500.50,
  "type": "gasto",
  "category": "avanta",
  "account": "Tarjeta Crédito",
  "is_deductible": true,
  "economic_activity": "622",
  "receipt_url": "/receipts/test-receipt.pdf"
}'

if test_endpoint POST "/api/transactions" "Create with all fields" "$FULL_DATA"; then
    http_code=$?
    if [ $http_code -eq 201 ] || [ $http_code -eq 200 ]; then
        print_success "Full transaction creation works"
    else
        print_failure "Full transaction creation failed"
    fi
fi

# Test 3.4: Validation - Missing required field
INVALID_DATA='{
  "description": "Missing date",
  "amount": 100,
  "type": "gasto",
  "category": "personal"
}'

if test_endpoint POST "/api/transactions" "Validation: Missing date" "$INVALID_DATA"; then
    http_code=$?
    if [ $http_code -eq 400 ]; then
        print_success "Validation catches missing date"
    else
        print_failure "Validation should reject missing date"
    fi
fi

# Test 3.5: Validation - Invalid type
INVALID_TYPE='{
  "date": "2024-10-14",
  "description": "Invalid type",
  "amount": 100,
  "type": "invalid",
  "category": "personal"
}'

if test_endpoint POST "/api/transactions" "Validation: Invalid type" "$INVALID_TYPE"; then
    http_code=$?
    if [ $http_code -eq 400 ]; then
        print_success "Validation catches invalid type"
    else
        print_failure "Validation should reject invalid type"
    fi
fi

# Test 3.6: Validation - Invalid category
INVALID_CATEGORY='{
  "date": "2024-10-14",
  "description": "Invalid category",
  "amount": 100,
  "type": "gasto",
  "category": "invalid"
}'

if test_endpoint POST "/api/transactions" "Validation: Invalid category" "$INVALID_CATEGORY"; then
    http_code=$?
    if [ $http_code -eq 400 ]; then
        print_success "Validation catches invalid category"
    else
        print_failure "Validation should reject invalid category"
    fi
fi

# Test 3.7: Validation - Negative amount
NEGATIVE_AMOUNT='{
  "date": "2024-10-14",
  "description": "Negative amount",
  "amount": -100,
  "type": "gasto",
  "category": "personal"
}'

if test_endpoint POST "/api/transactions" "Validation: Negative amount" "$NEGATIVE_AMOUNT"; then
    http_code=$?
    if [ $http_code -eq 400 ]; then
        print_success "Validation catches negative amount"
    else
        print_failure "Validation should reject negative amount"
    fi
fi

# Test 3.8: Validation - Future date
FUTURE_DATE='{
  "date": "2099-12-31",
  "description": "Future date",
  "amount": 100,
  "type": "gasto",
  "category": "personal"
}'

if test_endpoint POST "/api/transactions" "Validation: Future date" "$FUTURE_DATE"; then
    http_code=$?
    if [ $http_code -eq 400 ]; then
        print_success "Validation catches future date"
    else
        print_failure "Validation should reject future date"
    fi
fi

# ============================================================================
# Test Transactions API - CORS
# ============================================================================

print_section "4. Transactions API - CORS"

if test_endpoint OPTIONS "/api/transactions" "Transactions CORS preflight"; then
    if [ $? -eq 204 ]; then
        print_success "Transactions CORS works"
    else
        print_failure "Transactions CORS failed"
    fi
fi

# ============================================================================
# Test Results Summary
# ============================================================================

print_section "Test Results Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
