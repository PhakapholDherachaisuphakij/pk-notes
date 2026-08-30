/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          darkBg: '#191919',
          sidebar: '#f7f7f5',
          darkSidebar: '#202020',
          hover: '#efefed',
          darkHover: '#2c2c2c',
          border: '#e9e9e7',
          darkBorder: '#2f2f2f',
          text: '#37352f',
          darkText: '#d4d4d4',
          muted: '#787774',
          darkMuted: '#9b9b9b',
          accent: '#eb5757',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
