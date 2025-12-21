/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: '#ff6b35',
          600: '#ff8c42',
        }
      },
      fontFamily: {
        'tillana': ['Tillana', 'cursive'],
        'macondo': ['Macondo', 'cursive'],
        'style-script': ['Style Script', 'cursive'],
      }
    },
  },
  plugins: [],
}