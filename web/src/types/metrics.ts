export interface DayStats {
  date: string
  runs: number
  tokens: number
}

export interface RevenuePoint {
  label: string
  amount: number
}

export interface Metrics {
  tickets: {
    by_status: Record<string, number>
    by_priority: Record<string, number>
    total_open: number
  }
  products: {
    by_status: Record<string, number>
    total_active: number
    total: number
  }
  knowledge: {
    by_status: Record<string, number>
    total_published: number
  }
  customers: {
    total: number
    new_last_7d: number
  }
  agent_runs: {
    today: {
      count: number
      tokens: number
      avg_latency_ms: number
      estimated_cost_usd: number
    }
    by_day: DayStats[]
  }
  sessions: {
    active: number
    total: number
  }
  products_delivered: number
  revenue: {
    currency: string
    by_week: RevenuePoint[]
    by_month: RevenuePoint[]
    by_year: RevenuePoint[]
  }
}
