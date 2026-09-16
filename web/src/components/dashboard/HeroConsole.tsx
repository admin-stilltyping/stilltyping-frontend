import { ArrowDownRight, ArrowUpRight, Hourglass, MessageSquare } from 'lucide-react'
import type { DashboardOverview, DateRange } from '@/types/analytics'
import { formatMoney, formatNumber, formatPercent } from '@/utils/formatters'
import { Sparkline } from './Sparkline'

const RANGE_LABEL: Record<DateRange, string> = {
  '1d': 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

function Vital({
  icon: Icon,
  label,
  value,
  color,
  live,
}: {
  icon: typeof MessageSquare
  label: string
  value: string
  color: string
  live?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}1a` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </span>
      <div className="leading-tight">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-dash-ink3">
          {label}
          {live && <span className="h-1.5 w-1.5 animate-dash-pulse rounded-full" style={{ background: color }} />}
        </p>
        <p className="text-2xl font-semibold text-dash-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function HeroConsole({ overview }: { overview: DashboardOverview }) {
  const { kpis, live, range, business } = overview
  const rev = kpis.revenue
  const good = rev.delta != null && rev.delta > 0
  const Arrow = rev.delta != null && rev.delta < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <section className="dash-bracket relative overflow-hidden rounded-2xl border border-dash-line bg-gradient-to-br from-dash-surface2/90 to-dash-surface/70 p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] sm:p-6">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dash-violet/60 to-transparent" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* revenue hero — the one big number the day is scored by */}
        <div className="lg:flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-dash-ink3">
            Revenue · {RANGE_LABEL[range]}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="text-5xl font-semibold leading-none text-dash-gold sm:text-6xl">
              {formatMoney(rev.value, business.currency)}
            </span>
            {rev.delta != null && (
              <span
                className="mb-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium"
                style={{
                  color: good ? '#15803d' : '#b91c1c',
                  background: good ? 'rgba(21,128,61,0.12)' : 'rgba(185,28,28,0.12)',
                }}
              >
                <Arrow className="h-4 w-4" />
                {formatPercent(Math.abs(rev.delta))}
                <span className="text-dash-ink3">vs prev</span>
              </span>
            )}
          </div>
          <div className="mt-4">
            <Sparkline data={rev.spark} stroke="#b45309" width={320} height={44} className="w-full max-w-sm" />
          </div>
        </div>

        {/* live vitals — what's happening right now */}
        <div className="lg:w-[300px] lg:border-l lg:border-dash-line lg:pl-8">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-dash-ink3">Right now</p>
          <div className="flex gap-8 lg:flex-col lg:gap-5">
            <Vital icon={MessageSquare} label="Active chats" value={formatNumber(live.activeConversations)} color="#0e7490" live />
            <Vital icon={Hourglass} label="Awaiting pay" value={formatNumber(live.awaitingPayment)} color="#a16207" />
          </div>
        </div>
      </div>
    </section>
  )
}
