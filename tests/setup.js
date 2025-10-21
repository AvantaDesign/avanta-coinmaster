/**
 * Test Setup File
 * Runs before all tests to configure the testing environment
 */

import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock global objects and APIs
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.sessionStorage = sessionStorageMock;

  // Mock crypto for API tests
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: {
        digest: async (algorithm, data) => {
          // Mock SHA-256 hash
          return new ArrayBuffer(32);
        },
      },
    };
  }

  // Mock fetch for API tests
  global.fetch = vi.fn();

  // Suppress console errors in tests (unless explicitly testing error handling)
  global.console.error = vi.fn();
  global.console.warn = vi.fn();
});

afterAll(() => {
  // Restore mocks
  vi.restoreAllMocks();
});

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const pass = !isNaN(Date.parse(received));
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid date`,
    };
  },
  
  toHaveValidCurrency(received) {
    const pass = typeof received === 'number' && !isNaN(received) && isFinite(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid currency value`
          : `expected ${received} to be a valid currency value`,
    };
  },
});
