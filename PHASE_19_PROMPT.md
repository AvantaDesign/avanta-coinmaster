# Phase 19: Core Tax Calculation Engine - Implementation Prompt

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at `/home/runner/work/avanta-coinmaster/avanta-coinmaster`.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

- ✅ **Phases 1-18:** COMPLETED (Comprehensive financial management system including Income Module and CFDI Control & Validation)
- 🚧 **Phase 19:** CURRENT PHASE (Core Tax Calculation Engine)
- 📋 **Phases 20-29:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

## Current Task: Phase 19 - Core Tax Calculation Engine

### Goal

Develop the backend engine for accurate monthly provisional ISR and definitive IVA calculations, providing complete transparency and compliance with Mexican tax law.

### Context from Previous Phases

**Phase 17 & 18 successfully implemented:**
- ✅ Income module with 12 fiscal fields (client_type, client_rfc, currency, exchange_rate, payment_method, iva_rate, isr/iva_retention, cfdi_uuid, issue_date, payment_date, economic_activity_code)
- ✅ SAT accounts catalog table (Anexo 24 with hierarchical structure)
- ✅ UMA 2025 values in fiscal_parameters
- ✅ Enhanced transaction API with comprehensive validation
- ✅ CFDI metadata table for managing fiscal invoices
- ✅ CFDI upload, parsing, and validation system
- ✅ Auto-matching CFDIs to transactions by UUID
- ✅ RFC validation and duplicate detection

The transactions and cfdi_metadata tables now contain all necessary data for accurate tax calculations.

## Actionable Steps

### 1. Database Schema - Tax Calculation Tables

**Create Migration:** `migrations/026_add_tax_calculation_tables.sql`

Create the following tables:

#### monthly_tax_calculations
- id (PRIMARY KEY)
- user_id (TEXT, foreign key to users)
- year (INTEGER)
- month (INTEGER)
- calculation_date (TIMESTAMP)
- status (TEXT) - 'draft', 'calculated', 'filed', 'paid'

**ISR Fields:**
- total_income (DECIMAL) - Ingresos totales del mes
- accumulated_income (DECIMAL) - Ingresos acumulados del año
- total_deductions (DECIMAL) - Deducciones del mes
- accumulated_deductions (DECIMAL) - Deducciones acumuladas del año
- taxable_base (DECIMAL) - Base gravable
- isr_tariff_amount (DECIMAL) - ISR según tarifa
- isr_subsidy (DECIMAL) - Subsidio al empleo (if applicable)
- isr_retentions (DECIMAL) - Retenciones de ISR
- previous_isr_payments (DECIMAL) - Pagos provisionales anteriores
- isr_to_pay (DECIMAL) - ISR a pagar del mes
- accumulated_isr_paid (DECIMAL) - ISR pagado acumulado

**IVA Fields:**
- iva_charged (DECIMAL) - IVA trasladado (cobrado)
- iva_creditable (DECIMAL) - IVA acreditable (pagado)
- iva_balance (DECIMAL) - Saldo a favor/pagar del mes
- previous_iva_balance (DECIMAL) - Saldo a favor del mes anterior
- iva_to_pay (DECIMAL) - IVA a pagar del mes
- iva_in_favor (DECIMAL) - Saldo a favor para el siguiente mes

**Metadata:**
- calculation_details (JSON) - Detailed breakdown of calculations
- created_at, updated_at

**Indexes:** user_id, year, month, status

#### isr_tariff_tables
- id (PRIMARY KEY)
- year (INTEGER)
- period_type (TEXT) - 'monthly', 'annual'
- lower_limit (DECIMAL)
- upper_limit (DECIMAL)
- fixed_amount (DECIMAL) - Cuota fija
- rate_on_excess (DECIMAL) - % sobre excedente
- is_active (BOOLEAN)
- created_at, updated_at

**Note:** Pre-populate with 2025 ISR tariff tables for monthly and annual calculations.

### 2. Backend API Development

#### Create `functions/api/tax-calculation.js`

**Endpoints:**

##### GET /api/tax-calculation/preview
- **Query params:** `year=YYYY&month=MM`
- **Returns:** Detailed preview of tax calculations for the specified month without saving
- **Response structure:**
```json
{
  "period": { "year": 2025, "month": 10 },
  "isr": {
    "income": {
      "monthly": 50000,
      "accumulated": 500000
    },
    "deductions": {
      "monthly": 15000,
      "accumulated": 150000
    },
    "taxableBase": 350000,
    "tariffAmount": 42000,
    "retentions": 5000,
    "previousPayments": 37000,
    "toPay": 0,
    "breakdown": [...]
  },
  "iva": {
    "charged": 8000,
    "creditable": 2400,
    "balance": 5600,
    "previousBalance": 0,
    "toPay": 5600,
    "breakdown": [...]
  }
}
```

##### POST /api/tax-calculation/calculate
- **Body:** `{ year, month, save: boolean }`
- **Function:** Performs full calculation and optionally saves to database
- **Returns:** Same structure as preview plus saved calculation ID

##### GET /api/tax-calculation/history
- **Query params:** `year=YYYY`, pagination params
- **Returns:** List of saved calculations for the year
- **Use case:** Review past calculations

##### GET /api/tax-calculation/:id
- **Returns:** Specific saved calculation with full details

##### PUT /api/tax-calculation/:id
- **Body:** `{ status: 'filed' | 'paid' }`
- **Function:** Update calculation status

#### Create `functions/api/tax-calculation/isr-engine.js`

**ISR Calculation Module** (Provisional Monthly - Régimen de Actividades Empresariales y Profesionales):

```javascript
export async function calculateMonthlyISR(userId, year, month, db) {
  // 1. Fetch all income transactions for the month
  const monthlyIncome = await getMonthlyIncome(userId, year, month, db);
  
  // 2. Fetch accumulated income for the year (Jan to current month)
  const accumulatedIncome = await getAccumulatedIncome(userId, year, month, db);
  
  // 3. Fetch all deductible expenses for the month
  const monthlyDeductions = await getMonthlyDeductions(userId, year, month, db);
  
  // 4. Fetch accumulated deductions for the year
  const accumulatedDeductions = await getAccumulatedDeductions(userId, year, month, db);
  
  // 5. Calculate taxable base: Accumulated Income - Accumulated Deductions
  const taxableBase = accumulatedIncome - accumulatedDeductions;
  
  // 6. Apply ISR tariff table (monthly)
  const isrFromTariff = applyISRTariff(taxableBase, year, 'monthly', db);
  
  // 7. Subtract retentions
  const totalRetentions = await getISRRetentions(userId, year, month, db);
  
  // 8. Subtract previous provisional payments
  const previousPayments = await getPreviousISRPayments(userId, year, month, db);
  
  // 9. Calculate ISR to pay this month
  const isrToPay = Math.max(0, isrFromTariff - totalRetentions - previousPayments);
  
  return {
    monthlyIncome,
    accumulatedIncome,
    monthlyDeductions,
    accumulatedDeductions,
    taxableBase,
    isrFromTariff,
    totalRetentions,
    previousPayments,
    isrToPay,
    breakdown: generateISRBreakdown(...)
  };
}

function applyISRTariff(taxableBase, year, periodType, db) {
  // 1. Fetch tariff table for the year and period
  // 2. Find applicable bracket
  // 3. Calculate: fixedAmount + (taxableBase - lowerLimit) * rate
  // 4. Return ISR amount
}
```

#### Create `functions/api/tax-calculation/iva-engine.js`

**IVA Calculation Module** (Definitive Monthly):

```javascript
export async function calculateMonthlyIVA(userId, year, month, db) {
  // 1. Fetch IVA charged (IVA trasladado) from income transactions
  const ivaCharged = await getMonthlyIVACharged(userId, year, month, db);
  
  // 2. Fetch IVA creditable from expense transactions (is_iva_deductible = 1)
  const ivaCreditable = await getMonthlyIVACreditable(userId, year, month, db);
  
  // 3. Calculate monthly balance: IVA charged - IVA creditable
  const monthlyBalance = ivaCharged - ivaCreditable;
  
  // 4. Get previous month's balance (if in favor)
  const previousBalance = await getPreviousIVABalance(userId, year, month, db);
  
  // 5. Calculate final amount:
  //    - If monthlyBalance > 0: pay (monthlyBalance - previousBalance)
  //    - If monthlyBalance < 0: saldo a favor for next month
  const ivaToPay = Math.max(0, monthlyBalance - previousBalance);
  const ivaInFavor = Math.max(0, -monthlyBalance);
  
  return {
    ivaCharged,
    ivaCreditable,
    monthlyBalance,
    previousBalance,
    ivaToPay,
    ivaInFavor,
    breakdown: generateIVABreakdown(...)
  };
}
```

### 3. Frontend UI - Tax Calculation Dashboard

**Create:** `src/components/TaxCalculationDashboard.jsx`

**Features:**

1. **Period Selector**
   - Year dropdown
   - Month dropdown
   - "Calcular" button

2. **Calculation Preview**
   - ISR section:
     - Monthly/Accumulated income display
     - Monthly/Accumulated deductions display
     - Taxable base
     - ISR from tariff
     - Retentions
     - Previous payments
     - **ISR to pay** (highlighted)
   - IVA section:
     - IVA charged display
     - IVA creditable display
     - Monthly balance
     - Previous balance
     - **IVA to pay** (highlighted)

3. **Detailed Breakdown** (Expandable)
   - Step-by-step calculation explanation
   - Transaction list for each component
   - Tariff table application details

4. **Action Buttons**
   - "Guardar Cálculo" - Save calculation to database
   - "Exportar PDF" - Export calculation report (future)
   - "Ver Histórico" - View past calculations

5. **History View**
   - Table of past calculations
   - Columns: Period, ISR, IVA, Status, Date
   - Row actions: View details, Update status

**Add Route:** `/tax-calculation`

**Add to Navigation:** Fiscal dropdown → "Cálculo de Impuestos"

### 4. Validation & Testing

#### Unit Tests (if test infrastructure exists)

Create test cases for:
- ISR tariff application
- IVA balance calculation
- Accumulated totals calculation
- Edge cases (zero income, losses, etc.)

#### Manual Testing Scenarios

**Scenario 1: Simple Month**
- Income: $100,000 MXN
- Expenses: $30,000 MXN (all deductible)
- No retentions
- First month of year
- Expected: ISR and IVA amounts

**Scenario 2: With Retentions**
- Income: $50,000 MXN
- ISR retention: $5,000 MXN
- IVA retention: $800 MXN
- Verify retentions are correctly subtracted

**Scenario 3: Multiple Months**
- Calculate Jan, Feb, Mar sequentially
- Verify accumulated totals are correct
- Verify previous payments are considered

**Scenario 4: IVA in Favor**
- Expenses > Income for a month
- Verify "saldo a favor" is calculated
- Verify it's applied to next month

### 5. Verification Steps

- [ ] Run `npm run build` to ensure no compilation errors
- [ ] Test ISR calculation with sample data
- [ ] Test IVA calculation with sample data
- [ ] Verify tariff table application is correct
- [ ] Test accumulated totals across multiple months
- [ ] Verify retentions and previous payments are subtracted correctly
- [ ] Test IVA "saldo a favor" carry-forward
- [ ] Verify UI displays calculations clearly
- [ ] Test save calculation functionality
- [ ] Test calculation history retrieval

### 6. Progress Tracking

**MANDATORY:**
- Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task
- Create `PHASE_19_TAX_CALCULATION_SUMMARY.md` when finished
- Commit changes with descriptive messages
- Mark Phase 19 as completed when all tasks are done

## Technical Considerations

### Calculation Accuracy

- Use `Decimal.js` or similar library for precise decimal calculations
- Round to 2 decimal places for currency amounts
- Follow SAT rounding rules (traditional rounding)

### Performance

- Cache tariff tables (they don't change during a session)
- Optimize database queries (use indexes)
- Consider caching monthly calculations

### Error Handling

- Handle missing data gracefully
- Provide clear error messages
- Validate date ranges
- Check for future dates

### Data Integrity

- Ensure transactions are finalized before calculation
- Lock calculations once filed/paid
- Maintain audit trail of calculations

### Compliance

- Follow ISR calculation rules from LISR Art. 106
- Follow IVA calculation rules from LIVA Art. 5
- Use official SAT tariff tables
- Store calculation details for audit purposes

## ISR Tariff Tables (2025)

**Monthly Tariff Table (Provisional Payments):**

| Límite Inferior | Límite Superior | Cuota Fija | % Sobre Excedente |
|-----------------|-----------------|------------|-------------------|
| $0.01           | $746.04         | $0.00      | 1.92%            |
| $746.05         | $6,332.05       | $14.32     | 6.40%            |
| $6,332.06       | $11,128.01      | $371.83    | 10.88%           |
| $11,128.02      | $12,935.82      | $893.63    | 16.00%           |
| $12,935.83      | $15,487.71      | $1,182.88  | 17.92%           |
| $15,487.72      | $31,236.49      | $1,640.18  | 21.36%           |
| $31,236.50      | $49,233.00      | $5,004.12  | 23.52%           |
| $49,233.01      | $93,993.90      | $9,236.89  | 30.00%           |
| $93,993.91      | $125,325.20     | $22,665.17 | 32.00%           |
| $125,325.21     | $375,975.61     | $32,691.18 | 34.00%           |
| $375,975.62     | En adelante     | $117,912.32| 35.00%           |

**Note:** These are approximate values. Use official SAT tables for production.

## IVA Calculation Rules

### IVA Charged (Trasladado)
- Collected from clients on invoices
- Rate: 16% (standard), 0% (exports), Exempt
- Source: Income transactions with `iva_rate` field

### IVA Creditable (Acreditable)
- Paid to providers on expenses
- Only deductible expenses with `is_iva_deductible = 1`
- Must have CFDI to be creditable
- Source: Expense transactions with valid CFDI

### Saldo a Favor
- Occurs when IVA creditable > IVA charged
- Can be applied to next month
- Can be requested as refund (not automated)
- Carry forward until used or refunded

## Integration Points

### With Phase 17 (Income Module)
- Use `client_type`, `iva_rate`, `isr_retention`, `iva_retention` fields
- Validate all required fields are present

### With Phase 18 (CFDI Module)
- Verify transactions have linked CFDIs
- Use CFDI metadata for validation
- Only count transactions with valid CFDIs

### With Phase 16 (Granular Deductibility)
- Use `is_isr_deductible` and `is_iva_deductible` flags
- Separate ISR and IVA deductions

### With Future Phase 21 (Declarations)
- Provide data for monthly declaration forms
- Store calculation results for DIOT
- Feed into Contabilidad Electrónica

## Output Format

The calculation engine should provide:

1. **Summary** (for UI display)
2. **Detailed Breakdown** (for transparency)
3. **Transaction List** (for audit)
4. **Calculation Steps** (for user understanding)

Example output structure:
```json
{
  "summary": {
    "isr": { "toPay": 5000 },
    "iva": { "toPay": 3200 }
  },
  "details": {
    "isr": {
      "steps": [
        "1. Ingresos acumulados: $500,000",
        "2. Deducciones acumuladas: $150,000",
        "3. Base gravable: $350,000",
        "4. ISR según tarifa: $42,000",
        "5. Retenciones: $5,000",
        "6. Pagos anteriores: $32,000",
        "7. ISR a pagar: $5,000"
      ]
    }
  },
  "transactions": {
    "income": [...],
    "deductions": [...]
  }
}
```

## Next Step

Upon successful completion and verification of all Phase 19 tasks, generate and output the complete, self-contained prompt for **Phase 20: Bank Reconciliation**, following this same instructional format and referencing the updated implementation plan.

---

**Remember:** The goal is to provide Mexican taxpayers with a transparent, accurate, and easy-to-understand tax calculation system that ensures fiscal compliance while demystifying the complex tax rules.
