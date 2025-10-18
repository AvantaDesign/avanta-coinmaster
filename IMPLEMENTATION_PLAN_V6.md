# Implementation Plan v6

This document outlines the next development plan for enhancing the Avanta Finance application. The plan is divided into phases to be implemented by a coding agent in separate sessions.

## Phase 15: UI/UX Refinements

**Goal:** To refine the user interface and experience by addressing contrast issues, improving navigation, and ensuring full localization.

**Tasks:**

1.  **Dark Mode Contrast Fixes:**
    *   Audit all components in dark mode to identify elements with low contrast (e.g., white cards on light backgrounds).
    *   Modify TailwindCSS theme colors and component styles to ensure WCAG AA compliance for text and UI elements.
    *   Pay special attention to cards, buttons, and data tables.

2.  **Notifications Center Relocation:**
    *   Move the notification trigger from the user dropdown to a dedicated bell icon in the main navbar.
    *   Implement a badge on the bell icon to display the count of unread notifications.
    *   Ensure the notification popover/drawer is accessible from the new icon.

3.  **Responsive Navbar:**
    *   Implement a breakpoint-based mechanism that collapses the main navigation into a hamburger menu on smaller desktop window sizes.
    *   Ensure the transition is smooth and that the hamburger menu is fully functional.

4.  **Remove Keyboard Shortcuts:**
    *   Identify and remove the code related to the keyboard shortcuts feature.
    *   Keep the "Quick Actions" floating action button and its functionality.
    *   Update any related help or UI text that mentions keyboard shortcuts.

5.  **Full Spanish Localization:**
    *   Search the entire frontend codebase for hardcoded English strings.
    *   Translate all identified strings to Spanish, paying attention to context.
    *   Example: "Advanced filters" should become "Filtros Avanzados".
    *   Ensure translations do not break UI layouts.

## Phase 16: Granular Tax Deductibility

**Goal:** To implement a sophisticated system for categorizing transactions with granular deductibility rules, catering to the specific needs of Mexican tax law ("Persona Física con Actividad Empresarial").

**Tasks:**

1.  **Database Schema Enhancement:**
    *   Create a new migration to modify the `transactions` table.
    *   Add new boolean columns like `is_iva_deductible` and `is_isr_deductible`.
    *   Add a field to classify the type of expense (e.g., `national`, `international_with_invoice`, `international_no_invoice`).
    *   Create a new table `deductibility_rules` to allow users to define custom rules.

2.  **Backend API Development:**
    *   Update the `/api/transactions` endpoint to allow setting the new deductibility flags.
    *   Create a new `/api/deductibility-rules` endpoint with full CRUD operations for managing custom rules.
    *   Modify the tax calculation logic (`/api/fiscal`) to use the new granular flags instead of a simple `is_deductible` flag.

3.  **Frontend UI for Deductibility:**
    *   In the `AddTransaction` and `EditTransaction` modals, replace the single "Deductible" checkbox with more granular options (e.g., "Deducible de IVA", "Deducible de ISR").
    *   Create a new settings page for managing `deductibility_rules`, allowing users to define rules based on transaction category, keywords, or amount.
    *   Update the transaction table to visually indicate the specific deductibility of each transaction.

## Phase 17: System-Wide Verification and Integrity Check

**Goal:** To perform a comprehensive audit of the entire system to ensure all data is correct, all calculations are accurate, and all logic is sound. This is a critical phase to guarantee application stability and reliability.

**Tasks:**

1.  **Database Integrity Audit:**
    *   Write and execute scripts to check for data inconsistencies (e.g., orphaned records, incorrect foreign keys).
    *   Review all table schemas and relationships for correctness and optimization.
    *   Verify that all migrations have been applied correctly and the schema is up-to-date.

2.  **Financial Logic and Calculation Audit:**
    *   Manually review and write unit tests for all core financial calculation functions (e.g., `taxCalculationEngine.js`, `ivaCalculation.js`, `FinancialHealthScore.jsx`).
    *   Create a suite of test cases with known inputs and expected outputs to verify the accuracy of tax calculations, financial reports, and dashboard metrics.
    *   Pay special attention to edge cases and the new granular deductibility logic.

3.  **Automation and Workflow Testing:**
    *   End-to-end testing of all automated workflows, such as recurring transactions, notifications, and data import processes.
    *   Verify that n8n webhooks and other integrations are functioning as expected.

## Phase 18: Documentation and Support Update

**Goal:** To update all user-facing documentation and help materials to reflect the latest features and ensure a smooth user onboarding experience.

**Tasks:**

1.  **Update FAQ and Help Center:**
    *   Review and rewrite all questions in the FAQ to be consistent with the new features (granular deductibility, new UI, etc.).
    *   Add new sections explaining how to use the advanced tax features.
    *   Ensure the setup guide and onboarding tour reflect the current state of the application.

2.  **Update In-App Guides:**
    *   Update the `OnboardingGuide.jsx` and any other contextual help components.
    *   Ensure all screenshots and instructions are up-to-date.
