/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        card: '#16161f',
        'card-hover': '#1c1c28',
        border: 'rgba(255,255,255,0.05)',
        'border-light': 'rgba(255,255,255,0.09)',
        muted: '#6a6a80',
        accent: '#ff2d55',
        accent2: '#c837ab',
        tiktok: '#ff2d55',
        youtube: '#ff4444',
        instagram: '#c837ab',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
