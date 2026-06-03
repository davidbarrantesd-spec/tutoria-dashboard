/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aula:       { DEFAULT: '#4F86C6', light: '#EBF2FB', dark: '#2d5f9a' },
        psico:      { DEFAULT: '#5BAD72', light: '#EAF6ED', dark: '#3d8051' },
        espiritual: { DEFAULT: '#9B72CF', light: '#F3EEF9', dark: '#7050a8' },
        fisica:     { DEFAULT: '#F4A261', light: '#FEF3EA', dark: '#d07c3a' },
        critico:    { DEFAULT: '#EF4444', light: '#FEF2F2' },
        alto:       { DEFAULT: '#F97316', light: '#FFF7ED' },
        medio:      { DEFAULT: '#EAB308', light: '#FEFCE8' },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

