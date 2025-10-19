# Implementation Plan v8: Core Hardening and Functional Expansion

This document has been updated after a thorough system analysis. Critical areas requiring immediate attention have been identified to ensure the platform's stability, security, and accuracy. Three initial phases (30-32) have been added to address these points before proceeding with new features, which have been renumbered starting from phase 33.

---

## Phase 30: Critical Infrastructure and Data Hardening ✅🔄

**Status:** PARTIALLY COMPLETE (70%)
**Objective:** To fix the two most critical risks to data integrity and system viability: environment contamination and financial calculation inaccuracies.

**Technical Plan:**

1.  **Environment Isolation (Database):** ✅ CONFIGURATION COMPLETE
    *   ✅ **Completed:** Updated `wrangler.toml` with separate preview database configuration
    *   ✅ **Completed:** Added comprehensive setup instructions for creating preview database
    *   ✅ **Completed:** Documented verification steps for environment isolation
    *   ⏳ **Pending:** Create new D1 database for preview (requires Cloudflare access)
    *   ⏳ **Pending:** Run migrations on preview database
    *   ⏳ **Pending:** Verify preview deployments use staging database only

2.  **Monetary Data Type Migration:** ✅🔄 INFRASTRUCTURE COMPLETE, REFACTORING IN PROGRESS
    *   ✅ **Completed:** Created migration script `033_fix_monetary_data_types.sql` (25 tables, 942 lines)
    *   ✅ **Completed:** Converted all monetary columns from REAL to INTEGER (cents-based)
    *   ✅ **Completed:** Preserved percentage/rate columns as REAL
    *   ✅ **Completed:** Created monetary utility module `functions/utils/monetary.js`
    *   ✅ **Completed:** Refactored `functions/api/transactions.js` (GET, POST, PUT handlers)
    *   ✅ **Completed:** Refactored `functions/api/accounts.js` (GET, POST, PUT handlers)
    *   ✅ **Completed:** Created comprehensive refactoring guide: `PHASE_30_BACKEND_REFACTORING_GUIDE.md`
    *   ✅ **Completed:** Created completion summary: `PHASE_30_HARDENING_SUMMARY.md`
    *   🔄 **In Progress:** Refactoring remaining ~40 API files with monetary values
    *   ⏳ **Pending:** Run migration on production database (after all APIs refactored)
    *   ⏳ **Pending:** Integration testing and regression tests
    *   ⏳ **Pending:** Verification of all financial calculations

**Deliverables:**
*   ✅ `wrangler.toml` - Updated with preview database configuration
*   ✅ `migrations/033_fix_monetary_data_types.sql` - Complete database migration
*   ✅ `functions/utils/monetary.js` - Monetary conversion utilities
*   ✅ `PHASE_30_BACKEND_REFACTORING_GUIDE.md` - Complete refactoring documentation
*   ✅ `PHASE_30_HARDENING_SUMMARY.md` - Phase completion summary
*   🔄 API files refactored (13/~42 complete - 31%)

**Tables Migrated (25):**
transactions, accounts, invoices, fiscal_payments, credits, credit_movements, budgets, 
fiscal_config, transaction_invoice_map, deductibility_rules, receivables, payables, 
automation_rules, payment_schedules, receivable_payments, payable_payments, 
recurring_freelancers, recurring_services, debts, debt_payments, investments, 
investment_transactions, investment_valuations, freelancer_timesheets, savings_goals

**APIs Refactored (13/~42):**
*   ✅ functions/api/transactions.js (Phase 30 initial work)
*   ✅ functions/api/accounts.js (Phase 30 initial work)
*   ✅ functions/api/invoices.js (HIGH PRIORITY - refactored GET/POST)
*   ✅ functions/api/budgets.js (HIGH PRIORITY - refactored all endpoints)
*   ✅ functions/api/dashboard.js (HIGH PRIORITY - refactored all aggregations)
*   ✅ functions/api/receivables.js (HIGH PRIORITY - refactored GET/POST/PUT)
*   ✅ functions/api/payables.js (HIGH PRIORITY - refactored GET/POST/PUT)
*   ✅ functions/api/credits.js (MEDIUM PRIORITY - refactored GET/POST/PUT with movements)
*   ✅ functions/api/debts.js (MEDIUM PRIORITY - refactored GET/POST/PUT with amortization)
*   ✅ functions/api/fiscal.js (HIGH PRIORITY - CRITICAL - refactored ISR/IVA calculations)
*   ✅ functions/api/fiscal-analytics.js (HIGH PRIORITY - CRITICAL - refactored analytics)
*   ✅ functions/api/tax-calculations.js (HIGH PRIORITY - CRITICAL - refactored tax calculations)
*   ✅ functions/api/savings-goals.js (MEDIUM PRIORITY - refactored GET/POST/PUT with contributions)
*   ⏳ functions/api/investments.js (MEDIUM PRIORITY - needs refactoring)
*   ⏳ functions/api/recurring-freelancers.js (MEDIUM PRIORITY - needs refactoring)
*   ⏳ functions/api/recurring-services.js (MEDIUM PRIORITY - needs refactoring)
*   ⏳ functions/api/cfdi-management.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/bank-reconciliation.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/sat-declarations.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/annual-declarations.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/reports.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/cash-flow-projection.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/analytics.js (LOWER PRIORITY - needs refactoring)
*   ⏳ functions/api/tax-reports.js (LOWER PRIORITY - needs refactoring)
*   ⏳ ~19 additional API files may require refactoring

**Verification Status:**
*   ✅ Migration script syntax validated
*   ✅ Utility functions tested
*   ✅ Build succeeds with refactored code
*   ⏳ Migration not yet applied to database
*   ⏳ Integration tests pending
*   ⏳ Regression tests pending

---

## Phase 31: Backend Audit and Hardening

**Objective:** To ensure the backend logic is atomic, secure, and fault-tolerant, guaranteeing no data leaks between users or inconsistent data states.

**Technical Plan:**

1.  **Data Isolation and Soft-Deletes Audit:**
    *   **Action:** Perform an exhaustive search across all backend code (`/functions`) for every D1 database query.
    *   **Action:** Validate that **EVERY** query accessing a specific user's data non-negotiably includes the `WHERE user_id = ?` clause.
    *   **Action:** Validate that **EVERY** query reading the `transactions` table for calculations or display includes the `WHERE is_deleted = 0` clause.
    *   **Verification:** Create an audit report with the findings and applied corrections.

2.  **Implementation of Atomic Transactions:**
    *   **Action:** Identify all API operations involving multiple database writes (e.g., creating a transaction and updating an account balance, linking an invoice and updating the transaction status).
    *   **Action:** Refactor these operations to use Cloudflare's `D1.batch()` functionality, which wraps multiple statements in a single transaction. This ensures that if one step fails, all previous steps are rolled back.
    *   **Verification:** Create integration tests that simulate mid-operation failures and confirm that the database returns to its original state.

3.  **Backend File Upload Validation:**
    *   **Action:** In the API endpoint responsible for file uploads to R2, implement strict validation logic that runs *before* interacting with R2.
    *   **Action:** The validation must check the file size and MIME type against the variables defined in `wrangler.toml` (`MAX_FILE_SIZE_MB`, `ALLOWED_FILE_TYPES`). If it doesn't comply, reject the request with a 400 error.
    *   **Verification:** Attempt to upload files that are too large or of an unallowed type and confirm that the server rejects them correctly.

---

## Phase 32: Performance and User Experience (UX) Optimization

**Objective:** To improve the user's perceived performance and the interface's robustness by moving heavy tasks to the backend and ensuring consistent visual feedback.

**Technical Plan:**

1.  **Backend for OCR Processing:**
    *   **Action:** Create a new backend endpoint (e.g., `POST /api/process-document-ocr`).
    *   **Action:** This endpoint will receive a file, save it temporarily, and execute OCR in the Worker's environment (research OCR libraries for Node.js compatible with Workers or use an external service).
    *   **Action:** Refactor the frontend UI: instead of processing with `tesseract.js` in the browser, it will now upload the file to the new endpoint and wait for the response with the extracted text.
    *   **Verification:** Confirm that uploading the Fiscal Situation Certificate no longer freezes the user's interface and that the OCR result is the same.

2.  **UI State Consistency:**
    *   **Action:** Audit all components in `src/pages` and `src/components` that make data requests.
    *   **Action:** Ensure that each of these components explicitly and consistently handles and displays the three possible states: `loading` (while data is loading), `error` (if the request fails, showing a useful message), and `empty` (if the request succeeds but returns no data, showing a friendly message instead of a blank screen).
    *   **Verification:** Use developer tools to simulate slow or erroneous API responses and confirm that the UI reacts predictably and elegantly.

---

## Phase 33: Data Foundations and Initial Improvements (Formerly Phase 30)

**Objective:** To fix immediate issues and establish a solid foundation for handling incomplete historical data.

**Key Features:**
1.  **Fix FAQ Search.**
2.  **Initial Balance and Account Age Management.**

**Technical Plan:**
1.  **Backend:** Modify `schema.sql` to add `opening_date` to `accounts` and create the `account_initial_balances` table. Create APIs to manage this data. Update calculation logic to consider them.
2.  **Frontend:** Fix FAQ search. Add UI in the account management section to define opening dates and initial balances per month.

---

## Phase 34: Multi-User Architecture and Admin Panel Foundations (Formerly Phase 31)

**Objective:** To transform the application into a multi-user system with roles and create an administration panel for user management.

**Key Features:**
1.  **Multi-User Support and Administrator Role.**
2.  **Admin Dashboard for User Management.**

**Technical Plan:**
1.  **Backend:** Add a `role` field to the `users` table. Assign the `admin` role to `mateo`. Refactor all endpoints to operate within the authenticated `user_id` context. Create admin endpoints (`/api/admin/*`) protected by an authorization middleware.
2.  **Frontend:**
    *   **Action:** Create the route and component for the Admin Dashboard (`/admin/users`) with management functionality.
    *   **Action:** Update the main application layout (`AuthenticatedApp` in `App.jsx`) to conditionally hide the `GlobalFilter` component when the user is on any admin route (e.g., when the URL path matches `/admin/*`). The global filter is for financial data and is not relevant to administrative views.
    *   **Action:** Ensure navigation to `/admin` is only visible and accessible to the administrator user.

---

## Phase 35: Centralized Settings Panel (Formerly Phase 32)

**Objective:** To unify all user and application settings into a single, coherent administration panel.

**Key Features:**
1.  **Tabbed Settings Panel.**
2.  **Fiscal Data Management (Certificate Analysis).**
3.  **Centralization of Settings.**

**Technical Plan:**
1.  **Backend:** Create endpoints to manage settings and for the analysis of the Fiscal Situation Certificate PDF (using the new OCR endpoint from Phase 32).
2.  **Frontend:** Create the settings page (`/settings`) with tabs (Profile, Fiscal, Accounts, Categories, Rules, Security) and move existing functionality to this panel.

---

## Phase 36: Task System Redesign as an Interactive Guide (Formerly Phase 33)

**Objective:** To turn the tasks dashboard into a proactive, automated system that guides the user through their obligations.

**Key Features:**
1.  **Tasks as Automatic Progress Bars.**
2.  **Interactive Guide for Declarations.**
3.  **Custom Task Management.**

**Technical Plan:**
1.  **Backend:** Redesign the tasks DB to include completion criteria (`completion_criteria`). Create a "Task Engine" that evaluates these criteria and updates progress.
2.  **Frontend:** Redesign the "Tasks Dashboard" UI to display progress bars and interactive guides on click.

---

## Phase 37: Advanced Demo Experience (Formerly Phase 34)

**Objective:** To create a robust, educational, and reusable demonstration environment.

**Key Features:**
1.  **Realistic Demo Data and Automatic Reset.**
2.  **"Healthy" vs. "Critical" Scenario Switch.**

**Technical Plan:**
1.  **Backend:** Create two seed scripts (`seed-demo-healthy.sql`, `seed-demo-critical.sql`). Implement logic on login to reset the demo user each session. Create an API to switch between scenarios.
2.  **Frontend:** Display a banner with the scenario switch only for the demo user. Call the API and refresh the page on change.

---

## Phase 38: Help Center and Onboarding Guide Expansion (Formerly Phase 35)

**Objective:** To create a comprehensive learning and reference experience.

**Key Features:**
1.  **First-Time Use Guide.**
2.  **Expanded SAT Fiscal Content.**

**Technical Plan:**
1.  **Frontend:** Create a static page (`/help/first-time-setup`) with the recommended setup flow. Add new sections and pages of fiscal content in the help center.

---

## Phase 39: Final UI/UX and System Coherence Audit (Formerly Phase 36)

**Objective:** To conduct a full review of the application (including the new phases) to ensure the experience is intuitive, efficient, and coherent.

**Technical Plan:**
1.  **Code and Logic Review:** Audit the notification center. Analyze and optimize user flows in the new features. Review UI consistency across the entire application.
2.  **Improvement Implementation:** Apply UI/UX changes to improve consistency. Fix any bugs or logical inconsistencies found during the final review.