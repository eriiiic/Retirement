/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xxs': '360px',
        'xs': '480px',
      },
      backgroundImage: {
        'stripe-gradient': 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
      },
      backgroundSize: {
        'stripes': '1rem 1rem',
      },
      animation: {
        'progress-stripe': 'progress-stripe 1s linear infinite',
      },
      keyframes: {
        'progress-stripe': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        }
      },
      opacity: {
        '15': '0.15',
      },
    },
  },
  plugins: [],
}
