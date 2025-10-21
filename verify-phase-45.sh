#!/bin/bash
# Phase 45 Deployment Verification Script
# This script verifies that all Phase 45 files are present and valid

echo "=================================="
echo "Phase 45 Deployment Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $1 (missing)${NC}"
    ((FAILED++))
  fi
}

# Function to check syntax
check_syntax() {
  if node -c "$1" 2>/dev/null; then
    echo -e "${GREEN}✅ $1 (syntax OK)${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $1 (syntax error)${NC}"
    ((FAILED++))
  fi
}

echo "Checking Backend Files..."
echo "--------------------------"
check_file "functions/utils/error-codes.js"
check_file "functions/utils/database-resilience.js"
check_file "functions/utils/transaction-manager.js"
check_file "functions/utils/resilience.js"
echo ""

echo "Checking Frontend Components..."
echo "--------------------------------"
check_file "src/components/ErrorBoundary.jsx"
check_file "src/components/ErrorFallback.jsx"
check_file "src/components/ErrorRecovery.jsx"
check_file "src/components/ValidationError.jsx"
check_file "src/components/FormField.jsx"
echo ""

echo "Checking Frontend Utilities..."
echo "-------------------------------"
check_file "src/utils/retry-utils.js"
check_file "src/utils/circuit-breaker.js"
check_file "src/utils/api-client.js"
check_file "src/utils/validation-errors.js"
echo ""

echo "Checking Documentation..."
echo "--------------------------"
check_file "docs/PHASE_45_USAGE_GUIDE.md"
check_file "docs/PHASE_45_VERIFICATION.md"
check_file "PHASE_45_SUMMARY.md"
check_file "PHASE_45_DEPLOYMENT_VERIFICATION.md"
echo ""

echo "Checking Modified Files..."
echo "---------------------------"
check_file "functions/utils/errors.js"
check_file "src/App.jsx"
echo ""

echo "Validating Syntax..."
echo "---------------------"
check_syntax "functions/utils/error-codes.js"
check_syntax "functions/utils/database-resilience.js"
check_syntax "functions/utils/transaction-manager.js"
check_syntax "functions/utils/resilience.js"
check_syntax "functions/utils/errors.js"
check_syntax "src/utils/retry-utils.js"
check_syntax "src/utils/circuit-breaker.js"
check_syntax "src/utils/api-client.js"
check_syntax "src/utils/validation-errors.js"
echo ""

echo "Running Build Test..."
echo "----------------------"
if npm run build >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Build successful${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Build failed${NC}"
  ((FAILED++))
fi
echo ""

echo "=================================="
echo "Results:"
echo "=================================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Phase 45 is ready for deployment.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
  exit 1
fi
