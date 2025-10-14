# Phase 1 API Reference - Advanced Transaction Classification

## Quick Reference Guide

### New Transaction Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `transaction_type` | TEXT | No | 'personal' | Classification: 'business', 'personal', or 'transfer' |
| `category_id` | INTEGER | No | null | Foreign key to categories table |
| `linked_invoice_id` | INTEGER | No | null | Foreign key to invoices table |
| `notes` | TEXT | No | null | Additional notes (max 1000 chars) |
| `is_deleted` | INTEGER | No | 0 | Soft delete flag (0 = active, 1 = deleted) |

---

## API Endpoints

### 1. POST /api/transactions
Create a new transaction with advanced classification.

**Request Body:**
```json
{
  "date": "2025-10-14",
  "description": "Consultoría cliente ABC",
  "amount": 10000,
  "type": "ingreso",
  "category": "avanta",
  "transaction_type": "business",
  "category_id": 1,
  "linked_invoice_id": 5,
  "notes": "Proyecto de desarrollo web para cliente corporativo"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": 123,
    "date": "2025-10-14",
    "description": "Consultoría cliente ABC",
    "amount": 10000,
    "type": "ingreso",
    "category": "avanta",
    "transaction_type": "business",
    "category_id": 1,
    "linked_invoice_id": 5,
    "notes": "Proyecto de desarrollo web para cliente corporativo",
    "is_deleted": 0,
    "created_at": "2025-10-14T21:00:00Z"
  },
  "message": "Transaction created successfully"
}
```

---

### 2. GET /api/transactions
List transactions with advanced filtering.

**New Query Parameters:**
- `transaction_type` - Filter by classification (business/personal/transfer)
- `category_id` - Filter by category ID
- `linked_invoice_id` - Filter by linked invoice ID
- `include_deleted` - Include soft-deleted transactions (default: false)

**Example:**
```
GET /api/transactions?transaction_type=business&include_stats=true
```

**Response:** 200 OK
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 25,
    "has_more": false
  },
  "filters": {
    "transaction_type": "business",
    "category": null,
    "type": null,
    ...
  },
  "statistics": {
    "total_transactions": 25,
    "total_income": 50000,
    "total_expenses": 15000,
    "net": 35000
  }
}
```

---

### 3. PATCH /api/transactions/:id
Partially update a transaction (same as PUT).

**Request Body:**
```json
{
  "transaction_type": "business",
  "notes": "Updated classification"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": { ... },
  "message": "Transaction updated successfully"
}
```

---

### 4. DELETE /api/transactions/:id
Soft delete a transaction (default) or permanently delete.

**Soft Delete (Default):**
```
DELETE /api/transactions/123?confirm=true
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Transaction soft deleted successfully",
  "data": {
    "id": 123,
    "is_deleted": 1,
    ...
  }
}
```

**Hard Delete (Permanent):**
```
DELETE /api/transactions/123?confirm=true&permanent=true
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Transaction permanently deleted",
  "deleted": { ... }
}
```

---

### 5. POST /api/transactions/:id/restore
Restore a soft-deleted transaction.

**Request:**
```
POST /api/transactions/123/restore
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Transaction restored successfully",
  "data": {
    "id": 123,
    "is_deleted": 0,
    ...
  }
}
```

**Error (not deleted):** 400 Bad Request
```json
{
  "error": "Transaction is not deleted",
  "code": "NOT_DELETED",
  "message": "This transaction has not been deleted and does not need restoration"
}
```

---

## Validation Rules

### transaction_type
- Must be one of: 'business', 'personal', 'transfer'
- Default: 'personal'
- Optional field

### category_id
- Must be a positive integer
- Should reference existing category in categories table
- Validated at application level (not database constraint)
- Optional field

### linked_invoice_id
- Must be a positive integer
- Should reference existing invoice in invoices table
- Validated at application level (not database constraint)
- Optional field

### notes
- Maximum length: 1000 characters
- Trimmed and sanitized
- Optional field

### is_deleted
- Integer: 0 (active) or 1 (deleted)
- Default: 0
- Set automatically by DELETE endpoint
- Can be queried with include_deleted=true

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid field value or format |
| INVALID_ID | 400 | Invalid transaction ID format |
| NOT_FOUND | 404 | Transaction not found |
| NOT_DELETED | 400 | Trying to restore non-deleted transaction |
| CONFIRMATION_REQUIRED | 400 | Delete requires confirm=true |
| DB_NOT_CONFIGURED | 503 | Database connection unavailable |
| INTERNAL_ERROR | 500 | Server error |

---

## Frontend Integration

### Transaction Type Icons
- 💼 **Business** - Purple badge
- 🔄 **Transfer** - Yellow badge  
- 👤 **Personal** - Gray badge

### Additional Indicators
- 📄 **Linked Invoice** - Indicates transaction has linked CFDI
- 📝 **Notes** - Indicates transaction has notes (hover for details)

### Form Fields

**Transaction Type Selector:**
```jsx
<select name="transaction_type">
  <option value="personal">Personal</option>
  <option value="business">Negocio</option>
  <option value="transfer">Transferencia</option>
</select>
```

**Category Selector:**
```jsx
<select name="category_id">
  <option value="">Sin categoría</option>
  {categories.map(cat => (
    <option value={cat.id}>{cat.name}</option>
  ))}
</select>
```

**Invoice Selector:**
```jsx
<select name="linked_invoice_id">
  <option value="">Sin factura</option>
  {invoices.map(inv => (
    <option value={inv.id}>
      {inv.uuid.substring(0,8)}... - ${inv.total}
    </option>
  ))}
</select>
```

**Notes Input:**
```jsx
<textarea 
  name="notes" 
  maxLength="1000"
  placeholder="Notas adicionales..."
/>
<p>{notes.length}/1000 caracteres</p>
```

---

## Migration Script

To apply the schema changes to an existing database:

```bash
# Development/Local
wrangler d1 execute avanta-finance --local \
  --file=migrations/002_add_advanced_transaction_classification.sql

# Production
wrangler d1 execute avanta-finance \
  --file=migrations/002_add_advanced_transaction_classification.sql
```

The migration will:
1. Add 5 new columns to transactions table
2. Create indexes for new fields
3. Set default values for existing records
4. Map existing categories to transaction_types

---

## Backward Compatibility

All new fields are **optional** and have sensible defaults:
- Existing API calls work without changes
- Old transactions auto-populated with defaults
- No breaking changes to existing functionality

**Example - Old API call still works:**
```bash
curl -X POST /api/transactions \
  -d '{"date":"2025-10-14","description":"Test","amount":100,"type":"gasto","category":"personal"}'
```

Result: Transaction created with defaults:
- transaction_type = "personal"
- category_id = null
- linked_invoice_id = null
- notes = null
- is_deleted = 0

---

## Performance Considerations

### Indexes Created
- `idx_transactions_transaction_type` - For filtering by classification
- `idx_transactions_is_deleted` - For filtering active transactions
- `idx_transactions_category_id` - For category lookups
- `idx_transactions_linked_invoice_id` - For invoice relationships

### Query Optimization
- Soft-deleted transactions filtered by default (uses index)
- New filters use indexed columns for fast lookups
- Statistics queries exclude deleted transactions automatically

---

## Best Practices

### When to Use transaction_type
- **business**: Income or expenses related to professional services
- **personal**: Personal income or expenses
- **transfer**: Money moved between accounts (not income/expense)

### When to Link Invoices
- Link transactions to CFDIs when available
- Helps with fiscal compliance and reconciliation
- Use for both issued and received invoices

### When to Add Notes
- Document special circumstances
- Add context for unusual transactions
- Link to external references or documents
- Track follow-up items

### Soft Delete vs Hard Delete
- **Soft Delete** (default): Preserves data for audit trail
- **Hard Delete**: Permanent removal, use sparingly
- Always provide restore option for soft-deleted items

---

## Examples

### Create Business Expense with Invoice
```bash
curl -X POST /api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Servicio de hosting AWS",
    "amount": 2500,
    "type": "gasto",
    "category": "avanta",
    "transaction_type": "business",
    "category_id": 3,
    "linked_invoice_id": 42,
    "notes": "Factura mensual AWS - Proyecto X",
    "is_deductible": true
  }'
```

### Filter Business Transactions This Month
```bash
curl "http://localhost:8788/api/transactions?transaction_type=business&date_from=2025-10-01&date_to=2025-10-31&include_stats=true"
```

### Update Transaction Classification
```bash
curl -X PATCH /api/transactions/123 \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "business",
    "category_id": 5,
    "notes": "Reclasificado como gasto de negocio"
  }'
```

### Safe Delete and Restore
```bash
# Soft delete
curl -X DELETE "/api/transactions/123?confirm=true"

# View deleted transactions
curl "/api/transactions?include_deleted=true"

# Restore
curl -X POST "/api/transactions/123/restore"
```

---

## Support

For issues or questions:
- Check PHASE_1_TESTING.md for comprehensive test cases
- Review error responses for validation details
- Ensure database migration completed successfully
- Verify frontend is built with latest changes
