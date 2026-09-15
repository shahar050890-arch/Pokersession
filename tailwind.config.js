/** @type {import('tailwindcss').Config} */

/*
 * Every colour resolves through a CSS custom property so that one palette
 * definition serves both modes. The channel-triple form (`12 127 108`) is what
 * lets Tailwind's opacity modifiers — `text-jade/70`, `bg-loss/[0.08]` — keep
 * working; a plain `var(--x)` holding `#0C7F6C` would break all of them.
 */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // The room the app is played in — dark by night, warm paper by day.
        room: v('--c-room'),
        panel: v('--c-panel'),
        sunken: v('--c-sunken'),
        raised: { from: v('--c-raised-from'), to: v('--c-raised-to') },
        // The table itself never changes: it is the one surface both modes share.
        felt: { from: '#0D3A34', to: '#07211F' },
        ink: {
          DEFAULT: v('--c-ink'),
          soft: v('--c-ink-soft'),
          faint: v('--c-ink-faint'),
          dim: v('--c-ink-dim'),
        },
        hair: { DEFAULT: 'var(--hair)', soft: 'var(--hair-soft)' },
        // Jade is money, red is loss, brass is the table's metal. Violet is
        // atmosphere and carries no meaning.
        jade: v('--c-jade'),
        loss: v('--c-loss'),
        brass: v('--c-brass'),
        violet: { DEFAULT: v('--c-violet'), sign: v('--c-violet-sign') },
        suit: { red: '#C8102E' },
      },
      fontSize: {
        hero: ['48px', { lineHeight: '1', letterSpacing: '-0.035em', fontWeight: '800' }],
      },
      /* Clay is soft and inflated, so nothing is allowed a tight corner. */
      borderRadius: {
        surface: '30px',
        control: '20px',
        tube: '22px',
      },
      boxShadow: {
        // Every object is a piece of clay: a soft drop beneath it, a highlight
        // pressed into its top-left and a shade into its bottom-right. The
        // recipes differ per mode, so they come from variables.
        key: 'var(--sh-key)',
        'key-down': 'var(--sh-key-down)',
        sunken: 'var(--sh-sunken)',
        'sunken-on': 'var(--sh-sunken-on)',
        slab: 'var(--sh-slab)',
        tube: 'var(--sh-tube)',
        plaque: 'var(--sh-plaque)',
        panel: 'var(--sh-panel)',
        card: 'var(--sh-card)',
      },
    },
  },
  plugins: [],
}
