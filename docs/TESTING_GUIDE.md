# Testing Guide for Admin Dashboard Implementation

## Pre-Deployment Checklist

### 1. Database Migration
Before testing, ensure migration 009 has been applied:

```bash
# For production
wrangler d1 execute avanta-finance --file=migrations/009_add_admin_user_and_roles.sql

# For local development
wrangler d1 execute avanta-finance --local --file=migrations/009_add_admin_user_and_roles.sql
```

Verify migration was successful:
```bash
wrangler d1 execute avanta-finance --command="SELECT email, role FROM users WHERE email='m@avantadesign.com'"
```

Expected output:
```
email                | role
---------------------|-------
m@avantadesign.com   | admin
```

### 2. Build Verification
✅ Already verified - build completes successfully in 2.55s

### 3. Code Quality Checks

#### Files Modified:
- ✅ `functions/api/auth.js` - Role added to JWT tokens
- ✅ `functions/api/user-profile.js` - New API endpoints created
- ✅ `src/components/AdminDashboard.jsx` - New component created
- ✅ `src/App.jsx` - Route and navigation added
- ✅ `src/utils/userContext.js` - Role checking updated
- ✅ `migrations/009_add_admin_user_and_roles.sql` - Database schema updated

#### Build Status:
```
✓ built in 2.55s
✓ 123 modules transformed
✓ No errors or warnings
```

## Manual Testing Procedures

### Test 1: Admin Login
**Objective**: Verify admin can login with new credentials

**Steps**:
1. Navigate to `/login`
2. Enter email: `m@avantadesign.com`
3. Enter password: `AvantaAdmin2025!`
4. Click "Iniciar Sesión"

**Expected Results**:
- ✅ Login succeeds
- ✅ Redirected to home page
- ✅ User name displayed in navigation
- ✅ "Mi Cuenta" link visible in navigation

**Verification**:
- Check browser localStorage for authToken
- Decode JWT token to verify role field is present
- Check Network tab for successful /api/auth/login response

### Test 2: JWT Token Contains Role
**Objective**: Verify JWT tokens include role information

**Steps**:
1. After logging in, open browser DevTools
2. Go to Application > Local Storage
3. Find `authToken`
4. Decode the JWT token at https://jwt.io

**Expected Results**:
- ✅ Token payload contains `role: "admin"`
- ✅ Token payload contains user_id, email, name
- ✅ Token has 24-hour expiration

### Test 3: Admin Dashboard Access
**Objective**: Verify admin dashboard loads and displays correctly

**Steps**:
1. Click "Mi Cuenta" in navigation
2. Verify page loads

**Expected Results**:
- ✅ Dashboard loads without errors
- ✅ Account overview section displays
- ✅ User avatar or initial shown
- ✅ Admin badge displayed
- ✅ Profile settings section visible
- ✅ Password change section visible
- ✅ Security information section visible

### Test 4: Profile Information Display
**Objective**: Verify all profile information displays correctly

**Expected Results**:
- ✅ Email: m@avantadesign.com
- ✅ Name: Mateo Reyes (or as configured)
- ✅ Role badge: "Administrador"
- ✅ User ID: admin_001
- ✅ Registration date displayed
- ✅ Last login timestamp (if available)

### Test 5: Edit Profile Name
**Objective**: Verify name can be updated

**Steps**:
1. In Admin Dashboard, locate name field
2. Click "Editar" button
3. Change name to "Test Name"
4. Click "Guardar"

**Expected Results**:
- ✅ Success notification appears
- ✅ Name updates in display
- ✅ Name updates in navigation bar
- ✅ Edit form closes

**Verification**:
```bash
wrangler d1 execute avanta-finance --command="SELECT name FROM users WHERE email='m@avantadesign.com'"
```

### Test 6: Password Change Validation
**Objective**: Verify password validation works correctly

**Test Cases**:

#### 6.1: Empty Fields
**Steps**: Submit form with empty fields
**Expected**: Error messages for required fields

#### 6.2: Wrong Current Password
**Steps**: Enter incorrect current password
**Expected**: "Current password is incorrect" error

#### 6.3: Short Password
**Steps**: Enter new password with < 8 characters
**Expected**: "Password must be at least 8 characters" error

#### 6.4: No Uppercase
**Steps**: Enter password without uppercase letter
**Expected**: "Password must contain at least one uppercase letter" error

#### 6.5: No Lowercase
**Steps**: Enter password without lowercase letter
**Expected**: "Password must contain at least one lowercase letter" error

#### 6.6: No Number
**Steps**: Enter password without number
**Expected**: "Password must contain at least one number" error

#### 6.7: Password Mismatch
**Steps**: Enter different passwords in new and confirm fields
**Expected**: "Passwords do not match" error

### Test 7: Successful Password Change
**Objective**: Verify password can be changed successfully

**Steps**:
1. Enter current password: `AvantaAdmin2025!`
2. Enter new password: `NewSecure123!`
3. Confirm new password: `NewSecure123!`
4. Click "Cambiar Contraseña"

**Expected Results**:
- ✅ Success notification appears
- ✅ Form fields cleared
- ✅ No errors displayed

**Verification**:
1. Logout
2. Login with new password: `NewSecure123!`
3. Should succeed

### Test 8: Password Hashing
**Objective**: Verify password is properly hashed in database

**Steps**:
After changing password, check database:
```bash
wrangler d1 execute avanta-finance --command="SELECT password FROM users WHERE email='m@avantadesign.com'"
```

**Expected Results**:
- ✅ Password is NOT in plaintext
- ✅ Password format: `{32-char-hex}:{64-char-hex}`
- ✅ Contains colon separator (salt:hash format)

### Test 9: Show/Hide Password Toggle
**Objective**: Verify password visibility toggle works

**Steps**:
1. In password change form, check "Mostrar contraseñas"
2. Observe password fields

**Expected Results**:
- ✅ Password fields change from type="password" to type="text"
- ✅ Passwords visible
- ✅ Uncheck box returns to hidden

### Test 10: Navigation Integration
**Objective**: Verify navigation works correctly

**Steps**:
1. From home page, click "Mi Cuenta"
2. Verify redirects to /admin
3. Click other navigation items
4. Return to "Mi Cuenta"

**Expected Results**:
- ✅ All navigation links work
- ✅ Active route highlighted
- ✅ No broken links
- ✅ Dashboard state preserved

### Test 11: Existing Functionality
**Objective**: Verify existing features still work

**Steps**:
1. Navigate to "Transacciones"
2. Create a test transaction
3. Navigate to "Cuentas"
4. View accounts
5. Navigate to "Fiscal"
6. View fiscal information

**Expected Results**:
- ✅ All existing pages load
- ✅ No console errors
- ✅ Data displays correctly
- ✅ CRUD operations work
- ✅ No visual glitches

### Test 12: Logout and Re-login
**Objective**: Verify logout and re-login cycle works

**Steps**:
1. Click "Cerrar Sesión"
2. Verify redirected to login
3. Login again with credentials
4. Verify access restored

**Expected Results**:
- ✅ Logout clears session
- ✅ Redirects to login page
- ✅ Re-login successful
- ✅ Previous state not accessible when logged out

### Test 13: Responsive Design
**Objective**: Verify admin dashboard works on mobile

**Steps**:
1. Open DevTools responsive mode
2. Test at various breakpoints:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1024px

**Expected Results**:
- ✅ Layout adapts to screen size
- ✅ All elements visible
- ✅ Forms usable
- ✅ No horizontal scroll
- ✅ Touch targets adequate

### Test 14: API Endpoints
**Objective**: Verify API endpoints work correctly

#### GET /api/user-profile
```bash
curl -H "Authorization: Bearer {token}" https://avanta-finance.pages.dev/api/user-profile
```

Expected: 200 OK with user data

#### PUT /api/user-profile
```bash
curl -X PUT -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"name":"New Name"}' \
     https://avanta-finance.pages.dev/api/user-profile
```

Expected: 200 OK with updated user data

#### POST /api/user-profile/change-password
```bash
curl -X POST -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"currentPassword":"old","newPassword":"new"}' \
     https://avanta-finance.pages.dev/api/user-profile/change-password
```

Expected: 200 OK with success message

### Test 15: Security Tests

#### 15.1: Unauthorized Access
**Steps**: Access /api/user-profile without token
**Expected**: 401 Unauthorized

#### 15.2: Invalid Token
**Steps**: Access /api/user-profile with invalid token
**Expected**: 401 Unauthorized

#### 15.3: Expired Token
**Steps**: Access with expired token (> 24 hours old)
**Expected**: 401 Unauthorized

#### 15.4: SQL Injection
**Steps**: Try injecting SQL in name field
**Expected**: Input sanitized, no SQL execution

#### 15.5: XSS Attack
**Steps**: Try injecting script in name field
**Expected**: Script escaped, not executed

## Browser Compatibility Testing

Test in the following browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Testing

### Load Time
- [ ] Admin dashboard loads in < 1 second
- [ ] API responses in < 200ms
- [ ] No memory leaks during navigation

### Bundle Size
- [ ] AdminDashboard chunk: ~8.84 KB (acceptable)
- [ ] Total bundle size not significantly increased

## Error Handling Testing

### Network Errors
1. Disconnect network
2. Try to update profile
3. Verify error message displays

### Server Errors
1. Stop backend (if possible)
2. Try operations
3. Verify graceful error handling

### Invalid Data
1. Send malformed JSON
2. Verify appropriate error messages

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Form labels associated correctly

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Admin Login | ⏳ Pending | |
| 2 | JWT Role | ⏳ Pending | |
| 3 | Dashboard Access | ⏳ Pending | |
| 4 | Profile Display | ⏳ Pending | |
| 5 | Edit Name | ⏳ Pending | |
| 6 | Password Validation | ⏳ Pending | |
| 7 | Password Change | ⏳ Pending | |
| 8 | Password Hashing | ⏳ Pending | |
| 9 | Show/Hide Password | ⏳ Pending | |
| 10 | Navigation | ⏳ Pending | |
| 11 | Existing Features | ⏳ Pending | |
| 12 | Logout/Re-login | ⏳ Pending | |
| 13 | Responsive Design | ⏳ Pending | |
| 14 | API Endpoints | ⏳ Pending | |
| 15 | Security | ⏳ Pending | |

Legend:
- ⏳ Pending
- ✅ Passed
- ❌ Failed
- ⚠️ Warning

## Post-Deployment Verification

After deployment to production:

1. **Immediate Actions**:
   - [ ] Apply migration 009
   - [ ] Verify admin login works
   - [ ] Change password immediately
   - [ ] Test all dashboard features

2. **Monitoring**:
   - [ ] Check error logs for issues
   - [ ] Monitor API response times
   - [ ] Watch for authentication errors
   - [ ] Check database queries performance

3. **User Communication**:
   - [ ] Notify admin that access is restored
   - [ ] Provide new credentials securely
   - [ ] Remind to change password
   - [ ] Share admin dashboard documentation

## Known Issues and Limitations

None currently identified. All features implemented as specified.

## Rollback Plan

If issues arise, rollback procedure:

1. Revert to previous commit: `git revert HEAD`
2. Redeploy application
3. No database rollback needed (role column can remain)
4. Admin user will still exist but dashboard not accessible

## Support Resources

- Documentation: `/docs/ADMIN_DASHBOARD.md`
- Migration Script: `/scripts/apply-migration-009.sh`
- Cloudflare Docs: https://developers.cloudflare.com/d1/
