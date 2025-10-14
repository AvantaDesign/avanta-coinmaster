# Phase 2 Quick Start Guide

## 🚀 Getting Started with Fiscal Module & Reconciliation

This guide will help you quickly start using the new Phase 2 features in Avanta CoinMaster 2.0.

---

## Feature 1: Tax Calculator

### Calculate Your Monthly Taxes

1. **Navigate to Fiscal Page**
   - Click "Vista Fiscal" from the navigation menu

2. **Select Calculator Tab**
   - Click on "Calculadora Fiscal" tab

3. **Configure Period**
   - Select "Mensual" for monthly calculations
   - Choose the month and year
   - Click "Calcular"

4. **Review Results**
   - Check your ISR (Income Tax)
   - Review IVA (VAT) calculations
   - See your utilidad (taxable income)
   - Note the payment due date

**What you'll see:**
- Green card: Business income
- Red card: Business expenses
- Blue card: Deductible expenses
- Purple card: Utilidad (profit)
- ISR amount in red
- IVA amount in orange

### Calculate Quarterly Taxes

1. Select "Trimestral" in the period dropdown
2. Choose the quarter (Q1, Q2, Q3, or Q4)
3. Choose the year
4. Click "Calcular"

**Quarters:**
- Q1: January to March
- Q2: April to June
- Q3: July to September
- Q4: October to December

### Calculate Annual Taxes

1. Select "Anual" in the period dropdown
2. Choose the year
3. Click "Calcular"
4. Review your complete annual summary

---

## Feature 2: Fiscal Reports

### Generate Quarterly Report

1. **Navigate to Reports Tab**
   - Go to "Vista Fiscal"
   - Click "Reportes" tab

2. **Select Report Type**
   - Choose "Trimestral" from the dropdown

3. **Choose Year**
   - Select the year you want to report

4. **Generate Report**
   - Click "Generar" button
   - Wait a moment while the report is created

5. **Review Report**
   - See all 4 quarters displayed
   - Each quarter shows:
     - Income and expenses
     - ISR and IVA calculations
     - Due dates
   - Annual totals at the bottom

6. **Export Report (Optional)**
   - Click "📄 CSV" to download CSV file
   - Use the print button 🖨️ to print

### Generate Annual Report

1. Select "Anual" as report type
2. Choose the year
3. Click "Generar"
4. Review comprehensive annual summary:
   - Total income and expenses
   - Business vs personal breakdown
   - Deductible percentage
   - Total taxes

### Generate Expense Breakdown

1. Select "Gastos por Categoría"
2. Choose the year
3. Click "Generar"
4. Review table showing:
   - Each expense category
   - Total and deductible amounts
   - Transaction counts
   - Deductible percentages

**Tip:** Categories with higher deductible percentages are shown in green!

---

## Feature 3: Account Reconciliation

### Find Transfer Matches

1. **Navigate to Reconciliation Tab**
   - Go to "Vista Fiscal"
   - Click "Conciliación" tab

2. **Configure Settings (Optional)**
   - **Tolerancia de días:** How many days apart transactions can be (default: 3)
   - **Tolerancia de monto:** Percentage difference allowed in amounts (default: 1%)
   - **Confianza mínima:** Minimum confidence score to show (default: 70%)

3. **Run Reconciliation**
   - Click "Ejecutar Conciliación" button
   - Wait while the system analyzes your transactions

4. **Review Statistics**
   - Total transactions analyzed
   - Number of transfers found
   - Unmatched transactions
   - Reconciliation percentage

5. **Check Transfer Matches**
   - Click "Transferencias Detectadas" tab
   - Review each matched pair:
     - Left card: Origin transaction (red)
     - Right card: Destination transaction (green)
     - Confidence score (higher is better)
     - Amount and date differences

6. **Review Each Match**
   - Green badge (>90%): Very likely a transfer
   - Yellow badge (70-89%): Probably a transfer
   - Red badge (<70%): Uncertain

### Find Duplicate Transactions

1. After running reconciliation, click "Duplicados Potenciales" tab

2. Review duplicate groups:
   - Blue card: Original transaction
   - Yellow cards: Potential duplicates
   - Each duplicate shows confidence score

3. Check details:
   - Time difference (in hours)
   - Description similarity
   - Confidence score

### Take Action

**Currently:** Reconciliation actions are for review only. Future updates will enable:
- Automatic marking of transfers
- Bulk deletion of duplicates
- Transaction linking

**For now:** Use the information to:
- Manually update transaction types
- Verify transfers in your accounts
- Identify and handle duplicates

---

## Feature 4: Fiscal Dashboard

### Home Page Summary

When you visit the home page, you'll now see:

**Fiscal Summary Section (new!)**
- Current month's utilidad
- ISR amount
- IVA amount
- Total taxes due
- Payment due date

**Color Coding:**
- Green: Due date is far away (safe)
- Yellow: Due date coming soon (< 7 days)
- Red: Overdue payment (action needed!)

**Quick Access:**
- Click "Ver detalles →" to go to full fiscal page

---

## Understanding the Numbers

### ISR (Impuesto Sobre la Renta)
**What it is:** Income tax on your business profits

**How it's calculated:**
1. Business income - Deductible expenses = Utilidad
2. Apply Mexican tax brackets to utilidad
3. Result = ISR to pay

**Example:**
- Income: $100,000
- Deductible expenses: $25,000
- Utilidad: $75,000
- ISR: ~$15,432 (based on tax brackets)

### IVA (Impuesto al Valor Agregado)
**What it is:** Value Added Tax (16% in Mexico)

**How it's calculated:**
1. IVA Cobrado = Income × 16%
2. IVA Pagado = Deductible expenses × 16%
3. IVA to pay = IVA Cobrado - IVA Pagado

**Example:**
- Income: $100,000 → IVA Cobrado: $16,000
- Deductible: $25,000 → IVA Pagado: $4,000
- IVA to pay: $12,000

### Utilidad (Taxable Income)
**What it is:** Your business profit subject to ISR

**Formula:** Business Income - Deductible Expenses

### Effective Tax Rate
**What it is:** Your actual tax rate as percentage

**Formula:** (ISR / Utilidad) × 100

**Example:** ISR $15,432 / Utilidad $75,000 = 20.58%

---

## Tips for Best Results

### For Accurate Tax Calculations

1. **Mark Transactions Correctly**
   - Business income: category = "avanta" OR transaction_type = "business"
   - Personal expenses: category = "personal"
   - Mark deductible expenses: is_deductible = true

2. **Keep Good Records**
   - Enter transactions promptly
   - Include accurate descriptions
   - Link invoices when available

3. **Review Monthly**
   - Check calculations each month
   - Verify business vs personal split
   - Note due dates in calendar

### For Better Reconciliation

1. **Use Consistent Account Names**
   - Same name for each bank account
   - Helps matching work better

2. **Add Descriptions**
   - Clear descriptions help matching
   - Include account names in transfer descriptions

3. **Regular Reconciliation**
   - Run weekly or monthly
   - Easier to remember recent transfers
   - Prevents duplicate buildup

4. **Adjust Tolerances**
   - Tight match: Lower tolerances (1 day, 0.1%)
   - Loose match: Higher tolerances (5 days, 2%)
   - Start with defaults and adjust

---

## Common Questions

### Q: Are these official tax calculations?
**A:** No, these are estimates for tracking purposes. Always consult with your accountant for official declarations.

### Q: Why is my ISR different from last month?
**A:** ISR uses progressive tax brackets. As income increases, higher rates apply to the additional income.

### Q: What makes an expense deductible?
**A:** Generally, business-related expenses are deductible. Mark the transaction as business and set is_deductible = true. Consult tax law or your accountant.

### Q: Can I export my reports?
**A:** Yes! Use the CSV button to export data. You can open CSV files in Excel for further analysis.

### Q: What if reconciliation finds false matches?
**A:** Check the confidence score. Low confidence (<70%) may be false positives. Review carefully before taking action.

### Q: How do I fix a wrong match?
**A:** Currently, reconciliation is for review only. You can manually update transaction types in the transaction table.

### Q: What's a good confidence score?
**A:**
- 90-100%: Almost certainly correct
- 80-89%: Very likely correct
- 70-79%: Probably correct, review carefully
- <70%: May be incorrect, use caution

---

## Keyboard Shortcuts

- **Tab:** Switch between form fields
- **Enter:** Submit forms
- **Escape:** Close modals
- **Ctrl/Cmd + P:** Print current page
- **Ctrl/Cmd + S:** Browser save (for exports)

---

## Mobile Usage

All features work on mobile devices:

1. **Calculator:** Vertical layout on small screens
2. **Reports:** Scrollable tables
3. **Reconciliation:** Swipe between tabs
4. **Dashboard:** Stacked cards

**Tip:** Landscape mode provides better visibility for reports and reconciliation.

---

## Getting Help

### Check Your Data
- Verify transactions are entered correctly
- Ensure dates are accurate
- Check business/personal categorization

### Review Documentation
- `PHASE_2_TESTING.md` - Detailed testing scenarios
- `PHASE_2_API_REFERENCE.md` - Technical API details
- `PHASE_2_FINAL_SUMMARY.md` - Complete feature list

### Common Issues

**Issue:** Tax calculations seem wrong
- **Check:** Are transactions marked as business?
- **Check:** Are deductible expenses marked correctly?
- **Check:** Is the period selected correctly?

**Issue:** No transfers found
- **Try:** Increase tolerance days/amount
- **Try:** Lower minimum confidence
- **Check:** Are transfers in different accounts?

**Issue:** Too many false matches
- **Try:** Decrease tolerance settings
- **Try:** Increase minimum confidence
- **Check:** Transaction descriptions for clarity

---

## What's Next?

After you're comfortable with Phase 2 features:

### Phase 3 (Coming Soon)
- Automated workflows
- Accounts receivable tracking
- Accounts payable management
- Invoice status tracking
- Payment reminders

### Provide Feedback
Your feedback helps improve the system:
- What features do you use most?
- What could be clearer?
- What's missing?
- What works great?

---

## Quick Reference Card

### Tax Calculator
1. Vista Fiscal → Calculadora Fiscal
2. Select period (Monthly/Quarterly/Annual)
3. Choose month/quarter/year
4. Click Calcular
5. Review ISR, IVA, utilidad

### Reports
1. Vista Fiscal → Reportes
2. Select report type
3. Choose year
4. Click Generar
5. Export CSV or print

### Reconciliation
1. Vista Fiscal → Conciliación
2. Adjust tolerances if needed
3. Click Ejecutar Conciliación
4. Review matches and duplicates
5. Note confidence scores

### Dashboard
1. Home page shows current month fiscal summary
2. Green/yellow/red due date alerts
3. Click "Ver detalles" for more

---

**Need more help?** Check the detailed documentation in the `docs/` folder.

**Ready to start?** Open Avanta CoinMaster and navigate to Vista Fiscal!

---

Last Updated: October 14, 2025  
Phase 2 - Fiscal Module & Reconciliation
