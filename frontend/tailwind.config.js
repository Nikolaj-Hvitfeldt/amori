/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B9D',
        secondary: '#FEC7D7',
        accent: '#A0E7E5',
        background: '#FFF5F7',
      },
    },
  },
  plugins: [],
}
