import { Navigate, useParams } from 'react-router-dom'
import { useBusinessSession } from '@/components/auth/BusinessSession'

export function BusinessProfilePage() {
  const { slug } = useParams()
  const { business, username } = useBusinessSession()
  if (!slug) return <Navigate to={`/businesses/${business.slug}`} replace />
  if (slug !== business.slug)
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-white p-6 text-red-700">
        You do not have access to this business.
      </p>
    )
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Business profile</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">{business.name}</h2>
        <p className="mt-2 text-sm text-gray-500">Your saved business details</p>
      </div>
      <dl className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        {[
          ['Business ID (_id)', business._id],
          ['Subdomain slug', business.slug],
          ['Business name', business.name],
          ['Timezone', business.timezone],
          ['Status', business.status],
          ['Plan', business.plan ?? 'No plan'],
          ['Admin username', username],
          ['Created', new Date(business.created_at).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-gray-500">{label}</dt>
            <dd className="mt-1.5 break-all text-sm text-gray-900">{value}</dd>
          </div>
        ))}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-gray-500">Description</dt>
          <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm text-gray-900">
            {business.description || 'No description provided.'}
          </dd>
        </div>
      </dl>
    </div>
  )
}
