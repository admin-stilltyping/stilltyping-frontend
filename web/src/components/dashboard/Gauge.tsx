import { formatNumber } from '@/utils/formatters'

export interface GaugeItem {
  label: string
  used: number
  limit: number | null
}

// Same severity ramp as StockArmory's fill-carries-severity convention —
// green while there's headroom, amber approaching the cap, red at/over it.
function severity(ratio: number): string {
  if (ratio >= 1) return '#b91c1c'
  if (ratio >= 0.85) return '#9a3412'
  return '#15803d'
}

/**
 * Plan/usage meters: one labeled horizontal bar per item. `limit: null` means
 * unrestricted — shown as a fully-lit neutral bar with no percentage, rather
 * than a divide-by-zero.
 */
export function Gauge({ items }: { items: GaugeItem[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((item) => {
        const unlimited = item.limit == null
        const ratio = unlimited ? 1 : item.limit! > 0 ? item.used / item.limit! : 1
        const pct = Math.min(100, Math.max(0, ratio * 100))
        const color = unlimited ? '#7c3aed' : severity(ratio)

        return (
          <li key={item.label}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="truncate text-sm text-dash-ink2">{item.label}</span>
              <span
                className="ml-auto text-sm font-semibold"
                style={{ color: unlimited ? '#111827' : color, fontVariantNumeric: 'tabular-nums' }}
              >
                {formatNumber(item.used)}
                <span className="text-xs font-normal text-dash-ink3">
                  {unlimited ? ' used' : ` / ${formatNumber(item.limit!)}`}
                </span>
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: `${color}1f` }}
              title={
                unlimited
                  ? `${item.label}: ${formatNumber(item.used)} used · Unlimited`
                  : `${item.label}: ${formatNumber(item.used)} of ${formatNumber(item.limit!)}`
              }
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(4, pct)}%`, background: color }}
              />
            </div>
            {unlimited && (
              <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-dash-ink3">Unlimited</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
