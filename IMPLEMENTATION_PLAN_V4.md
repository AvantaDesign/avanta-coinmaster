# Implementation Plan v4

This document outlines the development plan for enhancing the Avanta Finance application. The plan is divided into phases to be implemented by a coding agent in separate sessions.

## Phase 1: Core Functionality Refinement and Dashboard Consolidation

**Goal:** Refine existing features to align with user requirements and consolidate the main dashboard for a more streamlined user experience.

**Tasks:**

1.  **Analyze Existing Dashboards:**
    *   Review the code for `AdminDashboard.jsx`, `FinancialDashboard.jsx`, and `CustomizableDashboard.jsx`.
    *   Identify the widgets and data displayed in each.

2.  **Consolidate the Main Dashboard:**
    *   Modify `FinancialDashboard.jsx` to be the primary dashboard.
    *   Integrate essential summaries from other dashboards into `FinancialDashboard.jsx`, including:
        *   Account balances (`AccountBreakdown.jsx`)
        *   Budget summary (`BudgetSummaryWidget.jsx`)
        *   Upcoming payments (`UpcomingPayments.jsx`)
        *   A new summary for Accounts Payable and Receivable.
    *   Deprecate or refactor `AdminDashboard.jsx` and `CustomizableDashboard.jsx` as necessary.

3.  **Enhance Fiscal Compliance:**
    *   Review and update the logic in `fiscal.js` and `FiscalCalculator.jsx` to ensure it correctly handles tax calculations for a "persona física con actividad empresarial" in Mexico.
    *   Add options for different tax regimes if not already present.

4.  **Improve Upcoming Payments:**
    *   Enhance `UpcomingPayments.jsx` to better distinguish between different types of upcoming payments (e.g., one-time vs. recurring).

## Phase 2: Recurring Payments and Operational Costs Module

**Goal:** Implement dedicated dashboards for managing recurring payments and operational costs, and integrate them with the core financial system.

**Tasks:**

1.  **Database Schema Extension:**
    *   Create a new migration file (`migrations/011_add_recurring_payments.sql`).
    *   Define new tables for:
        *   `recurring_freelancers` (for payments to freelancers).
        *   `recurring_services` (for services, subscriptions, etc.).
        *   Both tables should include columns for amount, frequency, payment day, status, provider, etc.

2.  **Backend API Development:**
    *   Create new API files: `functions/api/recurring-freelancers.js` and `functions/api/recurring-services.js`.
    *   Implement CRUD operations for both.
    *   Create a mechanism to automatically generate transactions in the `payables` table based on the recurring payment configurations. This should only create future transactions.

3.  **Frontend Dashboard Implementation:**
    *   Create two new components:
        *   `RecurringFreelancersDashboard.jsx`
        *   `RecurringServicesDashboard.jsx`
    *   Each dashboard should allow the user to:
        *   View, add, edit, and delete recurring payments.
        *   Configure payment details (amount, frequency, etc.).
        *   View payment history.
        *   Update payment status.

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
