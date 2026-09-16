import { useEffect, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Settings2,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useDashboardConfig, useUpdateDashboardConfig } from '@/hooks/useDashboardConfig'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import { Flag, flagEnabled, flagArray } from '@nivaso/types'
import type { Entitlements } from '@nivaso/types'
import { WIDGET_CATALOG, WIDGET_DEPENDENCIES, type WidgetType } from '@/config/dashboardWidgets'
import { fetchWidgetData, type WidgetData } from '@/api/dashboardWidgets'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { StatTile } from '@/components/dashboard/StatTile'
import { Panel } from '@/components/dashboard/Panel'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { BarList } from '@/components/dashboard/BarList'
import { Donut } from '@/components/dashboard/Donut'
import { Funnel } from '@/components/dashboard/Funnel'
import { Gauge } from '@/components/dashboard/Gauge'
import { formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

// ── List-widget severity → icon/color (backend's severity enum for `list`
// widgets — 'info'|'warning'|'critical' — doesn't match NeedsAttention's
// analytics-specific 'good'|'warning'|'serious'|'critical', so this is a
// small standalone renderer rather than a forced reuse.) ─────────────────────

const LIST_SEVERITY: Record<'info' | 'warning' | 'critical', { color: string; icon: LucideIcon }> = {
  info: { color: '#2563eb', icon: Info },
  warning: { color: '#a16207', icon: AlertTriangle },
  critical: { color: '#b91c1c', icon: AlertOctagon },
}

function SimpleList({
  items,
}: {
  items: { title: string; subtitle?: string | null; severity: 'info' | 'warning' | 'critical' }[]
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-dash-ink3">Nothing needs attention.</p>
  }
  return (
    <ul className="divide-y divide-dash-line">
      {items.map((item, i) => {
        const meta = LIST_SEVERITY[item.severity]
        const Icon = meta.icon
        return (
          <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${meta.color}1a` }}
            >
              <Icon className="h-4 w-4" style={{ color: meta.color }} />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-dash-ink">{item.title}</p>
              {item.subtitle && <p className="truncate text-xs text-dash-ink3">{item.subtitle}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ── Per-widget skeleton / error states ────────────────────────────────────────

function SkeletonWidget() {
  return (
    <div className="animate-pulse rounded-xl border border-dash-line bg-dash-surface/80 p-4">
      <div className="mb-3 h-3 w-24 rounded bg-gray-900/10" />
      <div className="h-16 rounded bg-gray-900/5" />
    </div>
  )
}

function ErrorWidget({ label }: { label: string }) {
  return (
    <div className="flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-xl border border-red-200 bg-dash-surface/80 p-4 text-center">
      <AlertTriangle className="h-4 w-4 text-red-500" />
      <p className="text-xs text-dash-ink3">Couldn't load "{label}"</p>
    </div>
  )
}

// ── Dispatch: render the right primitive for a widget's response `type` ──────

function WidgetBody({ data }: { data: WidgetData }) {
  switch (data.type) {
    case 'stat':
      return (
        <StatTile
          label={data.label}
          value={`${formatNumber(data.value)}${data.unit ? ` ${data.unit}` : ''}`}
          metric={{ value: data.value, delta: null, higherIsBetter: true, spark: [] }}
        />
      )

    case 'chart':
      return (
        <Panel title={data.label}>
          {data.series.length >= 2 ? (
            <>
              <Sparkline
                data={data.series.map((s) => s.value)}
                stroke="#2563eb"
                width={320}
                height={112}
                className="h-28 w-full"
              />
              <div className="mt-2 flex justify-between font-mono text-[11px] text-dash-ink3">
                <span>{data.series[0]?.label}</span>
                <span>{data.series[data.series.length - 1]?.label}</span>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-dash-ink3">Not enough data yet.</p>
          )}
        </Panel>
      )

    case 'bar':
      return (
        <Panel title={data.label}>
          {data.bars.length ? (
            <BarList
              color="#b45309"
              rows={data.bars.map((b) => ({
                label: b.label,
                value: b.value,
                valueLabel: formatNumber(b.value),
              }))}
            />
          ) : (
            <p className="py-6 text-center text-sm text-dash-ink3">No data yet.</p>
          )}
        </Panel>
      )

    case 'donut':
      return (
        <Panel title={data.label}>
          {data.slices.length ? (
            <Donut slices={data.slices} />
          ) : (
            <p className="py-6 text-center text-sm text-dash-ink3">No data yet.</p>
          )}
        </Panel>
      )

    case 'funnel':
      return (
        <Panel title={data.label}>
          {data.stages.length ? (
            <Funnel stages={data.stages} />
          ) : (
            <p className="py-6 text-center text-sm text-dash-ink3">No data yet.</p>
          )}
        </Panel>
      )

    case 'list':
      return (
        <Panel title={data.label}>
          <SimpleList items={data.items} />
        </Panel>
      )

    case 'gauge':
      return (
        <Panel title={data.label}>
          {data.items.length ? (
            <Gauge items={data.items} />
          ) : (
            <p className="py-6 text-center text-sm text-dash-ink3">No data yet.</p>
          )}
        </Panel>
      )

    default:
      return null
  }
}

// Flexbox, not CSS grid — a fixed-column grid always leaves a gap when the
// last row has fewer items than there are columns (grid-flow-dense only
// backfills EARLIER gaps with LATER items; it can't do anything about a
// trailing partial row, which is exactly what showed up in practice with as
// few as 5 widgets). flex-wrap + flex-grow instead lets whatever items land
// in the final row stretch to fill it, no matter how many there are.
function basisForType(type: WidgetType) {
  switch (type) {
    case 'stat':
      return 'flex-1 basis-[200px] min-w-[180px]'
    case 'gauge':
    case 'list':
      return 'flex-1 basis-[280px] min-w-[240px]'
    default:
      // chart/bar/donut/funnel need the extra width to stay readable (wide
      // sparklines, side-by-side donut + legend, long bar labels).
      return 'flex-1 basis-[420px] min-w-[320px]'
  }
}

function WidgetCard({
  label,
  type,
  isLoading,
  isError,
  data,
}: {
  label: string
  type: WidgetType
  isLoading: boolean
  isError: boolean
  data: WidgetData | undefined
}) {
  return (
    <div className={basisForType(type)}>
      {isLoading ? (
        <SkeletonWidget />
      ) : isError || !data ? (
        <ErrorWidget label={label} />
      ) : (
        <WidgetBody data={data} />
      )}
    </div>
  )
}

// ── Customize panel (unchanged mechanics — still just picks from the
// server-filtered catalog and PATCHes the saved widget-key list) ─────────────

function CustomizePanel({
  allowedKeys,
  selected,
  onSave,
  onClose,
  saving,
}: {
  allowedKeys: Set<string>
  selected: string[]
  onSave: (widgets: string[]) => void
  onClose: () => void
  saving: boolean
}) {
  const [draft, setDraft] = useState<string[]>(selected)

  useEffect(() => setDraft(selected), [selected])

  const toggle = (key: string) => {
    setDraft((d) => (d.includes(key) ? d.filter((k) => k !== key) : [...d, key]))
  }

  const options = WIDGET_CATALOG.filter((w) => allowedKeys.has(w.key))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Customize Dashboard</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-gray-400">No widgets are available on your plan.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((w) => (
            <label
              key={w.key}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={draft.includes(w.key)}
                onChange={() => toggle(w.key)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {w.label}
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => onSave(draft)}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Allowed-set helper ────────────────────────────────────────────────────────

function buildAllowedSet(entitlements: Entitlements | null): Set<string> {
  const allowedWidgets = flagArray(entitlements, Flag.UI_DASHBOARD_WIDGETS)
  const planAllowed =
    allowedWidgets === null
      ? new Set(WIDGET_CATALOG.map((w) => w.key))
      : new Set(allowedWidgets)

  return new Set(
    WIDGET_CATALOG.map((w) => w.key).filter((key) => {
      if (!planAllowed.has(key)) return false
      const dep = WIDGET_DEPENDENCIES[key]
      return dep == null || flagEnabled(entitlements, dep)
    }),
  )
}

// ── Skeleton (config still loading) ───────────────────────────────────────────

function ConfigSkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={basisForType(i % 3 === 0 ? 'chart' : i % 3 === 1 ? 'stat' : 'gauge')}>
          <SkeletonWidget />
        </div>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const slug = useTenantSlug()
  return <DashboardInner slug={slug} />
}

function DashboardInner({ slug }: { slug: string }) {
  const entitlements = useEntitlementStore((s) => s.entitlements)
  const canCustomize = flagEnabled(entitlements, Flag.UI_DASHBOARD_CUSTOMIZE)
  const allowedSet = buildAllowedSet(entitlements)

  const { data: config, isLoading: configLoading, isError: configError } = useDashboardConfig(slug)
  const { mutate: saveConfig, isPending: saving } = useUpdateDashboardConfig(slug)
  const [customizing, setCustomizing] = useState(false)
  // Empty range = backend's own default window per widget (today's exact
  // behavior); only period-based widgets respect start/end, snapshot widgets
  // ignore it server-side — no client-side branching needed either way.
  const [range, setRange] = useState<DateRangeValue>({})

  // If config fails to load, fall back to showing everything the plan allows
  // (catalog order); otherwise render in the business's saved order.
  const orderedKeys = configError
    ? WIDGET_CATALOG.map((w) => w.key).filter((key) => allowedSet.has(key))
    : (config?.widgets ?? []).filter((key) => allowedSet.has(key))

  const catalogByKey = new Map(WIDGET_CATALOG.map((w) => [w.key, w]))

  const results = useQueries({
    queries: orderedKeys.map((key) => ({
      queryKey: ['dashboard-widget', slug, key, range.start, range.end],
      queryFn: () => fetchWidgetData(slug, key, range),
      enabled: !!slug,
    })),
  })

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">
          Select a business from the sidebar to view dashboard metrics.
        </p>
      </div>
    )
  }

  if (configLoading) {
    return <ConfigSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {orderedKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-center">
          <TrendingUp className="mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            No widgets selected yet. Use "Customize Dashboard" below to add some.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {orderedKeys.map((key, i) => {
            const entry = catalogByKey.get(key)
            const result = results[i]
            return (
              <WidgetCard
                key={key}
                label={entry?.label ?? key}
                type={entry?.type ?? 'stat'}
                isLoading={result?.isLoading ?? true}
                isError={result?.isError ?? false}
                data={result?.data}
              />
            )
          })}
        </div>
      )}

      {/* ── Customize control ─────────────────────────────────────────────── */}
      {canCustomize && (
        customizing ? (
          <CustomizePanel
            allowedKeys={allowedSet}
            selected={config?.widgets ?? []}
            saving={saving}
            onClose={() => setCustomizing(false)}
            onSave={(widgets) => saveConfig(widgets, { onSuccess: () => setCustomizing(false) })}
          />
        ) : (
          <button
            onClick={() => setCustomizing(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2',
              'text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50',
            )}
          >
            <Settings2 className="h-4 w-4" />
            Customize Dashboard
          </button>
        )
      )}
    </div>
  )
}
