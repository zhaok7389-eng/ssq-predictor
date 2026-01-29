/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ssq-red': '#e63946',
        'ssq-blue': '#457b9d',
        'ssq-gold': '#f4a261',
        'ssq-bg': '#f8f9fa',
        'ssq-card': '#ffffff',
        'ssq-text': '#1d3557',
      },
    },
  },
  plugins: [],
};
