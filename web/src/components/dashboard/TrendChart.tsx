import { useState } from 'react'
import { format } from 'date-fns'
import type { TimePoint } from '@/types/analytics'
import { formatMoney, formatMoneyCompact, formatNumber } from '@/utils/formatters'

interface TrendChartProps {
  data: TimePoint[]
  currency: string
}

// viewBox geometry (px are irrelevant — the svg scales to its container).
const W = 720
const H = 250
const PAD_L = 6
const PAD_R = 14
const REV_TOP = 14
const REV_BOTTOM = 158
const ORD_TOP = 182
const ORD_BOTTOM = 222
const AXIS_Y = 240

const GOLD = '#b45309' // money → revenue area
const BLUE = '#2563eb' // count → orders bars

function niceCeil(n: number): number {
  if (n <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  const norm = n / mag
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return step * mag
}

/**
 * Revenue (area) over orders (bars) as small multiples on a shared x-axis —
 * two measures of different scale never share a y-axis. Ships the default
 * hover layer: a crosshair + tooltip reading both series at the cursor.
 */
export function TrendChart({ data, currency }: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  if (data.length < 2) return null

  const n = data.length
  const plotW = W - PAD_L - PAD_R
  const stepX = plotW / (n - 1)
  const x = (i: number) => PAD_L + i * stepX

  const revMax = niceCeil(Math.max(...data.map((d) => d.revenue)))
  const ordMax = Math.max(...data.map((d) => d.orders)) || 1
  const revY = (v: number) => REV_BOTTOM - (v / revMax) * (REV_BOTTOM - REV_TOP)
  const ordH = (v: number) => (v / ordMax) * (ORD_BOTTOM - ORD_TOP)

  const linePts = data.map((d, i) => [x(i), revY(d.revenue)] as const)
  const line = linePts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `${line} L${x(n - 1).toFixed(1)},${REV_BOTTOM} L${PAD_L.toFixed(1)},${REV_BOTTOM} Z`

  const gridVals = [0, 0.5, 1].map((f) => f * revMax)

  // ~6 evenly spaced date ticks.
  const tickEvery = Math.max(1, Math.ceil(n / 6))

  const leftPct = (i: number) => ((PAD_L + i * stepX) / W) * 100
  const active = hover != null ? data[hover] : null

  return (
    <div
      className="relative w-full"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        const i = Math.round((ratio * W - PAD_L) / stepX)
        setHover(Math.max(0, Math.min(n - 1, i)))
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }} role="img">
        <defs>
          <linearGradient id="rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + revenue y-ticks (hairline, recessive) */}
        {gridVals.map((v, i) => {
          const gy = revY(v)
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={gy} y2={gy} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
              <text x={W - PAD_R} y={gy - 4} textAnchor="end" fontSize="10" fill="#6b7280" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatMoneyCompact(v, currency)}
              </text>
            </g>
          )
        })}

        {/* revenue area + line */}
        <path d={area} fill="url(#rev-area)" />
        <path d={line} fill="none" stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* orders bars (own baseline, own scale — small multiple) */}
        {data.map((d, i) => {
          const bw = Math.min(14, stepX * 0.5)
          const h = ordH(d.orders)
          const isOn = hover === i
          return (
            <rect
              key={i}
              x={x(i) - bw / 2}
              y={ORD_BOTTOM - h}
              width={bw}
              height={Math.max(1, h)}
              rx={2}
              fill={BLUE}
              opacity={hover == null || isOn ? 0.9 : 0.4}
            />
          )
        })}
        <text x={PAD_L} y={ORD_TOP - 5} fontSize="10" fill="#6b7280" className="uppercase" style={{ letterSpacing: '0.08em' }}>
          Orders
        </text>

        {/* x-axis date ticks */}
        {data.map((d, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={AXIS_Y} textAnchor={i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="#6b7280">
              {format(new Date(d.date), 'd MMM')}
            </text>
          ) : null,
        )}

        {/* hover crosshair */}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={REV_TOP - 4} y2={ORD_BOTTOM} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
            <circle cx={x(hover)} cy={revY(data[hover].revenue)} r={4} fill={GOLD} stroke="#ffffff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-dash-line bg-dash-surface2/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{ left: `clamp(64px, ${leftPct(hover!)}%, calc(100% - 64px))` }}
        >
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-dash-ink3">
            {format(new Date(active.date), 'EEE, d MMM')}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: GOLD }} />
            <span className="text-dash-ink2">Revenue</span>
            <span className="ml-auto font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(active.revenue, currency)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ background: BLUE }} />
            <span className="text-dash-ink2">Orders</span>
            <span className="ml-auto font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatNumber(active.orders)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
