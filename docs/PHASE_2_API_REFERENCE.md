# Phase 2 API Reference - Fiscal & Reconciliation

## Quick Reference Guide

### New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fiscal` | GET | Enhanced fiscal calculations (monthly/quarterly/annual) |
| `/api/reconciliation` | GET | Get transaction reconciliation suggestions |
| `/api/reconciliation` | POST | Apply reconciliation actions |

---

## 1. Fiscal API

### Enhanced GET /api/fiscal

Calculate ISR and IVA for different periods.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | 'monthly' | Period type: 'monthly', 'quarterly', 'annual' |
| `month` | integer | No* | Current month | Month (1-12), required for monthly period |
| `year` | integer | No | Current year | Year (2000-2100) |
| `quarter` | integer | No* | Current quarter | Quarter (1-4), required for quarterly period |

\* Required based on period type

#### Response Format

```json
{
  "period": "monthly",
  "year": 2025,
  "month": 1,
  "totalIncome": 150000.00,
  "totalExpenses": 50000.00,
  "businessIncome": 100000.00,
  "businessExpenses": 30000.00,
  "personalExpenses": 20000.00,
  "deductibleExpenses": 25000.00,
  "deductiblePercentage": 83.33,
  "utilidad": 75000.00,
  "isr": 15432.50,
  "iva": 12000.00,
  "ivaDetails": {
    "ivaCobrado": 16000.00,
    "ivaPagado": 4000.00,
    "ivaAPagar": 12000.00,
    "ivaAFavor": 0.00,
    "rate": 16
  },
  "effectiveRate": 20.58,
  "dueDate": "2025-02-17"
}
```

#### Examples

**Monthly Calculation:**
```bash
GET /api/fiscal?period=monthly&month=1&year=2025
```

**Quarterly Calculation:**
```bash
GET /api/fiscal?period=quarterly&quarter=1&year=2025
```

**Annual Calculation:**
```bash
GET /api/fiscal?period=annual&year=2025
```

#### Error Responses

**400 Bad Request - Invalid Month:**
```json
{
  "error": "Invalid month (must be 1-12)",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request - Invalid Quarter:**
```json
{
  "error": "Invalid quarter (must be 1-4)",
  "code": "VALIDATION_ERROR"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to calculate fiscal data",
  "message": "Database query failed",
  "code": "CALCULATION_ERROR"
}
```

### ISR Calculation Details

The API uses official Mexican tax brackets for 2024:

| Income Range | Rate | Fixed Fee | Lower Limit |
|--------------|------|-----------|-------------|
| $0 - $7,735 | 1.92% | $0 | $0 |
| $7,735.01 - $65,651.07 | 6.40% | $148.51 | $7,735.00 |
| $65,651.08 - $115,375.90 | 10.88% | $3,855.14 | $65,651.07 |
| $115,375.91 - $134,119.41 | 16.00% | $9,265.20 | $115,375.90 |
| $134,119.42 - $160,577.65 | 17.92% | $12,264.16 | $134,119.41 |
| $160,577.66 - $323,862.00 | 21.36% | $17,005.47 | $160,577.65 |
| $323,862.01 - $510,451.00 | 23.52% | $51,883.01 | $323,862.00 |
| $510,451.01 - $974,535.03 | 30.00% | $95,768.74 | $510,451.00 |
| $974,535.04 - $1,299,380.04 | 32.00% | $234,993.95 | $974,535.03 |
| $1,299,380.05 - $3,898,140.12 | 34.00% | $338,944.34 | $1,299,380.04 |
| $3,898,140.13+ | 35.00% | $1,222,522.76 | $3,898,140.12 |

**Formula:** ISR = Fixed Fee + (Income - Lower Limit) × Rate

### IVA Calculation Details

**Standard Rate:** 16%

**Formula:**
```
IVA Cobrado = Business Income × 0.16
IVA Pagado = Deductible Expenses × 0.16
IVA a Pagar = max(0, IVA Cobrado - IVA Pagado)
IVA a Favor = max(0, IVA Pagado - IVA Cobrado)
```

### Due Dates

- **Monthly:** 17th of following month
- **Quarterly:** 17th of month following quarter end
  - Q1 (Jan-Mar): Due April 17
  - Q2 (Apr-Jun): Due July 17
  - Q3 (Jul-Sep): Due October 17
  - Q4 (Oct-Dec): Due January 17 (next year)
- **Annual:** April 30 of following year

---

## 2. Reconciliation API

### GET /api/reconciliation

Get suggestions for transaction matches and duplicates.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tolerance_days` | integer | No | 3 | Maximum days difference for matching |
| `tolerance_amount` | float | No | 0.01 | Maximum amount difference (as decimal, 0.01 = 1%) |
| `min_confidence` | integer | No | 70 | Minimum confidence score (0-100) |
| `limit` | integer | No | 1000 | Maximum transactions to analyze |

#### Response Format

```json
{
  "matches": [
    {
      "tx1": {
        "id": 123,
        "date": "2025-01-15",
        "description": "Transfer to savings",
        "amount": -10000.00,
        "account": "BBVA"
      },
      "tx2": {
        "id": 124,
        "date": "2025-01-15",
        "description": "Transfer from checking",
        "amount": 10000.00,
        "account": "Savings"
      },
      "amountDiff": 0.00,
      "daysDiff": 0,
      "confidence": 95.5,
      "type": "transfer"
    }
  ],
  "duplicates": [
    {
      "original": {
        "id": 125,
        "date": "2025-01-10",
        "description": "Restaurant payment",
        "amount": -500.00,
        "account": "BBVA"
      },
      "duplicates": [
        {
          "tx": {
            "id": 126,
            "date": "2025-01-10",
            "description": "Restaurant payment",
            "amount": -500.00,
            "account": "BBVA"
          },
          "similarity": 1.0,
          "hoursDiff": 0.5,
          "confidence": 98.5
        }
      ]
    }
  ],
  "stats": {
    "totalTransactions": 150,
    "totalMatches": 5,
    "totalDuplicates": 3,
    "transferCount": 10,
    "unmatchedCount": 135
  }
}
```

#### Examples

**Basic Reconciliation:**
```bash
GET /api/reconciliation
```

**Custom Tolerances:**
```bash
GET /api/reconciliation?tolerance_days=5&tolerance_amount=0.02&min_confidence=80
```

**High Confidence Only:**
```bash
GET /api/reconciliation?min_confidence=90
```

### POST /api/reconciliation

Apply reconciliation actions to transactions.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Action type: 'mark_as_transfer', 'delete_duplicates', 'link_transfers' |
| `transactionIds` | array[integer] | Yes | Array of transaction IDs to apply action to |

#### Actions

**1. mark_as_transfer**
- Updates transaction_type to 'transfer' for specified transactions
- Use for confirmed transfer matches

**2. delete_duplicates**
- Soft deletes transactions (sets is_deleted = 1)
- Use for confirmed duplicate transactions

**3. link_transfers**
- Requires exactly 2 transaction IDs
- Links transactions as a transfer pair
- Adds notes with linked transaction ID

#### Response Format

```json
{
  "success": true,
  "message": "Marked 2 transactions as transfers",
  "updatedCount": 2
}
```

#### Examples

**Mark as Transfer:**
```bash
POST /api/reconciliation
Content-Type: application/json

{
  "action": "mark_as_transfer",
  "transactionIds": [123, 124]
}
```

**Delete Duplicates:**
```bash
POST /api/reconciliation
Content-Type: application/json

{
  "action": "delete_duplicates",
  "transactionIds": [125, 126]
}
```

**Link Transfers:**
```bash
POST /api/reconciliation
Content-Type: application/json

{
  "action": "link_transfers",
  "transactionIds": [127, 128]
}
```

#### Error Responses

**400 Bad Request - Invalid Action:**
```json
{
  "error": "Invalid action. Allowed: mark_as_transfer, delete_duplicates, link_transfers",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request - Invalid Transaction IDs:**
```json
{
  "error": "Invalid request. Required: action, transactionIds (array)",
  "code": "VALIDATION_ERROR"
}
```

**400 Bad Request - Link Transfers Wrong Count:**
```json
{
  "error": "link_transfers requires exactly 2 transaction IDs",
  "code": "VALIDATION_ERROR"
}
```

---

## 3. Frontend API Functions

### New Functions in `src/utils/api.js`

#### fetchReconciliation()
```javascript
import { fetchReconciliation } from '../utils/api';

const result = await fetchReconciliation({
  tolerance_days: 3,
  tolerance_amount: 0.01,
  min_confidence: 70
});
```

#### applyReconciliation()
```javascript
import { applyReconciliation } from '../utils/api';

const result = await applyReconciliation('mark_as_transfer', [123, 124]);
```

---

## 4. Confidence Score Calculation

### Transfer Match Confidence

Base confidence: 100%

**Reductions:**
- Amount difference: -20% × (diff / tolerance)
- Date difference: -20% × (days / tolerance)

**Bonuses:**
- Description similarity: +10% × similarity
- Both marked as transfer: +10%

### Duplicate Confidence

Base confidence: 50%

**Additions:**
- Description similarity: +40% × similarity
- Time proximity: +10% × (1 - hours/tolerance)
- Same account: +20%

---

## 5. Fiscal Calculation Utilities

### Frontend Utilities in `src/utils/fiscalCalculations.js`

#### calculateISR()
```javascript
import { calculateISR } from '../utils/fiscalCalculations';

const isr = calculateISR(75000); // Returns ISR amount
```

#### calculateIVA()
```javascript
import { calculateIVA } from '../utils/fiscalCalculations';

const iva = calculateIVA(100000, 30000);
// Returns: { ivaCobrado, ivaPagado, ivaAPagar, ivaAFavor, rate }
```

#### calculateFiscalSummary()
```javascript
import { calculateFiscalSummary } from '../utils/fiscalCalculations';

const summary = calculateFiscalSummary(transactions);
// Returns complete fiscal summary
```

---

## 6. Reconciliation Utilities

### Frontend Utilities in `src/utils/reconciliation.js`

#### matchTransactions()
```javascript
import { matchTransactions } from '../utils/reconciliation';

const matches = matchTransactions(transactions, 3, 0.01);
// Returns array of matched pairs
```

#### findDuplicates()
```javascript
import { findDuplicates } from '../utils/reconciliation';

const duplicates = findDuplicates(transactions, 24);
// Returns array of duplicate groups
```

---

## 7. Database Schema Changes

No schema changes required for Phase 2. Uses existing fields:
- `transaction_type` (business/personal/transfer)
- `is_deductible` (0/1)
- `is_deleted` (0/1)
- `notes` (for linking info)

---

## 8. Performance Considerations

### Fiscal API
- Query optimized with indexes on date, category, transaction_type
- Aggregations done at database level
- Response time: <200ms for typical datasets

### Reconciliation API
- In-memory matching for best performance
- Default limit: 1000 transactions
- Response time: <2s for 1000 transactions
- Consider pagination for larger datasets

---

## 9. Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Human-readable error message",
  "message": "Technical details (optional)",
  "code": "ERROR_CODE"
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input parameters
- `DB_NOT_CONFIGURED` - Database connection issue
- `CALCULATION_ERROR` - Fiscal calculation failed
- `RECONCILIATION_ERROR` - Reconciliation processing failed

---

## 10. Best Practices

### Fiscal Calculations
1. Always specify period explicitly
2. Validate date ranges before querying
3. Cache results when appropriate
4. Use business transactions only for ISR/IVA

### Reconciliation
1. Start with high confidence threshold (>80%)
2. Review matches before applying actions
3. Test with small batches first
4. Keep backups before bulk operations
5. Re-run after applying actions to verify

---

## Support

For issues or questions:
- Check error response codes and messages
- Verify query parameters match documentation
- Review console for client-side errors
- Test API directly with curl/Postman
- Check database for data consistency
