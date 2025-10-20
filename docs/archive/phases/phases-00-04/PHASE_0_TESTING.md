# Phase 0: Table Interactions - Testing Guide

## Overview
This document describes the testing procedures for Phase 0, Section 1: Table Interactions improvements.

## Features to Test

### 1. Search Functionality
**Location:** Transactions page > Filtros > Buscar field

**Test Cases:**
- [ ] Enter text in the search field
- [ ] Verify transactions are filtered by description
- [ ] Verify search is case-insensitive
- [ ] Clear search and verify all transactions return

### 2. Column Sorting
**Location:** Transaction table > Column headers

**Test Cases:**
- [ ] Click "Fecha" header - verify transactions sort by date
- [ ] Click again - verify sort order reverses (ASC/DESC)
- [ ] Click "Descripción" header - verify alphabetical sort
- [ ] Click "Monto" header - verify numerical sort
- [ ] Verify sort icon changes (↑/↓)

### 3. Type Filter
**Location:** Transactions page > Filtros > Tipo dropdown

**Test Cases:**
- [ ] Select "Ingreso" - verify only income transactions shown
- [ ] Select "Gasto" - verify only expense transactions shown
- [ ] Select "Todos" - verify all transactions shown

### 4. Account Filter
**Location:** Transactions page > Filtros > Cuenta dropdown

**Test Cases:**
- [ ] Select a specific account
- [ ] Verify only transactions for that account are shown
- [ ] Select "Todas" - verify all accounts shown

### 5. Date Range Filter
**Location:** Transactions page > Filtros > Desde/Hasta fields

**Test Cases:**
- [ ] Set "Desde" date - verify only transactions after date shown
- [ ] Set "Hasta" date - verify only transactions before date shown
- [ ] Set both - verify transactions within range shown
- [ ] Clear dates - verify all transactions return

### 6. Category Filter
**Location:** Transactions page > Top buttons (Todas/Personal/Avanta)

**Test Cases:**
- [ ] Click "Personal" - verify personal transactions only
- [ ] Click "Avanta" - verify business transactions only
- [ ] Click "Todas" - verify all categories shown

### 7. Clear Filters
**Location:** Transactions page > Filtros > "Limpiar filtros" button

**Test Cases:**
- [ ] Apply multiple filters
- [ ] Verify "Limpiar filtros" button appears
- [ ] Click button
- [ ] Verify all filters reset to default

### 8. Statistics Display
**Location:** Transactions page > Statistics cards

**Test Cases:**
- [ ] Verify "Total Transacciones" shows correct count
- [ ] Verify "Ingresos" shows sum of income (green text)
- [ ] Verify "Gastos" shows sum of expenses (red text)
- [ ] Verify "Neto" shows income - expenses
- [ ] Apply filters and verify statistics update accordingly

### 9. Bulk Selection
**Location:** Transaction table > Checkbox column

**Test Cases:**
- [ ] Click header checkbox - verify all rows selected
- [ ] Click header checkbox again - verify all deselected
- [ ] Select individual rows - verify checkboxes work
- [ ] Verify bulk actions bar appears when rows selected

### 10. Bulk Category Change
**Location:** Transaction table > Bulk actions bar

**Test Cases:**
- [ ] Select multiple transactions
- [ ] Click "→ Personal" button
- [ ] Verify all selected transactions change to Personal category
- [ ] Select transactions again
- [ ] Click "→ Avanta" button
- [ ] Verify all selected transactions change to Avanta category

### 11. Bulk Delete
**Location:** Transaction table > Bulk actions bar

**Test Cases:**
- [ ] Select multiple transactions
- [ ] Click "Eliminar" button
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify selected transactions are deleted
- [ ] Verify transaction list refreshes

### 12. Inline Editing
**Location:** Transaction table > Edit icon (✏️) for each row

**Test Cases:**
- [ ] Click edit icon on a transaction
- [ ] Verify row switches to edit mode with input fields
- [ ] Change date field
- [ ] Change description field
- [ ] Change type dropdown
- [ ] Change category dropdown
- [ ] Change amount field
- [ ] Toggle deducible checkbox
- [ ] Click save (✓) button
- [ ] Verify transaction updates
- [ ] Verify table refreshes

### 13. Cancel Inline Edit
**Location:** Transaction table > Cancel icon (✕) in edit mode

**Test Cases:**
- [ ] Click edit icon on a transaction
- [ ] Make changes to fields
- [ ] Click cancel (✕) button
- [ ] Verify changes are discarded
- [ ] Verify row returns to view mode

### 14. Single Transaction Delete
**Location:** Transaction table > Delete icon (🗑️) for each row

**Test Cases:**
- [ ] Click delete icon on a transaction
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify transaction is deleted
- [ ] Verify table refreshes

### 15. Color Coding
**Location:** Transaction table > Monto column

**Test Cases:**
- [ ] Verify income amounts are green
- [ ] Verify expense amounts are red
- [ ] Verify type badges have appropriate colors

### 16. Row Selection Highlighting
**Location:** Transaction table

**Test Cases:**
- [ ] Select a row with checkbox
- [ ] Verify row background changes to blue
- [ ] Deselect row
- [ ] Verify row background returns to white
- [ ] Hover over row
- [ ] Verify hover state (gray background)

## Integration Testing

### Combined Filters Test
- [ ] Apply search filter
- [ ] Add type filter
- [ ] Add date range
- [ ] Verify all filters work together
- [ ] Verify statistics reflect filtered data
- [ ] Clear all filters at once

### Edit After Filter Test
- [ ] Apply filters to narrow results
- [ ] Edit a transaction
- [ ] Verify transaction updates
- [ ] Verify filters still applied after update

### Sort After Filter Test
- [ ] Apply filters
- [ ] Click column header to sort
- [ ] Verify sorted results respect filters

## Performance Testing

### Large Dataset Test
- [ ] Load page with 100+ transactions
- [ ] Test search responsiveness
- [ ] Test sorting speed
- [ ] Test filter application speed

### Bulk Operations Test
- [ ] Select all transactions (50+)
- [ ] Test bulk category change performance
- [ ] Test bulk delete performance

## Error Handling

### API Errors
- [ ] Simulate API error during load
- [ ] Verify error message displays
- [ ] Simulate API error during update
- [ ] Verify error alert shows

### Validation
- [ ] Try to save edit with invalid amount
- [ ] Try to save edit with empty description
- [ ] Verify validation feedback

## Browser Compatibility
- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test responsive design on mobile

## Notes
- All tests should be performed with the backend running (Cloudflare Workers + D1)
- Use sample data from `seed.sql` for consistent testing
- Document any bugs or issues found
