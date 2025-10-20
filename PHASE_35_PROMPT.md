# Phase 35: Centralized Settings Panel - Agent Prompt

## 🎯 **MISSION: Unify All Settings into Centralized Panel**

You are tasked with implementing **Phase 35: Centralized Settings Panel** of the Avanta Finance platform. This phase focuses on unifying all user and application settings into a single, coherent administration panel.

## 📋 **CONTEXT & CURRENT STATUS**

### **Official Implementation Plan**
This phase is defined in **`IMPLEMENTATION_PLAN_V8.md`** - Phase 35: Centralized Settings Panel (Formerly Phase 32)

### **Phase 34 COMPLETE ✅**
- **Multi-User Support:** ✅ COMPLETE - Added role-based access control
- **Admin Dashboard:** ✅ COMPLETE - Created comprehensive user management interface
- **Data Isolation:** ✅ COMPLETE - Users can only access their own data

### **System Architecture**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Cloudflare Workers Functions (JavaScript) with security hardening
- **Database:** Cloudflare D1 (SQLite) with INTEGER cents-based monetary storage
- **Storage:** Cloudflare R2 for file storage
- **Deployment:** Cloudflare Pages with Workers Functions

## 🎯 **PHASE 35 OBJECTIVES**

**Reference:** See `IMPLEMENTATION_PLAN_V8.md` - Phase 35: Centralized Settings Panel for the official technical plan.

### **1. Tabbed Settings Panel**
- Create unified settings page (`/settings`) with tabbed interface
- Organize settings into logical categories (Profile, Fiscal, Accounts, Categories, Rules, Security)
- Provide consistent navigation and user experience

### **2. Fiscal Data Management (Certificate Analysis)**
- Integrate with OCR endpoint from Phase 32 for Fiscal Situation Certificate analysis
- Create interface for uploading and analyzing fiscal certificates
- Display extracted fiscal data in organized format

### **3. Centralization of Settings**
- Move existing scattered settings functionality to centralized panel
- Consolidate user preferences, account settings, and system configurations
- Provide single location for all user customization options

## 📁 **KEY FILES TO WORK WITH**

### **Backend APIs** (functions/api/)
- `settings.js` - Settings management endpoints
- `fiscal-certificates.js` - Fiscal certificate analysis endpoints
- `process-document-ocr.js` - OCR processing (from Phase 32)

### **Frontend Components** (src/)
- `src/pages/Settings.jsx` - Main settings page with tabbed interface
- `src/components/settings/` - Settings-specific components
- `src/components/settings/ProfileTab.jsx` - Profile settings
- `src/components/settings/FiscalTab.jsx` - Fiscal data management
- `src/components/settings/AccountsTab.jsx` - Account settings
- `src/components/settings/CategoriesTab.jsx` - Category management
- `src/components/settings/RulesTab.jsx` - Business rules
- `src/components/settings/SecurityTab.jsx` - Security settings

### **Database Schema** (schema.sql)
- `user_settings` table for storing user preferences
- `fiscal_certificates` table for certificate storage and analysis

## 🔧 **TECHNICAL IMPLEMENTATION PLAN**

### **Phase 35A: Database Schema Updates**

1. **Create User Settings Table**
   ```sql
   CREATE TABLE user_settings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     setting_key TEXT NOT NULL,
     setting_value TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
     UNIQUE(user_id, setting_key)
   );
   ```

2. **Create Fiscal Certificates Table**
   ```sql
   CREATE TABLE fiscal_certificates (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     filename TEXT NOT NULL,
     file_path TEXT NOT NULL,
     analysis_data TEXT, -- JSON data from OCR
     uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   ```

3. **Create Migration Script**
   - File: `migrations/039_add_settings_tables.sql`
   - Include schema changes and initial data

### **Phase 35B: Backend API Implementation**

1. **Settings API** (`functions/api/settings.js`)
   - `GET /api/settings` - Get user settings
   - `PUT /api/settings` - Update user settings
   - `GET /api/settings/categories` - Get settings categories
   - `POST /api/settings/reset` - Reset settings to defaults

2. **Fiscal Certificates API** (`functions/api/fiscal-certificates.js`)
   - `GET /api/fiscal-certificates` - List user certificates
   - `POST /api/fiscal-certificates` - Upload and analyze certificate
   - `GET /api/fiscal-certificates/:id` - Get certificate details
   - `DELETE /api/fiscal-certificates/:id` - Delete certificate

3. **Integration with OCR** (`functions/api/process-document-ocr.js`)
   - Enhance OCR endpoint for fiscal certificate analysis
   - Add fiscal-specific data extraction patterns

### **Phase 35C: Frontend Implementation**

1. **Main Settings Page** (`src/pages/Settings.jsx`)
   - Tabbed interface with navigation
   - Responsive design for mobile and desktop
   - Consistent styling with application theme

2. **Settings Tabs**
   - **Profile Tab:** User profile information, preferences
   - **Fiscal Tab:** Certificate upload, analysis, fiscal data display
   - **Accounts Tab:** Account management, opening dates, initial balances
   - **Categories Tab:** Transaction categories, custom categories
   - **Rules Tab:** Business rules, automation settings
   - **Security Tab:** Password change, security preferences

3. **Settings Components** (`src/components/settings/`)
   - Reusable components for different setting types
   - Form validation and error handling
   - Consistent UI patterns

## 🎯 **SUCCESS CRITERIA**

### **Database Foundation**
- ✅ `user_settings` table created with proper constraints
- ✅ `fiscal_certificates` table created for certificate storage
- ✅ Migration script successfully applied
- ✅ Data integrity maintained

### **Backend Functionality**
- ✅ Settings management API endpoints working
- ✅ Fiscal certificate analysis API functional
- ✅ OCR integration enhanced for fiscal data
- ✅ User data isolation maintained

### **Frontend Experience**
- ✅ Unified settings page with tabbed interface
- ✅ All settings categories accessible and functional
- ✅ Fiscal certificate upload and analysis working
- ✅ Consistent UI/UX across all settings tabs
- ✅ Mobile-responsive design

### **User Experience**
- ✅ Single location for all user settings
- ✅ Intuitive navigation between settings categories
- ✅ Clear organization of settings by function
- ✅ Easy access to fiscal certificate management

## 📋 **IMPLEMENTATION CHECKLIST**

### **Database Layer**
- [ ] Create migration script `039_add_settings_tables.sql`
- [ ] Add `user_settings` table
- [ ] Add `fiscal_certificates` table
- [ ] Test migration on preview database
- [ ] Apply migration to production database

### **Backend Layer**
- [ ] Create `functions/api/settings.js` for settings management
- [ ] Create `functions/api/fiscal-certificates.js` for certificate handling
- [ ] Enhance OCR endpoint for fiscal analysis
- [ ] Test all API endpoints
- [ ] Verify user data isolation

### **Frontend Layer**
- [ ] Create `src/pages/Settings.jsx` with tabbed interface
- [ ] Create settings tab components
- [ ] Implement fiscal certificate upload and analysis
- [ ] Add settings navigation to main app
- [ ] Test all settings functionality

### **Testing & Verification**
- [ ] Test settings CRUD operations
- [ ] Test fiscal certificate upload and analysis
- [ ] Test settings persistence across sessions
- [ ] Verify mobile responsiveness
- [ ] Test user data isolation

## 🚀 **GETTING STARTED**

1. **Start with Database Schema**
   - Create migration script for settings tables
   - Test on preview database first

2. **Implement Backend APIs**
   - Create settings management endpoints
   - Enhance fiscal certificate handling

3. **Build Frontend Components**
   - Create tabbed settings interface
   - Implement fiscal certificate management

4. **Test and Verify**
   - Test all settings functionality
   - Verify fiscal certificate analysis

## 📚 **DOCUMENTATION TO CREATE**

- `PHASE_35_COMPLETION_SUMMARY.md` - Implementation summary
- `PHASE_35_IMPLEMENTATION_GUIDE.md` - Technical implementation details
- `PHASE_35_VISUAL_SUMMARY.md` - Visual implementation overview

## ⚠️ **IMPORTANT NOTES**

- **User Data Isolation:** Ensure settings are user-specific
- **OCR Integration:** Leverage existing OCR endpoint from Phase 32
- **Mobile Responsiveness:** Ensure settings work on all devices
- **Backward Compatibility:** Maintain existing functionality
- **Testing:** Test thoroughly on preview database before production

---

**Phase 35 Implementation Date:** January 2025  
**Expected Duration:** 3-4 hours  
**Priority:** High (User experience improvement)

**Next Phase:** Phase 36 - Task System Redesign as Interactive Guide
