import { NavLink } from 'react-router-dom'

import { cn } from '@/utils/cn'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import { flagEnabled, type FlagKey } from '@nivaso/types'
import { navGroups } from './nav-config'
import { useBusinessSession } from '@/components/auth/BusinessSession'

export function Sidebar() {
  const slug = useTenantSlug()
  const session = useBusinessSession()
  const business = session.business

  const entitlements = useEntitlementStore((s) => s.entitlements)
  const isLoaded = useEntitlementStore((s) => s.isLoaded)
  const can = (flag: FlagKey): boolean => {
    if (!isLoaded) return false
    if (entitlements?.business_id !== session.business._id) return false
    return flagEnabled(entitlements, flag)
  }
  const businessHref = `/businesses/${slug}`

  return (
    <aside className="flex h-dvh w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-4 min-w-0">
        <span className="text-base font-bold text-blue-600 truncate" title={business?.name}>
          {business?.name ?? 'Admin Portal'}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group, gi) => {
          const visible = group.items.filter((item) => !item.flag || can(item.flag))
          if (visible.length === 0) return null
          return (
            <div key={gi}>
              {group.label && (
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visible.map(({ to, label, icon: Icon, end }) => {
                  // "Business Settings" is a sentinel entry — redirect it to
                  // the locked business's detail page when scoped.
                  const resolvedTo = to === '/business' ? businessHref : to
                  return (
                  <li key={to}>
                    <NavLink
                      to={resolvedTo}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>
      {/* No plan assigned is the normal default state (access comes from
          overrides/approved requests) — show nothing rather than a "No plan"
          badge that reads like an error. */}
      {entitlements?.plan && (
        <div className="border-t border-gray-200 px-4 py-3">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
            entitlements.plan === 'enterprise' ? 'bg-violet-100 text-violet-700' :
            entitlements.plan === 'pro'        ? 'bg-blue-100 text-blue-700' :
            entitlements.plan === 'starter'    ? 'bg-green-100 text-green-700' :
                                                 'bg-gray-100 text-gray-600',
          )}>
            {entitlements.plan} plan
          </span>
        </div>
      )}
    </aside>
  )
}
