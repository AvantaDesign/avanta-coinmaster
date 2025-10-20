# Phase 37: Advanced Demo Experience - Agent Prompt

## 🎯 **MISSION: Create Robust Educational Demo Environment**

You are tasked with implementing **Phase 37: Advanced Demo Experience** of the Avanta Finance platform. This phase focuses on creating a comprehensive, educational, and reusable demonstration environment that showcases the platform's capabilities effectively.

## 📋 **CONTEXT & CURRENT STATUS**

### **Official Implementation Plan**
This phase is defined in **`IMPLEMENTATION_PLAN_V8.md`** - Phase 37: Advanced Demo Experience (Formerly Phase 34)

### **Phase 36 COMPLETE ✅**
- **Task System Redesign:** ✅ COMPLETE - Interactive progress bars and guided declarations
- **Task Engine:** ✅ COMPLETE - Automatic evaluation and progress tracking
- **Declaration Guides:** ✅ COMPLETE - Step-by-step ISR, IVA, and DIOT guidance
- **Custom Task Management:** ✅ COMPLETE - Template system and custom task creation

### **System Architecture**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Cloudflare Workers Functions (JavaScript) with security hardening
- **Database:** Cloudflare D1 (SQLite) with INTEGER cents-based monetary storage
- **Storage:** Cloudflare R2 for file storage
- **Deployment:** Cloudflare Pages with Workers Functions

## 🎯 **PHASE 37 OBJECTIVES**

**Reference:** See `IMPLEMENTATION_PLAN_V8.md` - Phase 37: Advanced Demo Experience for the official technical plan.

### **1. Realistic Demo Data and Automatic Reset**
- Create comprehensive demo datasets for different business scenarios
- Implement automatic data reset functionality for demo sessions
- Provide realistic financial data that demonstrates platform capabilities
- Ensure demo data covers all major features and use cases

### **2. "Healthy" vs. "Critical" Scenario Switch**
- Create two distinct business scenarios: healthy and critical financial states
- Implement scenario switching functionality
- Provide educational context for each scenario
- Enable users to experience different financial management challenges

### **3. Demo User Management**
- Create dedicated demo user account with special privileges
- Implement demo-specific features and limitations
- Provide clear demo mode indicators throughout the interface
- Ensure demo data isolation from production systems

## 📁 **KEY FILES TO WORK WITH**

### **Backend APIs** (functions/api/)
- `demo-data.js` - Demo data management endpoints
- `demo-scenarios.js` - Scenario switching functionality
- `demo-reset.js` - Data reset and initialization
- `demo-user.js` - Demo user management

### **Frontend Components** (src/)
- `src/pages/Demo.jsx` - Demo mode dashboard
- `src/components/demo/` - Demo-specific components
- `src/components/demo/ScenarioSelector.jsx` - Scenario switching interface
- `src/components/demo/DemoBanner.jsx` - Demo mode indicators
- `src/components/demo/DataReset.jsx` - Data reset functionality
- `src/components/demo/EducationalGuide.jsx` - Demo guidance and tips

### **Database Schema** (schema.sql)
- `demo_scenarios` table for scenario definitions
- `demo_data_snapshots` table for data state management
- Enhanced user management for demo mode

## 🔧 **TECHNICAL IMPLEMENTATION PLAN**

### **Phase 37A: Database Schema Updates**

1. **Create Demo Scenarios Table**
   ```sql
   CREATE TABLE demo_scenarios (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     scenario_name TEXT NOT NULL UNIQUE,
     scenario_type TEXT NOT NULL CHECK(scenario_type IN ('healthy', 'critical')),
     description TEXT NOT NULL,
     business_context TEXT,
     financial_state TEXT, -- JSON with financial metrics
     learning_objectives TEXT, -- JSON with educational goals
     is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Create Demo Data Snapshots Table**
   ```sql
   CREATE TABLE demo_data_snapshots (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     scenario_id INTEGER NOT NULL,
     snapshot_name TEXT NOT NULL,
     data_snapshot TEXT NOT NULL, -- JSON with complete data state
     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (scenario_id) REFERENCES demo_scenarios(id) ON DELETE CASCADE
   );
   ```

3. **Create Migration Script**
   - File: `migrations/041_add_demo_system.sql`
   - Include schema changes and initial demo data

### **Phase 37B: Backend API Implementation**

1. **Demo Data API** (`functions/api/demo-data.js`)
   - `GET /api/demo/scenarios` - List available scenarios
   - `POST /api/demo/load-scenario` - Load specific scenario data
   - `POST /api/demo/reset` - Reset demo data to initial state
   - `GET /api/demo/current-scenario` - Get current scenario info

2. **Demo Scenarios API** (`functions/api/demo-scenarios.js`)
   - `GET /api/demo/scenarios/:id` - Get scenario details
   - `POST /api/demo/scenarios/:id/activate` - Switch to scenario
   - `GET /api/demo/scenarios/:id/data` - Get scenario data template

3. **Demo User API** (`functions/api/demo-user.js`)
   - `POST /api/demo/user/create` - Create demo user session
   - `GET /api/demo/user/status` - Check demo user status
   - `POST /api/demo/user/reset` - Reset demo user data

### **Phase 37C: Frontend Implementation**

1. **Demo Dashboard** (`src/pages/Demo.jsx`)
   - Scenario selection interface
   - Demo mode indicators
   - Educational guidance
   - Quick actions for demo features

2. **Demo Components**
   - **ScenarioSelector.jsx** - Choose between healthy/critical scenarios
   - **DemoBanner.jsx** - Persistent demo mode indicator
   - **DataReset.jsx** - Reset demo data functionality
   - **EducationalGuide.jsx** - Contextual help and learning objectives

3. **Demo Integration**
   - Modify existing components to show demo mode indicators
   - Add demo-specific tooltips and guidance
   - Implement demo data loading and reset functionality

## 🎯 **SUCCESS CRITERIA**

### **Database Foundation**
- ✅ `demo_scenarios` table created with scenario definitions
- ✅ `demo_data_snapshots` table created for data management
- ✅ Migration script successfully applied
- ✅ Initial demo data populated

### **Backend Functionality**
- ✅ Demo data management API endpoints working
- ✅ Scenario switching functionality operational
- ✅ Demo user management implemented
- ✅ Data reset functionality working

### **Frontend Experience**
- ✅ Demo dashboard with scenario selection
- ✅ Clear demo mode indicators throughout interface
- ✅ Educational guidance and context provided
- ✅ Smooth scenario switching experience
- ✅ Mobile-responsive demo interface

### **User Experience**
- ✅ Intuitive demo environment setup
- ✅ Clear distinction between demo and production modes
- ✅ Educational value demonstrated through scenarios
- ✅ Easy data reset and scenario switching

## 📋 **IMPLEMENTATION CHECKLIST**

### **Database Layer**
- [ ] Create migration script `041_add_demo_system.sql`
- [ ] Add `demo_scenarios` table
- [ ] Add `demo_data_snapshots` table
- [ ] Populate initial demo scenarios
- [ ] Test migration on preview database
- [ ] Apply migration to production database

### **Backend Layer**
- [ ] Create `functions/api/demo-data.js` for data management
- [ ] Create `functions/api/demo-scenarios.js` for scenario handling
- [ ] Create `functions/api/demo-user.js` for user management
- [ ] Test all API endpoints
- [ ] Verify demo data isolation

### **Frontend Layer**
- [ ] Create `src/pages/Demo.jsx` with scenario selection
- [ ] Create demo-specific components
- [ ] Add demo mode indicators to existing components
- [ ] Implement scenario switching functionality
- [ ] Test demo user experience

### **Testing & Verification**
- [ ] Test scenario switching functionality
- [ ] Test demo data reset and loading
- [ ] Test demo user isolation
- [ ] Verify educational value of scenarios
- [ ] Test mobile responsiveness

## 🚀 **GETTING STARTED**

1. **Start with Database Schema**
   - Create migration script for demo system
   - Test on preview database first

2. **Implement Backend APIs**
   - Create demo data management endpoints
   - Implement scenario switching logic

3. **Build Frontend Components**
   - Create demo dashboard and components
   - Integrate demo mode indicators

4. **Test and Verify**
   - Test scenario switching and data reset
   - Verify educational value and user experience

## 📚 **DOCUMENTATION TO CREATE**

- `PHASE_37_COMPLETION_SUMMARY.md` - Implementation summary
- `PHASE_37_IMPLEMENTATION_GUIDE.md` - Technical implementation details
- `PHASE_37_VISUAL_SUMMARY.md` - Visual implementation overview

## ⚠️ **IMPORTANT NOTES**

- **Data Isolation:** Ensure demo data is completely isolated from production
- **Educational Value:** Focus on creating meaningful learning experiences
- **User Experience:** Make demo mode intuitive and engaging
- **Performance:** Ensure demo data loading is fast and efficient
- **Testing:** Test thoroughly with different scenarios and user flows

---

**Phase 37 Implementation Date:** January 2025  
**Expected Duration:** 3-4 hours  
**Priority:** Medium (Educational and marketing value)

**Next Phase:** Phase 38 - Help Center and Onboarding Guide Expansion
