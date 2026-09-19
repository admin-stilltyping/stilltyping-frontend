import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { isTokenExpired, tokenExpiresAt } from '@/utils/auth'
import { currentSubdomainSlug } from '@/utils/tenant'
import { BusinessSessionContext } from './BusinessSession'
import { PortalSkeleton } from '@/components/ui/LoadingState'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const expired = !!token && isTokenExpired(token)
  const session = useQuery({
    queryKey: ['business-session', token],
    queryFn: authApi.me,
    enabled: !!token && !expired,
    retry: false,
  })
  useEffect(() => {
    if (!token) return
    // Expire locally even while idle, without polling /me. Checking on tab
    // return also covers browsers that suspend timers while in the background.
    const expireSession = () => {
      if (isTokenExpired(token) && useAuthStore.getState().token === token) {
        clearAuth()
        qc.clear()
      }
    }
    expireSession()
    const timeout = window.setTimeout(
      expireSession,
      Math.max(0, (tokenExpiresAt(token) ?? 0) * 1000 - Date.now()),
    )
    document.addEventListener('visibilitychange', expireSession)
    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', expireSession)
    }
  }, [token, clearAuth, qc])
  if (!token || expired) return <Navigate to={expired ? '/login?expired=1' : '/login'} replace />
  if (session.isPending)
    return <PortalSkeleton />
  if (session.isError)
    return (
      <div role="alert" className="space-y-4 p-8 text-center text-gray-700">
        <p>Unable to verify your session. Please check the connection.</p>
        <button className="text-blue-600 underline" onClick={() => void session.refetch()}>
          Retry
        </button>
      </div>
    )
  const hostSlug = currentSubdomainSlug()
  if (hostSlug && session.data.business.slug !== hostSlug)
    return (
      <div className="space-y-4 p-8 text-center text-gray-700">
        <p>This session belongs to a different business. Sign in for this subdomain to continue.</p>
        <button
          className="text-blue-600 underline"
          onClick={() => {
            clearAuth()
            qc.clear()
          }}
        >
          Go to sign in
        </button>
      </div>
    )
  return (
    <BusinessSessionContext.Provider value={session.data}>
      {children}
    </BusinessSessionContext.Provider>
  )
}
