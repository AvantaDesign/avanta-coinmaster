# Implementation Plan v4

This document outlines the development plan for enhancing the Avanta Finance application. The plan is divided into phases to be implemented by a coding agent in separate sessions.

## Phase 1: Core Functionality Refinement and Dashboard Consolidation ✅ COMPLETED

**Goal:** Refine existing features to align with user requirements and consolidate the main dashboard for a more streamlined user experience.

**Status:** ✅ **COMPLETED** (Commit: 90c8b23 - "Phase 1: Dashboard consolidation and fiscal enhancements complete")

**Tasks Completed:**

1.  ✅ **Analyze Existing Dashboards:**
    *   Reviewed the code for `AdminDashboard.jsx`, `FinancialDashboard.jsx`, and `CustomizableDashboard.jsx`.
    *   Identified the widgets and data displayed in each.

2.  ✅ **Consolidate the Main Dashboard:**
    *   Modified `FinancialDashboard.jsx` to be the primary dashboard.
    *   Integrated essential summaries from other dashboards into `FinancialDashboard.jsx`, including:
        *   Account balances (`AccountBreakdown.jsx`)
        *   Budget summary (`BudgetSummaryWidget.jsx`)
        *   Upcoming payments (`UpcomingPayments.jsx`)
        *   A new summary for Accounts Payable and Receivable.
    *   Deprecated and removed `CustomizableDashboard.jsx` (deleted in commit 90c8b23).

3.  ✅ **Enhance Fiscal Compliance:**
    *   Reviewed and updated the logic in `fiscal.js` and `FiscalCalculator.jsx` to ensure it correctly handles tax calculations for a "persona física con actividad empresarial" in Mexico.
    *   Added options for different tax regimes.

4.  ✅ **Improve Upcoming Payments:**
    *   Enhanced `UpcomingPayments.jsx` to better distinguish between different types of upcoming payments (e.g., one-time vs. recurring).

## Phase 2: Recurring Payments and Operational Costs Module ✅ COMPLETED

**Goal:** Implement dedicated dashboards for managing recurring payments and operational costs, and integrate them with the core financial system.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Database Schema Extension:**
    *   Created migration file (`migrations/011_add_recurring_payments.sql`).
    *   Defined new tables for:
        *   `recurring_freelancers` (for payments to freelancers).
        *   `recurring_services` (for services, subscriptions, etc.).
        *   Both tables include columns for amount, frequency, payment day, status, provider, etc.

2.  ✅ **Backend API Development:**
    *   Created new API files: `functions/api/recurring-freelancers.js` and `functions/api/recurring-services.js`.
    *   Implemented CRUD operations for both endpoints.
    *   Added helper functions for calculating next payment dates based on frequency.
    *   Implemented dynamic field updates and validation.

3.  ✅ **Frontend Dashboard Implementation:**
    *   Created two new components:
        *   `RecurringFreelancersDashboard.jsx`
        *   `RecurringServicesDashboard.jsx`
    *   Each dashboard allows users to:
        *   View, add, edit, and delete recurring payments.
        *   Configure payment details (amount, frequency, payment day, etc.).
        *   Toggle payment status (active/inactive).
        *   Filter by status.

4.  ✅ **Integration with Main Dashboard:**
    *   Added new "Operaciones" navigation dropdown in the main application.
    *   Added routes for both new dashboards (`/recurring-freelancers` and `/recurring-services`).
    *   Added API helper functions to `src/utils/api.js`.
    *   Successfully tested build process.

## Phase 3: Advanced Accounting and Reporting ✅ COMPLETED

**Goal:** Enhance the accounting and reporting capabilities of the application to provide deeper financial insights.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Advanced Bank Reconciliation:**
    *   Enhanced `ReconciliationManager.jsx` with side-by-side comparison view
    *   Added partial match detection with visual indicators (Exact, High, Partial, Low confidence)
    *   Implemented bulk matching capabilities with checkbox selection
    *   Added filtering by account and sorting by confidence, amount, and date
    *   Implemented JSON export functionality for reconciliation reports

2.  ✅ **Comprehensive Financial Reports:**
    *   Enhanced `reports.js` API with new report endpoints:
        *   Daily Financial Dashboard - cash flow and immediate commitments
        *   Weekly Report - active projects, pending invoices, scheduled payments
        *   Monthly Income Statement - with margin analysis per category
        *   Quarterly Balance Sheet - comprehensive financial position
    *   All existing reports (profitability, cash-flow, AR/AP aging, category analysis) maintained
    *   Backend API ready for frontend consumption

3.  ✅ **AR/AP Aging Reports:**
    *   Implemented aging report in `AccountsReceivable.jsx` with buckets: 0-30, 31-60, 61-90, 90+ days
    *   Implemented aging report in `AccountsPayable.jsx` with same bucket structure
    *   Added visual indicators: color-coded cards, progress bars, distribution charts
    *   Implemented sorting and filtering for receivables list view
    *   Added JSON export functionality for both AR and AP aging reports

## Phase 4: Treasury and Financial Projections ✅ COMPLETED

**Goal:** Implement tools for managing cash flow, debt, investments, and financial projections.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Cash Flow Projection:**
    *   Created `CashFlowProjection.jsx` component with interactive charts and scenario planning
    *   Created `cash-flow-projection.js` API endpoint with 60-day forecast capabilities
    *   Integrated recurring transactions, payables, receivables, debts, and historical data
    *   Implemented optimistic, realistic, and pessimistic scenario projections
    *   Added CSV and JSON export functionality
    *   Included critical days warnings for negative balance projections

2.  ✅ **Debt and Investment Management:**
    *   Created `Debts.jsx` component for tracking loans and financial obligations
    *   Created `Investments.jsx` component for portfolio management
    *   Created `debts.js` API endpoint with CRUD operations and amortization schedule generation
    *   Created `investments.js` API endpoint with portfolio summary and performance metrics
    *   Implemented database migration `012_add_debts_investments.sql` with comprehensive schema
    *   Added debt payment tracking with principal/interest breakdown
    *   Added investment transaction and valuation history tracking
    *   Implemented ROI and performance calculations

3.  ✅ **Enhanced Dashboard Integration:**
    *   Updated `FinancialDashboard.jsx` with Treasury summary widgets
    *   Added cash flow projection summary card
    *   Added debts overview with monthly payment totals
    *   Added investments portfolio summary with returns
    *   Integrated all treasury features with main navigation

4.  ✅ **Navigation and Routes:**
    *   Added "Tesorería" navigation dropdown in `App.jsx`
    *   Created routes for `/cash-flow-projection`, `/debts`, and `/investments`
    *   Updated API utilities with helper functions for all treasury endpoints

**Note:** Enhanced "Payroll" for Subcontractors with timesheet management was partially implemented through the database schema (freelancer_timesheets table) but the UI components were not added to keep changes minimal and focused on core treasury features. This can be implemented in a future phase if needed.

## Phase 5: In-App Financial Activities and Workflows

**Goal:** Create a guided experience for the user to perform their regular financial tasks.

**Tasks:**

1.  **Financial Task Center:**
    *   Create a new component `FinancialTasks.jsx`.
    *   This component will display a checklist of daily, weekly, monthly, quarterly, and annual financial tasks.
    *   The tasks will be based on the user's detailed list in the `IMPLEMENTATION PLAN v3.md` file.

2.  **Reminders and Notifications:**
    *   Implement a notification system to remind the user of important deadlines, such as tax payments and upcoming bills.
    *   These notifications can be displayed in the main dashboard.

3.  **User Guide and Onboarding:**
    *   Create a simple, step-by-step guide to help new users get started with the application.
    *   This can be a series of modals or a dedicated help page.
