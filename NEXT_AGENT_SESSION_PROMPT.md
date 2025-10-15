# 🤖 GitHub Copilot Agent Session Prompt - Avanta Finance
## Phase 0: Security and Authentication (Blocking Priority)

## Project Context
You are working on **Avanta Finance**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. We're implementing a comprehensive new plan to evolve the system into a robust, secure, and scalable financial platform.

## Current Status
- ✅ **Previous Implementation:** Complete Avanta CoinMaster 2.0 with all phases implemented
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ✅ **New Plan:** Comprehensive implementation plan with 5 phases

## This Session: Phase 0 - Security and Authentication (BLOCKING PRIORITY)

**CRITICAL:** This phase is blocking - no other phases should proceed without proper security implementation.

**Objective:** Protect application access and ensure each user can only see and manage their own data.

### Tasks to Implement (3 total):

#### 0.1. Implement User Authentication
- **Option A (Recommended):** Use **Cloudflare Access** with identity provider (Google, GitHub, etc.)
- **Option B:** Integrate service like **Auth0** or **Clerk**
- **Result:** Application will have login screen and only authenticated users can access

#### 0.2. Modify Database Schema for Multi-tenancy
- **Action:** Add `user_id` (TEXT NOT NULL) column to all user data tables
- **Tables Affected:** `accounts`, `transactions`, `categories`, `invoices`, and all new tables
- **Example Schema:**
  ```sql
  CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### 0.3. Secure API Endpoints
- **Action:** Validate authentication token (JWT) in each backend function (`/functions/api/**/*.js`)
- **Logic:** Extract `user_id` from validated token
- **Action:** Modify all SQL queries to include `WHERE user_id = ?` clause
- **Example:**
  ```javascript
  // Before
  const { results } = await env.DB.prepare("SELECT * FROM accounts").all();
  
  // After
  const userId = await getUserIdFromToken(request);
  const { results } = await env.DB.prepare("SELECT * FROM accounts WHERE user_id = ?").bind(userId).all();
  ```

### Files to Create/Modify:

#### New Components (2):
- **NEW:** `src/components/LoginForm.jsx` - Authentication interface
- **NEW:** `src/components/AuthProvider.jsx` - Authentication context provider

#### Enhanced Components (4):
- `src/App.jsx` - Add authentication routing and protection
- `src/pages/Home.jsx` - Add user-specific data loading
- `src/components/TransactionTable.jsx` - Add user filtering
- `src/components/AddTransaction.jsx` - Add user context

#### Backend APIs (1):
- **NEW:** `functions/api/auth.js` - Authentication endpoints and JWT handling

#### Database Schema:
- `schema.sql` - Add `user_id` columns to all tables
- **NEW:** `migrations/004_add_user_authentication.sql` - Multi-tenancy migration

#### New Utilities (2):
- **NEW:** `src/utils/auth.js` - Authentication utilities and token management
- **NEW:** `src/utils/userContext.js` - User context and data filtering

## Implementation Plan

### Step 1: Authentication System (1,500 lines)
- Implement Cloudflare Access integration (recommended)
- Create login/logout functionality
- Add JWT token management
- Implement authentication context provider
- Add protected route handling

### Step 2: Database Multi-tenancy (1,000 lines)
- Add `user_id` columns to all existing tables
- Create migration script for existing data
- Update all database queries to include user filtering
- Handle data migration for existing users

### Step 3: API Security (1,200 lines)
- Add JWT validation to all API endpoints
- Implement user context extraction
- Update all SQL queries with user filtering
- Add authentication middleware
- Handle unauthorized access scenarios

### Step 4: Frontend Integration (800 lines)
- Add authentication routing
- Implement user-specific data loading
- Add logout functionality
- Update all components to use user context
- Add authentication state management

## Key Files to Know - READ THESE FIRST

### **CRITICAL: Official Implementation Plan**
- **`docs/IMPLEMENTATION_PLAN.md`** - THE OFFICIAL PLAN (read this first!)
  - Phase 0 is blocking priority - no other phases without security
  - Follow only what's explicitly stated in the plan
  - Do NOT add features not in this plan

### **Current Project Status**
- **`docs/archive/IMPLEMENTATION_SUMMARY.md`** - Previous implementation status
- **`README.md`** - Current project overview

### **Code Files**
- `src/App.jsx` - Main application component
- `functions/api/transactions.js` - Example API endpoint
- `schema.sql` - Database schema

## Session Guidelines

### **Session Length:** 50 minutes maximum
### **Code Output:** 4,500+ lines of production-ready code
### **Documentation:** Update implementation summary after completion

## Development Commands
```bash
# Local development
npm run dev

# Build for production
npm run build

# Test with Cloudflare backend
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Run tests
./scripts/test-production.sh https://avanta-finance.pages.dev
```

## Success Criteria
- ✅ User authentication system working
- ✅ Database schema updated with `user_id` columns
- ✅ All API endpoints secured with user filtering
- ✅ Frontend authentication routing implemented
- ✅ Multi-tenancy working correctly
- ✅ Existing data migrated properly
- ✅ No unauthorized access possible
- ✅ Login/logout functionality working
- ✅ User context available throughout app
- ✅ No breaking changes to existing functionality

## Testing Checklist
1. **Authentication:**
   - Test login with valid credentials
   - Test logout functionality
   - Test protected route access
   - Test unauthorized access handling

2. **Database Multi-tenancy:**
   - Test user data isolation
   - Test migration of existing data
   - Test user-specific queries
   - Test data integrity

3. **API Security:**
   - Test JWT validation
   - Test user context extraction
   - Test unauthorized API access
   - Test user-specific data filtering

4. **Frontend Integration:**
   - Test authentication state management
   - Test user-specific data loading
   - Test protected route navigation
   - Test logout and session management

## Database Schema Changes Required

### Add user_id to all tables:
```sql
-- Add user_id column to existing tables
ALTER TABLE accounts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';
ALTER TABLE transactions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';
ALTER TABLE categories ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';
ALTER TABLE invoices ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Update indexes to include user_id
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
```

## Authentication Implementation

### Cloudflare Access (Recommended)
- Integrate with Cloudflare Access
- Use identity providers (Google, GitHub)
- Handle JWT tokens from Cloudflare
- Implement user context extraction

### Alternative: Auth0/Clerk
- Integrate with Auth0 or Clerk
- Handle authentication flow
- Manage user sessions
- Implement token validation

## API Security Features
- JWT token validation on all endpoints
- User context extraction from tokens
- SQL query modification with user filtering
- Unauthorized access handling
- Session management

## Frontend Security Features
- Protected route implementation
- Authentication state management
- User context provider
- Login/logout functionality
- Session persistence

## Next Steps After This Session
- **Phase 1:** Business vs Personal logic (classification)
- **Phase 2:** Credits and debts module
- **Phase 3:** Technical improvements and scalability
- **Phase 4:** Advanced features (budgets, fiscal improvements)

## Important Notes
- **BLOCKING PRIORITY** - This phase must be completed before others
- **Security First** - No real data handling without proper security
- **Multi-tenancy** - Ensure complete user data isolation
- **Migration** - Handle existing data properly
- **Performance** - Maintain performance with security
- **Documentation** - Update all relevant documentation

## Previous Implementation Context
The previous Avanta CoinMaster 2.0 implementation included:
- ✅ Complete transaction management
- ✅ Mexican tax calculations
- ✅ Account reconciliation
- ✅ Automation features
- ✅ Advanced analytics
- ✅ Production deployment

**Ready to implement security and authentication as the foundation for the new system! 🚀**

## Session Scope Summary
- **3 Official Tasks** from the plan
- **2 New Components** to create
- **4 Existing Components** to enhance
- **1 New Backend API** to create
- **2 New Utilities** to create
- **4,500+ Lines** of code expected
- **Complete Phase 0** implementation
- **Security foundation** for all future phases