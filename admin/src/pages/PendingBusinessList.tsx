import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Clock3 } from 'lucide-react'
import { superAdminApi } from '@/api/superAdmin'

export function PendingBusinessList() {
  const qc = useQueryClient()
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['super-admin-businesses-pending'],
    queryFn: superAdminApi.listPendingBusinesses,
  })

  const { mutate: approve, isPending: isApproving, variables: approvingSlug } = useMutation({
    mutationFn: (slug: string) => superAdminApi.approveBusiness(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-businesses-pending'] })
      qc.invalidateQueries({ queryKey: ['super-admin-businesses'] })
    },
  })

  const { mutate: reject, isPending: isRejecting, variables: rejectingSlug } = useMutation({
    mutationFn: (slug: string) => superAdminApi.rejectBusiness(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-businesses-pending'] })
      qc.invalidateQueries({ queryKey: ['super-admin-businesses'] })
    },
  })

  const handleReject = (slug: string, name: string) => {
    if (window.confirm(`Reject "${name}"? This will permanently delete the business and its admin account.`)) {
      reject(slug)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Pending Businesses</h1>
        <p className="text-sm text-gray-400">
          Review and approve or reject new business signups. Requested modules,
          integrations, and plan upgrades are reviewed separately under Feature Requests.
        </p>
      </div>

      {businesses.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-8 text-center">
          <Clock3 className="mx-auto mb-2 h-6 w-6 text-gray-600" />
          <p className="text-sm text-gray-400">No pending applications right now.</p>
        </div>
      )}

      <div className="space-y-2">
        {businesses.map((biz) => {
          const isThisApproving = isApproving && approvingSlug === biz.business_slug
          const isThisRejecting = isRejecting && rejectingSlug === biz.business_slug
          const busy = isThisApproving || isThisRejecting

          return (
            <div
              key={biz.business_id}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{biz.business_name}</p>
                <p className="text-xs text-gray-500 font-mono">{biz.business_slug}</p>
              </div>

              <span className="text-xs text-gray-500">{biz.business_timezone}</span>

              <button
                onClick={() => approve(biz.business_slug)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {isThisApproving ? 'Approving…' : 'Approve'}
              </button>

              <button
                onClick={() => handleReject(biz.business_slug, biz.business_name)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                {isThisRejecting ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
