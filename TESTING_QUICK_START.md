# Testing Quick Start Guide

## 🚀 Get Started in 30 Seconds

```bash
# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests once (no watch mode)
npm run test:run

# Run with coverage report
npm run test:coverage
```

## 📊 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode (recommended for development) |
| `npm run test:run` | Run all tests once |
| `npm run test:ui` | Open interactive Vitest UI |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:api` | Run API tests only |
| `npm run test:components` | Run component tests only |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:all` | Run complete test suite |

## 🎯 What We're Testing

### API Tests (74 tests)
- Authentication (login, tokens, security)
- Transactions (CRUD, filtering, search)
- Dashboard (statistics, analytics)
- Health checks

### Component Tests (39 tests)
- TransactionForm (validation, submission, accessibility)
- More components to be added

### E2E Tests (20+ scenarios)
- User journeys (login → transactions → reports)
- Admin workflows
- Mobile responsiveness

## 📝 Writing Your First Test

### API Test Example
```javascript
// tests/api/example.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockEnv, mockDbSuccess } from '../utils/test-helpers.js';

describe('Example API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('should return data', async () => {
    env.DB.prepare = vi.fn(() => ({
      all: vi.fn().mockResolvedValue(mockDbSuccess([{ id: 1 }])),
    }));

    const result = await env.DB.prepare().all();
    expect(result.success).toBe(true);
  });
});
```

### Component Test Example
```javascript
// tests/components/Example.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExampleComponent from '@/components/ExampleComponent';

describe('ExampleComponent', () => {
  it('should render heading', () => {
    render(<ExampleComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

### E2E Test Example
```javascript
// tests/e2e/example.spec.js
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🛠️ Test Utilities Available

### Mock Data
```javascript
import { mockUsers, mockTransactions } from '@tests/fixtures/mock-data.js';

// Use pre-defined mock data
const user = mockUsers.regular;
const transactions = mockTransactions;
```

### Test Helpers
```javascript
import {
  createMockEnv,
  createAuthenticatedRequest,
  generateMockUser,
  generateMockTransaction,
} from '@tests/utils/test-helpers.js';

// Create mock environment
const env = createMockEnv();

// Create authenticated request
const request = createAuthenticatedRequest('/api/endpoint', 'user-123');

// Generate test data
const user = generateMockUser({ role: 'admin' });
const transaction = generateMockTransaction({ amount: 100.50 });
```

## 🐛 Debugging Tests

### Run Specific Test File
```bash
npm test -- tests/api/auth.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- -t "should login"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

### Use Vitest UI for Visual Debugging
```bash
npm run test:ui
# Opens browser with interactive test explorer
```

## 📊 Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

### View Coverage Report
```bash
# Open in browser
open coverage/index.html

# Or on Linux
xdg-open coverage/index.html
```

### Coverage Goals
- Overall: 80%+
- API Tests: 90%+
- Component Tests: 80%+
- Critical Paths: 100%

## ✅ Verification

### Verify Test Setup
```bash
./verify-phase-46.sh
```

This will check:
- ✓ Configuration files
- ✓ Test directories
- ✓ Test files
- ✓ Dependencies
- ✓ NPM scripts
- ✓ All tests passing

## 🎓 Best Practices

### DO ✅
- Write descriptive test names
- Test behavior, not implementation
- Use realistic test data
- Keep tests independent
- Clean up after tests
- Test both success and failure scenarios

### DON'T ❌
- Test implementation details
- Create test dependencies
- Use production data
- Skip cleanup
- Write flaky tests
- Test third-party code

## 📚 Documentation

### Full Documentation
- **Test README**: `tests/README.md` (8,000 words)
- **Testing Strategy**: `docs/TESTING_STRATEGY.md` (10,000 words)
- **Phase 46 Summary**: `PHASE_46_SUMMARY.md` (13,000 words)

### Quick Links
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)

## 🆘 Need Help?

### Common Issues

**Tests not found?**
```bash
npm install  # Reinstall dependencies
```

**Import errors?**
```bash
# Check path aliases in vitest.config.js
```

**E2E tests failing?**
```bash
# Install Playwright browsers
npx playwright install
```

**Coverage too low?**
```bash
# Check coverage/index.html for uncovered code
npm run test:coverage
open coverage/index.html
```

## 🎯 Current Status

### Test Statistics
- ✅ Total Tests: 113
- ✅ Pass Rate: 100%
- ✅ Execution Time: ~2.4s
- ✅ Files: 5 test suites

### Coverage
- API Tests: 74 tests (4 files)
- Component Tests: 39 tests (1 file)
- E2E Tests: 20+ scenarios (1 file)

## 🚀 Next Steps

1. **Add More Tests**
   - Cover remaining 67 API endpoints
   - Add tests for more components
   - Expand E2E scenarios

2. **Improve Coverage**
   - Aim for 80%+ overall
   - Focus on critical paths
   - Add edge case tests

3. **Performance Testing**
   - Set up k6 for load testing
   - Add performance benchmarks
   - Monitor response times

4. **Security Testing**
   - Enhance security test suite
   - Add penetration testing
   - Regular vulnerability scans

## 💡 Pro Tips

### Speed Up Tests
```bash
# Run in parallel (default)
npm test

# Run specific suite
npm run test:api

# Skip E2E for faster feedback
npm run test:run
```

### Watch Mode
```bash
# Auto-run tests on file changes
npm test

# Watch specific files
npm test -- tests/api/auth.test.js --watch
```

### Test-Driven Development (TDD)
1. Write test first (it will fail)
2. Write minimal code to pass
3. Refactor with confidence
4. Repeat

---

**Last Updated:** October 2025  
**Status:** ✅ Production Ready  
**Questions?** Check `tests/README.md` or `docs/TESTING_STRATEGY.md`

🎉 **Happy Testing!**
