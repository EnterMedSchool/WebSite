/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      colors: {
        blue: '#1fb6ff',
        purple: '#7e5bef',
        pink: '#ff49db',
        orange: '#ff7849',
        green: '#13ce66',
        yellow: '#ffc82c',
        'gray-dark': '#273444',
        gray: '#8492a6',
        'gray-light': '#d3dce6',
        primary: 'var(--col-primary)',
        'primary-100': 'var(--col-primary-100)',
        secondary: 'var(--col-secondary)',
        'bg-primary': 'var(--col-bg-primary)',
        'bg-secondary': 'var(--col-bg-secondary)',
        'col-text': 'var(--col-text)',
      },
      animation: {
        fadeInAndScale: 'fadeInAndScale .3s ease-out  forwards',
      },
      keyframes: {
        fadeInAndScale: {
          // '0%, 100%': { transform: 'rotate(-3deg)' },
          // '50%': { transform: 'rotate(3deg)' },
          '0%': { opactiy: 0, transform: 'scale(0.8)' },
          '100%': { opactiy: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
