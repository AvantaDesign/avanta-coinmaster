# Phase 3 Testing Guide - Automation and Accounts Receivable/Payable

This guide provides step-by-step instructions for testing Phase 3 features.

---

## Prerequisites

1. **Database Migration Applied:**
   ```bash
   wrangler d1 execute avanta-finance --file=migrations/003_add_automation_and_ar_ap.sql
   ```

2. **Application Built and Running:**
   ```bash
   npm run build
   # For local testing with backend:
   npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
   ```

3. **Navigate to:** `http://localhost:8788` or your production URL

---

## Test Suite 1: Accounts Receivable

### 1.1 Create New Receivable
1. Click "Automatización" in the nav menu
2. Click "Cuentas por Cobrar" button
3. Click "+ Nueva Cuenta por Cobrar"
4. Fill in the form:
   - **Cliente:** Test Cliente ABC
   - **RFC:** ABC123456T78
   - **Número de Factura:** FAC-001
   - **Monto:** 10000.00
   - **Fecha de Factura:** Today's date
   - **Fecha de Vencimiento:** 30 days from today
   - **Términos de Pago:** 30
   - **Notas:** Test receivable
5. Click "Guardar"
6. **Expected:** Receivable appears in list with "pending" status

### 1.2 View Aging Report
1. Click "Antigüedad" tab
2. **Expected:** 
   - Receivable appears in "Al Corriente" bucket
   - Total shows $10,000.00
   - Count shows 1 factura

### 1.3 View Metrics
1. Click "Métricas" tab
2. **Expected:**
   - Total Facturado shows $10,000.00
   - Total Cobrado shows $0.00
   - Total Pendiente shows $10,000.00
   - Tasa de Cobranza shows 0%

### 1.4 Record Payment
1. Click "Lista" tab
2. Click the 💰 icon on the test receivable
3. Fill in payment form:
   - **Monto Pagado:** 5000.00
   - **Fecha de Pago:** Today
   - **Método de Pago:** Transferencia
   - **Referencia:** REF-001
4. Click "Guardar Pago"
5. **Expected:** 
   - Status changes to "partial"
   - Amount Paid shows $5,000.00
   - Pendiente shows $5,000.00

### 1.5 Complete Payment
1. Click 💰 again
2. Enter remaining amount: 5000.00
3. Click "Guardar Pago"
4. **Expected:**
   - Status changes to "paid"
   - Amount Paid shows $10,000.00
   - Pendiente shows $0.00

### 1.6 Filter by Status
1. Click "Pagadas" filter button
2. **Expected:** Shows the paid receivable
3. Click "Pendientes" filter button
4. **Expected:** Shows no receivables

---

## Test Suite 2: Accounts Payable

### 2.1 Create New Payable
1. Navigate to "Automatización" → "Cuentas por Pagar"
2. Click "+ Nueva Cuenta por Pagar"
3. Fill in the form:
   - **Proveedor:** Proveedor XYZ
   - **RFC:** XYZ987654T32
   - **Número de Factura:** BILL-001
   - **Monto:** 8000.00
   - **Fecha de Factura:** Today's date
   - **Fecha de Vencimiento:** 7 days from today
   - **Términos de Pago:** 7
   - **Categoría:** Servicios
   - **Notas:** Test payable
4. Click "Guardar"
5. **Expected:** Payable appears in list with "pending" status

### 2.2 View Payment Schedule
1. Click "Calendario de Pagos" tab
2. **Expected:**
   - Payable appears in "Esta Semana" bucket
   - Total shows $8,000.00
   - Count shows 1 pago

### 2.3 View Vendor Summary
1. Click "Proveedores" tab
2. **Expected:**
   - Shows "Proveedor XYZ"
   - Total Facturado: $8,000.00
   - Total Pagado: $0.00
   - Pendiente: $8,000.00
   - Facturas: 1

### 2.4 Record Payment
1. Click "Lista" tab
2. Click 💰 icon
3. Fill in payment form:
   - **Monto Pagado:** 8000.00
   - **Fecha de Pago:** Today
   - **Método de Pago:** Transferencia
4. Click "Guardar Pago"
5. **Expected:**
   - Status changes to "paid"
   - Amount Paid shows $8,000.00

---

## Test Suite 3: Invoice Automation

### 3.1 Create Recurring Invoice Rule
1. Navigate to "Automatización" → "Automatizar Facturas"
2. Click "+ Nueva Regla"
3. Fill in the form:
   - **Nombre de la Regla:** Factura Mensual Cliente ABC
   - **Cliente:** Cliente ABC
   - **RFC:** ABC123456T78
   - **Monto:** 5000.00
   - **Frecuencia:** Mensual
   - **Fecha de Inicio:** First day of next month
   - **Descripción:** Factura recurrente de mantenimiento
   - **Activar regla:** Checked
4. Click "Guardar Regla"
5. **Expected:**
   - Rule appears in list with "Activa" badge
   - Shows frequency as "monthly"
   - Shows next generation date

### 3.2 Pause Rule
1. Click "Pausar" button on the rule
2. **Expected:**
   - Badge changes to "Inactiva"
   - Button changes to "Activar"

### 3.3 Activate Rule
1. Click "Activar" button
2. **Expected:**
   - Badge changes to "Activa"
   - Button changes to "Pausar"

### 3.4 Delete Rule
1. Click "Eliminar" button
2. Confirm deletion
3. **Expected:** Rule is removed from list

---

## Test Suite 4: Financial Dashboard

### 4.1 View Dashboard
1. Navigate to "Automatización" (main dashboard)
2. **Expected:**
   - Financial Health Score displays (0-100)
   - Health level shows (excellent/good/fair/poor)
   - Key metrics show outstanding AR/AP

### 4.2 View Automated Alerts
1. Look at alerts section
2. **Expected:**
   - If you have overdue receivables: Shows critical alert
   - If you have urgent payables: Shows warning alert
   - Each alert has icon, title, message

### 4.3 View Cash Flow Forecast
1. Scroll to "Pronóstico de Flujo de Efectivo"
2. **Expected:**
   - Table shows dates with expected inflows/outflows
   - Running balance calculated
   - Negative balances highlighted in red

### 4.4 Change Forecast Period
1. Select "60 días" from dropdown
2. **Expected:** Table updates to show 60-day forecast

### 4.5 View Automation Status
1. Scroll to "Estado de Automatización"
2. **Expected:**
   - Shows count of active rules
   - Shows count of recurring invoices
   - Shows count of reminders
   - Shows rules to run today

---

## Test Suite 5: Integration Tests

### 5.1 Create Receivable and Check Dashboard
1. Create a new receivable with due date in 3 days
2. Navigate to Financial Dashboard
3. **Expected:**
   - Outstanding receivables metric increases
   - Alert may appear if amount is significant
   - Cash flow forecast includes the receivable

### 5.2 Create Payable and Check Alerts
1. Create a new payable with due date in 2 days
2. Navigate to Financial Dashboard
3. **Expected:**
   - "Pagos Urgentes" alert appears
   - Outstanding payables metric increases
   - Cash flow forecast includes the payable

### 5.3 Check Home Page Integration
1. Navigate to Home page (/)
2. **Expected:**
   - "Automatización" card is visible with gradient background
   - 4 buttons link to automation features
   - All buttons are clickable and navigate correctly

### 5.4 Navigation Test
1. Test all navigation links work:
   - Home → Automatización (Dashboard)
   - Dashboard → Cuentas por Cobrar
   - Cuentas por Cobrar → Cuentas por Pagar
   - Cuentas por Pagar → Automatizar Facturas
   - Back to Home
2. **Expected:** All navigation works smoothly

---

## Test Suite 6: Edge Cases

### 6.1 Overdue Receivable
1. Create receivable with due date in the past
2. **Expected:**
   - Status shows as "overdue"
   - Appears in aging report under appropriate bucket
   - Shows in "Requieren Atención" with high priority

### 6.2 Partial Payment Greater Than Amount
1. Create receivable for $1000
2. Try to record payment of $1500
3. **Expected:** System should handle gracefully

### 6.3 Empty States
1. Delete all receivables
2. View each tab
3. **Expected:** Shows helpful "No hay cuentas por cobrar" message

### 6.4 Filter Combinations
1. Create multiple receivables with different statuses
2. Test each filter (Todas, Pendientes, Vencidas, Pagadas)
3. **Expected:** Filters work correctly

---

## Test Suite 7: Performance Tests

### 7.1 Multiple Receivables
1. Create 20+ receivables
2. Navigate through tabs
3. **Expected:**
   - Page loads quickly (<500ms)
   - Calculations complete fast
   - No lag in UI

### 7.2 Aging Report with Many Items
1. Create receivables across all aging buckets
2. View aging report
3. **Expected:**
   - Calculations accurate
   - Display responsive
   - Totals correct

---

## Test Suite 8: API Tests (Optional)

### 8.1 Receivables API
```bash
# List all receivables
curl http://localhost:8788/api/receivables

# Filter by status
curl http://localhost:8788/api/receivables?status=pending

# Get specific receivable
curl http://localhost:8788/api/receivables?id=1
```

### 8.2 Payables API
```bash
# List all payables
curl http://localhost:8788/api/payables

# Filter overdue
curl http://localhost:8788/api/payables?overdue=true
```

### 8.3 Automation API
```bash
# List automation rules
curl http://localhost:8788/api/automation

# Filter active rules
curl http://localhost:8788/api/automation?is_active=true
```

---

## Known Issues & Limitations

None identified during implementation.

---

## Success Criteria

✅ All receivables features working
✅ All payables features working
✅ Automation rules CRUD functional
✅ Dashboard displays correctly
✅ Cash flow forecast accurate
✅ Alerts generate appropriately
✅ Navigation works smoothly
✅ No console errors
✅ Build completes successfully
✅ Performance acceptable

---

## Troubleshooting

### Issue: "Database not available" error
**Solution:** Ensure migration has been applied and D1 binding is configured

### Issue: Components not rendering
**Solution:** Check browser console for import errors, verify build completed successfully

### Issue: API calls failing
**Solution:** Verify Wrangler dev server is running with correct bindings

### Issue: Calculations incorrect
**Solution:** Check that receivables/payables have correct amounts and dates

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Fix any identified issues
3. ✅ Deploy to production
4. ✅ Monitor for errors
5. ✅ Collect user feedback
6. ✅ Plan Phase 4 features

---

**Testing Completed By:** _________________
**Date:** _________________
**Status:** ✅ PASS / ❌ FAIL
**Notes:** _________________________________
