# Phase 31: Backend Audit and Hardening

**IMPORTANT**: This phase should only be started after Phase 30 is fully completed (100%). Currently, Phase 30 is at 70% completion with backend API refactoring still in progress. Please complete Phase 30 first.

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at the repository root.

## Implementation Plan Reference

**CRITICAL**: Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V8.md` for complete project context and progress tracking.

### Previous Phases Status
✅ **Phases 17-29**: COMPLETED (Comprehensive financial management system)
🟡 **Phase 30**: PARTIALLY COMPLETE (70% - Critical Infrastructure and Data Hardening)
  - ✅ Database migration script created (25 tables)
  - ✅ Monetary utility functions implemented
  - ✅ Environment isolation configured
  - 🔄 Backend API refactoring in progress (2/42 files complete)
  - See `PHASE_30_HARDENING_SUMMARY.md` for details

🚧 **Phase 31**: CURRENT PHASE (Backend Audit and Hardening)

## Current Task: Phase 31 - Backend Audit and Hardening

### Goal

Ensure the backend logic is atomic, secure, and fault-tolerant, guaranteeing no data leaks between users or inconsistent data states.

### Prerequisites

Before starting Phase 31, verify:
- [ ] Phase 30 is 100% complete (all API files refactored for monetary cents)
- [ ] Migration 033 has been successfully applied to database
- [ ] All financial calculations tested and verified accurate
- [ ] Build passes: `npm run build`

### Context from Previous Phases

Phase 30 established critical data integrity foundations:
- ✅ Monetary values stored as INTEGER cents (eliminating floating-point errors)
- ✅ Preview and production database environments separated
- ✅ Comprehensive monetary conversion utilities in place

Phase 31 builds on this foundation by ensuring:
- 🎯 Complete user data isolation
- 🎯 Atomic database transactions
- 🎯 Secure file upload validation

## Actionable Steps

### 1. Data Isolation and Soft-Deletes Audit

**Objective**: Ensure zero possibility of cross-user data leakage and proper handling of deleted records.

#### Tasks:

**A. User Data Isolation Audit**
1. **Scan all API functions** in `/functions/api/`:
   ```bash
   grep -r "prepare(" functions/api/ --include="*.js"
   ```

2. **For each database query**, verify:
   - ✅ Queries accessing user-specific data include `WHERE user_id = ?`
   - ✅ User ID is bound from authenticated token, never from request
   - ✅ No queries use user_id from request body/query params without validation
   - ❌ Flag any query missing user_id filter

3. **Create audit report**: `PHASE_31_USER_ISOLATION_AUDIT.md`
   - List all queries reviewed
   - Document any violations found
   - Show before/after code for fixes
   - Confirm 100% compliance

**B. Soft-Delete Compliance Audit**
1. **Identify all queries reading transactions table**:
   ```bash
   grep -r "FROM transactions" functions/api/ --include="*.js"
   ```

2. **For each query**, verify:
   - ✅ Includes `WHERE is_deleted = 0` or `WHERE (is_deleted IS NULL OR is_deleted = 0)`
   - ✅ Or explicitly handles deleted records (e.g., admin views)
   - ❌ Flag any query not filtering soft-deleted records

3. **Update queries** that fail compliance:
   ```javascript
   // BEFORE (WRONG):
   SELECT * FROM transactions WHERE user_id = ?
   
   // AFTER (CORRECT):
   SELECT * FROM transactions 
   WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = 0)
   ```

**C. Other Soft-Delete Tables**
Check if other tables use soft-delete pattern:
- `accounts` (is_active flag)
- `invoices` (status flag)
- `budgets` (is_active flag)
- `categories` (is_active flag)

Ensure filtering is consistent.

#### Verification:
- [ ] All user data queries include user_id filter
- [ ] All transaction queries filter soft-deleted records
- [ ] Audit report created with 100% compliance
- [ ] No cross-user data leakage possible

---

### 2. Implementation of Atomic Transactions

**Objective**: Ensure database consistency by wrapping multi-step operations in atomic transactions.

#### Tasks:

**A. Identify Multi-Write Operations**

Scan codebase for operations that:
1. Create/update multiple related records
2. Update balances and create transactions
3. Link invoices and update transaction status
4. Create recurring items and schedules

**Common patterns requiring atomicity**:
```javascript
// PATTERN 1: Create transaction + Update account balance
// PATTERN 2: Create invoice + Link to transaction
// PATTERN 3: Create payment + Update receivable/payable
// PATTERN 4: Create recurring schedule + Generate instances
```

**B. Refactor to Use D1 Batch Transactions**

Cloudflare D1 supports atomic batches via `db.batch()`:

```javascript
// BEFORE (NON-ATOMIC):
await env.DB.prepare('INSERT INTO transactions ...').bind(...).run();
await env.DB.prepare('UPDATE accounts SET balance = ...').bind(...).run();
// ❌ If second query fails, first is committed (inconsistent state)

// AFTER (ATOMIC):
const batch = [
  env.DB.prepare('INSERT INTO transactions ...').bind(...),
  env.DB.prepare('UPDATE accounts SET balance = ...').bind(...)
];
const results = await env.DB.batch(batch);
// ✅ Both succeed or both fail (consistent state)
```

**C. Critical Operations to Refactor**

Priority list:
1. **Transaction creation with account balance update**
   - File: `functions/api/transactions.js`
   - Operation: POST handler
   - Add atomic batch for transaction + account update

2. **Payment processing**
   - Files: `functions/api/receivables.js`, `functions/api/payables.js`
   - Operation: Record payment + update balance + link transaction
   - Wrap in atomic batch

3. **Invoice reconciliation**
   - File: `functions/api/invoice-reconciliation.js`
   - Operation: Link invoice + update transaction + update amounts
   - Wrap in atomic batch

4. **Recurring payment generation**
   - Files: `functions/api/recurring-freelancers.js`, `functions/api/recurring-services.js`
   - Operation: Create transactions + update schedules
   - Wrap in atomic batch

**D. Error Handling**

Implement proper error handling for batch operations:
```javascript
try {
  const results = await env.DB.batch(batch);
  
  // Check if all succeeded
  const allSucceeded = results.every(r => r.success);
  if (!allSucceeded) {
    throw new Error('Batch operation partially failed');
  }
  
  return { success: true, data: results };
} catch (error) {
  // All changes automatically rolled back
  console.error('Atomic transaction failed:', error);
  return { success: false, error: error.message };
}
```

#### Verification:
- [ ] All multi-write operations identified
- [ ] Critical operations refactored to use batch()
- [ ] Integration tests created for rollback scenarios
- [ ] Manual testing of failure scenarios
- [ ] No partial database updates possible

---

### 3. Backend File Upload Validation

**Objective**: Prevent malicious file uploads by validating before interacting with R2 storage.

#### Tasks:

**A. Locate Upload Endpoint**

File: `functions/api/upload.js` or similar

**B. Implement Validation Middleware**

```javascript
// Add validation BEFORE R2 interaction

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // 1. Extract file from request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400
      });
    }
    
    // 2. VALIDATE FILE SIZE (from env vars)
    const maxSizeMB = parseInt(env.MAX_FILE_SIZE_MB || '10');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return new Response(JSON.stringify({ 
        error: `File too large. Max size: ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE'
      }), {
        status: 400
      });
    }
    
    // 3. VALIDATE MIME TYPE (from env vars)
    const allowedTypes = (env.ALLOWED_FILE_TYPES || '').split(',');
    const fileType = file.type.toLowerCase();
    
    const isAllowed = allowedTypes.some(type => {
      const cleanType = type.trim().toLowerCase();
      return fileType === cleanType || fileType.includes(cleanType);
    });
    
    if (!isAllowed) {
      return new Response(JSON.stringify({ 
        error: `File type not allowed: ${file.type}`,
        allowed: allowedTypes,
        code: 'INVALID_FILE_TYPE'
      }), {
        status: 400
      });
    }
    
    // 4. VALIDATE FILE NAME (prevent directory traversal)
    const fileName = file.name;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file name',
        code: 'INVALID_FILE_NAME'
      }), {
        status: 400
      });
    }
    
    // 5. NOW safe to upload to R2
    const key = `uploads/${Date.now()}-${fileName}`;
    await env.RECEIPTS.put(key, file);
    
    return new Response(JSON.stringify({
      success: true,
      url: key
    }), {
      status: 200
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
}
```

**C. Test Validation**

Create test cases:
1. Upload file larger than MAX_FILE_SIZE_MB → Should be rejected
2. Upload file with disallowed MIME type → Should be rejected
3. Upload file with path traversal in name (../../etc/passwd) → Should be rejected
4. Upload valid file → Should succeed

#### Verification:
- [ ] File size validation implemented
- [ ] MIME type validation implemented  
- [ ] File name validation implemented
- [ ] Validation occurs BEFORE R2 interaction
- [ ] Error messages are clear and helpful
- [ ] Test cases pass (manual or automated)

---

## Progress Tracking

**MANDATORY**: Update `IMPLEMENTATION_PLAN_V8.md` with checkmarks (✅) as you complete each task.

**MANDATORY**: Create completion summary `PHASE_31_AUDIT_SUMMARY.md` when finished.

## Technical Considerations

- Follow existing code patterns and conventions
- Implement comprehensive error handling
- Use proper logging for audit trail
- Consider performance implications
- Test rollback scenarios thoroughly
- Document all changes clearly

## Security Considerations

- Validate all user inputs
- Never trust client-provided user IDs
- Always use authenticated user ID from token
- Implement proper access controls
- Log security-relevant events
- Follow principle of least privilege

## Testing Requirements

### Unit Tests
- User isolation for each API function
- Soft-delete filtering correctness
- File validation edge cases

### Integration Tests
- Atomic transaction rollback scenarios
- Multi-user data isolation
- File upload validation

### Security Tests
- Cross-user data access attempts
- Invalid file upload attempts
- SQL injection attempts on user_id

## Deliverables

Upon completion of Phase 31:

1. **Audit Reports**:
   - `PHASE_31_USER_ISOLATION_AUDIT.md` - Complete user data isolation audit
   - `PHASE_31_ATOMIC_OPERATIONS_AUDIT.md` - List of refactored operations

2. **Code Changes**:
   - All API files with user queries updated
   - Critical operations refactored for atomicity
   - Upload validation implemented

3. **Documentation**:
   - `PHASE_31_AUDIT_SUMMARY.md` - Phase completion summary
   - Updated `IMPLEMENTATION_PLAN_V8.md`

4. **Tests**:
   - Integration tests for atomic transactions
   - Security tests for data isolation
   - Upload validation tests

## Success Criteria

- ✅ 100% of user data queries include user_id filter
- ✅ 100% of transaction queries filter soft-deleted records
- ✅ All multi-write operations are atomic
- ✅ File uploads validated before R2 interaction
- ✅ All tests passing
- ✅ Security audit complete
- ✅ No regression in existing functionality

## Next Step

Upon successful completion and verification of all Phase 31 tasks, generate and output the complete, self-contained prompt for **Phase 32: Performance and User Experience (UX) Optimization**, following this same instructional format and referencing the updated implementation plan.

---

**Phase Status**: Ready to Start (Pending Phase 30 Completion)
**Estimated Effort**: 6-8 hours
**Priority**: HIGH - Critical for production security and data integrity
