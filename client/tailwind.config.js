/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          base:    '#262421',
          nav:     '#1d1b19',
          card:    '#312e2b',
          raised:  '#3d3a36',
          border:  '#3d3a36',
        },
        accent: {
          DEFAULT: '#7fa650',
          hover:   '#9fc870',
          muted:   '#4a6130',
        },
        board: {
          dark:  '#739552',
          light: '#ebecd0',
        },
        ink: {
          DEFAULT: '#e0d9d0',
          muted:   '#a09888',
          faint:   '#5a5450',
        },
        coin: '#fbbf24',
        danger: '#e15f5f',
      },
      animation: {
        'piece-land':    'pieceLand 0.2s ease-out',
        'king-crown':    'kingCrown 0.5s ease-out',
        'capture-burst': 'captureBurst 0.3s ease-out',
        'pulse-glow':    'pulseGlow 1.5s ease-in-out infinite',
        'coin-pop':      'coinPop 0.4s cubic-bezier(.36,.07,.19,.97)',
      },
      keyframes: {
        pieceLand:    { '0%':   { transform: 'scale(1.2)' },          '100%': { transform: 'scale(1)' } },
        kingCrown:    { '0%':   { transform: 'scale(0) rotate(-180deg)' }, '100%': { transform: 'scale(1) rotate(0deg)' } },
        captureBurst: { '0%':   { opacity: '1', transform: 'scale(1)' },  '100%': { opacity: '0', transform: 'scale(2)' } },
        pulseGlow:    { '0%,100%': { boxShadow: '0 0 0 0 rgba(127,166,80,0)' }, '50%': { boxShadow: '0 0 0 6px rgba(127,166,80,0.35)' } },
        coinPop:      { '0%':   { transform: 'scale(1)' }, '50%': { transform: 'scale(1.4)' }, '100%': { transform: 'scale(1)' } },
      },
    }
  },
  plugins: []
}
