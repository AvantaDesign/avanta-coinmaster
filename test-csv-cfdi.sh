#!/bin/bash
# Test CSV Import and CFDI Parser functionality

set -e

echo "🧪 Testing CSV and CFDI Parser Implementation"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name ... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

echo "1. File Existence Tests"
echo "----------------------"

run_test "CSV Parser utility exists" "test -f src/utils/csvParser.js"
run_test "CFDI Parser utility exists" "test -f src/utils/cfdiParser.js"
run_test "CSV Import component exists" "test -f src/components/CSVImport.jsx"
run_test "CFDI Import component exists" "test -f src/components/CFDIImport.jsx"
run_test "BBVA sample file exists" "test -f samples/bbva-sample.csv"
run_test "Azteca sample file exists" "test -f samples/azteca-sample.csv"
run_test "CFDI income sample exists" "test -f samples/cfdi-ingreso-sample.xml"
run_test "CFDI expense sample exists" "test -f samples/cfdi-gasto-sample.xml"
run_test "Samples README exists" "test -f samples/README.md"

echo ""
echo "2. Code Quality Tests"
echo "-------------------"

run_test "CSV Parser has parseCSV function" "grep -q 'export function parseCSV' src/utils/csvParser.js"
run_test "CSV Parser has parseBBVAStatement" "grep -q 'export function parseBBVAStatement' src/utils/csvParser.js"
run_test "CSV Parser has parseAztecaStatement" "grep -q 'export function parseAztecaStatement' src/utils/csvParser.js"
run_test "CSV Parser has exportToCSV" "grep -q 'export function exportToCSV' src/utils/csvParser.js"
run_test "CSV Parser has validateTransactions" "grep -q 'export function validateTransactions' src/utils/csvParser.js"

run_test "CFDI Parser has parseCFDI function" "grep -q 'export function parseCFDI' src/utils/cfdiParser.js"
run_test "CFDI Parser has validateCFDI" "grep -q 'export function validateCFDI' src/utils/cfdiParser.js"
run_test "CFDI Parser has cfdiToInvoice" "grep -q 'export function cfdiToInvoice' src/utils/cfdiParser.js"
run_test "CFDI Parser has cfdiToTransaction" "grep -q 'export function cfdiToTransaction' src/utils/cfdiParser.js"

run_test "CSVImport component exports default" "grep -q 'export default function CSVImport' src/components/CSVImport.jsx"
run_test "CFDIImport component exports default" "grep -q 'export default function CFDIImport' src/components/CFDIImport.jsx"

echo ""
echo "3. Integration Tests"
echo "------------------"

run_test "Transactions page imports CSVImport" "grep -q \"import CSVImport from '../components/CSVImport'\" src/pages/Transactions.jsx"
run_test "Transactions page has CSV import button" "grep -q 'Importar CSV' src/pages/Transactions.jsx"
run_test "Transactions page has CSV export button" "grep -q 'Exportar CSV' src/pages/Transactions.jsx"

run_test "Invoices page imports CFDIImport" "grep -q \"import CFDIImport from '../components/CFDIImport'\" src/pages/Invoices.jsx"
run_test "Invoices page has CFDI import button" "grep -q 'Importar XML' src/pages/Invoices.jsx"

echo ""
echo "4. Sample File Validation"
echo "------------------------"

run_test "BBVA sample has valid CSV format" "head -1 samples/bbva-sample.csv | grep -q 'Fecha.*Descripción.*Cargo.*Abono'"
run_test "BBVA sample has 10 transactions" "test $(tail -n +2 samples/bbva-sample.csv | wc -l) -eq 10"

run_test "Azteca sample has valid CSV format" "head -1 samples/azteca-sample.csv | grep -q 'Fecha.*Concepto.*Retiro.*Depósito'"
run_test "Azteca sample has 10 transactions" "test $(tail -n +2 samples/azteca-sample.csv | wc -l) -eq 10"

run_test "CFDI income has valid XML structure" "grep -q '<cfdi:Comprobante' samples/cfdi-ingreso-sample.xml"
run_test "CFDI income has UUID" "grep -q 'UUID=\"12345678-1234-1234-1234-123456789012\"' samples/cfdi-ingreso-sample.xml"
run_test "CFDI income has correct total" "grep -q 'Total=\"14000.00\"' samples/cfdi-ingreso-sample.xml"

run_test "CFDI expense has valid XML structure" "grep -q '<cfdi:Comprobante' samples/cfdi-gasto-sample.xml"
run_test "CFDI expense has UUID" "grep -q 'UUID=\"98765432-9876-9876-9876-987654321098\"' samples/cfdi-gasto-sample.xml"
run_test "CFDI expense has correct total" "grep -q 'Total=\"4000.00\"' samples/cfdi-gasto-sample.xml"

echo ""
echo "5. Build Tests"
echo "-------------"

run_test "Project builds successfully" "npm run build"

echo ""
echo "6. Tax System Verification"
echo "-------------------------"

run_test "Fiscal calculations still use ISR 20%" "grep -q '0.20' src/utils/calculations.js || grep -q '0.2' functions/api/fiscal.js"
run_test "Fiscal calculations still use IVA 16%" "grep -q '0.16' src/utils/calculations.js || grep -q '0.16' functions/api/fiscal.js"

echo ""
echo "=============================================="
echo "Test Results Summary"
echo "=============================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start dev server: npm run dev"
    echo "2. Test CSV import with samples/bbva-sample.csv"
    echo "3. Test CFDI import with samples/cfdi-ingreso-sample.xml"
    echo "4. Verify data in D1 database"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
