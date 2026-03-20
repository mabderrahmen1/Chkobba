/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        surface: {
          1: '#141416',
          2: '#1C1C1F',
          3: '#252528',
        },
        border: '#2A2A2E',
        text: {
          primary: '#FAFAFA',
          secondary: '#8F8F9B',
          tertiary: '#5A5A66',
        },
        accent: {
          DEFAULT: '#10B981',
          light: '#34D399',
        },
        team1: '#10B981',
        team2: '#F59E0B',
        success: '#34D399',
        danger: '#FF4757',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
      zIndex: {
        table: '10',
        zones: '30',
        log: '40',
        hud: '45',
        hand: '50',
        controls: '60',
        dealing: '80',
        modal: '100',
        effects: '110',
        toast: '200',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
