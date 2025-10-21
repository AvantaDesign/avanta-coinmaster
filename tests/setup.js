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
  // Ensure window exists (jsdom should provide it, but we check)
  if (typeof window !== 'undefined') {
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
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  
  // Use Object.defineProperty to ensure it's set on global
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  
  Object.defineProperty(global, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });

  // Mock crypto for API tests (with better Node.js compatibility)
  if (!global.crypto || !global.crypto.subtle) {
    const cryptoMock = {
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
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
    };
    
    Object.defineProperty(global, 'crypto', {
      value: cryptoMock,
      writable: true,
      configurable: true,
    });
  }

  // Mock fetch for API tests
  global.fetch = vi.fn();

  // Mock Request and Response if not available
  if (typeof global.Request === 'undefined') {
    global.Request = class Request {
      constructor(input, init) {
        this.url = typeof input === 'string' ? input : input.url;
        this.method = init?.method || 'GET';
        this.headers = new Map(Object.entries(init?.headers || {}));
        this.body = init?.body;
      }
      
      async json() {
        if (typeof this.body === 'string') {
          return JSON.parse(this.body);
        }
        return this.body;
      }
      
      async text() {
        return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
      }
    };
  }

  if (typeof global.Response === 'undefined') {
    global.Response = class Response {
      constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
        this.statusText = init?.statusText || 'OK';
        this.headers = new Map(Object.entries(init?.headers || {}));
        this.ok = this.status >= 200 && this.status < 300;
      }
      
      async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      }
      
      async text() {
        return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
      }
    };
  }

  // Suppress console errors in tests (unless explicitly testing error handling)
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  global.console.error = (...args) => {
    // Filter out React warnings that are expected in tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
       message.includes('Warning: useLayoutEffect') ||
       message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
  
  global.console.warn = (...args) => {
    // Filter out expected warnings
    const message = args[0];
    if (typeof message === 'string' && message.includes('Warning:')) {
      return;
    }
    originalConsoleWarn(...args);
  };
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
