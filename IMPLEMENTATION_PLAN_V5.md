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


## Phase 6: Business/Personal Separation & Core UI Fixes ✅ COMPLETED

**Goal:** Implement a clear separation between personal and business finances throughout the application and fix critical UI bugs.

**Status:** ✅ **COMPLETED** (Commit: 47190d6 - "Phase 6: Add database migration, global filter, expanded colors, and backend API updates")

**Tasks Completed:**

1.  ✅ **Business/Personal Data Model:**
    *   ✅ **Database:** Created migration `014_add_business_personal_separation.sql` to add `type` columns to `recurring_freelancers`, `recurring_services`, `accounts`, and `categories`. Note: `transactions` already had `transaction_type` field, and `budgets` already had `classification` field.
    *   ✅ **Backend:** Updated API endpoints to handle the new `type` field:
        *   `recurring-freelancers` API: Added GET filtering and POST/PUT support for `type` field
        *   `recurring-services` API: Added GET filtering and POST/PUT support for `type` field
        *   `accounts` API: Added GET filtering for `account_type` field
        *   `categories` API: Added GET filtering for `category_type` field
        *   `transactions` API: Already supported `transaction_type` filtering
        *   `budgets` API: Already supported `classification` filtering
    *   ✅ **Frontend:**
        *   Created `GlobalFilter` component with segmented control for "All", "Personal", and "Business" views
        *   Created `useFilterStore` Zustand store for global filter state persistence
        *   Integrated global filter into main layout (`App.jsx`)
        *   Updated transaction store to respect global filter
        *   Added type selector to recurring freelancer forms
        *   Added type selector to recurring service forms
        *   Note: Transaction forms already had transaction_type selector

2.  ✅ **Fix Blank Submenu Pages:**
    *   ✅ **Investigate:** Verified all submenu routes in `App.jsx`
    *   ✅ **Verify:** All routes have proper component associations - no blank pages found
    *   Routes `/analytics` and `/reports` both exist and have working components

3.  ✅ **More Category Colors:**
    *   ✅ **UI:** Expanded color palette from 8 to 24 colors in `CategoryManager` component
    *   ✅ **Data:** Color values are properly stored and retrieved (no schema changes needed)

## Phase 7: Advanced Financial Planning & Metadata ✅ COMPLETED

**Goal:** Introduce savings goals and enhance data with metadata for better organization and insights.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Savings Goals:**
    *   ✅ **Database:** Created migration `015_add_savings_goals.sql` with `savings_goals` table and linked transactions
    *   ✅ **Backend:** Created API endpoint `/api/savings-goals` with full CRUD functionality, contributions, and progress tracking
    *   ✅ **Frontend:**
        *   Created `SavingsGoals.jsx` component with full management interface
        *   Created `SavingsGoalSummary.jsx` dashboard widget
        *   Updated `AddTransaction.jsx` to link transactions to savings goals
        *   Integrated with global filter system for personal/business separation
        *   Added navigation route and menu item under "Tesorería"

2.  ✅ **Enhanced Metadata:**
    *   ✅ **Database:** Created migration `016_add_metadata_fields.sql` adding `metadata` JSON column to `accounts`, `credits`, `debts`, and `investments`
    *   ✅ **Backend:** Updated all entity APIs (`accounts.js`, `credits.js`, `debts.js`, `investments.js`) to support metadata in POST/PUT operations
    *   ✅ **Frontend:**
        *   Created reusable `MetadataEditor.jsx` component with presets for different entity types
        *   Created `relationshipDetector.js` utility for finding related items and calculating insights
        *   Created `MetadataInsights.jsx` component for displaying institution breakdowns, diversification analysis, and suggestions
        *   Metadata editor includes autocomplete suggestions and common field presets

## Phase 8: Tax Modernization and Reconciliation 🚧 IN PROGRESS

**Goal:** Update the fiscal module to handle historical data, dynamic tax rates, and provide tools for SAT reconciliation.

**Status:** 🚧 **IN PROGRESS** - Import system complete, SAT reconciliation and parameters in progress

**Tasks:**

1.  **Historical Data Import:** ✅ **COMPLETED**
    *   ✅ **Database:** Created migration `017_add_import_history.sql` with import tracking table
    *   ✅ **Backend:** Created `functions/api/import.js` API with full CRUD operations
    *   ✅ **CSV Parser:** Enhanced existing `src/utils/csvParser.js` with duplicate detection
    *   ✅ **Frontend:** 
        *   Created `src/components/ImportWizard.jsx` with multi-step wizard
        *   Created `src/pages/Import.jsx` wrapper
        *   Added route `/import` and navigation menu item
        *   Implemented file upload, preview, and confirmation steps

2.  **SAT Reconciliation Tool:** 🚧 **IN PROGRESS**
    *   ✅ **Database:** Created migration `018_add_sat_declarations.sql`
    *   ✅ **Backend:** Created `functions/api/sat-reconciliation.js` API
    *   ✅ **Utility:** Created `src/utils/satReconciliation.js` with comparison logic
    *   [ ] **Frontend:** Create `SATReconciliation.jsx` component
    *   [ ] **Frontend:** Create `DeclarationManager.jsx` component

3.  **Dynamic Fiscal Variables:** 🚧 **IN PROGRESS**
    *   ✅ **Database:** Created migration `019_add_fiscal_parameters.sql`
    *   ✅ **Seed Data:** Created `seed_fiscal_parameters.sql` with 2024-2025 parameters
    *   ✅ **Backend:** Created `functions/api/fiscal-parameters.js` API
    *   ✅ **Utility:** Created `src/utils/fiscalParameterService.js`
    *   [ ] **Backend:** Refactor `functions/api/fiscal.js` to use dynamic parameters
    *   [ ] **Frontend:** Create `FiscalParametersManager.jsx` component
    *   [ ] **Frontend:** Update `FiscalCalculator.jsx` for historical calculations

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

## Phase 11: Design System & Visual Foundation

**Goal:** To establish the foundational elements of a sophisticated design system, elevating the application's visual consistency and professional aesthetic.

**Tasks:**

1.  **Implement a Professional Icon Set:**
    *   **Description:** Replace all current emoji-based icons with a consistent, professional icon library (e.g., Heroicons, Feather Icons). This includes navigation, buttons, and informational elements. Use distinct, clear icons for `Personal` and `Business` contexts (e.g., a briefcase for business, a house for personal).

2.  **Refine Typography Scale & Hierarchy:**
    *   **Description:** Establish and enforce a strict typographic scale in `tailwind.config.js`. Ensure all components use these defined styles for headings, subheadings, body text, and labels to create a clear and consistent visual hierarchy.

3.  **Evolve and Standardize the Color Palette:**
    *   **Description:** In `tailwind.config.js`, define a refined and accessible color palette. Create a "semantic" color system (e.g., `success`, `danger`, `warning`, `info`) and apply these colors consistently across the application for alerts, buttons, and status indicators.

4.  **Standardize Spacing and Layout:**
    *   **Description:** Implement a consistent spacing system (e.g., based on an 8px grid) for all components and layouts. Refactor existing components to use the new spacing variables, ensuring a harmonious and visually balanced interface.

## Phase 12: Dashboard & Navigation Refinement

**Goal:** To redesign the main dashboard and navigation to be more intuitive, insightful, and goal-oriented.

**Tasks:**

1.  **Create a "Command Center" Dashboard:**
    *   **Description:** Overhaul `FinancialDashboard.jsx`. Introduce a "Financial Health Score" widget at the top. This score will be calculated based on key metrics like cash flow, debt-to-income ratio, and budget adherence, providing an instant overview.

2.  **Implement Interactive & Drill-Down Charts:**
    *   **Description:** Refactor chart components (e.g., `MonthlyChart.jsx`) to be fully interactive. Implement detailed tooltips on hover and "drill-down" functionality on click, navigating users to pre-filtered data views.

3.  **Introduce Breadcrumbs:**
    *   **Description:** Implement a `Breadcrumbs` component and integrate it into the main layout. It should dynamically display the user's navigation path and allow for easy traversal back to parent pages.

4.  **Implement a Global "Quick Add" Button:**
    *   **Description:** Add a floating action button (FAB) that is visible on all pages. This button will open a menu with shortcuts to the most common actions, such as "Add Income," "Add Expense," and "Upload Invoice."

## Phase 13: Interaction & Mobile Experience

**Goal:** To enhance detailed user interactions, streamline data entry, and deliver a superior mobile-first experience.

**Tasks:**

1.  **Design "Smart" Forms:**
    *   **Description:** Refactor key data entry forms like `AddTransaction.jsx`. Implement intelligent features such as auto-suggesting categories based on the description (e.g., "Uber" -> "Transport"), pre-filling dates, and using input masking for currency and dates.

2.  **Enhance Data Tables:**
    *   **Description:** Upgrade all data tables (`TransactionTable.jsx`, etc.). Add client-side sorting and filtering to column headers. Implement a "Detail View" that allows a row to be expanded for more information without leaving the page.

3.  **Adopt a Mobile-First Design Philosophy:**
    *   **Description:** Conduct a review of the most common user flows (e.g., adding a transaction, checking account balances). Redesign these views with a mobile-first approach, rather than simply stacking desktop elements. Focus on creating a thumb-friendly and optimized layout for small screens.

4.  **Optimize for Touch:**
    *   **Description:** Increase the size of tap targets for all interactive elements on mobile. Implement swipe gestures in data tables (e.g., swipe a transaction to reveal "Edit" and "Delete" actions).

## Phase 14: Expert Features & Accessibility

**Goal:** To implement highly valuable, expert-driven features specific to the Mexican market and ensure the application is accessible to all users.

**Tasks:**

1.  **Create a "Declaración Anual" Simulator:**
    *   **Description:** Build a dedicated "Annual Tax Declaration Simulator". This tool will guide users through a mock declaration, using their financial data to highlight potential deductions and estimate their annual ISR liability.

2.  **Dashboard Widget for "IVA Favor/Contra":**
    *   **Description:** Add a prominent widget to the main dashboard that clearly shows the current balance of `IVA Acreditable` vs. `IVA Trasladado`, resulting in a real-time "IVA a favor" or "IVA a pagar" calculation for the current period.

3.  **Visual Cues for `Uso de CFDI`:**
    *   **Description:** In transaction and invoice forms, automatically suggest the appropriate `Uso de CFDI` code based on the selected category, simplifying this mandatory step for Mexican invoicing.

4.  **Full Accessibility (a11y) Audit & Remediation:**
    *   **Description:** Conduct a full WCAG 2.1 AA compliance audit. Remediate all identified issues, including adding `alt` tags, ensuring proper label associations for forms, enabling full keyboard navigation, and correctly using ARIA attributes.