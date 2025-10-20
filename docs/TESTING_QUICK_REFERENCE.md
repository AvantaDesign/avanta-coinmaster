# 🧪 Testing Quick Reference Card

Quick reference for running Phase 17 test suite and understanding results.

---

## 🚀 Quick Start

### Pre-Deployment Testing (REQUIRED)

```bash
# 1. Build verification
npm run build

# 2. Financial calculations (must pass 41/41 tests)
node scripts/test-financial-calculations.js
```

**Expected Result:** `✓ All financial calculation tests passed!`

---

## 📋 Complete Test Commands

### 1. Financial Calculations Test ⭐ PRIORITY

**What it tests:** ISR, IVA, monthly payments, deductibility, edge cases

```bash
node scripts/test-financial-calculations.js
```

**Success Criteria:** 41/41 tests pass  
**Duration:** ~5 seconds  
**When to run:** Before every deployment

**Example Output:**
```
✓ PASSED: ISR on zero income should be 0
✓ PASSED: ISR for $50,000 MXN
✓ PASSED: IVA acreditable on $1,000
...
Total Tests Passed: 41
Total Tests Failed: 0
✓ All financial calculation tests passed!
```

---

### 2. Database Integrity Test

**What it tests:** Foreign keys, constraints, orphaned records, indexes

```bash
./scripts/test-database-integrity.sh avanta-finance
```

**Output:** Generates report: `database_integrity_report_YYYYMMDD_HHMMSS.txt`  
**Duration:** 1-2 minutes  
**When to run:** Monthly or after data migrations

**Success Indicators:**
```
✓ PASSED: All required tables exist
✓ PASSED: No orphaned transactions found
✓ PASSED: All transaction category references are valid
...
Tests Passed: 30+
Tests Failed: 0
✓ Database integrity check completed successfully!
```

---

### 3. Automation Workflows Test

**What it tests:** APIs, webhooks, notifications, error handling

```bash
./scripts/test-automation-workflows.sh http://localhost:8788
# or for production:
./scripts/test-automation-workflows.sh https://avanta-finance.pages.dev
```

**Output:** Generates report: `workflow_test_report_YYYYMMDD_HHMMSS.txt`  
**Duration:** 2-3 minutes  
**When to run:** Post-deployment validation

---

## 🎯 Test Results Interpretation

### Status Indicators

| Symbol | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ ✓ PASSED | Test successful | None - Good! |
| ❌ ✗ FAILED | Test failed | Investigate immediately |
| ⚠️ WARNING | Potential issue | Review recommended |
| ℹ️ INFO | Information | No action needed |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed ✅ |
| 1 | One or more tests failed ❌ |

---

## 📊 What Each Test Validates

### Financial Calculations (41 tests)

✅ **ISR (Income Tax)** - 9 tests
- Zero/negative income handling
- All 11 tax brackets (SAT 2024)
- Bracket boundaries
- Very small to very large incomes
- Decimal precision

✅ **IVA (VAT)** - 7 tests
- Empty arrays
- Single and multiple expenses
- Deductible vs non-deductible
- Income IVA calculation
- Edge cases (zero, negative, undefined)

✅ **Monthly ISR** - 5 tests
- First month calculation
- Accumulated income logic
- Zero income months
- Months with losses
- Effective tax rate

✅ **Granular Deductibility (Phase 16)** - 5 tests
- National business expenses
- International with/without invoice
- Personal expenses
- Mixed calculations

✅ **Edge Cases** - 7 tests
- Very small amounts ($0.50)
- Exact bracket boundaries
- Very large amounts ($10M+)
- Decimal precision
- Accumulation over multiple months

✅ **Financial Health Score** - 6 tests
- Various savings rates
- Break-even scenarios
- Deficit handling
- No income/no data cases

---

## 🔧 Troubleshooting

### Issue: "wrangler: command not found"

```bash
npm install -g wrangler
wrangler login
```

### Issue: "jq: command not found" (optional)

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or continue without jq (JSON won't be pretty-printed)
```

### Issue: Node.js version errors

Ensure Node.js 18+ for ES modules support:
```bash
node --version  # Should be v18.0.0 or higher
```

### Issue: Permission denied on scripts

```bash
chmod +x scripts/*.sh
```

---

## 📈 Continuous Testing Strategy

### Development Workflow

```bash
# 1. Make code changes
# 2. Build
npm run build

# 3. Test calculations
node scripts/test-financial-calculations.js

# 4. If tests pass, commit
git add .
git commit -m "Your changes"
```

### Monthly Maintenance

```bash
# Database integrity check
./scripts/test-database-integrity.sh avanta-finance

# Review generated report
cat database_integrity_report_*.txt
```

### Production Deployment

```bash
# Pre-deployment
npm run build
node scripts/test-financial-calculations.js

# Post-deployment
./scripts/test-automation-workflows.sh https://your-production-url.com
```

---

## 🎓 Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| ISR Calculations | 9 | ✅ 100% |
| IVA Calculations | 7 | ✅ 100% |
| Monthly ISR | 5 | ✅ 100% |
| Deductibility | 5 | ✅ 100% |
| Edge Cases | 7 | ✅ 100% |
| Health Score | 6 | ✅ 100% |
| **TOTAL** | **41** | ✅ **100%** |

---

## 📚 Documentation

For detailed information, see:
- `PHASE_17_AUDIT_SUMMARY.md` - Complete audit report (22KB)
- `PHASE_17_COMPLETION_SUMMARY.md` - Executive summary (16KB)
- `scripts/README.md` - Detailed test script documentation

---

## ⚡ One-Liner Tests

Copy-paste these for quick testing:

```bash
# Quick validation (run all critical tests)
npm run build && node scripts/test-financial-calculations.js && echo "✅ READY FOR DEPLOYMENT"

# Full test suite
npm run build && \
node scripts/test-financial-calculations.js && \
./scripts/test-database-integrity.sh avanta-finance && \
./scripts/test-automation-workflows.sh http://localhost:8788

# Check test results
grep -E "PASSED|FAILED" database_integrity_report_*.txt | tail -10
grep -E "PASSED|FAILED" workflow_test_report_*.txt | tail -10
```

---

## 🏆 Success Checklist

Before deploying to production:

- [ ] `npm run build` completes without errors
- [ ] Financial calculations test: 41/41 tests pass
- [ ] Database integrity: No failures
- [ ] All files committed to git
- [ ] Documentation reviewed

**If all checked:** ✅ Ready for production deployment!

---

## 💡 Pro Tips

1. **Run tests before every commit** to catch issues early
2. **Keep test reports** for audit trail
3. **Monitor test execution time** - slow tests may indicate issues
4. **Review warnings** even if tests pass
5. **Update tests** when adding new features
6. **Run monthly database checks** for data quality

---

## 🆘 Getting Help

If tests fail:

1. **Check the output** - Error messages are descriptive
2. **Review the test code** - Scripts have inline comments
3. **Check recent changes** - What was changed since last passing test?
4. **Review documentation** - See audit summary for details
5. **Check logs** - Generated report files have details

---

**Quick Reference Last Updated:** October 18, 2025  
**Phase:** 17 - System-Wide Verification and Integrity Check  
**Test Suite Version:** 1.0
