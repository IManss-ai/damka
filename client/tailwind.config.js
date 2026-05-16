/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          base:    '#1a1816',
          nav:     '#141210',
          card:    '#252220',
          raised:  '#2e2b28',
          border:  '#3a3632',
        },
        accent: {
          DEFAULT: '#7fa650',
          hover:   '#9fc870',
          muted:   '#4a6130',
        },
        board: {
          dark:  '#5a7a3a',
          light: '#d4cfa8',
        },
        ink: {
          DEFAULT: '#e8e0d5',
          muted:   '#a09888',
          faint:   '#5a5450',
        },
        border: '#3a3632',
        coin: '#fbbf24',
        danger: '#e15f5f',
      },
      animation: {
        'piece-land':    'pieceLand 0.2s ease-out',
        'king-crown':    'kingCrown 0.5s ease-out',
        'capture-burst': 'captureBurst 0.35s ease-out',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'coin-pop':      'coinPop 0.4s cubic-bezier(.36,.07,.19,.97)',
        'float':         'float 4s ease-in-out infinite',
        'slide-up':      'slideUp 0.5s ease-out forwards',
        'fade-in':       'fadeIn 0.6s ease-out forwards',
        'bounce-in':     'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        'glow-pulse':    'glowPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        pieceLand:    { '0%':   { transform: 'scale(1.2)' },          '100%': { transform: 'scale(1)' } },
        kingCrown:    { '0%':   { transform: 'scale(0) rotate(-180deg)' }, '100%': { transform: 'scale(1) rotate(0deg)' } },
        captureBurst: { '0%':   { opacity: '1', transform: 'scale(1)' },  '100%': { opacity: '0', transform: 'scale(2.5)' } },
        pulseGlow:    { '0%,100%': { boxShadow: '0 0 0 0 rgba(127,166,80,0)' }, '50%': { boxShadow: '0 0 0 8px rgba(127,166,80,0.2)' } },
        coinPop:      { '0%':   { transform: 'scale(1)' }, '50%': { transform: 'scale(1.5)' }, '100%': { transform: 'scale(1)' } },
        float:        { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        slideUp:      { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        bounceIn:     { '0%': { transform: 'scale(0.3)', opacity: '0' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        glowPulse:    { '0%,100%': { textShadow: '0 0 10px rgba(127,166,80,0.5)' }, '50%': { textShadow: '0 0 25px rgba(127,166,80,0.9)' } },
      },
    }
  },
  plugins: []
}
