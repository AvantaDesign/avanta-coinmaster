import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Optimize for Implementation Plan V9
    rollupOptions: {
      output: {
        // Phase 49: Fix dynamic import issues with stable chunk names
        // Use consistent hash for better cache stability
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@heroicons/react', '@tanstack/react-virtual'],
          utils: ['decimal.js', 'jose', 'zustand']
        }
      }
    },
    // Optimize bundle size
    minify: 'esbuild',
    // esbuild is faster and doesn't require additional dependencies
    // Phase 49: Ensure source maps for debugging production issues
    sourcemap: false,
    // Set a reasonable chunk size warning limit
    chunkSizeWarningLimit: 600
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },
  // Phase 49: Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'decimal.js']
  }
})
