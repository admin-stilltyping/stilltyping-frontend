import { useState } from 'react'
import { formatNumber, formatPercent } from '@/utils/formatters'

export interface DonutSlice {
  label: string
  value: number
  /** Explicit hue; falls back to the validated categorical ramp by index. */
  color?: string
}

// Validated all-pairs categorical ramp (blue / orange / aqua / gold / violet)
// on a white surface — used when a slice doesn't supply its own color.
const RAMP = ['#2563eb', '#c2410c', '#0f766e', '#b45309', '#7c3aed', '#6b7280']

export function Donut({ slices }: { slices: DonutSlice[] }) {
  const [active, setActive] = useState<number | null>(null)
  const total = slices.reduce((s, c) => s + c.value, 0) || 1
  const gap = 1.6 // dash units of surface showing between arcs

  let cumulative = 0
  const segments = slices.map((c, i) => {
    const pct = (c.value / total) * 100
    const seg = { c, i, pct, offset: -cumulative, color: c.color ?? RAMP[i % RAMP.length] }
    cumulative += pct
    return seg
  })

  const focus = active != null ? slices[active] : null

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" width={128} height={128} role="img" aria-label="Distribution">
          <g transform="rotate(-90 60 60)">
            {segments.map(({ c, i, pct, offset, color }) => {
              const on = active === i
              return (
                <circle
                  key={c.label}
                  cx={60}
                  cy={60}
                  r={44}
                  fill="none"
                  stroke={color}
                  strokeWidth={on ? 18 : 15}
                  pathLength={100}
                  strokeDasharray={`${Math.max(0, pct - gap)} ${100 - Math.max(0, pct - gap)}`}
                  strokeDashoffset={offset}
                  opacity={active == null || on ? 1 : 0.4}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className="cursor-pointer transition-all"
                />
              )
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-sans text-2xl font-semibold text-dash-ink">
            {formatNumber(focus ? focus.value : total)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-dash-ink3">
            {focus ? focus.label : 'total'}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {segments.map(({ c, i, color }) => {
          const pct = c.value / total
          return (
            <li
              key={c.label}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-900/5"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
              <span className="text-sm text-dash-ink2">{c.label}</span>
              <span className="ml-auto text-sm font-medium text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatPercent(pct)}
              </span>
              <span className="w-12 text-right text-xs text-dash-ink3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatNumber(c.value)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
