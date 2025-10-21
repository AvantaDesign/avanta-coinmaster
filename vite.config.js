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
  }
})
