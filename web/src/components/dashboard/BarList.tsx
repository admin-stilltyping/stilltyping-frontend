import { formatNumber } from '@/utils/formatters'

export interface BarRow {
  label: string
  value: number
  valueLabel: string
  sub?: string
}

/**
 * Ranked horizontal bars, value at the tip. One measure → one hue; labels and
 * values stay in text tokens, identity comes from the bar beside them.
 */
export function BarList({ rows, color }: { rows: BarRow[]; color: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline gap-3">
            <span className="w-4 shrink-0 font-mono text-[11px] text-dash-ink3" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="truncate text-sm text-dash-ink2">{r.label}</span>
            <span className="ml-auto text-sm font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {r.valueLabel}
            </span>
          </div>
          <div className="ml-7 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-900/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
            </div>
            {r.sub && (
              <span className="w-16 shrink-0 text-right text-[11px] text-dash-ink3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.sub}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Convenience adapter kept close to the component that consumes it. */
export function unitsSub(units: number) {
  return `${formatNumber(units)} sold`
}
