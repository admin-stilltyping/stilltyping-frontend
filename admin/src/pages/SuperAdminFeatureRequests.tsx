import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, CheckCheck } from 'lucide-react'
import { superAdminApi } from '@/api/superAdmin'
import { listModuleCatalog } from '@/api/moduleCatalog'
import type { FeatureRequest } from '@/types/featureRequest'
import { cn } from '@/utils/cn'

const STATUS_TABS = [
  { value: undefined,  label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied',   label: 'Denied' },
]

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:  <Clock className="h-4 w-4 text-amber-400" />,
  approved: <CheckCircle className="h-4 w-4 text-green-400" />,
  denied:   <XCircle className="h-4 w-4 text-red-400" />,
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

/** Friendly label for a feature key: "plan:<tier>" or a module-catalog key. */
function featureLabel(feature: string, catalogMap: Record<string, string>) {
  if (feature.startsWith('plan:')) {
    const tier = feature.slice('plan:'.length)
    return { primary: `Upgrade to ${capitalize(tier)} plan`, raw: feature }
  }
  return { primary: catalogMap[feature] ?? feature, raw: feature }
}

export function SuperAdminFeatureRequests() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<string | undefined>('pending')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['super-admin-requests', filter],
    queryFn: () => superAdminApi.listRequests(filter),
  })

  const { data: catalog = [] } = useQuery({
    queryKey: ['module-catalog'],
    queryFn: listModuleCatalog,
  })

  const catalogMap = useMemo(
    () => Object.fromEntries(catalog.map((c) => [c.key, c.display_name])),
    [catalog],
  )

  const { mutate: review } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'denied' }) =>
      superAdminApi.reviewRequest(id, { status, notes: notes[id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin-requests'] }),
  })

  const { mutate: approveAll, isPending: isApprovingAll } = useMutation({
    mutationFn: (slug: string) => superAdminApi.approveAllForBusiness(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-requests'] })
      setConfirmSlug(null)
    },
  })

  // Group requests by business_slug so multiple pending requests for the
  // same business can be reviewed together (and bulk-approved in one go).
  const groups = useMemo(() => {
    const map = new Map<string, FeatureRequest[]>()
    for (const req of requests) {
      const list = map.get(req.business_slug)
      if (list) list.push(req)
      else map.set(req.business_slug, [req])
    }
    return Array.from(map.entries())
  }, [requests])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Feature Requests</h1>
        <p className="text-sm text-gray-400">Review access requests from client businesses.</p>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-800">
        {STATUS_TABS.map((t) => (
          <button
            key={String(t.value)}
            onClick={() => setFilter(t.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              filter === t.value
                ? 'border-b-2 border-violet-500 text-violet-300'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />)}
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-600">No requests found.</div>
      )}

      <div className="space-y-6">
        {groups.map(([slug, groupRequests]) => {
          const pendingCount = groupRequests.filter((r) => r.status === 'pending').length
          const showApproveAll = pendingCount >= 2

          return (
            <div key={slug} className="space-y-3">
              {groups.length > 1 && (
                <div className="flex items-center gap-3 border-b border-gray-800/60 pb-1">
                  <span className="text-sm font-semibold text-gray-300">{slug}</span>
                  {showApproveAll && (
                    confirmSlug === slug ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Approve {pendingCount} requests?</span>
                        <button
                          onClick={() => approveAll(slug)}
                          disabled={isApprovingAll}
                          className="rounded-lg bg-green-700 px-2 py-1 font-medium text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmSlug(null)}
                          disabled={isApprovingAll}
                          className="rounded-lg bg-gray-800 px-2 py-1 font-medium text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmSlug(slug)}
                        className="flex items-center gap-1 rounded-lg bg-violet-900/50 px-2 py-1 text-xs font-medium text-violet-200 hover:bg-violet-800/60"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Approve All ({pendingCount})
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="space-y-3">
                {groupRequests.map((req) => {
                  const label = featureLabel(req.feature, catalogMap)
                  return (
                    <div key={req.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{STATUS_ICON[req.status] ?? STATUS_ICON.pending}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{req.business_slug}</span>
                            <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                              <span>{label.primary}</span>
                              {label.primary !== label.raw && (
                                <span className="ml-1.5 font-mono text-[10px] text-gray-500">
                                  {label.raw}
                                </span>
                              )}
                            </span>
                          </div>
                          {req.reason && (
                            <p className="mt-1 text-xs text-gray-400">{req.reason}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-600">
                            {new Date(req.created_at).toLocaleDateString()}
                            {req.reviewed_by && ` · reviewed by ${req.reviewed_by}`}
                          </p>
                          {req.notes && (
                            <p className="mt-1 text-xs italic text-gray-500">{req.notes}</p>
                          )}

                          {req.status === 'pending' && (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={notes[req.id] ?? ''}
                                onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                                placeholder="Note for the business (optional)"
                                rows={2}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => review({ id: req.id, status: 'approved' })}
                                  className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => review({ id: req.id, status: 'denied' })}
                                  className="rounded-lg bg-red-900 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-800"
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
