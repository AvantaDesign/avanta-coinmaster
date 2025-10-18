# Implementation Plan v6 (Revised)

This document outlines the next development plan for enhancing the Avanta Finance application, incorporating detailed features for the Mexican tax system ("Persona Física con Actividad Empresarial"). The plan is divided into phases to be implemented by a coding agent in separate sessions.

## Phase 15: UI/UX Refinements

**Goal:** To refine the user interface and experience by addressing contrast issues, improving navigation, and ensuring full localization.

**Tasks:**

1.  **Dark Mode Contrast Fixes:**
    *   Audit all components in dark mode to identify elements with low contrast.
    *   Modify TailwindCSS theme colors and component styles to ensure WCAG AA compliance.
2.  **Notifications Center Relocation:**
    *   Move the notification trigger from the user dropdown to a dedicated bell icon in the main navbar.
    *   Implement a badge on the bell icon to display the count of unread notifications.
3.  **Responsive Navbar:**
    *   Implement a breakpoint-based mechanism that collapses the main navigation into a hamburger menu on smaller desktop window sizes.
4.  **Remove Keyboard Shortcuts:**
    *   Identify and remove the code related to the keyboard shortcuts feature, keeping the "Quick Actions" button.
5.  **Full Spanish Localization:**
    *   Search the frontend codebase for hardcoded English strings (e.g., "Advanced filters") and translate them to contextual Spanish ("Filtros Avanzados").

## Phase 16: Core Tax Logic - Data Model & Expense Module

**Goal:** To establish the foundational data model for granular Mexican tax rules and build the user interface for detailed expense classification.

**Tasks:**

1.  **Database Schema Enhancement (Migration):**
    *   Modify the `transactions` table to replace the generic `is_deductible` with specific boolean flags: `is_isr_deductible` and `is_iva_accreditable`.
    *   Add a `deductibility_notes` text field for justifications.
    *   Add an `expense_type` field (e.g., `operativo`, `inversion`, `personal`).
    *   Create a `proportional_expenses` table to manage items with mixed personal/business use (e.g., vehicle, rent, utilities) and store their business-use percentage.
2.  **Backend API Updates (`/api/transactions`):**
    *   Update POST/PUT endpoints to handle the new granular fields (`is_isr_deductible`, `is_iva_accreditable`, `expense_type`).
    *   Create new endpoints for managing `proportional_expenses`.
3.  **Frontend Expense Module (`Módulo de Egresos`):**
    *   Update the `AddTransaction` / `EditTransaction` forms to include the new classification options.
    *   Implement UI for managing proportional expenses, allowing users to set a percentage and link it to relevant transactions. The system should automatically calculate the deductible portion.
    *   Ensure the UI prevents marking a transaction as `is_isr_deductible` if payment was in cash over $2,000 MXN.
    *   Visually tag non-deductible expenses in the transaction list for clear identification.

## Phase 17: Income & CFDI Management Module

**Goal:** To build a robust system for managing income from national and foreign clients and to integrate CFDI validation for both income and expenses.

**Tasks:**

1.  **Income Module (`Módulo de Ingresos`):**
    *   Enhance the `AddTransaction` form for income to include fields for:
        *   Client RFC (allowing the generic `XEXX010101000` for foreigners).
        *   Client's tax residence country.
        *   Distinguishing between payment date and invoice emission date.
        *   Applied IVA rate (16%, 0%, or exento).
2.  **CFDI Control Module (`Módulo de Control de CFDI`):**
    *   Integrate a service to validate CFDI UUIDs against the SAT registry for both received (expenses) and emitted (income) invoices.
    *   Add a visual status indicator (Vigente/Cancelado) to transactions linked to a CFDI.
    *   Implement alerts for duplicate received CFDIs.
    *   In the expense entry form, verify that the recipient's RFC on the uploaded CFDI matches the user's RFC.

## Phase 18: Tax Calculation & Reporting Engine

**Goal:** To develop the core calculation engine for monthly provisional ISR, definitive IVA, and the annual tax declaration.

**Tasks:**

1.  **Monthly ISR Calculation Module:**
    *   Create a new utility/service (`isrCalculation.js`) that calculates provisional monthly ISR based on:
        *   Accumulated income (`ingresos acumulados`).
        *   Authorized deductions (`deducciones autorizadas`) using the new `is_isr_deductible` flag.
        *   Applies the progressive rates from the official SAT tariff tables (Art. 96 LISR).
        *   Subtracts previous provisional payments and withholdings.
2.  **Monthly IVA Calculation Module:**
    *   Create a utility (`ivaCalculation.js`) that calculates the monthly IVA payment:
        *   Sums `IVA trasladado` (from income).
        *   Sums `IVA acreditable` (from expenses, using the `is_iva_accreditable` flag).
        *   Calculates the net IVA to pay or the balance in favor (`saldo a favor`).
        *   Allow carrying over `saldo a favor` from previous months.
3.  **Annual Declaration Simulator:**
    *   Develop a new page/feature that simulates the annual declaration.
    *   It should sum up all income and authorized deductions for the fiscal year.
    *   Include a section to add "deducciones personales" (medical, mortgage interest, etc.) with their corresponding legal limits (15% of annual income or 5 UMAs).
    *   Calculate the final ISR tax for the year and determine the final balance after subtracting all provisional payments and withholdings.

## Phase 19: Advanced Reporting & Compliance

**Goal:** To provide high-level fiscal insights through a dedicated dashboard and to automate compliance tasks like the DIOT and fiscal alerts.

**Tasks:**

1.  **DIOT Module (`Declaración Informativa de Operaciones con Terceros`):**
    *   Create a new report that aggregates all operations with providers for a given month.
    *   The report should be exportable in the format required for the DIOT, detailing the IVA paid to each third party.
2.  **Fiscal Dashboard & Analytics:**
    *   Create a new "Dashboard Fiscal" page.
    *   Include widgets for:
        *   Real-time calculation of ISR and IVA for the current month.
        *   A chart showing the ratio of deductible vs. non-deductible expenses.
        *   Projections for annual taxes.
3.  **Alerts & Compliance Module:**
    *   Implement an automated fiscal calendar that creates notifications for key deadlines (monthly payments on day 17, DIOT, annual declaration).
    *   Create preventive validation alerts, e.g., warning the user when they try to save an expense over $2,000 MXN paid in cash.

## Phase 20: Electronic Accounting & Reconciliation

**Goal:** To generate the official electronic accounting files required by the SAT and to streamline bank reconciliation.

**Tasks:**

1.  **Electronic Accounting (`Contabilidad Electrónica`):**
    *   Develop a feature to generate the `Catálogo de Cuentas` in the SAT-specified XML format (Anexo 24), mapping the app's categories to the SAT's `código agrupador`.
    *   Develop a feature to generate the monthly `Balanza de Comprobación` (Trial Balance) in the required XML format.
    *   This feature should only be available if the user's income exceeds the legal threshold ($2,000,000 MXN).
2.  **Bank Reconciliation Module:**
    *   Enhance the existing bank statement import feature.
    *   Implement logic to automatically match imported bank transactions with CFDI-backed income and expense records in the system.
    *   Provide a UI to highlight unmatched transactions and allow for manual linking.

## Phase 21: System-Wide Verification and Integrity Check

**Goal:** To perform a comprehensive audit of the entire system to ensure all data is correct, all calculations are accurate, and all logic is sound.

**Tasks:**

1.  **Database Integrity Audit:**
    *   Write and execute scripts to check for data inconsistencies.
    *   Review all table schemas and relationships for correctness.
2.  **Financial Logic and Calculation Audit:**
    *   Manually review and write unit tests for all core financial calculation functions, especially the new tax calculators.
    *   Create a suite of test cases with known inputs and expected outputs to verify accuracy.
3.  **Automation and Workflow Testing:**
    *   End-to-end testing of all automated workflows, such as recurring transactions and the new fiscal alerts.

## Phase 22: Documentation and Support Update

**Goal:** To update all user-facing documentation and help materials to reflect the latest features and ensure a smooth user onboarding experience.

**Tasks:**

1.  **Update FAQ and Help Center:**
    *   Rewrite the FAQ to cover all the new Mexican tax features.
    *   Add detailed guides on how to classify expenses, handle foreign income, and interpret the fiscal dashboard.
2.  **Update In-App Guides:**
    *   Update the `OnboardingGuide.jsx` and any other contextual help to reflect the new functionalities.