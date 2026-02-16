import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', '"Trebuchet MS"', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#edf7f4',
          100: '#d5ede6',
          200: '#adddce',
          300: '#7ec9b1',
          400: '#4fb094',
          500: '#2f9579',
          600: '#236f5a',
          700: '#1f5a4a',
          800: '#1d473b',
          900: '#193b31'
        }
      },
      boxShadow: {
        panel: '0 14px 40px -20px rgba(14, 46, 38, 0.55)'
      }
    }
  },
  plugins: []
} satisfies Config;
