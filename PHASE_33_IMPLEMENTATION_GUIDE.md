# Phase 33 Implementation Guide: Data Foundations and Initial Improvements

This guide provides detailed technical information for developers working with the Phase 33 features.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend API Reference](#backend-api-reference)
4. [Frontend Components](#frontend-components)
5. [Integration Examples](#integration-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 33 introduces two key features:

1. **Account Opening Dates** - Track when accounts were opened
2. **Initial Balance Management** - Manage historical balance snapshots

### Key Design Decisions

- **Date Format:** ISO 8601 (YYYY-MM-DD) stored as TEXT
- **Monetary Values:** INTEGER cents (Phase 30 standard)
- **Unique Constraint:** One initial balance per account per date
- **Cascading Delete:** Initial balances deleted when account is deleted
- **Optional Fields:** All Phase 33 fields are optional for backward compatibility

---

## Database Schema

### Accounts Table Update

```sql
ALTER TABLE accounts ADD COLUMN opening_date TEXT;
```

**Purpose:** Track when an account was opened  
**Format:** ISO 8601 date string (YYYY-MM-DD)  
**Example:** `'2024-01-15'`  
**Nullable:** Yes (backward compatible)

### Account Initial Balances Table

```sql
CREATE TABLE IF NOT EXISTS account_initial_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    balance_date TEXT NOT NULL,
    initial_balance INTEGER NOT NULL,  -- cents
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE(account_id, balance_date)
);
```

**Purpose:** Store historical initial balance snapshots  
**Key Features:**
- Stores balance in cents (INTEGER) for precision
- One balance per account per date (UNIQUE constraint)
- Automatically deleted when account is deleted (CASCADE)
- Optional notes field for context

### Indexes

```sql
CREATE INDEX idx_account_initial_balances_account_date 
ON account_initial_balances(account_id, balance_date DESC);

CREATE INDEX idx_accounts_opening_date 
ON accounts(opening_date);
```

**Purpose:** Optimize common queries  
**Performance Impact:** Faster lookups and date-based filtering

---

## Backend API Reference

### Base URL Structure

```
/api/accounts/:accountId/initial-balances[/:balanceId]
```

### Authentication

All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### 1. List Initial Balances

**Endpoint:** `GET /api/accounts/:accountId/initial-balances`

**Description:** Retrieve all initial balances for a specific account

**URL Parameters:**
- `accountId` (required) - The account ID

**Response:**
```json
[
  {
    "id": 1,
    "account_id": 123,
    "balance_date": "2024-01-01",
    "initial_balance": 5000.00,
    "notes": "Opening balance from bank statement",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (no token or invalid token)
- `404` - Account not found

---

#### 2. Create Initial Balance

**Endpoint:** `POST /api/accounts/:accountId/initial-balances`

**Description:** Create a new initial balance for an account

**URL Parameters:**
- `accountId` (required) - The account ID

**Request Body:**
```json
{
  "balance_date": "2024-01-01",
  "initial_balance": 5000.00,
  "notes": "Opening balance from bank statement"
}
```

**Field Validations:**
- `balance_date` (required) - Must be valid YYYY-MM-DD format
- `initial_balance` (required) - Must be a valid number
- `notes` (optional) - String, sanitized for security

**Response:**
```json
{
  "success": true,
  "message": "Initial balance created successfully",
  "id": 1
}
```

**Status Codes:**
- `201` - Created successfully
- `400` - Validation error (invalid date, missing fields)
- `401` - Unauthorized
- `404` - Account not found
- `409` - Duplicate (balance already exists for this date)
- `429` - Rate limit exceeded

**Error Response Example:**
```json
{
  "error": "Initial balance already exists for this date",
  "code": "DUPLICATE_ERROR"
}
```

---

#### 3. Update Initial Balance

**Endpoint:** `PUT /api/accounts/:accountId/initial-balances/:balanceId`

**Description:** Update an existing initial balance

**URL Parameters:**
- `accountId` (required) - The account ID
- `balanceId` (required) - The balance ID

**Request Body:**
```json
{
  "balance_date": "2024-01-15",
  "initial_balance": 5500.00,
  "notes": "Updated from corrected statement"
}
```

**Notes:**
- All fields are optional (only send what you want to update)
- `balance_date` changes must not conflict with existing dates

**Response:**
```json
{
  "success": true,
  "message": "Initial balance updated successfully"
}
```

**Status Codes:**
- `200` - Updated successfully
- `400` - Validation error
- `401` - Unauthorized
- `404` - Account or balance not found

---

#### 4. Delete Initial Balance

**Endpoint:** `DELETE /api/accounts/:accountId/initial-balances/:balanceId`

**Description:** Delete an initial balance

**URL Parameters:**
- `accountId` (required) - The account ID
- `balanceId` (required) - The balance ID

**Response:**
```json
{
  "success": true,
  "message": "Initial balance deleted successfully"
}
```

**Status Codes:**
- `200` - Deleted successfully
- `401` - Unauthorized
- `404` - Account or balance not found

---

### Account API Updates

The existing `/api/accounts` endpoints now support `opening_date`:

#### Create Account with Opening Date

```javascript
POST /api/accounts
{
  "name": "Business Checking",
  "type": "checking",
  "balance": 10000.00,
  "opening_date": "2024-01-01"  // Optional
}
```

#### Update Account Opening Date

```javascript
PUT /api/accounts/:id
{
  "opening_date": "2024-01-01"  // Optional
}
```

---

## Frontend Components

### AccountManager Component

**Location:** `src/components/AccountManager.jsx`

**New Features:**
- Opening date input field in create/edit form
- Display opening date under account name in list
- "Saldos" button to manage initial balances
- Modal for initial balance management

**Usage:**
```jsx
import AccountManager from '../components/AccountManager';

function AccountsPage() {
  return (
    <div>
      <h1>Cuentas</h1>
      <AccountManager />
    </div>
  );
}
```

**Form Data Structure:**
```javascript
{
  name: 'Business Checking',
  type: 'checking',
  balance: 10000.00,
  opening_date: '2024-01-01'  // Optional
}
```

---

### InitialBalanceManager Component

**Location:** `src/components/InitialBalanceManager.jsx`

**Props:**
- `accountId` (required) - The account ID to manage balances for
- `accountName` (required) - The account name for display

**Usage:**
```jsx
import InitialBalanceManager from '../components/InitialBalanceManager';

function MyComponent() {
  return (
    <InitialBalanceManager 
      accountId={123}
      accountName="Business Checking"
    />
  );
}
```

**Features:**
- List all initial balances for an account
- Create new initial balance
- Edit existing initial balance
- Delete initial balance
- Loading and error states
- Responsive design
- Dark mode support

---

### API Utilities

**Location:** `src/utils/api.js`

**Functions:**

```javascript
// Fetch all initial balances for an account
const balances = await fetchAccountInitialBalances(accountId);

// Create new initial balance
const result = await createAccountInitialBalance(accountId, {
  balance_date: '2024-01-01',
  initial_balance: 5000.00,
  notes: 'Opening balance'
});

// Update initial balance
await updateAccountInitialBalance(accountId, balanceId, {
  initial_balance: 5500.00
});

// Delete initial balance
await deleteAccountInitialBalance(accountId, balanceId);
```

---

## Integration Examples

### Example 1: Create Account with Opening Date

```javascript
import { createAccount } from '../utils/api';

async function createBusinessAccount() {
  try {
    const account = await createAccount({
      name: 'Business Checking',
      type: 'checking',
      balance: 10000.00,
      opening_date: '2024-01-01'
    });
    
    console.log('Account created:', account);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 2: Add Initial Balance After Account Creation

```javascript
import { createAccount, createAccountInitialBalance } from '../utils/api';

async function setupAccountWithHistory() {
  // Create account
  const account = await createAccount({
    name: 'Business Checking',
    type: 'checking',
    balance: 15000.00,
    opening_date: '2024-01-01'
  });
  
  // Add initial balance for historical reference
  await createAccountInitialBalance(account.id, {
    balance_date: '2024-01-01',
    initial_balance: 10000.00,
    notes: 'Opening balance from bank statement'
  });
  
  // Could add more historical balances
  await createAccountInitialBalance(account.id, {
    balance_date: '2024-06-01',
    initial_balance: 12500.00,
    notes: 'Mid-year balance snapshot'
  });
}
```

### Example 3: Calculate Account Age

```javascript
function calculateAccountAge(openingDate) {
  if (!openingDate) return null;
  
  const opened = new Date(openingDate);
  const now = new Date();
  const ageInMs = now - opened;
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  const ageInYears = (ageInDays / 365).toFixed(1);
  
  return {
    days: ageInDays,
    years: ageInYears
  };
}

// Usage
const account = { opening_date: '2024-01-01' };
const age = calculateAccountAge(account.opening_date);
console.log(`Account is ${age.years} years old`);
```

---

## Best Practices

### 1. Date Handling

**Always use ISO 8601 format:**
```javascript
// ✅ Good
const date = '2024-01-15';

// ❌ Bad
const date = '1/15/2024';
const date = '15-01-2024';
```

**Validate dates before sending:**
```javascript
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
```

### 2. Monetary Values

**Remember values are stored as cents:**
```javascript
// Backend stores as INTEGER cents
const balanceInCents = 500000;  // $5,000.00

// Frontend displays as decimal
const balanceDisplay = fromCents(balanceInCents);  // 5000.00
```

### 3. Error Handling

**Always handle API errors:**
```javascript
try {
  await createAccountInitialBalance(accountId, data);
  showSuccess('Balance created successfully');
} catch (error) {
  if (error.message.includes('already exists')) {
    showError('A balance already exists for this date');
  } else {
    showError(error.message);
  }
}
```

### 4. User Experience

**Provide feedback for async operations:**
```javascript
const [loading, setLoading] = useState(false);

async function handleSubmit(data) {
  setLoading(true);
  try {
    await createAccountInitialBalance(accountId, data);
    showSuccess('Balance created');
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Duplicate Balance Error

**Problem:** Getting 409 error when creating initial balance

**Cause:** An initial balance already exists for that date

**Solution:**
```javascript
// Check existing balances first
const existing = await fetchAccountInitialBalances(accountId);
const dateExists = existing.some(b => b.balance_date === newDate);

if (dateExists) {
  // Update instead of create
  const existingBalance = existing.find(b => b.balance_date === newDate);
  await updateAccountInitialBalance(accountId, existingBalance.id, data);
} else {
  await createAccountInitialBalance(accountId, data);
}
```

#### 2. Invalid Date Format

**Problem:** Validation error on date

**Cause:** Date not in YYYY-MM-DD format

**Solution:**
```javascript
// Convert date input to proper format
function formatDate(dateInput) {
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];  // Returns YYYY-MM-DD
}
```

#### 3. Account Not Found

**Problem:** 404 error when accessing initial balances

**Cause:** Account doesn't exist or doesn't belong to user

**Solution:**
```javascript
// Verify account exists first
async function safeGetBalances(accountId) {
  try {
    const accounts = await fetchAccounts();
    const accountExists = accounts.some(a => a.id === accountId);
    
    if (!accountExists) {
      throw new Error('Account not found');
    }
    
    return await fetchAccountInitialBalances(accountId);
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Create account without opening_date (should work)
- [ ] Create account with opening_date
- [ ] Update account opening_date
- [ ] Create initial balance
- [ ] Try to create duplicate initial balance (should fail with 409)
- [ ] Edit initial balance
- [ ] Delete initial balance
- [ ] Delete account (should cascade delete balances)
- [ ] Test with invalid date formats (should fail validation)
- [ ] Test with invalid monetary values (should fail validation)
- [ ] Test unauthorized access (should fail with 401)

### API Testing with cURL

```bash
# Get initial balances
curl -X GET "https://your-domain.com/api/accounts/123/initial-balances" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create initial balance
curl -X POST "https://your-domain.com/api/accounts/123/initial-balances" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "balance_date": "2024-01-01",
    "initial_balance": 5000.00,
    "notes": "Test balance"
  }'

# Update initial balance
curl -X PUT "https://your-domain.com/api/accounts/123/initial-balances/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "initial_balance": 5500.00
  }'

# Delete initial balance
curl -X DELETE "https://your-domain.com/api/accounts/123/initial-balances/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Additional Resources

- [Phase 30 Monetary Standards](PHASE_30_HARDENING_SUMMARY.md)
- [Phase 31 Security Patterns](PHASE_31_COMPLETION_SUMMARY.md)
- [API Error Handling](functions/utils/errors.js)
- [Input Validation](functions/utils/validation.js)

---

**Last Updated:** October 20, 2025  
**Phase:** 33 - Data Foundations and Initial Improvements
