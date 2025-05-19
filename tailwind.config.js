/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.vue",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      keyframes: {
        'loader': {
          'to': {
            opacity: '0.6',
            transform: 'translate3d(0, -0.5rem, 0)'
          }
        },
      },
      animation: {
        'loader': 'loader 0.6s infinite alternate',
      },
      colors: {
        theme: {
          50: 'rgb(var(--theme-50) / <alpha-value>)',
          100: 'rgb(var(--theme-100) / <alpha-value>)',
          200: 'rgb(var(--theme-200) / <alpha-value>)',
          300: 'rgb(var(--theme-300) / <alpha-value>)',
          400: 'rgb(var(--theme-400) / <alpha-value>)',
          500: 'rgb(var(--theme-500) / <alpha-value>)',
          600: 'rgb(var(--theme-600) / <alpha-value>)',
          700: 'rgb(var(--theme-700) / <alpha-value>)',
          800: 'rgb(var(--theme-800) / <alpha-value>)',
          900: 'rgb(var(--theme-900) / <alpha-value>)',
        },
        dark: {
          50: 'rgb(var(--dark-50) / <alpha-value>)',
          100: 'rgb(var(--dark-100) / <alpha-value>)',
          200: 'rgb(var(--dark-200) / <alpha-value>)',
          300: 'rgb(var(--dark-300) / <alpha-value>)',
          400: 'rgb(var(--dark-400) / <alpha-value>)',
          500: 'rgb(var(--dark-500) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          900: 'rgb(var(--dark-900) / <alpha-value>)',
        },
      }
    },
  },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "animation-delay": (value) => {
            return {
              "animation-delay": value,
            };
          },
        },
        {
          values: theme("transitionDelay"),
        }
      );
    }),
  ],
  darkMode: ['class'],
}