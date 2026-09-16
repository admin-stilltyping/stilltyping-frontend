import {
  Package,
  Wrench,
  TicketCheck,
  Users,
  BookOpen,
  MessageSquare,
  LayoutDashboard,
  ShoppingCart,
  Webhook,
  Plug,
  CalendarClock,
  Building2,
  SlidersHorizontal,
  UserRoundPlus,
  Coins,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Flag, type FlagKey } from '@nivaso/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  flag?: FlagKey
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Modules',
    items: [
      { to: '/products', label: 'Products', icon: Package, flag: Flag.MODULE_PRODUCTS },
      { to: '/services', label: 'Services', icon: Wrench, flag: Flag.MODULE_SERVICES },
      { to: '/orders', label: 'Orders', icon: ShoppingCart, flag: Flag.ORDERS_ENABLED },
      { to: '/appointments', label: 'Appointments', icon: CalendarClock, flag: Flag.MODULE_APPOINTMENTS },
      { to: '/customers', label: 'Customers', icon: Users, flag: Flag.MODULE_CUSTOMERS },
      { to: '/leads', label: 'Leads', icon: UserRoundPlus, flag: Flag.MODULE_LEADS },
      { to: '/support', label: 'Support Tickets', icon: TicketCheck, flag: Flag.SUPPORT_TICKETS },
    ],
  },
  {
    label: 'Integrations',
    items: [{ to: '/integrations', label: 'Integrations', icon: Plug }],
  },
  {
    label: 'AI & Events',
    items: [
      { to: '/chat', label: 'Agent Chat', icon: MessageSquare },
      // AI Usage now folds in the raw per-run log ("Recent Runs") that used
      // to live on its own "Agent Runs" sidebar entry — see AiUsagePage.tsx.
      // That route/page still exists (reachable directly, like ConnectorsPage)
      // in case anything else references it, but it's unlinked from the nav.
      { to: '/ai-usage', label: 'AI Usage', icon: Coins },
      { to: '/webhooks', label: 'Webhook Events', icon: Webhook, flag: Flag.UI_WEBHOOK_EVENTS },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
      { to: '/settings/instructions', label: 'AI Instructions', icon: Sparkles },
      { to: '/settings/custom-fields', label: 'Custom Fields', icon: SlidersHorizontal, flag: Flag.MODULE_CUSTOM_FIELDS },
      // `to` is a sentinel here, not a literal route — Sidebar.tsx resolves it to
      // the locked business's detail page (`/businesses/:slug`), the same route
      // the old "Businesses" list-style link redirected to when scoped to a
      // single tenant. See Sidebar.tsx's `resolvedTo` logic.
      { to: '/business', label: 'Business Profile', icon: Building2 },
    ],
  },
]
