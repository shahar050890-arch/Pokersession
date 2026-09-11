/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // A single dark palette: the room the app is played in.
        room: '#070510',
        panel: '#0B0916',
        sunken: '#0A0814',
        raised: { from: '#1A1630', to: '#100D1E' },
        felt: { from: '#0D3A34', to: '#07211F' },
        ink: {
          DEFAULT: '#E4F0EC',
          soft: '#93AAA3',
          faint: '#7A918B',
          dim: '#6E6490',
        },
        hair: { DEFAULT: '#ffffff14', soft: '#ffffff0d' },
        // Jade is money, red is loss, violet is atmosphere and carries no meaning.
        jade: '#0FBFA0',
        loss: '#FF4D6D',
        brass: '#C9A227',
        violet: { DEFAULT: '#7B2CFF', sign: '#CBA6FF' },
        suit: { red: '#C8102E' },
      },
      fontSize: {
        hero: ['48px', { lineHeight: '1', letterSpacing: '-0.035em', fontWeight: '800' }],
      },
      borderRadius: {
        surface: '20px',
        control: '11px',
        tube: '9px',
      },
      boxShadow: {
        // Controls read as hardware: lit top edge, shadow underneath.
        key: 'inset 0 1px 0 #ffffff1f, inset 0 -1px 0 #00000080, 0 2px 0 #05040C',
        'key-down': 'inset 0 2px 5px #00000099',
        sunken: 'inset 0 2px 7px #000000a6, inset 0 0 0 1px #ffffff12',
        'sunken-on': 'inset 0 2px 7px #000000a6, inset 0 0 0 1px #0FBFA066',
        slab: 'inset 0 1px 0 #ffffff1f, 0 1px 3px #00000090, 0 0 12px #0FBFA026',
        tube: '0 0 18px #0FBFA033, inset 0 0 26px #0FBFA01a, inset 0 1px 0 #ffffff14',
        plaque: 'inset 0 0 0 1px #C9A22759, inset 0 1px 0 #ffffff12',
        panel: '0 0 24px -8px #7B2CFF40',
      },
    },
  },
  plugins: [],
}
