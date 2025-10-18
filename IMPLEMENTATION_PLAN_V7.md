# IMPLEMENTATION PLAN V7: Total Fiscal Compliance & Automation (Consolidated)

**Objective:** To serve as the master plan for achieving full compliance with Mexican fiscal regulations, integrating all pending work from previous plans and new requirements from `REQUISITOS SAT.md`.

**Context:** This plan acknowledges the completion of **Phase 15 (UI/UX Refinements)** and **Phase 16 (Core Tax Logic - Data Model & Expense Module)**. It begins with the work originally planned for Phase 17 and integrates all subsequent unimplemented phases into a single, logical roadmap.

This plan prioritizes:
1.  **Accuracy:** Flawless financial calculations and accounting rules.
2.  **Automation:** Internal automation of tax calculations, compliance, and reporting.
3.  **Security:** Robust security for all financial data.
4.  **User Control:** A clear, powerful UI for managing fiscal data.

---

## Phase 1: Income Module & Fiscal Foundations (Formerly part of V6 P17) ✅ COMPLETED

**Goal:** Complete the foundational data model by adding the income module and essential fiscal configuration tables. The expense module is already complete.

*   **Tasks:**
    1.  ✅ **Database Schema - Income & Configuration:**
        *   ✅ **Modify `transactions` table:** Add all income-specific fields from `REQUISITOS SAT.md`, including `client_type` (nacional/extranjero), `client_rfc`, `currency`, `exchange_rate`, `payment_method` (PUE/PPD), `iva_rate` (16/0/exento), `isr_retention`, `iva_retention`, `cfdi_uuid`, `issue_date`, `payment_date`, `economic_activity_code`.
        *   ✅ **Create `fiscal_parameters` table:** Updated with UMA values for 2025 (daily: $113.14, monthly: $3,439.46, annual: $41,273.52) and ISR tariff tables.
        *   ✅ **Create `sat_accounts_catalog` table:** Pre-populated with the official SAT "código agrupador" from Anexo 24 (hierarchical structure with 7 levels).

    2.  ✅ **Backend API Development:**
        *   ✅ Created new `/api/sat-accounts-catalog` endpoint with hierarchical and search capabilities.
        *   ✅ Updated `POST /api/transactions` to handle all 12 new income fields with validation.
        *   ✅ Updated `PUT /api/transactions` to handle all new income fields.
        *   ✅ Added comprehensive validation for RFC format, currency codes, exchange rates, payment methods, IVA rates, and dates.

    3.  ✅ **Frontend UI - Income & Configuration:**
        *   ✅ **Redesigned "Add Income" form:** Implemented all 12 new fields with conditional logic for foreign clients (shows RFC hint, currency converter when non-MXN).
        *   ✅ **Enhanced "Configuración Fiscal" page:** Added UMA values display (daily, monthly, annual) and SAT Accounts Catalog browser with search and hierarchical tree view.

*   **Verification:** ✅
    *   ✅ Migration file `024_add_income_fiscal_foundations.sql` created and ready to apply.
    *   ✅ Income form includes all fiscal data fields for various scenarios (foreign income, PPD, different IVA rates).
    *   ✅ Configuration page enhanced to display UMA values and SAT catalog.
    *   ✅ Build succeeds without errors (npm run build passed).

**Implementation Date:** October 18, 2025  
**Files Modified:**
- `migrations/024_add_income_fiscal_foundations.sql` (new)
- `functions/api/sat-accounts-catalog.js` (new)
- `functions/api/transactions.js` (updated)
- `src/components/AddTransaction.jsx` (updated)
- `src/components/FiscalConfiguration.jsx` (enhanced)

---

## Phase 18: CFDI Control & Validation Module (Formerly part of V6 P17)

**Goal:** Build a system to manage, parse, and validate CFDI XML files, linking them directly to transactions.

*   **Tasks:**
    1.  **CFDI Upload & Parsing:**
        *   Create a "Gestor de CFDI" page with an upload mechanism for XML files (issued and received).
        *   Develop a backend service to parse uploaded XMLs, extract key data (UUID, amounts, dates), and store it in a new `cfdi_metadata` table.
        *   The service will attempt to auto-match parsed CFDIs to existing transactions or suggest creating new ones.

    2.  **CFDI Validation:**
        *   Implement internal validation of the XML structure and receiver's RFC against the user's RFC.
        *   Create a status system: `Pending Validation`, `Valid`, `Invalid RFC`, `Canceled`, `Error`.
        *   **Note:** Real-time SAT validation is complex. This phase focuses on internal checks.

    3.  **Frontend UI - CFDI Management:**
        *   Display lists of issued and received CFDIs with their status and linked transaction.
        *   Allow manual linking of CFDIs to transactions.
        *   Alert users about duplicate or potentially canceled CFDIs.

*   **Verification:**
    *   Upload sample CFDIs and verify correct parsing and data storage.
    *   Test the auto-matching and manual-linking functionalities.

---

## Phase 19: Core Tax Calculation Engine (Formerly V6 P18)

**Goal:** Develop the backend engine for accurate monthly provisional ISR and definitive IVA calculations.

*   **Tasks:**
    1.  **ISR Calculation Module (Provisional Mensual):**
        *   Create a function that ingests all income and deductible expenses for a period.
        *   It will calculate `Ingresos Acumulados`, `Deducciones Autorizadas Acumuladas`, determine the `Base Gravable`, apply the ISR tariff, and subtract retentions/previous payments.

    2.  **IVA Calculation Module (Definitivo Mensual):**
        *   Create a function to calculate `IVA Trasladado` vs. `IVA Acreditable` for the month.
        *   The logic must correctly handle `Saldo a favor` from previous months.

    3.  **API & UI for Calculation Verification:**
        *   Create a `GET /api/taxes/preview?month=X&year=Y` endpoint returning a detailed breakdown of the calculations.
        *   Build a "Cálculo de Impuestos" page for users to select a month and see the step-by-step calculation, ensuring transparency.

*   **Verification:**
    *   Create a comprehensive test suite with mock data covering multiple months and scenarios.
    *   Manually verify engine output against spreadsheet calculations.

---

## Phase 20: Bank Reconciliation (Formerly part of V6 P20)

**Goal:** Automate the verification of the "pago efectivamente realizado" requirement by reconciling bank statements with system transactions.

*   **Tasks:**
    1.  **Bank Statement Import:** Develop a feature to upload and parse bank statements (CSV format).
    2.  **Automatic Reconciliation Engine:** Build a backend process to match bank movements with system transactions based on date, amount, and description.
    3.  **UI for Reconciliation:** Design a page showing `Matched`, `Unmatched`, and `Suggested` pairings, allowing for manual linking.

*   **Verification:**
    *   Test with sample CSVs from different banks.
    *   Verify the auto-matching logic and manual linking work flawlessly.

---

## Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica) (Formerly V6 P19 & P20)

**Goal:** Generate the data and files required for official SAT declarations.

*   **Tasks:**
    1.  **DIOT Generation:** Create a module to aggregate operations with third parties and generate a report or file for the DIOT.
    2.  **Contabilidad Electrónica (Anexo 24):**
        *   Develop a function to generate the `CatalogoDeCuentas.xml`.
        *   Develop a function to generate the monthly `BalanzaDeComprobacion.xml`.
    3.  **UI for Declarations:** Create a page to trigger the generation of these reports and files.

*   **Verification:**
    *   Generated XML files must be validated against official SAT XSD schemas.
    *   DIOT report data must perfectly match provider expense totals.

---

## Phase 22: Annual Declaration & Advanced Analytics (Formerly V6 P18 & P19)

**Goal:** Implement the annual tax calculation and build the high-level fiscal dashboards.

*   **Tasks:**
    1.  **Annual Declaration Engine:**
        *   Create a module to manage and apply "Deducciones Personales" with their corresponding limits.
        *   Develop the logic for the annual ISR calculation (Art. 152 LISR).
    2.  **Fiscal Dashboard UI:** Build the dashboard specified in `REQUISITOS SAT.md` with widgets for monthly/annual tax projections, deductible ratios, and compliance alerts.
    3.  **Custom Reports Module:** Develop a tool to analyze finances by activity, client, or expense category.

*   **Verification:**
    *   Test the annual calculation with a full year of mock data.
    *   Ensure all dashboard widgets are accurate.

---

## Phase 23: Digital Archive & Compliance (Formerly V6 P19 & P21)

**Goal:** Implement a secure digital document archive and a proactive compliance alert system.

*   **Tasks:**
    1.  **Document Storage (Cloudflare R2):** Integrate with R2 to create a secure archive. Allow users to upload and associate supporting documents (PDFs, contracts) with transactions.
    2.  **Alerts & Compliance Module:** Implement a notification system for the fiscal calendar (payment deadlines). Create real-time validation alerts in the UI (e.g., cash payment limits).

*   **Verification:**
    *   Test file upload/retrieval from R2.
    *   Confirm fiscal alerts trigger under the correct conditions.

---

## Phase 24: System-Wide Verification & Documentation (Formerly V6 P22 & P23)

**Goal:** Conduct a final, holistic review of the system and produce comprehensive user documentation.

*   **Tasks:**
    1.  **End-to-End Testing:** Perform a full workflow test: from creating income/expense, uploading a CFDI, reconciling with a bank statement, to seeing its impact on monthly and annual tax calculations.
    2.  **Security Review:** Conduct a thorough audit of all new code, focusing on data integrity and backend calculation security.
    3.  **User Guide Creation:** Create detailed documentation for all new fiscal modules.

*   **Verification:**
    *   The system is stable, accurate, and secure under all test conditions.
    *   The user guide is clear, comprehensive, and easy to understand.

---

## Phase 25: UI/UX Polish & Bug Fixes

**Goal:** Refine the user interface by fixing all identified dark mode/contrast inconsistencies, translating remaining English text, and correcting mobile layout issues.

*   **Tasks:**
    1.  **Comprehensive Dark Mode Audit & Fix:**
        *   Systematically review and correct backgrounds, text colors, and button contrasts across all identified components: Main Dashboard, Transacciones (Advanced Filters), Fiscal (blocks and hovers), Gestión de Recibos, Cuentas por Cobrar/Pagar, Analytics, and Audits.
        *   Enforce strict CSS variable usage to ensure consistency and prevent future issues. No bright or white backgrounds in dark mode.
    2.  **Internationalization (i18n) Cleanup:**
        *   Locate and translate the "Advanced Filters" component in the `Transacciones` page to ensure the entire UI is in Spanish.
    3.  **Mobile Responsiveness Correction:**
        *   Adjust the CSS for the notifications component to ensure it is properly centered and responsive on all mobile viewports.

*   **Verification:**
    *   Visually confirm all components render correctly and aesthetically in both light and dark modes, meeting contrast standards.
    *   Confirm the "Advanced Filters" menu is fully translated.
    *   Verify the notifications component appears correctly on various mobile screen sizes.

---

## Phase 26: Core Functionality Integration

**Goal:** Address critical gaps in the budgeting and fiscal configuration modules to ensure the system is functionally complete and intuitive.

*   **Tasks:**
    1.  **Budget Category Integration:**
        *   Modify the "Create/Edit Budget" workflow to use the main transaction category list.
        *   Ensure the category selection dropdown in the budget form is populated from the user's existing `categories` table.
        *   Confirm that the system correctly tracks expenses against the budget based on the selected category.
    2.  **ISR Tariff Table Management:**
        *   **Backend:** Create full CRUD API endpoints (`GET`, `POST`, `PUT`, `DELETE`) to manage ISR tariff tables stored in the `fiscal_parameters` table.
        *   **Frontend:** Build a dedicated UI within the "Configuración Fiscal" page. This interface must allow users to view, edit, create, and import (e.g., from JSON/CSV) the monthly and annual ISR progressive rate tables.
        *   Implement robust validation for the structure and data types of imported/edited tables.

*   **Verification:**
    *   Users can successfully create a budget using their existing expense categories, and the budget tracking works as expected.
    *   The system allows for viewing and updating ISR tables through the new UI. The tax calculation engine (from Phase 19) must immediately use these user-configurable tables.

---

## Phase 27: Advanced Usability Enhancements

**Goal:** Improve data organization and workflow efficiency by introducing flexible metadata and inline entity creation.

*   **Tasks:**
    1.  **Generalized Metadata System:**
        *   **Backend:** Design and implement a generic `tags` table that can be linked to multiple other entities (e.g., `providers`, `bank_accounts`, `budgets`, `freelancers`, `services`) via a polymorphic association.
        *   **Frontend:** On the relevant entity management pages, add a UI component to add, view, and remove freeform tags. This will allow users to create flexible groupings (e.g., tag multiple bank accounts as belonging to the same banking institution).
    2.  **Inline Category/Tag Creation:**
        *   Enhance all dropdown components used for selecting categories or tags throughout the application.
        *   Add a "Create and add..." option within each dropdown list.
        *   Selecting this option will trigger a modal or an inline input field, allowing the user to create a new category/tag without navigating away from the current form.
        *   Upon creation, the new item is added to the database and is automatically selected in the dropdown.

*   **Verification:**
    *   Users can add arbitrary tags to providers, bank accounts, and other entities, and can filter the main lists based on these tags.
    *   Users can successfully create a new transaction category directly from the transaction creation form's category dropdown, and the new category is immediately available system-wide.

---

## Phase 28: Intelligent Compliance Engine

**Goal:** To design and build a backend rules engine that automatically infers and sets fiscal metadata on transactions based on user input, guiding the user to stay compliant with SAT rules.

*   **Tasks:**
    1.  **Rule Definition:** Codify the key fiscal rules from `REQUISITOS SAT.md` into a configurable format (e.g., JSON). This includes rules for CFDI requirements, cash payment limits, IVA accreditation, ISR deductions, foreign client services, etc.
    2.  **Backend Rules Engine:** Build a service that processes a transaction and its context (e.g., `has_cfdi`, `payment_method`) against the rule set to determine the correct fiscal attributes (`is_deductible_isr`, `is_accreditable_iva`, `iva_rate`).
    3.  **Frontend Guided Input:** Evolve the transaction forms to be more interactive. Instead of just providing toggles, ask clarifying questions ("¿Cuentas con factura (CFDI) para este gasto?"). The UI will then display the inferred fiscal status in real-time ("Este gasto no será deducible de ISR").
    4.  **API Integration:** The `POST /api/transactions` endpoint will use this engine to validate and enrich all incoming data, ensuring compliance from the point of entry.

*   **Verification:**
    *   The rules engine correctly infers fiscal attributes for a wide range of scenarios.
    *   The frontend provides clear, real-time feedback to the user based on their input.

---

## Phase 29: System-Wide Connectivity & Rules Verification

**Goal:** To perform a final, holistic audit of the entire system, ensuring that all data points, metadata, and automated rules are interconnected correctly and produce accurate fiscal calculations under all circumstances.

*   **Tasks:**
    1.  **End-to-End Scenario Testing:** Create and execute a comprehensive suite of complex test cases representing real-world fiscal scenarios (e.g., "Proportional deduction expense for a hybrid vehicle, paid with a foreign credit card, without a CFDI").
    2.  **Data Traceability Audit:** For each test case, manually trace the data flow: from the initial guided input -> through the compliance engine -> to the database record -> into the monthly tax calculation -> into the DIOT report -> and finally into the annual declaration.
    3.  **Discrepancy Resolution:** Meticulously identify, document, and fix any discrepancies where the automated rules or calculations do not perfectly match the requirements of `REQUISITOS SAT.md`.
    4.  **Final UAT Simulation:** Simulate a full fiscal year of activity, using the system as the single source of truth, and verify that all generated totals, reports, and declarations are 100% accurate.

*   **Verification:**
    *   The system passes all end-to-end scenario tests with no data corruption or calculation errors.
    *   A full fiscal year simulation produces results that are verifiably correct, establishing ultimate confidence in the system's integrity.
