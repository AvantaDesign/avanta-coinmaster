# 🤖 GitHub Copilot Agent Session Prompt - Avanta Finance
## Phase 1: Critical Security Hardening

## Project Context
You are working on **Avanta Finance**, a comprehensive financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. **ALL CORE PHASES ARE COMPLETE** - the application is now a full-featured financial management system.

## Current Status - PROJECT COMPLETE ✅
- ✅ **Phase 0: COMPLETE** - Security and authentication implemented
- ✅ **Phase 1: COMPLETE** - Business vs Personal classification implemented
- ✅ **Phase 2: COMPLETE** - Credits and debts module implemented
- ✅ **Phase 3: COMPLETE** - Technical improvements and scalability implemented
- ✅ **Phase 4: COMPLETE** - Advanced features (budgeting, fiscal simulation, invoice reconciliation)
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ✅ **Total Implementation:** 20,000+ lines of production code

## This Session: Phase 1 - Critical Security Hardening

**Objective:** Implement the first phase of security remediation to address critical security vulnerabilities in authentication and authorization.

**CRITICAL:** This is Phase 1 of NEW security remediation work. Focus ONLY on the three tasks below.

### Phase 1 Tasks:

#### Task 1.1: Implement Secure Password Hashing with Web Crypto API
- Create `hashPassword(password)` function using `crypto.subtle.digest` with SHA-256
- Create `verifyPassword(password, hash)` function with constant-time comparison
- Generate unique salt for each password using `crypto.getRandomValues`
- Update user registration and login logic in `functions/api/auth.js`
- Create database migration script for existing plaintext passwords

#### Task 1.2: Secure JWT Implementation with `jose` library
- Add `jose` dependency to project
- Replace custom JWT implementation with `jose.SignJWT`
- Implement proper JWT generation with headers, expiration, issuer, audience
- Replace JWT verification with `jose.jwtVerify`
- Use secure secret key handling with `TextEncoder`

#### Task 1.3: Enforce Global Authentication and Authorization
- Create authentication middleware in `functions/_worker.js`
- Apply middleware to all protected routes
- Scope all database queries with `user_id` filtering
- Prevent cross-user data access
- Ensure 401 responses for unauthorized access

## Implementation Guidelines

### **Session Length:** 45-60 minutes maximum
### **Code Output:** Production-ready Phase 1 security fixes
### **Documentation:** Update security documentation

## Key Files to Modify (Phase 1 Only)

### **Primary Files**
- **`functions/api/auth.js`** - Password hashing, JWT implementation
- **`functions/_worker.js`** - Authentication middleware
- **`functions/api/accounts.js`** - User-scoped database queries
- **`functions/api/categories.js`** - User-scoped database queries
- **`functions/api/transactions.js`** - User-scoped database queries

### **Dependencies to Add**
- **`jose`** - Secure JWT implementation (Cloudflare Workers compatible)

### **New Files to Create**
- **`migrations/password_hash_migration.sql`** - Database migration for password hashing

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

## Success Criteria for Phase 1
- ✅ **Task 1.1 Complete:** All passwords properly hashed with salt using Web Crypto API
- ✅ **Task 1.2 Complete:** JWT implementation secure with `jose` library
- ✅ **Task 1.3 Complete:** Global authentication middleware implemented and applied
- ✅ **All endpoints protected** - Unauthorized access returns 401
- ✅ **User data scoped** - All database queries filtered by `user_id`
- ✅ **Existing functionality maintained** - No regressions introduced
- ✅ **Migration script created** - For existing password conversion

## Testing Checklist for Phase 1
1. **Password Hashing Testing:**
   - New user registration hashes password correctly
   - Login works with hashed passwords
   - Salt is unique for each password
   - Constant-time comparison implemented

2. **JWT Security Testing:**
   - JWT tokens generated with `jose` library
   - Token verification works correctly
   - Expired tokens properly rejected
   - Invalid tokens properly rejected

3. **Authentication Testing:**
   - Unauthorized access returns 401
   - All protected endpoints require valid token
   - User data properly scoped and isolated
   - Cross-user data access prevented

4. **Integration Testing:**
   - All existing features still work
   - Login/logout flow works correctly
   - No performance degradation
   - Error handling improved

## Next Steps After This Session
- **Phase 1 Complete** - Critical security vulnerabilities fixed
- **Authentication Hardened** - Passwords hashed, JWT secure, global auth enforced
- **User Data Protected** - All endpoints properly secured
- **Ready for Phase 2** - Data integrity and calculation accuracy
- **Documentation Updated** - Security fixes documented

## Important Notes
- **Phase 1 Focus** - Complete ONLY the three tasks listed above
- **Security First** - All fixes maintain production quality
- **Backward Compatibility** - Existing functionality preserved
- **Testing Required** - All fixes must be tested and verified
- **Documentation Required** - Security changes must be documented

## Previous Implementation Context
All phases have been successfully completed:
- ✅ Phase 0: Usability & Flow Improvements (3,000+ lines)
- ✅ Phase 1: Advanced Transaction Classification (2,500+ lines)
- ✅ Phase 2: Fiscal Module & Reconciliation (3,000+ lines)
- ✅ Phase 3: Automation & AR/AP (4,000+ lines)
- ✅ Phase 4: Advanced Analytics & UX (5,500+ lines)

**Total: 20,000+ lines of production-ready code**

**Ready to implement Phase 1 security hardening! 🔒**

## Session Scope Summary
- **Phase 1 Only** - Focus on critical security hardening tasks
- **Password Security** - Implement secure hashing with Web Crypto API
- **JWT Security** - Replace custom JWT with `jose` library
- **Global Authentication** - Enforce authentication on all endpoints
- **User Data Protection** - Scope all queries with user_id filtering
- **Production Ready** - Maintain system stability while fixing security
- **Complete System** - Build upon solid foundation with Phase 1 security fixes
