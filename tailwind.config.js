/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090c0b',
        panel: '#111513',
        line: '#252b27',
        acid: '#d7ff64',
        mint: '#72e6ad',
        ember: '#ff7b63',
        fog: '#9ca69f',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(215, 255, 100, 0.10)',
      },
    },
  },
  plugins: [],
}
