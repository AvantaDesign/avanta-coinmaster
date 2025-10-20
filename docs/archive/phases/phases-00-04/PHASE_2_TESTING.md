# Phase 2 Testing Guide - Fiscal Module and Reconciliation

## Overview
This document provides comprehensive testing instructions for Phase 2 features: Tax Calculation System, Account Reconciliation, Fiscal Reports, and Enhanced Dashboard.

---

## 1. Tax Calculation System

### 1.1 Mexican ISR Calculation
Test that ISR is calculated correctly using the 11 official Mexican tax brackets.

**Test Cases:**

#### Test 1.1.1: Low Income (Bracket 1)
```
Income: $5,000
Deductible: $1,000
Expected Utilidad: $4,000
Expected ISR: ~$76.80 (1.92% rate)
```

#### Test 1.1.2: Medium Income (Bracket 3)
```
Income: $80,000
Deductible: $20,000
Expected Utilidad: $60,000
Expected ISR: ~$3,855.14 + calculated amount
```

#### Test 1.1.3: High Income (Bracket 7)
```
Income: $600,000
Deductible: $100,000
Expected Utilidad: $500,000
Expected ISR: ~$93,000 (using 23.52% rate for bracket)
```

#### Test 1.1.4: Zero or Negative Income
```
Income: $10,000
Deductible: $15,000
Expected Utilidad: -$5,000
Expected ISR: $0 (no tax on losses)
```

### 1.2 IVA Calculation
Test IVA calculations at 16% rate.

**Test Cases:**

#### Test 1.2.1: IVA a Pagar (VAT to Pay)
```
Income: $100,000
Deductible: $30,000
Expected IVA Cobrado: $16,000 (16% of income)
Expected IVA Pagado: $4,800 (16% of deductible)
Expected IVA a Pagar: $11,200
```

#### Test 1.2.2: IVA a Favor (VAT Credit)
```
Income: $20,000
Deductible: $50,000
Expected IVA Cobrado: $3,200
Expected IVA Pagado: $8,000
Expected IVA a Favor: $4,800
```

### 1.3 Period Calculations

#### Test 1.3.1: Monthly Calculation
- Navigate to Fiscal Calculator
- Select "Mensual" period
- Choose a specific month/year
- Verify calculations for that month only

#### Test 1.3.2: Quarterly Calculation
- Select "Trimestral" period
- Choose Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), or Q4 (Oct-Dec)
- Verify calculations aggregate all months in quarter
- Check due date (17th of month following quarter end)

#### Test 1.3.3: Annual Calculation
- Select "Anual" period
- Choose a year
- Verify calculations aggregate entire year
- Check due date (April 30th of following year)

---

## 2. Account Reconciliation System

### 2.1 Transfer Detection

**Test Cases:**

#### Test 2.1.1: Perfect Match
Create two transactions:
```
Transaction 1:
- Date: 2025-01-15
- Amount: -$1,000 (expense)
- Account: BBVA
- Description: "Transfer to Azteca"

Transaction 2:
- Date: 2025-01-15
- Amount: $1,000 (income)
- Account: Azteca
- Description: "Transfer from BBVA"
```
Expected: High confidence match (>90%)

#### Test 2.1.2: Close Match (Different Dates)
```
Transaction 1:
- Date: 2025-01-15
- Amount: -$1,000
- Account: BBVA

Transaction 2:
- Date: 2025-01-17 (2 days later)
- Amount: $1,000
- Account: Azteca
```
Expected: Medium confidence match (70-90%)

#### Test 2.1.3: Amount Tolerance
```
Transaction 1:
- Amount: -$1,000.00
Transaction 2:
- Amount: $999.50 (0.5% difference)
```
With 1% tolerance: Should match
With 0.1% tolerance: Should not match

### 2.2 Duplicate Detection

**Test Cases:**

#### Test 2.2.1: Exact Duplicate
```
Transaction 1:
- Date: 2025-01-15 10:00 AM
- Amount: -$500
- Description: "Restaurant payment"
- Account: BBVA

Transaction 2:
- Date: 2025-01-15 10:05 AM
- Amount: -$500
- Description: "Restaurant payment"
- Account: BBVA
```
Expected: High confidence duplicate (>90%)

#### Test 2.2.2: Similar Description
```
Transaction 1:
- Description: "OXXO STORE 123"
Transaction 2:
- Description: "OXXO STORE 124"
```
Expected: Should detect based on similarity threshold

### 2.3 Reconciliation Actions

#### Test 2.3.1: Mark as Transfer
- Select matched transaction pair
- Apply "Mark as Transfer" action
- Verify both transactions updated to transaction_type='transfer'

#### Test 2.3.2: Delete Duplicates
- Select duplicate transactions
- Apply "Delete Duplicates" action
- Verify transactions soft deleted (is_deleted=1)

#### Test 2.3.3: Link Transfers
- Select two transactions to link
- Apply "Link Transfers" action
- Verify notes updated with linked transaction ID

---

## 3. Fiscal Reports

### 3.1 Quarterly Report

**Test Cases:**

#### Test 3.1.1: Generate Report
- Navigate to Fiscal Reports
- Select "Trimestral" report type
- Choose a year
- Click "Generar"
- Verify all 4 quarters displayed with:
  - Income, expenses, deductibles
  - ISR and IVA calculations
  - Due dates

#### Test 3.1.2: Export CSV
- Generate quarterly report
- Click CSV export button
- Verify downloaded file contains:
  - Header row
  - One row per quarter
  - All financial data
  - Proper formatting

#### Test 3.1.3: Print Report
- Generate report
- Click print button
- Verify print preview shows formatted report

### 3.2 Annual Report

**Test Cases:**

#### Test 3.2.1: Annual Summary
- Select "Anual" report type
- Verify displays:
  - Total income/expenses
  - Business vs personal breakdown
  - Deductible percentage
  - Total ISR and IVA

#### Test 3.2.2: Business vs Personal
- Verify correct categorization:
  - Business transactions (category='avanta' OR transaction_type='business')
  - Personal transactions (category='personal' OR transaction_type='personal')

### 3.3 Expense Breakdown

**Test Cases:**

#### Test 3.3.1: Category Analysis
- Select "Gastos por Categoría" report
- Verify table shows:
  - Category name
  - Total amount
  - Deductible amount
  - Transaction count
  - Deductible percentage

#### Test 3.3.2: Sorting
- Verify categories sorted by total amount (highest first)

---

## 4. Enhanced Dashboard

### 4.1 Fiscal Summary Cards

**Test Cases:**

#### Test 4.1.1: Display Current Month
- Navigate to Home page
- Verify fiscal summary section shows:
  - Current month's utilidad
  - Current month's ISR
  - Current month's IVA
  - Total taxes (ISR + IVA)
  - Due date

#### Test 4.1.2: Due Date Alerts
- With upcoming due date (< 7 days): Yellow alert
- With overdue date: Red alert
- With distant due date: Green display

### 4.2 MonthlyChart Enhancement

**Test Cases:**

#### Test 4.2.1: Fiscal Data Display
- Verify chart can show tax data alongside income/expenses
- Check proper color coding (purple for taxes)

---

## 5. Integration Tests

### 5.1 End-to-End Workflow

#### Test 5.1.1: Full Tax Cycle
1. Create business income transactions
2. Create deductible expense transactions
3. Navigate to Fiscal Calculator
4. Select monthly period
5. Verify calculations
6. Generate fiscal report
7. Export report
8. Verify exported data matches displayed data

#### Test 5.1.2: Reconciliation Flow
1. Create multiple transactions across accounts
2. Navigate to Reconciliation Manager
3. Run reconciliation
4. Review matches and duplicates
5. Apply reconciliation actions
6. Verify transactions updated
7. Re-run reconciliation
8. Verify cleaned results

### 5.2 Data Consistency

#### Test 5.2.1: Transaction Filtering
- Verify only non-deleted transactions (is_deleted=0) included in calculations
- Test with mix of active and deleted transactions

#### Test 5.2.2: Date Range Accuracy
- Create transactions at period boundaries
- Verify included/excluded correctly
- Test edge cases (first/last day of month)

---

## 6. Performance Tests

### 6.1 Large Datasets

#### Test 6.1.1: 1000+ Transactions
- Import or create 1000+ transactions
- Run reconciliation
- Verify completes within reasonable time (<30 seconds)
- Check UI remains responsive

#### Test 6.1.2: Annual Report
- Generate annual report with full year of data
- Verify all calculations complete
- Check export functionality

---

## 7. Edge Cases

### 7.1 Boundary Conditions

#### Test 7.1.1: Tax Bracket Boundaries
Test ISR calculation at exact bracket boundaries:
- $7,735.00 (boundary between brackets 1 and 2)
- $65,651.07 (boundary between brackets 2 and 3)
- etc.

#### Test 7.1.2: Zero Amounts
- Zero income, zero expenses
- Zero deductibles
- Verify no division by zero errors

#### Test 7.1.3: Very Large Numbers
- Test with amounts > $1,000,000
- Verify ISR calculation uses highest bracket correctly

### 7.2 Data Validation

#### Test 7.2.1: Invalid Periods
- Try invalid month (13, 0, -1)
- Try invalid quarter (5, 0)
- Try invalid year (1999, 2101)
- Verify proper error messages

#### Test 7.2.2: Missing Data
- Generate reports with no transactions
- Verify graceful handling
- Check for "No data" messages

---

## 8. API Testing

### 8.1 Fiscal API

#### Test 8.1.1: Monthly Endpoint
```bash
GET /api/fiscal?month=1&year=2025&period=monthly
```
Expected: Monthly calculations

#### Test 8.1.2: Quarterly Endpoint
```bash
GET /api/fiscal?year=2025&period=quarterly&quarter=1
```
Expected: Q1 calculations

#### Test 8.1.3: Annual Endpoint
```bash
GET /api/fiscal?year=2025&period=annual
```
Expected: Full year calculations

### 8.2 Reconciliation API

#### Test 8.2.1: Get Matches
```bash
GET /api/reconciliation?tolerance_days=3&tolerance_amount=0.01&min_confidence=70
```
Expected: Transfer matches and duplicates

#### Test 8.2.2: Apply Actions
```bash
POST /api/reconciliation
{
  "action": "mark_as_transfer",
  "transactionIds": [1, 2]
}
```
Expected: Transactions updated

---

## 9. Browser Compatibility

Test all features in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 10. Mobile Responsiveness

### Test 10.1: Mobile View
- Test on mobile viewport (375px width)
- Verify all components responsive
- Check tab navigation
- Test forms and buttons

### Test 10.2: Tablet View
- Test on tablet viewport (768px width)
- Verify grid layouts adjust properly

---

## Test Data Setup

### Sample Transactions for Testing

```sql
-- Business Income
INSERT INTO transactions (date, description, amount, type, category, transaction_type, is_deductible)
VALUES ('2025-01-15', 'Client Payment', 50000, 'ingreso', 'avanta', 'business', 0);

-- Deductible Expense
INSERT INTO transactions (date, description, amount, type, category, transaction_type, is_deductible)
VALUES ('2025-01-20', 'Office Supplies', 5000, 'gasto', 'avanta', 'business', 1);

-- Personal Expense
INSERT INTO transactions (date, description, amount, type, category, transaction_type, is_deductible)
VALUES ('2025-01-25', 'Groceries', 2000, 'gasto', 'personal', 'personal', 0);

-- Transfer Pair
INSERT INTO transactions (date, description, amount, type, category, account, transaction_type)
VALUES ('2025-01-10', 'Transfer to savings', -10000, 'gasto', 'personal', 'BBVA', 'transfer');

INSERT INTO transactions (date, description, amount, type, category, account, transaction_type)
VALUES ('2025-01-10', 'Transfer from checking', 10000, 'ingreso', 'personal', 'Savings', 'transfer');
```

---

## Success Criteria

✅ All ISR calculations match Mexican tax law
✅ IVA calculations accurate at 16% rate
✅ Transfer detection >80% accuracy
✅ Duplicate detection >85% accuracy
✅ Reports generate without errors
✅ Export functionality works for all formats
✅ Dashboard displays fiscal data correctly
✅ API endpoints return correct data
✅ Build completes without errors
✅ No console errors in browser
✅ Mobile responsive design works
✅ Performance acceptable with large datasets

---

## Known Limitations

1. ISR calculations use simplified brackets (annual basis)
2. No support for tax credits or special deductions
3. Reconciliation requires manual review and approval
4. Export limited to CSV and JSON formats

---

## Support

For issues or questions:
- Review API responses for error details
- Check browser console for client-side errors
- Verify database migration completed
- Ensure all new files are included in build
