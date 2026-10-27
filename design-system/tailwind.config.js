/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './pages/**/*.{html,js,ts,jsx,tsx}',
    './components/**/*.{html,js,ts,jsx,tsx}',
    './app/**/*.{html,js,ts,jsx,tsx}',
    './*.html'
  ],
  theme: {
    extend: {
      colors: {
        candy: {
          berry: '#a02857',
          'berry-dark': '#7c1d43',
          strawberry: '#d72d58',
          magenta: '#bf0079',
          rose: '#b85c6e',
          blush: '#fed7e7',
          soft: '#fff5f8',
          cream: '#fffaf8',
          // Pastel rotation
          'pastel-1': '#f9dcd9',
          'pastel-2': '#dff0dc',
          'pastel-3': '#fbd3dd',
          'pastel-4': '#fbecc8',
          'pastel-5': '#f6e0d2',
          'pastel-6': '#e2eefb',
          // Accents & Neutrals
          mint: '#5bcfcb',
          'mint-soft': '#e3f6f1',
          'mint-text': '#2f8a6d',
          amber: '#e9a93a',
          gold: '#f2b134',
          whatsapp: '#25d366',
          ink: '#3b2a2f',
          muted: '#8d7a80',
          line: '#f4e1e6',
          'line-dark': '#f6dde5',
        }
      },
      fontFamily: {
        display: ['"El Messiri"', '"IBM Plex Sans Arabic"', 'serif'],
        sans: ['"IBM Plex Sans Arabic"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'candy-card': '22px',
        'candy-section': '32px',
        'candy-pill': '99px',
      },
      boxShadow: {
        'candy-1': '0 4px 14px rgba(184, 92, 110, 0.08)',
        'candy-2': '0 14px 34px rgba(184, 92, 110, 0.14)',
        'candy-3': '0 26px 60px rgba(124, 29, 67, 0.18)',
        'candy-cta': '0 12px 26px rgba(215, 45, 88, 0.30)',
        'candy-dock': '0 14px 34px rgba(124, 29, 67, 0.18)',
      },
      transitionTimingFunction: {
        'candy-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
