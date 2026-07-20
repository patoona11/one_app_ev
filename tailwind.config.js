/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#10B981', // Emerald 500
        'brand-dark': '#1F2937',    // Gray 800
      }
    },
  },
  plugins: [],
}
