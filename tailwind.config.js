/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Spectral', 'Georgia', 'serif'],
        body: ['"EB Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        paper: '#f8f5ef',
        gold: '#b8963e',
        ink: '#3a3830',
        sidebar: '#201e18',
        sidebarHeader: '#111009',
      },
    },
  },
  plugins: [],
};
