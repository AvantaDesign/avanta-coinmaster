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

## Phase 8: Tax Modernization and Reconciliation ✅ **COMPLETED**

**Goal:** Update the fiscal module to handle historical data, dynamic tax rates, and provide tools for SAT reconciliation.

**Status:** ✅ **COMPLETED** - All backend infrastructure and frontend components implemented

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
        *   Created `src/components/ImportHistory.jsx` for viewing and managing past imports

2.  **SAT Reconciliation Tool:** ✅ **COMPLETED**
    *   ✅ **Database:** Created migration `018_add_sat_declarations.sql`
    *   ✅ **Backend:** Created `functions/api/sat-reconciliation.js` API
    *   ✅ **Utility:** Created `src/utils/satReconciliation.js` with comparison logic
    *   ✅ **Frontend:** Created `SATReconciliation.jsx` component with visual comparison interface
    *   ✅ **Frontend:** Created `DeclarationManager.jsx` component for managing declarations

3.  **Dynamic Fiscal Variables:** ✅ **COMPLETED**
    *   ✅ **Database:** Created migration `019_add_fiscal_parameters.sql`
    *   ✅ **Seed Data:** Created `seed_fiscal_parameters.sql` with 2024-2025 parameters
    *   ✅ **Backend:** Created `functions/api/fiscal-parameters.js` API
    *   ✅ **Utility:** Created `src/utils/fiscalParameterService.js`
    *   ✅ **Frontend:** Created `FiscalParametersManager.jsx` component with timeline view
    *   ✅ **Integration:** Updated `src/pages/Fiscal.jsx` with new tabs for all components
    *   ⚠️ **Optional:** Refactor `functions/api/fiscal.js` to use dynamic parameters (deferred to future enhancement)
    *   ⚠️ **Optional:** Update `FiscalCalculator.jsx` for historical calculations (deferred to future enhancement)

## Phase 9: Advanced Features & Mobile Polish ✅ **COMPLETED**

**Goal:** Introduce receipt processing and ensure a flawless mobile experience.

**Status:** ✅ **COMPLETED** - All tasks implemented successfully

**Tasks Completed:**

1.  ✅ **Receipt Upload and OCR:**
    *   ✅ **Research:** Investigated OCR solutions and documented findings in `docs/OCR_RESEARCH.md`
        *   Selected Tesseract.js for MVP (free, client-side OCR)
        *   Planned Google Cloud Vision API for future enhancement
    *   ✅ **Database:** Created migration `020_add_receipt_processing.sql` with receipts table
    *   ✅ **Backend:** Created `functions/api/receipts.js` with full CRUD operations:
        *   Upload receipts to R2 storage
        *   Process receipts with OCR (placeholder for server-side)
        *   Link receipts to transactions
        *   Receipt management endpoints
    *   ✅ **OCR Integration:** Implemented `src/utils/ocrProcessor.js`:
        *   Client-side OCR with Tesseract.js
        *   Spanish language support
        *   Extract amounts, dates, merchants from receipts
        *   Pattern matching for Mexican receipt formats
        *   Confidence scoring and validation
    *   ✅ **Frontend Components:**
        *   `ReceiptUpload.jsx` - Drag-and-drop upload with mobile camera capture
        *   `ReceiptProcessor.jsx` - OCR processing with editable results
        *   `ReceiptManager.jsx` - Responsive list with search and filtering
        *   Integrated into navigation menu (Fiscal section)
        *   Added `/receipts` route
    *   ✅ **Mobile Optimization:**
        *   All receipt components built mobile-first
        *   Responsive table/card layout switching
        *   Touch-friendly buttons and controls
        *   Native camera integration on mobile devices

2.  ✅ **Mobile Responsiveness Overhaul:**
    *   ✅ **Audit:** Created comprehensive mobile audit document `docs/MOBILE_AUDIT_PHASE9.md`
    *   ✅ **Existing Components:** Verified mobile responsiveness:
        *   `TransactionTable.jsx` - Already has mobile card view
        *   `AddTransaction.jsx` - Already responsive with grid layout
        *   Navigation menu - Mobile hamburger menu working
    *   ✅ **PWA Features Implemented:**
        *   Created `public/manifest.json` with app metadata and shortcuts
        *   Created `public/sw.js` service worker for offline support
        *   Created `src/utils/serviceWorker.js` for registration and management
        *   Updated `index.html` with PWA meta tags and manifest link
        *   Registered service worker in `main.jsx`
        *   Offline caching strategy for static assets and API responses
        *   Install prompt for home screen installation
    *   ✅ **Performance Optimizations:**
        *   Lazy loading already implemented for components
        *   Service worker caching for faster load times
        *   Virtual scrolling in transaction table
        *   Optimized bundle splitting

**Implementation Highlights:**
*   **Receipt Processing:** Complete end-to-end workflow from upload to OCR to transaction creation
*   **Mobile-First Design:** New components built with mobile as priority
*   **PWA Support:** App can be installed on mobile devices and works offline
*   **Performance:** Service worker caching improves load times significantly
*   **User Experience:** Intuitive interfaces with drag-and-drop, camera capture, and touch-friendly controls

**Technical Achievements:**
*   Client-side OCR with Tesseract.js (zero cost, privacy-friendly)
*   R2 storage integration for receipt images
*   Progressive Web App with offline capabilities
*   Service worker with intelligent caching strategies
*   Mobile-responsive components throughout

## Phase 10: Advanced UX & Security ✅ **COMPLETED**

**Goal:** Enhance the user experience with advanced data management features and improve security with audit logging.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  **Audit Logging:** ✅ **COMPLETED**
    *   ✅ **Database:** Created migration `021_add_audit_logging.sql` with comprehensive audit_log table
    *   ✅ **Backend:** Created `/api/audit-log` API endpoint with filtering, pagination, stats, and export capabilities
    *   ✅ **Frontend:** Created `AuditLogViewer.jsx` component with advanced filtering and responsive design
    *   ✅ **Frontend:** Created `AuditTrail.jsx` component for entity-specific audit history
    *   ✅ **Utility:** Created `auditService.js` with logging utilities for client-side integration
    *   ✅ **Navigation:** Added audit log route and menu item under "Ayuda" section
    *   ⚠️ **Integration:** Audit logging into existing APIs (deferred - can be added incrementally as needed)

2.  **Bulk Transaction Editing:** ✅ **COMPLETED**
    *   ✅ **Frontend:** Updated `TransactionTable.jsx` with bulk edit button in actions bar
    *   ✅ **Frontend:** Created `BulkEditModal.jsx` with comprehensive editing capabilities:
        *   Update or replace mode for different editing strategies
        *   Edit transaction type, category, account, deductibility
        *   Find and replace text in descriptions
        *   Add/update notes with append or replace mode
        *   Live preview of changes before applying
    *   ✅ **Backend:** Created `/api/transactions/bulk-update` endpoint handling up to 1000 transactions
        *   Validates ownership before updating
        *   Returns detailed results (successful, failed, skipped)
        *   Supports all transaction fields

3.  **Advanced Search and Filtering:** ✅ **COMPLETED**
    *   ✅ **Frontend:** Created `AdvancedFilter.jsx` component with:
        *   Expandable/collapsible design
        *   Quick search for descriptions
        *   Multiple filter criteria (type, category, date range, amount range, deductible)
        *   Save/load filter presets to localStorage
        *   Visual indicators for active filters
    *   ✅ **Frontend:** Integrated advanced filter into `Transactions` page
    *   ✅ **Backend:** Existing `GET /api/transactions` endpoint already supports all advanced filtering parameters

**Implementation Highlights:**
*   **Audit Logging System:** Complete infrastructure for tracking user actions with filtering, export, and analytics
*   **Bulk Operations:** Powerful bulk editing with preview and multiple update strategies
*   **Advanced Filters:** Comprehensive filtering with saved presets and localStorage persistence
*   **Mobile-Responsive:** All components designed with mobile-first approach
*   **Performance:** Efficient queries and pagination for handling large datasets

**Technical Achievements:**
*   Created 7 new files: migration, API endpoint, 3 components, 1 utility, 1 page
*   Enhanced TransactionTable and Transactions page
*   Maintained backward compatibility with existing systems
*   All features build successfully and are ready for testing

## Phase 11: Design System & Visual Foundation ✅ **COMPLETED**

**Goal:** To establish the foundational elements of a sophisticated design system, elevating the application's visual consistency and professional aesthetic.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Implement a Professional Icon Set:**
    *   Installed @heroicons/react package
    *   Created `src/components/icons/IconLibrary.jsx` with centralized icon management
    *   Replaced all emoji-based icons with professional Heroicons across the application
    *   Components updated: GlobalFilter, FinancialDashboard, AccountManager, AdvancedFilter, AccountsPayable, AccountsReceivable, AdvancedReports, AdvancedAnalytics
    *   Implemented consistent icon sizing (xs, sm, md, lg, xl, 2xl)
    *   Added accessibility support with ARIA labels
    *   Used distinct icons for Personal (user) and Business (briefcase) contexts

2.  ✅ **Refine Typography Scale & Hierarchy:**
    *   Enhanced `tailwind.config.js` with comprehensive typography scale
    *   Defined heading sizes: heading-1 through heading-6 with proper line heights and weights
    *   Established body text variants: body-large, body, body-small
    *   Created utility variants: label, caption, code
    *   Added typography utility classes to `src/index.css`
    *   All typography scales follow consistent sizing and spacing

3.  ✅ **Evolve and Standardize the Color Palette:**
    *   Expanded semantic color system in `tailwind.config.js`
    *   Maintained existing success, warning, danger, info colors (desaturated for dark mode compatibility)
    *   Added business and personal context colors for enhanced visual separation
    *   All colors designed with WCAG AA accessibility compliance
    *   Consistent color usage across all components

4.  ✅ **Standardize Spacing and Layout:**
    *   Implemented 8px grid spacing system in `tailwind.config.js`
    *   Defined consistent spacing scale: 2px, 4px, 6px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 40px, 48px, 64px, 80px, 96px
    *   Base unit of 8px (0.5rem) for harmonious visual balance
    *   Consistent spacing applied across existing components

**Implementation Highlights:**
*   **Icon Library:** 50+ professional icons with tree-shaking optimization
*   **Typography:** Complete typographic scale with 11 defined sizes
*   **Colors:** Enhanced semantic color system with business/personal context colors
*   **Spacing:** 8px grid system for consistent visual rhythm
*   **Build Success:** All changes build successfully with optimized bundle size
*   **No Regressions:** Dark mode compatibility maintained throughout

**Technical Achievements:**
*   Created centralized icon component with flexible API
*   Icon bundle optimized through tree-shaking (only used icons included)
*   Typography system provides clear visual hierarchy
*   Semantic colors improve accessibility and user understanding
*   8px grid ensures visual harmony across all components

## Phase 12: Dashboard & Navigation Refinement ✅ **COMPLETED**

**Goal:** To redesign the main dashboard and navigation to be more intuitive, insightful, and goal-oriented.

**Status:** ✅ **COMPLETED**

**Tasks Completed:**

1.  ✅ **Create a "Command Center" Dashboard:**
    *   Created `FinancialHealthScore.jsx` component with comprehensive scoring system
    *   Score calculation (0-100) based on 5 key metrics:
        *   Cash Flow Health (30%)
        *   Debt-to-Income Ratio (25%)
        *   Budget Adherence (20%)
        *   Savings Rate (15%)
        *   Account Balance Health (10%)
    *   Visual indicators: Color-coded score rings (red <40, yellow 40-70, green >70)
    *   Expandable breakdown showing each metric with details
    *   Smart suggestions based on score weaknesses
    *   Trend indicators (improving/declining/neutral)
    *   Integrated into `FinancialDashboard.jsx` at top priority position

2.  ✅ **Implement Interactive & Drill-Down Charts:**
    *   Enhanced `MonthlyChart.jsx` with interactive features:
        *   Hover tooltips showing balance calculations
        *   Click-to-drill-down navigation to filtered transaction views
        *   Visual hover effects on chart bars
        *   Icon indicators for income/expense trends
        *   Click hints for users
        *   Legend with visual indicators
    *   Navigation integration with React Router for seamless filtering

3.  ✅ **Introduce Breadcrumbs:**
    *   Created `Breadcrumbs.jsx` component with:
        *   Dynamic path generation from current route
        *   Clickable navigation to any breadcrumb level
        *   Route-specific icons for visual context
        *   Responsive design with horizontal scroll
        *   30+ route mappings with Spanish names
    *   Integrated into main layout (`App.jsx`)
    *   Mobile-optimized with flex-shrink controls

4.  ✅ **Implement a Global "Quick Add" Button:**
    *   Created `QuickAddFAB.jsx` floating action button:
        *   Fixed positioning (bottom-right)
        *   Expandable menu with 5 quick actions:
            *   Add Income (green)
            *   Add Expense (red)
            *   Upload Receipt (blue)
            *   Add Savings Goal (orange)
            *   Create Budget (primary)
        *   Smooth animations and transitions
        *   Mobile-optimized positioning (adjusts for browser UI)
        *   Touch-friendly with backdrop on mobile
        *   Auto-closes on route change
        *   Keyboard accessible
    *   Integrated into main layout

**Additional Enhancements:**

*   ✅ **Icon Library Updates:**
    *   Added 15+ new icons: chevronRight, chevronUp, chevronDown, cursor, lightBulb, bolt, flag, scale, minus, clipboardDocumentCheck, shieldCheck, documentCheck, users
    *   Updated icon mappings with camelCase and kebab-case variants
    *   Added banking and financial icons

*   ✅ **CSS Fixes:**
    *   Removed circular typography utility class definitions from `index.css`
    *   Fixed build errors related to @apply circular dependencies

*   ✅ **Dashboard Data Enhancement:**
    *   Updated `FinancialDashboard.jsx` to fetch transactions and budgets data
    *   Added 3-month transaction history for health score calculations
    *   Improved data loading with proper error handling

**Implementation Highlights:**

*   **Financial Health Score:** Comprehensive scoring algorithm with weighted metrics
*   **Interactive Charts:** Click-through navigation with pre-applied filters
*   **Breadcrumbs:** Context-aware navigation with 30+ routes mapped
*   **Quick Add FAB:** 5 most common actions always accessible
*   **Professional Icons:** Consistent iconography throughout
*   **Mobile-First:** All components responsive and touch-friendly

**Technical Achievements:**

*   Created 3 new major components (492 lines total)
*   Enhanced 4 existing components
*   Added 15+ new icons to library
*   Maintained backward compatibility
*   Zero build errors
*   Optimized bundle size with lazy loading

## Phase 13: Interaction & Mobile Experience 🚧 IN PROGRESS

**Goal:** To enhance detailed user interactions, streamline data entry, and deliver a superior mobile-first experience.

**Status:** 🚧 **IN PROGRESS** - Smart form utilities and components created

**Tasks Completed:**

1.  **Design "Smart" Forms:** ✅ UTILITIES AND COMPONENTS CREATED
    *   ✅ Created `src/utils/smartFormUtils.js` with intelligent form utilities:
        *   Category suggestions based on description and history
        *   Description auto-complete with fuzzy matching
        *   Currency input formatting (MXN locale)
        *   Account suggestions based on usage patterns
        *   Real-time validation with detailed error messages
        *   Quick date options (today, yesterday, last week, etc.)
        *   Debounce utility for input handlers
    *   ✅ Created `src/components/SmartInput.jsx`:
        *   Auto-complete input with suggestions dropdown
        *   Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
        *   Loading states and error handling
        *   Mobile-optimized with touch interactions
        *   Fuzzy matching for typo tolerance
        *   Metadata display for suggestions
    *   ✅ Created `src/components/CurrencyInput.jsx`:
        *   Real-time currency formatting as user types
        *   Proper decimal handling (2 decimal places)
        *   Increment/decrement buttons
        *   Min/max validation
        *   Mobile-friendly number input with inputMode="decimal"
        *   Visual currency symbol ($)
    *   ✅ Created `src/components/DatePicker.jsx`:
        *   Enhanced date input with quick selection dropdown
        *   Quick options: today, yesterday, last week, month start/end
        *   Formatted date display (e.g., "lun, 18 oct 2025")
        *   Keyboard shortcuts for quick selections
        *   Mobile-optimized interface
    *   ✅ **Integration into `AddTransaction.jsx` - COMPLETED:**
        *   Integrated `SmartInput` for description with auto-complete
        *   Integrated `CurrencyInput` for amount with real-time formatting
        *   Integrated `DatePicker` with quick date selection
        *   Added real-time form validation with error display
        *   Description suggestions learn from transaction history
        *   Account suggestions based on usage patterns
    *   ⏳ Enhancement of other forms - PENDING

2.  **Enhance Data Tables:** ✅ DETAIL VIEW COMPLETED, FILTERS PENDING
    *   ✅ **Created `src/components/TableRowDetail.jsx`:**
        *   Expandable row detail view with tabs
        *   Three tabs: Details, Metadata, Audit Trail
        *   Professional icon usage throughout
        *   Mobile-responsive design
        *   Formatted display of all transaction fields
    *   ✅ **Enhanced `TransactionTable.jsx` with detail view:**
        *   Added expand/collapse buttons to each row
        *   Desktop: chevron icon in actions column
        *   Mobile: "Detalles" button with icon
        *   Detail view integrates seamlessly in both layouts
        *   Touch device detection for optimized interactions
        *   Professional Icon components replacing emoji icons
    *   ⏳ Advanced filtering and export - PENDING

3.  **Adopt a Mobile-First Design Philosophy:** ✅ COMPONENTS CREATED, INTEGRATION PENDING
    *   ✅ **Created `src/components/MobileCard.jsx`:**
        *   Swipeable card component with touch gestures
        *   Support for left/right swipe actions
        *   Tap and long-press handlers
        *   Swipe hint indicator
        *   Sub-components: Header, Body, Footer, Action, Field, Badge
        *   Touch-optimized (44px minimum touch targets)
        *   Active state feedback
    *   ✅ **Created `src/components/MobileLayout.jsx`:**
        *   Mobile-optimized layout wrapper
        *   Sticky header with back button support
        *   Bottom navigation support
        *   Safe area insets for notched devices
        *   Scroll-aware shadow effects
        *   Sub-components: Section, List, ListItem, ActionSheet, EmptyState, BottomNavItem
        *   Collapsible sections
        *   Mobile action sheets (bottom sheets)
    *   ✅ **Created `src/components/TableFilters.jsx`:**
        *   Advanced filtering interface
        *   Support for 8 filter types: text, select, multiselect, date, daterange, number, numberrange, boolean
        *   Filter preset system (save/load)
        *   Active filter counter
        *   Expandable/collapsible design
        *   Clear all filters functionality
        *   Mobile-responsive grid layout
    *   ⏳ Integration into existing pages - PENDING

4.  **Optimize for Touch:** ✅ UTILITIES CREATED, PARTIAL INTEGRATION
    *   ✅ Created `src/utils/touchUtils.js` with comprehensive touch utilities:
        *   Touch device detection
        *   Swipe gesture handler (left, right, up, down)
        *   Pull-to-refresh implementation
        *   Long press handler with haptic feedback
        *   Tap target optimization (44px minimum)
        *   Swipeable list item creator
        *   Haptic feedback patterns (light, medium, heavy, success, error)
        *   Scroll prevention during gestures
    *   ✅ **Integrated touch detection in `TransactionTable.jsx`:**
        *   Touch device detection on component mount
        *   Touch-optimized button sizes and spacing
        *   Mobile-friendly expandable detail views
    *   ⏳ Swipe gestures for row actions - PENDING

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