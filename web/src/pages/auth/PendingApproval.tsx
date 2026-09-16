import { Link, useLocation } from 'react-router-dom'
import { Clock3 } from 'lucide-react'

interface PendingApprovalState {
  businessName?: string
  businessSlug?: string
  requestedModuleLabels?: string[]
}

export function PendingApproval() {
  const location = useLocation()
  const state = (location.state ?? {}) as PendingApprovalState
  const requestedModuleLabels = state.requestedModuleLabels ?? []

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <Clock3 className="h-6 w-6 text-amber-600" />
          </div>

          <h1 className="text-xl font-bold text-gray-900">Application submitted</h1>

          {state.businessName ? (
            <p className="mt-2 text-sm text-gray-600">
              Thanks for signing up, <strong className="font-semibold text-gray-800">{state.businessName}</strong>
              {state.businessSlug && (
                <>
                  {' '}(<span className="font-mono">{state.businessSlug}</span>)
                </>
              )}
              . Your application has been submitted and is awaiting approval from our team.
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Your application has been submitted and is awaiting approval from our team.
            </p>
          )}

          <p className="mt-4 text-sm text-gray-500">
            We'll let you know once your business account has been approved. You won't be
            able to sign in until then.
          </p>

          {requestedModuleLabels.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              You've also requested: <strong className="font-semibold text-gray-700">{requestedModuleLabels.join(', ')}</strong>
            </p>
          )}

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
