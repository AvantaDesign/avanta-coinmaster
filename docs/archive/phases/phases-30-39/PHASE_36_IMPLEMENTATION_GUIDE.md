# Phase 36: Task System Redesign - Implementation Guide

This guide provides detailed technical documentation for the Phase 36 implementation of the Task System Redesign as Interactive Guide.

---

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend APIs](#backend-apis)
4. [Frontend Components](#frontend-components)
5. [Task Engine Logic](#task-engine-logic)
6. [Declaration Guide System](#declaration-guide-system)
7. [Integration Guide](#integration-guide)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Tasks.jsx    │  │ TaskCard.jsx │  │ DeclarationG.│     │
│  │ (Dashboard)  │  │ (Display)    │  │ (Guide)      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          │ HTTP/HTTPS       │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend APIs (Cloudflare Workers)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │task-engine  │  │declaration- │  │task-        │        │
│  │.js          │  │guide.js     │  │templates.js │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (Cloudflare D1 - SQLite)              │
│  ┌─────────────────┐  ┌──────────────────┐                │
│  │financial_tasks  │  │declaration_steps │                │
│  ├─────────────────┤  ├──────────────────┤                │
│  │task_templates   │  │user_declaration_ │                │
│  │                 │  │progress          │                │
│  ├─────────────────┤  └──────────────────┘                │
│  │task_progress    │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### Enhanced financial_tasks Table

```sql
-- Original columns
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id TEXT NOT NULL
task_key TEXT NOT NULL
frequency TEXT NOT NULL -- daily, weekly, monthly, quarterly, annual
title TEXT NOT NULL
description TEXT
category TEXT
is_completed BOOLEAN DEFAULT 0
completed_at TIMESTAMP
due_date DATE
created_at TIMESTAMP
updated_at TIMESTAMP

-- Phase 36 additions
completion_criteria TEXT                -- JSON criteria
progress_percentage INTEGER DEFAULT 0   -- 0-100
last_evaluated_at TEXT                  -- Evaluation timestamp
auto_update INTEGER DEFAULT 1           -- Enable/disable auto-evaluation
task_type TEXT DEFAULT 'manual'         -- manual, auto, declaration, custom
notes TEXT                              -- User notes
```

### task_templates Table

```sql
CREATE TABLE task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,        -- monthly, annual, quarterly, custom, declaration
    description TEXT,
    completion_criteria TEXT NOT NULL,  -- JSON criteria structure
    priority INTEGER DEFAULT 1,         -- 1=highest, 5=lowest
    category TEXT,
    estimated_duration INTEGER,         -- Minutes
    help_text TEXT,
    default_auto_update INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### task_progress Table

```sql
CREATE TABLE task_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    completion_data TEXT,               -- JSON with completion details
    evaluation_criteria TEXT,           -- JSON snapshot of criteria
    evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES financial_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### declaration_steps Table

```sql
CREATE TABLE declaration_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    declaration_type TEXT NOT NULL,     -- isr, iva, diot, annual_isr, annual_iva
    step_number INTEGER NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    step_criteria TEXT,                 -- JSON completion criteria
    required_fields TEXT,               -- JSON required data fields
    help_text TEXT,
    validation_rules TEXT,              -- JSON validation rules
    common_errors TEXT,                 -- JSON common mistakes
    is_required INTEGER DEFAULT 1,
    estimated_time INTEGER,             -- Minutes
    display_order INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(declaration_type, step_number)
);
```

### user_declaration_progress Table

```sql
CREATE TABLE user_declaration_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    declaration_type TEXT NOT NULL,
    declaration_period TEXT NOT NULL,   -- YYYY-MM or YYYY
    current_step INTEGER DEFAULT 1,
    completed_steps TEXT,               -- JSON array of step IDs
    step_data TEXT,                     -- JSON with collected data
    overall_progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',  -- not_started, in_progress, completed, submitted
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, declaration_type, declaration_period)
);
```

---

## 🔌 Backend APIs

### Task Engine API (task-engine.js)

#### Evaluate All Tasks
```javascript
POST /api/task-engine/evaluate-all

Response:
{
  "message": "Tasks evaluated successfully",
  "evaluated": 15,
  "results": [
    {
      "taskId": 1,
      "success": true,
      "progress": 75,
      "previousProgress": 50,
      "completionData": { ... }
    }
  ]
}
```

#### Evaluate Single Task
```javascript
POST /api/task-engine/evaluate-task
Body: { "taskId": 1 }

Response:
{
  "message": "Task evaluated successfully",
  "result": {
    "taskId": 1,
    "success": true,
    "progress": 75,
    "completionData": { ... }
  }
}
```

#### Get Criteria Template
```javascript
GET /api/task-engine/criteria/:taskType

Response:
{
  "template": "Declaración ISR Mensual",
  "description": "...",
  "criteria": {
    "type": "declaration",
    "declaration_type": "isr",
    "steps_required": 5
  },
  "help": "...",
  "estimatedDuration": 60
}
```

### Declaration Guide API (declaration-guide.js)

#### Get Declaration Steps
```javascript
GET /api/declaration-guide/:type

Response:
{
  "declaration_type": "isr",
  "steps": [
    {
      "id": 1,
      "step_number": 1,
      "step_title": "Verificar Ingresos del Periodo",
      "step_description": "...",
      "required_fields": ["total_income", "invoice_count"],
      "help_text": "...",
      "validation_rules": { ... }
    }
  ],
  "total_steps": 5,
  "total_estimated_time": 60
}
```

#### Start Declaration
```javascript
POST /api/declaration-guide/:type/start
Body: { "declaration_period": "2025-01" }

Response:
{
  "message": "Declaration started successfully",
  "declaration_id": 123,
  "declaration_type": "isr",
  "declaration_period": "2025-01",
  "status": "in_progress",
  "current_step": 1
}
```

#### Complete Step
```javascript
PUT /api/declaration-guide/:type/step/:stepId
Body: {
  "declaration_period": "2025-01",
  "step_data": { "total_income": 50000 },
  "validation_passed": true
}

Response:
{
  "message": "Step completed successfully",
  "step_number": 1,
  "step_title": "Verificar Ingresos del Periodo",
  "overall_progress": 20,
  "completed_steps": 1,
  "total_steps": 5,
  "next_step": 2,
  "status": "in_progress"
}
```

### Task Templates API (task-templates.js)

#### List Templates
```javascript
GET /api/task-templates
GET /api/task-templates?type=monthly
GET /api/task-templates?category=tax

Response:
{
  "templates": [ ... ],
  "grouped": {
    "tax": [ ... ],
    "invoices": [ ... ]
  },
  "total": 8
}
```

#### Create Task from Template
```javascript
POST /api/task-templates
Body: {
  "template_id": 1,
  "due_date": "2025-02-17",
  "frequency": "monthly"
}

Response:
{
  "message": "Task created successfully from template",
  "task": { ... },
  "template": {
    "id": 1,
    "name": "Declaración ISR Mensual",
    "help_text": "...",
    "estimated_duration": 60
  }
}
```

---

## 🎨 Frontend Components

### Tasks.jsx (Main Dashboard)

```jsx
import Tasks from './pages/Tasks';

// Usage
<Route path="/tasks" element={<Tasks />} />
```

**Key Features:**
- Overall progress tracking
- Task grouping (Overdue, Due Soon, In Progress, etc.)
- Filter by frequency and type
- Quick actions for declarations
- Statistics cards
- Custom task modal
- Declaration guide modal

### TaskProgressBar.jsx

```jsx
import TaskProgressBar from './components/tasks/TaskProgressBar';

// Usage
<TaskProgressBar 
  progress={75}
  showLabel={true}
  height="h-4"
  color="primary"
  animated={true}
/>
```

**Props:**
- `progress` (0-100) - Progress percentage
- `showLabel` (boolean) - Show percentage label
- `height` (string) - Tailwind height class
- `color` (string) - 'primary', 'white', or custom color
- `animated` (boolean) - Enable animations

### TaskCard.jsx

```jsx
import TaskCard from './components/tasks/TaskCard';

// Usage
<TaskCard 
  task={taskObject}
  onToggle={(taskId) => handleToggle(taskId)}
  onOpenDeclaration={(type) => handleOpenDeclaration(type)}
/>
```

**Task Object:**
```javascript
{
  id: 1,
  title: "Declaración ISR Mensual",
  description: "...",
  frequency: "monthly",
  task_type: "declaration",
  progress_percentage: 75,
  is_completed: false,
  due_date: "2025-02-17",
  category: "tax",
  completion_criteria: { ... }
}
```

### CustomTaskManager.jsx

```jsx
import CustomTaskManager from './components/tasks/CustomTaskManager';

// Usage
{showModal && (
  <CustomTaskManager
    onClose={() => setShowModal(false)}
    onTaskCreated={() => {
      setShowModal(false);
      loadTasks();
    }}
  />
)}
```

### DeclarationGuide.jsx

```jsx
import DeclarationGuide from './components/tasks/DeclarationGuide';

// Usage
{showGuide && (
  <DeclarationGuide
    declarationType="isr"  // or 'iva', 'diot'
    onClose={() => setShowGuide(false)}
  />
)}
```

---

## ⚙️ Task Engine Logic

### Completion Criteria Structure

#### Count-Based Criteria
```json
{
  "type": "count",
  "resource": "invoices",
  "field": "status",
  "value": "uploaded",
  "min": 5
}
```
**Evaluation:** Counts items matching criteria. Progress = (count / min) * 100

#### Percentage-Based Criteria
```json
{
  "type": "percentage",
  "resource": "transactions",
  "field": "is_reconciled",
  "min": 95
}
```
**Evaluation:** Calculates percentage of matching items. Progress = (percentage / min) * 100

#### Boolean-Based Criteria
```json
{
  "type": "boolean",
  "checks": [
    "income_recorded",
    "expenses_recorded",
    "invoices_uploaded"
  ]
}
```
**Evaluation:** Checks multiple conditions. Progress = (completed / total) * 100

#### Declaration Criteria
```json
{
  "type": "declaration",
  "declaration_type": "isr",
  "steps_required": 5,
  "validation": [
    "income_recorded",
    "deductions_calculated",
    "payment_prepared"
  ]
}
```
**Evaluation:** Based on user_declaration_progress. Progress = declaration.overall_progress

#### Reconciliation Criteria
```json
{
  "type": "reconciliation",
  "threshold": 95,
  "criteria": [
    "statement_uploaded",
    "transactions_matched",
    "differences_resolved"
  ]
}
```
**Evaluation:**
- 33% - Statements uploaded
- 33% - Transactions matched
- 34% - Match percentage >= threshold

### Adding New Criteria Types

1. **Define Criteria Structure**
```javascript
{
  "type": "your_new_type",
  "param1": value1,
  "param2": value2
}
```

2. **Add Evaluation Function**
```javascript
// In task-engine.js
async function evaluateYourNewTypeCriteria(db, userId, criteria) {
  const { param1, param2 } = criteria;
  
  // Your evaluation logic
  const progress = calculateProgress();
  const completionData = getCompletionData();
  
  return { progress, completionData };
}
```

3. **Add to Switch Statement**
```javascript
switch (criteria.type) {
  // ... existing cases
  case 'your_new_type':
    ({ progress, completionData } = await evaluateYourNewTypeCriteria(db, userId, criteria));
    break;
}
```

---

## 📋 Declaration Guide System

### Declaration Types

#### ISR (Impuesto Sobre la Renta)
**5 Steps:**
1. Verificar Ingresos del Periodo
2. Calcular Deducciones Autorizadas
3. Determinar Base Gravable
4. Calcular ISR a Pagar
5. Preparar Pago

**Estimated Time:** 60 minutes

#### IVA (Impuesto al Valor Agregado)
**4 Steps:**
1. Calcular IVA Cobrado
2. Calcular IVA Acreditable
3. Determinar IVA a Pagar o a Favor
4. Preparar Pago o Solicitar Devolución

**Estimated Time:** 45 minutes

#### DIOT (Declaración Informativa de Operaciones con Terceros)
**3 Steps:**
1. Identificar Proveedores
2. Clasificar Operaciones
3. Generar Archivo TXT

**Estimated Time:** 30 minutes

### Adding New Declaration Types

1. **Add Declaration Steps to Database**
```sql
INSERT INTO declaration_steps (
  declaration_type, step_number, step_title,
  step_description, help_text, display_order
) VALUES
('new_type', 1, 'Step 1 Title', 'Description', 'Help text', 1),
('new_type', 2, 'Step 2 Title', 'Description', 'Help text', 2);
```

2. **Add to DeclarationGuide Component**
```javascript
const getDeclarationTitle = (type) => {
  const titles = {
    // ... existing
    'new_type': '📑 New Declaration Type'
  };
  return titles[type] || 'Declaración';
};
```

3. **Add Quick Action Button**
```jsx
<button
  onClick={() => handleOpenDeclaration('new_type')}
  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
>
  📑 New Declaration
</button>
```

---

## 🔗 Integration Guide

### Integrating with Existing Features

#### Fiscal Module Integration
```javascript
// In fiscal calculation functions
import { evaluateTask } from './task-engine';

async function calculateMonthlyTax(userId) {
  // Existing calculation logic
  
  // Update ISR declaration task progress
  await evaluateTask(db, userId, isrTaskId);
}
```

#### Invoice Module Integration
```javascript
// After invoice upload
import { evaluateTask } from './task-engine';

async function uploadInvoice(userId, invoiceData) {
  // Upload invoice
  
  // Update invoice review task
  await evaluateTask(db, userId, invoiceReviewTaskId);
}
```

### Creating Custom Integrations

```javascript
// Example: Update task after completing an action
async function yourCustomAction(userId) {
  // Your action logic
  
  // Evaluate relevant tasks
  await fetch('/api/task-engine/evaluate-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Task Management
- [ ] Create custom task
- [ ] View task list
- [ ] Filter by frequency
- [ ] Filter by type
- [ ] Toggle task completion
- [ ] View task details
- [ ] Edit task
- [ ] Delete task

#### Progress Tracking
- [ ] Verify progress bar displays
- [ ] Check color coding (red → green)
- [ ] Confirm automatic updates
- [ ] Test manual progress update
- [ ] Verify progress history

#### Declaration Guides
- [ ] Start ISR declaration
- [ ] Navigate through steps
- [ ] Complete step with data
- [ ] View progress
- [ ] Resume in-progress declaration
- [ ] Complete declaration

#### Task Templates
- [ ] List available templates
- [ ] Create task from template
- [ ] Verify template data applied
- [ ] Admin: Update template
- [ ] Admin: Deactivate template

### API Testing with cURL

```bash
# Evaluate all tasks
curl -X POST https://your-domain.com/api/task-engine/evaluate-all \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get declaration steps
curl https://your-domain.com/api/declaration-guide/isr \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start declaration
curl -X POST https://your-domain.com/api/declaration-guide/isr/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"declaration_period": "2025-01"}'

# List templates
curl https://your-domain.com/api/task-templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Testing

```sql
-- Check task progress
SELECT id, title, progress_percentage, last_evaluated_at
FROM financial_tasks
WHERE user_id = 'test_user'
ORDER BY progress_percentage DESC;

-- Check declaration progress
SELECT declaration_type, declaration_period, current_step, overall_progress
FROM user_declaration_progress
WHERE user_id = 'test_user';

-- Check task history
SELECT tp.*, ft.title
FROM task_progress tp
JOIN financial_tasks ft ON tp.task_id = ft.id
WHERE tp.user_id = 'test_user'
ORDER BY tp.evaluated_at DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: Tasks not auto-updating
**Solution:**
1. Check `auto_update` field is set to 1
2. Verify `completion_criteria` is valid JSON
3. Check task engine logs
4. Manually trigger evaluation: `POST /api/task-engine/evaluate-task`

#### Issue: Progress bar shows incorrect percentage
**Solution:**
1. Check `progress_percentage` value in database
2. Verify criteria evaluation logic
3. Re-evaluate task: `POST /api/task-engine/evaluate-task`
4. Check task_progress history

#### Issue: Declaration guide not loading steps
**Solution:**
1. Verify declaration_steps exist in database
2. Check declaration_type parameter
3. Review API response for errors
4. Verify user has proper permissions

#### Issue: Custom task creation fails
**Solution:**
1. Check required fields (title, frequency, task_key)
2. Verify task_key is unique
3. Check for database constraints
4. Review validation errors

### Debug Mode

Enable debug logging:
```javascript
// In task-engine.js
const DEBUG = true;

if (DEBUG) {
  console.log('Evaluating task:', task.id);
  console.log('Criteria:', criteria);
  console.log('Progress:', progress);
}
```

### Performance Optimization

```javascript
// Batch evaluate tasks
const taskIds = [1, 2, 3, 4, 5];
await Promise.all(
  taskIds.map(id => evaluateTask(db, userId, id))
);

// Cache evaluation results
const cache = new Map();
if (cache.has(taskId)) {
  return cache.get(taskId);
}
```

---

## 📞 Support

For additional help:
- Review `PHASE_36_COMPLETION_SUMMARY.md`
- Check Cloudflare Workers logs
- Review D1 database logs
- Consult IMPLEMENTATION_PLAN_V8.md

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Complete
