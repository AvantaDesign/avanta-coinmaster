# Phase 21: Implementation Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AVANTA FINANCE - PHASE 21                         │
│                   Advanced Declarations (DIOT & CE)                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  SATDeclarations.jsx (React Component)                          │     │
│  ├────────────────────────────────────────────────────────────────┤     │
│  │                                                                  │     │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────┐│     │
│  │  │ Dashboard    │ DIOT         │ Contabilidad │ History      ││     │
│  │  │ Tab          │ Tab          │ Electrónica  │ Tab          ││     │
│  │  │              │              │ Tab          │              ││     │
│  │  │ • Summary    │ • Period     │ • Period     │ • List       ││     │
│  │  │   Cards      │   Selection  │   Selection  │   Filtering  ││     │
│  │  │ • Quick      │ • Generate   │ • Generate   │ • Download   ││     │
│  │  │   Actions    │   Button     │   Button     │ • Delete     ││     │
│  │  │              │ • Info       │ • File Grid  │              ││     │
│  │  │              │   Panel      │              │              ││     │
│  │  └──────────────┴──────────────┴──────────────┴──────────────┘│     │
│  │                                                                  │     │
│  │  State Management:                                              │     │
│  │  • activeTab, declarations, loading                             │     │
│  │  • filterStatus, filterType, selectedPeriod                     │     │
│  │  • generatingDIOT, generatingCE                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ API Calls (fetch)
┌─────────────────────────────────────────────────────────────────────────┐
│                             API LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  /api/sat-declarations (sat-declarations.js)                             │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  HTTP Methods:                                                  │     │
│  │  ┌──────────┬──────────┬──────────┬──────────┬────────────┐   │     │
│  │  │ GET      │ POST     │ PUT      │ DELETE   │ OPTIONS    │   │     │
│  │  └──────────┴──────────┴──────────┴──────────┴────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Endpoints:                                                     │     │
│  │  • GET    /api/sat-declarations              - List            │     │
│  │  • GET    /api/sat-declarations/:id          - Get Single      │     │
│  │  • POST   /api/sat-declarations/diot/:y/:m   - Generate DIOT   │     │
│  │  • POST   /api/sat-declarations/cont/:y/:m   - Generate CE     │     │
│  │  • POST   /api/sat-declarations/submit/:id   - Submit          │     │
│  │  • PUT    /api/sat-declarations/:id          - Update          │     │
│  │  • DELETE /api/sat-declarations/:id          - Delete          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Core Functions:                                                │     │
│  │  • listDeclarations()                                           │     │
│  │  • getSingleDeclaration()                                       │     │
│  │  • generateDIOT()              ← Main DIOT Engine               │     │
│  │  • generateContabilidadElectronica() ← Main CE Engine           │     │
│  │  • updateDeclaration()                                          │     │
│  │  • deleteDeclaration()                                          │     │
│  │  • submitDeclaration()                                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  XML Generators:                                                │     │
│  │  • generateDIOTXML()                                            │     │
│  │  • generateCatalogoCuentasXML()                                 │     │
│  │  • generateBalanzaComprobacionXML()                             │     │
│  │  • generatePolizasXML()                                         │     │
│  │  • generateAuxiliarFoliosXML()                                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ SQL Queries
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                  │
│                        (Cloudflare D1 - SQLite)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Main Tables:                                                   │     │
│  │                                                                  │     │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │     │
│  │  │ sat_declarations │  │ diot_operations  │  │ contabilidad │ │     │
│  │  │                  │  │                  │  │ _electronica │ │     │
│  │  │ • id             │  │ • id             │  │ _files       │ │     │
│  │  │ • user_id        │  │ • user_id        │  │              │ │     │
│  │  │ • type           │  │ • declaration_id │  │ • id         │ │     │
│  │  │ • period_year    │  │ • client_rfc     │  │ • user_id    │ │     │
│  │  │ • period_month   │  │ • client_name    │  │ • decl_id    │ │     │
│  │  │ • status         │  │ • operation_type │  │ • file_type  │ │     │
│  │  │ • xml_content    │  │ • nationality    │  │ • xml        │ │     │
│  │  │ • file_name      │  │ • amount         │  │ • valid_st   │ │     │
│  │  │ • submission_dt  │  │ • iva_amount     │  │              │ │     │
│  │  │ • sat_response   │  │ • currency       │  │              │ │     │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘ │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Views:                                                         │     │
│  │  • v_declaration_summary        - Summary by period             │     │
│  │  • v_diot_operations_summary    - DIOT ops grouped              │     │
│  │  • v_pending_declarations       - Pending items                 │     │
│  │  • v_ce_file_summary            - CE file stats                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Indexes (15 total):                                            │     │
│  │  • idx_sat_declarations_user_id                                 │     │
│  │  • idx_sat_declarations_type                                    │     │
│  │  • idx_sat_declarations_period                                  │     │
│  │  • idx_sat_declarations_status                                  │     │
│  │  • idx_diot_operations_rfc                                      │     │
│  │  • idx_diot_operations_date                                     │     │
│  │  • [9 more indexes...]                                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Triggers:                                                      │     │
│  │  • trg_sat_declarations_updated_at                              │     │
│  │  • trg_diot_operations_updated_at                               │     │
│  │  • trg_ce_files_updated_at                                      │     │
│  │  • trg_update_declaration_status_on_files                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ Data Source
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION DATA SOURCES                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │ transactions       │  │ cfdi_metadata      │  │ sat_accounts_    │  │
│  │ (Phase 17)         │  │ (Phase 18)         │  │ catalog          │  │
│  │                    │  │                    │  │ (Phase 17)       │  │
│  │ • Income data      │  │ • CFDI UUIDs       │  │                  │  │
│  │ • Expense data     │  │ • Emitter/Receiver │  │ • Account codes  │  │
│  │ • Client RFC       │  │ • Amounts          │  │ • Descriptions   │  │
│  │ • IVA rates        │  │ • Issue dates      │  │ • Hierarchy      │  │
│  │ • Currency         │  │ • Types            │  │ • Nature         │  │
│  │ • Exchange rates   │  │                    │  │                  │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘  │
│                                                                           │
│  ┌────────────────────┐  ┌────────────────────┐                         │
│  │ accounts           │  │ fiscal_parameters  │                         │
│  │                    │  │ (Phase 17)         │                         │
│  │ • Account names    │  │                    │                         │
│  │ • SAT codes        │  │ • ISR rates        │                         │
│  │ • Balances         │  │ • IVA rates        │                         │
│  │                    │  │ • UMA values       │                         │
│  └────────────────────┘  └────────────────────┘                         │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

```

## 🔄 Data Flow Diagrams

### DIOT Generation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DIOT GENERATION PROCESS                            │
└──────────────────────────────────────────────────────────────────────┘

1. User Input
   ┌────────────────┐
   │ Select Period  │
   │ Year: 2025     │
   │ Month: Enero   │
   └───────┬────────┘
           ↓
2. Frontend Request
   ┌────────────────────────────────────────┐
   │ POST /api/sat-declarations/diot/2025/1 │
   │ Authorization: Bearer {token}          │
   └───────────────────┬────────────────────┘
                       ↓
3. Backend Validation
   ┌──────────────────────────────┐
   │ • Validate user token        │
   │ • Check year range (2020+)   │
   │ • Check month range (1-12)   │
   │ • Check for duplicates       │
   └──────────────┬───────────────┘
                  ↓
4. Data Extraction
   ┌────────────────────────────────────────────────┐
   │ SQL Query:                                     │
   │ SELECT transactions WHERE:                     │
   │   • date BETWEEN start_date AND end_date       │
   │   • client_rfc IS NOT NULL                     │
   │   • is_deleted = 0                             │
   │ GROUP BY:                                      │
   │   • client_rfc                                 │
   │   • operation_type                             │
   │   • iva_rate                                   │
   └──────────────────┬─────────────────────────────┘
                      ↓
5. Create Declaration
   ┌───────────────────────────────────────┐
   │ INSERT INTO sat_declarations          │
   │   type = 'diot'                       │
   │   period_year = 2025                  │
   │   period_month = 1                    │
   │   status = 'draft'                    │
   └──────────────┬────────────────────────┘
                  ↓
6. Insert Operations
   ┌─────────────────────────────────────────┐
   │ FOR EACH grouped operation:             │
   │   INSERT INTO diot_operations           │
   │     • client_rfc                        │
   │     • amount, base, iva                 │
   │     • operation_type                    │
   │     • currency, exchange_rate           │
   └──────────────┬──────────────────────────┘
                  ↓
7. Generate XML
   ┌────────────────────────────────────────┐
   │ generateDIOTXML(operations)            │
   │   • Build XML header                   │
   │   • Add operation entries              │
   │   • Escape special characters          │
   │   • Close XML structure                │
   └──────────────┬─────────────────────────┘
                  ↓
8. Update Declaration
   ┌────────────────────────────────────────┐
   │ UPDATE sat_declarations SET            │
   │   xml_content = {xml}                  │
   │   file_name = 'DIOT_2025_01.xml'       │
   │   status = 'generated'                 │
   └──────────────┬─────────────────────────┘
                  ↓
9. Return Response
   ┌────────────────────────────────────────┐
   │ JSON Response:                         │
   │   • declarationId                      │
   │   • operationCount                     │
   │   • xml (full content)                 │
   │   • success: true                      │
   └──────────────┬─────────────────────────┘
                  ↓
10. Frontend Actions
    ┌────────────────────────────────────┐
    │ • Show success alert               │
    │ • Auto-download XML file           │
    │ • Reload declarations list         │
    │ • Reset generating state           │
    └────────────────────────────────────┘
```

### Contabilidad Electrónica Generation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│             CONTABILIDAD ELECTRÓNICA GENERATION PROCESS               │
└──────────────────────────────────────────────────────────────────────┘

1. User Input → 2. API Request → 3. Validation → 4. Create Declaration

5. Generate 4 XML Files in Parallel:

   ┌─────────────────────────────────────────────────────────────────┐
   │                                                                  │
   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
   │  │ Catálogo       │  │ Balanza        │  │ Pólizas        │   │
   │  │ de Cuentas     │  │ Comprobación   │  │                │   │
   │  │                │  │                │  │                │   │
   │  │ Data Source:   │  │ Data Source:   │  │ Data Source:   │   │
   │  │ sat_accounts   │  │ transactions   │  │ transactions   │   │
   │  │ _catalog       │  │ + accounts     │  │ + accounts     │   │
   │  │                │  │                │  │                │   │
   │  │ Query:         │  │ Query:         │  │ Query:         │   │
   │  │ • Get all      │  │ • Group by     │  │ • All trans    │   │
   │  │   active       │  │   account_id   │  │   in period    │   │
   │  │   accounts     │  │ • SUM debits   │  │ • With dates   │   │
   │  │ • Ordered by   │  │ • SUM credits  │  │ • Sequential   │   │
   │  │   codigo       │  │ • Calculate    │  │                │   │
   │  │                │  │   balances     │  │                │   │
   │  │                │  │                │  │                │   │
   │  │ Generate XML:  │  │ Generate XML:  │  │ Generate XML:  │   │
   │  │ • Header       │  │ • Header       │  │ • Header       │   │
   │  │ • <Ctas>       │  │ • <Ctas>       │  │ • <Poliza>     │   │
   │  │   - Cuenta     │  │   - Cta attrs  │  │   - Trans      │   │
   │  │   - Attrs      │  │   - Balances   │  │   - Debe/Haber │   │
   │  │ • Close        │  │ • Close        │  │ • Close        │   │
   │  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
   │           ↓                   ↓                   ↓            │
   │  ┌────────────────┐                      ┌────────────────┐   │
   │  │ Auxiliar       │                      │ Store in DB    │   │
   │  │ de Folios      │                      │                │   │
   │  │                │                      │ INSERT INTO    │   │
   │  │ Data Source:   │                      │ contabilidad   │   │
   │  │ cfdi_metadata  │                      │ _electronica   │   │
   │  │                │                      │ _files         │   │
   │  │ Query:         │                      │                │   │
   │  │ • All CFDIs    │                      │ • xml_content  │   │
   │  │   in period    │                      │ • file_name    │   │
   │  │ • Issue dates  │                      │ • file_type    │   │
   │  │ • UUIDs        │                      │ • validation   │   │
   │  │                │                      │                │   │
   │  │ Generate XML:  │                      └────────────────┘   │
   │  │ • Header       │                                           │
   │  │ • <DetAuxFol>  │                                           │
   │  │   - CompNal    │                                           │
   │  │   - UUID       │                                           │
   │  │ • Close        │                                           │
   │  └────────┬───────┘                                           │
   │           ↓                                                    │
   └───────────┴────────────────────────────────────────────────────┘

6. Update Declaration Status
   ┌────────────────────────────────────┐
   │ UPDATE sat_declarations SET        │
   │   status = 'generated'             │
   │ WHERE id = declaration_id          │
   └──────────────┬─────────────────────┘
                  ↓
7. Return Response
   ┌────────────────────────────────────┐
   │ JSON Response:                     │
   │   • declarationId                  │
   │   • fileCount: 4                   │
   │   • files: [{type, id}, ...]       │
   │   • success: true                  │
   └────────────────────────────────────┘
```

## 🗂️ File Structure

```
avanta-coinmaster/
├── migrations/
│   └── 028_add_advanced_declarations.sql    ← Database schema
│
├── functions/
│   └── api/
│       └── sat-declarations.js               ← Backend API (1,100 lines)
│
├── src/
│   ├── components/
│   │   └── SATDeclarations.jsx              ← Frontend UI (800 lines)
│   │
│   └── App.jsx                              ← Updated with route & nav
│
└── docs/
    ├── IMPLEMENTATION_PLAN_V7.md            ← Updated plan
    ├── PHASE_21_ADVANCED_DECLARATIONS_SUMMARY.md ← Complete docs
    └── PHASE_21_VISUAL_SUMMARY.md           ← UI guide
```

## 🔐 Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└────────────────────────────────────────────────────────────┘

1. Authentication
   ┌──────────────────────────────────┐
   │ JWT Token Validation             │
   │ • getUserIdFromToken()           │
   │ • Verify signature               │
   │ • Check expiration               │
   └──────────────────────────────────┘

2. Authorization
   ┌──────────────────────────────────┐
   │ User Ownership Verification      │
   │ • Check user_id match            │
   │ • Prevent cross-user access      │
   │ • Validate resource ownership    │
   └──────────────────────────────────┘

3. Input Validation
   ┌──────────────────────────────────┐
   │ Parameter Validation             │
   │ • Year range: 2020-2100          │
   │ • Month range: 1-12              │
   │ • RFC format: min 12 chars       │
   │ • Status enum validation         │
   └──────────────────────────────────┘

4. SQL Injection Prevention
   ┌──────────────────────────────────┐
   │ Prepared Statements              │
   │ • All queries use .bind()        │
   │ • No string concatenation        │
   │ • Parameterized queries          │
   └──────────────────────────────────┘

5. XSS Prevention
   ┌──────────────────────────────────┐
   │ XML Escaping                     │
   │ • escapeXML() function           │
   │ • &, <, >, ", ' encoding         │
   │ • Safe output generation         │
   └──────────────────────────────────┘

6. CORS Configuration
   ┌──────────────────────────────────┐
   │ Cross-Origin Controls            │
   │ • Allow-Origin: *                │
   │ • Allow-Methods: defined         │
   │ • Allow-Headers: specified       │
   └──────────────────────────────────┘
```

## 📊 Performance Optimizations

```
┌────────────────────────────────────────────────────────────┐
│                PERFORMANCE FEATURES                         │
└────────────────────────────────────────────────────────────┘

Database Level:
├── 15 Indexes for fast queries
│   ├── User-based lookups
│   ├── Period-based filtering
│   ├── Status filtering
│   └── RFC lookups
│
├── Pre-built Views
│   ├── v_declaration_summary
│   ├── v_diot_operations_summary
│   ├── v_pending_declarations
│   └── v_ce_file_summary
│
└── Efficient Queries
    ├── Single query for operations
    ├── Grouped aggregations
    └── Limited result sets

Backend Level:
├── Lazy Loading
│   └── Only load data when requested
│
├── Pagination Support
│   ├── limit parameter
│   └── offset parameter
│
└── Efficient XML Generation
    └── String concatenation (not DOM)

Frontend Level:
├── React Lazy Loading
│   └── Component loaded on demand
│
├── State Management
│   ├── Minimal re-renders
│   └── Efficient updates
│
└── Conditional Rendering
    └── Only active tab rendered
```

## 🧪 Testing Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    TESTING LEVELS                           │
└────────────────────────────────────────────────────────────┘

Unit Testing (Recommended):
├── XML Generation Functions
│   ├── generateDIOTXML()
│   ├── generateCatalogoCuentasXML()
│   ├── generateBalanzaComprobacionXML()
│   ├── generatePolizasXML()
│   └── generateAuxiliarFoliosXML()
│
├── Utility Functions
│   ├── escapeXML()
│   ├── getOperationTypeCode()
│   └── getTasaIVA()
│
└── Validation Functions
    ├── Period validation
    ├── RFC validation
    └── Status validation

Integration Testing:
├── API Endpoints
│   ├── GET /api/sat-declarations
│   ├── POST /api/sat-declarations/diot/:y/:m
│   ├── POST /api/sat-declarations/contabilidad/:y/:m
│   └── PUT/DELETE operations
│
├── Database Operations
│   ├── Declaration creation
│   ├── Operation insertion
│   ├── File storage
│   └── Status updates
│
└── Data Flow
    ├── Transaction extraction
    ├── CFDI metadata retrieval
    └── Account catalog queries

End-to-End Testing:
├── User Workflows
│   ├── Generate DIOT
│   ├── Generate Contabilidad
│   ├── Download XML
│   └── Delete declaration
│
└── UI Interactions
    ├── Tab navigation
    ├── Period selection
    ├── Filtering
    └── Loading states

Manual Testing Checklist:
├── [ ] Generate DIOT with transactions
├── [ ] Generate DIOT with no data
├── [ ] Generate CE complete set
├── [ ] Verify XML downloads
├── [ ] Test duplicate prevention
├── [ ] Validate XML structure
├── [ ] Check dark mode
└── [ ] Test responsive design
```

---

This architecture document provides a comprehensive technical overview of the Phase 21 implementation without requiring the application to be running.
