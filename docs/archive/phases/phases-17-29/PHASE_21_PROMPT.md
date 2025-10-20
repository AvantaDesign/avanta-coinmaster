# Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica)

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at D:\AVANTA DESIGN CODE\avanta-coinmaster.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

✅ **Phases 1-20: COMPLETED** (Comprehensive financial management system including:)
- Phase 1-16: Core financial management, tax logic, and deductibility
- Phase 17: Income Module & Fiscal Foundations
- Phase 18: CFDI Control & Validation Module
- Phase 19: Core Tax Calculation Engine (ISR/IVA)
- Phase 20: Bank Reconciliation (COMPLETED)

🚧 **Phase 21: CURRENT PHASE** (Advanced Declarations - DIOT & Contabilidad Electrónica)

📋 **Phases 22-29:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

## Current Task: Phase 21 - Advanced Declarations (DIOT & Contabilidad Electrónica)

### Goal
Generate the data and files required for official SAT declarations, specifically:
1. **DIOT (Declaración Informativa de Operaciones con Terceros)** - Operations with third parties
2. **Contabilidad Electrónica** - Electronic accounting (Anexo 24):
   - Catálogo de Cuentas XML
   - Balanza de Comprobación XML

### Context from Previous Phases

**Phase 20** successfully implemented:
- ✅ Bank statement import and parsing (CSV support)
- ✅ Auto-matching engine with confidence scoring
- ✅ Manual reconciliation workflow
- ✅ Reconciliation dashboard and reporting
- ✅ "Pago efectivamente realizado" verification

The system now needs advanced declaration capabilities to:
- Generate DIOT reports for operations with suppliers
- Export chart of accounts in official SAT XML format
- Generate monthly trial balance in official SAT XML format
- Ensure full compliance with Anexo 24 requirements
- Support official SAT XSD validation

## Actionable Steps

### 1. Database Schema - Advanced Declarations

**Create Migration:** `migrations/028_add_advanced_declarations.sql`

#### Create DIOT Configuration Table
- `id` (PRIMARY KEY)
- `user_id` (TEXT, foreign key)
- `provider_rfc` (TEXT, provider tax ID)
- `provider_name` (TEXT)
- `provider_type` (nacional_persona_fisica/nacional_persona_moral/extranjero)
- `provider_country` (TEXT, country code for foreign providers)
- `operation_type` (TEXT, see DIOT operation types)
- `total_operations` (DECIMAL, sum of operations)
- `iva_16_base` (DECIMAL, base for 16% IVA)
- `iva_16_amount` (DECIMAL, 16% IVA amount)
- `iva_8_base` (DECIMAL, base for 8% border IVA)
- `iva_8_amount` (DECIMAL, 8% border IVA amount)
- `iva_0_amount` (DECIMAL, 0% IVA amount)
- `iva_exempt_amount` (DECIMAL, IVA exempt amount)
- `iva_retained` (DECIMAL, IVA retained)
- `isr_retained` (DECIMAL, ISR retained)
- `period_year` (INTEGER)
- `period_month` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

#### Create Chart of Accounts (Catálogo) Table
- `id` (PRIMARY KEY)
- `user_id` (TEXT, foreign key)
- `account_code` (TEXT, account code from SAT catalog)
- `account_number` (TEXT, user's account number)
- `account_description` (TEXT)
- `account_level` (INTEGER, 1-7 hierarchy level)
- `parent_account` (TEXT, parent account code)
- `account_nature` (deudora/acreedora)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Create Trial Balance (Balanza) Table
- `id` (PRIMARY KEY)
- `user_id` (TEXT, foreign key)
- `account_id` (INTEGER, foreign key to chart of accounts)
- `period_year` (INTEGER)
- `period_month` (INTEGER)
- `initial_balance` (DECIMAL)
- `debit_movements` (DECIMAL)
- `credit_movements` (DECIMAL)
- `final_balance` (DECIMAL)
- `created_at`, `updated_at` (TIMESTAMP)

#### Create Declaration History Table
- `id` (PRIMARY KEY)
- `user_id` (TEXT, foreign key)
- `declaration_type` (diot/catalogo/balanza)
- `period_year` (INTEGER)
- `period_month` (INTEGER, NULL for catalog)
- `file_path` (TEXT, R2 storage path)
- `file_hash` (TEXT, SHA-256 hash)
- `validation_status` (pending/valid/invalid)
- `validation_errors` (TEXT/JSON)
- `generated_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. Backend API Development

#### Create `functions/api/diot.js`
**Endpoints:**
- `GET /api/diot` - Get DIOT data for period
- `POST /api/diot/generate` - Generate DIOT report
- `GET /api/diot/providers` - List providers with operations
- `PUT /api/diot/provider` - Update provider information

**Features:**
- Aggregate transaction data by provider
- Calculate IVA bases and amounts by rate
- Calculate retentions (IVA and ISR)
- Support operation type classification
- Generate text file in official DIOT format
- Validate provider RFCs
- Handle foreign providers

#### Create `functions/api/electronic-accounting.js`
**Endpoints:**
- `GET /api/electronic-accounting/catalog` - Get chart of accounts
- `POST /api/electronic-accounting/catalog/generate` - Generate catalog XML
- `GET /api/electronic-accounting/balance` - Get trial balance
- `POST /api/electronic-accounting/balance/generate` - Generate balance XML
- `POST /api/electronic-accounting/validate` - Validate XML against XSD

**Features:**
- Map user accounts to SAT account codes
- Generate XML following Anexo 24 specifications
- Include proper XML namespaces and schema references
- Calculate trial balance from transactions
- Support monthly and annual balances
- Implement XML validation against official XSD schemas
- Handle account hierarchies (7 levels)
- Support complementary balance (initial + movements)

#### Create XML Generation Utilities
**File:** `src/utils/xmlGenerator.js`

**Functions:**
- `generateCatalogXML(accounts)` - Generate CatalogoDeCuentas.xml
- `generateBalanceXML(balanceData)` - Generate BalanzaDeComprobacion.xml
- `validateXML(xmlString, schemaType)` - Validate against XSD
- `formatAccountCode(code)` - Format account codes properly
- `calculateBalances(transactions, accounts)` - Calculate trial balance

**XML Structure for Catalog:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<catalogocuentas:Catalogo 
  xmlns:catalogocuentas="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas/CatalogoCuentas_1_3.xsd"
  Version="1.3"
  RFC="XAXX010101000"
  Mes="10"
  Anio="2025">
  <catalogocuentas:Ctas
    CodAgrup="100.01"
    NumCta="1001"
    Desc="Caja"
    Nivel="1"
    Natur="D"/>
  <!-- More accounts -->
</catalogocuentas:Catalogo>
```

**XML Structure for Balance:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<BCE:Balanza
  xmlns:BCE="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion/BalanzaComprobacion_1_3.xsd"
  Version="1.3"
  RFC="XAXX010101000"
  Mes="10"
  Anio="2025"
  TipoEnvio="N">
  <BCE:Ctas
    NumCta="1001"
    SaldoIni="100000.00"
    Debe="50000.00"
    Haber="30000.00"
    SaldoFin="120000.00"/>
  <!-- More accounts -->
</BCE:Balanza>
```

### 3. Frontend UI - Advanced Declarations

#### Create "Declaraciones Avanzadas" Page
**Component:** `src/components/AdvancedDeclarations.jsx`

**Tab Structure:**
1. **DIOT Tab**
   - Period selector (year, month)
   - Provider list with operations summary
   - Operation type breakdown
   - IVA and retention summaries
   - Generate DIOT button
   - Download DIOT file button
   - Validation status display

2. **Catálogo de Cuentas Tab**
   - Chart of accounts viewer (tree structure)
   - Account mapping to SAT codes
   - Add/edit account functionality
   - Hierarchy visualization
   - Generate XML button
   - Download catalog XML
   - Validation status display

3. **Balanza de Comprobación Tab**
   - Period selector (year, month)
   - Balance type selector (normal/complementaria)
   - Trial balance table view
   - Account balances with movements
   - Generate XML button
   - Download balance XML
   - Validation status display

4. **Historial Tab**
   - List of generated declarations
   - Download previous files
   - Validation status history
   - Re-generate functionality

#### DIOT Interface Features
- Provider search and filtering
- Operation type classification (85 types supported)
- Automatic calculation of bases and IVA
- Retention tracking
- RFC validation
- Foreign provider handling
- Export to text file (pipe-delimited)
- Export to Excel (for review)

#### Chart of Accounts Interface Features
- Tree view with expand/collapse
- SAT code selector (from pre-loaded catalog)
- Account number assignment
- Description editor
- Nature selector (Deudora/Acreedora)
- Level indicator (1-7)
- Parent account selection
- Bulk import from template
- Export to Excel template

#### Trial Balance Interface Features
- Monthly balance view
- Complementary balance support
- Initial, debit, credit, final columns
- Automatic calculation from transactions
- Account drill-down to transactions
- Balance verification (must balance to zero)
- Export to Excel
- Print-friendly format

### 4. DIOT Generation Logic

#### DIOT Operation Types (Partial List)
- `03` - Servicios profesionales
- `04` - Arrendamiento de inmuebles
- `05` - Arrendamiento de muebles
- `06` - Enajenación de bienes
- `85` - Otros (general)

#### DIOT File Format
Pipe-delimited text file with fields:
```
TipoTercero|RFC|Nombre|País|Nacionalidad|TipoOperación|BaseIVA16|IVA16|BaseIVA8|IVA8|IVA0|Exento|IVARetenido|ISRRetenido
04|ABC123456789|PROVEEDOR ABC SA DE CV|MEX|R|03|100000.00|16000.00|0.00|0.00|0.00|0.00|0.00|0.00
```

**Validation Rules:**
- RFC must be valid format (12 or 13 characters)
- Amounts must be positive decimals with 2 decimal places
- Operation type must be valid DIOT code
- National providers must have Mexican RFC
- Foreign providers must have country code
- Total IVA must match sum of rates

### 5. Electronic Accounting (Anexo 24)

#### Catálogo de Cuentas Requirements
- Must use official SAT account codes (código agrupador)
- 7 hierarchical levels supported
- Account nature: D (Deudora) or A (Acreedora)
- Must include all accounts used in the period
- XML schema version 1.3
- Digital signature (optional for small taxpayers)

#### Balanza de Comprobación Requirements
- Monthly submission required
- Must include all accounts with movements
- Balance must equal zero (debits = credits)
- Initial balance + movements = final balance
- Support for complementary balance (corrections)
- XML schema version 1.3
- Must match chart of accounts

#### XML Validation
- Download official XSD schemas from SAT
- Implement client-side validation
- Server-side validation before submission
- Display validation errors to user
- Prevent submission of invalid files
- Store validation status in database

### 6. Integration Points

#### Link with Existing Modules
- **Phase 17 (Income):** Use client/provider data for DIOT
- **Phase 18 (CFDI):** Extract provider info from CFDIs
- **Phase 19 (Tax Calculations):** Use for IVA calculations
- **Phase 20 (Bank Reconciliation):** Verify actual payments
- **Transactions:** Aggregate for balances and DIOT

#### Data Flow
1. Transactions → Provider operations → DIOT
2. Transactions → Account balances → Trial balance
3. SAT account catalog → Chart of accounts mapping
4. Generated XMLs → File storage (R2) → Download

### 7. Verification Steps

#### Testing Checklist
- [ ] DIOT generation with sample data
- [ ] DIOT file format validation
- [ ] Provider aggregation accuracy
- [ ] IVA calculation verification
- [ ] Chart of accounts XML generation
- [ ] Trial balance XML generation
- [ ] XML schema validation (XSD)
- [ ] Account hierarchy display
- [ ] Balance calculations accuracy
- [ ] File download functionality
- [ ] Declaration history tracking
- [ ] Build succeeds without errors
- [ ] Responsive design verification
- [ ] Dark mode compatibility

#### Validation Requirements
- Generate XMLs that pass SAT XSD validation
- DIOT totals must match IVA declarations
- Trial balance must balance (debits = credits)
- Account codes must be valid SAT codes
- RFCs must be valid format
- All required fields must be present
- Amounts must have correct precision (2 decimals)

### 8. Progress Tracking

**MANDATORY:**
- Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task
- Create completion summary: `PHASE_21_ADVANCED_DECLARATIONS_SUMMARY.md`
- Commit changes with descriptive messages
- Mark Phase 21 as completed when all tasks are done

### 9. Technical Considerations

#### SAT Compliance
- Use official SAT schemas and specifications
- Follow Anexo 24 requirements exactly
- Implement proper XML namespaces
- Include schema version in XML
- Support both monthly and annual submissions
- Handle corrections (complementary submissions)

#### XML Generation
- Use proper XML libraries (avoid string concatenation)
- Escape special characters in XML
- Format numbers with 2 decimal places
- Use UTF-8 encoding
- Include XML declaration
- Validate before saving

#### File Storage
- Store generated files in Cloudflare R2
- Generate unique file names with timestamp
- Track file versions for corrections
- Implement file retention policy
- Enable secure download links
- Calculate and store file hashes

#### Performance
- Optimize for large transaction datasets
- Implement pagination for large balances
- Use database views for aggregations
- Cache SAT account catalog
- Minimize XML file size
- Stream large file downloads

### 10. SAT Account Catalog (Código Agrupador)

The system already has the SAT account catalog (from Phase 17):
- Pre-loaded in `sat_accounts_catalog` table
- Hierarchical structure (7 levels)
- Search and browse functionality
- Used for mapping user accounts to SAT codes

**Account Code Format:**
- Level 1: `100` (e.g., Activo)
- Level 2: `100.01` (e.g., Activo Circulante)
- Level 3: `100.01.001` (e.g., Caja)
- ... up to 7 levels

### 11. DIOT Provider Types

**Nacional Persona Física (04):**
- Mexican individual with business activity
- 13-character RFC

**Nacional Persona Moral (05):**
- Mexican corporation
- 12-character RFC

**Extranjero (15):**
- Foreign provider
- Tax ID from their country
- Country code required

### 12. Security Considerations

- Validate all user inputs
- Sanitize data for XML injection
- Implement access controls for declarations
- Secure file storage paths
- Validate file uploads
- Prevent unauthorized file access
- Log all declaration generation
- Encrypt sensitive data at rest

### 13. User Documentation Needs

#### User Guide Sections
1. **DIOT Overview:** What it is and why it's required
2. **Preparing DIOT:** How to classify operations
3. **Generating DIOT:** Step-by-step process
4. **Chart of Accounts:** How to map accounts
5. **Trial Balance:** Understanding the balance
6. **XML Validation:** How to validate files
7. **Submission:** How to submit to SAT
8. **Common Errors:** Troubleshooting guide

### 14. Next Steps After Phase 21

Upon successful completion of Phase 21, the next phase will be:

**Phase 22: Annual Declaration & Advanced Analytics**
- Annual tax calculation (Art. 152 LISR)
- Personal deductions management
- Advanced fiscal dashboards
- Custom financial reports

## Mexican Fiscal Context

### DIOT Requirements
- Monthly submission (by day 17 of following month)
- Reports operations with providers ≥ $50,000 MXN annually
- Required for IVA taxpayers
- Helps SAT cross-check IVA deductions
- Penalties for late or incorrect filing

### Contabilidad Electrónica (Anexo 24)
- Monthly submission required
- Chart of accounts (once, plus updates)
- Trial balance (monthly, by day 25)
- XML format mandatory since 2015
- Must use official SAT schemas
- Required for all taxpayers (with some exceptions)

### Validation Tools
- SAT provides online validation tool
- XSD schemas available for download
- Pre-validation recommended before submission
- Errors must be corrected via complementary submission

## Success Criteria

Phase 21 will be considered complete when:
- [x] Database schema created with all required tables
- [x] DIOT generation fully functional
- [x] Chart of accounts XML generation working
- [x] Trial balance XML generation working
- [x] XML validation against SAT XSD schemas
- [x] Frontend interface complete and tested
- [x] File storage and download working
- [x] Navigation and routing integrated
- [x] Build passes without errors
- [x] Documentation completed
- [x] Sample declarations generated successfully
- [x] IMPLEMENTATION_PLAN_V7.md updated
- [x] Completion summary created

## Additional Resources

### SAT Official Resources
- **Anexo 24:** http://www.sat.gob.mx/informacion_fiscal/factura_electronica/
- **DIOT Specifications:** http://www.sat.gob.mx/informacion_fiscal/obligaciones/
- **XSD Schemas:** Download from SAT website
- **Validation Tool:** Available on SAT portal

### Technical References
- XML validation libraries for JavaScript
- Cloudflare R2 documentation for file storage
- React tree view components for account hierarchy
- Number formatting for Mexican decimal conventions

## Notes

- This phase is critical for SAT compliance
- Generated files must pass official validation
- Testing with sample data is essential
- Consider consulting with a Mexican accountant for validation
- Keep XSD schemas updated (SAT may update them)
- Implement proper error handling for validation failures
- Provide clear user feedback for validation errors

---

**IMPORTANT:** Generate and output the complete implementation upon completion, following the same instructional format for the next phase (Phase 22: Annual Declaration & Advanced Analytics).
