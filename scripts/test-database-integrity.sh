#!/bin/bash

# ============================================================================
# Database Integrity Check Script - Phase 17
# ============================================================================
#
# Comprehensive database integrity verification for Avanta Finance
# Tests referential integrity, orphaned records, constraints, and schema
#
# Usage:
#   ./test-database-integrity.sh [database_name]
#
# Examples:
#   ./test-database-integrity.sh avanta-finance
#
# Requirements:
#   - wrangler CLI installed (npm install -g wrangler)
#   - Cloudflare account authenticated (wrangler login)
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
DB_NAME="${1:-avanta-finance}"
REPORT_FILE="database_integrity_report_$(date +%Y%m%d_%H%M%S).txt"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

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

execute_query() {
    local query="$1"
    wrangler d1 execute "$DB_NAME" --command="$query" 2>&1
}

execute_query_silent() {
    local query="$1"
    wrangler d1 execute "$DB_NAME" --command="$query" 2>&1 | grep -v "^🌀\|^⛅\|Executing on" || true
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}Error: wrangler CLI not found${NC}"
        echo "Please install it with: npm install -g wrangler"
        exit 1
    fi
}

# ============================================================================
# Database Integrity Tests
# ============================================================================

print_header "Database Integrity Check - Phase 17"
echo "Database: $DB_NAME"
echo "Report: $REPORT_FILE"
echo "Date: $(date)"
echo ""

check_wrangler

# Initialize report file
cat > "$REPORT_FILE" << EOF
============================================================================
DATABASE INTEGRITY AUDIT REPORT
============================================================================
Database: $DB_NAME
Date: $(date)
Phase: 17 - System-Wide Verification and Integrity Check
============================================================================

EOF

# ============================================================================
# Test 1: Schema Verification
# ============================================================================

print_section "Test 1: Schema Verification"

print_step "Checking all required tables exist..."

REQUIRED_TABLES=(
    "users"
    "transactions"
    "accounts"
    "categories"
    "invoices"
    "fiscal_payments"
    "credits"
    "credit_movements"
    "budgets"
    "fiscal_config"
    "transaction_invoice_map"
    "deductibility_rules"
)

TABLES_EXIST=true
for table in "${REQUIRED_TABLES[@]}"; do
    result=$(execute_query_silent "SELECT name FROM sqlite_master WHERE type='table' AND name='$table'")
    if echo "$result" | grep -q "$table"; then
        print_info "Table '$table' exists"
    else
        print_failure "Table '$table' is missing"
        TABLES_EXIST=false
    fi
done

if [ "$TABLES_EXIST" = true ]; then
    print_success "All required tables exist"
else
    print_failure "Some tables are missing"
fi

# ============================================================================
# Test 2: Referential Integrity - Transactions
# ============================================================================

print_section "Test 2: Referential Integrity - Transactions"

print_step "Checking for orphaned transactions (user_id not in users)..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions t WHERE t.user_id NOT IN (SELECT id FROM users)")
orphaned_count=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_count" = "0" ]; then
    print_success "No orphaned transactions found"
else
    print_failure "Found $orphaned_count orphaned transactions with invalid user_id"
fi

print_step "Checking for transactions with invalid category_id..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions t WHERE t.category_id IS NOT NULL AND t.category_id NOT IN (SELECT id FROM categories)")
invalid_category_count=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_category_count" = "0" ]; then
    print_success "All transaction category references are valid"
else
    print_failure "Found $invalid_category_count transactions with invalid category_id"
fi

print_step "Checking for transactions with invalid linked_invoice_id..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions t WHERE t.linked_invoice_id IS NOT NULL AND t.linked_invoice_id NOT IN (SELECT id FROM invoices)")
invalid_invoice_count=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_invoice_count" = "0" ]; then
    print_success "All transaction invoice references are valid"
else
    print_failure "Found $invalid_invoice_count transactions with invalid linked_invoice_id"
fi

# ============================================================================
# Test 3: Referential Integrity - Accounts & Categories
# ============================================================================

print_section "Test 3: Referential Integrity - Accounts & Categories"

print_step "Checking for orphaned accounts..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM accounts a WHERE a.user_id NOT IN (SELECT id FROM users)")
orphaned_accounts=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_accounts" = "0" ]; then
    print_success "No orphaned accounts found"
else
    print_failure "Found $orphaned_accounts orphaned accounts"
fi

print_step "Checking for orphaned categories..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM categories c WHERE c.user_id NOT IN (SELECT id FROM users)")
orphaned_categories=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_categories" = "0" ]; then
    print_success "No orphaned categories found"
else
    print_failure "Found $orphaned_categories orphaned categories"
fi

# ============================================================================
# Test 4: Referential Integrity - Credits & Movements
# ============================================================================

print_section "Test 4: Referential Integrity - Credits & Movements"

print_step "Checking for orphaned credits..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM credits c WHERE c.user_id NOT IN (SELECT id FROM users)")
orphaned_credits=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_credits" = "0" ]; then
    print_success "No orphaned credits found"
else
    print_failure "Found $orphaned_credits orphaned credits"
fi

print_step "Checking for credit movements with invalid credit_id..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM credit_movements cm WHERE cm.credit_id NOT IN (SELECT id FROM credits)")
invalid_credit_movements=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_credit_movements" = "0" ]; then
    print_success "All credit movements have valid credit references"
else
    print_failure "Found $invalid_credit_movements credit movements with invalid credit_id"
fi

print_step "Checking for credit movements with invalid transaction_id..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM credit_movements cm WHERE cm.transaction_id IS NOT NULL AND cm.transaction_id NOT IN (SELECT id FROM transactions)")
invalid_transaction_refs=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_transaction_refs" = "0" ]; then
    print_success "All credit movements have valid transaction references"
else
    print_failure "Found $invalid_transaction_refs credit movements with invalid transaction_id"
fi

# ============================================================================
# Test 5: Referential Integrity - Budgets
# ============================================================================

print_section "Test 5: Referential Integrity - Budgets"

print_step "Checking for orphaned budgets..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM budgets b WHERE b.user_id NOT IN (SELECT id FROM users)")
orphaned_budgets=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_budgets" = "0" ]; then
    print_success "No orphaned budgets found"
else
    print_failure "Found $orphaned_budgets orphaned budgets"
fi

print_step "Checking for budgets with invalid category_id..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM budgets b WHERE b.category_id IS NOT NULL AND b.category_id NOT IN (SELECT id FROM categories)")
invalid_budget_categories=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_budget_categories" = "0" ]; then
    print_success "All budgets have valid category references"
else
    print_failure "Found $invalid_budget_categories budgets with invalid category_id"
fi

# ============================================================================
# Test 6: Referential Integrity - Transaction-Invoice Mapping
# ============================================================================

print_section "Test 6: Referential Integrity - Transaction-Invoice Mapping"

print_step "Checking transaction-invoice mappings..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transaction_invoice_map tim WHERE tim.transaction_id NOT IN (SELECT id FROM transactions)")
invalid_txn_maps=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_txn_maps" = "0" ]; then
    print_success "All transaction mappings have valid transaction references"
else
    print_failure "Found $invalid_txn_maps mappings with invalid transaction_id"
fi

result=$(execute_query_silent "SELECT COUNT(*) as count FROM transaction_invoice_map tim WHERE tim.invoice_id NOT IN (SELECT id FROM invoices)")
invalid_inv_maps=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_inv_maps" = "0" ]; then
    print_success "All transaction mappings have valid invoice references"
else
    print_failure "Found $invalid_inv_maps mappings with invalid invoice_id"
fi

# ============================================================================
# Test 7: Referential Integrity - Deductibility Rules (Phase 16)
# ============================================================================

print_section "Test 7: Referential Integrity - Deductibility Rules"

print_step "Checking for orphaned deductibility rules..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM deductibility_rules dr WHERE dr.user_id NOT IN (SELECT id FROM users)")
orphaned_rules=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$orphaned_rules" = "0" ]; then
    print_success "No orphaned deductibility rules found"
else
    print_failure "Found $orphaned_rules orphaned deductibility rules"
fi

print_step "Checking deductibility rules with invalid category references..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM deductibility_rules dr WHERE dr.match_category_id IS NOT NULL AND dr.match_category_id NOT IN (SELECT id FROM categories)")
invalid_rule_categories=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_rule_categories" = "0" ]; then
    print_success "All deductibility rules have valid category references"
else
    print_failure "Found $invalid_rule_categories rules with invalid category references"
fi

# ============================================================================
# Test 8: Data Constraints Validation
# ============================================================================

print_section "Test 8: Data Constraints Validation"

print_step "Checking for transactions with negative amounts..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE amount < 0")
negative_amounts=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$negative_amounts" = "0" ]; then
    print_success "No transactions with negative amounts"
else
    print_warning "Found $negative_amounts transactions with negative amounts (may be intentional)"
fi

print_step "Checking for transactions with invalid type values..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE type NOT IN ('ingreso', 'gasto')")
invalid_types=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_types" = "0" ]; then
    print_success "All transactions have valid type values"
else
    print_failure "Found $invalid_types transactions with invalid type"
fi

print_step "Checking for transactions with invalid category values..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE category NOT IN ('personal', 'avanta')")
invalid_categories=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_categories" = "0" ]; then
    print_success "All transactions have valid category values"
else
    print_failure "Found $invalid_categories transactions with invalid category"
fi

print_step "Checking for transactions with invalid transaction_type..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE transaction_type IS NOT NULL AND transaction_type NOT IN ('business', 'personal', 'transfer')")
invalid_txn_types=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_txn_types" = "0" ]; then
    print_success "All transactions have valid transaction_type values"
else
    print_failure "Found $invalid_txn_types transactions with invalid transaction_type"
fi

print_step "Checking for transactions with invalid expense_type (Phase 16)..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE expense_type NOT IN ('national', 'international_with_invoice', 'international_no_invoice')")
invalid_expense_types=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_expense_types" = "0" ]; then
    print_success "All transactions have valid expense_type values (Phase 16)"
else
    print_failure "Found $invalid_expense_types transactions with invalid expense_type"
fi

# ============================================================================
# Test 9: Index Verification
# ============================================================================

print_section "Test 9: Index Verification"

print_step "Checking for critical indexes..."

REQUIRED_INDEXES=(
    "idx_transactions_user_id"
    "idx_transactions_date"
    "idx_transactions_category_id"
    "idx_transactions_is_iva_deductible"
    "idx_transactions_is_isr_deductible"
    "idx_accounts_user_id"
    "idx_categories_user_id"
    "idx_invoices_user_id"
    "idx_credits_user_id"
    "idx_budgets_user_id"
    "idx_deductibility_rules_user_id"
)

INDEXES_EXIST=true
for index in "${REQUIRED_INDEXES[@]}"; do
    result=$(execute_query_silent "SELECT name FROM sqlite_master WHERE type='index' AND name='$index'")
    if echo "$result" | grep -q "$index"; then
        print_info "Index '$index' exists"
    else
        print_warning "Index '$index' is missing (may impact performance)"
        INDEXES_EXIST=false
    fi
done

if [ "$INDEXES_EXIST" = true ]; then
    print_success "All critical indexes exist"
else
    print_warning "Some indexes are missing"
fi

# ============================================================================
# Test 10: Data Consistency Checks
# ============================================================================

print_section "Test 10: Data Consistency Checks"

print_step "Checking for duplicate invoice UUIDs..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM (SELECT uuid, COUNT(*) as cnt FROM invoices GROUP BY uuid HAVING cnt > 1)")
duplicate_uuids=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$duplicate_uuids" = "0" ]; then
    print_success "No duplicate invoice UUIDs found"
else
    print_failure "Found $duplicate_uuids duplicate invoice UUIDs"
fi

print_step "Checking for duplicate category names per user..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM (SELECT user_id, name, COUNT(*) as cnt FROM categories GROUP BY user_id, name HAVING cnt > 1)")
duplicate_categories=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$duplicate_categories" = "0" ]; then
    print_success "No duplicate category names per user"
else
    print_failure "Found $duplicate_categories duplicate category names"
fi

print_step "Checking for deleted transactions still referenced..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM credit_movements cm INNER JOIN transactions t ON cm.transaction_id = t.id WHERE t.is_deleted = 1")
deleted_refs=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$deleted_refs" = "0" ]; then
    print_success "No credit movements reference deleted transactions"
else
    print_warning "Found $deleted_refs credit movements referencing deleted transactions"
fi

# ============================================================================
# Test 11: Granular Deductibility Integrity (Phase 16)
# ============================================================================

print_section "Test 11: Granular Deductibility Integrity (Phase 16)"

print_step "Checking for transactions with inconsistent deductibility flags..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE is_deductible = 0 AND (is_iva_deductible = 1 OR is_isr_deductible = 1)")
inconsistent_deductibility=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$inconsistent_deductibility" = "0" ]; then
    print_success "No inconsistent deductibility flags found"
else
    print_warning "Found $inconsistent_deductibility transactions with inconsistent deductibility (may be intentional)"
fi

print_step "Checking for international expenses with incorrect IVA deductibility..."
result=$(execute_query_silent "SELECT COUNT(*) as count FROM transactions WHERE expense_type = 'international_no_invoice' AND is_iva_deductible = 1")
invalid_international=$(echo "$result" | grep -oP '\d+' | tail -1)
if [ "$invalid_international" = "0" ]; then
    print_success "International expenses without invoice correctly marked as IVA non-deductible"
else
    print_warning "Found $invalid_international international expenses (no invoice) marked as IVA deductible"
fi

# ============================================================================
# Test Summary
# ============================================================================

print_header "Database Integrity Audit Summary"

cat >> "$REPORT_FILE" << EOF

============================================================================
SUMMARY
============================================================================
Tests Passed: $TESTS_PASSED
Tests Failed: $TESTS_FAILED
Warnings: $WARNINGS
Date: $(date)
============================================================================

EOF

echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""
echo "Detailed report saved to: $REPORT_FILE"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Database integrity check completed successfully!${NC}"
    echo -e "${YELLOW}Note: $WARNINGS warnings found. Review the report for details.${NC}"
    exit 0
else
    echo -e "${RED}✗ Database integrity check found issues. Please review the report.${NC}"
    exit 1
fi
