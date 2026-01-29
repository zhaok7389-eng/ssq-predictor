/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ssq-red': '#FF4757',
        'ssq-blue': '#3498db',
        'ssq-gold': '#FFD700',
        'ssq-pink': '#FFB6C1',
        'ssq-pink-deep': '#FF69B4',
        'ssq-bg': '#FFF9F0',
        'ssq-card': '#ffffff',
        'ssq-text': '#4A3728',
        'ssq-sub': '#8B7B6B',
      },
    },
  },
  plugins: [],
};
