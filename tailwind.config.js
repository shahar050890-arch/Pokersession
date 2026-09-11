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
        // Surfaces run warm so the app reads like paper, not a default UI kit.
        paper: '#FBFBF9',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#14141A',
          soft: '#71717A',
          faint: '#A1A1AA',
        },
        line: '#ECECE8',
        night: {
          bg: '#0B0B0D',
          card: '#151519',
          line: '#26262C',
        },
        // Table felt — the app's one piece of atmosphere.
        felt: {
          DEFAULT: '#10402F',
          deep: '#0A2B20',
          light: '#17523C',
        },
        // The red of a heart or diamond; distinct from the loss red.
        suit: { red: '#C8102E' },
        brass: '#C9A227',
        // One accent, used only where money is at stake.
        up: { DEFAULT: '#0E9F6E', soft: '#E7F6F0', night: '#34D399' },
        down: { DEFAULT: '#DC4B45', soft: '#FCEDEC', night: '#F87171' },
        flag: { DEFAULT: '#D98A2B', soft: '#FDF3E6', night: '#FBBF24' },
      },
      fontSize: {
        hero: ['3.25rem', { lineHeight: '1', letterSpacing: '-0.035em', fontWeight: '700' }],
        big: ['2rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
      },
      borderRadius: {
        xl2: '1.125rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,20,26,0.04), 0 6px 20px -8px rgba(20,20,26,0.10)',
        lift: '0 2px 4px rgba(20,20,26,0.06), 0 16px 32px -12px rgba(20,20,26,0.18)',
      },
    },
  },
  plugins: [],
}
