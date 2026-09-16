/**
 * Shape of the tenant dashboard payload.
 *
 * This is the contract for `GET /admin/{slug}/analytics/overview?range=`.
 * The backend aggregation endpoint doesn't exist yet, so `analyticsApi.overview`
 * falls back to a generated sample (see `api/analytics.mock.ts`) — but the
 * component tree only ever sees this type, so wiring the real endpoint is a
 * one-line swap with no UI changes.
 */

export type DateRange = '1d' | '7d' | '30d'

/** A single KPI with a comparison against the previous equivalent period. */
export interface Metric {
  value: number
  /** Fractional change vs the previous period, e.g. 0.18 = +18%. `null` = no basis. */
  delta: number | null
  /** True when a rising value is good (revenue) vs bad (refunds). */
  higherIsBetter: boolean
  /** Short trend for the tile sparkline (oldest → newest). */
  spark: number[]
}

export interface TimePoint {
  /** ISO date (bucket start). */
  date: string
  revenue: number
  orders: number
}

export interface FunnelStage {
  key: string
  label: string
  count: number
}

export interface ChannelSlice {
  channel: 'whatsapp' | 'telegram' | 'web'
  conversations: number
  orders: number
  revenue: number
}

export type AttentionSeverity = 'good' | 'warning' | 'serious' | 'critical'

export interface AttentionItem {
  key: string
  label: string
  count: number
  /** Money at stake, if meaningful (pending payments, refunds). */
  amount?: number
  severity: AttentionSeverity
  hint: string
}

export interface TopProduct {
  name: string
  units: number
  revenue: number
}

/** One credential pool (per game), for the stock "armory". */
export interface StockItem {
  product: string
  capacity: number
  allocated: number
  activeAccounts: number
}

export interface AgentHealth {
  automationRate: number
  estimatedCostUsd: number
  avgLatencyMs: number
  cacheHitRate: number
  errorRate: number
  toolCallsPerTurn: number
  runs: number
  model: string
}

export interface TicketReason {
  reason: string
  count: number
}

export interface DashboardOverview {
  business: { slug: string; name: string; currency: string; timezone: string }
  range: DateRange
  generatedAt: string
  live: { activeConversations: number; awaitingPayment: number }
  kpis: {
    revenue: Metric
    paidOrders: Metric
    conversionRate: Metric
    avgOrderValue: Metric
    newCustomers: Metric
    fulfillmentRate: Metric
  }
  timeseries: TimePoint[]
  funnel: FunnelStage[]
  channels: ChannelSlice[]
  attention: AttentionItem[]
  topProducts: TopProduct[]
  stock: StockItem[]
  agent: AgentHealth
  ticketReasons: TicketReason[]
}
