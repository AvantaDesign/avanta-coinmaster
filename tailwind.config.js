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
      },
    },
  },
  plugins: [],
}
