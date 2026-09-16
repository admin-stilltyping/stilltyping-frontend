/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // "Operator console" dashboard theme. Surfaces are a deep indigo-charcoal
        // (not pure black); violet is the single brand accent, gold is reserved
        // for money, cyan for the live signal. Data series + status hues below
        // come from the validated data-viz palette (see /code-review dataviz).
        dash: {
          plane: '#0b0d13',
          surface: '#12151d',
          surface2: '#171b25',
          surface3: '#1e2330',
          ink: '#f4f6fb',
          ink2: '#aab2c5',
          ink3: '#6b7488',
          line: 'rgba(255,255,255,0.08)',
          line2: 'rgba(255,255,255,0.05)',
          violet: '#8b7bf0',
          violetlt: '#b3a7ff',
          gold: '#f2b134',
          cyan: '#34d1c9',
          // validated categorical series hues (dark surface)
          blue: '#3987e5',
          orange: '#d95926',
          aqua: '#199e70',
          // reserved status palette (never used as a series)
          good: '#0ca30c',
          warn: '#fab219',
          serious: '#ec835a',
          crit: '#d03b3b',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'dash-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.8)' },
        },
        'dash-rise': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'dash-sweep': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'dash-pulse': 'dash-pulse 2s ease-in-out infinite',
        'dash-rise': 'dash-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'dash-sweep': 'dash-sweep 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
