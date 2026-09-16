import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, AlertTriangle, UserPlus } from 'lucide-react'
import { Input, Select, Button, Spinner } from '@nivaso/ui'
import { authApi } from '@/api/auth'
import { listModuleCatalog } from '@/api/moduleCatalog'

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'UTC', label: 'UTC' },
]

export function SignupPage() {
  const navigate = useNavigate()

  const [slug, setSlug] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requestedModules, setRequestedModules] = useState<string[]>([])

  const {
    data: moduleCatalog,
    isLoading: catalogLoading,
    isError: catalogError,
  } = useQuery({
    queryKey: ['module-catalog'],
    queryFn: listModuleCatalog,
  })

  const moduleEntries = moduleCatalog?.filter((m) => m.category === 'module') ?? []
  const integrationEntries = moduleCatalog?.filter((m) => m.category === 'integration') ?? []

  const toggleModule = (key: string) => {
    setRequestedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    )
  }

  const [slugError, setSlugError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSlugError('')
    setPasswordError('')
    setFormError('')

    if (adminPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.signup({
        slug: slug.trim(),
        business_name: businessName.trim(),
        timezone,
        admin_username: adminUsername.trim(),
        admin_password: adminPassword,
        requested_modules: requestedModules,
      })
      const finalKeys = res.requested_modules ?? requestedModules
      const requestedModuleLabels = finalKeys.map(
        (key) => moduleCatalog?.find((m) => m.key === key)?.display_name ?? key,
      )
      navigate('/pending-approval', {
        replace: true,
        state: {
          businessName: res.business_name,
          businessSlug: res.business_slug,
          requestedModuleLabels,
        },
      })
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSlugError(
          err?.response?.data?.error?.message ?? `The slug "${slug}" is already taken.`,
        )
      } else {
        const msg = err?.response?.data?.error?.message
        setFormError(msg ?? 'Something went wrong. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nivaso</h1>
          <p className="mt-1 text-sm text-gray-500">Create your business account</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5"
        >
          <Input
            label="Business slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="dental-clinic-mumbai"
            required
            autoFocus
            autoComplete="off"
            disabled={loading}
            error={slugError}
          />

          <Input
            label="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Bright Smile Dental"
            required
            autoComplete="organization"
            disabled={loading}
          />

          <Select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={TIMEZONES}
            disabled={loading}
          />

          <Input
            label="Admin username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            placeholder="your-business-slug"
            required
            autoComplete="username"
            disabled={loading}
          />

          <div className="space-y-1.5">
            <div className="relative">
              <Input
                label="Admin password"
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                disabled={loading}
                error={passwordError}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Elective modules & integrations */}
          {catalogLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3.5">
              <Spinner />
            </div>
          ) : catalogError ? null : (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3.5">
              <p className="text-sm font-medium text-gray-700">Which features would you like?</p>
              <p className="text-xs text-gray-500">
                Select the modules and integrations you'd like. Our team will review your
                request before enabling them.
              </p>

              {moduleEntries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Modules
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {moduleEntries.map((mod) => (
                      <label
                        key={mod.key}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={requestedModules.includes(mod.key)}
                          onChange={() => toggleModule(mod.key)}
                          disabled={loading}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {mod.display_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {integrationEntries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Integrations
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {integrationEntries.map((mod) => (
                      <label
                        key={mod.key}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={requestedModules.includes(mod.key)}
                          onChange={() => toggleModule(mod.key)}
                          disabled={loading}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {mod.display_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form-level error */}
          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading || !slug.trim() || !businessName.trim() || !adminUsername.trim() || !adminPassword}
            className="w-full justify-center"
          >
            {loading ? 'Submitting…' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have a business account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
