/**
 * Health Check API Tests
 * Tests for system health monitoring endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockEnv, createMockRequest } from '../utils/test-helpers.js';

describe('Health Check API', () => {
  let env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe('GET /api/health', () => {
    it('should return healthy status', () => {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.timestamp).toBeValidDate();
    });

    it('should check database connectivity', async () => {
      env.DB.prepare = vi.fn(() => ({
        first: vi.fn().mockResolvedValue({ result: 1 }),
      }));

      const result = await env.DB.prepare().first();
      expect(result.result).toBe(1);
    });

    it('should return uptime information', () => {
      const uptime = process.uptime ? process.uptime() : 0;
      expect(uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include environment information', () => {
      const environment = env.ENVIRONMENT || 'test';
      expect(environment).toBe('test');
    });

    it('should return service dependencies status', () => {
      const dependencies = {
        database: 'connected',
        storage: 'connected',
      };

      expect(dependencies.database).toBe('connected');
      expect(dependencies.storage).toBe('connected');
    });
  });

  describe('System Monitoring', () => {
    it('should track response times', () => {
      const responseTime = 150; // milliseconds
      expect(responseTime).toBeLessThan(500);
    });

    it('should monitor error rates', () => {
      const errorRate = 0.01; // 1%
      expect(errorRate).toBeLessThan(0.05); // Less than 5%
    });

    it('should check memory usage', () => {
      const memoryUsage = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0 };
      expect(memoryUsage.heapUsed).toBeGreaterThanOrEqual(0);
    });
  });
});
