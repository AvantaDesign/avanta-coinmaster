# Data Visualization Components - Phase 0, Section 2

## Overview

This document describes the data visualization components implemented in Phase 0, Section 2 of the Avanta CoinMaster 2.0 project.

## Components

### 1. AccountBreakdown Component

**Location:** `src/components/AccountBreakdown.jsx`

**Purpose:** Visualizes account balances grouped by account type with visual indicators.

**Props:**
- `accounts` (array): Array of account objects from the dashboard API

**Account Object Structure:**
```javascript
{
  id: number,
  name: string,
  type: 'banco' | 'tarjeta' | 'efectivo',
  balance: number,
  updated_at: string
}
```

**Features:**
- Groups accounts by type (banco, tarjeta, efectivo)
- Displays visual progress bars proportional to total balance
- Color coding:
  - Green for positive balances (bank accounts)
  - Red for negative balances (credit cards)
- Shows total balance at bottom
- Responsive design for mobile and desktop

**Usage:**
```jsx
import AccountBreakdown from '../components/AccountBreakdown';

function Dashboard() {
  const [data, setData] = useState(null);
  
  return (
    <AccountBreakdown accounts={data?.accounts || []} />
  );
}
```

**Empty State:**
Displays "No hay cuentas para mostrar" when no accounts are provided.

---

### 2. PeriodSelector Component

**Location:** `src/components/PeriodSelector.jsx`

**Purpose:** Provides buttons to select different time periods for dashboard data filtering.

**Props:**
- `value` (string): Currently selected period ('month' | 'quarter' | 'year' | 'all')
- `onChange` (function): Callback function called when period changes

**Periods:**
- `month` - Este Mes (Current month)
- `quarter` - Este Trimestre (Current quarter)
- `year` - Este Año (Current year)
- `all` - Todo (All time)

**Features:**
- Active state highlighting with blue background
- Hover states for better UX
- Responsive flex-wrap layout
- Touch-friendly button sizes

**Usage:**
```jsx
import PeriodSelector from '../components/PeriodSelector';

function Dashboard() {
  const [period, setPeriod] = useState('month');
  
  return (
    <PeriodSelector 
      value={period} 
      onChange={setPeriod} 
    />
  );
}
```

**Styling:**
- Active: Blue background (`bg-blue-600`), white text
- Inactive: White background, gray text, gray border
- Hover: Light gray background on inactive buttons

---

### 3. Enhanced MonthlyChart Component

**Location:** `src/components/MonthlyChart.jsx`

**Purpose:** Displays income and expense trends for the last 6 months.

**Props:**
- `data` (array): Array of trend objects from the dashboard API

**Trend Object Structure:**
```javascript
{
  month: string,        // Format: 'YYYY-MM'
  income: number,
  expenses: number,
  net: number
}
```

**Features:**
- Automatically formats month labels (e.g., "oct 2025")
- Scales bars relative to maximum value
- Color-coded bars (green for income, red for expenses)
- Shows currency amounts on bars when they fit
- Empty state handling

**Changes from Previous Version:**
- Now accepts trend data directly from API
- Formats dates from 'YYYY-MM' format
- Improved data processing for display

**Usage:**
```jsx
import MonthlyChart from '../components/MonthlyChart';

function Dashboard() {
  const [data, setData] = useState(null);
  
  return (
    <MonthlyChart data={data?.trends || []} />
  );
}
```

---

### 4. Mobile Card View (TransactionTable Enhancement)

**Location:** `src/components/TransactionTable.jsx`

**Purpose:** Provides a mobile-friendly card layout for transaction lists.

**Props:**
- `transactions` (array): Array of transaction objects
- `onUpdate` (function): Callback for when transactions are updated

**Features:**
- Responsive breakpoint at 768px (TailwindCSS `md:`)
- Desktop: Traditional table view
- Mobile: Stacked card layout
- Full feature parity:
  - Inline editing
  - Selection checkboxes
  - Delete functionality
  - Bulk operations
- Touch-friendly buttons and controls

**Card Layout Structure:**
```
┌─────────────────────────────────────┐
│ ☐ Description          $1,000.00 ↗ │
│   Date                              │
│   [Badge: Type] [Badge: Category]   │
│   [✏️ Editar] [🗑️ Eliminar]          │
└─────────────────────────────────────┘
```

**Edit Mode in Cards:**
- Full form with all editable fields
- Vertical stack layout for better mobile UX
- Save and Cancel buttons at bottom
- Input fields sized appropriately

**Implementation Details:**
```jsx
{/* Desktop Table View - hidden on mobile */}
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>

{/* Mobile Card View - visible only on mobile */}
<div className="md:hidden">
  {transactions.map(transaction => (
    <div className="border-b p-4">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

## Integration Guide

### Dashboard Integration (Home.jsx)

The dashboard page integrates all components:

```jsx
import { useState, useEffect } from 'react';
import { fetchDashboard } from '../utils/api';
import AccountBreakdown from '../components/AccountBreakdown';
import PeriodSelector from '../components/PeriodSelector';
import MonthlyChart from '../components/MonthlyChart';

export default function Home() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadDashboard();
  }, [period]); // Reload when period changes

  const loadDashboard = async () => {
    const result = await fetchDashboard({ period });
    setData(result);
  };

  return (
    <div>
      {/* Period Selector */}
      <PeriodSelector value={period} onChange={setPeriod} />
      
      {/* Charts and Breakdowns */}
      <MonthlyChart data={data?.trends || []} />
      <AccountBreakdown accounts={data?.accounts || []} />
    </div>
  );
}
```

---

## API Integration

### Enhanced fetchDashboard Function

**Location:** `src/utils/api.js`

**Changes:**
```javascript
// Before
export async function fetchDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`);
  return response.json();
}

// After
export async function fetchDashboard(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_BASE}/dashboard${queryString ? '?' + queryString : ''}`;
  const response = await fetch(url);
  return response.json();
}
```

**Usage:**
```javascript
// Get current month data (default)
const data = await fetchDashboard({ period: 'month' });

// Get current year data
const data = await fetchDashboard({ period: 'year' });

// Get all historical data
const data = await fetchDashboard({ period: 'all' });
```

**Backend Support:**
The dashboard API (`/api/dashboard`) already supports these query parameters:
- `period`: 'month' | 'year' | 'all' (default: 'month')
- `include_categories`: boolean (default: true)
- `include_accounts`: boolean (default: true)
- `include_trends`: boolean (default: true)
- `recent_limit`: number (default: 10, max: 50)

---

## Responsive Design

### Breakpoints

The components use TailwindCSS breakpoints:
- **Mobile:** < 768px
- **Tablet:** ≥ 768px and < 1024px
- **Desktop:** ≥ 1024px

### Mobile-Specific Classes

```css
/* Hidden on mobile, visible on desktop */
.hidden.md:block

/* Visible on mobile, hidden on desktop */
.md:hidden

/* Flex wrap for responsive buttons */
.flex.flex-wrap

/* Responsive grid layouts */
.grid.grid-cols-1.lg:grid-cols-2
```

---

## Color Scheme

### Income/Positive
- Background: `bg-green-50`
- Text: `text-green-600` / `text-green-700`
- Bar: `bg-green-500`

### Expenses/Negative
- Background: `bg-red-50`
- Text: `text-red-600` / `text-red-700`
- Bar: `bg-red-500`

### Neutral
- Background: `bg-blue-50`
- Text: `text-blue-600` / `text-blue-700`

### UI Elements
- Active button: `bg-blue-600` with white text
- Inactive button: white background with gray text
- Borders: `border-gray-200` / `border-gray-300`

---

## Accessibility

### Touch Targets
All interactive elements meet minimum touch target size:
- Buttons: minimum 44px height
- Checkboxes: visible and easily tappable
- Links: adequate padding

### Visual Indicators
- Active states clearly marked with color
- Hover states on desktop
- Focus states for keyboard navigation
- Sufficient color contrast ratios

### Semantic HTML
- Proper heading hierarchy
- Descriptive button labels
- ARIA labels where appropriate

---

## Testing

See `docs/PHASE_0_SECTION_2_TESTING.md` for comprehensive testing procedures.

### Quick Test
```bash
# Build project
npm run build

# Start dev server
npm run dev

# Open in browser
open http://localhost:5173
```

---

## Known Issues and Limitations

1. **Quarter Period:** Backend currently processes "quarter" as "year" due to API implementation. This is expected behavior.

2. **Backend Required:** Components require the Cloudflare Workers backend to be running to display real data.

3. **No Mock Data:** The application no longer uses mock data. Real backend is required for testing.

---

## Future Enhancements

Potential improvements for future iterations:

1. **Custom Date Ranges:** Allow users to select custom start/end dates
2. **Quarter Implementation:** Proper quarter calculation in backend
3. **Chart Types:** Add pie charts, line charts, etc.
4. **Export:** Export visualizations as images
5. **Animations:** Smooth transitions when data changes
6. **Comparison:** Compare periods side-by-side

---

## Maintenance Notes

### Dependencies
- React 18.2.0
- TailwindCSS 3.3.6
- No additional chart libraries required

### Performance
- All components are functional components with hooks
- Efficient re-rendering with proper dependency arrays
- No expensive calculations in render loops

### Code Style
- Consistent with existing codebase
- TailwindCSS utility classes
- PropTypes not used (TypeScript migration potential)
- Clear component naming and organization
