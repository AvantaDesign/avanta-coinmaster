# Database Verification Script for Avanta Coinmaster (PowerShell)
# This script verifies the complete database setup

Write-Host "Avanta Coinmaster Database Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if wrangler is available
try {
    $null = Get-Command wrangler -ErrorAction Stop
    Write-Host "Wrangler command available" -ForegroundColor Green
} catch {
    Write-Host "Error: wrangler command not found" -ForegroundColor Red
    exit 1
}

# Check database connection
Write-Host "Checking database connection..." -ForegroundColor Yellow
try {
    $dbCheck = wrangler d1 execute avanta-coinmaster --command="SELECT 'Database OK' as status;" 2>$null
    Write-Host "Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "Error: Cannot connect to database" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Count tables
Write-Host "Counting tables..." -ForegroundColor Yellow
try {
    $tableResult = wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name != 'sqlite_sequence';" 2>$null
    $tableCount = ($tableResult | Select-String '\d+').Matches[-1].Value
    Write-Host "Tables found: $tableCount" -ForegroundColor Cyan
    Write-Host "Expected: 43" -ForegroundColor Cyan
    if ($tableCount -eq "43") {
        Write-Host "Table count correct" -ForegroundColor Green
    } else {
        Write-Host "Table count incorrect - Expected 43, found $tableCount" -ForegroundColor Red
    }
} catch {
    Write-Host "Error counting tables" -ForegroundColor Red
}
Write-Host ""

# Count views
Write-Host "Counting views..." -ForegroundColor Yellow
try {
    $viewResult = wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='view';" 2>$null
    $viewCount = ($viewResult | Select-String '\d+').Matches[-1].Value
    Write-Host "Views found: $viewCount" -ForegroundColor Cyan
    Write-Host "Expected: 7" -ForegroundColor Cyan
    if ($viewCount -eq "7") {
        Write-Host "View count correct" -ForegroundColor Green
    } else {
        Write-Host "View count incorrect - Expected 7, found $viewCount" -ForegroundColor Red
    }
} catch {
    Write-Host "Error counting views" -ForegroundColor Red
}
Write-Host ""

# Check critical tables
Write-Host "Checking critical tables..." -ForegroundColor Yellow
$criticalTables = @("users", "transactions", "accounts", "categories", "invoices", "receipts", "audit_log", "sat_declarations", "tax_calculations", "fiscal_parameters")

foreach ($table in $criticalTables) {
    try {
        $exists = wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" 2>$null
        if ($exists -match $table) {
            Write-Host "OK: $table exists" -ForegroundColor Green
        } else {
            Write-Host "MISSING: $table" -ForegroundColor Red
        }
    } catch {
        Write-Host "ERROR: $table" -ForegroundColor Red
    }
}
Write-Host ""

# Test API health endpoint
Write-Host "Testing API health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8788/api/health" -Method GET -TimeoutSec 5 2>$null
    if ($healthResponse.Content -match "healthy") {
        Write-Host "API health check passed" -ForegroundColor Green
    } else {
        Write-Host "API health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "API health check failed - server may not be running" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Tables: $tableCount/43" -ForegroundColor Cyan
Write-Host "Views: $viewCount/7" -ForegroundColor Cyan
Write-Host ""

if ($tableCount -eq "43" -and $viewCount -eq "7") {
    Write-Host "DATABASE VERIFICATION PASSED!" -ForegroundColor Green
    Write-Host "All tables and views are correctly configured" -ForegroundColor Green
    Write-Host "Database is ready for development" -ForegroundColor Green
} else {
    Write-Host "DATABASE VERIFICATION FAILED!" -ForegroundColor Red
    Write-Host "Some tables or views are missing" -ForegroundColor Red
    Write-Host "Check DATABASE_TRACKING_SYSTEM.md for requirements" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If verification failed, check DATABASE_TRACKING_SYSTEM.md" -ForegroundColor White
Write-Host "2. Apply missing migrations" -ForegroundColor White
Write-Host "3. Re-run this script" -ForegroundColor White
Write-Host "4. Update tracking system after changes" -ForegroundColor White