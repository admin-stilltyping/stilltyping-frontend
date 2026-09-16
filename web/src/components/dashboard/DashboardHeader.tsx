import { useEffect, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import type { DashboardOverview, DateRange } from '@/types/analytics'
import { RangeToggle } from './RangeToggle'

function useClock(timeZone: string) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
  }).format(now)
  const zone =
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  return { time, zone }
}

export function DashboardHeader({
  business,
  range,
  onRange,
}: {
  business: DashboardOverview['business']
  range: DateRange
  onRange: (r: DateRange) => void
}) {
  const { time, zone } = useClock(business.timezone)

  return (
    <header className="sticky top-0 z-20 border-b border-dash-line bg-dash-plane/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dash-violet/15 ring-1 ring-inset ring-dash-violet/30">
            <Gamepad2 className="h-5 w-5 text-dash-violetlt" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold text-dash-ink">{business.name}</p>
            <p className="font-mono text-[10px] tracking-wide text-dash-ink3">{business.slug}.nivaso.ai</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-dash-pulse rounded-full bg-dash-cyan" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-dash-cyan" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-dash-ink2">Live</span>
            <span className="font-mono text-xs text-dash-ink3" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {time} {zone}
            </span>
          </div>
          <RangeToggle value={range} onChange={onRange} />
        </div>
      </div>
    </header>
  )
}
