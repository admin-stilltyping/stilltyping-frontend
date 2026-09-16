import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, X, ShieldCheck } from 'lucide-react'
import { validBusinessSlug, type CreatedBusiness } from '@nivaso/types'
import { superAdminApi } from '@/api/superAdmin'
import { businessError, portalUrl } from '@/utils/business'

const inputClass =
  'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-violet-500 focus:outline-none disabled:opacity-50'

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
      className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6 text-gray-200 shadow-2xl backdrop:bg-black/70"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-white">{title}</h2>
        {onClose && (
          <button aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {children}
    </dialog>
  )
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (business: CreatedBusiness) => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [manualSlug, setManualSlug] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(name.trim()), 300)
    return () => clearTimeout(timer)
  }, [name])
  const suggestion = useQuery({
    queryKey: ['business-slug-suggestion', debouncedName],
    queryFn: () => superAdminApi.suggestBusinessSlug(debouncedName),
    enabled: !!debouncedName && manualSlug === null,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const slug = manualSlug ?? suggestion.data ?? ''
  const generating = manualSlug === null && (name.trim() !== debouncedName || suggestion.isFetching)
  const validSlug = validBusinessSlug(slug)
  const create = useMutation({
    gcTime: 0,
    mutationFn: () =>
      superAdminApi.createBusiness({
        slug,
        name: name.trim(),
        description: description.trim(),
        timezone: timezone.trim(),
        plan,
      }),
    onSuccess: (business) => {
      void qc.invalidateQueries({ queryKey: ['super-admin-businesses'] })
      // The generated password is held only in this modal's local state.
      qc.removeQueries({ queryKey: ['business-slug-suggestion'] })
      onCreated(business)
    },
    onError: (err: unknown) =>
      setError(businessError(err, 'Failed to create business. Please try again.')),
  })
  return (
    <Modal title="New Business" onClose={create.isPending ? undefined : onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (validSlug && !generating) {
            setError('')
            create.mutate()
          }
        }}
      >
        <fieldset disabled={create.isPending} className="space-y-4">
          <label className="block space-y-1 text-xs text-gray-400">
            Business name
            <input
              autoFocus
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bright Smile Dental"
              className={inputClass}
            />
          </label>
          <div className="space-y-1">
            <label htmlFor="business-slug" className="text-xs text-gray-400">
              Subdomain slug
            </label>
            <input
              id="business-slug"
              required
              maxLength={63}
              value={generating ? '' : slug}
              onChange={(e) => setManualSlug(e.target.value.toLowerCase())}
              placeholder={generating ? 'Generating…' : 'bright-smile-dental'}
              className={inputClass}
            />
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-gray-500">3–63 lowercase letters, numbers or hyphens.</span>
              {manualSlug !== null && (
                <button
                  type="button"
                  className="shrink-0 text-violet-400"
                  onClick={() => setManualSlug(null)}
                >
                  Use business name
                </button>
              )}
            </div>
            {validSlug && !generating && (
              <p className="break-all text-xs text-violet-300">{portalUrl(slug)}</p>
            )}
            {!generating && slug && !validSlug && (
              <p role="alert" className="text-xs text-red-400">
                Choose a valid, non-reserved subdomain without leading or trailing hyphens.
              </p>
            )}
            {manualSlug === null && suggestion.isError && (
              <p role="alert" className="text-xs text-red-400">
                Could not suggest a slug. Enter one above or{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void suggestion.refetch()}
                >
                  retry
                </button>
                .
              </p>
            )}
          </div>
          <label className="block space-y-1 text-xs text-gray-400">
            Description (optional)
            <textarea
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1 text-xs text-gray-400">
            Timezone
            <input
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Kolkata"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1 text-xs text-gray-400">
            Initial plan
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
              {['free', 'starter', 'pro', 'enterprise'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <p className="text-xs text-gray-500">
          A business ID and an admin login will be created automatically. Save the password shown
          after creation.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          disabled={
            !name.trim() ||
            !validSlug ||
            generating ||
            create.isPending ||
            (manualSlug === null && suggestion.isError)
          }
          className="w-full rounded-lg bg-violet-700 py-2.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create Business'}
        </button>
      </form>
    </Modal>
  )
}

export function SuperAdminBusinessList() {
  const [showCreate, setShowCreate] = useState(false)
  const [created, setCreated] = useState<CreatedBusiness | null>(null)
  const businesses = useQuery({
    queryKey: ['super-admin-businesses'],
    queryFn: superAdminApi.listBusinesses,
  })
  return (
    <div>
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(business) => {
            setShowCreate(false)
            setCreated(business)
          }}
        />
      )}
      {created && (
        <Modal title="Business created — save login details">
          <ShieldCheck className="mb-3 h-6 w-6 text-green-400" />
          <p className="mb-4 text-sm text-gray-400">
            The password is shown once. Save it before closing this window.
          </p>
          <dl className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm">
            {[
              ['Business', created.name],
              ['Business ID (_id)', created._id],
              ['Username', created.admin_username],
              ['Password', created.admin_password],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="mt-1 break-all select-all font-mono">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-gray-400">Business portal</dt>
              <dd className="mt-1 break-all">
                <a
                  className="text-violet-300 underline"
                  href={portalUrl(created.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {portalUrl(created.slug)}
                </a>
              </dd>
            </div>
          </dl>
          <button
            onClick={() => setCreated(null)}
            className="mt-5 w-full rounded-lg bg-violet-700 py-2.5 text-sm font-medium text-white hover:bg-violet-600"
          >
            I've saved these credentials
          </button>
        </Modal>
      )}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Businesses</h1>
          <p className="mt-1 text-sm text-gray-400">
            Create businesses and manage their portal access.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600"
        >
          <Plus className="h-4 w-4" /> New Business
        </button>
      </div>
      {businesses.isLoading && <p className="text-gray-400">Loading businesses…</p>}
      {businesses.isError && (
        <div role="alert" className="rounded-xl border border-red-900 p-4 text-sm text-red-400">
          {businessError(businesses.error, 'Could not load businesses.')}{' '}
          <button className="underline" onClick={() => void businesses.refetch()}>
            Retry
          </button>
        </div>
      )}
      {businesses.isSuccess && businesses.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-700 p-10 text-center text-sm text-gray-400">
          No businesses yet. Create your first business to set up its portal.
        </div>
      )}
      <div className="space-y-3">
        {businesses.data?.map((biz) => (
          <Link
            key={biz._id}
            to={`/businesses/${biz.business_slug}`}
            className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition-colors hover:border-violet-800"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{biz.business_name}</p>
              <p className="mt-1 break-all text-xs text-violet-300">
                {new URL(portalUrl(biz.business_slug)).host}
              </p>
              <p className="mt-1 break-all font-mono text-xs text-gray-500">_id: {biz._id}</p>
            </div>
            <div className="text-right text-xs">
              <p className={biz.business_status === 'active' ? 'text-green-400' : 'text-amber-400'}>
                {biz.business_status}
              </p>
              <p className="mt-1 text-gray-400">{biz.plan ?? 'No plan'}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
          </Link>
        ))}
      </div>
    </div>
  )
}
