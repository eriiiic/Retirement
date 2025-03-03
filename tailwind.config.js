/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xxs': '360px',
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
