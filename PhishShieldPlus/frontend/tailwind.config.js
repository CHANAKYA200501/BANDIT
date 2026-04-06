/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        darkBg: '#0b0c10',
        panelBg: '#1f2833',
        neonTeal: '#66fcf1',
        mutedTeal: '#45a29e',
        dangerRed: '#e24b4a',
        warningAmber: '#f0ad4e'
      }
    },
  },
  plugins: [],
}
