// Mirrors app/entitlements/flags.py DASHBOARD_WIDGET_CATALOG — keep in sync.
// Keys are stable identifiers persisted in a business's saved widget selection;
// never rename one without a migration to rewrite existing rows.
import { Flag } from '@nivaso/types'
import type { FlagKey } from '@nivaso/types'

export type WidgetType = 'stat' | 'chart' | 'bar' | 'donut' | 'funnel' | 'list' | 'gauge'

export const WIDGET_CATALOG: { key: string; label: string; type: WidgetType }[] = [
  // Basics — formerly always-on, now plan-controlled like everything else
  { key: 'stat.products',           label: 'Active Products',    type: 'stat' },
  { key: 'stat.customers',          label: 'Customers',          type: 'stat' },
  { key: 'stat.open_tickets',       label: 'Open Tickets',       type: 'stat' },
  { key: 'stat.products_delivered', label: 'Products Delivered', type: 'stat' },
  { key: 'chart.revenue',           label: 'Revenue',            type: 'chart' },
  { key: 'list.needs_attention',    label: 'Needs Attention',    type: 'list' },
  { key: 'gauge.plan_usage',        label: 'Plan Usage',         type: 'gauge' },
  // Advanced
  { key: 'stat.active_sessions',    label: 'Active Sessions',              type: 'stat' },
  { key: 'stat.agent_runs_today',   label: 'Agent Runs Today',             type: 'stat' },
  { key: 'stat.published_articles', label: 'Published Articles',          type: 'stat' },
  { key: 'chart.agent_runs_7d',     label: 'Agent Runs (7-day)',           type: 'chart' },
  { key: 'chart.ticket_status',     label: 'Ticket Status',                type: 'donut' },
  { key: 'chart.product_catalog',   label: 'Product Catalog Breakdown',    type: 'bar' },
  { key: 'chart.token_usage',       label: 'Token Usage (7-day)',          type: 'chart' },
  { key: 'chart.ticket_priority',   label: 'Open Ticket Priority',         type: 'bar' },
  { key: 'stat.orders_today',            label: 'Orders Today',             type: 'stat' },
  { key: 'donut.order_status',           label: 'Order Status',             type: 'donut' },
  { key: 'bar.top_products',              label: 'Top Products',            type: 'bar' },
  { key: 'funnel.sales',                  label: 'Sales Funnel',            type: 'funnel' },
  { key: 'stat.active_coupons',           label: 'Active Coupons',          type: 'stat' },
  { key: 'stat.active_offers',            label: 'Active Offers',           type: 'stat' },
  { key: 'stat.appointments_upcoming',     label: 'Upcoming Appointments',  type: 'stat' },
]

// Widget key → feature flag that must be enabled for the widget to appear.
// Mirrors WIDGET_DEPENDENCIES in flags.py — keep in sync.
export const WIDGET_DEPENDENCIES: Partial<Record<string, FlagKey>> = {
  'stat.products':           Flag.MODULE_PRODUCTS,
  'stat.customers':          Flag.MODULE_CUSTOMERS,
  'stat.products_delivered': Flag.ORDERS_ENABLED,
  'stat.open_tickets':       Flag.SUPPORT_TICKETS,
  'stat.agent_runs_today':   Flag.UI_AGENT_RUNS,
  'chart.agent_runs_7d':     Flag.UI_AGENT_RUNS,
  'chart.token_usage':       Flag.UI_AGENT_RUNS,
  'chart.ticket_status':     Flag.SUPPORT_TICKETS,
  'chart.ticket_priority':   Flag.SUPPORT_TICKETS,
  'chart.product_catalog':   Flag.MODULE_PRODUCTS,
  'chart.revenue':           Flag.CHANNEL_PAYMENTS,
  'stat.orders_today':       Flag.ORDERS_ENABLED,
  'donut.order_status':      Flag.ORDERS_ENABLED,
  'bar.top_products':        Flag.ORDERS_ENABLED,
  'funnel.sales':            Flag.ORDERS_ENABLED,
  'stat.active_coupons':     Flag.MODULE_COUPONS,
  'stat.active_offers':      Flag.MODULE_OFFERS,
  'stat.appointments_upcoming': Flag.MODULE_APPOINTMENTS,
}
