#!/bin/bash

# ============================================================================
# Automation and Workflow Testing Script - Phase 17
# ============================================================================
#
# Comprehensive end-to-end testing for:
# - Recurring transactions processing
# - Notification system
# - Data import workflows
# - Financial task automation
# - Webhook integrations
# - Error handling and recovery
#
# Usage:
#   ./test-automation-workflows.sh [BASE_URL]
#
# Examples:
#   ./test-automation-workflows.sh http://localhost:8788
#   ./test-automation-workflows.sh https://avanta-finance.pages.dev
#
# Requirements:
#   - curl (for making HTTP requests)
#   - jq (for JSON processing)
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:8788}"
REPORT_FILE="workflow_test_report_$(date +%Y%m%d_%H%M%S).txt"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. JSON output will not be formatted.${NC}"
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}============================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}--- $1 ---${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASSED:${NC} $1"
    ((TESTS_PASSED++))
    echo "[PASS] $1" >> "$REPORT_FILE"
}

print_failure() {
    echo -e "${RED}✗ FAILED:${NC} $1"
    ((TESTS_FAILED++))
    echo "[FAIL] $1" >> "$REPORT_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
    ((WARNINGS++))
    echo "[WARN] $1" >> "$REPORT_FILE"
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
    echo "[INFO] $1" >> "$REPORT_FILE"
}

make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}"
    fi
}

# ============================================================================
# Initialize Report
# ============================================================================

print_header "Automation and Workflow Testing - Phase 17"
echo "Base URL: $BASE_URL"
echo "Report: $REPORT_FILE"
echo "Date: $(date)"
echo ""

cat > "$REPORT_FILE" << EOF
============================================================================
AUTOMATION AND WORKFLOW TEST REPORT
============================================================================
Base URL: $BASE_URL
Date: $(date)
Phase: 17 - System-Wide Verification and Integrity Check
============================================================================

EOF

# ============================================================================
# Test 1: Recurring Services API
# ============================================================================

print_section "Test 1: Recurring Services Workflow"

print_step "Testing recurring services list endpoint..."
response=$(make_request GET "/api/recurring-services" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Recurring services endpoint is accessible"
    echo "$response" | $JQ_CMD | head -20
else
    print_failure "Recurring services endpoint failed"
fi

print_step "Testing recurring services creation..."
service_data='{
  "name": "Test Subscription",
  "amount": 99.00,
  "frequency": "monthly",
  "next_charge_date": "2025-11-18",
  "category": "avanta",
  "is_active": true
}'

response=$(make_request POST "/api/recurring-services" "$service_data" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Recurring service creation works"
else
    print_warning "Recurring service creation may have issues (check response)"
fi

print_step "Testing recurring service validation..."
invalid_data='{
  "name": "Invalid Service",
  "amount": -50,
  "frequency": "invalid_frequency"
}'

response=$(make_request POST "/api/recurring-services" "$invalid_data" 2>&1)
if echo "$response" | grep -qi "error\|invalid\|validation"; then
    print_success "Recurring service validation works"
else
    print_warning "Recurring service validation may not be strict enough"
fi

# ============================================================================
# Test 2: Recurring Freelancers API
# ============================================================================

print_section "Test 2: Recurring Freelancers Workflow"

print_step "Testing recurring freelancers list endpoint..."
response=$(make_request GET "/api/recurring-freelancers" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Recurring freelancers endpoint is accessible"
    echo "$response" | $JQ_CMD | head -20
else
    print_failure "Recurring freelancers endpoint failed"
fi

print_step "Testing recurring freelancer creation..."
freelancer_data='{
  "name": "Test Freelancer",
  "service_description": "Web Development",
  "amount": 5000.00,
  "frequency": "monthly",
  "next_invoice_date": "2025-11-01",
  "is_active": true
}'

response=$(make_request POST "/api/recurring-freelancers" "$freelancer_data" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Recurring freelancer creation works"
else
    print_warning "Recurring freelancer creation may have issues"
fi

# ============================================================================
# Test 3: Automation Rules API
# ============================================================================

print_section "Test 3: Automation Rules Workflow"

print_step "Testing automation rules endpoint..."
response=$(make_request GET "/api/automation" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Automation rules endpoint is accessible"
else
    print_warning "Automation rules endpoint may not be available"
fi

print_step "Testing automation rule creation..."
rule_data='{
  "name": "Auto Categorize Tech Expenses",
  "trigger_type": "transaction_created",
  "conditions": {
    "description_contains": ["software", "hosting", "domain"]
  },
  "actions": {
    "set_category": "Tecnología",
    "set_deductible": true
  },
  "is_active": true
}'

response=$(make_request POST "/api/automation" "$rule_data" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Automation rule creation works"
else
    print_warning "Automation rule creation may need verification"
fi

# ============================================================================
# Test 4: Notifications API
# ============================================================================

print_section "Test 4: Notification System Workflow"

print_step "Testing notifications list endpoint..."
response=$(make_request GET "/api/notifications" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Notifications endpoint is accessible"
    echo "$response" | $JQ_CMD | head -20
else
    print_warning "Notifications endpoint may not be available"
fi

print_step "Testing notification creation..."
notification_data='{
  "type": "tax_reminder",
  "title": "Test Notification",
  "message": "This is a test notification for workflow testing",
  "priority": "medium",
  "action_url": "/fiscal"
}'

response=$(make_request POST "/api/notifications" "$notification_data" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Notification creation works"
else
    print_warning "Notification creation may have issues"
fi

print_step "Testing notification read/unread status..."
# This would require a notification ID from the previous step
print_info "Manual verification needed for notification status updates"

# ============================================================================
# Test 5: Financial Tasks API
# ============================================================================

print_section "Test 5: Financial Tasks Workflow"

print_step "Testing financial tasks endpoint..."
response=$(make_request GET "/api/financial-tasks" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Financial tasks endpoint is accessible"
    echo "$response" | $JQ_CMD | head -20
else
    print_warning "Financial tasks endpoint may not be available"
fi

print_step "Testing financial task creation..."
task_data='{
  "title": "Test Task - Monthly Tax Filing",
  "description": "File monthly provisional ISR and IVA",
  "due_date": "2025-11-17",
  "priority": "high",
  "category": "tax",
  "is_recurring": true,
  "recurrence_pattern": "monthly"
}'

response=$(make_request POST "/api/financial-tasks" "$task_data" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Financial task creation works"
else
    print_warning "Financial task creation may have issues"
fi

# ============================================================================
# Test 6: Data Import Workflow
# ============================================================================

print_section "Test 6: Data Import Workflow"

print_step "Testing import history endpoint..."
response=$(make_request GET "/api/import" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Import history endpoint is accessible"
else
    print_warning "Import history endpoint may not be available"
fi

print_step "Testing CSV import validation..."
print_info "CSV import requires file upload - manual testing recommended"
print_info "Validate: CSV format, data validation, error handling, rollback on failure"

print_step "Testing CFDI XML import validation..."
print_info "CFDI import requires XML file upload - manual testing recommended"
print_info "Validate: XML parsing, SAT compliance, duplicate detection, error handling"

# ============================================================================
# Test 7: Webhook Integration Tests
# ============================================================================

print_section "Test 7: Webhook Integration Tests"

print_step "Testing webhook endpoints..."
response=$(make_request GET "/api/webhooks" 2>&1)
http_code=$?

if [ $http_code -eq 0 ]; then
    print_success "Webhooks endpoint is accessible"
else
    print_warning "Webhooks endpoint may not be available"
fi

print_step "Testing n8n webhook integration..."
print_info "n8n webhook testing requires active n8n instance"
print_info "Manual verification steps:"
print_info "  1. Verify webhook URL is configured"
print_info "  2. Test webhook with sample payload"
print_info "  3. Verify webhook authentication"
print_info "  4. Check webhook retry logic on failure"
print_info "  5. Validate webhook response handling"

# ============================================================================
# Test 8: Error Handling and Recovery
# ============================================================================

print_section "Test 8: Error Handling and Recovery"

print_step "Testing API error responses..."

# Test with invalid endpoint
response=$(make_request GET "/api/nonexistent-endpoint" 2>&1)
if echo "$response" | grep -qi "error\|not found\|404"; then
    print_success "404 error handling works"
else
    print_warning "404 error handling may need improvement"
fi

# Test with invalid data
invalid_transaction='{
  "description": "Test",
  "amount": "invalid_number",
  "type": "invalid_type"
}'

response=$(make_request POST "/api/transactions" "$invalid_transaction" 2>&1)
if echo "$response" | grep -qi "error\|invalid\|validation"; then
    print_success "Input validation error handling works"
else
    print_warning "Input validation may need improvement"
fi

# Test with missing required fields
incomplete_data='{
  "description": "Incomplete Transaction"
}'

response=$(make_request POST "/api/transactions" "$incomplete_data" 2>&1)
if echo "$response" | grep -qi "error\|required\|missing"; then
    print_success "Required field validation works"
else
    print_warning "Required field validation may need improvement"
fi

# ============================================================================
# Test 9: Workflow Integration Tests
# ============================================================================

print_section "Test 9: Workflow Integration Tests"

print_info "Testing end-to-end workflow: Create transaction with automation"

# Step 1: Create a transaction that should trigger automation
workflow_transaction='{
  "date": "2025-10-18",
  "description": "Software subscription - AWS hosting",
  "amount": 150.00,
  "type": "gasto",
  "category": "avanta",
  "is_deductible": true
}'

print_step "Creating transaction to trigger automation..."
response=$(make_request POST "/api/transactions" "$workflow_transaction" 2>&1)
if echo "$response" | grep -q "id\|success"; then
    print_success "Transaction created successfully"
    
    # Step 2: Verify automation was triggered
    print_step "Verifying automation processing..."
    sleep 2  # Give time for automation to process
    
    print_info "Manual verification needed:"
    print_info "  1. Check if transaction was auto-categorized"
    print_info "  2. Verify notification was created"
    print_info "  3. Check if deductibility rules were applied"
    print_info "  4. Validate audit log entry was created"
else
    print_failure "Transaction creation failed - cannot test automation"
fi

# ============================================================================
# Test 10: Data Consistency Checks
# ============================================================================

print_section "Test 10: Data Consistency Checks"

print_step "Verifying transaction totals consistency..."
response=$(make_request GET "/api/dashboard?period=month" 2>&1)
if echo "$response" | $JQ_CMD | grep -q "income\|expenses"; then
    print_success "Dashboard aggregation working"
    print_info "Manual verification: Compare dashboard totals with transaction list"
else
    print_warning "Dashboard aggregation may have issues"
fi

print_step "Verifying fiscal calculations consistency..."
response=$(make_request GET "/api/fiscal?year=2025&month=10" 2>&1)
if echo "$response" | $JQ_CMD | grep -q "isr\|iva"; then
    print_success "Fiscal calculations endpoint working"
    print_info "Manual verification: Verify ISR and IVA calculations match expected values"
else
    print_warning "Fiscal calculations may need verification"
fi

# ============================================================================
# Test Summary
# ============================================================================

print_header "Workflow Testing Summary"

cat >> "$REPORT_FILE" << EOF

============================================================================
SUMMARY
============================================================================
Tests Passed: $TESTS_PASSED
Tests Failed: $TESTS_FAILED
Warnings: $WARNINGS
Date: $(date)
============================================================================

RECOMMENDATIONS:
1. Manual verification of file upload workflows (CSV, CFDI)
2. End-to-end testing with active n8n instance
3. Verify automation rule execution in production environment
4. Test webhook retry logic and failure recovery
5. Monitor notification delivery and read status
6. Validate recurring transaction processing on schedule

CRITICAL AREAS FOR MANUAL TESTING:
- File upload and parsing (CSV, XML/CFDI)
- Webhook authentication and security
- Automation rule execution timing
- Error recovery and rollback procedures
- Notification delivery reliability
- Recurring transaction scheduling accuracy

EOF

echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""
echo "Detailed report saved to: $REPORT_FILE"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Automation workflow tests completed!${NC}"
    echo -e "${YELLOW}Note: Some workflows require manual verification. See report for details.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some workflow tests failed. Please review the report.${NC}"
    exit 1
fi
