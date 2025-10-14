#!/bin/bash

# ============================================================================
# D1 Database Setup and Testing Script
# ============================================================================
#
# This script provides a comprehensive guide for setting up and testing
# Cloudflare D1 database for Avanta Finance.
#
# Usage:
#   ./test-d1-database.sh [command]
#
# Commands:
#   setup       - Create database and run migrations
#   test        - Run database tests
#   seed        - Load sample data
#   verify      - Verify database structure
#   backup      - Create database backup
#   help        - Show this help message
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
DB_NAME="avanta-finance"
SCHEMA_FILE="schema.sql"
SEED_FILE="seed.sql"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

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
    echo -e "${GREEN}✓ SUCCESS:${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAILED:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}Error: wrangler CLI not found${NC}"
        echo "Please install it with: npm install -g wrangler"
        exit 1
    fi
    print_success "Wrangler CLI found ($(wrangler --version | head -n 1))"
}

check_cloudflare_auth() {
    if ! wrangler whoami &> /dev/null; then
        echo -e "${RED}Error: Not authenticated with Cloudflare${NC}"
        echo "Please run: wrangler login"
        exit 1
    fi
    print_success "Cloudflare authentication verified"
}

# ============================================================================
# Setup Commands
# ============================================================================

setup_database() {
    print_header "D1 Database Setup"
    
    check_wrangler
    check_cloudflare_auth
    
    print_section "Step 1: Create D1 Database"
    print_step "Creating database '$DB_NAME'..."
    
    # Check if database already exists
    if wrangler d1 list | grep -q "$DB_NAME"; then
        print_warning "Database '$DB_NAME' already exists"
        read -p "Do you want to continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 0
        fi
    else
        # Create the database
        output=$(wrangler d1 create "$DB_NAME" 2>&1)
        echo "$output"
        
        # Extract database ID
        db_id=$(echo "$output" | grep "database_id" | sed 's/.*= "\(.*\)"/\1/')
        
        if [ -n "$db_id" ]; then
            print_success "Database created with ID: $db_id"
            print_info "Please update wrangler.toml with this database_id"
            echo ""
            echo "[[d1_databases]]"
            echo "binding = \"DB\""
            echo "database_name = \"$DB_NAME\""
            echo "database_id = \"$db_id\""
            echo ""
        else
            print_failure "Failed to extract database ID"
            exit 1
        fi
    fi
    
    print_section "Step 2: Run Schema Migrations"
    print_step "Creating tables from $SCHEMA_FILE..."
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        print_failure "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    
    if wrangler d1 execute "$DB_NAME" --file="$SCHEMA_FILE"; then
        print_success "Schema migrations completed"
    else
        print_failure "Schema migrations failed"
        exit 1
    fi
    
    print_section "Step 3: Verify Database Structure"
    verify_structure
    
    print_section "Setup Complete!"
    echo -e "${GREEN}✓ Database '$DB_NAME' is ready to use${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update wrangler.toml with the database_id (if not done already)"
    echo "  2. Run './test-d1-database.sh seed' to load sample data"
    echo "  3. Run './test-d1-database.sh test' to run database tests"
    echo ""
}

# ============================================================================
# Verification Commands
# ============================================================================

verify_structure() {
    print_step "Verifying database structure..."
    
    # Check tables
    tables=$(wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" 2>&1)
    
    if echo "$tables" | grep -q "transactions"; then
        print_success "Table 'transactions' exists"
    else
        print_failure "Table 'transactions' not found"
    fi
    
    if echo "$tables" | grep -q "accounts"; then
        print_success "Table 'accounts' exists"
    else
        print_failure "Table 'accounts' not found"
    fi
    
    if echo "$tables" | grep -q "invoices"; then
        print_success "Table 'invoices' exists"
    else
        print_failure "Table 'invoices' not found"
    fi
    
    if echo "$tables" | grep -q "fiscal_payments"; then
        print_success "Table 'fiscal_payments' exists"
    else
        print_failure "Table 'fiscal_payments' not found"
    fi
    
    # Check indexes
    indexes=$(wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='index'" 2>&1)
    
    if echo "$indexes" | grep -q "idx_transactions_date"; then
        print_success "Index 'idx_transactions_date' exists"
    else
        print_warning "Index 'idx_transactions_date' not found"
    fi
}

# ============================================================================
# Seed Data Commands
# ============================================================================

seed_database() {
    print_header "Load Sample Data"
    
    check_wrangler
    check_cloudflare_auth
    
    if [ ! -f "$SEED_FILE" ]; then
        print_failure "Seed file not found: $SEED_FILE"
        exit 1
    fi
    
    print_step "Loading sample data from $SEED_FILE..."
    
    if wrangler d1 execute "$DB_NAME" --file="$SEED_FILE"; then
        print_success "Sample data loaded successfully"
        
        # Verify data
        print_section "Verifying Data"
        
        count=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM transactions" 2>&1)
        print_info "Transactions count: $(echo "$count" | grep -oP '\d+' | tail -1)"
        
        count=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM invoices" 2>&1)
        print_info "Invoices count: $(echo "$count" | grep -oP '\d+' | tail -1)"
        
        count=$(wrangler d1 execute "$DB_NAME" --command="SELECT COUNT(*) as count FROM accounts" 2>&1)
        print_info "Accounts count: $(echo "$count" | grep -oP '\d+' | tail -1)"
        
    else
        print_failure "Failed to load sample data"
        exit 1
    fi
}

# ============================================================================
# Test Commands
# ============================================================================

test_database() {
    print_header "D1 Database Tests"
    
    check_wrangler
    check_cloudflare_auth
    
    # Test 1: Transactions table
    print_section "Test 1: Transactions CRUD"
    
    print_step "Testing SELECT..."
    if wrangler d1 execute "$DB_NAME" --command="SELECT * FROM transactions LIMIT 5" &> /dev/null; then
        print_success "SELECT query works"
    else
        print_failure "SELECT query failed"
    fi
    
    print_step "Testing INSERT..."
    if wrangler d1 execute "$DB_NAME" --command="INSERT INTO transactions (date, description, amount, type, category) VALUES ('2025-10-14', 'Test Transaction', 100.00, 'gasto', 'personal')" &> /dev/null; then
        print_success "INSERT query works"
        
        # Clean up test data
        wrangler d1 execute "$DB_NAME" --command="DELETE FROM transactions WHERE description = 'Test Transaction'" &> /dev/null
    else
        print_failure "INSERT query failed"
    fi
    
    # Test 2: Accounts table
    print_section "Test 2: Accounts Operations"
    
    print_step "Testing account balance query..."
    if wrangler d1 execute "$DB_NAME" --command="SELECT SUM(balance) as total FROM accounts WHERE type = 'banco'" &> /dev/null; then
        print_success "Account balance query works"
    else
        print_failure "Account balance query failed"
    fi
    
    # Test 3: Fiscal calculations
    print_section "Test 3: Fiscal Calculations"
    
    print_step "Testing income/expense aggregation..."
    if wrangler d1 execute "$DB_NAME" --command="SELECT SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses FROM transactions" &> /dev/null; then
        print_success "Fiscal aggregation works"
    else
        print_failure "Fiscal aggregation failed"
    fi
    
    # Test 4: Invoices table
    print_section "Test 4: Invoices Operations"
    
    print_step "Testing invoice queries..."
    if wrangler d1 execute "$DB_NAME" --command="SELECT * FROM invoices WHERE status = 'active' LIMIT 5" &> /dev/null; then
        print_success "Invoice queries work"
    else
        print_failure "Invoice queries failed"
    fi
    
    # Test 5: Indexes performance
    print_section "Test 5: Index Performance"
    
    print_step "Testing date range query with index..."
    if wrangler d1 execute "$DB_NAME" --command="SELECT * FROM transactions WHERE date >= '2025-10-01' AND date <= '2025-10-31'" &> /dev/null; then
        print_success "Indexed date queries work"
    else
        print_failure "Indexed date queries failed"
    fi
    
    # Test 6: Constraints
    print_section "Test 6: Data Constraints"
    
    print_step "Testing type constraint..."
    if ! wrangler d1 execute "$DB_NAME" --command="INSERT INTO transactions (date, description, amount, type, category) VALUES ('2025-10-14', 'Invalid', 100, 'invalid_type', 'personal')" &> /dev/null; then
        print_success "Type constraint enforced"
    else
        print_failure "Type constraint not working"
    fi
    
    # Summary
    print_header "Test Summary"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# ============================================================================
# Backup Commands
# ============================================================================

backup_database() {
    print_header "Database Backup"
    
    check_wrangler
    check_cloudflare_auth
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${DB_NAME}_${timestamp}.sql"
    
    print_step "Creating backup: $backup_file"
    
    if wrangler d1 export "$DB_NAME" --output="$backup_file"; then
        print_success "Backup created: $backup_file"
    else
        print_failure "Backup failed"
        exit 1
    fi
}

# ============================================================================
# Main Command Handler
# ============================================================================

show_help() {
    cat << EOF
D1 Database Setup and Testing Script

Usage: ./test-d1-database.sh [command]

Commands:
  setup       Create database and run migrations
  test        Run comprehensive database tests
  seed        Load sample data into database
  verify      Verify database structure
  backup      Create database backup
  help        Show this help message

Examples:
  ./test-d1-database.sh setup    # Initial database setup
  ./test-d1-database.sh seed     # Load sample data
  ./test-d1-database.sh test     # Run all tests
  ./test-d1-database.sh backup   # Create backup

Prerequisites:
  1. Install wrangler: npm install -g wrangler
  2. Login to Cloudflare: wrangler login
  3. Ensure schema.sql and seed.sql exist

For more information, see DEPLOYMENT.md
EOF
}

# Main command router
case "${1:-help}" in
    setup)
        setup_database
        ;;
    test)
        test_database
        ;;
    seed)
        seed_database
        ;;
    verify)
        print_header "Database Verification"
        check_wrangler
        check_cloudflare_auth
        verify_structure
        ;;
    backup)
        backup_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
