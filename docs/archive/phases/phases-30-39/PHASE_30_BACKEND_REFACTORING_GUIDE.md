# Phase 30: Backend API Refactoring Guide

## Overview

This document provides a comprehensive guide for refactoring all backend API functions to handle monetary values stored as INTEGER cents in the database.

## Completed Files

✅ **functions/utils/monetary.js** - Utility functions for conversion
✅ **functions/api/transactions.js** - Full refactoring (GET, POST, PUT)
✅ **functions/api/accounts.js** - Full refactoring (GET, POST, PUT)

## Files Requiring Refactoring

The following API files contain monetary values and need to be updated:

### High Priority (Core Financial Operations)
- [ ] functions/api/invoices.js - subtotal, iva, total
- [ ] functions/api/budgets.js - amount
- [ ] functions/api/dashboard.js - various aggregated amounts
- [ ] functions/api/fiscal.js - tax calculations
- [ ] functions/api/fiscal-analytics.js - various amounts
- [ ] functions/api/tax-calculations.js - tax amounts

### Medium Priority (Supporting Operations)
- [ ] functions/api/receivables.js - amount, amount_paid
- [ ] functions/api/payables.js - amount, amount_paid
- [ ] functions/api/credits.js - credit_limit
- [ ] functions/api/debts.js - principal_amount, current_balance, monthly_payment
- [ ] functions/api/investments.js - purchase_amount, current_value, current_price_per_unit
- [ ] functions/api/savings-goals.js - target_amount, current_amount
- [ ] functions/api/recurring-freelancers.js - amount
- [ ] functions/api/recurring-services.js - amount

### Lower Priority (Advanced Features)
- [ ] functions/api/cfdi-management.js - total_amount, subtotal, iva_amount
- [ ] functions/api/bank-reconciliation.js - amount, balance
- [ ] functions/api/sat-declarations.js - various amounts
- [ ] functions/api/annual-declarations.js - various amounts
- [ ] functions/api/reports.js - various aggregated amounts
- [ ] functions/api/cash-flow-projection.js - projected amounts

## Refactoring Pattern

### Step 1: Add Imports

```javascript
import { getUserIdFromToken } from './auth.js';
import { 
  toCents, 
  fromCents, 
  convertArrayFromCents, 
  convertObjectFromCents, 
  MONETARY_FIELDS 
} from '../utils/monetary.js';
```

### Step 2: Convert Incoming Data (POST/PUT handlers)

When receiving monetary values from the API:

```javascript
// OLD CODE:
const amount = parseFloat(data.amount);
const balance = parseFloat(data.balance);

// NEW CODE:
const amountInCents = toCents(parseFloat(data.amount));
const balanceInCents = toCents(parseFloat(data.balance));
```

Then use `amountInCents` and `balanceInCents` in INSERT/UPDATE statements.

### Step 3: Convert Outgoing Data (GET handlers)

When returning data from the database:

```javascript
// For arrays (list endpoints):
const result = await env.DB.prepare(query).bind(...params).all();
const convertedResults = convertArrayFromCents(
  result.results || [], 
  MONETARY_FIELDS.INVOICES  // Use appropriate field list
);
return new Response(JSON.stringify(convertedResults), { headers: corsHeaders });

// For single objects:
const invoice = await env.DB.prepare(query).bind(id).first();
const convertedInvoice = convertObjectFromCents(
  invoice, 
  MONETARY_FIELDS.INVOICES
);
return new Response(JSON.stringify(convertedInvoice), { headers: corsHeaders });
```

### Step 4: Convert Aggregations (SUM, AVG, etc.)

When returning calculated/aggregated amounts:

```javascript
// OLD CODE:
const stats = {
  total_income: result.total_income || 0,
  total_expenses: result.total_expenses || 0,
  balance: result.balance || 0
};

// NEW CODE:
const stats = {
  total_income: fromCents(result.total_income || 0),
  total_expenses: fromCents(result.total_expenses || 0),
  balance: fromCents(result.balance || 0)
};
```

### Step 5: Convert Filters (WHERE clauses)

When filtering by amount:

```javascript
// OLD CODE:
if (amountMin) {
  query += ' AND amount >= ?';
  params.push(parseFloat(amountMin));
}

// NEW CODE:
if (amountMin) {
  query += ' AND amount >= ?';
  params.push(toCents(parseFloat(amountMin)));
}
```

## Complete Example: invoices.js

```javascript
// Invoices API - CFDI invoice management
// Phase 30: Monetary values stored as INTEGER cents in database

import { getUserIdFromToken } from './auth.js';
import { 
  toCents, 
  fromCents, 
  convertArrayFromCents, 
  convertObjectFromCents, 
  MONETARY_FIELDS 
} from '../utils/monetary.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const result = await env.DB.prepare(
      'SELECT * FROM invoices WHERE user_id = ? ORDER BY date DESC'
    ).bind(userId).all();

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedResults = convertArrayFromCents(
      result.results || [], 
      MONETARY_FIELDS.INVOICES  // ['subtotal', 'iva', 'total']
    );

    return new Response(JSON.stringify(convertedResults), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url } = data;

    // Validate required fields
    if (!uuid || !rfc_emisor || !rfc_receptor || !date || 
        subtotal === undefined || iva === undefined || total === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 30: Convert monetary values to cents before storing
    const subtotalInCents = toCents(parseFloat(subtotal));
    const ivaInCents = toCents(parseFloat(iva));
    const totalInCents = toCents(parseFloat(total));

    const result = await env.DB.prepare(
      `INSERT INTO invoices (user_id, uuid, rfc_emisor, rfc_receptor, date, 
       subtotal, iva, total, xml_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    ).bind(
      userId, uuid, rfc_emisor, rfc_receptor, date,
      subtotalInCents,  // Stored as cents
      ivaInCents,       // Stored as cents
      totalInCents,     // Stored as cents
      xml_url
    ).run();

    // Fetch the created invoice
    const created = await env.DB.prepare(
      'SELECT * FROM invoices WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Phase 30: Convert back to decimal for response
    const convertedInvoice = convertObjectFromCents(
      created, 
      MONETARY_FIELDS.INVOICES
    );

    return new Response(JSON.stringify({
      success: true,
      data: convertedInvoice
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
```

## Field Mapping Reference

Use the appropriate field list from `MONETARY_FIELDS` constant:

```javascript
MONETARY_FIELDS.TRANSACTIONS     // ['amount']
MONETARY_FIELDS.ACCOUNTS         // ['balance']
MONETARY_FIELDS.INVOICES         // ['subtotal', 'iva', 'total']
MONETARY_FIELDS.FISCAL_PAYMENTS  // ['isr', 'iva']
MONETARY_FIELDS.CREDITS          // ['credit_limit']
MONETARY_FIELDS.CREDIT_MOVEMENTS // ['amount']
MONETARY_FIELDS.BUDGETS          // ['amount']
MONETARY_FIELDS.RECEIVABLES      // ['amount', 'amount_paid']
MONETARY_FIELDS.PAYABLES         // ['amount', 'amount_paid']
MONETARY_FIELDS.DEBTS            // ['principal_amount', 'current_balance', 'monthly_payment']
MONETARY_FIELDS.INVESTMENTS      // ['purchase_amount', 'current_value', 'current_price_per_unit']
MONETARY_FIELDS.SAVINGS_GOALS    // ['target_amount', 'current_amount']
MONETARY_FIELDS.PAYMENTS         // ['amount']
MONETARY_FIELDS.SCHEDULES        // ['amount']
```

## Testing Checklist

After refactoring each API file:

- [ ] Build succeeds: `npm run build`
- [ ] API returns values in decimal format (e.g., "100.50")
- [ ] API accepts values in decimal format
- [ ] Aggregations (SUM, AVG) are converted correctly
- [ ] Filters by amount work correctly
- [ ] Statistics/calculations are accurate
- [ ] No floating-point errors in calculations

## Common Pitfalls

1. **Forgetting to convert aggregations**: SUM() and AVG() return cents, must convert to decimal
2. **Forgetting to convert filters**: WHERE amount >= ? needs cents value
3. **Missing field in conversion**: Add new monetary fields to MONETARY_FIELDS constant
4. **Not handling NULL values**: toCents and fromCents handle NULL correctly, but check for undefined
5. **Percentage fields**: Do NOT convert percentages (interest_rate, iva_rate, etc.) - keep as REAL

## Decimal.js for Complex Calculations

Some files already use Decimal.js for calculations. Continue using it, but ensure:
- Input from DB is converted: `new Decimal(cents).div(100)`
- Output to DB is converted: `decimal.mul(100).round().toNumber()`

Example from fiscal.js:
```javascript
import Decimal from 'decimal.js';

// Reading from DB
const amount = fromCentsToDecimal(transaction.amount);  // Returns Decimal object
const tax = amount.mul(0.16);  // Calculate 16% IVA

// Writing to DB
const taxInCents = tax.mul(100).round().toNumber();
await env.DB.prepare('INSERT INTO ... VALUES (?)').bind(taxInCents).run();
```

## Migration Application

Before deploying backend changes:

1. **Run the migration**:
   ```bash
   wrangler d1 execute avanta-coinmaster --file=migrations/033_fix_monetary_data_types.sql
   ```

2. **Verify data conversion**:
   ```bash
   wrangler d1 execute avanta-coinmaster --command="SELECT id, amount, description FROM transactions LIMIT 5"
   ```

3. **Check that amounts are integers** (cents):
   - Old: amount = 100.50 (REAL)
   - New: amount = 10050 (INTEGER)

## Next Steps

1. Prioritize refactoring files in order listed above
2. Test each file individually after refactoring
3. Run integration tests for financial calculations
4. Update frontend if it performs any client-side calculations
5. Verify all reports and dashboards display correctly

## Questions?

Refer to:
- `functions/utils/monetary.js` - Utility function implementations
- `functions/api/transactions.js` - Complete working example
- `functions/api/accounts.js` - Another working example
- `migrations/033_fix_monetary_data_types.sql` - Database schema changes
