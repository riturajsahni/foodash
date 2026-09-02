/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
        'pulse-soft':  'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'bounce-in':   'bounceIn 0.5s ease-out',
      },
      keyframes: {
        slideUp:    { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseSoft:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceIn:   { '0%': { transform: 'scale(0.9)', opacity: '0' }, '60%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      }
    }
  },
  plugins: []
};