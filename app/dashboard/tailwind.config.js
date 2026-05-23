/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter Tight', 'sans-serif'],
      },
      colors: {
        zweho: {
          bg:        '#0a0c10',
          panel:     '#11141a',
          panel2:    '#161a22',
          elevated:  '#1c2029',
          border:    '#232834',
          borderHi:  '#2e3441',
          accent:    '#ff7849',
        }
      }
    },
  },
  plugins: [],
}
