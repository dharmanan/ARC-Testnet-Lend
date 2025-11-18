/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'arc-dark-900': '#0D111C',
        'arc-dark-800': '#161B22',
        'arc-dark-700': '#21262D',
        'arc-accent': {
          'primary': '#38BDF8',
          'secondary': '#F472B6'
        },
        'arc-text': {
          'primary': '#E6EDF3',
          'secondary': '#8B949E'
        }
      }
    },
  },
  plugins: [],
}
