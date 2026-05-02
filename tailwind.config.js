/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#080B10',
          surface: '#0D1117',
          elevated: '#161C26',
          border: '#1E2736',
        },
        accent: {
          DEFAULT: '#00E5FF',
          dim: '#00E5FF22',
          glow: '#00E5FF44',
        },
        success: '#00FF94',
        warning: '#FFB800',
        danger: '#FF3B6B',
        muted: '#4A5568',
        text: {
          primary: '#E8ECF0',
          secondary: '#7B8A9C',
          dim: '#4A5568',
        }
      },
      boxShadow: {
        'accent': '0 0 20px rgba(0, 229, 255, 0.15)',
        'accent-lg': '0 0 40px rgba(0, 229, 255, 0.2)',
        'glow': '0 0 60px rgba(0, 229, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'typing': 'typing 1.4s steps(3, end) infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
