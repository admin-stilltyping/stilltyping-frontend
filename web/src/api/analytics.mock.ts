/**
 * Sample dashboard data — a realistic stand-in until the backend ships
 * `GET /admin/{slug}/analytics/overview`.
 *
 * It models the pilot tenant: a game-account reseller doing ~9 sales/day from
 * ~76 WhatsApp chats/day at a ~₹280 average order. Everything is seeded off the
 * slug so a given account always renders the same numbers (stable across
 * refetches) while different accounts look different.
 *
 * ⛏️  To go live: delete this file and drop the `.catch(() => buildMockOverview…)`
 *     fallback in `api/analytics.ts`. Nothing else references it.
 */
import type {
  DashboardOverview,
  DateRange,
  Metric,
  TimePoint,
} from '@/types/analytics'

// --- deterministic RNG so a tenant's dashboard is stable ------------------
function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RANGE_DAYS: Record<DateRange, number> = { '1d': 1, '7d': 7, '30d': 30 }

const GAME_POOL = [
  'GTA V: Premium',
  'EA FC 24',
  'Call of Duty: MW3',
  'Red Dead Redemption 2',
  'Elden Ring',
  'Minecraft Java+Bedrock',
  'Valorant: Ranked',
  'Cyberpunk 2077',
]

function titleCase(slug: string) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => (w[0] ?? '').toUpperCase() + w.slice(1))
    .join(' ')
}

function metric(
  value: number,
  delta: number | null,
  spark: number[],
  higherIsBetter = true,
): Metric {
  return { value, delta, higherIsBetter, spark }
}

export function buildMockOverview(
  slug: string,
  range: DateRange,
): DashboardOverview {
  const rnd = mulberry32(hashString(slug + ':' + range))
  const jitter = (base: number, spread: number) =>
    base + (rnd() - 0.5) * 2 * spread
  const days = RANGE_DAYS[range]

  // Per-day baselines with a little per-tenant character.
  const chatsPerDay = jitter(76, 8)
  const salesPerDay = jitter(9, 1.4)
  const aov = jitter(285, 40)

  // 14-day trend for context (30 for the month view). Weekends run hotter —
  // gamers buy at night and on days off.
  const points = range === '30d' ? 30 : 14
  const timeseries: TimePoint[] = []
  const today = new Date()
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dow = d.getDay()
    const weekendBoost = dow === 0 || dow === 5 || dow === 6 ? 1.28 : 1
    const orders = Math.max(
      1,
      Math.round(salesPerDay * weekendBoost * (0.8 + rnd() * 0.5)),
    )
    const revenue = Math.round(orders * aov * (0.9 + rnd() * 0.25))
    timeseries.push({ date: d.toISOString().slice(0, 10), revenue, orders })
  }

  // KPI window = selected range; take the trailing `days` of the trend.
  const windowPts = timeseries.slice(-Math.min(days, timeseries.length))
  const revenue = windowPts.reduce((s, p) => s + p.revenue, 0) * (days > points ? days / points : 1)
  const paidOrders = Math.round(
    windowPts.reduce((s, p) => s + p.orders, 0) * (days > points ? days / points : 1),
  )
  const conversations = Math.round(chatsPerDay * days)
  const conversion = paidOrders / conversations
  const newCustomers = Math.round(paidOrders * jitter(0.72, 0.06))
  const fulfillment = jitter(0.97, 0.02)

  const spark = (base: number, n = 12) =>
    Array.from({ length: n }, () => Math.max(0, Math.round(base * (0.6 + rnd() * 0.8))))

  // Funnel — monotonic decreasing from every chat to a delivered login.
  const orders = Math.round(conversations * jitter(0.29, 0.03))
  const payLink = Math.round(orders * jitter(0.74, 0.04))
  const paid = paidOrders
  const fulfilled = Math.round(paid * fulfillment)
  const funnel = [
    { key: 'chats', label: 'Chats started', count: conversations },
    { key: 'orders', label: 'Orders created', count: orders },
    { key: 'paylink', label: 'Payment link sent', count: payLink },
    { key: 'paid', label: 'Paid', count: paid },
    { key: 'fulfilled', label: 'Login delivered', count: fulfilled },
  ]

  // Channel mix — WhatsApp dominant. Give the last channel the remainder so the
  // slices sum *exactly* to the totals (no 523-vs-524 rounding drift on screen).
  const waShare = jitter(0.78, 0.04)
  const tgShare = jitter(0.15, 0.03)
  const shares = [
    { channel: 'whatsapp' as const, share: waShare },
    { channel: 'telegram' as const, share: tgShare },
    { channel: 'web' as const, share: Math.max(0.02, 1 - waShare - tgShare) },
  ]
  const revInt = Math.round(revenue)
  let cAcc = 0
  let oAcc = 0
  let rAcc = 0
  const channels = shares.map((c, i) => {
    const last = i === shares.length - 1
    const conv = last ? conversations - cAcc : Math.round(conversations * c.share)
    const ord = last ? paidOrders - oAcc : Math.round(paidOrders * c.share)
    const rev = last ? revInt - rAcc : Math.round(revInt * c.share)
    cAcc += conv
    oAcc += ord
    rAcc += rev
    return { channel: c.channel, conversations: conv, orders: ord, revenue: rev }
  })

  // Stock "armory" — a few pools drawn tight so low-stock reads as urgent.
  const gameCount = 5 + Math.floor(rnd() * 2)
  const stock = GAME_POOL.slice(0, gameCount).map((product, i) => {
    const capacity = [10, 10, 8, 12, 6, 8, 10, 10][i] ?? 10
    // one or two pools deliberately near-empty
    const drain = i === 1 ? 0.85 : i === 4 ? 0.92 : jitter(0.5, 0.25)
    const allocated = Math.min(capacity, Math.round(capacity * Math.max(0.1, drain)))
    const activeAccounts = Math.max(1, Math.round(capacity / (rnd() > 0.5 ? 2 : 3)))
    return { product, capacity, allocated, activeAccounts }
  })

  // Top products by revenue.
  const topProducts = GAME_POOL.slice(0, 5)
    .map((name) => {
      const units = Math.max(1, Math.round(paidOrders * jitter(0.22, 0.12)))
      return { name, units, revenue: Math.round(units * jitter(295, 60)) }
    })
    .sort((a, b) => b.revenue - a.revenue)

  const pendingCount = Math.round(jitter(3, 1.5))
  const pendingAmount = Math.round(pendingCount * aov)
  const refundCount = rnd() > 0.5 ? 1 : 0
  const lowStock = stock.filter((s) => s.allocated / s.capacity >= 0.8).length
  const openTickets = Math.round(jitter(2.5, 1.5))
  const failedDeliveries = rnd() > 0.7 ? 1 : 0
  const handoffs = Math.round(jitter(1.5, 1))

  const attention = [
    {
      key: 'pending',
      label: 'Payments pending',
      count: Math.max(0, pendingCount),
      amount: pendingAmount,
      severity: 'warning' as const,
      hint: 'Link sent, not yet paid',
    },
    {
      key: 'refunds',
      label: 'Refund queue',
      count: refundCount,
      amount: refundCount * Math.round(aov),
      severity: 'critical' as const,
      hint: 'Duplicate charges to return',
    },
    {
      key: 'lowstock',
      label: 'Low account stock',
      count: lowStock,
      severity: 'serious' as const,
      hint: 'Pools almost exhausted',
    },
    {
      key: 'failed',
      label: 'Failed deliveries',
      count: failedDeliveries,
      severity: 'serious' as const,
      hint: 'Paid but no login sent',
    },
    {
      key: 'tickets',
      label: 'Open tickets',
      count: Math.max(0, openTickets),
      severity: 'warning' as const,
      hint: 'Waiting on a human',
    },
    {
      key: 'handoff',
      label: 'Human handoffs',
      count: Math.max(0, handoffs),
      severity: 'good' as const,
      hint: 'Escalated to you live',
    },
  ]

  const ticketReasons = [
    { reason: 'Payment problem', count: Math.round(jitter(5, 2)) },
    { reason: 'Delivery delay', count: Math.round(jitter(3, 1.5)) },
    { reason: 'Double payment', count: refundCount + Math.round(rnd()) },
    { reason: 'Account issue', count: Math.round(jitter(2, 1)) },
    { reason: 'Other', count: Math.round(jitter(2, 1)) },
  ].filter((t) => t.count > 0)

  return {
    business: {
      slug,
      name: titleCase(slug) || 'Nivaso Store',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
    range,
    generatedAt: new Date().toISOString(),
    live: {
      activeConversations: Math.max(1, Math.round(jitter(7, 3))),
      awaitingPayment: Math.max(0, pendingCount),
    },
    kpis: {
      revenue: metric(Math.round(revenue), jitter(0.18, 0.12), spark(revenue / days)),
      paidOrders: metric(paidOrders, jitter(0.12, 0.1), spark(paidOrders / days)),
      conversionRate: metric(conversion, jitter(0.05, 0.08), spark(conversion * 100)),
      avgOrderValue: metric(Math.round(revenue / Math.max(1, paidOrders)), jitter(0.03, 0.05), spark(aov)),
      newCustomers: metric(newCustomers, jitter(0.09, 0.08), spark(newCustomers / days)),
      fulfillmentRate: metric(fulfillment, jitter(0.01, 0.02), spark(fulfillment * 100)),
    },
    timeseries,
    funnel,
    channels,
    attention,
    topProducts,
    stock,
    agent: {
      automationRate: jitter(0.92, 0.03),
      estimatedCostUsd: 0, // running on Gemini free tier during the pilot
      avgLatencyMs: Math.round(jitter(2350, 400)),
      cacheHitRate: jitter(0.61, 0.1),
      errorRate: jitter(0.012, 0.008),
      toolCallsPerTurn: jitter(2.3, 0.4),
      runs: Math.round(conversations * jitter(3.1, 0.4)),
      model: 'gemini-3.6-flash',
    },
    ticketReasons,
  }
}
