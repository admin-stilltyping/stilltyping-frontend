import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { isTokenExpired } from '@/utils/auth'

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  const hasDevKey = !!import.meta.env.VITE_SUPER_ADMIN_KEY

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      clearAuth()
      navigate('/login?expired=1', { replace: true })
    }
  }, [token, clearAuth, navigate])

  if (!token && !hasDevKey) {
    return <Navigate to="/login" replace />
  }

  if (token && role !== 'super_admin') {
    return <Navigate to="/login" replace />
  }

  if (token && isTokenExpired(token)) {
    return null
  }

  return <>{children}</>
}
