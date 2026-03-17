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
          glass: 'rgba(15, 10, 5, 0.7)',
          'glass-heavy': 'rgba(10, 5, 0, 0.85)',
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

        // High-end Thematic Palette
        'felt': {
          DEFAULT: '#2d4a1a',
          dark: '#122008',
          light: '#3a5a20',
          deep: '#0a1204'
        },
        'wood': {
          DEFAULT: '#3e2723',
          dark: '#1c0d04',
          light: '#5d4037',
          warm: '#4e342e',
          rich: '#2d1606'
        },
        'brass': {
          DEFAULT: '#d4af37',
          dark: '#aa8033',
          light: '#fdf1bc',
          glow: 'rgba(212, 175, 55, 0.4)'
        },
        'gold': {
          50: '#fffdf0',
          100: '#fef9cd',
          200: '#fdf1bc',
          300: '#fbe27a',
          400: '#f9cf4a',
          500: '#d4af37',
          600: '#aa8033',
          700: '#856128',
          800: '#6d4e25',
          900: '#5d4023',
        },
        'turquoise': {
          DEFAULT: '#40e0d0',
          dark: '#00ced1',
          glow: 'rgba(64, 224, 208, 0.3)'
        },
        'cream': {
          DEFAULT: '#f5e6d3',
          dark: '#c4a882',
          light: '#faf3e0'
        }
      },
      fontFamily: {
        'ancient': ['Cinzel', 'serif'],
        'amiri': ['Amiri', 'serif'],
        'playfair': ['Playfair Display', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'theme-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'theme-md': '0 8px 24px rgba(0, 0, 0, 0.6)',
        'theme-lg': '0 16px 40px rgba(0, 0, 0, 0.8)',
        'glow-gold': '0 0 25px rgba(212, 175, 55, 0.35), inset 0 0 12px rgba(212, 175, 55, 0.15)',
        'glow-gold-intense': '0 0 40px rgba(212, 175, 55, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.25)',
        'glow-green': '0 0 20px rgba(76, 175, 80, 0.35), inset 0 0 10px rgba(76, 175, 80, 0.15)',
        'glow-red': '0 0 20px rgba(231, 76, 60, 0.35), inset 0 0 10px rgba(231, 76, 60, 0.15)',
        'glow-turquoise': '0 0 25px rgba(64, 224, 208, 0.25)',
        'inner-dark': 'inset 0 0 80px rgba(0,0,0,0.9)',
        'inner-light': 'inset 0 0 40px rgba(0,0,0,0.6)',
        'glass-panel': '0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-panel-light': '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'button-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
        'card': '0 10px 25px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'wood-pattern': "linear-gradient(to right, #1c0d04, #3e2723, #1c0d04)",
        'felt-pattern': "radial-gradient(circle at center, #3a5a20 0%, #122008 100%)",
        'glass-gradient': "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)",
        'brass-gradient': "linear-gradient(to bottom, #fdf1bc, #d4af37, #aa8033)",
        'dark-gradient': "radial-gradient(ellipse at 50% 40%, rgba(26,18,14,0.7) 0%, rgba(10,5,0,1) 90%)",
      },
      zIndex: {
        'bg': '0',
        'vignette': '5',
        'table': '10',
        'zones': '30',
        'log': '40',
        'hud': '45',
        'hand': '50',
        'controls': '60',
        'dealing': '80',
        'modal': '100',
        'effects': '110',
        'toast': '200',
      },
      animation: {
        'ambient-glow': 'ambient-glow 6s ease-in-out infinite',
        'gentle-float': 'gentle-float 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 30s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'ambient-glow': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.7 }
        },
        'gentle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
};
