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
        // "Operator console" dashboard theme, re-tuned for a light page (the
        // rest of the app is light-themed — surfaces used to be a deep
        // indigo-charcoal; now near-white). Violet is still the single brand
        // accent, gold reserved for money, cyan for the live signal. Data
        // series + status hues below are darkened from their old dark-surface
        // values so each keeps at least ~4.5:1 contrast against white.
        dash: {
          plane: '#f9fafb',
          surface: '#ffffff',
          surface2: '#f9fafb',
          surface3: '#f3f4f6',
          ink: '#111827',
          ink2: '#4b5563',
          ink3: '#6b7280',
          line: 'rgba(0,0,0,0.08)',
          line2: 'rgba(0,0,0,0.05)',
          violet: '#7c3aed',
          violetlt: '#6d28d9',
          gold: '#b45309',
          cyan: '#0e7490',
          // validated categorical series hues, darkened for a white surface
          blue: '#2563eb',
          orange: '#c2410c',
          aqua: '#0f766e',
          // reserved status palette (never used as a series)
          good: '#15803d',
          warn: '#a16207',
          serious: '#9a3412',
          crit: '#b91c1c',
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
