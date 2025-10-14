# CSV Import & CFDI Parser - Testing Guide

## 🎯 Overview

This guide provides step-by-step instructions for testing the newly implemented CSV import and CFDI XML parser functionality.

## ✅ What Was Implemented

### 1. CSV Import System
- **Parser:** `src/utils/csvParser.js` (560 lines)
- **UI Component:** `src/components/CSVImport.jsx` (395 lines)
- **Supported Banks:** BBVA, Banco Azteca, Generic format
- **Features:** Auto-detection, validation, drag-drop, batch import

### 2. CFDI XML Parser
- **Parser:** `src/utils/cfdiParser.js` (565 lines)
- **UI Component:** `src/components/CFDIImport.jsx` (347 lines)
- **Supported Versions:** CFDI 3.3 and 4.0
- **Features:** UUID extraction, IVA validation, automatic transaction creation

### 3. Export Functionality
- **CSV Export:** Export transactions to CSV format
- **Features:** Spanish headers, Excel-compatible, UTF-8 encoding

## 🧪 Manual Testing Instructions

### Prerequisites

1. **Start the development environment:**
   ```bash
   # Build the frontend
   npm run build
   
   # Start with Wrangler (requires D1 and R2 setup)
   npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
   ```

2. **Navigate to:** http://localhost:8788

### Test 1: CSV Import - BBVA Format

1. Navigate to **Transacciones** page
2. Click **📥 Importar CSV** button
3. In the modal:
   - Select "BBVA" from the bank type dropdown
   - Drag or click to upload `samples/bbva-sample.csv`
   - Click **Analizar CSV**
4. Review the parsed data:
   - Should show 10 transactions
   - All transactions should be valid (green checkmarks)
   - Verify amounts are correct (e.g., first row: $250.00)
   - Verify dates are formatted correctly
5. Test inline editing:
   - Change a transaction type from "gasto" to "ingreso"
   - Change category from "personal" to "avanta"
6. Click **Importar 10 Transacciones**
7. Verify success message appears
8. Check that transactions appear in the main table

**Expected Results:**
- ✅ 10 valid transactions parsed
- ✅ Mix of income (Abono) and expenses (Cargo)
- ✅ Dates in YYYY-MM-DD format
- ✅ All transactions imported successfully
- ✅ Transactions visible in main page

### Test 2: CSV Import - Azteca Format

1. Click **📥 Importar CSV** again
2. In the modal:
   - Select "Banco Azteca" from the bank type dropdown
   - Upload `samples/azteca-sample.csv`
   - Click **Analizar CSV**
3. Review the parsed data:
   - Should show 10 transactions
   - All transactions should be valid
   - Verify amounts (e.g., first row: $180.50)
4. Import all transactions
5. Verify they appear in the main table

**Expected Results:**
- ✅ 10 valid transactions parsed
- ✅ Mix of deposits (Depósito) and withdrawals (Retiro)
- ✅ All transactions imported successfully

### Test 3: CSV Import - Auto-detection

1. Click **📥 Importar CSV** again
2. In the modal:
   - Select "Detectar Automáticamente"
   - Upload either `samples/bbva-sample.csv` or `samples/azteca-sample.csv`
   - Click **Analizar CSV**
3. Verify:
   - System correctly identifies the bank format
   - Transactions are parsed correctly

**Expected Results:**
- ✅ Auto-detection works for both formats
- ✅ Same parsing results as manual selection

### Test 4: CSV Export

1. On Transacciones page (with imported transactions)
2. Click **📤 Exportar CSV** button
3. A CSV file should download automatically
4. Open the CSV file in Excel, LibreOffice, or text editor
5. Verify:
   - Headers are in Spanish
   - All transactions are present
   - Dates, amounts, and categories are correct
   - File opens properly in Excel

**Expected Results:**
- ✅ CSV file downloads with date stamp in filename
- ✅ File opens in Excel without errors
- ✅ All data is properly formatted
- ✅ UTF-8 encoding preserved

### Test 5: CFDI Import - Income Invoice

1. Navigate to **Facturas CFDI** page
2. Click **📥 Importar XML** button
3. In the modal:
   - Upload `samples/cfdi-ingreso-sample.xml`
   - Click **Analizar CFDI**
4. Review the extracted data:
   - **Folio:** A/12345
   - **UUID:** 12345678-1234-1234-1234-123456789012
   - **Emisor:** EMPRESA EJEMPLO SA DE CV
   - **Receptor:** REYES GONZALEZ MATEO (REGM000905T24)
   - **Subtotal:** $12,068.97
   - **IVA (16%):** $1,931.03
   - **Total:** $14,000.00
   - **Concepto:** Producción de videoclip comercial
5. Verify "Crear también una transacción" is checked
6. Click **Importar CFDI**
7. Verify:
   - Success message appears
   - Invoice appears in invoices table
   - If transaction option was checked, transaction appears in Transacciones page

**Expected Results:**
- ✅ CFDI parsed correctly
- ✅ All amounts match XML
- ✅ IVA calculation is 16%
- ✅ UUID is unique and valid
- ✅ Invoice created in database
- ✅ Transaction created (if option was checked)
- ✅ XML uploaded to R2 (if configured)

### Test 6: CFDI Import - Expense Invoice

1. Click **📥 Importar XML** again
2. Upload `samples/cfdi-gasto-sample.xml`
3. Click **Analizar CFDI**
4. Review the extracted data:
   - **Folio:** B/98765
   - **UUID:** 98765432-9876-9876-9876-987654321098
   - **Subtotal:** $3,448.28
   - **IVA (16%):** $551.72
   - **Total:** $4,000.00
   - **Conceptos:** 2 items (Hosting + Mantenimiento)
5. Import the CFDI
6. Verify it appears in invoices table

**Expected Results:**
- ✅ CFDI parsed correctly
- ✅ Multiple conceptos handled properly
- ✅ Expense recognized (received invoice)
- ✅ Transaction marked as deductible (if created)

### Test 7: CFDI Duplicate Detection

1. Try to import `samples/cfdi-ingreso-sample.xml` again
2. Verify:
   - Error message appears
   - Message indicates "UUID duplicado" or similar
   - No duplicate invoice is created

**Expected Results:**
- ✅ Duplicate detection works
- ✅ Clear error message
- ✅ Database integrity maintained

### Test 8: Tax Calculations (ISR 20%, IVA 16%)

1. Navigate to **Fiscal** page
2. Select current month and year
3. Verify calculations:
   - Income total matches imported transactions
   - Deductible expenses calculated
   - ISR = (Income - Deductible) × 20%
   - IVA = (Income × 16%) - (Deductible × 16%)
4. Check that values match expectations

**Expected Results:**
- ✅ ISR calculated at 20%
- ✅ IVA calculated at 16%
- ✅ Calculations match imported data
- ✅ No changes to tax formulas

## 🔍 Validation Checklist

### CSV Import Validation
- [ ] BBVA format parsed correctly
- [ ] Azteca format parsed correctly
- [ ] Auto-detection works
- [ ] Drag-and-drop upload works
- [ ] Click-to-browse upload works
- [ ] Validation shows errors for invalid data
- [ ] Inline editing (type/category) works
- [ ] Batch import completes successfully
- [ ] Progress tracking displays correctly
- [ ] All transactions appear in database

### CFDI Import Validation
- [ ] Income invoice parsed correctly
- [ ] Expense invoice parsed correctly
- [ ] UUID extracted properly
- [ ] RFC fields validated
- [ ] IVA 16% calculated correctly
- [ ] Conceptos extracted
- [ ] Emisor/Receptor data extracted
- [ ] TimbreFiscal extracted
- [ ] Invoice created in database
- [ ] Optional transaction creation works
- [ ] XML uploaded to R2 (if configured)
- [ ] Duplicate detection works

### Export Validation
- [ ] CSV export generates file
- [ ] Filename includes date stamp
- [ ] File opens in Excel
- [ ] All data preserved
- [ ] UTF-8 encoding correct
- [ ] Headers in Spanish

### Tax System Validation
- [ ] ISR still calculated at 20%
- [ ] IVA still calculated at 16%
- [ ] Deductible expenses tracked
- [ ] Monthly summaries correct
- [ ] No regression in fiscal calculations

## 🐛 Known Issues / Limitations

1. **R2 Storage:** XML upload requires R2 bucket configuration
2. **Large Files:** CSV files > 10MB may be slow to parse
3. **Browser Support:** Requires modern browser with DOMParser API
4. **Timezone:** Dates parsed in browser's local timezone

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

CSV Import:
- BBVA format: ✅ / ❌
- Azteca format: ✅ / ❌
- Auto-detection: ✅ / ❌
- Validation: ✅ / ❌
- Import: ✅ / ❌

CFDI Import:
- Income invoice: ✅ / ❌
- Expense invoice: ✅ / ❌
- UUID extraction: ✅ / ❌
- IVA validation: ✅ / ❌
- Import: ✅ / ❌

CSV Export:
- File generation: ✅ / ❌
- Excel compatibility: ✅ / ❌
- Data integrity: ✅ / ❌

Tax Calculations:
- ISR 20%: ✅ / ❌
- IVA 16%: ✅ / ❌

Notes:
_________________________________
_________________________________
```

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Update user documentation
   - Train users on new features

2. **If issues found:**
   - Document issues in GitHub Issues
   - Prioritize by severity
   - Fix and re-test

3. **Future enhancements:**
   - Add more bank formats
   - Support CFDI 4.0 addenda
   - Bulk CFDI import
   - Enhanced validation rules
   - Excel export format

## 📞 Support

For issues or questions:
- Check IMPLEMENTATION_SUMMARY.md for implementation details
- Review samples/README.md for file format help
- Check TESTING_PLAN.md for advanced testing scenarios

---

Built with ❤️ for Mateo Reyes González / Avanta Design
