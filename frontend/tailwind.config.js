/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eef7ef',
          100: '#d8eadb',
          500: '#3f7f55',
          600: '#2f6b45',
          700: '#26563a',
          800: '#204632'
        },
        earth: {
          50: '#f7f4ec',
          100: '#ebe4d5',
          200: '#d8ccb5',
          600: '#7c684f',
          700: '#5f503d'
        },
        water: {
          50: '#eef8fb',
          100: '#d4edf5',
          500: '#3f91b3',
          700: '#256178'
        },
        risk: {
          low: '#2f855a',
          moderate: '#d69e2e',
          high: '#dd6b20',
          critical: '#c53030'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
