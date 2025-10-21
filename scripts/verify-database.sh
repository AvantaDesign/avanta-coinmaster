#!/bin/bash
# Database Verification Script for Avanta Coinmaster
# This script verifies the complete database setup

echo "🔍 Avanta Coinmaster Database Verification"
echo "=========================================="
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler command not found"
    exit 1
fi

# Check if database exists
echo "📊 Checking database connection..."
DB_CHECK=$(wrangler d1 execute avanta-coinmaster --command="SELECT 'Database OK' as status;" 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to database"
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Count tables
echo "📋 Counting tables..."
TABLE_COUNT=$(wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence';" 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📊 Tables found: $TABLE_COUNT"
echo "🎯 Expected: 43"
if [ "$TABLE_COUNT" -eq 43 ]; then
    echo "✅ Table count correct"
else
    echo "❌ Table count incorrect - Expected 43, found $TABLE_COUNT"
fi
echo ""

# Count views
echo "📈 Counting views..."
VIEW_COUNT=$(wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='view';" 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📊 Views found: $VIEW_COUNT"
echo "🎯 Expected: 7"
if [ "$VIEW_COUNT" -eq 7 ]; then
    echo "✅ View count correct"
else
    echo "❌ View count incorrect - Expected 7, found $VIEW_COUNT"
fi
echo ""

# List all tables
echo "📋 All tables:"
wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence' ORDER BY name;" 2>/dev/null | grep -E "^\|" | grep -v "name" | sed 's/|//g' | sed 's/^ *//g' | sed 's/ *$//g'
echo ""

# List all views
echo "📈 All views:"
wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;" 2>/dev/null | grep -E "^\|" | grep -v "name" | sed 's/|//g' | sed 's/^ *//g' | sed 's/ *$//g'
echo ""

# Check critical tables
echo "🔍 Checking critical tables..."
CRITICAL_TABLES=("users" "transactions" "accounts" "categories" "invoices" "receipts" "audit_log" "sat_declarations" "tax_calculations" "fiscal_parameters")

for table in "${CRITICAL_TABLES[@]}"; do
    EXISTS=$(wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" 2>/dev/null | grep -c "$table")
    if [ "$EXISTS" -gt 0 ]; then
        echo "✅ $table exists"
    else
        echo "❌ $table missing"
    fi
done
echo ""

# Check critical views
echo "🔍 Checking critical views..."
CRITICAL_VIEWS=("v_annual_tax_summary" "v_monthly_tax_summary" "v_unmatched_bank_statements")

for view in "${CRITICAL_VIEWS[@]}"; do
    EXISTS=$(wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='view' AND name='$view';" 2>/dev/null | grep -c "$view")
    if [ "$EXISTS" -gt 0 ]; then
        echo "✅ $view exists"
    else
        echo "❌ $view missing"
    fi
done
echo ""

# Test API health endpoint
echo "🌐 Testing API health endpoint..."
if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8788/api/health 2>/dev/null)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        echo "✅ API health check passed"
    else
        echo "❌ API health check failed"
        echo "Response: $HEALTH_RESPONSE"
    fi
else
    echo "⚠️ curl not available - skipping API test"
fi
echo ""

# Summary
echo "📊 VERIFICATION SUMMARY"
echo "======================"
echo "Tables: $TABLE_COUNT/43"
echo "Views: $VIEW_COUNT/7"
echo ""

if [ "$TABLE_COUNT" -eq 43 ] && [ "$VIEW_COUNT" -eq 7 ]; then
    echo "🎉 DATABASE VERIFICATION PASSED!"
    echo "✅ All tables and views are correctly configured"
    echo "✅ Database is ready for development"
else
    echo "❌ DATABASE VERIFICATION FAILED!"
    echo "⚠️ Some tables or views are missing"
    echo "📋 Check DATABASE_TRACKING_SYSTEM.md for requirements"
fi

echo ""
echo "📋 Next steps:"
echo "1. If verification failed, check DATABASE_TRACKING_SYSTEM.md"
echo "2. Apply missing migrations"
echo "3. Re-run this script"
echo "4. Update tracking system after changes"
