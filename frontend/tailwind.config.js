/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Source Code Pro"', '"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        jupyter: {
          orange: '#f37626',
          darkOrange: '#e65c00',
          blue: '#2196f3',
          darkBlue: '#1976d2',
          activeBorder: '#2196f3',
          cellBg: '#ffffff',
          bodyBg: '#f7f7f7',
          border: '#e0e0e0',
          menuText: '#222222',
          prompt: '#303f9f',
        }
      }
    },
  },
  plugins: [],
}
