#!/bin/bash
# Phase 46 Verification Script
# Verifies that the testing infrastructure is properly set up and working

echo "======================================"
echo "Phase 46: Testing Infrastructure"
echo "Verification Script"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1/"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1/"
        ((FAILED++))
        return 1
    fi
}

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Command available: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Command missing: $1"
        ((FAILED++))
        return 1
    fi
}

echo "1. Checking test configuration files..."
check_file "vitest.config.js"
check_file "playwright.config.js"
check_file "tests/setup.js"
echo ""

echo "2. Checking test directories..."
check_dir "tests"
check_dir "tests/api"
check_dir "tests/components"
check_dir "tests/e2e"
check_dir "tests/utils"
check_dir "tests/fixtures"
echo ""

echo "3. Checking test files..."
check_file "tests/api/auth.test.js"
check_file "tests/api/transactions.test.js"
check_file "tests/api/dashboard.test.js"
check_file "tests/api/health.test.js"
check_file "tests/components/TransactionForm.test.jsx"
check_file "tests/e2e/user-journey.spec.js"
check_file "tests/utils/test-helpers.js"
check_file "tests/fixtures/mock-data.js"
echo ""

echo "4. Checking documentation..."
check_file "tests/README.md"
check_file "docs/TESTING_STRATEGY.md"
check_file "PHASE_46_SUMMARY.md"
echo ""

echo "5. Checking CI/CD configuration..."
check_file ".github/workflows/test.yml"
echo ""

echo "6. Checking package.json scripts..."
if grep -q '"test"' package.json; then
    echo -e "${GREEN}✓${NC} Found: npm test script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Missing: npm test script"
    ((FAILED++))
fi

if grep -q '"test:run"' package.json; then
    echo -e "${GREEN}✓${NC} Found: npm run test:run script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Missing: npm run test:run script"
    ((FAILED++))
fi

if grep -q '"test:coverage"' package.json; then
    echo -e "${GREEN}✓${NC} Found: npm run test:coverage script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Missing: npm run test:coverage script"
    ((FAILED++))
fi

if grep -q '"test:e2e"' package.json; then
    echo -e "${GREEN}✓${NC} Found: npm run test:e2e script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Missing: npm run test:e2e script"
    ((FAILED++))
fi
echo ""

echo "7. Checking dependencies..."
if npm list vitest &> /dev/null; then
    echo -e "${GREEN}✓${NC} Vitest installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Vitest not installed"
    ((FAILED++))
fi

if npm list @testing-library/react &> /dev/null; then
    echo -e "${GREEN}✓${NC} React Testing Library installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} React Testing Library not installed"
    ((FAILED++))
fi

if npm list @playwright/test &> /dev/null; then
    echo -e "${GREEN}✓${NC} Playwright installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Playwright not installed"
    ((FAILED++))
fi
echo ""

echo "8. Running tests..."
echo -e "${YELLOW}Running test suite...${NC}"
TEST_OUTPUT_FILE=$(mktemp ./test-output.XXXXXX)
if npm run test:run > "$TEST_OUTPUT_FILE" 2>&1; then
    TEST_COUNT=$(grep -o "Tests.*passed" "$TEST_OUTPUT_FILE" | head -1)
    echo -e "${GREEN}✓${NC} All tests passed: $TEST_COUNT"
    ((PASSED++))
    rm -f "$TEST_OUTPUT_FILE"
else
    echo -e "${RED}✗${NC} Some tests failed"
    echo "Check $TEST_OUTPUT_FILE for details"
    ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Phase 46 verification PASSED!${NC}"
    echo ""
    echo "Testing infrastructure is properly set up."
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm test' to start tests in watch mode"
    echo "2. Run 'npm run test:ui' to open Vitest UI"
    echo "3. Run 'npm run test:coverage' to generate coverage report"
    echo "4. Run 'npm run test:e2e' to run E2E tests"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Phase 46 verification FAILED${NC}"
    echo ""
    echo "Some checks failed. Please review the output above."
    echo ""
    echo "Common fixes:"
    echo "1. Run 'npm install' to install dependencies"
    echo "2. Check that all test files are present"
    echo "3. Verify package.json has test scripts"
    echo ""
    exit 1
fi
