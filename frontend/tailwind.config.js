/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4B3F8F',
        secondary: '#1D9E75',
        customer: '#7B6FBF',
        background: '#F8F7FF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#595959',
      },
      animation: {
        'pulse-purple': 'rahul-speaking 1.5s ease-in-out infinite',
        'pulse-teal': 'exec-speaking 1.5s ease-in-out infinite',
      },
      keyframes: {
        'rahul-speaking': {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(75, 63, 143, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(75, 63, 143, 0)' },
        },
        'exec-speaking': {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(29, 158, 117, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(29, 158, 117, 0)' },
        },
      },
    },
  },
  plugins: [],
};
