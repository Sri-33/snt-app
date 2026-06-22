/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#111111', soft: '#1f1f1f' },
        gold: { DEFAULT: '#9A7F2E', light: '#b89a4a', dark: '#7d6624' },
        sand: '#F9F7F0',
        line: '#E8E0CC',
        muted: '#555555',
        subtle: '#888888',
        // Legacy alias: primary brand is now near-black.
        maroon: { DEFAULT: '#111111', dark: '#000000', light: '#9A7F2E' },
        success: '#2E7D32',
        warning: '#E65100',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Roboto',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
        inner: 'none',
      },
    },
  },
  plugins: [],
};
