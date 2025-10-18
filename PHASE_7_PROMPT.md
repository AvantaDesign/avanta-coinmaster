# Phase 7: Advanced Financial Planning & Metadata

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at the repository root.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V5.md` for complete project context and progress tracking. This file contains:

✅ **Phase 1-6:** COMPLETED
🚧 **Phase 7:** CURRENT PHASE (Advanced Financial Planning & Metadata)
📋 **Phase 8-10:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V5.md` file with your progress as you complete each task.

## Current Task: Phase 7 - Advanced Financial Planning & Metadata

### Goal
Introduce savings goals and enhance data with metadata for better organization and insights.

### Context from Previous Phases
- Phase 6 just completed: Business/Personal separation is fully implemented
- Global filter system is in place and working
- Database has proper structure for type-based filtering
- All APIs support business/personal filtering

### Actionable Steps

#### 1. Savings Goals Module

**Database Schema:**
- Create migration `015_add_savings_goals.sql`
- Create table `savings_goals` with columns:
  - `id` TEXT PRIMARY KEY
  - `user_id` TEXT NOT NULL (FK to users)
  - `name` TEXT NOT NULL
  - `target_amount` REAL NOT NULL
  - `current_amount` REAL DEFAULT 0
  - `target_date` TEXT
  - `type` TEXT CHECK(type IN ('personal', 'business'))
  - `category` TEXT (e.g., 'investment', 'emergency_fund', 'vacation', 'equipment')
  - `description` TEXT
  - `is_active` INTEGER DEFAULT 1
  - `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
- Add indexes for `user_id`, `type`, `is_active`, `target_date`

**Backend API:**
- Create `functions/api/savings-goals.js` with full CRUD operations
- Endpoints:
  - `GET /api/savings-goals` - List all goals with filtering by type, status
  - `GET /api/savings-goals/:id` - Get single goal details
  - `POST /api/savings-goals` - Create new goal
  - `PUT /api/savings-goals/:id` - Update goal
  - `DELETE /api/savings-goals/:id` - Soft delete goal
  - `POST /api/savings-goals/:id/contribute` - Add contribution to goal
- Support filtering by type (personal/business) from global filter
- Calculate progress percentage and days remaining

**Frontend Components:**
- Create `src/components/SavingsGoals.jsx`
  - Display goals in card layout with progress bars
  - Show percentage complete, amount remaining, days until target
  - Visual indicators (color-coded by progress: red <30%, yellow 30-70%, green >70%)
  - Add/Edit goal modal form
  - Quick contribute button
  - Filter by status (all, in-progress, completed, overdue)
- Create `src/pages/SavingsGoals.jsx` wrapper page
- Add route `/savings-goals` in `App.jsx`
- Add navigation menu item under "Tesorería" section
- Create `SavingsGoalSummary` widget for dashboard
  - Show 3-4 goals closest to completion
  - Total savings across all goals
  - Quick link to full page

**Transaction Integration:**
- Update `AddTransaction.jsx` to allow linking transaction to savings goal
- Add optional `savings_goal_id` field in transaction form
- When transaction is linked, automatically update `current_amount` in goal
- Display linked goal information in transaction details

#### 2. Enhanced Metadata System

**Database Schema:**
- Create migration `016_add_metadata_fields.sql`
- Add `metadata` JSON column to tables:
  - `accounts` - Store: bank_name, account_number_last4, branch, swift_code, etc.
  - `credits` - Store: bank_name, card_network, card_last4, apr, etc.
  - `debts` - Store: creditor_type, original_creditor, collection_agency, etc.
  - `investments` - Store: broker, asset_class, ticker_symbol, cusip, etc.
- Ensure JSON validation and proper indexing

**Backend API Updates:**
- Update existing APIs to accept and return `metadata` field:
  - `accounts.js` - Add metadata support in POST/PUT/GET
  - `credits.js` - Add metadata support in POST/PUT/GET
  - `debts.js` - Add metadata support in POST/PUT/GET
  - `investments.js` - Add metadata support in POST/PUT/GET
- Add endpoint `GET /api/metadata/suggestions?entity=accounts&field=bank_name`
  - Return unique values from metadata for autocomplete

**Frontend Components:**
- Create `src/components/MetadataEditor.jsx`
  - Reusable component for adding/editing metadata
  - Key-value pair interface
  - Common presets for different entity types (accounts, credits, etc.)
  - Autocomplete based on previously used values
- Update entity forms to include metadata section:
  - `AccountManager.jsx` - Add "Optional Details" section with metadata editor
  - `CreditCard.jsx` / `Credits.jsx` - Add metadata fields
  - `Debts.jsx` - Add metadata fields  
  - `Investments.jsx` - Add metadata fields
- Add metadata display in detail views
- Create smart suggestions:
  - When user adds "bank_name" to account, suggest showing all accounts from same bank
  - Create "Related Items" widget showing items with matching metadata

#### 3. Data Relationships & Smart Insights

**Relationship Detection:**
- Create utility `src/utils/relationshipDetector.js`
  - Detect items with matching metadata tags
  - Find accounts, credits, investments from same institution
  - Identify related debts and payment accounts
- Display relationships in UI:
  - "Related Accounts" section in account details
  - "All [Bank Name] accounts" quick filter

**Smart Insights:**
- Create `src/components/MetadataInsights.jsx`
  - Show breakdown by bank/institution
  - Total balance per institution
  - Identify diversification opportunities
  - Suggest metadata fields that should be filled

#### 4. Integration with Global Filter

**Filter Enhancement:**
- Savings goals respect global filter (personal/business)
- Metadata editor suggests appropriate tags based on current filter context
- Dashboard widgets show filtered data

#### 5. Testing & Validation

**Database:**
- Run migration to create savings_goals table
- Test metadata JSON storage and retrieval
- Verify indexes are created

**Backend:**
- Test all CRUD operations for savings goals
- Verify metadata is properly saved/retrieved
- Test filtering by type

**Frontend:**
- Test savings goal creation and updates
- Test contribution tracking
- Test transaction linking
- Test metadata editor for all entity types
- Verify autocomplete suggestions work
- Test relationship detection

**Integration:**
- Verify global filter works with savings goals
- Test dashboard widget integration
- Verify all navigation links work

### Verification Steps

1. Run `npm run build` to ensure the application compiles without errors
2. Test creating savings goals with different types
3. Test linking transactions to savings goals
4. Test adding metadata to accounts, credits, debts, investments
5. Verify relationship detection finds related items
6. Test metadata autocomplete suggestions
7. Verify dashboard shows savings goal summary
8. Ensure global filter works with new features
9. Test on mobile devices for responsive design

### Progress Tracking

**MANDATORY:** Update `IMPLEMENTATION_PLAN_V5.md` with checkmarks (✅) as you complete each task.

Mark subtasks complete:
- Database migrations
- Backend APIs
- Frontend components
- Integration points
- Testing completed

Mark Phase 7 as completed when all tasks are done.

### Technical Considerations

- Follow existing code patterns and conventions
- Use existing Zustand stores or create new ones as needed
- Ensure responsive design for all new components
- Implement proper error handling and loading states
- Use the existing API structure and extend it as needed
- Maintain consistency with the current UI/UX design
- Consider performance implications of metadata queries
- Implement proper data validation
- Use TypeScript-style JSDoc comments for better IDE support

### Database Considerations

- Design proper indexes for metadata queries
- Consider data integrity constraints
- Plan for data migration of existing records
- Implement proper foreign key relationships
- Test JSON metadata storage performance

### UI/UX Considerations

- Use consistent styling with existing components
- Implement clear visual hierarchy
- Provide helpful tooltips and descriptions
- Use icons consistently with existing design
- Ensure accessibility (ARIA labels, keyboard navigation)
- Add loading skeletons for better perceived performance
- Provide clear success/error feedback

### Next Step

Upon successful completion and verification of all Phase 7 tasks, generate and output the complete, self-contained prompt for **Phase 8: Tax Modernization and Reconciliation**, following this same instructional format and referencing the updated implementation plan.

## Files to Reference

- `IMPLEMENTATION_PLAN_V5.md` - Master plan with all phases
- `schema.sql` - Current database schema
- `migrations/` - All migration files
- `src/stores/useFilterStore.js` - Global filter implementation
- `src/components/GlobalFilter.jsx` - Global filter UI
- `functions/api/` - All API endpoints
- `src/utils/api.js` - API utilities

## Success Criteria

Phase 7 is complete when:
- ✅ Savings goals can be created, edited, and tracked
- ✅ Transactions can be linked to savings goals
- ✅ Progress is automatically calculated and displayed
- ✅ Metadata can be added to accounts, credits, debts, investments
- ✅ Metadata autocomplete provides suggestions
- ✅ Related items are detected and displayed
- ✅ Dashboard shows savings goal summary widget
- ✅ Global filter works with all new features
- ✅ All features work on mobile devices
- ✅ Application builds without errors
- ✅ IMPLEMENTATION_PLAN_V5.md is updated
