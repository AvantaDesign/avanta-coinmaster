/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Desaturated and cool colors for dark mode
        // Primary blues - cool and professional
        'primary': {
          50: '#f0f4f9',
          100: '#e1e8f4',
          200: '#c3d1e8',
          300: '#a5badd',
          400: '#7a95d4', // Main blue - cool and not saturated
          500: '#5975c5', // Accent blue
          600: '#4a5fa8', // Dark blue
          700: '#3d4d8a',
          800: '#2d3a66',
          900: '#1a2341',
        },
        // Success - cool green, desaturated
        'success': {
          50: '#f0f4f1',
          100: '#dce6df',
          200: '#b8cdbf',
          300: '#94b49e',
          400: '#6d9a7d',
          500: '#5a8a6f', // Cool desaturated green
          600: '#4a7660',
          700: '#3a6250',
          800: '#2a4d40',
          900: '#1a3830',
        },
        // Warning - cool amber, desaturated
        'warning': {
          50: '#faf7f2',
          100: '#f5eee2',
          200: '#ebdcc5',
          300: '#dfc7a4',
          400: '#d4af82',
          500: '#c49860', // Cool desaturated amber
          600: '#b08450',
          700: '#936d42',
          800: '#755634',
          900: '#573f26',
        },
        // Danger - cool red, desaturated
        'danger': {
          50: '#faf3f1',
          100: '#f5e5e1',
          200: '#ebccc3',
          300: '#dfa69d',
          400: '#d47877',
          500: '#c45452', // Cool desaturated red
          600: '#b04645',
          700: '#933a38',
          800: '#752d2b',
          900: '#57201f',
        },
        // Info - cool cyan, desaturated
        'info': {
          50: '#f0f8fb',
          100: '#dff0f8',
          200: '#bfe0f0',
          300: '#9ecfe8',
          400: '#75b8de',
          500: '#5aa5d4', // Cool desaturated cyan
          600: '#4a8fbd',
          700: '#3d769f',
          800: '#2d5980',
          900: '#1a3861',
        },
        // Business context color
        'business': {
          50: '#f0f9f4',
          100: '#dcf3e6',
          200: '#b9e7cd',
          300: '#85d4a8',
          400: '#4dbb7d',
          500: '#10a760',
          600: '#0a874d',
          700: '#086d3f',
          800: '#075734',
          900: '#06472c',
        },
        // Personal context color  
        'personal': {
          50: '#f0f4f9',
          100: '#e1e8f4',
          200: '#c3d1e8',
          300: '#a5badd',
          400: '#7a95d4',
          500: '#5975c5',
          600: '#4a5fa8',
          700: '#3d4d8a',
          800: '#2d3a66',
          900: '#1a2341',
        },
      },
      // Typography Scale
      fontSize: {
        'heading-1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],      // 36px
        'heading-2': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }],    // 30px
        'heading-3': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],         // 24px
        'heading-4': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],     // 20px
        'heading-5': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],    // 18px
        'heading-6': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],         // 16px
        'body-large': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],   // 18px
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],              // 16px
        'body-small': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],   // 14px
        'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],        // 14px
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],          // 12px
        'code': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],         // 14px
      },
      // Spacing System (8px grid)
      spacing: {
        '0.5': '0.125rem',   // 2px
        '1': '0.25rem',      // 4px
        '1.5': '0.375rem',   // 6px
        '2': '0.5rem',       // 8px (base unit)
        '3': '0.75rem',      // 12px
        '4': '1rem',         // 16px
        '5': '1.25rem',      // 20px
        '6': '1.5rem',       // 24px
        '7': '1.75rem',      // 28px
        '8': '2rem',         // 32px
        '10': '2.5rem',      // 40px
        '12': '3rem',        // 48px
        '16': '4rem',        // 64px
        '20': '5rem',        // 80px
        '24': '6rem',        // 96px
      },
    },
  },
  plugins: [],
}
