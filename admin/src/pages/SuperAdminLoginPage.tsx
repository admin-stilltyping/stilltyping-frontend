import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, AlertTriangle, LogIn } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isExpired = params.get('expired') === '1'

  const { token, role, setAuth } = useAuthStore()
  // Cross-app URL — VITE_WEB_URL should point at the real business-portal
  // subdomain in production; falls back to the web app's local Vite dev port.
  const webUrl = import.meta.env.VITE_WEB_URL || 'http://localhost:5173'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Keep every hook above the redirect when authentication changes after login.
  if (token && role === 'super_admin') return <Navigate to="/businesses" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.superAdminLogin(username.trim(), password)
      setAuth(res.access_token, 'super_admin')
      navigate('/businesses', { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message
      setError(msg ?? 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-900/50">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Platform control — restricted access</p>
        </div>

        {/* Session-expired banner */}
        {isExpired && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-800/50 bg-amber-900/20 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              Your session expired. Please sign in again.
            </p>
          </div>
        )}

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl space-y-5"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="superadmin"
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 pr-10 text-sm text-gray-100 placeholder-gray-600 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-600">
          Nivaso Platform · Super Admin Access
        </p>

        <div className="mt-4 text-center">
          {/* TODO: cross-app link — the business portal now lives in the separate
              `web` app/deployment. Point this at its real URL once subdomains
              (e.g. app.nivaso.xyz) are wired up.
              Built from VITE_WEB_URL (falls back to the web app's dev port)
              since this route lives in a different Vite app, not this router. */}
          <a
            href={`${webUrl}/login`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-violet-400 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in to your business portal
          </a>
        </div>
      </div>
    </div>
  )
}
