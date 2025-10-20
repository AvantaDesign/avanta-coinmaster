# Phase 18: CFDI Control & Validation Module
Project Context
You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at D:\AVANTA DESIGN CODE\avanta-coinmaster.

## Implementation Plan Reference
CRITICAL: Always refer to the master implementation plan at IMPLEMENTATION_PLAN_V7.md for complete project context and progress tracking. This file contains:
✅ Phase 1-17: COMPLETED (Comprehensive financial management system including Income Module)
🚧 Phase 18: CURRENT PHASE (CFDI Control & Validation Module)
📋 Phases 19-29: Future phases

IMPORTANT: You must update the IMPLEMENTATION_PLAN_V7.md file with your progress as you complete each task.

## Current Task: Phase 18 - CFDI Control & Validation Module

### Goal
Build a system to manage, parse, and validate CFDI XML files, linking them directly to transactions for complete fiscal compliance tracking.

### Context from Previous Phase
Phase 17 successfully implemented:
- ✅ Income module with 12 fiscal fields (client_type, client_rfc, currency, exchange_rate, payment_method, iva_rate, isr/iva_retention, cfdi_uuid, issue_date, payment_date, economic_activity_code)
- ✅ SAT accounts catalog table (Anexo 24 with hierarchical structure)
- ✅ UMA 2025 values in fiscal_parameters
- ✅ Enhanced transaction API with comprehensive validation
- ✅ Income form with conditional fields for nacional/extranjero clients
- ✅ Fiscal configuration page with UMA display and SAT catalog browser

The transactions table now has a `cfdi_uuid` field that can be used to link CFDIs.

## Actionable Steps:

### 1. Database Schema - CFDI Metadata

**Create Migration:** `migrations/025_add_cfdi_control.sql`

**Create `cfdi_metadata` table:**
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (TEXT, FK to users)
- uuid (TEXT, UNIQUE) -- Folio Fiscal
- tipo (TEXT) -- 'emitido' or 'recibido'
- rfc_emisor (TEXT)
- nombre_emisor (TEXT)
- rfc_receptor (TEXT)
- nombre_receptor (TEXT)
- fecha (DATE)
- forma_pago (TEXT) -- 01=Efectivo, 03=Transferencia, etc.
- metodo_pago (TEXT) -- PUE or PPD
- moneda (TEXT) -- MXN, USD, etc.
- tipo_cambio (DECIMAL)
- subtotal (DECIMAL)
- descuento (DECIMAL)
- iva (DECIMAL)
- retencion_isr (DECIMAL)
- retencion_iva (DECIMAL)
- total (DECIMAL)
- uso_cfdi (TEXT) -- Clave uso CFDI (G01, G03, etc.)
- lugar_expedicion (TEXT) -- Código postal
- regimen_fiscal (TEXT) -- Clave régimen fiscal
- conceptos (TEXT) -- JSON array of line items
- xml_content (TEXT) -- Complete XML content
- xml_url (TEXT) -- R2 storage URL
- status (TEXT) -- 'pending_validation', 'valid', 'invalid_rfc', 'canceled', 'error'
- validation_errors (TEXT) -- JSON array of validation errors
- linked_transaction_id (INTEGER, FK to transactions)
- auto_matched (INTEGER) -- Boolean, was it auto-matched?
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- validated_at (TIMESTAMP)
```

**Indexes:**
- Index on uuid (for lookups)
- Index on user_id (multi-tenancy)
- Index on tipo (filter emitidos/recibidos)
- Index on status (filter by validation status)
- Index on linked_transaction_id (find CFDIs for transaction)
- Index on fecha (date range queries)

### 2. Backend API Development

**Create `functions/api/cfdi.js`:**

**GET /api/cfdi** - List CFDIs
- Query params: tipo (emitido/recibido), status, date_from, date_to, page, perPage
- Return paginated list with metadata
- Include linked transaction info if available

**GET /api/cfdi/:id** - Get single CFDI with full details
- Return all metadata fields
- Include linked transaction if exists
- Include validation errors if any

**POST /api/cfdi/upload** - Upload CFDI XML
- Accept multipart/form-data with XML file
- Parse XML to extract all required fields
- Validate XML structure (use XML parser library)
- Store XML content in database
- Optionally upload XML to R2 storage
- Set initial status to 'pending_validation'
- Return parsed metadata

**POST /api/cfdi/validate/:id** - Validate CFDI
- Validate RFC receptor matches user's RFC
- Validate XML structure integrity
- Check for duplicate UUID in database
- Validate fecha is reasonable (not future, not too old)
- Validate totals match (subtotal - descuento + iva = total)
- Update status based on validation results
- Return validation report

**POST /api/cfdi/link/:id** - Link CFDI to transaction
- Body: { transaction_id: number }
- Verify both CFDI and transaction belong to user
- Update cfdi_metadata.linked_transaction_id
- Update transactions.cfdi_uuid with CFDI's UUID
- Return updated records

**POST /api/cfdi/auto-match** - Auto-match CFDIs to transactions
- Find unlinked CFDIs
- For each CFDI, search transactions by:
  - Amount match (within tolerance)
  - Date proximity (±7 days)
  - Description similarity (optional)
- Return suggested matches
- Allow user to accept/reject suggestions

**DELETE /api/cfdi/:id** - Soft delete CFDI
- Set status to 'deleted' or remove record
- Unlink from transaction if linked

### 3. Frontend UI - CFDI Management

**Create `src/components/CFDIManager.jsx`:**

**Main UI Structure:**
- Tabs: "CFDIs Emitidos" | "CFDIs Recibidos" | "Cargar CFDI"
- Filters: Status, Date range, Search by UUID/RFC
- Statistics cards: Total CFDIs, Valid, Pending, Errors

**Upload Section:**
```jsx
- Drag & drop area for XML files
- Or file picker button
- Multiple file upload support
- Progress indicator during upload
- Success/error messages
- Auto-redirect to validation after upload
```

**CFDI List View:**
```jsx
Table columns:
- UUID (first 8 chars... expandable)
- RFC Emisor/Receptor (depending on tipo)
- Nombre
- Fecha
- Total (formatted currency)
- Status (color-coded badge)
- Linked Transaction (link icon if linked)
- Actions (View, Validate, Link, Delete)

Status colors:
- pending_validation: Yellow
- valid: Green
- invalid_rfc: Red
- canceled: Gray
- error: Red
```

**CFDI Detail Modal:**
```jsx
- Full UUID
- Complete issuer/receiver info
- Breakdown: Subtotal, Discount, IVA, Retentions, Total
- Conceptos list (line items)
- Validation status and errors
- Link to transaction button
- View XML button
- Download XML button
```

**Validation Results Display:**
```jsx
- Checkmarks for passed validations
- Error messages for failed validations
- Overall status indicator
- Suggestions to fix issues
```

**Link to Transaction UI:**
```jsx
- Search/filter transactions
- Show suggested matches (auto-match results)
- Match indicators:
  - Amount match: ✓ or percentage difference
  - Date proximity: ✓ or days difference
  - Already has CFDI: Warning
- One-click link button
- Confirmation dialog
```

**Auto-Match Suggestions:**
```jsx
- Card for each suggested match
- Show CFDI info on left
- Show transaction info on right
- Match confidence score (%)
- Accept/Reject buttons
- "Review all" option
```

### 4. XML Parsing Logic

**Create `src/utils/cfdiParser.js`:**

```javascript
/**
 * Parse CFDI XML to extract metadata
 * @param {string} xmlContent - XML string
 * @returns {Object} Parsed CFDI data
 */
function parseCFDI(xmlContent) {
  // Use DOMParser or xml2js library
  // Extract all required fields from XML namespaces
  // Handle CFDI 3.3 and 4.0 versions
  // Return structured object
}
```

**Key XML paths to extract:**
- //cfdi:Comprobante/@Folio
- //cfdi:Comprobante/@Serie
- //cfdi:Comprobante/@Fecha
- //cfdi:Comprobante/@Total
- //cfdi:Comprobante/@SubTotal
- //cfdi:Emisor/@Rfc
- //cfdi:Emisor/@Nombre
- //cfdi:Receptor/@Rfc
- //cfdi:Receptor/@Nombre
- //cfdi:Conceptos/cfdi:Concepto (all)
- //tfd:TimbreFiscalDigital/@UUID

### 5. Validation Logic

**Create `src/utils/cfdiValidator.js`:**

```javascript
/**
 * Validate CFDI data
 * @param {Object} cfdiData - Parsed CFDI
 * @param {string} userRFC - User's RFC
 * @returns {Object} Validation result
 */
function validateCFDI(cfdiData, userRFC) {
  const errors = [];
  
  // 1. RFC validation
  if (cfdiData.tipo === 'recibido') {
    if (cfdiData.rfc_receptor !== userRFC) {
      errors.push('RFC receptor no coincide con tu RFC');
    }
  } else {
    if (cfdiData.rfc_emisor !== userRFC) {
      errors.push('RFC emisor no coincide con tu RFC');
    }
  }
  
  // 2. Structure validation
  if (!cfdiData.uuid || cfdiData.uuid.length !== 36) {
    errors.push('UUID inválido');
  }
  
  // 3. Date validation
  const cfdiDate = new Date(cfdiData.fecha);
  const today = new Date();
  if (cfdiDate > today) {
    errors.push('Fecha del CFDI es futura');
  }
  
  // 4. Totals validation
  const calculatedTotal = cfdiData.subtotal - (cfdiData.descuento || 0) + cfdiData.iva;
  if (Math.abs(calculatedTotal - cfdiData.total) > 0.01) {
    errors.push('El total no coincide con subtotal + IVA - descuento');
  }
  
  // 5. Check for required fields
  const requiredFields = ['uuid', 'rfc_emisor', 'rfc_receptor', 'fecha', 'total'];
  requiredFields.forEach(field => {
    if (!cfdiData[field]) {
      errors.push(`Campo requerido faltante: ${field}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    status: errors.length === 0 ? 'valid' : 'invalid'
  };
}
```

### 6. Auto-Matching Algorithm

**Create `src/utils/cfdiMatcher.js`:**

```javascript
/**
 * Auto-match CFDIs to transactions
 * @param {Object} cfdi - CFDI to match
 * @param {Array} transactions - Available transactions
 * @returns {Array} Sorted match suggestions
 */
function findMatches(cfdi, transactions) {
  const suggestions = [];
  
  transactions.forEach(tx => {
    let score = 0;
    const reasons = [];
    
    // Amount match (50 points max)
    const amountDiff = Math.abs(tx.amount - cfdi.total);
    const amountDiffPercent = (amountDiff / cfdi.total) * 100;
    if (amountDiffPercent < 1) {
      score += 50;
      reasons.push('Monto exacto');
    } else if (amountDiffPercent < 5) {
      score += 30;
      reasons.push('Monto similar');
    }
    
    // Date proximity (30 points max)
    const dateDiff = Math.abs(
      new Date(tx.date) - new Date(cfdi.fecha)
    ) / (1000 * 60 * 60 * 24);
    if (dateDiff === 0) {
      score += 30;
      reasons.push('Misma fecha');
    } else if (dateDiff <= 7) {
      score += Math.max(0, 30 - dateDiff * 3);
      reasons.push(`${dateDiff} días de diferencia`);
    }
    
    // Description similarity (20 points max) - optional
    // Use string similarity algorithm
    
    if (score >= 40) { // Minimum threshold
      suggestions.push({
        transaction: tx,
        score,
        reasons,
        amountDiff: amountDiffPercent.toFixed(2) + '%',
        dateDiff: dateDiff.toFixed(0) + ' días'
      });
    }
  });
  
  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score);
}
```

### 7. Navigation & Routes

**Update `src/App.jsx`:**
- Add route: `/cfdi` → CFDIManager component
- Update navigation menu to include CFDI option

**Update sidebar/menu:**
- Add "Gestor de CFDI" link in Fiscal section
- Icon: 📄 or 🧾

### 8. Integration with Existing Features

**Update `AddTransaction.jsx`:**
- Add button to "Find matching CFDI" when creating/editing transaction
- Show linked CFDI info if exists
- Allow unlinking CFDI

**Update `Transactions.jsx` list:**
- Add column to show CFDI icon if transaction has linked CFDI
- Quick link to view CFDI details

### 9. Data Population & Sample Data

**Create sample CFDI XMLs for testing:**
- Sample issued CFDI (emitido)
- Sample received CFDI (recibido)
- Sample with validation errors
- Sample canceled CFDI

**Testing scenarios:**
1. Upload valid CFDI → should parse and validate successfully
2. Upload CFDI with wrong RFC → should show validation error
3. Upload duplicate UUID → should detect and warn
4. Auto-match CFDI to existing transaction → should suggest correct match
5. Manual link CFDI to transaction → should update both records
6. View CFDI list with filters → should filter correctly
7. Download XML → should retrieve original file

## Verification Steps:

1. **Database:**
   - Run migration 025
   - Verify cfdi_metadata table created
   - Verify all indexes created
   - Insert sample CFDI manually and query successfully

2. **Backend:**
   - Test upload endpoint with sample XML
   - Verify parsing extracts all fields correctly
   - Test validation endpoint with various scenarios
   - Test auto-match algorithm with sample data
   - Test linking CFDI to transaction
   - Verify all API responses have proper error handling

3. **Frontend:**
   - Upload XML file through UI
   - Verify CFDI appears in list
   - Test validation flow
   - Test auto-match suggestions
   - Test manual linking
   - Verify filters work correctly
   - Test delete CFDI
   - Verify responsive design on mobile
   - Test dark mode compatibility

4. **Integration:**
   - Create transaction, then link CFDI
   - Upload CFDI, then auto-match to transaction
   - Verify transaction shows CFDI indicator
   - Edit transaction, verify CFDI link persists
   - Delete transaction, verify CFDI becomes unlinked

5. **Build:**
   - Run `npm run build` to ensure no errors
   - Check bundle size (should not increase significantly)
   - Verify all imports resolve

## Progress Tracking:

**MANDATORY:** Update IMPLEMENTATION_PLAN_V7.md with checkmarks (✅) as you complete each task

**Commit frequently** with descriptive messages:
- "Phase 18: Add CFDI metadata table and migration"
- "Phase 18: Create CFDI upload and parsing backend"
- "Phase 18: Add CFDI validation logic"
- "Phase 18: Create CFDI manager UI"
- "Phase 18: Implement auto-matching algorithm"
- "Phase 18: Complete CFDI module and update docs"

## Technical Considerations:

1. **XML Parsing:**
   - Use DOMParser for browser-side parsing
   - Handle CFDI 3.3 and 4.0 versions
   - Deal with XML namespaces correctly
   - Validate XML structure before parsing

2. **Security:**
   - Validate user owns CFDI before operations
   - Sanitize XML content to prevent XSS
   - Validate file types (only XML)
   - Limit file size (e.g., max 2MB per XML)
   - Rate limit uploads to prevent abuse

3. **Storage:**
   - Store XML content in database for quick access
   - Optionally upload to R2 for archival
   - Consider compression for large XMLs
   - Implement cleanup for old/deleted CFDIs

4. **Performance:**
   - Index uuid for fast lookups
   - Paginate CFDI lists (large datasets)
   - Lazy load XML content (only when viewing details)
   - Cache parsed data to avoid re-parsing

5. **Error Handling:**
   - Handle invalid XML gracefully
   - Provide clear error messages
   - Allow retry on upload failures
   - Log parsing errors for debugging

6. **User Experience:**
   - Show upload progress
   - Provide validation feedback immediately
   - Highlight suggested matches clearly
   - Make linking/unlinking intuitive
   - Support bulk operations (future)

## Database Considerations:

- Use transactions for linking operations (atomicity)
- Consider soft deletes for audit trail
- Plan for CFDI cancellation tracking
- Store validation history (optional)
- Consider partitioning by year for large datasets

## Integration Points:

- Connect with transactions table (cfdi_uuid field)
- Use existing authentication/authorization
- Follow existing API patterns and conventions
- Integrate with fiscal calculations (Phase 19)
- Prepare for DIOT generation (Phase 21)

## Dependencies & Libraries:

**For XML Parsing (choose one):**
- DOMParser (built-in browser API)
- fast-xml-parser (npm package)
- xml2js (npm package)

**For File Upload:**
- FormData API (built-in)
- Cloudflare Workers fetch with multipart support

**For Storage (optional):**
- Cloudflare R2 SDK for XML archival

## Next Step:

Upon successful completion and verification of all Phase 18 tasks, generate and output the complete, self-contained prompt for **Phase 19: Core Tax Calculation Engine**, following this same instructional format and referencing the updated implementation plan.

---

**Current Status:** Ready to begin Phase 18  
**Prerequisites:** Phase 17 completed ✅  
**Estimated Complexity:** High (XML parsing, validation logic, auto-matching)  
**Estimated Time:** 6-8 hours  
**Priority:** High (critical for fiscal compliance)
