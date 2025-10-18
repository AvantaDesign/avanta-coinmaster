# Bank Statement Sample Files

This directory contains sample bank statement CSV files for testing the Bank Reconciliation feature (Phase 20).

## Sample Files

### 1. sample_bbva_october_2025.csv
**Format:** BBVA Mexico  
**Columns:** Fecha, Descripcion, Cargo, Abono, Saldo, Referencia  
**Features:**
- Spanish column names
- Separate columns for withdrawals (Cargo) and deposits (Abono)
- Reference numbers included
- 15 transactions covering October 2025

### 2. sample_santander_october_2025.csv
**Format:** Santander Mexico (English)  
**Columns:** Date, Description, Amount, Balance, Reference Number  
**Features:**
- English column names
- Single amount column with positive/negative values
- Reference numbers included
- Same transactions as BBVA file for comparison testing

### 3. sample_banorte_october_2025.csv
**Format:** Banorte Mexico  
**Columns:** Fecha Operacion, Concepto, Importe, Saldo, Folio  
**Features:**
- Spanish column names with variations
- Date format: DD/MM/YYYY
- Different sign convention (negative for deposits, positive for withdrawals)
- Reference numbers as "Folio"

## Transaction Types Included

The sample files include various transaction types commonly found in business bank statements:

1. **Income Transactions:**
   - SPEI transfers received
   - Cash deposits
   - Customer payments
   - Invoice payments

2. **Expense Transactions:**
   - Service payments (electricity, internet)
   - ATM withdrawals
   - Rent payments
   - Supplier payments
   - Payroll payments
   - Office supplies purchases
   - Bank fees

## How to Use

1. **Upload Test:**
   - Go to Bank Reconciliation → Upload tab
   - Select one of the sample files
   - Enter bank name (BBVA, Santander, or Banorte)
   - Enter a test account number (e.g., "1234")
   - Click "Importar Estado de Cuenta"

2. **Auto-Matching Test:**
   - Create matching transactions in the system first
   - Upload the bank statement
   - Check the Matches tab to see auto-matched transactions
   - Verify confidence scores

3. **Manual Matching Test:**
   - Upload bank statement with unmatched items
   - Go to Statements tab
   - Click "Conciliar" on an unmatched statement
   - Select a transaction to match manually

4. **Format Compatibility Test:**
   - Upload each sample file to verify parser handles different formats
   - Check that all transactions are imported correctly
   - Verify amount signs are interpreted correctly

## Creating Test Transactions

To test the auto-matching feature, create these transactions in the system:

```sql
-- Example transactions that should match the bank statements
INSERT INTO transactions (user_id, date, description, amount, type) VALUES
('test-user', '2025-10-01', 'TRANSFERENCIA SPEI RECIBIDA', 25000.00, 'ingreso'),
('test-user', '2025-10-02', 'PAGO SERVICIOS CFE', -850.50, 'gasto'),
('test-user', '2025-10-03', 'RETIRO CAJERO AUTOMATICO', -2000.00, 'gasto'),
('test-user', '2025-10-05', 'DEPOSITO EN EFECTIVO', 5000.00, 'ingreso'),
('test-user', '2025-10-08', 'PAGO RENTA LOCAL', -15000.00, 'gasto');
-- ... etc
```

## Expected Matching Results

With properly created transactions, you should see:

- **High Confidence Matches (≥85%):** 
  - Exact amount and date matches
  - Very similar descriptions
  
- **Medium Confidence Matches (50-84%):**
  - Same amount, date within 2-5 days
  - Similar descriptions
  
- **No Match (< 50%):**
  - Different amounts
  - Different dates (> 5 days)
  - Completely different descriptions

## Notes

- All sample files contain the same transactions in different formats
- Transaction amounts are in Mexican Pesos (MXN)
- Dates are in October 2025
- Reference numbers are sequential for easy tracking
- Files are UTF-8 encoded

## Troubleshooting

**If import fails:**
1. Check file encoding (must be UTF-8)
2. Verify first row contains headers
3. Ensure amounts are numeric (no text)
4. Check date format consistency

**If matching doesn't work:**
1. Ensure transactions exist in the system first
2. Check that dates match within 5 days
3. Verify amounts are exact or very close
4. Review transaction descriptions for similarity

## Future Additions

Additional sample files to be added:
- [ ] Banamex format
- [ ] HSBC format
- [ ] Scotiabank format
- [ ] Large file (1000+ transactions)
- [ ] Edge cases (duplicates, zero amounts, etc.)
