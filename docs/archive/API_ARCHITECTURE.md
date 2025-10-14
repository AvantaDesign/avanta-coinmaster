# Avanta Finance API Architecture

Complete architectural overview of the Cloudflare Workers Functions API.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│  (Browser, Mobile App, External Services, API Consumers)    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Edge Network (CDN)                   │
│                   Global Distribution                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────┐              ┌──────────────────┐
│ Static Files │              │ Workers Functions│
│ (React App)  │              │   (API Endpoints)│
└──────────────┘              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ D1 Database  │  │  R2 Storage  │  │ KV Storage   │
            │   (SQLite)   │  │ (S3-compatible)│ │  (Optional)  │
            └──────────────┘  └──────────────┘  └──────────────┘
```

## 📡 API Endpoints Overview

### Base URL Structure

```
Production:  https://avanta-finance.pages.dev/api
Development: http://localhost:8788/api
```

### Endpoint Hierarchy

```
/api
├── /dashboard [GET, OPTIONS]
│   └── Query: period, include_categories, include_accounts, include_trends, recent_limit
│
├── /transactions [GET, POST, OPTIONS]
│   ├── GET: List transactions (with filters, sorting, pagination)
│   │   └── Query: limit, offset, category, type, account, search, 
│   │       date_from, date_to, amount_min, amount_max, 
│   │       is_deductible, sort_by, sort_order, include_stats
│   │
│   ├── POST: Create transaction
│   │   └── Body: date, description, amount, type, category, account,
│   │       is_deductible, economic_activity, receipt_url
│   │
│   └── /:id [GET, PUT, DELETE]
│       ├── GET: Get single transaction
│       ├── PUT: Update transaction (partial)
│       └── DELETE: Delete transaction (requires ?confirm=true)
│
├── /accounts [GET]
│   └── /:id [PUT]
│       └── PUT: Update account balance
│
├── /fiscal [GET]
│   └── Query: month, year
│
├── /invoices [GET, POST]
│   ├── GET: List invoices
│   └── POST: Create invoice
│
└── /upload [POST]
    └── Multipart: file
```

## 🔄 Request/Response Flow

### Example: Create Transaction

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/transactions
     │ {
     │   "date": "2024-10-14",
     │   "description": "Hosting AWS",
     │   "amount": 1200.00,
     │   "type": "gasto",
     │   "category": "avanta",
     │   "is_deductible": true
     │ }
     ▼
┌─────────────────────────────────────────┐
│   Cloudflare Workers (Edge Runtime)     │
│                                         │
│  1. Parse Request                       │
│     ├─ Extract JSON body                │
│     └─ Parse URL parameters             │
│                                         │
│  2. Validate Input                      │
│     ├─ Check required fields            │
│     ├─ Validate date format             │
│     ├─ Validate amount                  │
│     ├─ Validate enums (type, category)  │
│     └─ Check business rules             │
│                                         │
│  3. Sanitize Data                       │
│     ├─ Trim strings                     │
│     ├─ Convert booleans                 │
│     └─ Handle null values               │
│                                         │
│  4. Database Connection Check           │
│     └─ Verify env.DB exists             │
│                                         │
│  5. Execute Query                       │
│     ├─ Prepare SQL statement            │
│     ├─ Bind parameters                  │
│     └─ Execute INSERT                   │
│                                         │
│  6. Fetch Created Record                │
│     └─ SELECT by last_row_id            │
│                                         │
│  7. Format Response                     │
│     ├─ Build success object             │
│     ├─ Add CORS headers                 │
│     └─ Set HTTP status 201              │
│                                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │ D1 Database  │
         │              │
         │ transactions │
         │   └─ id: 48  │
         │   └─ date    │
         │   └─ desc... │
         │   └─ amount  │
         │   └─ ...     │
         └──────────────┘
                 │
                 │ Response
                 ▼
         ┌──────────────┐
         │    Client    │
         │              │
         │ 201 Created  │
         │ {            │
         │   "success": │
         │   true,      │
         │   "data": {  │
         │     "id": 48 │
         │     ...      │
         │   }          │
         │ }            │
         └──────────────┘
```

## 🔐 Security Architecture

### Input Validation Layers

```
Request Input
     │
     ▼
┌─────────────────────┐
│ Layer 1: JSON Parse │ ← Catch malformed JSON
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Layer 2: Type Check │ ← Verify data types
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Layer 3: Format     │ ← Date formats, lengths
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Layer 4: Business   │ ← Future dates, limits
│         Rules       │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Layer 5: Sanitize   │ ← Trim, normalize
└──────────┬──────────┘
           ▼
     Safe Data
```

### SQL Injection Prevention

```javascript
// ❌ VULNERABLE (not used)
const query = `INSERT INTO transactions VALUES ('${userInput}')`;

// ✅ SAFE (what we use)
const stmt = env.DB.prepare(
  'INSERT INTO transactions (date, description, amount) VALUES (?, ?, ?)'
);
await stmt.bind(date, description, amount).run();
```

### CORS Configuration

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

## 📊 Data Flow Diagrams

### Dashboard Data Aggregation

```
Dashboard Request
        │
        ▼
┌───────────────────┐
│ Parse Parameters  │
│ - period          │
│ - include_*       │
│ - recent_limit    │
└────────┬──────────┘
         │
         ▼
    ┌────────┴────────┐
    │    Parallel     │
    │   Data Fetch    │
    └────┬────┬───┬───┘
         │    │   │
         ▼    ▼   ▼
    ┌─────┐ ┌──────┐ ┌────────┐
    │Accts│ │Trans │ │Category│
    │Summ │ │List  │ │Breakdown│
    └──┬──┘ └───┬──┘ └────┬───┘
       │        │         │
       └────┬───┴────┬────┘
            │        │
            ▼        ▼
      ┌──────────────────┐
      │ Aggregate Data   │
      │ - totalBalance   │
      │ - thisMonth      │
      │ - categories     │
      │ - trends         │
      │ - indicators     │
      └────────┬─────────┘
               │
               ▼
         JSON Response
```

### Transaction List with Filters

```
GET /api/transactions?category=avanta&type=gasto&date_from=2024-01-01
        │
        ▼
┌────────────────────┐
│ Parse Query Params │
│ - Validate enums   │
│ - Validate ranges  │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Build Dynamic SQL  │
│ WHERE 1=1          │
│ AND category = ?   │
│ AND type = ?       │
│ AND date >= ?      │
│ ORDER BY date DESC │
│ LIMIT ? OFFSET ?   │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│ Execute Query      │
│ with Parameters    │
└──────────┬─────────┘
           │
           ├─── if include_stats=true
           │              │
           │              ▼
           │    ┌──────────────────┐
           │    │ Run Stats Query  │
           │    │ COUNT, SUM       │
           │    └────────┬─────────┘
           │             │
           ▼             ▼
┌──────────────────────────────┐
│ Format Response              │
│ {                            │
│   data: [...],               │
│   pagination: {...},         │
│   filters: {...},            │
│   statistics: {...}          │
│ }                            │
└──────────────────────────────┘
```

## 🎯 Error Handling Flow

```
Request
   │
   ▼
Try Block
   │
   ├─── JSON Parse Error ──────────► 400 Bad Request
   │                                 {"error": "Invalid JSON"}
   │
   ├─── Validation Error ──────────► 400 Bad Request
   │                                 {"error": "Validation failed",
   │                                  "details": [...]}
   │
   ├─── Not Found Error ───────────► 404 Not Found
   │                                 {"error": "Transaction not found"}
   │
   ├─── DB Not Configured ─────────► 503 Service Unavailable
   │                                 {"error": "Database unavailable"}
   │
   ├─── Constraint Violation ──────► 409 Conflict
   │                                 {"error": "Duplicate entry"}
   │
   └─── Unexpected Error ──────────► 500 Internal Server Error
                                     {"error": "Internal server error",
                                      "code": "INTERNAL_ERROR"}
```

## 🔄 Transaction State Machine

```
              ┌─────────────┐
              │   Client    │
              │   Request   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  Validate   │
              │             │
              └──┬────────┬─┘
                 │        │
            Valid│        │Invalid
                 │        │
                 ▼        ▼
         ┌──────────┐  ┌────────┐
         │ Sanitize │  │ Reject │
         └─────┬────┘  └────────┘
               │
               ▼
         ┌──────────┐
         │  Insert  │
         └─────┬────┘
               │
               ├─── Success ────► Return Transaction
               │
               └─── Error ──────► Rollback & Error Response
```

## 🚀 Performance Optimization

### Caching Strategy (Future)

```
Request
   │
   ▼
┌──────────────┐
│ Check Cache  │ ← KV Store (Future)
└──┬────────┬──┘
   │        │
   │Hit     │Miss
   │        │
   │        ▼
   │    ┌──────────┐
   │    │   D1     │
   │    │Database  │
   │    └────┬─────┘
   │         │
   │         ▼
   │    ┌──────────┐
   │    │ Set Cache│
   │    └────┬─────┘
   │         │
   └────┬────┘
        │
        ▼
    Response
```

### Query Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Composite index for common queries
CREATE INDEX idx_transactions_category_date 
  ON transactions(category, date DESC);
```

## 📈 Scalability

### Cloudflare Edge Distribution

```
User Request → Closest Edge Location → Workers Function → D1/R2
     ↓              ↓                        ↓              ↓
  Japan         Tokyo DC                Edge Runtime    Global DB
  USA          NYC DC                  Edge Runtime    Global DB
  Europe       London DC               Edge Runtime    Global DB
```

### Rate Limiting (Future Implementation)

```
Request
   │
   ▼
┌──────────────┐
│ Check Rate   │
│ Limit (KV)   │
└──┬────────┬──┘
   │        │
   │OK      │Exceeded
   │        │
   │        ▼
   │    ┌────────┐
   │    │  429   │
   │    │ Reject │
   │    └────────┘
   │
   ▼
Process Request
```

## 🧪 Testing Architecture

### Test Pyramid

```
                 ┌───────────┐
                 │   E2E     │  ← test-api.sh
                 │  Tests    │
                 └─────┬─────┘
              ┌────────┴────────┐
              │  Integration    │  ← API Tests
              │     Tests       │
              └────────┬────────┘
         ┌─────────────┴─────────────┐
         │      Unit Tests           │  ← (Future)
         │  (Functions, Validation)  │
         └───────────────────────────┘
```

### CI/CD Pipeline

```
Git Push
   │
   ▼
GitHub Actions
   │
   ├─── Lint Code
   │
   ├─── Run Tests
   │      └─ test-api.sh
   │
   ├─── Build App
   │      └─ npm run build
   │
   └─── Deploy to Cloudflare
          ├─ Migrations
          ├─ Workers
          └─ Pages
```

## 📚 Documentation Structure

```
Documentation
├── API_DOCUMENTATION.md      (Complete API reference)
├── LOCAL_TESTING.md          (Testing guide)
├── API_ARCHITECTURE.md       (This file)
├── IMPLEMENTATION_SUMMARY.md (Implementation status)
├── SESSION_SUMMARY.md        (Session details)
├── wrangler.toml             (Configuration)
└── test-api.sh               (Test automation)
```

## 🎓 Key Architectural Decisions

### 1. Serverless Functions
**Why:** Zero infrastructure management, automatic scaling, pay-per-use

### 2. D1 (SQLite) Database
**Why:** Low latency, SQL familiarity, ACID compliance, free tier

### 3. Prepared Statements
**Why:** SQL injection prevention, better performance, parameter binding

### 4. CORS Support
**Why:** Enable cross-origin requests from frontend, API integrations

### 5. RESTful Design
**Why:** Standard HTTP methods, predictable endpoints, wide compatibility

### 6. Comprehensive Validation
**Why:** Data integrity, security, better error messages

### 7. Partial Updates (PUT)
**Why:** Flexibility, reduced bandwidth, easier client implementation

### 8. Safety Confirmations (DELETE)
**Why:** Prevent accidental deletions, audit trail

### 9. Pagination
**Why:** Performance with large datasets, better UX

### 10. Statistics on Demand
**Why:** Optional performance optimization, flexibility

---

**Built with ❤️ for Avanta Design**

Last updated: October 14, 2024
