# Testing Documentation - Avanta Finance

## Overview

This directory contains comprehensive integration tests, component tests, and end-to-end tests for the Avanta Finance application.

## Test Structure

```
tests/
├── api/                    # API integration tests
│   ├── auth.test.js
│   └── transactions.test.js
├── components/             # React component tests
│   └── TransactionForm.test.jsx
├── e2e/                   # End-to-end tests
│   └── user-journey.spec.js
├── fixtures/              # Test data fixtures
│   └── mock-data.js
├── utils/                 # Test utilities
│   └── test-helpers.js
├── setup.js              # Test setup configuration
└── README.md             # This file
```

## Running Tests

### All Tests
```bash
npm test                  # Run all tests in watch mode
npm run test:run          # Run all tests once
npm run test:coverage     # Run tests with coverage report
```

### Specific Test Suites
```bash
npm run test:api          # Run API integration tests
npm run test:components   # Run component tests
npm run test:e2e          # Run end-to-end tests
```

### Test UI
```bash
npm run test:ui           # Open Vitest UI
npm run test:e2e:ui       # Open Playwright UI
```

### Coverage Reports
```bash
npm run test:coverage     # Generate coverage report
# Reports are generated in ./coverage/
```

## Test Categories

### 1. API Integration Tests (`tests/api/`)

Tests for Cloudflare Workers API endpoints.

**Coverage:**
- Authentication (login, token validation, session management)
- Transactions (CRUD operations, filtering, search)
- Fiscal calculations
- Compliance monitoring
- Admin operations

**Example:**
```javascript
describe('Authentication API', () => {
  it('should successfully login with valid credentials', async () => {
    // Test implementation
  });
});
```

### 2. Component Tests (`tests/components/`)

Tests for React components using React Testing Library.

**Coverage:**
- Form components (validation, submission)
- Display components (rendering, data display)
- Interactive components (user interactions)
- Error boundaries
- Accessibility

**Example:**
```javascript
describe('TransactionForm Component', () => {
  it('should render all form fields', () => {
    // Test implementation
  });
});
```

### 3. End-to-End Tests (`tests/e2e/`)

Tests for complete user workflows using Playwright.

**Coverage:**
- User authentication flow
- Transaction management workflow
- Invoice reconciliation
- Tax calculations
- Admin functions
- Cross-browser compatibility

**Example:**
```javascript
test('should complete login flow', async ({ page }) => {
  // Test implementation
});
```

## Test Data

### Mock Data (`tests/fixtures/mock-data.js`)

Realistic test data for various entities:
- Users (regular, admin, inactive)
- Transactions
- Accounts
- Categories
- Invoices
- Budgets
- Tax calculations

### Test Helpers (`tests/utils/test-helpers.js`)

Utility functions for testing:
- `createMockEnv()` - Create mock Cloudflare environment
- `createMockRequest()` - Create mock HTTP request
- `createAuthenticatedRequest()` - Create authenticated request
- `generateMockUser()` - Generate user test data
- `generateMockTransaction()` - Generate transaction test data
- `mockDbSuccess()` - Mock successful database response
- `mockDbError()` - Mock database error

## Writing Tests

### Best Practices

1. **Test Naming**
   - Use descriptive test names that explain what is being tested
   - Follow the pattern: "should [expected behavior] when [condition]"

2. **Test Organization**
   - Group related tests using `describe()` blocks
   - Use `beforeEach()` for common setup
   - Clean up after tests in `afterEach()`

3. **Assertions**
   - Make assertions specific and meaningful
   - Test both success and failure scenarios
   - Include edge cases

4. **Mocking**
   - Mock external dependencies (database, APIs)
   - Use realistic mock data
   - Don't mock what you're testing

5. **Isolation**
   - Each test should be independent
   - Tests should not depend on execution order
   - Clean up test data after each test

### Example Test Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockEnv, mockDbSuccess } from '../utils/test-helpers.js';

describe('Feature Name', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe('Specific Functionality', () => {
    it('should perform expected action', async () => {
      // Arrange: Set up test data and mocks
      const mockData = { id: 1, name: 'Test' };
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(mockData),
        })),
      }));

      // Act: Execute the code being tested
      const result = await env.DB.prepare().bind().first();

      // Assert: Verify the results
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test');
    });

    it('should handle error scenario', async () => {
      // Test error handling
    });
  });
});
```

## Testing Configuration

### Vitest Configuration (`vitest.config.js`)

- **Environment:** jsdom (for DOM testing)
- **Coverage:** v8 provider with 80% threshold
- **Timeout:** 10 seconds per test
- **Retry:** 1 retry for flaky tests

### Playwright Configuration (`playwright.config.js`)

- **Browsers:** Chromium, Firefox, WebKit
- **Mobile:** Chrome Mobile, Safari Mobile
- **Base URL:** http://localhost:5173
- **Retries:** 2 on CI, 0 locally
- **Reporter:** HTML, JSON, List

## Continuous Integration

Tests are automatically run on:
- Every pull request
- Every push to main branch
- Pre-deployment checks

### GitHub Actions Workflow

```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:run
    npm run test:coverage
```

## Coverage Goals

- **Overall:** 80%+ coverage
- **API Tests:** 90%+ coverage
- **Component Tests:** 80%+ coverage
- **E2E Tests:** 100% critical paths covered

### Viewing Coverage

```bash
npm run test:coverage
# Open ./coverage/index.html in browser
```

## Troubleshooting

### Common Issues

**1. Tests failing locally but passing in CI**
- Ensure you're using the same Node version as CI
- Clear node_modules and reinstall dependencies
- Check for environment-specific issues

**2. Flaky E2E tests**
- Increase timeout values
- Add explicit waits for elements
- Use stable selectors (data-testid)

**3. Mock data not matching real data**
- Update mock data when API changes
- Keep fixtures in sync with schema

**4. Coverage thresholds not met**
- Identify uncovered code with coverage report
- Add tests for uncovered branches
- Review exclusions in vitest.config.js

### Debug Mode

```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run specific test file
npm test -- tests/api/auth.test.js

# Run tests matching pattern
npm test -- -t "authentication"
```

## Performance Testing

Performance tests are separate from unit/integration tests:

```bash
# Run performance tests (to be implemented)
npm run test:performance
```

## Security Testing

Security tests verify:
- SQL injection prevention
- XSS prevention
- CSRF protection
- Authentication edge cases
- Authorization checks

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Maintain coverage** above 80%
3. **Update documentation** if test patterns change
4. **Run full test suite** before submitting PR

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For testing questions or issues:
- Check this README first
- Review existing test files for examples
- Ask in team chat or create an issue

---

**Last Updated:** October 2025
**Maintained By:** Development Team
