import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { entitlementsApi } from '@/api/entitlements'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useEntitlementStore } from '@/store/entitlementStore'
import { useBusinessSession } from '@/components/auth/BusinessSession'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/businesses': 'Business Profile',
  '/products': 'Products',
  '/services': 'Services',
  '/appointments': 'Appointments',
  '/leads': 'Leads',
  '/support': 'Support Tickets',
  '/customers': 'Customers',
  '/knowledge': 'Knowledge Base',
  '/orders': 'Orders',
  '/webhooks': 'Webhook Events',
  '/agent-runs': 'Agent Runs',
  '/chat': 'Agent Chat',
}

export function Layout() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = pageTitles[base] ?? 'Admin Portal'

  const slug = useTenantSlug()
  const { business } = useBusinessSession()
  const stored = useEntitlementStore((s) => s.entitlements)
  const loaded = useEntitlementStore((s) => s.isLoaded)
  const setEntitlements = useEntitlementStore((s) => s.setEntitlements)
  const setLoaded = useEntitlementStore((s) => s.setLoaded)

  const { data, status, refetch } = useQuery({
    queryKey: ['entitlements', slug],
    queryFn: () => entitlementsApi.get(slug),
    enabled: !!slug,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    retry: 1,
  })

  useEffect(() => {
    if (!slug) {
      setEntitlements(null)
      setLoaded(true)
      return
    }
    if (status === 'pending') {
      setLoaded(false)
      return
    }
    if (status === 'success') {
      setEntitlements(data)
    } else {
      setEntitlements(null)
    }
    setLoaded(true)
  }, [slug, status, data, setEntitlements, setLoaded])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden shrink-0 md:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {status === 'error' || (data && data.business_id !== business._id) ? (
            <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p>Could not verify module access. Please try again.</p>
              <button className="underline" onClick={() => void refetch()}>Retry</button>
            </div>
          ) : status !== 'success' || !loaded || stored !== data ? (
            <p role="status" className="text-sm text-gray-500">Loading module access…</p>
          ) : <Outlet />}
        </main>
      </div>
    </div>
  )
}
