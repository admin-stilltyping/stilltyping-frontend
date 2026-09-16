import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/api/superAdmin'
import { cn } from '@/utils/cn'

const ACTION_COLORS: Record<string, string> = {
  plan_changed:      'bg-blue-900 text-blue-300',
  overrides_set:     'bg-violet-900 text-violet-300',
  status_changed:    'bg-amber-900 text-amber-300',
  request_approved:  'bg-green-900 text-green-300',
  request_denied:    'bg-red-900 text-red-300',
}

export function SuperAdminAuditLog() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['super-admin-audit'],
    queryFn: () => superAdminApi.listAuditLog(),
    staleTime: 30_000,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-gray-400">Every plan change, override, and request review — most recent first.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-800" />)}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-600">No audit entries yet.</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-left">
              <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">When</th>
              <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Business</th>
              <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Action</th>
              <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">Details</th>
              <th className="px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-gray-900">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-gray-300">{e.business_slug}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ACTION_COLORS[e.action] ?? 'bg-gray-800 text-gray-400')}>
                    {e.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono max-w-xs truncate">
                  {JSON.stringify(e.details)}
                </td>
                <td className="px-4 py-3 text-gray-500">{e.performed_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
