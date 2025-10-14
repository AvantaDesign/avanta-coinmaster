#!/bin/bash

# ============================================================================
# R2 Upload Testing Script - Avanta Finance
# ============================================================================
#
# This script tests the R2 file upload functionality including:
# - File upload validation
# - File type restrictions
# - File size limits
# - Download functionality
# - Error handling
#
# Usage:
#   ./test-r2-upload.sh [BASE_URL]
#
# Examples:
#   ./test-r2-upload.sh                              # Test local (http://localhost:8788)
#   ./test-r2-upload.sh http://localhost:8788        # Test local
#   ./test-r2-upload.sh https://avanta.pages.dev     # Test production
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default base URL
BASE_URL="${1:-http://localhost:8788}"
UPLOAD_URL="${BASE_URL}/api/upload"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Temp directory for test files
TEST_DIR="/tmp/avanta-r2-test-$$"
mkdir -p "$TEST_DIR"

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}Cleaning up test files...${NC}"
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# ============================================================================
# Helper Functions
# ============================================================================

print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Create test files
create_test_files() {
    print_section "Creating Test Files"
    
    # Small valid image (1KB PNG)
    echo -e "${YELLOW}Creating small PNG (1KB)...${NC}"
    convert -size 100x100 xc:blue "$TEST_DIR/small.png" 2>/dev/null || \
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > "$TEST_DIR/small.png"
    
    # Small valid JPEG
    echo -e "${YELLOW}Creating small JPEG (2KB)...${NC}"
    convert -size 100x100 xc:red "$TEST_DIR/small.jpg" 2>/dev/null || \
    cp "$TEST_DIR/small.png" "$TEST_DIR/small.jpg"
    
    # Small valid PDF
    echo -e "${YELLOW}Creating small PDF (1KB)...${NC}"
    echo "%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
trailer<</Size 4/Root 1 0 R>>
startxref
199
%%EOF" > "$TEST_DIR/test.pdf"
    
    # Small valid XML
    echo -e "${YELLOW}Creating small XML (500B)...${NC}"
    echo '<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/3" Version="3.3">
  <cfdi:Emisor Rfc="XAXX010101000" Nombre="Test Company"/>
  <cfdi:Receptor Rfc="XEXX010101000" Nombre="Test Client"/>
</cfdi:Comprobante>' > "$TEST_DIR/test.xml"
    
    # Large file (11MB - exceeds limit)
    echo -e "${YELLOW}Creating large file (11MB)...${NC}"
    dd if=/dev/zero of="$TEST_DIR/large.jpg" bs=1M count=11 2>/dev/null
    
    # Invalid file type
    echo -e "${YELLOW}Creating invalid file type (.txt)...${NC}"
    echo "This is a text file" > "$TEST_DIR/invalid.txt"
    
    # File with special characters in name
    echo -e "${YELLOW}Creating file with special chars...${NC}"
    cp "$TEST_DIR/small.png" "$TEST_DIR/test file with spaces & symbols!@#.png"
    
    echo -e "${GREEN}✓ Test files created${NC}"
}

# Test CORS preflight
test_cors() {
    print_section "Testing CORS"
    run_test
    print_test "OPTIONS request (CORS preflight)"
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$UPLOAD_URL" \
        -H "Origin: http://example.com" \
        -H "Access-Control-Request-Method: POST")
    
    if [ "$RESPONSE" == "204" ] || [ "$RESPONSE" == "200" ]; then
        print_pass "CORS preflight successful (HTTP $RESPONSE)"
    else
        print_fail "CORS preflight failed (HTTP $RESPONSE)"
    fi
}

# Test valid file uploads
test_valid_uploads() {
    print_section "Testing Valid File Uploads"
    
    # Test PNG upload
    run_test
    print_test "Upload valid PNG file"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/small.png")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_pass "PNG upload successful"
        # Extract URL for download test
        UPLOADED_PNG=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        echo "  Uploaded to: $UPLOADED_PNG"
    else
        print_fail "PNG upload failed"
        echo "  Response: $RESPONSE"
    fi
    
    # Test JPEG upload
    run_test
    print_test "Upload valid JPEG file"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/small.jpg")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_pass "JPEG upload successful"
        UPLOADED_JPG=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        echo "  Uploaded to: $UPLOADED_JPG"
    else
        print_fail "JPEG upload failed"
        echo "  Response: $RESPONSE"
    fi
    
    # Test PDF upload
    run_test
    print_test "Upload valid PDF file"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/test.pdf")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_pass "PDF upload successful"
        UPLOADED_PDF=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        echo "  Uploaded to: $UPLOADED_PDF"
    else
        print_fail "PDF upload failed"
        echo "  Response: $RESPONSE"
    fi
    
    # Test XML upload
    run_test
    print_test "Upload valid XML file"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/test.xml")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_pass "XML upload successful"
        UPLOADED_XML=$(echo "$RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        echo "  Uploaded to: $UPLOADED_XML"
    else
        print_fail "XML upload failed"
        echo "  Response: $RESPONSE"
    fi
    
    # Test file with special characters
    run_test
    print_test "Upload file with special characters in name"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/test file with spaces & symbols!@#.png")
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_pass "Special character filename handled correctly"
        echo "  Response includes sanitized filename"
    else
        print_fail "Special character filename not handled"
        echo "  Response: $RESPONSE"
    fi
}

# Test invalid uploads
test_invalid_uploads() {
    print_section "Testing Invalid File Uploads"
    
    # Test no file
    run_test
    print_test "Upload without file (should fail)"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL")
    if echo "$RESPONSE" | grep -q '"code":"FILE_REQUIRED"'; then
        print_pass "Correctly rejects request without file"
    else
        print_fail "Did not reject request without file"
        echo "  Response: $RESPONSE"
    fi
    
    # Test invalid file type
    run_test
    print_test "Upload invalid file type (TXT, should fail)"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/invalid.txt")
    if echo "$RESPONSE" | grep -q '"code":"INVALID_FILE_TYPE"'; then
        print_pass "Correctly rejects invalid file type"
    else
        print_fail "Did not reject invalid file type"
        echo "  Response: $RESPONSE"
    fi
    
    # Test file too large
    run_test
    print_test "Upload file exceeding size limit (11MB, should fail)"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/large.jpg")
    if echo "$RESPONSE" | grep -q '"code":"FILE_TOO_LARGE"'; then
        print_pass "Correctly rejects oversized file"
    else
        print_fail "Did not reject oversized file"
        echo "  Response: $RESPONSE"
    fi
}

# Test response format
test_response_format() {
    print_section "Testing Response Format"
    
    run_test
    print_test "Upload and verify response structure"
    RESPONSE=$(curl -s -X POST "$UPLOAD_URL" -F "file=@$TEST_DIR/small.png")
    
    EXPECTED_FIELDS=("success" "url" "filename" "originalName" "size" "type" "metadata" "uploadedAt")
    ALL_PRESENT=true
    
    for field in "${EXPECTED_FIELDS[@]}"; do
        if ! echo "$RESPONSE" | grep -q "\"$field\""; then
            ALL_PRESENT=false
            echo "  Missing field: $field"
        fi
    done
    
    if [ "$ALL_PRESENT" = true ]; then
        print_pass "Response includes all expected fields"
    else
        print_fail "Response missing some fields"
        echo "  Response: $RESPONSE"
    fi
}

# Test file download (if implemented)
test_download() {
    print_section "Testing File Download"
    
    if [ -z "$UPLOADED_PNG" ]; then
        echo -e "${YELLOW}Skipping download test (no uploaded file URL)${NC}"
        return
    fi
    
    run_test
    print_test "Download previously uploaded file"
    DOWNLOAD_URL="${BASE_URL}${UPLOADED_PNG}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DOWNLOAD_URL")
    
    if [ "$HTTP_CODE" == "200" ]; then
        print_pass "File download successful (HTTP 200)"
    else
        print_fail "File download failed (HTTP $HTTP_CODE)"
    fi
}

# Test error handling
test_error_handling() {
    print_section "Testing Error Handling"
    
    # Test 404 for non-existent file
    run_test
    print_test "Download non-existent file (should return 404)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/upload/nonexistent-file.png")
    
    if [ "$HTTP_CODE" == "404" ]; then
        print_pass "Correctly returns 404 for missing file"
    else
        print_fail "Did not return 404 for missing file (got $HTTP_CODE)"
    fi
}

# Print summary
print_summary() {
    print_section "Test Summary"
    
    echo -e "Tests run:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  R2 Upload Testing - Avanta Finance                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "\nTesting against: ${GREEN}$BASE_URL${NC}\n"

# Check if server is running
print_section "Checking Server"
if ! curl -s --fail --connect-timeout 5 "$BASE_URL" > /dev/null; then
    echo -e "${RED}✗ Server not accessible at $BASE_URL${NC}"
    echo -e "${YELLOW}Make sure the server is running:${NC}"
    echo -e "  ${BLUE}npm run build${NC}"
    echo -e "  ${BLUE}npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"

# Run tests
create_test_files
test_cors
test_valid_uploads
test_invalid_uploads
test_response_format
test_download
test_error_handling

# Print summary
print_summary
