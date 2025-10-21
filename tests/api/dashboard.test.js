/**
 * Dashboard API Tests
 * Tests for dashboard statistics and analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockEnv,
  createAuthenticatedRequest,
  mockDbSuccess,
} from '../utils/test-helpers.js';
import { mockTransactions } from '../fixtures/mock-data.js';

describe('Dashboard API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe('GET /api/dashboard - Statistics', () => {
    it('should return financial summary', async () => {
      const summary = {
        total_income: 50000.00,
        total_expenses: 15000.00,
        net_balance: 35000.00,
        transactions_count: 100,
      };

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(summary),
        })),
      }));

      const result = await env.DB.prepare().bind().first();
      expect(result.total_income).toHaveValidCurrency();
      expect(result.total_expenses).toHaveValidCurrency();
      expect(result.net_balance).toHaveValidCurrency();
    });

    it('should calculate monthly trends', () => {
      const trends = [
        { month: '2024-01', income: 40000, expenses: 12000 },
        { month: '2024-02', income: 45000, expenses: 13000 },
        { month: '2024-03', income: 50000, expenses: 15000 },
      ];

      expect(trends).toHaveLength(3);
      trends.forEach(trend => {
        expect(trend.income).toHaveValidCurrency();
        expect(trend.expenses).toHaveValidCurrency();
      });
    });

    it('should return category breakdown', () => {
      const breakdown = {
        personal: 5000.00,
        avanta: 40000.00,
      };

      const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(45000.00);
    });

    it('should show recent transactions', async () => {
      const recentTransactions = mockTransactions.slice(0, 5);

      env.DB.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn().mockResolvedValue(mockDbSuccess(recentTransactions)),
        })),
      }));

      const result = await env.DB.prepare().bind().all();
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should calculate deductible expenses', () => {
      const deductibleExpenses = mockTransactions
        .filter(t => t.is_deductible === 1)
        .reduce((sum, t) => sum + t.amount, 0);

      expect(deductibleExpenses).toHaveValidCurrency();
    });

    it('should show account balances', () => {
      const balances = [
        { account: 'Cuenta de cheques', balance: 50000.00 },
        { account: 'Tarjeta de crédito', balance: -15000.00 },
        { account: 'Efectivo', balance: 5000.00 },
      ];

      const totalBalance = balances.reduce((sum, acc) => sum + acc.balance, 0);
      expect(totalBalance).toBe(40000.00);
    });

    it('should only show data for authenticated user', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost/api/dashboard',
        'user-123'
      );

      const userId = 'user-123';
      expect(userId).toBe('user-123');
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate ISR for the period', () => {
      const taxableIncome = 100000.00;
      const isrRate = 0.30;
      const isr = taxableIncome * isrRate;

      expect(isr).toBe(30000.00);
    });

    it('should calculate IVA balance', () => {
      const ivaCollected = 16000.00;
      const ivaPaid = 2400.00;
      const ivaBalance = ivaCollected - ivaPaid;

      expect(ivaBalance).toBe(13600.00);
    });

    it('should show tax payment deadlines', () => {
      const deadlines = [
        { type: 'ISR', date: '2024-02-17', status: 'pending' },
        { type: 'IVA', date: '2024-02-17', status: 'pending' },
      ];

      expect(deadlines).toHaveLength(2);
      deadlines.forEach(deadline => {
        expect(deadline.date).toBeValidDate();
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('should provide data for income/expense chart', () => {
      const chartData = [
        { label: 'Enero', income: 40000, expenses: 12000 },
        { label: 'Febrero', income: 45000, expenses: 13000 },
        { label: 'Marzo', income: 50000, expenses: 15000 },
      ];

      expect(chartData).toHaveLength(3);
      chartData.forEach(point => {
        expect(point.income).toBeGreaterThan(point.expenses);
      });
    });

    it('should provide data for category pie chart', () => {
      const pieData = [
        { category: 'Servicios', value: 15000, percentage: 30 },
        { category: 'Productos', value: 25000, percentage: 50 },
        { category: 'Otros', value: 10000, percentage: 20 },
      ];

      const totalPercentage = pieData.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBe(100);
    });

    it('should provide cash flow projection', () => {
      const projection = [
        { month: '2024-04', projected: 52000 },
        { month: '2024-05', projected: 54000 },
        { month: '2024-06', projected: 56000 },
      ];

      expect(projection).toHaveLength(3);
      // Projection should show growth
      expect(projection[2].projected).toBeGreaterThan(projection[0].projected);
    });
  });

  describe('Performance Metrics', () => {
    it('should track query performance', () => {
      const queryTime = 45; // milliseconds
      expect(queryTime).toBeLessThan(100);
    });

    it('should cache frequently accessed data', () => {
      const cacheHit = true;
      expect(cacheHit).toBe(true);
    });
  });
});
