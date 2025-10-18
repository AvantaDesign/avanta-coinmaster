# Implementation Plan v5

This document outlines the development plan for enhancing the Avanta Finance application. The plan is divided into phases to be implemented by a coding agent in separate sessions.

## Phase 5: In-App Financial Activities and Workflows ✅ COMPLETED

**Goal:** Create a guided experience for the user to perform their regular financial tasks.

**Status:** ✅ **COMPLETED** (Commit: 2abb21c - "Phase 5 Complete: Final documentation and project summary")

**Tasks Completed:**

1.  ✅ **Financial Task Center:**
    *   Created `FinancialTasks.jsx` component with comprehensive task management
    *   Implemented frequency-based organization (daily, weekly, monthly, quarterly, annual)
    *   Added interactive checkboxes for task completion tracking
    *   Included progress indicators and completion statistics
    *   Added filtering by frequency and show/hide completed tasks

2.  ✅ **Reminders and Notifications:**
    *   Created `NotificationCenter.jsx` component with full notification management
    *   Implemented `notifications.js` API endpoint with CRUD operations
    *   Added notification types: payment_reminder, tax_deadline, financial_task, system_alert, low_cash_flow, budget_overrun
    *   Implemented priority levels (high, medium, low) with visual indicators
    *   Added mark as read, dismiss, and snooze functionality

3.  ✅ **User Guide and Onboarding:**
    *   Created `OnboardingGuide.jsx` component with interactive tour
    *   Created `HelpCenter.jsx` component with comprehensive help system
    *   Added contextual help and FAQ sections
    *   Implemented step-by-step walkthrough of main features

4.  ✅ **Enhanced User Experience:**
    *   Created `QuickActions.jsx` component for common tasks
    *   Added dashboard integration with notification and task summary widgets
    *   Implemented database migration `013_add_notifications.sql`
    *   Added proper navigation routes and API utilities


## Phase 6: Business/Personal Separation & Core UI Fixes 🚧 IN PROGRESS

**Goal:** Implement a clear separation between personal and business finances throughout the application and fix critical UI bugs.

**Status:** 🚧 **CURRENT PHASE** - Ready for implementation

**Tasks:**

1.  **Business/Personal Data Model:**
    *   **Database:** Update the schema for `transactions`, `recurring_freelancers`, `recurring_services`, and other relevant tables to include a `type` column (`personal` or `business`). Create a new migration file.
    *   **Backend:** Update all relevant API endpoints (`/api/transactions`, etc.) to handle the new `type` field. This includes `POST`, `PUT`, and `GET` requests. `GET` requests should support filtering by `type`.
    *   **Frontend:**
        *   Add a global filter component (dropdown or segmented control) in the main layout to switch between "All", "Personal", and "Business" views.
        *   Update all forms for creating and editing transactions, recurring payments, etc., to include a "Type" selector.
        *   Connect the global filter to the API calls to fetch and display the correct data.

2.  **Fix Blank Submenu Pages:**
    *   **Investigate:** Identify all submenu links that lead to blank pages. The user reported issues with `Fiscal > Reports` and `Analytics > Profitability`.
    *   **Fix Routes:** Correct the routing configuration in `App.jsx` or the respective parent components to ensure the correct components are rendered.
    *   **Verify:** Test all submenu links to confirm they lead to the correct pages.

3.  **More Category Colors:**
    *   **UI:** In the category creation/editing UI, expand the color palette to offer at least three times as many color options.
    *   **Data:** Ensure the new color values can be stored and retrieved correctly.

## Phase 7: Advanced Financial Planning & Metadata

**Goal:** Introduce savings goals and enhance data with metadata for better organization and insights.

**Tasks:**

1.  **Savings Goals:**
    *   **Database:** Create a new `savings_goals` table with columns for `name`, `target_amount`, `current_amount`, `target_date`, `type` (e.g., investment, personal), etc. Create a new migration file.
    *   **Backend:** Create a new API endpoint `/api/savings-goals` with full CRUD functionality.
    *   **Frontend:**
        *   Create a `SavingsGoals.jsx` component to display and manage goals.
        *   Allow users to link transactions to savings goals to update the `current_amount`.
        *   Integrate a summary of savings goals into the main dashboard.

2.  **Enhanced Metadata:**
    *   **Database:** Add a `metadata` JSON column to key tables like `accounts`, `credits`, `debts`, and `investments`. Create a new migration file.
    *   **Backend:** Update the APIs for these entities to allow storing and retrieving metadata.
    *   **Frontend:**
        *   In the UI for managing accounts, credits, etc., add a section for "Optional Details" or "Tags".
        *   For bank accounts, add a "Bank Name" tag.
        *   Implement logic to automatically suggest relationships between items with the same tags (e.g., show all accounts from the same bank).

## Phase 8: Tax Modernization and Reconciliation

**Goal:** Update the fiscal module to handle historical data, dynamic tax rates, and provide tools for SAT reconciliation.

**Tasks:**

1.  **Historical Data Import:**
    *   **Frontend:** Create a new UI for importing bank statements (e.g., CSV files). Start with a simple one-month import.
    *   **Backend:** Create an API endpoint to parse the imported files and create transactions.

2.  **SAT Reconciliation Tool:**
    *   **Research:** Analyze the SAT regulations for "persona física con actividad empresarial" as of October 2025.
    *   **Frontend:** Create a new `SATReconciliation.jsx` component. This tool will allow users to compare their financial data in the app with their previous tax declarations.
    *   **Backend:** Develop the logic to identify discrepancies and provide suggestions for corrections.

3.  **Dynamic Fiscal Variables:**
    *   **Backend:** Refactor the `fiscal.js` API to fetch tax rates and other fiscal parameters from a new database table (`fiscal_parameters`) instead of having them hardcoded.
    *   **Frontend:** Create a new settings page where users can view and, if necessary, update these fiscal parameters. Analyze which parameters change monthly vs. annually and design the UI accordingly.

## Phase 9: Advanced Features & Mobile Polish

**Goal:** Introduce receipt processing and ensure a flawless mobile experience.

**Tasks:**

1.  **Receipt Upload and OCR:**
    *   **Research:** Investigate free and open-source OCR solutions that can be integrated with Cloudflare Workers.
    *   **Backend:** Create an API endpoint for uploading receipt images to R2. If a free OCR solution is found, integrate it to extract transaction data.
    *   **Frontend:** Add a feature to upload receipts and, if OCR is implemented, review and confirm the extracted transaction data before saving.
    *   **User Approval:** If no suitable free OCR solution is found, present the options and costs to the user for approval before proceeding with a paid solution.

2.  **Mobile Responsiveness Overhaul:**
    *   **Review:** Conduct a full audit of the application on various mobile screen sizes.
    *   **Fix:** Address all responsiveness issues, including layout problems, unclickable elements, and slow loading times.
    *   **Test:** Thoroughly test the application on real mobile devices or emulators to ensure a high-quality user experience.

## Phase 10: Advanced UX & Security

**Goal:** Enhance the user experience with advanced data management features and improve security with audit logging.

**Tasks:**

1.  **Audit Logging:**
    *   **Database:** Create a new `audit_log` table to store information about important user actions (e.g., user ID, action type, timestamp, details). Create a new migration file.
    *   **Backend:** Create a new API endpoint `/api/audit-log` to record and retrieve audit log entries. Integrate logging into key API endpoints for actions like creating/deleting transactions, updating fiscal settings, etc.
    *   **Frontend:** Create a new `AuditLogViewer.jsx` component to display the audit log in a readable format, with options to filter by user or action type.

2.  **Bulk Transaction Editing:**
    *   **Frontend:** In the main transactions view, add checkboxes to each transaction row to allow for multi-selection.
    *   **Frontend:** Add a "Bulk Edit" button that appears when one or more transactions are selected.
    *   **Frontend:** Create a modal or form that allows the user to change the `type` (personal/business), `category`, or other fields for all selected transactions at once.
    *   **Backend:** Create a new API endpoint `/api/transactions/bulk-update` that can efficiently update multiple transactions in a single request.

3.  **Advanced Search and Filtering:**
    *   **Frontend:** Replace the basic search input with an advanced filtering component. This component should allow users to build complex queries by combining multiple conditions.
    *   **Frontend:** Users should be able to filter by:
        *   `type` (personal/business)
        *   `category`
        *   `amount` (e.g., greater than, less than, equal to)
        *   `date range`
        *   `metadata tags` (from Phase 7)
    *   **Backend:** Update the `GET /api/transactions` endpoint to accept and process these advanced filtering parameters.
