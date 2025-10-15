# Phase 0, Section 2: Data Visualization - Testing Guide

## Overview
This guide documents the testing procedures for the data visualization features implemented in Phase 0, Section 2.

## Features Implemented

### 1. Account Balance Breakdown Component
**File:** `src/components/AccountBreakdown.jsx`

**Features:**
- Groups accounts by type (banco, tarjeta, efectivo)
- Shows individual account balances with visual bars
- Color-coded positive (green) and negative (red) balances
- Displays total balance across all accounts
- Responsive design

**Test Cases:**
- [ ] Component renders without errors
- [ ] Accounts are grouped correctly by type
- [ ] Visual bars scale proportionally to balance amounts
- [ ] Colors match balance signs (green for positive, red for negative)
- [ ] Total balance calculation is correct
- [ ] Empty state displays correctly when no accounts
- [ ] Responsive layout works on mobile devices

### 2. Period Selector Component
**File:** `src/components/PeriodSelector.jsx`

**Features:**
- Four period options: Este Mes, Este Trimestre, Este Año, Todo
- Active state highlighting
- Triggers dashboard data refresh on change
- Responsive button layout

**Test Cases:**
- [ ] All four buttons render correctly
- [ ] Active button has blue background
- [ ] Clicking a button changes the active state
- [ ] Clicking triggers dashboard data reload with correct period
- [ ] Buttons wrap properly on mobile devices
- [ ] Touch interactions work on mobile

### 3. Enhanced Monthly Chart
**File:** `src/components/MonthlyChart.jsx`

**Features:**
- Displays last 6 months of income/expense trends
- Formatted month labels (e.g., "oct 2025")
- Scaled bar charts
- Empty state handling

**Test Cases:**
- [ ] Chart displays 6 months of data
- [ ] Month labels are formatted correctly
- [ ] Income bars are green, expense bars are red
- [ ] Bars scale correctly relative to max value
- [ ] Currency amounts display correctly
- [ ] Empty state shows when no data
- [ ] Changes when period selector is changed

### 4. Mobile Card View for Transactions
**File:** `src/components/TransactionTable.jsx`

**Features:**
- Card layout for transactions on mobile
- Hidden table on mobile (< 768px)
- Full feature parity with desktop table
- Inline editing in card view
- Selection checkboxes

**Test Cases:**
- [ ] Table view visible on desktop (≥ 768px)
- [ ] Card view visible on mobile (< 768px)
- [ ] Cards display all transaction information
- [ ] Edit button opens inline edit mode
- [ ] Save/Cancel buttons work in edit mode
- [ ] Delete button works with confirmation
- [ ] Selection checkboxes work in card view
- [ ] Bulk actions work with selected cards
- [ ] Touch interactions are smooth
- [ ] Color coding matches desktop (green/red, badges)

### 5. Category Breakdown Display
**File:** `src/pages/Home.jsx`

**Features:**
- Shows top 5 categories with totals
- Income/expense badges
- Conditional rendering based on data availability

**Test Cases:**
- [ ] Top 5 categories display correctly
- [ ] Category names and totals are accurate
- [ ] Income/expense badges are color-coded
- [ ] Section hidden when no category data
- [ ] Amounts formatted as currency
- [ ] Updates when period changes

## Testing Procedures

### Desktop Testing (1920px)
1. Open application in Chrome browser at full width
2. Navigate to Dashboard page
3. Verify all components render correctly
4. Test period selector (click each button)
5. Verify data updates for each period
6. Check account breakdown visualization
7. Check category breakdown display
8. Test transaction table sorting and filtering

### Tablet Testing (768px)
1. Resize browser to 768px width
2. Verify responsive layout adjustments
3. Check period selector button wrapping
4. Verify account breakdown still displays well
5. Check that table is still visible at this breakpoint

### Mobile Testing (375px)
1. Resize browser to 375px width (or use mobile device)
2. Verify period selector wraps to multiple rows if needed
3. Verify account breakdown is readable
4. **Verify transaction table switches to card view**
5. Test card view interactions:
   - Open edit mode on a card
   - Save changes
   - Cancel edit
   - Delete transaction
   - Select multiple cards
   - Test bulk actions
6. Verify all text is readable
7. Verify buttons are touch-friendly (minimum 44px)

### Data Testing
1. **Test with empty data:**
   - Verify all components show appropriate empty states
   
2. **Test with minimal data (1-2 accounts, few transactions):**
   - Verify components render correctly
   - Check that bars/charts scale appropriately
   
3. **Test with rich data (many accounts, many transactions):**
   - Verify performance is acceptable
   - Check that scrolling works smoothly
   - Verify all data displays correctly

4. **Test period filtering:**
   - Select "Este Mes" - verify data is current month only
   - Select "Este Año" - verify data is current year
   - Select "Todo" - verify all historical data
   - Note: "Este Trimestre" uses year period (backend limitation)

### Integration Testing
1. Verify backward compatibility with Section 1 features:
   - Search functionality still works
   - Filters still work
   - Bulk operations still work
   - Inline editing still works
   - Statistics still calculate correctly

2. Verify no JavaScript console errors
3. Verify no network request failures
4. Verify proper loading states during data fetch

## Expected Results

### Account Breakdown Component
- **Desktop:** Clean card layout with horizontal bars
- **Mobile:** Stacked layout, readable text, proportional bars

### Period Selector
- **Desktop:** Horizontal button row
- **Mobile:** Buttons wrap if needed, remain touch-friendly

### Mobile Card View
- **Appearance:** Each transaction in a card with rounded borders
- **Layout:** Vertical stack, checkbox + description + amount at top
- **Badges:** Type and category badges below
- **Actions:** Edit and Delete buttons at bottom
- **Edit Mode:** Full form with all editable fields

### Category Breakdown
- **Display:** Top 5 categories with totals
- **Badges:** Green for income, red for expenses
- **Conditional:** Only shows when data exists

## Known Limitations

1. **Quarter Period:** Backend currently treats "quarter" as "year" - this is expected behavior based on existing API implementation
2. **Backend Required:** Full testing requires Cloudflare Workers backend to be running
3. **Mock Data:** No mock data available - must use real backend with seed data

## Production Testing Checklist

Once deployed to production:
- [ ] Visit dashboard at production URL
- [ ] Verify all components load
- [ ] Test period selector with real data
- [ ] Verify account breakdown shows actual accounts
- [ ] Test mobile card view on actual mobile device
- [ ] Take screenshots of all new components
- [ ] Create screen recording showing period selector in action
- [ ] Create screen recording showing mobile card view

## Screenshot Requirements

### Desktop Screenshots Needed:
1. Dashboard with "Este Mes" selected
2. Dashboard with "Este Año" selected
3. Close-up of Account Breakdown component
4. Close-up of Period Selector component
5. Close-up of Category Breakdown section

### Mobile Screenshots Needed:
1. Dashboard overview on mobile (375px)
2. Transaction card view
3. Transaction card in edit mode
4. Period selector on mobile

## Success Criteria

✅ **All components render without errors**
✅ **Build succeeds with no warnings**
✅ **Responsive design works across breakpoints**
✅ **Mobile card view provides full functionality**
✅ **Period selector updates dashboard data**
✅ **Account breakdown visualizes data clearly**
✅ **No breaking changes to Section 1 features**
✅ **Code follows project conventions**

## Notes

- All components use TailwindCSS utility classes
- Color scheme: green (#10b981) for positive/income, red (#ef4444) for negative/expenses
- Mobile breakpoint: 768px (TailwindCSS `md:` breakpoint)
- All currency formatting uses `formatCurrency()` utility
- All date formatting uses `formatDate()` utility
