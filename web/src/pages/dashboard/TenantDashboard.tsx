import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Boxes,
  Filter,
  LifeBuoy,
  PieChart,
  Trophy,
  TrendingUp,
} from 'lucide-react'
import type { DateRange } from '@/types/analytics'
import { useAnalyticsOverview } from '@/hooks/useAnalytics'
import { resolveTenantSlug } from '@/utils/tenant'
import { formatMoney, formatNumber, formatPercent } from '@/utils/formatters'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { HeroConsole } from '@/components/dashboard/HeroConsole'
import { StatTile } from '@/components/dashboard/StatTile'
import { Panel, SectionHead } from '@/components/dashboard/Panel'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { Donut } from '@/components/dashboard/Donut'
import { Funnel } from '@/components/dashboard/Funnel'
import { NeedsAttention } from '@/components/dashboard/NeedsAttention'
import { StockArmory } from '@/components/dashboard/StockArmory'
import { BarList } from '@/components/dashboard/BarList'
import { AgentHealth } from '@/components/dashboard/AgentHealth'
import type { ChannelSlice } from '@/types/analytics'

// Validated all-pairs trio on the dark surface (blue / orange / aqua).
const CHANNEL_LABELS: Record<ChannelSlice['channel'], string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  web: 'Web',
}
const CHANNEL_COLORS: Record<ChannelSlice['channel'], string> = {
  whatsapp: '#199e70',
  telegram: '#3987e5',
  web: '#d95926',
}

export function TenantDashboard() {
  const slug = useMemo(() => resolveTenantSlug(), [])
  const [range, setRange] = useState<DateRange>('7d')
  const { data, isLoading } = useAnalyticsOverview(slug, range)

  useEffect(() => {
    if (data) document.title = `${data.business.name} · Live Dashboard`
  }, [data])

  if (isLoading || !data) {
    return (
      <div className="nivaso-dash flex min-h-screen items-center justify-center text-dash-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-violet/30 border-t-dash-violet" />
          <p className="font-mono text-xs uppercase tracking-widest text-dash-ink3">Loading console…</p>
        </div>
      </div>
    )
  }

  const { kpis, business } = data
  const cur = business.currency

  return (
    <div className="nivaso-dash min-h-screen text-dash-ink">
      <DashboardHeader business={business} range={range} onRange={setRange} />

      <main className="mx-auto max-w-[1400px] animate-dash-rise space-y-8 px-4 py-6 sm:px-6">
        <HeroConsole overview={data} />

        {/* KPI row — the five period metrics with trend */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Paid orders" value={formatNumber(kpis.paidOrders.value)} metric={kpis.paidOrders} accent="#3987e5" />
          <StatTile label="Conversion" value={formatPercent(kpis.conversionRate.value, 1)} metric={kpis.conversionRate} accent="#8b7bf0" />
          <StatTile label="Avg order value" value={formatMoney(kpis.avgOrderValue.value, cur)} metric={kpis.avgOrderValue} accent="#f2b134" />
          <StatTile label="New customers" value={formatNumber(kpis.newCustomers.value)} metric={kpis.newCustomers} accent="#199e70" />
          <StatTile label="Fulfilment" value={formatPercent(kpis.fulfillmentRate.value)} metric={kpis.fulfillmentRate} accent="#0ca30c" />
        </div>

        {/* 01 — Performance */}
        <section>
          <SectionHead index="01" title="Performance" hint="revenue & demand" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Revenue & orders" icon={TrendingUp} className="lg:col-span-2">
              <TrendChart data={data.timeseries} currency={cur} />
            </Panel>
            <Panel title="Chats by channel" icon={PieChart}>
              <Donut
                slices={data.channels.map((c) => ({
                  label: CHANNEL_LABELS[c.channel],
                  value: c.conversations,
                  color: CHANNEL_COLORS[c.channel],
                }))}
              />
            </Panel>
          </div>
        </section>

        {/* 02 — Sales pipeline */}
        <section>
          <SectionHead index="02" title="Sales pipeline" hint="chat → delivered login" />
          <div className="grid gap-4 lg:grid-cols-12">
            <Panel title="Conversion funnel" icon={Filter} className="lg:col-span-7">
              <Funnel
                stages={data.funnel.map((s) => ({ label: s.label, value: s.count }))}
                footerLabel="Chat → delivery"
              />
            </Panel>
            <Panel title="Needs attention" icon={AlertTriangle} className="lg:col-span-5">
              <NeedsAttention items={data.attention} currency={cur} />
            </Panel>
          </div>
        </section>

        {/* 03 — Inventory & agent */}
        <section>
          <SectionHead index="03" title="Inventory & agent" hint="stock · catalog · AI" />
          <div className="grid gap-4 lg:grid-cols-12">
            <Panel title="Account stock" icon={Boxes} className="lg:col-span-4">
              <StockArmory stock={data.stock} />
            </Panel>
            <Panel title="Top games" icon={Trophy} className="lg:col-span-4">
              <BarList
                color="#f2b134"
                rows={data.topProducts.map((p) => ({
                  label: p.name,
                  value: p.revenue,
                  valueLabel: formatMoney(p.revenue, cur),
                  sub: `${formatNumber(p.units)} sold`,
                }))}
              />
            </Panel>
            <Panel title="Agent health" icon={Bot} className="lg:col-span-4">
              <AgentHealth agent={data.agent} />
            </Panel>
          </div>
        </section>

        {/* 04 — Support */}
        <section>
          <SectionHead index="04" title="Support" hint="why tickets open" />
          <Panel title="Ticket reasons" icon={LifeBuoy}>
            <BarList
              color="#3987e5"
              rows={data.ticketReasons.map((t) => ({
                label: t.reason,
                value: t.count,
                valueLabel: formatNumber(t.count),
              }))}
            />
          </Panel>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-dash-line pt-4 text-xs text-dash-ink3">
          <span className="font-mono">
            {business.slug}.nivaso.ai · updated {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
          <span>Nivaso — AI sales &amp; support</span>
        </footer>
      </main>
    </div>
  )
}
