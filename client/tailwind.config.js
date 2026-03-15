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
          glass: 'rgba(20, 15, 10, 0.65)',
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
          dark: '#1e320d',
          light: '#4a6e2c'
        },
        'wood': {
          DEFAULT: '#3e2723',
          dark: '#1c0d04',
          light: '#5d4037',
          warm: '#5a3520'
        },
        'brass': {
          DEFAULT: '#d4af37',
          dark: '#aa8033',
          light: '#fdf1bc'
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
        'ancient': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'theme-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'theme-md': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'theme-lg': '0 16px 40px rgba(0, 0, 0, 0.8)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.2)',
        'glow-green': '0 0 20px rgba(76, 175, 80, 0.4), inset 0 0 10px rgba(76, 175, 80, 0.2)',
        'glow-red': '0 0 20px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(231, 76, 60, 0.2)',
        'glow-turquoise': '0 0 20px rgba(64, 224, 208, 0.3)',
        'inner-dark': 'inset 0 0 60px rgba(0,0,0,0.8)',
        'inner-light': 'inset 0 0 30px rgba(0,0,0,0.5)',
        'glass-panel': '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        'button-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'wood-pattern': "linear-gradient(to right, #2a1610, #3e2723, #2a1610)",
        'felt-pattern': "radial-gradient(circle at center, #4a6e2c 0%, #2a4216 100%)",
        'glass-gradient': "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
      },
      animation: {
        'ambient-glow': 'ambient-glow 4s ease-in-out infinite',
        'gentle-float': 'gentle-float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
};
