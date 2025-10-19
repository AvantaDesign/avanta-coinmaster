# Implementation Plan v8: Core Hardening and Functional Expansion

This document has been updated after a thorough system analysis. Critical areas requiring immediate attention have been identified to ensure the platform's stability, security, and accuracy. Three initial phases (30-32) have been added to address these points before proceeding with new features, which have been renumbered starting from phase 33.

---

## Phase 30: Critical Infrastructure and Data Hardening

**Objective:** To fix the two most critical risks to data integrity and system viability: environment contamination and financial calculation inaccuracies.

**Technical Plan:**

1.  **Environment Isolation (Database):**
    *   **Action:** Create a new D1 database dedicated exclusively to the `preview` environment.
    *   **Action:** Update `wrangler.toml` so that the `[env.preview]` environment points to the new preview database's `database_id`, completely separating it from production.
    *   **Verification:** Confirm that `preview` deployments read from and write to the staging database, with no access to the production one.

2.  **Monetary Data Type Migration:**
    *   **Action:** Create a new migration script (`033_fix_monetary_data_types.sql`). This script must:
        *   Alter the `transactions`, `accounts`, `invoices`, `budgets`, etc., tables.
        *   Change all columns that store money (e.g., `amount`, `balance`, `total`) from `REAL` to `INTEGER`.
        *   Multiply all existing values by 100 and round them to be stored as cents before saving them as integers.
    *   **Action:** Refactor all **backend (Cloudflare Workers)** code that interacts with monetary values. When writing to the DB, `decimal.js` values must be converted to cents (`.mul(100).round().toNumber()`). When reading from the DB, the integers must be converted back to a decimal format (`new Decimal(value).div(100)`).
    *   **Verification:** Run regression tests to confirm that all financial calculations (sums, taxes, reports) remain correct and are now immune to floating-point errors.

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