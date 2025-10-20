# Phase 32B: UI State Consistency Guide

## Overview

Phase 32B standardizes UI state handling across all components to ensure consistent and predictable user experience. This guide provides patterns and components for implementing consistent loading, error, and empty states.

## Reusable State Components

Three new components have been created for consistent state handling:

### 1. LoadingState Component

Located: `src/components/common/LoadingState.jsx`

**Usage:**
```jsx
import LoadingState from '../components/common/LoadingState';

if (loading) {
  return <LoadingState message="Cargando transacciones..." />;
}
```

**Props:**
- `message` (string): Loading message to display (default: "Cargando...")
- `size` (string): Spinner size - 'small', 'medium', 'large' (default: 'medium')

### 2. ErrorState Component

Located: `src/components/common/ErrorState.jsx`

**Usage:**
```jsx
import ErrorState from '../components/common/ErrorState';

if (error) {
  return (
    <ErrorState 
      error={error}
      title="Error al cargar datos"
      onRetry={loadData}
      retryText="Intentar nuevamente"
    />
  );
}
```

**Props:**
- `error` (string | Error): Error message or Error object
- `title` (string): Error title (default: "Error")
- `onRetry` (function): Optional retry callback
- `retryText` (string): Retry button text (default: "Reintentar")

### 3. EmptyState Component

Located: `src/components/common/EmptyState.jsx`

**Usage:**
```jsx
import EmptyState from '../components/common/EmptyState';

if (!data || data.length === 0) {
  return (
    <EmptyState 
      title="No hay transacciones"
      message="Aún no has registrado ninguna transacción"
      actionText="Crear primera transacción"
      onAction={() => setShowModal(true)}
    />
  );
}
```

**Props:**
- `icon` (React component): Custom icon (optional)
- `title` (string): Empty state title (default: "No hay datos")
- `message` (string): Empty state message (default: "No se encontraron elementos")
- `actionText` (string): Action button text (optional)
- `onAction` (function): Action button callback (optional)

## Standard Component Pattern

### Complete Example

```jsx
import { useState, useEffect } from 'react';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { fetchData } from '../utils/api';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Load data function with proper error handling
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };
  
  // 1. LOADING STATE
  if (loading) {
    return <LoadingState message="Cargando datos..." />;
  }
  
  // 2. ERROR STATE
  if (error) {
    return (
      <ErrorState 
        error={error}
        title="Error al cargar datos"
        onRetry={loadData}
      />
    );
  }
  
  // 3. EMPTY STATE
  if (!data || data.length === 0) {
    return (
      <EmptyState 
        title="No hay datos"
        message="Aún no hay elementos para mostrar"
        actionText="Agregar nuevo"
        onAction={handleAdd}
      />
    );
  }
  
  // 4. SUCCESS STATE - Render data
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Migration Checklist

### For Each Component:

- [ ] **Import State Components**
  ```jsx
  import LoadingState from '../components/common/LoadingState';
  import ErrorState from '../components/common/ErrorState';
  import EmptyState from '../components/common/EmptyState';
  ```

- [ ] **Add State Management**
  ```jsx
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  ```

- [ ] **Implement Loading State**
  ```jsx
  if (loading) return <LoadingState message="..." />;
  ```

- [ ] **Implement Error State**
  ```jsx
  if (error) return <ErrorState error={error} onRetry={loadData} />;
  ```

- [ ] **Implement Empty State**
  ```jsx
  if (!data || data.length === 0) {
    return <EmptyState title="..." message="..." />;
  }
  ```

- [ ] **Add Retry Logic**
  - Ensure retry function resets error state
  - Show loading indicator during retry
  - Handle retry errors gracefully

- [ ] **Test All States**
  - [ ] Test loading state appears on initial load
  - [ ] Test error state with failed API calls
  - [ ] Test empty state with no data
  - [ ] Test retry mechanism
  - [ ] Test success state with data

## Components to Audit

### High Priority (Data-Heavy Components)

1. ✅ `src/components/ReceiptProcessor.jsx` - Already has loading/error states
2. ⏳ `src/components/AccountManager.jsx` - Has loading, needs empty state
3. ⏳ `src/components/TransactionList.jsx` - Needs review
4. ⏳ `src/components/InvoiceList.jsx` - Needs review
5. ⏳ `src/components/BudgetManager.jsx` - Needs review
6. ⏳ `src/pages/Dashboard.jsx` - Needs review
7. ⏳ `src/pages/Reports.jsx` - Needs review

### Medium Priority

8. ⏳ All components in `src/components/` that fetch data
9. ⏳ All pages in `src/pages/` that load data

### Low Priority

10. ⏳ Components with static data or minimal data fetching

## Best Practices

### 1. Always Handle Loading State

```jsx
// ❌ Bad - No loading indicator
const [data, setData] = useState([]);
useEffect(() => { fetchData().then(setData); }, []);

// ✅ Good - Clear loading state
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { 
  loadData(); 
}, []);
```

### 2. Always Handle Errors

```jsx
// ❌ Bad - Silent error
try {
  const data = await fetchData();
  setData(data);
} catch (err) {
  console.error(err);
}

// ✅ Good - User-visible error
try {
  setLoading(true);
  const data = await fetchData();
  setData(data);
  setError(null);
} catch (err) {
  console.error(err);
  setError(err.message);
} finally {
  setLoading(false);
}
```

### 3. Always Handle Empty State

```jsx
// ❌ Bad - Blank screen with no data
return (
  <div>
    {data.map(item => <Item key={item.id} {...item} />)}
  </div>
);

// ✅ Good - Helpful empty state
if (!data || data.length === 0) {
  return <EmptyState title="No items" />;
}

return (
  <div>
    {data.map(item => <Item key={item.id} {...item} />)}
  </div>
);
```

### 4. Provide Retry Mechanisms

```jsx
// ❌ Bad - User stuck on error
if (error) {
  return <div>Error: {error}</div>;
}

// ✅ Good - User can retry
if (error) {
  return <ErrorState error={error} onRetry={loadData} />;
}
```

### 5. Use Consistent Messaging

```jsx
// ❌ Bad - Technical jargon
<LoadingState message="Fetching data from API..." />
<ErrorState error="HTTP 500 Internal Server Error" />

// ✅ Good - User-friendly messages
<LoadingState message="Cargando transacciones..." />
<ErrorState error="No se pudieron cargar las transacciones" />
```

## Testing Guide

### Manual Testing

1. **Loading State Test**
   - Open DevTools Network tab
   - Throttle network to "Slow 3G"
   - Navigate to component
   - Verify loading spinner appears
   - Verify loading message is clear

2. **Error State Test**
   - Open DevTools Network tab
   - Block all network requests
   - Navigate to component
   - Verify error message appears
   - Verify retry button works
   - Verify error is user-friendly

3. **Empty State Test**
   - Create fresh database or clear data
   - Navigate to component
   - Verify empty state message appears
   - Verify action button (if applicable)
   - Verify message is helpful

4. **Success State Test**
   - Ensure data is available
   - Navigate to component
   - Verify data renders correctly
   - Verify no loading/error/empty states show

### Automated Testing (Future)

```jsx
describe('MyComponent', () => {
  it('shows loading state initially', () => {
    render(<MyComponent />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });
  
  it('shows error state on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
  
  it('shows empty state when no data', async () => {
    mockFetch.mockResolvedValue([]);
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
    });
  });
  
  it('shows data when available', async () => {
    mockFetch.mockResolvedValue([{ id: 1, name: 'Test' }]);
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

## Common Patterns

### Pattern 1: List Component

```jsx
function ListComponent() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  if (loading) return <LoadingState message="Cargando lista..." />;
  if (error) return <ErrorState error={error} onRetry={loadItems} />;
  if (!items || items.length === 0) {
    return <EmptyState 
      title="Lista vacía" 
      actionText="Agregar elemento"
      onAction={handleAdd}
    />;
  }
  
  return <div>{/* Render items */}</div>;
}
```

### Pattern 2: Detail Component

```jsx
function DetailComponent({ id }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  if (loading) return <LoadingState message="Cargando detalles..." />;
  if (error) return <ErrorState error={error} onRetry={loadItem} />;
  if (!item) return <ErrorState error="Elemento no encontrado" />;
  
  return <div>{/* Render item details */}</div>;
}
```

### Pattern 3: Dashboard Component

```jsx
function DashboardComponent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  if (loading) return <LoadingState message="Cargando estadísticas..." />;
  if (error) return <ErrorState error={error} onRetry={loadStats} />;
  
  return (
    <div>
      {/* Multiple widgets, each handles its own empty state */}
      {stats.transactions.length === 0 ? (
        <EmptyState title="No hay transacciones" />
      ) : (
        <TransactionWidget data={stats.transactions} />
      )}
    </div>
  );
}
```

## Results & Benefits

After implementing Phase 32B across all components:

✅ **Consistent UX**: Users see the same loading, error, and empty states everywhere
✅ **Better Error Handling**: Users can retry failed operations
✅ **Reduced Confusion**: Clear messages when data is not available
✅ **Improved Perceived Performance**: Loading states show the system is working
✅ **Easier Maintenance**: Reusable components reduce code duplication
✅ **Better Testing**: Standardized patterns are easier to test

## Next Steps

1. Review and update components from the checklist above
2. Test each component in all states (loading, error, empty, success)
3. Gather user feedback on error messages
4. Consider adding loading skeletons for better perceived performance
5. Add automated tests for state transitions
