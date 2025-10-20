# Avanta Finance - Technical Documentation

## 📐 System Architecture & API Documentation

**Version:** 1.0  
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Security Architecture](#security-architecture)
6. [Deployment Guide](#deployment-guide)
7. [Maintenance Guide](#maintenance-guide)
8. [Development Guide](#development-guide)

---

## System Architecture

### Overview

Avanta Finance is a serverless application built on the Cloudflare Workers platform, utilizing Cloudflare D1 (SQLite) for data storage and Cloudflare R2 for file storage.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  React 18 + Vite SPA (Single Page Application)             │
│  - TailwindCSS for styling                                  │
│  - Zustand for state management                             │
│  - React Router for navigation                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Cloudflare Pages                           │
│  - Static hosting                                           │
│  - CDN distribution                                         │
│  - Automatic HTTPS                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Fetch API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Cloudflare Workers Functions                    │
│  - Serverless API endpoints (/api/*)                        │
│  - JWT authentication middleware                            │
│  - Request validation and sanitization                      │
│  - Business logic layer                                     │
└──────┬───────────────┬────────────────────────┬─────────────┘
       │               │                        │
       │               │                        │
┌──────▼──────┐  ┌─────▼───────┐        ┌──────▼──────┐
│ Cloudflare  │  │ Cloudflare  │        │  External   │
│     D1      │  │     R2      │        │   APIs      │
│  (SQLite)   │  │  (Storage)  │        │  (SAT, etc) │
│             │  │             │        │             │
│ - Users     │  │ - PDFs      │        └─────────────┘
│ - Trans...  │  │ - XMLs      │
│ - CFDIs     │  │ - Images    │
│ - etc.      │  │             │
└─────────────┘  └─────────────┘
```

### Architecture Layers

#### 1. **Presentation Layer** (Frontend)
- **Technology**: React 18 with Vite
- **Styling**: TailwindCSS with custom dark mode
- **State Management**: Zustand stores
- **Routing**: React Router v6
- **Key Features**:
  - Component-based architecture
  - Responsive design (mobile-first)
  - Dark mode support
  - Real-time data updates
  - Optimistic UI updates

#### 2. **Application Layer** (Backend API)
- **Technology**: Cloudflare Workers
- **Runtime**: V8 JavaScript engine
- **Key Features**:
  - RESTful API endpoints
  - JWT authentication
  - Input validation
  - Error handling
  - Audit logging

#### 3. **Data Layer**
- **Primary Database**: Cloudflare D1 (SQLite)
  - Transactional data
  - User accounts
  - Fiscal parameters
  - Audit trails
- **File Storage**: Cloudflare R2
  - CFDIs (XML files)
  - Receipts (PDF/images)
  - Declarations (XML/PDF)
  - User documents

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 5.0.8 | Build tool & dev server |
| TailwindCSS | 3.3.6 | CSS framework |
| React Router | 6.20.0 | Client-side routing |
| Zustand | 4.5.7 | State management |
| @heroicons/react | 2.2.0 | Icon library |
| decimal.js | 10.6.0 | Precise decimal calculations |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Cloudflare Workers | Latest | Serverless functions |
| Cloudflare D1 | Latest | SQLite database |
| Cloudflare R2 | Latest | Object storage |
| jose | 6.1.0 | JWT handling |

### Development

| Tool | Purpose |
|------|---------|
| npm | Package management |
| Git | Version control |
| GitHub Actions | CI/CD pipeline |
| Wrangler | Cloudflare deployment CLI |

---

## Database Schema

### Core Tables

#### users
User accounts and authentication.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  rfc TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

**Indexes:**
- `username` (unique)
- `email` (unique)
- `rfc` (unique)

#### transactions
Financial transactions (income and expenses).

```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK(amount > 0),
  description TEXT NOT NULL,
  category_id INTEGER,
  account_id INTEGER,
  date DATE NOT NULL,
  -- Income-specific fields
  client_type TEXT CHECK(client_type IN ('nacional', 'extranjero')),
  client_rfc TEXT,
  currency TEXT DEFAULT 'MXN',
  exchange_rate REAL DEFAULT 1.0,
  payment_method TEXT,
  iva_rate REAL DEFAULT 16.0,
  isr_retention REAL DEFAULT 0,
  iva_retention REAL DEFAULT 0,
  cfdi_uuid TEXT,
  issue_date DATE,
  payment_date DATE,
  economic_activity_code TEXT,
  -- Expense-specific fields
  has_cfdi BOOLEAN DEFAULT 0,
  is_deductible_isr BOOLEAN DEFAULT 1,
  is_accreditable_iva BOOLEAN DEFAULT 1,
  deductibility_percentage_isr REAL DEFAULT 100.0,
  deductibility_percentage_iva REAL DEFAULT 100.0,
  -- Common fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

**Indexes:**
- `user_id, date`
- `cfdi_uuid`
- `type`

### Fiscal Tables

#### fiscal_parameters
System-wide fiscal parameters (UMA values, ISR tariffs).

```sql
CREATE TABLE fiscal_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parameter_type TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  parameter_name TEXT NOT NULL,
  parameter_value TEXT NOT NULL,
  valid_from DATE,
  valid_to DATE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Parameter Types:**
- `UMA`: Daily, monthly, annual values
- `ISR_TARIFF_MONTHLY`: Monthly ISR rates
- `ISR_TARIFF_ANNUAL`: Annual ISR rates

#### sat_accounts_catalog
Official SAT chart of accounts (Anexo 24).

```sql
CREATE TABLE sat_accounts_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  parent_code TEXT,
  nature TEXT CHECK(nature IN ('Deudora', 'Acreedora')),
  description TEXT,
  FOREIGN KEY (parent_code) REFERENCES sat_accounts_catalog(code)
);
```

**Hierarchy:** 7 levels
**Total Accounts:** 200+

#### cfdi_metadata
CFDI (invoice) metadata extracted from XML files.

```sql
CREATE TABLE cfdi_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  uuid TEXT UNIQUE NOT NULL,
  transaction_id INTEGER,
  -- Emisor (Issuer)
  emisor_rfc TEXT NOT NULL,
  emisor_nombre TEXT,
  emisor_regimen_fiscal TEXT,
  -- Receptor (Receiver)
  receptor_rfc TEXT NOT NULL,
  receptor_nombre TEXT,
  receptor_uso_cfdi TEXT,
  -- Comprobante details
  tipo_comprobante TEXT NOT NULL,
  folio TEXT,
  serie TEXT,
  fecha_emision DATETIME NOT NULL,
  fecha_certificacion DATETIME,
  -- Amounts
  subtotal REAL NOT NULL,
  descuento REAL DEFAULT 0,
  total REAL NOT NULL,
  moneda TEXT DEFAULT 'MXN',
  tipo_cambio REAL DEFAULT 1.0,
  -- Impuestos
  total_impuestos_trasladados REAL DEFAULT 0,
  total_impuestos_retenidos REAL DEFAULT 0,
  -- Payment
  forma_pago TEXT,
  metodo_pago TEXT,
  -- Status
  status TEXT DEFAULT 'Pending Validation',
  xml_file_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
```

**Indexes:**
- `uuid` (unique)
- `user_id, fecha_emision`
- `emisor_rfc`
- `receptor_rfc`
- `status`

### Tax Calculation Tables

#### tax_calculations
Monthly ISR and IVA calculations.

```sql
CREATE TABLE tax_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  fiscal_year INTEGER NOT NULL,
  fiscal_month INTEGER NOT NULL,
  calculation_type TEXT NOT NULL CHECK(calculation_type IN ('ISR', 'IVA')),
  -- Amounts
  total_income REAL DEFAULT 0,
  total_expenses REAL DEFAULT 0,
  deductible_expenses REAL DEFAULT 0,
  taxable_base REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  retentions REAL DEFAULT 0,
  previous_payments REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  -- IVA specific
  iva_collected REAL DEFAULT 0,
  iva_paid REAL DEFAULT 0,
  iva_carryforward REAL DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'Draft',
  calculation_date DATETIME,
  payment_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, fiscal_year, fiscal_month, calculation_type)
);
```

**Indexes:**
- `user_id, fiscal_year, fiscal_month`
- `calculation_type`
- `status`

#### annual_declarations
Annual tax declarations (ISR and IVA).

```sql
CREATE TABLE annual_declarations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  fiscal_year INTEGER NOT NULL,
  declaration_type TEXT NOT NULL CHECK(declaration_type IN ('ISR', 'IVA', 'Combined')),
  -- ISR Annual
  total_annual_income REAL DEFAULT 0,
  total_annual_deductions REAL DEFAULT 0,
  personal_deductions REAL DEFAULT 0,
  taxable_base REAL DEFAULT 0,
  isr_calculated REAL DEFAULT 0,
  isr_withholdings REAL DEFAULT 0,
  isr_provisional_payments REAL DEFAULT 0,
  isr_balance REAL DEFAULT 0,
  -- IVA Annual
  iva_collected_annual REAL DEFAULT 0,
  iva_paid_annual REAL DEFAULT 0,
  iva_balance REAL DEFAULT 0,
  -- Metadata
  personal_deductions_detail TEXT,
  status TEXT DEFAULT 'Draft',
  generated_date DATETIME,
  submitted_date DATETIME,
  acknowledgment_folio TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, fiscal_year, declaration_type)
);
```

### Declaration Tables

#### sat_declarations
SAT declarations (DIOT, Contabilidad Electrónica).

```sql
CREATE TABLE sat_declarations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  declaration_type TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  fiscal_month INTEGER,
  -- Content
  declaration_data TEXT,
  xml_content TEXT,
  -- Status
  status TEXT DEFAULT 'Draft',
  generated_date DATETIME,
  submitted_date DATETIME,
  acknowledgment_folio TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Declaration Types:**
- `DIOT`: Monthly third-party operations
- `CATALOGO`: Chart of accounts XML
- `BALANZA`: Trial balance XML
- `POLIZAS`: Journal entries XML
- `AUXILIAR`: CFDI auxiliary XML

### Bank Reconciliation Tables

#### bank_statements
Imported bank statement transactions.

```sql
CREATE TABLE bank_statements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_id INTEGER,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('debit', 'credit')),
  reference TEXT,
  batch_id TEXT,
  status TEXT DEFAULT 'Unmatched',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

#### reconciliation_matches
Matches between bank statements and transactions.

```sql
CREATE TABLE reconciliation_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bank_statement_id INTEGER NOT NULL,
  transaction_id INTEGER NOT NULL,
  match_type TEXT CHECK(match_type IN ('automatic', 'manual')),
  confidence_score REAL,
  match_metadata TEXT,
  status TEXT DEFAULT 'Pending',
  verified_by INTEGER,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (bank_statement_id) REFERENCES bank_statements(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  UNIQUE(bank_statement_id, transaction_id)
);
```

### Compliance Tables

#### digital_archive
Digital document archive.

```sql
CREATE TABLE digital_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  file_hash TEXT,
  -- Classification
  fiscal_year INTEGER,
  fiscal_month INTEGER,
  tags TEXT,
  access_level TEXT DEFAULT 'private',
  -- Lifecycle
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiration_date DATE,
  retention_period_years INTEGER,
  status TEXT DEFAULT 'Active',
  -- Relationships
  related_transaction_id INTEGER,
  related_declaration_id INTEGER,
  -- Metadata
  metadata TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (related_declaration_id) REFERENCES sat_declarations(id)
);
```

#### compliance_monitoring
Compliance check results and alerts.

```sql
CREATE TABLE compliance_monitoring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  check_type TEXT NOT NULL,
  fiscal_year INTEGER,
  fiscal_month INTEGER,
  -- Results
  compliance_score REAL,
  issues_found INTEGER DEFAULT 0,
  issues_detail TEXT,
  recommendations TEXT,
  -- Scheduling
  last_checked DATETIME,
  next_check_date DATETIME,
  -- Resolution
  status TEXT DEFAULT 'Active',
  resolved_date DATETIME,
  resolved_by INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```

#### audit_trail
System activity audit log.

```sql
CREATE TABLE audit_trail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  action_description TEXT NOT NULL,
  old_values TEXT,
  new_values TEXT,
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  -- Classification
  security_level TEXT DEFAULT 'normal',
  compliance_relevant BOOLEAN DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Documentation

### Base URL

```
Production: https://avanta-finance.pages.dev/api
Development: http://localhost:8788/api
```

### Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require JWT authentication.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Token Structure:**
```json
{
  "userId": 1,
  "username": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234657890
}
```

**Token Expiration:** 24 hours

### Common Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### API Endpoints

#### Authentication

##### POST /api/auth/login
Authenticate user and get JWT token.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user@example.com",
      "fullName": "John Doe",
      "role": "user"
    }
  }
}
```

##### POST /api/auth/register
Register new user account.

**Request:**
```json
{
  "username": "newuser@example.com",
  "password": "securePassword123",
  "fullName": "Jane Doe",
  "rfc": "XAXX010101000"
}
```

#### Transactions

##### GET /api/transactions
List transactions with pagination and filtering.

**Query Parameters:**
- `page` (integer, default: 1)
- `perPage` (integer, default: 50)
- `type` (string: 'income' | 'expense')
- `startDate` (date: YYYY-MM-DD)
- `endDate` (date: YYYY-MM-DD)
- `categoryId` (integer)
- `search` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "perPage": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

##### POST /api/transactions
Create new transaction.

**Request:**
```json
{
  "type": "income",
  "amount": 15000,
  "description": "Consulting services",
  "date": "2025-03-15",
  "categoryId": 10,
  "accountId": 5,
  "clientType": "nacional",
  "clientRfc": "ABC123456789",
  "currency": "MXN",
  "paymentMethod": "PUE",
  "ivaRate": 16,
  "hasCfdi": true,
  "cfdiUuid": "12345678-1234-1234-1234-123456789012"
}
```

##### PUT /api/transactions/:id
Update existing transaction.

##### DELETE /api/transactions/:id
Delete transaction (soft delete).

#### CFDI Management

##### GET /api/cfdi-management
List CFDIs with filtering.

**Query Parameters:**
- `type` (string: 'ingreso' | 'egreso')
- `status` (string: 'Valid' | 'Pending Validation' | 'Invalid RFC' | 'Canceled')
- `startDate`, `endDate` (date)
- `search` (string: UUID or RFC)

##### POST /api/cfdi-management
Upload and process CFDI XML.

**Request:** `multipart/form-data` with XML file

**Response:**
```json
{
  "success": true,
  "data": {
    "cfdi": {
      "id": 123,
      "uuid": "12345678-1234-1234-1234-123456789012",
      "emisorRfc": "ABC123456789",
      "receptorRfc": "XYZ987654321",
      "total": 17400,
      "status": "Pending Validation",
      "autoLinked": true,
      "linkedTransactionId": 456
    }
  }
}
```

##### PUT /api/cfdi-management/:id/link
Link CFDI to transaction.

**Request:**
```json
{
  "transactionId": 456
}
```

#### Tax Calculations

##### POST /api/tax-calculations
Calculate ISR and IVA for a period.

**Request:**
```json
{
  "fiscalYear": 2025,
  "fiscalMonth": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isr": {
      "totalIncome": 180000,
      "deductibleExpenses": 60000,
      "taxableBase": 120000,
      "isrCalculated": 9775.07,
      "retentions": 5000,
      "previousPayments": 2500,
      "balance": 2275.07
    },
    "iva": {
      "ivaCollected": 28800,
      "ivaPaid": 9600,
      "balance": 19200
    }
  }
}
```

##### GET /api/tax-calculations/:year/:month
Get existing calculation for a period.

##### GET /api/tax-reports/monthly/:year/:month
Get detailed monthly tax report.

##### GET /api/tax-reports/annual/:year
Get annual tax summary.

#### Bank Reconciliation

##### POST /api/bank-reconciliation/upload
Upload bank statement CSV.

**Request:** `multipart/form-data` with CSV file

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "autoMatched": 42,
    "unmatched": 8,
    "batchId": "batch_123456"
  }
}
```

##### GET /api/bank-reconciliation/matches
List reconciliation matches.

**Query Parameters:**
- `status` (string: 'Pending' | 'Verified' | 'Rejected')
- `confidenceMin` (number: 0-1)

##### POST /api/bank-reconciliation/matches
Create manual match.

**Request:**
```json
{
  "bankStatementId": 123,
  "transactionId": 456
}
```

##### PUT /api/bank-reconciliation/matches/:id/verify
Verify a match.

##### PUT /api/bank-reconciliation/matches/:id/reject
Reject a match.

#### SAT Declarations

##### POST /api/sat-declarations/diot
Generate DIOT.

**Request:**
```json
{
  "fiscalYear": 2025,
  "fiscalMonth": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "declarationId": 789,
    "operations": 25,
    "totalAmount": 125000,
    "xmlContent": "...",
    "downloadUrl": "/api/sat-declarations/789/download"
  }
}
```

##### POST /api/sat-declarations/contabilidad-electronica
Generate Contabilidad Electrónica XMLs.

**Request:**
```json
{
  "fiscalYear": 2025,
  "fiscalMonth": 3,
  "includeTypes": ["CATALOGO", "BALANZA", "POLIZAS", "AUXILIAR"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "type": "CATALOGO",
        "declarationId": 790,
        "downloadUrl": "/api/sat-declarations/790/download"
      },
      {
        "type": "BALANZA",
        "declarationId": 791,
        "downloadUrl": "/api/sat-declarations/791/download"
      },
      ...
    ]
  }
}
```

##### GET /api/sat-declarations
List declarations.

##### GET /api/sat-declarations/:id/download
Download declaration XML/PDF.

#### Annual Declarations

##### POST /api/annual-declarations
Generate annual declaration.

**Request:**
```json
{
  "fiscalYear": 2024,
  "declarationType": "ISR",
  "personalDeductions": [
    {
      "type": "medical",
      "amount": 15000,
      "description": "Gastos médicos familiares"
    },
    {
      "type": "education",
      "amount": 25000,
      "description": "Colegiaturas"
    }
  ]
}
```

##### GET /api/annual-declarations/:year
Get annual declaration.

#### Compliance Monitoring

##### POST /api/compliance-monitoring/check
Run compliance check.

**Request:**
```json
{
  "fiscalYear": 2025,
  "fiscalMonth": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkId": 999,
    "complianceScore": 85.5,
    "status": "Warning",
    "issues": [
      {
        "type": "CFDI_MISSING",
        "severity": "HIGH",
        "count": 5,
        "description": "5 transacciones >$2,000 sin CFDI"
      }
    ],
    "recommendations": [
      "Subir CFDIs faltantes",
      "Mejorar conciliación bancaria"
    ]
  }
}
```

##### GET /api/compliance-monitoring/alerts
Get active compliance alerts.

##### GET /api/compliance-monitoring/reports
Generate compliance report.

#### Digital Archive

##### POST /api/digital-archive
Upload document.

**Request:** `multipart/form-data` with file and metadata

##### GET /api/digital-archive
List documents.

**Query Parameters:**
- `documentType`
- `fiscalYear`, `fiscalMonth`
- `tags`
- `status`
- `search`

##### GET /api/digital-archive/:id/download
Download document.

##### DELETE /api/digital-archive/:id
Delete document.

#### Audit Trail

##### GET /api/audit-trail
List audit entries.

**Query Parameters:**
- `userId`
- `actionType`
- `entityType`
- `startDate`, `endDate`
- `securityLevel`

##### GET /api/audit-trail/export
Export audit log (JSON or CSV).

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Security
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Stored in Cloudflare Workers environment variable
- **Expiration:** 24 hours
- **Refresh:** Not implemented (user must re-login)

#### Password Security
- **Hashing:** bcrypt with salt rounds = 10
- **Minimum Length:** 8 characters
- **Complexity:** Not enforced (recommended: upper, lower, number, special)
- **Storage:** Only hash stored, never plain text

#### Session Management
- **Type:** Stateless (JWT)
- **Storage:** Client-side (localStorage)
- **Transmission:** HTTPS only
- **CSRF Protection:** Not required (stateless tokens)

### Input Validation

All user inputs are validated on:
1. **Client-side:** Basic validation for UX
2. **Server-side:** Comprehensive validation (never trust client)

**Validation Rules:**
- RFC format: `/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/`
- Email format: Standard RFC 5322
- UUID format: Standard UUID v4
- Date format: ISO 8601 (YYYY-MM-DD)
- Amount: Positive number, max 2 decimals
- SQL Injection: Parameterized queries only
- XSS: HTML escaped on output

### Data Protection

#### Encryption at Rest
- **Database:** Cloudflare D1 encryption (managed by Cloudflare)
- **Files:** Cloudflare R2 encryption (managed by Cloudflare)

#### Encryption in Transit
- **HTTPS:** Enforced on all connections
- **TLS Version:** 1.2 or higher
- **Certificate:** Managed by Cloudflare

#### Sensitive Data Handling
- **Passwords:** bcrypt hashed
- **JWT Secret:** Environment variable
- **RFCs:** Stored as-is (required for fiscal operations)
- **CFDIs:** Stored in R2 with access control

### Access Control

#### Role-Based Access Control (RBAC)
- **user:** Regular user, access to own data only
- **admin:** System administrator, access to all data

#### Resource Authorization
- Users can only access their own resources
- Enforced on every API call via JWT userId
- Checked in middleware before business logic

### Audit Logging

All security-relevant actions are logged:
- **Authentication:** Login attempts (success/failure)
- **Authorization:** Access denials
- **Data Modification:** Create, update, delete operations
- **Configuration Changes:** System parameter updates
- **File Operations:** Upload, download, delete

**Log Retention:** 1 year minimum

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS Policy

```javascript
{
  "Access-Control-Allow-Origin": "https://avanta-finance.pages.dev",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

---

## Deployment Guide

### Prerequisites

1. **Cloudflare Account**
   - Pages enabled
   - Workers enabled
   - D1 database created
   - R2 bucket created

2. **Development Environment**
   - Node.js 18+ installed
   - npm 9+ installed
   - Git installed
   - Wrangler CLI installed: `npm install -g wrangler`

### Initial Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/avanta-coinmaster.git
cd avanta-coinmaster
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Wrangler
Create `wrangler.toml`:
```toml
name = "avanta-finance"
main = "functions/api/**/*.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "avanta-finance-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "avanta-finance-files"
```

#### 4. Set Environment Variables
```bash
wrangler secret put JWT_SECRET
# Enter a strong random secret (32+ characters)

wrangler secret put DATABASE_URL
# Enter your D1 connection string
```

#### 5. Initialize Database
```bash
# Apply migrations in order
wrangler d1 execute avanta-finance-db --file=migrations/001_add_categories_and_update_accounts.sql
wrangler d1 execute avanta-finance-db --file=migrations/002_add_advanced_transaction_classification.sql
# ... continue for all 30 migrations
```

Or use the script:
```bash
./scripts/apply-migrations.sh
```

#### 6. Seed Initial Data
```bash
wrangler d1 execute avanta-finance-db --file=seed.sql
```

### Build & Deploy

#### Development Build
```bash
npm run dev
# Opens http://localhost:5173
```

#### Production Build
```bash
npm run build
# Builds to ./dist directory
```

#### Deploy to Cloudflare Pages
```bash
npm run deploy
# or
wrangler pages deploy dist
```

### CI/CD with GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: avanta-finance
          directory: dist
```

### Post-Deployment Verification

1. **Health Check**
   ```bash
   curl https://avanta-finance.pages.dev/api/health
   ```

2. **Run Tests**
   ```bash
   node scripts/test-financial-calculations.js
   node scripts/test-end-to-end.js
   ```

3. **Test Authentication**
   - Register test user
   - Login
   - Verify JWT token

4. **Test File Upload**
   - Upload sample CFDI
   - Verify R2 storage
   - Download file

---

## Maintenance Guide

### Regular Maintenance Tasks

#### Daily
- Monitor error logs
- Check system health
- Review failed operations

#### Weekly
- Review audit logs
- Check storage usage
- Monitor API performance
- Review security alerts

#### Monthly
- Database backup
- Performance optimization
- Security patch updates
- User feedback review

#### Annually
- Update fiscal parameters (UMA, ISR tariffs)
- Update SAT catalog (if changed)
- Security audit
- Full system backup

### Database Maintenance

#### Backup
```bash
# Export full database
wrangler d1 export avanta-finance-db --output=backup-$(date +%Y%m%d).sql

# Download for local storage
wrangler d1 execute avanta-finance-db --command=".dump" > backup.sql
```

#### Restore
```bash
wrangler d1 execute avanta-finance-db --file=backup-20250319.sql
```

#### Optimization
```sql
-- Analyze tables for query optimization
ANALYZE;

-- Rebuild indexes (if needed)
REINDEX;

-- Vacuum (reclaim space)
VACUUM;
```

### Monitoring

#### Key Metrics
- **API Response Time:** <200ms average
- **Error Rate:** <1%
- **Database Query Time:** <50ms average
- **Storage Usage:** Monitor R2 and D1 limits
- **Active Users:** Track daily/monthly active users

#### Logging
- Application logs: Cloudflare Workers logs
- Access logs: Cloudflare Analytics
- Error tracking: Custom error handler
- Audit logs: `audit_trail` table

### Troubleshooting

#### Common Issues

**1. JWT Token Expired**
- Symptom: 401 Unauthorized errors
- Solution: User must re-login

**2. Database Connection Failed**
- Check D1 binding in wrangler.toml
- Verify database ID is correct
- Check Cloudflare dashboard for D1 status

**3. CFDI Upload Failed**
- Check R2 bucket permissions
- Verify file size <10MB
- Check XML format validity

**4. Tax Calculation Incorrect**
- Verify fiscal parameters are up to date
- Check transaction classifications
- Review deductibility percentages
- Consult audit trail for data changes

### Update Procedures

#### Update Fiscal Parameters
1. Edit `migrations/seed_fiscal_parameters.sql`
2. Update UMA values for new year
3. Update ISR tariff tables if changed
4. Apply migration:
   ```bash
   wrangler d1 execute avanta-finance-db --file=migrations/seed_fiscal_parameters.sql
   ```

#### Update SAT Catalog
1. Download updated Anexo 24 from SAT
2. Convert to SQL INSERT statements
3. Create new migration file
4. Apply migration

#### Code Updates
1. Create feature branch
2. Implement changes
3. Run tests locally
4. Create pull request
5. Review and merge to main
6. GitHub Actions deploys automatically

---

## Development Guide

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/avanta-coinmaster.git
cd avanta-coinmaster

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start local Workers
wrangler dev
```

### Project Structure

```
avanta-coinmaster/
├── functions/           # Cloudflare Workers functions
│   └── api/            # API endpoints
│       ├── auth.js
│       ├── transactions.js
│       ├── cfdi-management.js
│       └── ...
├── migrations/         # Database migrations
│   ├── 001_*.sql
│   ├── 002_*.sql
│   └── ...
├── scripts/           # Utility scripts
│   ├── test-*.js
│   └── apply-migrations.sh
├── src/               # Frontend source
│   ├── components/    # React components
│   ├── pages/        # Page components
│   ├── stores/       # Zustand stores
│   ├── utils/        # Utility functions
│   ├── App.jsx       # Main app component
│   └── main.jsx      # Entry point
├── public/           # Static assets
├── package.json
├── vite.config.js
└── wrangler.toml
```

### Coding Standards

#### JavaScript/React
- **Style Guide:** Airbnb JavaScript Style Guide
- **Formatting:** Prettier (automatic on save)
- **Linting:** ESLint
- **Naming:**
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case or PascalCase (components)

#### SQL
- **Keywords:** UPPERCASE
- **Identifiers:** snake_case
- **Indentation:** 2 spaces
- **Always use parameterized queries**

#### Git Commit Messages
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat(cfdi): Add automatic linking to transactions

Implement auto-matching algorithm that compares UUID,
amount, and date to link CFDIs automatically.

Closes #123
```

### Testing

#### Unit Tests
Currently minimal. To add:
- Use Vitest
- Test utility functions
- Test calculation logic

#### Integration Tests
```bash
node scripts/test-end-to-end.js
node scripts/test-financial-calculations.js
```

#### Manual Testing Checklist
- [ ] User registration and login
- [ ] Create income transaction
- [ ] Create expense transaction
- [ ] Upload CFDI XML
- [ ] Link CFDI to transaction
- [ ] Upload bank statement CSV
- [ ] Reconcile transactions
- [ ] Calculate monthly ISR/IVA
- [ ] Generate DIOT
- [ ] Generate Contabilidad Electrónica
- [ ] Generate annual declaration
- [ ] Check compliance monitoring
- [ ] Upload document to archive
- [ ] Review audit trail

### Adding New Features

#### 1. Database Changes
- Create new migration file in `migrations/`
- Follow naming: `XXX_description.sql`
- Include: tables, indexes, views, triggers
- Test migration on local D1

#### 2. Backend API
- Create/update file in `functions/api/`
- Implement CRUD operations
- Add input validation
- Add error handling
- Add audit logging
- Test with curl or Postman

#### 3. Frontend Component
- Create component in `src/components/`
- Use Tailwind for styling
- Support dark mode
- Make responsive (mobile-first)
- Add to navigation if needed
- Add route in `src/App.jsx`

#### 4. Documentation
- Update USER_GUIDE.md for user-facing features
- Update TECHNICAL_DOCUMENTATION.md for developer features
- Add JSDoc comments to complex functions
- Update API documentation

### Performance Optimization

#### Frontend
- Lazy load routes: `React.lazy()`
- Optimize images: Use WebP, compress
- Minimize bundle size: Check with `npm run build`
- Use virtual scrolling for long lists
- Debounce search inputs

#### Backend
- Use database indexes effectively
- Limit query result sets
- Use pagination
- Cache fiscal parameters
- Optimize SQL queries

#### Database
- Regular ANALYZE and VACUUM
- Monitor query performance
- Add indexes for common queries
- Avoid N+1 queries
- Use batch operations when possible

---

## Appendix

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| AUTH_001 | Invalid credentials | 401 |
| AUTH_002 | Token expired | 401 |
| AUTH_003 | Invalid token | 401 |
| AUTH_004 | Insufficient permissions | 403 |
| VAL_001 | Validation error | 400 |
| VAL_002 | Missing required field | 400 |
| VAL_003 | Invalid format | 400 |
| DB_001 | Database error | 500 |
| DB_002 | Record not found | 404 |
| DB_003 | Duplicate record | 409 |
| FILE_001 | File upload error | 500 |
| FILE_002 | File too large | 413 |
| FILE_003 | Invalid file type | 400 |
| CFDI_001 | Invalid CFDI XML | 400 |
| CFDI_002 | Duplicate UUID | 409 |
| TAX_001 | Calculation error | 500 |

### Database Indexes Summary

**High Priority (performance critical):**
- transactions(user_id, date)
- transactions(cfdi_uuid)
- cfdi_metadata(uuid)
- cfdi_metadata(user_id, fecha_emision)
- tax_calculations(user_id, fiscal_year, fiscal_month)
- bank_statements(user_id, date)

**Medium Priority:**
- audit_trail(user_id, timestamp)
- compliance_monitoring(user_id, fiscal_year, fiscal_month)
- digital_archive(user_id, document_type)

### Configuration Parameters

**Database:**
- Max connections: 100
- Query timeout: 30s
- Transaction timeout: 60s

**File Storage:**
- Max file size: 10 MB
- Allowed types: PDF, XML, JPG, PNG
- Retention: 5 years default

**API:**
- Rate limit: 100 requests/minute/user
- Timeout: 30s
- Max payload: 10 MB

**Security:**
- Password min length: 8
- JWT expiration: 24 hours
- Session timeout: 24 hours
- Max login attempts: 5 (lockout 15 minutes)

---

**Document Version:** 1.0  
**Last Updated:** October 19, 2025  
**Maintained By:** Development Team

For questions or clarifications, please create an issue in the GitHub repository.
