# Admin Account Recovery and Management Dashboard

## Overview
This update restores access to the admin account (m@avantadesign.com) and adds a comprehensive user management dashboard to the Avanta Finance application.

## Changes Made

### 1. Database Schema Updates
**Migration 009**: `migrations/009_add_admin_user_and_roles.sql`
- Added `role` column to `users` table with values: 'user', 'admin'
- Created/restored admin user: m@avantadesign.com
- Default password: `AvantaAdmin2025!` (will be hashed on first login)
- Indexed role column for performance

### 2. Authentication System Enhancements
**File**: `functions/api/auth.js`
- JWT tokens now include user role for authorization
- Role information included in all auth flows:
  - Login (email/password)
  - Registration
  - Token refresh
  - User info endpoint

### 3. User Profile Management API
**File**: `functions/api/user-profile.js`
- **GET /api/user-profile**: Retrieve user profile information
- **PUT /api/user-profile**: Update profile (name, preferences)
- **POST /api/user-profile/change-password**: Change password with validation

Features:
- Secure password hashing (SHA-256 + unique salt)
- Current password verification before change
- Password strength validation
- Constant-time comparison to prevent timing attacks

### 4. Admin Dashboard Component
**File**: `src/components/AdminDashboard.jsx`

Features:
- **Account Overview**:
  - User avatar display
  - Email, user ID, registration date
  - Admin role badge
  - Last login timestamp

- **Profile Settings**:
  - Edit name inline
  - View email (read-only)
  - Real-time updates

- **Password Management**:
  - Change password with current password verification
  - Password strength validation:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
  - Show/hide password toggle
  - Confirmation field

- **Security Information**:
  - Display security features
  - Best practices reminder

### 5. Navigation Updates
**File**: `src/App.jsx`
- Added "Mi Cuenta" (My Account) link to main navigation
- Added route `/admin` for AdminDashboard
- Lazy loaded for performance

### 6. Role Management Utilities
**File**: `src/utils/userContext.js`
- Updated `hasRole()` function to support single role field
- Backward compatible with roles array format
- `isAdmin()` helper function

## Security Features

### Password Security
1. **Hashing**: SHA-256 with unique salt per password
2. **Salt**: 16 bytes (128 bits) of random data
3. **Verification**: Constant-time comparison prevents timing attacks
4. **Migration**: Legacy plaintext passwords automatically hashed on next login

### Authentication
1. **JWT Tokens**: 24-hour expiration
2. **Token Refresh**: Automatic every 23 hours
3. **Role-Based**: Tokens include user role for authorization
4. **Secure Storage**: Tokens stored in localStorage

### Authorization
1. **User Isolation**: All data scoped to user_id
2. **Role Checking**: Admin and user roles supported
3. **API Protection**: All profile endpoints require valid JWT

## How to Use

### Applying the Migration

#### Production Database
```bash
wrangler d1 execute avanta-finance --file=migrations/009_add_admin_user_and_roles.sql
```

#### Local Development
```bash
wrangler d1 execute avanta-finance --local --file=migrations/009_add_admin_user_and_roles.sql
```

Or use the helper script:
```bash
./scripts/apply-migration-009.sh
```

### First Login
1. Navigate to the login page
2. Use credentials:
   - Email: `m@avantadesign.com`
   - Password: `AvantaAdmin2025!`
3. **IMMEDIATELY change the password** after first login
4. Navigate to "Mi Cuenta" in the top navigation

### Changing Password
1. Go to "Mi Cuenta" (My Account) in navigation
2. Scroll to "Cambiar Contraseña" (Change Password) section
3. Enter current password
4. Enter new password (must meet requirements)
5. Confirm new password
6. Click "Cambiar Contraseña"

### Updating Profile
1. Go to "Mi Cuenta" (My Account)
2. Click "Editar" next to your name
3. Enter new name
4. Click "Guardar" to save

## API Endpoints

### Get User Profile
```http
GET /api/user-profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": "admin_001",
    "email": "m@avantadesign.com",
    "name": "Mateo Reyes",
    "role": "admin",
    "created_at": "2025-10-16T...",
    "last_login_at": "2025-10-16T...",
    "preferences": {}
  }
}
```

### Update Profile
```http
PUT /api/user-profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Name"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Change Password
```http
POST /api/user-profile/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- Special characters recommended but not required

## Testing Checklist

### Authentication
- [x] Build completes without errors
- [ ] Login with admin credentials
- [ ] JWT token includes role
- [ ] User info displayed correctly
- [ ] Logout works properly

### Admin Dashboard
- [ ] Dashboard loads without errors
- [ ] Profile information displays correctly
- [ ] Role badge shows for admin users
- [ ] Edit name functionality works
- [ ] Password change validates correctly
- [ ] Password change updates successfully
- [ ] Error messages display appropriately
- [ ] Success messages display appropriately

### Security
- [ ] Current password required for change
- [ ] Weak passwords rejected
- [ ] Password mismatch detected
- [ ] Passwords properly hashed in database
- [ ] JWT tokens expire after 24 hours
- [ ] Unauthorized access blocked

### Compatibility
- [ ] Existing login still works
- [ ] Existing features not broken
- [ ] Navigation works correctly
- [ ] Mobile responsive design
- [ ] No console errors

## Troubleshooting

### Cannot login with admin credentials
1. Verify migration was applied: `wrangler d1 execute avanta-finance --command="SELECT email, role FROM users WHERE email='m@avantadesign.com'"`
2. Check if user exists and is active
3. Verify password hasn't been changed

### Password change fails
1. Check current password is correct
2. Verify new password meets requirements
3. Check browser console for errors
4. Verify JWT token is valid

### Dashboard not loading
1. Check if route is properly configured in App.jsx
2. Verify JWT token exists in localStorage
3. Check browser console for errors
4. Verify API endpoint is accessible

## Future Enhancements
- [ ] Password reset via email
- [ ] Two-factor authentication
- [ ] Password history (prevent reuse)
- [ ] Account activity log
- [ ] User management (for admins to manage other users)
- [ ] Session management (view/revoke active sessions)
- [ ] Profile picture upload
- [ ] Email change with verification

## Notes
- All passwords are automatically migrated from plaintext to hashed on first login
- The admin password should be changed immediately after first login
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Role-based access control is ready for future admin-only features
