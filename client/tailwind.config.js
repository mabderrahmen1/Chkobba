/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--bg-primary)',
          alt: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
        },
        foreground: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        'theme-border': 'var(--border-color)',

        // Thematic colors
        'felt': {
          DEFAULT: '#3a5a20',
          dark: '#2a4216',
          light: '#4a6e2c'
        },
        'wood': {
          DEFAULT: '#3e2723',
          dark: '#2a1610',
          light: '#5d4037',
          warm: '#5a3520'
        },
        'brass': {
          DEFAULT: '#d4af37',
          dark: '#aa8033',
          light: '#f9e596'
        },
        'turquoise': {
          DEFAULT: '#40e0d0',
          dark: '#00ced1'
        },
        'cream': {
          DEFAULT: '#f5e6d3',
          dark: '#c4a882'
        }
      },
      fontFamily: {
        'ancient': ['"Playfair Display"', '"Cinzel"', 'serif'],
        'body': ['"Amiri"', '"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.5)',
        'glow-green': '0 0 15px rgba(46, 204, 113, 0.5)',
        'glow-red': '0 0 15px rgba(192, 57, 43, 0.5)',
        'glow-turquoise': '0 0 15px rgba(64, 224, 208, 0.4)',
        'inner-dark': 'inset 0 0 60px rgba(0,0,0,0.8)',
        'inner-light': 'inset 0 0 30px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'wood-pattern': "linear-gradient(to right, #2a1610, #3e2723, #2a1610)",
        'felt-pattern': "radial-gradient(circle at center, #4a6e2c 0%, #2a4216 100%)",
      },
      animation: {
        'ambient-glow': 'ambient-glow 4s ease-in-out infinite',
        'gentle-float': 'gentle-float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      }
    },
  },
  plugins: [],
};
