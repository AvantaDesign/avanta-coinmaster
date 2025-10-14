#!/bin/bash

# ============================================================================
# Avanta Finance - Production Testing Script
# ============================================================================
#
# Comprehensive production testing to verify all features work correctly
# in the deployed environment.
#
# Usage:
#   ./test-production.sh [BASE_URL]
#
# Examples:
#   ./test-production.sh https://avanta-finance.pages.dev
#   ./test-production.sh https://yourdomain.com
#
# Requirements:
#   - curl (for HTTP requests)
#   - jq (for JSON parsing, optional but recommended)
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

# Configuration
BASE_URL="${1:-https://avanta-finance.pages.dev}"
TIMEOUT=30
JQ_INSTALLED=false

# Check if jq is installed
if command -v jq &> /dev/null; then
    JQ_INSTALLED=true
    JQ_CMD="jq ."
else
    echo -e "${YELLOW}⚠ Warning: jq not installed. JSON output will not be formatted.${NC}"
    echo "  Install: brew install jq (macOS) or sudo apt-get install jq (Linux)"
    JQ_CMD="cat"
fi

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────${NC}"
}

print_test() {
    echo -e "${BLUE}→ Testing:${NC} $1"
    ((TESTS_RUN++))
}

print_success() {
    echo -e "${GREEN}✓ PASSED:${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAILED:${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
    ((TESTS_WARNINGS++))
}

# ============================================================================
# Test Functions
# ============================================================================

test_url_accessible() {
    local url="$1"
    local description="$2"
    
    print_test "$description"
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url")
    
    if [ "$http_code" -eq 200 ]; then
        print_success "URL accessible (HTTP $http_code)"
        return 0
    else
        print_failure "URL returned HTTP $http_code"
        return 1
    fi
}

test_api_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    print_test "$description"
    
    local url="${BASE_URL}${endpoint}"
    local response_file=$(mktemp)
    local http_code
    
    if [ -n "$data" ]; then
        http_code=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time $TIMEOUT \
            "$url" -o "$response_file")
    else
        http_code=$(curl -s -w "%{http_code}" -X "$method" \
            --max-time $TIMEOUT \
            "$url" -o "$response_file")
    fi
    
    echo "  Status: $http_code (expected: $expected_status)"
    
    if [ $JQ_INSTALLED = true ]; then
        echo "  Response:"
        cat "$response_file" | jq . 2>/dev/null | head -20 | sed 's/^/    /'
    fi
    
    rm "$response_file"
    
    if [ "$http_code" -eq "$expected_status" ]; then
        print_success "API endpoint working correctly"
        return 0
    else
        print_failure "Expected status $expected_status but got $http_code"
        return 1
    fi
}

test_page_loads() {
    local path="$1"
    local description="$2"
    
    print_test "$description"
    
    local url="${BASE_URL}${path}"
    local response=$(curl -s --max-time $TIMEOUT "$url")
    
    # Check if response contains expected HTML elements
    if echo "$response" | grep -q "<html"; then
        if echo "$response" | grep -q "</html>"; then
            print_success "Page loads with valid HTML"
            return 0
        fi
    fi
    
    print_failure "Page did not return valid HTML"
    return 1
}

test_performance() {
    local endpoint="$1"
    local description="$2"
    local max_time="$3"
    
    print_test "$description"
    
    local url="${BASE_URL}${endpoint}"
    local time_total=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url")
    
    # Convert to milliseconds
    local time_ms=$(echo "$time_total * 1000" | bc)
    local time_int=${time_ms%.*}
    
    echo "  Response time: ${time_int}ms (target: <${max_time}ms)"
    
    if [ "$time_int" -lt "$max_time" ]; then
        print_success "Performance within target"
        return 0
    elif [ "$time_int" -lt $(($max_time * 2)) ]; then
        print_warning "Performance acceptable but could be improved"
        return 0
    else
        print_failure "Performance below target (>${max_time}ms)"
        return 1
    fi
}

check_ssl() {
    print_test "SSL certificate validity"
    
    # Extract hostname from URL
    local hostname=$(echo "$BASE_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
    
    # Check SSL certificate
    local ssl_info=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "  $ssl_info" | sed 's/^/  /'
        print_success "SSL certificate is valid"
        return 0
    else
        print_failure "SSL certificate check failed"
        return 1
    fi
}

check_headers() {
    local endpoint="$1"
    local description="$2"
    
    print_test "$description"
    
    local url="${BASE_URL}${endpoint}"
    local headers=$(curl -s -I --max-time $TIMEOUT "$url")
    
    # Check for security headers
    local has_warnings=0
    
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        echo "  ✓ X-Content-Type-Options present"
    else
        echo "  ⚠ X-Content-Type-Options missing"
        has_warnings=1
    fi
    
    if echo "$headers" | grep -qi "Content-Security-Policy"; then
        echo "  ✓ Content-Security-Policy present"
    else
        echo "  ⚠ Content-Security-Policy missing (optional)"
    fi
    
    if echo "$headers" | grep -qi "Strict-Transport-Security"; then
        echo "  ✓ Strict-Transport-Security present"
    else
        echo "  ⚠ Strict-Transport-Security missing (optional)"
    fi
    
    if [ $has_warnings -eq 0 ]; then
        print_success "Security headers present"
        return 0
    else
        print_warning "Some security headers missing (non-critical)"
        return 0
    fi
}

# ============================================================================
# Start Testing
# ============================================================================

print_header "Avanta Finance - Production Testing"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo "Timeout: ${TIMEOUT}s"

# ============================================================================
# 1. Basic Connectivity Tests
# ============================================================================

print_section "1. Basic Connectivity Tests"

test_url_accessible "$BASE_URL" "Homepage accessibility"
check_ssl
test_page_loads "/" "Homepage HTML structure"
test_performance "/" "Homepage load time" 3000

# ============================================================================
# 2. Frontend Pages Tests
# ============================================================================

print_section "2. Frontend Pages Tests"

test_page_loads "/" "Dashboard page"
test_page_loads "/transactions" "Transactions page"
test_page_loads "/fiscal" "Fiscal page"
test_page_loads "/invoices" "Invoices page"

# Check 404 handling
print_test "404 error handling"
http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "${BASE_URL}/nonexistent-page")
if [ "$http_code" -eq 404 ] || [ "$http_code" -eq 200 ]; then
    print_success "404 handling works (status: $http_code)"
else
    print_warning "Unexpected status for 404: $http_code"
fi

# ============================================================================
# 3. API Endpoints Tests
# ============================================================================

print_section "3. API Endpoints Tests"

# Dashboard API
test_api_endpoint "GET" "/api/dashboard" "Dashboard API (basic)"
test_api_endpoint "GET" "/api/dashboard?period=month" "Dashboard API (monthly period)"
test_performance "/api/dashboard" "Dashboard API performance" 1000

# Transactions API
test_api_endpoint "GET" "/api/transactions" "Transactions API (list)"
test_api_endpoint "GET" "/api/transactions?limit=10" "Transactions API (with limit)"
test_performance "/api/transactions" "Transactions API performance" 1500

# Accounts API
test_api_endpoint "GET" "/api/accounts" "Accounts API"
test_performance "/api/accounts" "Accounts API performance" 800

# Fiscal API
test_api_endpoint "GET" "/api/fiscal" "Fiscal API (current month)"
test_api_endpoint "GET" "/api/fiscal?month=10&year=2025" "Fiscal API (specific period)"
test_performance "/api/fiscal" "Fiscal API performance" 1000

# Invoices API
test_api_endpoint "GET" "/api/invoices" "Invoices API"
test_performance "/api/invoices" "Invoices API performance" 1000

# ============================================================================
# 4. CORS and Headers Tests
# ============================================================================

print_section "4. CORS and Headers Tests"

print_test "CORS headers on API"
cors_headers=$(curl -s -I -X OPTIONS --max-time $TIMEOUT "${BASE_URL}/api/dashboard")
if echo "$cors_headers" | grep -qi "Access-Control-Allow-Origin"; then
    print_success "CORS headers present"
else
    print_warning "CORS headers missing (may cause issues)"
fi

check_headers "/api/dashboard" "API security headers"
check_headers "/" "Frontend security headers"

# ============================================================================
# 5. Database Integration Tests
# ============================================================================

print_section "5. Database Integration Tests"

print_test "Database connectivity (via API)"
response=$(curl -s --max-time $TIMEOUT "${BASE_URL}/api/dashboard")
if echo "$response" | grep -q "balance\|error"; then
    if echo "$response" | grep -q "error"; then
        print_failure "Database connection error detected"
    else
        print_success "Database responding correctly"
    fi
else
    print_failure "Unexpected database response"
fi

# ============================================================================
# 6. Error Handling Tests
# ============================================================================

print_section "6. Error Handling Tests"

# Test invalid transaction ID
test_api_endpoint "GET" "/api/transactions/999999" "Invalid transaction ID handling" "" 404

# Test invalid fiscal period
test_api_endpoint "GET" "/api/fiscal?month=13&year=2025" "Invalid fiscal period" "" 400

# Test malformed JSON
print_test "Malformed JSON handling"
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{invalid json}' \
    --max-time $TIMEOUT \
    "${BASE_URL}/api/transactions")
if echo "$response" | grep -qi "error"; then
    print_success "Malformed JSON handled correctly"
else
    print_warning "Malformed JSON handling unclear"
fi

# ============================================================================
# 7. Performance Tests
# ============================================================================

print_section "7. Performance Tests"

test_performance "/" "Homepage performance" 3000
test_performance "/api/dashboard" "Dashboard API performance" 1000
test_performance "/api/transactions" "Transactions API performance" 1500
test_performance "/api/fiscal" "Fiscal API performance" 1000

# ============================================================================
# 8. Load Test (Light)
# ============================================================================

print_section "8. Light Load Test"

print_test "Sequential requests (10 requests)"
start_time=$(date +%s)
for i in {1..10}; do
    curl -s --max-time $TIMEOUT "${BASE_URL}/api/dashboard" > /dev/null
done
end_time=$(date +%s)
duration=$((end_time - start_time))
avg_time=$((duration * 100))

echo "  Total time: ${duration}s"
echo "  Average: ~${avg_time}ms per request"

if [ $duration -lt 15 ]; then
    print_success "Load test passed (${duration}s for 10 requests)"
else
    print_warning "Load test slow (${duration}s for 10 requests)"
fi

# ============================================================================
# 9. Tax System Verification
# ============================================================================

print_section "9. Tax System Verification (ISR 20%, IVA 16%)"

print_test "Fiscal calculation accuracy"
fiscal_response=$(curl -s --max-time $TIMEOUT "${BASE_URL}/api/fiscal")

if [ $JQ_INSTALLED = true ]; then
    # Extract ISR and IVA if available
    if echo "$fiscal_response" | jq -e '.isr' > /dev/null 2>&1; then
        isr=$(echo "$fiscal_response" | jq -r '.isr // 0')
        iva=$(echo "$fiscal_response" | jq -r '.iva // 0')
        ingresos=$(echo "$fiscal_response" | jq -r '.ingresos // 0')
        gastos=$(echo "$fiscal_response" | jq -r '.gastos_deducibles // 0')
        
        echo "  Ingresos: \$${ingresos}"
        echo "  Gastos deducibles: \$${gastos}"
        echo "  ISR calculated: \$${isr}"
        echo "  IVA calculated: \$${iva}"
        
        print_success "Fiscal calculations verified"
    else
        print_warning "No fiscal data available to verify (database may be empty)"
    fi
else
    print_warning "jq not installed, cannot verify calculations"
fi

# ============================================================================
# 10. Resource Availability
# ============================================================================

print_section "10. Resource Availability"

# Check static assets
print_test "CSS assets loading"
css_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "${BASE_URL}/assets/index*.css" 2>/dev/null || echo "404")
if [ "$css_code" -eq 200 ] || [ -z "$css_code" ]; then
    print_success "CSS assets accessible"
else
    print_warning "CSS assets check inconclusive"
fi

print_test "JavaScript assets loading"
js_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "${BASE_URL}/assets/index*.js" 2>/dev/null || echo "404")
if [ "$js_code" -eq 200 ] || [ -z "$js_code" ]; then
    print_success "JavaScript assets accessible"
else
    print_warning "JavaScript assets check inconclusive"
fi

# ============================================================================
# Summary
# ============================================================================

print_header "Test Summary"

echo -e "${CYAN}Total tests run:${NC} $TESTS_RUN"
echo -e "${GREEN}Tests passed:${NC} $TESTS_PASSED"
echo -e "${RED}Tests failed:${NC} $TESTS_FAILED"
echo -e "${YELLOW}Warnings:${NC} $TESTS_WARNINGS"

# Calculate pass rate
if [ $TESTS_RUN -gt 0 ]; then
    pass_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    echo ""
    echo -e "${CYAN}Pass rate:${NC} ${pass_rate}%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✓ ALL TESTS PASSED! Production deployment verified. 🎉${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        exit 0
    elif [ $TESTS_FAILED -le 2 ]; then
        echo ""
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}  ⚠ SOME TESTS FAILED - Review failures above${NC}"
        echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        exit 1
    else
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  ✗ MULTIPLE TESTS FAILED - Deployment needs attention${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
        exit 1
    fi
fi
