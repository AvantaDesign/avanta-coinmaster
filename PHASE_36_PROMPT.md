# Phase 36: Task System Redesign as Interactive Guide - Agent Prompt

## 🎯 **MISSION: Transform Tasks into Proactive Interactive Guide**

You are tasked with implementing **Phase 36: Task System Redesign as Interactive Guide** of the Avanta Finance platform. This phase focuses on transforming the tasks dashboard into a proactive, automated system that guides users through their fiscal obligations with interactive progress tracking.

## 📋 **CONTEXT & CURRENT STATUS**

### **Official Implementation Plan**
This phase is defined in **`IMPLEMENTATION_PLAN_V8.md`** - Phase 36: Task System Redesign as Interactive Guide (Formerly Phase 33)

### **Phase 35 COMPLETE ✅**
- **Centralized Settings Panel:** ✅ COMPLETE - Unified settings interface with tabbed navigation
- **Fiscal Certificate Management:** ✅ COMPLETE - Upload and OCR analysis functionality
- **User Preferences:** ✅ COMPLETE - Centralized preference management
- **Database Migration:** ✅ COMPLETE - Migration 039 applied to production

### **System Architecture**
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Cloudflare Workers Functions (JavaScript) with security hardening
- **Database:** Cloudflare D1 (SQLite) with INTEGER cents-based monetary storage
- **Storage:** Cloudflare R2 for file storage
- **Deployment:** Cloudflare Pages with Workers Functions

## 🎯 **PHASE 36 OBJECTIVES**

**Reference:** See `IMPLEMENTATION_PLAN_V8.md` - Phase 36: Task System Redesign as Interactive Guide for the official technical plan.

### **1. Tasks as Automatic Progress Bars**
- Redesign tasks database to include completion criteria (`completion_criteria`)
- Create "Task Engine" that evaluates criteria and updates progress automatically
- Display tasks as visual progress bars with completion percentages
- Implement automatic task status updates based on user actions

### **2. Interactive Guide for Declarations**
- Create step-by-step guides for fiscal declarations (ISR, IVA, DIOT)
- Provide contextual help and explanations for each step
- Integrate with existing fiscal calculation engine
- Add validation and error checking for declaration completeness

### **3. Custom Task Management**
- Allow users to create custom tasks and goals
- Set personal deadlines and reminders
- Track progress on business-specific obligations
- Integrate with calendar and notification systems

## 📁 **KEY FILES TO WORK WITH**

### **Backend APIs** (functions/api/)
- `tasks.js` - Enhanced task management endpoints
- `task-engine.js` - Task evaluation and progress calculation engine
- `declaration-guide.js` - Interactive declaration guidance system
- `task-templates.js` - Predefined task templates for common obligations

### **Frontend Components** (src/)
- `src/pages/Tasks.jsx` - Redesigned tasks dashboard with progress bars
- `src/components/tasks/` - Task-specific components
- `src/components/tasks/TaskProgressBar.jsx` - Visual progress indicators
- `src/components/tasks/DeclarationGuide.jsx` - Interactive declaration walkthrough
- `src/components/tasks/CustomTaskManager.jsx` - Custom task creation and management
- `src/components/tasks/TaskEngine.jsx` - Task evaluation and status updates

### **Database Schema** (schema.sql)
- Enhanced `tasks` table with completion criteria and progress tracking
- `task_templates` table for predefined task types
- `task_progress` table for tracking completion history
- `declaration_steps` table for guided declaration processes

## 🔧 **TECHNICAL IMPLEMENTATION PLAN**

### **Phase 36A: Database Schema Updates**

1. **Enhance Tasks Table**
   ```sql
   ALTER TABLE tasks ADD COLUMN completion_criteria TEXT; -- JSON criteria
   ALTER TABLE tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0;
   ALTER TABLE tasks ADD COLUMN last_evaluated_at TEXT;
   ALTER TABLE tasks ADD COLUMN auto_update BOOLEAN DEFAULT true;
   ALTER TABLE tasks ADD COLUMN task_type TEXT DEFAULT 'manual'; -- manual, auto, declaration
   ```

2. **Create Task Templates Table**
   ```sql
   CREATE TABLE task_templates (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     template_name TEXT NOT NULL,
     template_type TEXT NOT NULL, -- 'monthly', 'annual', 'quarterly', 'custom'
     description TEXT,
     completion_criteria TEXT NOT NULL, -- JSON criteria
     priority INTEGER DEFAULT 1,
     category TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Create Task Progress Table**
   ```sql
   CREATE TABLE task_progress (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     task_id INTEGER NOT NULL,
     user_id TEXT NOT NULL,
     progress_percentage INTEGER DEFAULT 0,
     completion_data TEXT, -- JSON with completion details
     evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   ```

4. **Create Declaration Steps Table**
   ```sql
   CREATE TABLE declaration_steps (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     declaration_type TEXT NOT NULL, -- 'isr', 'iva', 'diot'
     step_number INTEGER NOT NULL,
     step_title TEXT NOT NULL,
     step_description TEXT,
     step_criteria TEXT, -- JSON completion criteria
     required_fields TEXT, -- JSON required data fields
     help_text TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );
   ```

5. **Create Migration Script**
   - File: `migrations/040_enhance_task_system.sql`
   - Include schema changes and initial task templates

### **Phase 36B: Backend API Implementation**

1. **Enhanced Tasks API** (`functions/api/tasks.js`)
   - `GET /api/tasks` - List tasks with progress information
   - `POST /api/tasks` - Create new task (manual or from template)
   - `PUT /api/tasks/:id` - Update task details
   - `GET /api/tasks/:id/progress` - Get detailed progress information
   - `POST /api/tasks/:id/evaluate` - Manually trigger task evaluation

2. **Task Engine API** (`functions/api/task-engine.js`)
   - `POST /api/task-engine/evaluate-all` - Evaluate all user tasks
   - `POST /api/task-engine/evaluate/:taskId` - Evaluate specific task
   - `GET /api/task-engine/criteria/:taskType` - Get completion criteria for task type
   - `POST /api/task-engine/update-progress` - Update task progress

3. **Declaration Guide API** (`functions/api/declaration-guide.js`)
   - `GET /api/declaration-guide/:type` - Get declaration steps for type
   - `POST /api/declaration-guide/:type/start` - Start guided declaration
   - `PUT /api/declaration-guide/:type/step/:stepId` - Complete declaration step
   - `GET /api/declaration-guide/:type/progress` - Get declaration progress

4. **Task Templates API** (`functions/api/task-templates.js`)
   - `GET /api/task-templates` - List available task templates
   - `POST /api/task-templates` - Create task from template
   - `GET /api/task-templates/:id` - Get template details

### **Phase 36C: Frontend Implementation**

1. **Redesigned Tasks Dashboard** (`src/pages/Tasks.jsx`)
   - Progress bar visualization for all tasks
   - Task categorization (Overdue, Due Soon, In Progress, Completed)
   - Interactive task cards with expandable details
   - Quick actions (Mark Complete, Add Note, Edit)

2. **Task Progress Components**
   - **TaskProgressBar.jsx** - Visual progress indicator
   - **TaskCard.jsx** - Individual task display with actions
   - **TaskCategory.jsx** - Grouped task display
   - **TaskFilters.jsx** - Filter and sort options

3. **Declaration Guide Components**
   - **DeclarationGuide.jsx** - Main declaration walkthrough
   - **DeclarationStep.jsx** - Individual step component
   - **DeclarationProgress.jsx** - Overall progress tracking
   - **DeclarationValidation.jsx** - Step validation and error display

4. **Custom Task Management**
   - **CustomTaskManager.jsx** - Create and manage custom tasks
   - **TaskTemplateSelector.jsx** - Choose from predefined templates
   - **TaskDeadlineManager.jsx** - Set deadlines and reminders
   - **TaskNotes.jsx** - Add notes and comments

## 🎯 **SUCCESS CRITERIA**

### **Database Foundation**
- ✅ Enhanced `tasks` table with completion criteria and progress tracking
- ✅ `task_templates` table created with predefined task types
- ✅ `task_progress` table for progress history tracking
- ✅ `declaration_steps` table for guided declaration processes
- ✅ Migration script successfully applied

### **Backend Functionality**
- ✅ Task engine evaluates completion criteria automatically
- ✅ Progress bars update based on user actions and data
- ✅ Declaration guides provide step-by-step assistance
- ✅ Task templates enable quick task creation
- ✅ User data isolation maintained

### **Frontend Experience**
- ✅ Tasks displayed as interactive progress bars
- ✅ Declaration guides provide contextual help
- ✅ Custom task creation and management working
- ✅ Mobile-responsive design with intuitive navigation
- ✅ Real-time progress updates

### **User Experience**
- ✅ Proactive task management with automatic progress tracking
- ✅ Guided declaration process reduces errors and confusion
- ✅ Custom tasks enable personalized obligation tracking
- ✅ Clear visual feedback on task completion status

## 📋 **IMPLEMENTATION CHECKLIST**

### **Database Layer**
- [ ] Create migration script `040_enhance_task_system.sql`
- [ ] Enhance `tasks` table with completion criteria
- [ ] Add `task_templates` table
- [ ] Add `task_progress` table
- [ ] Add `declaration_steps` table
- [ ] Test migration on preview database
- [ ] Apply migration to production database

### **Backend Layer**
- [ ] Enhance `functions/api/tasks.js` with progress tracking
- [ ] Create `functions/api/task-engine.js` for evaluation logic
- [ ] Create `functions/api/declaration-guide.js` for guided processes
- [ ] Create `functions/api/task-templates.js` for template management
- [ ] Test all API endpoints
- [ ] Verify user data isolation

### **Frontend Layer**
- [ ] Redesign `src/pages/Tasks.jsx` with progress bars
- [ ] Create task progress components
- [ ] Implement declaration guide components
- [ ] Create custom task management interface
- [ ] Test all task functionality
- [ ] Verify mobile responsiveness

### **Testing & Verification**
- [ ] Test task engine evaluation logic
- [ ] Test declaration guide step completion
- [ ] Test custom task creation and management
- [ ] Test progress bar updates
- [ ] Verify task persistence across sessions
- [ ] Test user data isolation

## 🚀 **GETTING STARTED**

1. **Start with Database Schema**
   - Create migration script for enhanced task system
   - Test on preview database first

2. **Implement Task Engine**
   - Create evaluation logic for completion criteria
   - Implement automatic progress calculation

3. **Build Frontend Components**
   - Redesign tasks dashboard with progress bars
   - Implement declaration guides

4. **Test and Verify**
   - Test task evaluation and progress updates
   - Verify declaration guide functionality

## 📚 **DOCUMENTATION TO CREATE**

- `PHASE_36_COMPLETION_SUMMARY.md` - Implementation summary
- `PHASE_36_IMPLEMENTATION_GUIDE.md` - Technical implementation details
- `PHASE_36_VISUAL_SUMMARY.md` - Visual implementation overview

## ⚠️ **IMPORTANT NOTES**

- **Task Engine Logic:** Ensure evaluation criteria are comprehensive and accurate
- **Declaration Integration:** Leverage existing fiscal calculation engine
- **Progress Tracking:** Implement efficient progress calculation algorithms
- **User Experience:** Focus on intuitive task management and guidance
- **Testing:** Test thoroughly with various task types and completion scenarios

---

**Phase 36 Implementation Date:** January 2025  
**Expected Duration:** 4-5 hours  
**Priority:** High (User experience and compliance improvement)

**Next Phase:** Phase 37 - Advanced Demo Experience
