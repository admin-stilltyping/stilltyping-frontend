import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { superAdminApi } from '@/api/superAdmin'
import { businessError, portalUrl } from '@/utils/business'
import { BusinessModulesSettings } from '@/features/business-modules/BusinessModulesSettings'

export function SuperAdminBusinessDetail() {
  const { slug = '' } = useParams()
  const qc = useQueryClient()
  const business = useQuery({
    queryKey: ['super-admin-business', slug],
    queryFn: () => superAdminApi.getBusiness(slug),
    enabled: !!slug,
  })
  const update = useMutation({
    mutationFn: (change: { status: string } | { plan: string | null }) =>
      'status' in change
        ? superAdminApi.setStatus(slug, change.status)
        : superAdminApi.setPlan(slug, change.plan),
    onSuccess: (record) => {
      qc.setQueryData(['super-admin-business', slug], record)
      void qc.invalidateQueries({ queryKey: ['super-admin-businesses'] })
    },
  })
  const record = business.data
  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/businesses"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Businesses
      </Link>
      {business.isLoading && <p className="text-gray-400">Loading business…</p>}
      {business.isError && (
        <p role="alert" className="text-red-400">
          {businessError(business.error, 'Could not load business.')}{' '}
          <button className="underline" onClick={() => void business.refetch()}>
            Retry
          </button>
        </p>
      )}
      {record && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{record.business_name}</h1>
              <p className="mt-1 text-sm text-gray-400">Saved business profile and portal access</p>
            </div>
            <a
              href={portalUrl(record.business_slug)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm text-white hover:bg-violet-600"
            >
              Open business portal <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <dl className="grid gap-6 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:grid-cols-2">
            {[
              ['Business ID (_id)', record._id],
              ['Subdomain slug', record.business_slug],
              ['Business name', record.business_name],
              ['Timezone', record.business_timezone],
              ['Admin username', record.business_slug],
              ['Created', record.created_at ? new Date(record.created_at).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="mt-1 break-all text-sm text-gray-200">{value}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-200">
                {record.business_description || 'No description provided.'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Portal URL</dt>
              <dd className="mt-1 break-all text-sm text-violet-300">
                {portalUrl(record.business_slug)}
              </dd>
            </div>
          </dl>
          <BusinessModulesSettings key={slug} slug={slug} />
          <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="font-semibold text-white">Access and plan</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-400">
                <span className="block">Status</span>
                <select
                  aria-label="Business status"
                  value={record.business_status}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ status: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 disabled:opacity-50"
                >
                  {['active', 'suspended', 'inactive'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-400">
                <span className="block">Plan</span>
                <select
                  aria-label="Business plan"
                  value={record.plan ?? ''}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ plan: e.target.value || null })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 disabled:opacity-50"
                >
                  <option value="">No plan</option>
                  {['free', 'starter', 'pro', 'enterprise'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Suspended or inactive businesses cannot sign in or access their profile. Plan
              selection is saved; feature limits will be configured separately.
            </p>
            {update.isPending && (
              <p role="status" className="text-sm text-gray-400">
                Saving…
              </p>
            )}
            {update.isSuccess && (
              <p role="status" className="text-sm text-green-400">
                Changes saved.
              </p>
            )}
            {update.isError && (
              <p role="alert" className="text-sm text-red-400">
                {businessError(update.error, 'Could not save changes.')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
