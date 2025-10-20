# Phase 34: Multi-User Architecture - Implementation Guide

**Technical Documentation**  
**Date:** January 2025  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Changes](#database-changes)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Model](#security-model)
6. [API Reference](#api-reference)
7. [Testing Guide](#testing-guide)
8. [Deployment](#deployment)

---

## Overview

Phase 34 implements a complete multi-user architecture with role-based access control (RBAC) for Avanta Finance. This guide provides technical details for developers working with the new admin functionality.

### Key Components

1. **Database:** User roles table column
2. **Backend:** Admin API endpoints with authorization
3. **Frontend:** Admin dashboard and user management interface
4. **Security:** Role-based access control throughout

---

## Database Changes

### Migration 038: User Roles

**File:** `migrations/038_add_user_roles.sql`

```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Assign admin role to first user (account creator)
UPDATE users 
SET role = 'admin' 
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Ensure all other users have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Create index for efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### Schema Changes

**Updated users table:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password TEXT,
    google_id TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- NEW
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT,
    preferences TEXT
);
```

### Applying the Migration

**Preview Environment:**
```bash
wrangler d1 execute avanta-coinmaster-preview --file=migrations/038_add_user_roles.sql
```

**Production Environment:**
```bash
wrangler d1 execute avanta-coinmaster --file=migrations/038_add_user_roles.sql
```

**Verification:**
```sql
-- Check table structure
PRAGMA table_info(users);

-- Verify roles assigned
SELECT id, email, role, created_at FROM users ORDER BY created_at ASC;
```

---

## Backend Implementation

### Admin Authorization Middleware

**Location:** `functions/api/admin/users.js`, `functions/api/admin/users/[id].js`

#### isAdmin Function

Checks if a user has admin role:

```javascript
async function isAdmin(userId, env) {
  if (!userId || !env.DB) {
    return false;
  }
  
  const user = await env.DB.prepare(
    'SELECT role FROM users WHERE id = ? AND is_active = 1'
  ).bind(userId).first();
  
  return user?.role === 'admin';
}
```

#### verifyAdmin Function

Complete authorization check with proper error responses:

```javascript
async function verifyAdmin(request, env) {
  const userId = await getUserIdFromToken(request, env);
  
  if (!userId) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: getSecurityHeaders()
      })
    };
  }
  
  const adminStatus = await isAdmin(userId, env);
  
  if (!adminStatus) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Administrator privileges required',
        code: 'ADMIN_REQUIRED'
      }), {
        status: 403,
        headers: getSecurityHeaders()
      })
    };
  }
  
  return { authorized: true, userId };
}
```

### Using Admin Middleware

In any admin endpoint:

```javascript
export async function onRequestGet(context) {
  const { env, request } = context;
  
  // Verify admin authorization
  const auth = await verifyAdmin(request, env);
  if (!auth.authorized) {
    return auth.response; // Returns 401 or 403
  }
  
  // Proceed with admin logic
  const adminUserId = auth.userId;
  // ...
}
```

### Admin API Endpoints

#### File Structure
```
functions/api/admin/
├── users.js          # List all users (GET)
└── users/
    └── [id].js       # Individual user operations (GET/PUT/DELETE)
```

#### List Users Endpoint

**Endpoint:** `GET /api/admin/users`

**Handler:** `functions/api/admin/users.js`

```javascript
export async function onRequestGet(context) {
  const { env, request } = context;
  
  // Verify admin
  const auth = await verifyAdmin(request, env);
  if (!auth.authorized) return auth.response;
  
  // Get all users (excluding passwords)
  const result = await env.DB.prepare(
    `SELECT id, email, name, role, is_active, created_at, last_login_at, avatar_url
     FROM users
     ORDER BY created_at DESC`
  ).all();
  
  // Log audit event
  await logAuditEvent({
    action: 'admin.users.list',
    userId: auth.userId,
    details: { count: result.results?.length || 0 }
  }, env);
  
  return new Response(JSON.stringify(result.results || []), {
    headers: getSecurityHeaders()
  });
}
```

#### Get User Endpoint

**Endpoint:** `GET /api/admin/users/:id`

**Handler:** `functions/api/admin/users/[id].js`

```javascript
export async function onRequestGet(context) {
  const { env, request, params } = context;
  
  // Verify admin
  const auth = await verifyAdmin(request, env);
  if (!auth.authorized) return auth.response;
  
  const userId = params.id;
  
  // Get user by ID
  const user = await env.DB.prepare(
    `SELECT id, email, name, role, is_active, created_at, last_login_at, avatar_url
     FROM users WHERE id = ?`
  ).bind(userId).first();
  
  if (!user) {
    return new Response(JSON.stringify({
      error: 'User not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: getSecurityHeaders()
    });
  }
  
  return new Response(JSON.stringify(user), {
    headers: getSecurityHeaders()
  });
}
```

#### Update User Endpoint

**Endpoint:** `PUT /api/admin/users/:id`

**Handler:** `functions/api/admin/users/[id].js`

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": 1
}
```

**Implementation:**
```javascript
export async function onRequestPut(context) {
  const { env, request, params } = context;
  
  // Verify admin
  const auth = await verifyAdmin(request, env);
  if (!auth.authorized) return auth.response;
  
  const userId = params.id;
  const data = await request.json();
  const { name, role, is_active } = data;
  
  // Validate role
  if (role && !['user', 'admin'].includes(role)) {
    return new Response(JSON.stringify({
      error: 'Invalid role. Must be "user" or "admin"',
      code: 'VALIDATION_ERROR'
    }), {
      status: 400,
      headers: getSecurityHeaders()
    });
  }
  
  // Build dynamic update query
  const updates = [];
  const params_array = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    params_array.push(sanitizeString(name));
  }
  
  if (role !== undefined) {
    updates.push('role = ?');
    params_array.push(role);
  }
  
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    params_array.push(is_active);
  }
  
  params_array.push(userId);
  
  // Execute update
  const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  await env.DB.prepare(updateQuery).bind(...params_array).run();
  
  // Get updated user
  const updatedUser = await env.DB.prepare(
    `SELECT id, email, name, role, is_active, created_at, last_login_at, avatar_url
     FROM users WHERE id = ?`
  ).bind(userId).first();
  
  // Log audit event
  await logAuditEvent({
    action: 'admin.users.update',
    userId: auth.userId,
    targetId: userId,
    details: { updates: Object.keys(data) }
  }, env);
  
  return new Response(JSON.stringify(updatedUser), {
    headers: getSecurityHeaders()
  });
}
```

#### Deactivate User Endpoint

**Endpoint:** `DELETE /api/admin/users/:id`

**Handler:** `functions/api/admin/users/[id].js`

**Note:** This is a soft delete (sets `is_active = 0`)

```javascript
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  
  // Verify admin
  const auth = await verifyAdmin(request, env);
  if (!auth.authorized) return auth.response;
  
  const userId = params.id;
  
  // Prevent admin from deleting themselves
  if (userId === auth.userId) {
    return new Response(JSON.stringify({
      error: 'Cannot deactivate your own account',
      code: 'VALIDATION_ERROR'
    }), {
      status: 400,
      headers: getSecurityHeaders()
    });
  }
  
  // Soft delete
  await env.DB.prepare(
    'UPDATE users SET is_active = 0 WHERE id = ?'
  ).bind(userId).run();
  
  // Log audit event
  await logAuditEvent({
    action: 'admin.users.deactivate',
    userId: auth.userId,
    targetId: userId,
    details: { action: 'soft_delete' }
  }, env);
  
  return new Response(JSON.stringify({
    success: true,
    message: 'User deactivated successfully'
  }), {
    headers: getSecurityHeaders()
  });
}
```

---

## Frontend Implementation

### Admin Dashboard

**File:** `src/pages/admin/Dashboard.jsx`

**Features:**
- Landing page for admin functions
- Card-based navigation
- Future-ready placeholders

**Code Structure:**
```javascript
function AdminDashboard() {
  const { user } = useAuth();

  // Check if current user is admin
  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <div>
      {/* Admin cards */}
      <Link to="/admin/users">
        User Management
      </Link>
      {/* More admin features... */}
    </div>
  );
}
```

### User Management Page

**File:** `src/pages/admin/Users.jsx`

**State Management:**
```javascript
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [editingUser, setEditingUser] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
```

**Load Users:**
```javascript
const loadUsers = async () => {
  try {
    setLoading(true);
    const response = await authFetch('/api/admin/users');
    if (!response.ok) throw new Error('Failed to load users');
    const data = await response.json();
    setUsers(data);
  } catch (err) {
    setError(err.message);
    showError('Error loading users');
  } finally {
    setLoading(false);
  }
};
```

**Update User:**
```javascript
const handleSaveUser = async () => {
  if (!editingUser) return;
  
  try {
    const response = await authFetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingUser.name,
        role: editingUser.role,
        is_active: editingUser.is_active
      })
    });
    
    if (!response.ok) throw new Error('Failed to update');
    
    const updated = await response.json();
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    showSuccess('User updated successfully');
  } catch (err) {
    showError(err.message);
  }
};
```

### App Layout Updates

**File:** `src/App.jsx`

**Conditional GlobalFilter:**
```javascript
function AuthenticatedApp() {
  const location = useLocation();
  
  // Hide GlobalFilter on admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <NavigationBar />
      <main>
        {!isAdminRoute && <GlobalFilter />}
        <Routes>
          <Route path="/admin" element={<AdminPanelDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          {/* Other routes... */}
        </Routes>
      </main>
    </>
  );
}
```

**Admin Navigation:**
```javascript
// In NavigationBar function
if (user?.role === 'admin') {
  navigationModules.push({
    name: 'Admin',
    icon: '⚙️',
    type: 'dropdown',
    items: [
      { name: 'Panel Admin', icon: '🎛️', path: '/admin' },
      { name: 'Gestión de Usuarios', icon: '👥', path: '/admin/users' }
    ]
  });
}
```

---

## Security Model

### Role Hierarchy

```
admin (superuser)
  ├── Can access all features
  ├── Can manage users
  ├── Can view all data
  └── Cannot deactivate themselves

user (default)
  ├── Can access financial features
  ├── Can only see own data
  └── Cannot access admin panel
```

### Authorization Flow

```
1. User logs in → JWT generated with role
2. Frontend checks role → Shows/hides admin menu
3. User navigates to admin page → Frontend checks role
4. API request made → Backend verifies JWT
5. Backend checks role → Allows/denies action
6. Action logged → Audit trail created
```

### JWT Payload Structure

```javascript
{
  sub: "user-uuid",
  user_id: "user-uuid",
  email: "user@example.com",
  name: "User Name",
  role: "admin", // or "user"
  iat: 1234567890,
  exp: 1234654290,
  iss: "avanta-coinmaster",
  aud: "avanta-coinmaster-api"
}
```

---

## API Reference

### Authentication

All admin endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- Token must contain user with `role: "admin"`

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no valid token) |
| 403 | Forbidden (not admin) |
| 404 | Not Found |
| 500 | Server Error |

### Error Response Format

```json
{
  "error": "Forbidden",
  "message": "Administrator privileges required",
  "code": "ADMIN_REQUIRED"
}
```

### Success Response Formats

**User Object:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "is_active": 1,
  "created_at": "2025-01-15T10:30:00.000Z",
  "last_login_at": "2025-01-20T14:22:00.000Z",
  "avatar_url": null
}
```

**User List:**
```json
[
  { /* user object */ },
  { /* user object */ }
]
```

---

## Testing Guide

### Unit Tests

**Test Admin Authorization:**
```javascript
describe('verifyAdmin', () => {
  test('returns authorized for admin user', async () => {
    const result = await verifyAdmin(mockRequest, mockEnv);
    expect(result.authorized).toBe(true);
  });
  
  test('returns 403 for regular user', async () => {
    const result = await verifyAdmin(mockRequest, mockEnv);
    expect(result.response.status).toBe(403);
  });
});
```

### Integration Tests

**Test User Management Flow:**
```bash
# 1. Login as admin
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. List users
curl -X GET /api/admin/users \
  -H "Authorization: Bearer <token>"

# 3. Update user
curl -X PUT /api/admin/users/<user-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'

# 4. Deactivate user
curl -X DELETE /api/admin/users/<user-id> \
  -H "Authorization: Bearer <token>"
```

### Manual Testing Checklist

- [ ] Apply migration to preview database
- [ ] Verify admin role assigned
- [ ] Login as admin user
- [ ] Access admin dashboard
- [ ] View user list
- [ ] Edit user details
- [ ] Change user role
- [ ] Deactivate user
- [ ] Verify regular user cannot access admin
- [ ] Check audit logs
- [ ] Verify GlobalFilter hidden on admin routes

---

## Deployment

### Pre-Deployment Checklist

- [ ] Database migration tested in preview
- [ ] Build succeeds without errors
- [ ] All tests passing
- [ ] Security review completed
- [ ] Documentation updated

### Deployment Steps

1. **Apply Migration**
   ```bash
   wrangler d1 execute avanta-coinmaster-preview --file=migrations/038_add_user_roles.sql
   ```

2. **Deploy Application**
   ```bash
   npm run build
   npm run deploy
   ```

3. **Verify Deployment**
   - Check admin user has role assigned
   - Test admin login
   - Verify admin panel accessible
   - Check audit logs working

### Rollback Plan

If issues occur:

1. **Frontend Rollback:**
   ```bash
   git revert <commit-hash>
   npm run deploy
   ```

2. **Database Rollback:**
   ```sql
   -- Remove role column (if needed)
   ALTER TABLE users DROP COLUMN role;
   ```

### Monitoring

- Monitor audit logs for admin actions
- Check error rates on admin endpoints
- Verify JWT generation includes role
- Monitor failed authorization attempts

---

## Troubleshooting

### Common Issues

**Issue:** Admin navigation not showing
- **Check:** User role in JWT token
- **Fix:** Re-login to get updated token

**Issue:** 403 Forbidden on admin endpoints
- **Check:** Database role assignment
- **Fix:** Run migration, verify user role in DB

**Issue:** GlobalFilter still showing on admin pages
- **Check:** Route path matching
- **Fix:** Verify `location.pathname.startsWith('/admin')`

**Issue:** Cannot update users
- **Check:** Network request, JWT token
- **Fix:** Check browser console for errors

---

## Future Enhancements

### Phase 35 and Beyond

- **System Settings:** Global configuration management
- **Audit Reports:** Detailed admin action reports
- **Role Permissions:** Granular permission system
- **User Groups:** Organize users into groups
- **API Keys:** Allow programmatic access

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Author:** Phase 34 Implementation Team
