/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.theme-dark'],
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light:   'rgb(var(--color-primary-light) / <alpha-value>)',
          dark:    'rgb(var(--color-primary-dark) / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-primary-light) / <alpha-value>)',
        accent:    'rgb(var(--color-primary-hover) / <alpha-value>)',
        danger: {
          DEFAULT: '#dc2626',
          light:   '#fef2f2',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light:   '#fffbeb',
        },
        success: {
          DEFAULT: '#16a34a',
          light:   '#f0fdf4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        loginCard: {
          '0%':   { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        loginCard:   'loginCard 0.55s cubic-bezier(0.22,1,0.36,1) both',
        fadeIn:      'fadeIn 0.3s ease-out both',
        slideInLeft: 'slideInLeft 0.45s ease-out both',
      },
    },
  },
  plugins: [],
}

