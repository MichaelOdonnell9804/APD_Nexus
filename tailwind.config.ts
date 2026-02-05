import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular']
      },
      colors: {
        ink: {
          950: '#0B0F14',
          900: '#111826',
          800: '#1A2433',
          700: '#273247',
          600: '#3A4A63',
          500: '#50627F',
          400: '#6D829F',
          300: '#9AB0C7',
          200: '#C5D2E0',
          100: '#E7EEF6'
        },
        brass: {
          700: '#6A4A1F',
          600: '#8B622B',
          500: '#A9742D',
          400: '#C58B40',
          300: '#DBA25B'
        }
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
