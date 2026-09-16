import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { validBusinessSlug } from '@nivaso/types'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { currentSubdomainSlug } from '@/utils/tenant'
import { isTokenExpired } from '@/utils/auth'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50'

export function LoginPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const { token, role, setAuth } = useAuthStore()
  const setSelectedBusinessSlug = useAppStore((s) => s.setSelectedBusinessSlug)
  const hostSlug = currentSubdomainSlug()
  const [businessSlug, setBusinessSlug] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const branding = useQuery({
    queryKey: ['business-branding', hostSlug],
    queryFn: () => authApi.branding(hostSlug!),
    enabled: !!hostSlug,
    retry: false,
  })
  const slug = hostSlug ?? businessSlug.trim()
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'

  if (token && role === 'admin' && !isTokenExpired(token)) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validBusinessSlug(slug) || (hostSlug && !branding.data)) return
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username.trim(), password, slug)
      qc.clear()
      setAuth(res.access_token, 'admin', res.business_slug, res.username)
      setSelectedBusinessSlug(res.business_slug)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.error?.message ??
              'Unable to sign in. Please check the connection.')
          : 'Unable to sign in.',
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="break-words text-2xl font-bold text-gray-900">
            {branding.data?.name ?? 'Nivaso'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your business portal</p>
          {hostSlug && (
            <p className="mt-2 break-all font-mono text-xs text-gray-400">{window.location.host}</p>
          )}
        </div>
        {params.get('expired') === '1' && (
          <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            Your session expired. Please sign in again.
          </p>
        )}
        {hostSlug && branding.isPending ? (
          <p className="text-center text-gray-500">Loading business…</p>
        ) : hostSlug && branding.isError ? (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-red-200 bg-white p-6 text-sm text-gray-600"
          >
            <p>
              {axios.isAxiosError(branding.error) && branding.error.response?.status === 404
                ? 'This business portal is unavailable. Check the subdomain or contact your platform administrator.'
                : 'Unable to load this business. Please check the connection.'}
            </p>
            <button className="text-blue-600 underline" onClick={() => void branding.refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            {!hostSlug && (
              <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                Business slug
                <input
                  value={businessSlug}
                  onChange={(e) => setBusinessSlug(e.target.value.toLowerCase())}
                  required
                  maxLength={63}
                  placeholder="bright-smile-dental"
                  disabled={loading}
                  className={inputClass}
                />
              </label>
            )}
            <label className="block space-y-1.5 text-sm font-medium text-gray-700">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={loading}
                className={inputClass}
              />
            </label>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={loading || !username.trim() || !password || !validBusinessSlug(slug)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-500">
          Use the login details provided by your platform administrator.
        </p>
        <div className="mt-4 text-center">
          <a
            href={`${adminUrl.replace(/\/$/, '')}/login`}
            className="text-xs text-gray-400 hover:text-violet-600"
          >
            Sign in as Super Admin
          </a>
        </div>
      </div>
    </div>
  )
}
