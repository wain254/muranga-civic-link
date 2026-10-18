/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muranga: {
          green: '#008f39', 
          dark: '#005c25',
          light: '#e6f4ea',
          gold: '#f1c40f'   
        }
      }
    },
  },
  plugins: [],
}