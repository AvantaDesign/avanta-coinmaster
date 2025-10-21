/**
 * Test Helper Utilities
 * Common functions used across tests
 */

import { vi } from 'vitest';

/**
 * Create a mock Cloudflare D1 database
 */
export function createMockD1Database() {
  const database = {
    prepare: vi.fn((query) => ({
      bind: vi.fn(() => ({
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn(),
      })),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
    })),
    batch: vi.fn(),
    exec: vi.fn(),
  };
  return database;
}

/**
 * Create a mock Cloudflare R2 bucket
 */
export function createMockR2Bucket() {
  const bucket = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    head: vi.fn(),
    list: vi.fn(),
  };
  return bucket;
}

/**
 * Create a mock Cloudflare Workers environment
 */
export function createMockEnv(overrides = {}) {
  return {
    DB: createMockD1Database(),
    RECEIPTS: createMockR2Bucket(),
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    ENVIRONMENT: 'test',
    ...overrides,
  };
}

/**
 * Create a mock Request object
 */
export function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
  } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });
}

/**
 * Create a mock authenticated request
 */
export function createAuthenticatedRequest(url, userId = 'test-user-id', options = {}) {
  const token = 'mock-jwt-token';
  return createMockRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Extract JSON from Response object
 */
export async function getResponseJson(response) {
  const text = await response.text();
  return JSON.parse(text);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition, timeout = 5000) {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Mock successful database response
 */
export function mockDbSuccess(data) {
  return {
    success: true,
    results: Array.isArray(data) ? data : [data],
    meta: {
      duration: 1.23,
      rows_read: Array.isArray(data) ? data.length : 1,
      rows_written: 0,
    },
  };
}

/**
 * Mock database error
 */
export function mockDbError(message = 'Database error') {
  return {
    success: false,
    error: message,
  };
}

/**
 * Generate mock user data
 */
export function generateMockUser(overrides = {}) {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
    is_active: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock transaction data
 */
export function generateMockTransaction(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 100000),
    user_id: 'test-user-id',
    date: new Date().toISOString().split('T')[0],
    description: 'Test Transaction',
    amount: 100.50,
    type: 'ingreso',
    category: 'personal',
    account: 'Test Account',
    is_deductible: 0,
    transaction_type: 'personal',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock account data
 */
export function generateMockAccount(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 100000),
    user_id: 'test-user-id',
    name: 'Test Account',
    type: 'checking',
    balance: 1000.00,
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Sleep for a specified time
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock JWT token for testing
 */
export function createMockJWT(payload = {}) {
  // This is a mock token, not a real JWT
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload,
  }));
  const signature = 'mock-signature';
  return `${header}.${body}.${signature}`;
}
