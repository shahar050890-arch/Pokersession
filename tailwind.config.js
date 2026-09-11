/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f5f5f7',
        },
        ink: {
          DEFAULT: '#1d1d1f',
          soft: '#6e6e73',
        },
        profit: '#16a34a',
        loss: '#dc2626',
        warn: '#f59e0b',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
