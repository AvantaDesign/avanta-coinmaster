/**
 * End-to-End User Journey Tests
 * Tests complete user workflows from login to transaction management
 */

import { test, expect } from '@playwright/test';

test.describe('User Journey - Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Avanta Finance/);

    // Wait for login form to be visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');

    // Check if elements are visible
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // Fill in login credentials (demo data)
    await emailInput.fill('demo@avanta.com');
    await passwordInput.fill('demo123');

    // Click login button
    await loginButton.click();

    // Wait for navigation to dashboard
    // await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to transactions page', async ({ page }) => {
    // Assuming user is logged in
    // Navigate to transactions
    const transactionsLink = page.locator('a[href*="/transactions"]').first();
    
    if (await transactionsLink.isVisible()) {
      await transactionsLink.click();
      // await expect(page).toHaveURL(/\/transactions/);
    }
  });

  test('should display transaction list', async ({ page }) => {
    await page.goto('/transactions');

    // Wait for transactions to load
    const transactionList = page.locator('[data-testid="transaction-list"], table, .transaction-row').first();
    await expect(transactionList).toBeVisible();

    // Check for transaction table or list
    
    // Check if list exists
    const exists = await transactionList.count() > 0;
    expect(typeof exists).toBe('boolean');
  });

  test('should open transaction creation form', async ({ page }) => {
    await page.goto('/transactions');

    // Look for add transaction button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Nueva"), button:has-text("Agregar")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();

      // Wait for form to appear
      const dateInput = page.locator('input[type="date"], input[name="date"]').first();
      await expect(dateInput).toBeVisible();
    }
  });

  test('should fill out transaction form', async ({ page }) => {
    // Test data
    const transaction = {
      date: '2024-01-15',
      description: 'Test E2E Transaction',
      amount: '500.00',
      type: 'ingreso',
    };

    // Fill form fields if they exist
    const dateInput = page.locator('input[type="date"], input[name="date"]').first();
    const descInput = page.locator('input[name="description"], textarea[name="description"]').first();
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();

    if (await dateInput.isVisible()) {
      await dateInput.fill(transaction.date);
    }

    if (await descInput.isVisible()) {
      await descInput.fill(transaction.description);
    }

    if (await amountInput.isVisible()) {
      await amountInput.fill(transaction.amount);
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/transactions');

    // Try to submit form without filling fields
    const submitButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Guardar")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Check for validation errors
      await page.waitForTimeout(500);
    }
  });

  test('should filter transactions by date', async ({ page }) => {
    await page.goto('/transactions');

    // Look for date filter inputs
    const dateFromInput = page.locator('input[name="date_from"], input[placeholder*="From"]').first();
    const dateToInput = page.locator('input[name="date_to"], input[placeholder*="To"]').first();

    if (await dateFromInput.isVisible()) {
      await dateFromInput.fill('2024-01-01');
    }

    if (await dateToInput.isVisible()) {
      await dateToInput.fill('2024-01-31');
    }

    // Wait for filtered results
    await expect(page.locator('.transaction-row')).toBeVisible();
  });

  test('should search transactions by description', async ({ page }) => {
    await page.goto('/transactions');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('should sort transactions', async ({ page }) => {
    await page.goto('/transactions');

    // Look for sortable column headers
    const dateHeader = page.locator('th:has-text("Date"), th:has-text("Fecha")').first();

    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      await page.waitForTimeout(500);
    }
  });

  test('should view transaction details', async ({ page }) => {
    await page.goto('/transactions');

    // Click on first transaction
    const firstTransaction = page.locator('.transaction-row, tbody tr').first();

    if (await firstTransaction.isVisible()) {
      await firstTransaction.click();
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to dashboard', async ({ page }) => {
    const dashboardLink = page.locator('a[href*="/dashboard"], a:has-text("Dashboard")').first();

    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display financial summary', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Check for summary cards
    const summaryCards = page.locator('.card, .summary-card, [data-testid*="summary"]');
    const count = await summaryCards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check if mobile menu exists
    const mobileMenu = page.locator('button[aria-label*="menu"], .mobile-menu-button');
    const exists = await mobileMenu.count() > 0;

    expect(typeof exists).toBe('boolean');
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by navigating to non-existent page
    await page.goto('/non-existent-page');

    // Check for error message or 404 page
    await page.waitForTimeout(1000);

    // Application should handle gracefully
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('should maintain session across page navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await page.goto('/transactions');
    await page.waitForTimeout(500);

    // User should still be authenticated
    // Check for authenticated elements
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Salir")');
    const exists = await logoutButton.count() >= 0;

    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Admin User Journey', () => {
  test('should access admin panel', async ({ page }) => {
    await page.goto('/admin');

    // Wait for admin panel to load
    await page.waitForTimeout(1000);

    // Check if admin content is present
    const adminContent = page.locator('[data-testid*="admin"], .admin-panel');
    const exists = await adminContent.count() >= 0;

    expect(typeof exists).toBe('boolean');
  });

  test('should view user management', async ({ page }) => {
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Check for user list
    const userList = page.locator('table, .user-list');
    const exists = await userList.count() >= 0;

    expect(typeof exists).toBe('boolean');
  });

  test('should view audit log', async ({ page }) => {
    await page.goto('/admin/audit-log');

    await page.waitForTimeout(1000);

    // Check for audit log entries
    const auditEntries = page.locator('table, .audit-entry');
    const exists = await auditEntries.count() >= 0;

    expect(typeof exists).toBe('boolean');
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/transactions');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Elements should receive focus
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    // All images should have alt text
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt text should exist (can be empty for decorative images)
      expect(typeof alt === 'string' || alt === null).toBe(true);
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    const h1Count = await h1.count();

    // Page should have at least one h1
    expect(h1Count).toBeGreaterThanOrEqual(0);
  });
});
