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

## Phase 3: Advanced Accounting and Reporting

**Goal:** Enhance the accounting and reporting capabilities of the application to provide deeper financial insights.

**Tasks:**

1.  **Advanced Bank Reconciliation:**
    *   Improve `ReconciliationManager.jsx` to provide a more intuitive side-by-side comparison of bank statements and internal records.
    *   Add functionality to handle discrepancies and partial matches.

2.  **Comprehensive Financial Reports:**
    *   Enhance the `reports.js` API and `AdvancedReports.jsx` component to generate the following reports:
        *   Daily financial dashboard (cash flow, immediate commitments).
        *   Weekly report (active projects, pending invoices, scheduled payments).
        *   Monthly income statement with margin analysis per project/service.
        *   Quarterly balance sheet.

3.  **AR/AP Aging:**
    *   Implement an AR/AP aging report in `AccountsPayable.jsx` and `AccountsReceivable.jsx`.
    *   This report should categorize outstanding invoices by their age (e.g., 0-30 days, 31-60 days, etc.).

## Phase 4: Treasury and Financial Projections

**Goal:** Implement tools for managing cash flow, debt, investments, and financial projections.

**Tasks:**

1.  **Cash Flow Projection:**
    *   Create a new component `CashFlowProjection.jsx` and a corresponding API endpoint.
    *   This feature should provide a 60-day cash flow forecast based on recurring transactions, expected payments, and historical data.

2.  **Debt and Investment Management:**
    *   Create new components and APIs for managing:
        *   `Debts.jsx`: Track loans and other financial obligations.
        *   `Investments.jsx`: Track investments and their performance.

3.  **Enhanced "Payroll" for Subcontractors:**
    *   Improve the system for managing payments to freelancers.
    *   Add features for tracking hours, validating work, and managing tax retentions.

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
