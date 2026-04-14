/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#062b54",
        secondary: "#23416b",
        hormozi: {
          yellow: "#facc15",
          black: "#000000",
        },
        surface: {
          DEFAULT: "#f7f9fb",
          dark: "#191c1e",
        }
      },
      fontFamily: {
        display: ['var(--font-manrope)'],
        body: ['var(--font-manrope)'],
        label: ['var(--font-inter)'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
