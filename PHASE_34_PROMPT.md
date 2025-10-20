# Phase 34: Multi-User Architecture and Admin Panel Foundations - Agent Prompt

## 🎯 **MISSION: Transform to Multi-User System with Admin Panel**

You are tasked with implementing **Phase 34: Multi-User Architecture and Admin Panel Foundations** of the Avanta Finance platform. This phase focuses on transforming the application into a multi-user system with roles and creating an administration panel for user management.

## 📋 **CONTEXT & CURRENT STATUS**

### **Official Implementation Plan**
This phase is defined in **`IMPLEMENTATION_PLAN_V8.md`** - Phase 34: Multi-User Architecture and Admin Panel Foundations (Formerly Phase 31)

### **Phase 33 COMPLETE ✅**
- **Account Opening Dates:** ✅ COMPLETE - Added tracking for when accounts were opened
- **Initial Balance Management:** ✅ COMPLETE - Created system for managing historical initial balances
- **FAQ Search Verification:** ✅ COMPLETE - Confirmed FAQ search functionality works correctly

### **System Architecture**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Cloudflare Workers Functions (JavaScript) with security hardening
- **Database:** Cloudflare D1 (SQLite) with INTEGER cents-based monetary storage
- **Storage:** Cloudflare R2 for file storage
- **Deployment:** Cloudflare Pages with Workers Functions

## 🎯 **PHASE 34 OBJECTIVES**

**Reference:** See `IMPLEMENTATION_PLAN_V8.md` - Phase 34: Multi-User Architecture and Admin Panel Foundations for the official technical plan.

### **1. Multi-User Support and Administrator Role**
- Add `role` field to `users` table
- Assign `admin` role to `mateo` user
- Refactor all endpoints to operate within authenticated `user_id` context
- Create admin endpoints (`/api/admin/*`) protected by authorization middleware

### **2. Admin Dashboard for User Management**
- Create route and component for Admin Dashboard (`/admin/users`)
- Add user management functionality (view, edit, delete users)
- Update main application layout to hide `GlobalFilter` on admin routes
- Ensure admin navigation is only visible to administrator users

## 📁 **KEY FILES TO WORK WITH**

### **Database Schema** (schema.sql)
- Add `role` field to `users` table
- Update user-related constraints and indexes

### **Backend APIs** (functions/api/)
- `auth.js` - Update authentication to include role checking
- `admin/` - Create new admin API endpoints directory
- `admin/users.js` - User management endpoints
- All existing APIs - Refactor to use `user_id` context

### **Frontend Components** (src/)
- `src/pages/AdminDashboard.jsx` - Main admin dashboard
- `src/pages/admin/Users.jsx` - User management page
- `src/components/admin/` - Admin-specific components
- `src/App.jsx` - Update layout to conditionally hide GlobalFilter
- `src/components/Navigation.jsx` - Add admin navigation items

### **Database Migrations** (migrations/)
- Create migration script for user role field
- Update existing user data with default roles

## 🔧 **TECHNICAL IMPLEMENTATION PLAN**

### **Phase 34A: Database Schema Updates**

1. **Update Users Table**
   ```sql
   ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
   ```

2. **Update Existing Users**
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'mateo';
   UPDATE users SET role = 'user' WHERE username != 'mateo';
   ```

3. **Create Migration Script**
   - File: `migrations/038_add_user_roles.sql`
   - Include schema changes and role assignments

### **Phase 34B: Backend API Implementation**

1. **Authentication Updates** (`functions/api/auth.js`)
   - Add role checking to authentication middleware
   - Include user role in JWT tokens
   - Add admin role verification functions

2. **Admin API Endpoints** (`functions/api/admin/`)
   - `users.js` - User management CRUD operations
   - `dashboard.js` - Admin dashboard data
   - `settings.js` - System settings management

3. **Existing API Refactoring**
   - Update all endpoints to use `user_id` from JWT
   - Add user context to all database queries
   - Ensure data isolation between users

### **Phase 34C: Frontend Implementation**

1. **Admin Dashboard** (`src/pages/AdminDashboard.jsx`)
   - Main admin dashboard with navigation
   - User statistics and system overview
   - Quick access to admin functions

2. **User Management** (`src/pages/admin/Users.jsx`)
   - User list with search and filtering
   - User creation, editing, and deletion
   - Role management interface

3. **Navigation Updates** (`src/App.jsx`)
   - Conditionally hide `GlobalFilter` on admin routes
   - Add admin navigation items
   - Ensure admin routes are protected

4. **Admin Components** (`src/components/admin/`)
   - `UserList.jsx` - User listing component
   - `UserForm.jsx` - User creation/edit form
   - `UserStats.jsx` - User statistics display

## 🎯 **SUCCESS CRITERIA**

### **Database Foundation**
- ✅ `role` field added to users table
- ✅ `mateo` user assigned admin role
- ✅ Migration script successfully applied
- ✅ Data integrity maintained

### **Backend Functionality**
- ✅ Admin role verification implemented
- ✅ User management CRUD operations working
- ✅ All endpoints use user context for data isolation
- ✅ Admin endpoints protected by authorization

### **Frontend Experience**
- ✅ Admin dashboard accessible to admin users only
- ✅ User management interface functional
- ✅ GlobalFilter hidden on admin routes
- ✅ Admin navigation visible only to admins
- ✅ Regular users cannot access admin functions

### **Security & Data Isolation**
- ✅ Users can only access their own data
- ✅ Admin users can manage all users
- ✅ Proper role-based access control
- ✅ No data leakage between users

## 📋 **IMPLEMENTATION CHECKLIST**

### **Database Layer**
- [ ] Create migration script `038_add_user_roles.sql`
- [ ] Add `role` column to users table
- [ ] Update existing users with appropriate roles
- [ ] Test migration on preview database
- [ ] Apply migration to production database

### **Backend Layer**
- [ ] Update `functions/api/auth.js` with role checking
- [ ] Create `functions/api/admin/users.js` for user management
- [ ] Create `functions/api/admin/dashboard.js` for admin data
- [ ] Refactor existing APIs to use user context
- [ ] Test all API endpoints with role-based access

### **Frontend Layer**
- [ ] Create `src/pages/AdminDashboard.jsx`
- [ ] Create `src/pages/admin/Users.jsx`
- [ ] Create admin components in `src/components/admin/`
- [ ] Update `src/App.jsx` to hide GlobalFilter on admin routes
- [ ] Update navigation to include admin items
- [ ] Test admin functionality

### **Testing & Verification**
- [ ] Test admin user can access admin dashboard
- [ ] Test regular user cannot access admin functions
- [ ] Test user management CRUD operations
- [ ] Test data isolation between users
- [ ] Verify GlobalFilter behavior on different routes

## 🚀 **GETTING STARTED**

1. **Start with Database Schema**
   - Create migration script for user roles
   - Test on preview database first

2. **Implement Backend APIs**
   - Update authentication with role checking
   - Create admin endpoints

3. **Build Frontend Components**
   - Create admin dashboard and user management
   - Update navigation and layout

4. **Test and Verify**
   - Test role-based access control
   - Verify data isolation

## 📚 **DOCUMENTATION TO CREATE**

- `PHASE_34_COMPLETION_SUMMARY.md` - Implementation summary
- `PHASE_34_IMPLEMENTATION_GUIDE.md` - Technical implementation details
- `PHASE_34_VISUAL_SUMMARY.md` - Visual implementation overview

## ⚠️ **IMPORTANT NOTES**

- **Data Isolation:** Ensure users can only access their own data
- **Role Security:** Implement proper role-based access control
- **Backward Compatibility:** Ensure existing functionality continues to work
- **Testing:** Test thoroughly on preview database before production
- **Documentation:** Update all relevant documentation

---

**Phase 34 Implementation Date:** January 2025  
**Expected Duration:** 3-4 hours  
**Priority:** High (Core multi-user functionality)

**Next Phase:** Phase 35 - Centralized Settings Panel
