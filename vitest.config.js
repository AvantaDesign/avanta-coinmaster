import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing (React components)
    environment: 'jsdom',
    
    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],
    
    // Test file patterns
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    
    // Global test utilities
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}', 'functions/**/*.js'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.config.js',
        '**/main.jsx',
        '**/index.jsx',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    
    // Test timeout (10 seconds)
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests once
    retry: 1,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@functions': path.resolve(__dirname, './functions'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
