# Phase 5: In-App Financial Activities and Workflows - Implementation Prompt

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at D:\AVANTA DESIGN CODE\avanta-coinmaster.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V4.md` for complete project context and progress tracking. This file contains:

- ✅ Phase 1: COMPLETED (Dashboard consolidation and fiscal enhancements)
- ✅ Phase 2: COMPLETED (Recurring Payments and Operational Costs Module)
- ✅ Phase 3: COMPLETED (Advanced Accounting and Reporting)
- ✅ Phase 4: COMPLETED (Treasury and Financial Projections)
- 🚧 Phase 5: CURRENT PHASE (In-App Financial Activities and Workflows)

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V4.md` file with your progress as you complete each task.

## Current Task: Phase 5 - In-App Financial Activities and Workflows

### Goal
Create a guided experience for the user to perform their regular financial tasks, including task management, notifications, and onboarding.

## Actionable Steps

### 1. Financial Task Center

**New Component:** `src/components/FinancialTasks.jsx`

**New API Endpoint:** `functions/api/tasks.js`

**Database Schema:** Create migration `migrations/013_add_tasks_notifications.sql`

**Features to Implement:**

#### Database Tables:
```sql
-- Tasks table for tracking financial tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name TEXT NOT NULL,
    description TEXT,
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'once')),
    category TEXT CHECK(category IN ('tax', 'payment', 'review', 'reconciliation', 'reporting', 'planning', 'other')),
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    due_date TEXT,
    completed_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'overdue')),
    recurrence_rule TEXT, -- For recurring tasks
    next_occurrence TEXT,
    reminder_days_before INTEGER DEFAULT 1,
    assigned_to TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Task completion history
CREATE TABLE task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    completed_date TEXT NOT NULL,
    completion_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

#### Default Tasks to Seed:

**Daily Tasks:**
- Check bank account balances
- Review pending transactions
- Update cash flow status

**Weekly Tasks:**
- Review accounts receivable aging
- Follow up on overdue invoices
- Reconcile petty cash
- Review upcoming bills

**Monthly Tasks:**
- Bank reconciliation for all accounts
- Generate monthly financial reports
- Review budget vs actuals
- Pay recurring bills and freelancers
- Update investment valuations
- Calculate provisional tax payments (Mexico)
- Review credit card statements

**Quarterly Tasks:**
- Quarterly tax filing (IVA, ISR)
- Review and update financial projections
- Portfolio rebalancing review
- Vendor contract reviews

**Annual Tasks:**
- Annual tax return preparation
- Year-end financial statements
- Annual budget planning
- Insurance policy renewals
- Review business goals and KPIs

#### UI Features:
- Task list with filtering by frequency, category, status, and priority
- Calendar view showing tasks by due date
- Task completion with notes
- Quick add task functionality
- Task templates for common financial tasks
- Progress tracking for recurring tasks
- Search and sort functionality

### 2. Reminders and Notifications System

**New Component:** `src/components/NotificationCenter.jsx`

**New API Endpoint:** `functions/api/notifications.js`

**Database Schema Extension:** (part of `migrations/013_add_tasks_notifications.sql`)

**Features to Implement:**

#### Database Table:
```sql
-- Notifications table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_type TEXT CHECK(notification_type IN ('task_reminder', 'payment_due', 'invoice_overdue', 'low_cash_flow', 'debt_payment', 'tax_deadline', 'system', 'other')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    related_entity_type TEXT, -- e.g., 'task', 'payable', 'receivable', 'debt'
    related_entity_id INTEGER,
    status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'dismissed')),
    scheduled_for TEXT, -- For future notifications
    sent_at TEXT,
    read_at TEXT,
    dismissed_at TEXT,
    action_url TEXT, -- Link to relevant page
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);
```

#### Notification Types:
1. **Task Reminders:** Notifications for upcoming tasks (X days before due date)
2. **Payment Due:** Alerts for upcoming payables and debt payments
3. **Invoice Overdue:** Notifications for overdue receivables
4. **Low Cash Flow:** Warnings when projected cash flow is negative
5. **Tax Deadlines:** Reminders for tax filing deadlines
6. **Debt Payments:** Reminders for upcoming loan payments
7. **System Notifications:** Updates and important announcements

#### UI Features:
- Notification bell icon in navigation with badge count
- Notification panel/dropdown showing recent notifications
- Mark as read/unread functionality
- Dismiss notifications
- Filter by type and priority
- Click to navigate to related page
- Notification preferences (which types to receive)

#### Integration Points:
- Display notification count in `NavigationBar` component
- Add notification banner in `FinancialDashboard.jsx` for critical alerts
- Trigger notifications when:
  - Tasks are due soon (configurable days before)
  - Payables are due within 3 days
  - Receivables are overdue
  - Cash flow projection shows negative balance
  - Debt payments are upcoming

### 3. User Guide and Onboarding

**New Component:** `src/components/Onboarding.jsx`

**New Component:** `src/components/HelpCenter.jsx`

**Features to Implement:**

#### Onboarding Flow:
Create a multi-step modal wizard for new users:

**Step 1: Welcome**
- Introduction to Avanta Finance
- Overview of key features
- Quick tour option

**Step 2: Initial Setup**
- Add first bank account
- Set up initial categories
- Configure fiscal settings (RFC, tax regime)

**Step 3: Quick Start Guide**
- Add a sample transaction
- View the dashboard
- Explore navigation

**Step 4: Customize**
- Set up recurring payments
- Configure task preferences
- Set notification preferences

**Step 5: Complete**
- Summary of setup
- Next steps
- Link to help center

#### Help Center Features:
- Searchable help articles
- Video tutorials (links or embedded)
- FAQ section organized by category
- Keyboard shortcuts guide
- Contact support option
- "What's New" section for updates

#### Help Topics to Cover:
1. Getting Started
2. Managing Accounts
3. Recording Transactions
4. Invoicing and Receivables
5. Bills and Payables
6. Budgeting
7. Treasury and Projections
8. Reports and Analytics
9. Tax Compliance (Mexico-specific)
10. Recurring Payments
11. Keyboard Shortcuts

### 4. Navigation and Integration

**Updates Required:**

1. **Add to Navigation Bar (`App.jsx`):**
   - Notification icon with badge
   - Help icon/button
   - Add "Tareas" to navigation dropdown

2. **Add Routes:**
   - `/tasks` - Financial Task Center
   - `/notifications` - Notification Center
   - `/help` - Help Center
   - `/onboarding` - Onboarding wizard

3. **Dashboard Integration (`FinancialDashboard.jsx`):**
   - Add "Today's Tasks" widget
   - Add critical notifications banner
   - Add quick task completion buttons

4. **API Helper Functions (`src/utils/api.js`):**
   - Add task CRUD operations
   - Add notification operations
   - Add task completion tracking

### 5. Additional Enhancements

#### Keyboard Shortcuts:
Implement a keyboard shortcuts system for power users:
- `Ctrl/Cmd + K`: Quick command palette
- `Ctrl/Cmd + N`: New transaction
- `Ctrl/Cmd + T`: Toggle tasks panel
- `Ctrl/Cmd + /`: Open help
- `Ctrl/Cmd + ,`: Settings/preferences

**New Component:** `src/components/CommandPalette.jsx`

#### Quick Actions Panel:
Add a floating action button or quick actions panel for common tasks:
- Add transaction
- Create invoice
- Record payment
- Add task
- Export data

**New Component:** `src/components/QuickActions.jsx`

## Verification Steps

1. Run `npm run build` to ensure the application compiles without errors
2. Test task creation, editing, and completion
3. Verify task recurrence works correctly
4. Test notification generation and display
5. Verify notifications link to correct pages
6. Test onboarding flow for new users
7. Ensure help center content is accessible
8. Test keyboard shortcuts
9. Verify all new features integrate properly with existing components
10. Test notification preferences
11. Verify task filtering and search functionality

## Progress Tracking

**MANDATORY:** Update `IMPLEMENTATION_PLAN_V4.md` with checkmarks (✅) as you complete each task.

- Mark subtasks as completed with descriptive commit messages
- Update the Phase 5 section with detailed completion notes
- Mark Phase 5 as completed when all tasks are done

## Technical Considerations

1. **Follow Existing Patterns:**
   - Use the same component structure as other dashboards
   - Follow the API pattern from existing endpoints
   - Use the same styling and UI components

2. **Responsive Design:**
   - Ensure all new components work on mobile, tablet, and desktop
   - Use Tailwind CSS utilities consistently
   - Test dark mode support

3. **Performance:**
   - Lazy load the onboarding component
   - Optimize notification polling (use intervals or WebSocket if available)
   - Paginate task lists for large datasets

4. **Data Validation:**
   - Validate task recurrence rules
   - Ensure notification scheduling works correctly
   - Validate due dates and reminder configurations

5. **User Experience:**
   - Provide clear feedback on actions
   - Use loading states appropriately
   - Implement error handling with user-friendly messages
   - Add confirmation dialogs for destructive actions

6. **Accessibility:**
   - Ensure keyboard navigation works
   - Use proper ARIA labels
   - Provide text alternatives for icons

## Database Seeding

Create a seed script or migration to populate default tasks for new users:
- Location: `migrations/014_seed_default_tasks.sql` or similar
- Include tasks for all frequencies (daily, weekly, monthly, quarterly, annual)
- Set appropriate priorities and categories

## Testing Checklist

- [ ] Create and complete daily tasks
- [ ] Create and complete recurring tasks
- [ ] Verify task recurrence generates new occurrences
- [ ] Test notification creation for various triggers
- [ ] Test marking notifications as read/dismissed
- [ ] Complete onboarding flow as a new user
- [ ] Navigate help center and search for topics
- [ ] Test keyboard shortcuts
- [ ] Use quick actions panel
- [ ] Test command palette
- [ ] Verify task filtering and sorting
- [ ] Test notification preferences
- [ ] Verify task calendar view
- [ ] Test task templates
- [ ] Verify integration with dashboard

## Next Steps

Upon successful completion and verification of all Phase 5 tasks:

1. Generate a comprehensive summary of Phase 5 implementation
2. Document any remaining technical debt or future enhancements
3. Create a maintenance and support guide
4. Prepare user documentation
5. Consider Phase 6 enhancements (if needed):
   - Multi-user support and permissions
   - Advanced reporting and analytics
   - Integration with external services (banks, accounting software)
   - Mobile app development
   - Advanced automation workflows

## Important Notes

- **Minimal Changes:** Make the smallest possible changes to achieve the goals
- **Consistency:** Maintain consistency with existing UI/UX patterns
- **Testing:** Test thoroughly before committing
- **Documentation:** Update all relevant documentation as you go
- **Error Handling:** Implement proper error handling throughout
- **User Feedback:** Provide clear, actionable feedback to users

## Success Criteria

Phase 5 will be considered complete when:

1. ✅ All database migrations are created and documented
2. ✅ All API endpoints are implemented and tested
3. ✅ All frontend components are created and functional
4. ✅ Navigation and routing are updated
5. ✅ Dashboard integration is complete
6. ✅ All verification tests pass
7. ✅ Build succeeds without errors
8. ✅ IMPLEMENTATION_PLAN_V4.md is updated with completion status
9. ✅ Code is committed with descriptive messages
10. ✅ User documentation is created or updated

Good luck with Phase 5 implementation!
