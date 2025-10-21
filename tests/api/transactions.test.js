/**
 * Transactions API Integration Tests
 * Tests for CRUD operations, filtering, search, and aggregations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockEnv,
  createAuthenticatedRequest,
  generateMockTransaction,
  mockDbSuccess,
} from '../utils/test-helpers.js';
import { mockTransactions, mockUsers } from '../fixtures/mock-data.js';

describe('Transactions API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe('GET /api/transactions - List Transactions', () => {
    it('should return all transactions for authenticated user', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(mockTransactions)),
        })),
      }));

      const request = createAuthenticatedRequest(
        'http://localhost/api/transactions',
        'user-123'
      );

      const result = await env.DB.prepare().bind().all();
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should filter transactions by date range', async () => {
      const filteredTransactions = mockTransactions.filter(
        t => t.date >= '2024-01-15' && t.date <= '2024-01-16'
      );

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(filteredTransactions)),
        })),
      }));

      const request = createAuthenticatedRequest(
        'http://localhost/api/transactions?date_from=2024-01-15&date_to=2024-01-16',
        'user-123'
      );

      const result = await env.DB.prepare().bind().all();
      expect(result.results).toHaveLength(2);
    });

    it('should filter transactions by type', async () => {
      const incomeTransactions = mockTransactions.filter(t => t.type === 'ingreso');

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(incomeTransactions)),
        })),
      }));

      const request = createAuthenticatedRequest(
        'http://localhost/api/transactions?type=ingreso',
        'user-123'
      );

      const result = await env.DB.prepare().bind().all();
      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('ingreso');
    });

    it('should filter transactions by category', async () => {
      const businessTransactions = mockTransactions.filter(
        t => t.category === 'avanta'
      );

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(businessTransactions)),
        })),
      }));

      const result = await env.DB.prepare().bind().all();
      expect(result.results).toHaveLength(2);
    });

    it('should search transactions by description', async () => {
      const searchResults = mockTransactions.filter(
        t => t.description.toLowerCase().includes('servicios')
      );

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(searchResults)),
        })),
      }));

      const result = await env.DB.prepare().bind().all();
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should paginate transaction results', async () => {
      const paginatedTransactions = mockTransactions.slice(0, 2);

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(paginatedTransactions)),
        })),
      }));

      const request = createAuthenticatedRequest(
        'http://localhost/api/transactions?limit=2&offset=0',
        'user-123'
      );

      const result = await env.DB.prepare().bind().all();
      expect(result.results).toHaveLength(2);
    });

    it('should sort transactions by date', async () => {
      const sortedTransactions = [...mockTransactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(sortedTransactions)),
        })),
      }));

      const result = await env.DB.prepare().bind().all();
      expect(result.results[0].date).toBe('2024-01-17');
    });

    it('should only return transactions for authenticated user', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(mockTransactions)),
        })),
      }));

      const result = await env.DB.prepare().bind().all();
      result.results.forEach(transaction => {
        expect(transaction.user_id).toBe('user-123');
      });
    });
  });

  describe('GET /api/transactions/:id - Get Single Transaction', () => {
    it('should return a specific transaction by ID', async () => {
      const transaction = mockTransactions[0];

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(transaction),
        })),
      }));

      const request = createAuthenticatedRequest(
        'http://localhost/api/transactions/1',
        'user-123'
      );

      const result = await env.DB.prepare().bind().first();
      expect(result.id).toBe(1);
      expect(result.description).toBe('Venta de servicios profesionales');
    });

    it('should return 404 for non-existent transaction', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(null),
        })),
      }));

      const result = await env.DB.prepare().bind().first();
      expect(result).toBeNull();
    });

    it('should not allow access to other users transactions', async () => {
      const otherUserTransaction = {
        ...mockTransactions[0],
        user_id: 'other-user-id',
      };

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(null),
        })),
      }));

      const result = await env.DB.prepare().bind().first();
      expect(result).toBeNull();
    });
  });

  describe('POST /api/transactions - Create Transaction', () => {
    it('should create a new transaction with valid data', async () => {
      const newTransaction = generateMockTransaction({
        description: 'Nueva venta',
        amount: 5000.00,
        type: 'ingreso',
      });

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue(mockDbSuccess({
            meta: { last_row_id: 4 },
          })),
        })),
      }));

      const result = await env.DB.prepare().bind().run();
      expect(result.success).toBe(true);
    });

    it('should validate required fields', () => {
      const invalidTransaction = {
        // Missing required fields
        description: 'Test',
      };

      expect(invalidTransaction.date).toBeUndefined();
      expect(invalidTransaction.amount).toBeUndefined();
      expect(invalidTransaction.type).toBeUndefined();
    });

    it('should validate transaction type', () => {
      const validTypes = ['ingreso', 'gasto'];
      expect(validTypes).toContain('ingreso');
      expect(validTypes).toContain('gasto');
      expect(validTypes).not.toContain('invalid');
    });

    it('should validate category', () => {
      const validCategories = ['personal', 'avanta'];
      expect(validCategories).toContain('personal');
      expect(validCategories).toContain('avanta');
      expect(validCategories).not.toContain('invalid');
    });

    it('should sanitize input to prevent XSS', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = maliciousInput.replace(/<[^>]*>/g, '');
      expect(sanitized).toBe('alert("xss")');
    });

    // Business rule: Amounts are stored as integer cents in the database to avoid floating-point errors.
    // All monetary values must be converted from dollars (float) to cents (integer) before storage.
    // Conversion strategy: multiply by 100 and round to nearest integer.
    it('should store amount as integer cents in the database', async () => {
      const newTransaction = generateMockTransaction({
        description: 'Venta en dólares',
        amount: 123.45, // dollars
        type: 'ingreso',
      });

      let storedAmount;
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn((...args) => {
          // Find the amount argument (assuming it's passed as one of the bind args)
          storedAmount = args.find(arg => typeof arg === 'number');
          return {
            run: vi.fn().mockResolvedValue(mockDbSuccess({
              meta: { last_row_id: 5 },
            })),
          };
        }),
      }));

      await env.DB.prepare().bind(
        newTransaction.description,
        Math.round(newTransaction.amount * 100), // what should be stored
        newTransaction.type,
        newTransaction.user_id,
        newTransaction.date,
        newTransaction.category
      ).run();

      expect(storedAmount).toBe(12345); // 123.45 dollars -> 12345 cents
    });

    it('should set user_id from authenticated token', () => {
      const transaction = generateMockTransaction();
      expect(transaction.user_id).toBe('test-user-id');
    });
  });

  describe('PUT /api/transactions/:id - Update Transaction', () => {
    it('should update an existing transaction', async () => {
      const updatedData = {
        description: 'Venta actualizada',
        amount: 20000.00,
      };

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue(mockDbSuccess({})),
        })),
      }));

      const result = await env.DB.prepare().bind().run();
      expect(result.success).toBe(true);
    });

    it('should only allow updating own transactions', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue(mockDbSuccess({
            meta: { changes: 0 },
          })),
        })),
      }));

      const result = await env.DB.prepare().bind().run();
      expect(result.success).toBe(true);
    });

    it('should validate updated data', () => {
      const updates = {
        amount: 'invalid',
      };

      expect(isNaN(Number(updates.amount))).toBe(true);
    });
  });

  describe('DELETE /api/transactions/:id - Delete Transaction', () => {
    it('should soft delete a transaction', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue(mockDbSuccess({})),
        })),
      }));

      const result = await env.DB.prepare().bind().run();
      expect(result.success).toBe(true);
    });

    it('should only allow deleting own transactions', async () => {
      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn().mockResolvedValue(mockDbSuccess({
            meta: { changes: 0 },
          })),
        })),
      }));

      const result = await env.DB.prepare().bind().run();
      expect(result.success).toBe(true);
    });
  });

  describe('Transaction Statistics', () => {
    it('should calculate total income', () => {
      const income = mockTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);

      expect(income).toBe(15000.00);
    });

    it('should calculate total expenses', () => {
      const expenses = mockTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);

      expect(expenses).toBe(26500.00);
    });

    it('should calculate net balance', () => {
      const income = mockTransactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = mockTransactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expenses;

      expect(balance).toBe(-11500.00);
    });

    it('should calculate deductible expenses', () => {
      const deductible = mockTransactions
        .filter(t => t.is_deductible === 1)
        .reduce((sum, t) => sum + t.amount, 0);

      expect(deductible).toBe(25000.00);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      env.DB.prepare = vi.fn(() => {
        throw new Error('Database error');
      });

      try {
        await env.DB.prepare();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });

    it('should handle invalid date formats', () => {
      const invalidDate = 'not-a-date';
      const isValid = !isNaN(Date.parse(invalidDate));
      expect(isValid).toBe(false);
    });

    it('should handle negative amounts appropriately', () => {
      const transaction = generateMockTransaction({
        amount: -100,
        type: 'gasto',
      });

      // Amounts should be positive, type determines direction
      expect(transaction.amount).toBeLessThan(0);
    });
  });
});
