/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#0d1117',
          surface: '#161b22',
          surfaceHover: '#1f242c',
          border: '#30363d',
          accent: '#58a6ff',
          accentGlow: 'rgba(88, 166, 255, 0.15)',
          success: '#3fb950',
          warning: '#d29922',
          error: '#f85149',
          purple: '#bc8cff',
          cyan: '#39c5cf',
          nodeBg: '#1c2128',
          textMuted: '#8b949e',
          textBright: '#f0f6fc',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.4)' },
          '100%': { boxShadow: '0 0 15px rgba(88, 166, 255, 0.9)' },
        }
      }
    },
  },
  plugins: [],
}
