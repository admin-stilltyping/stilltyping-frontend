import { AlertCircle, RefreshCw } from 'lucide-react'
import { apiError } from '@/utils/apiError'

export function ErrorState({ error, title = 'Unable to load this page', onRetry }: { error: unknown; title?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-red-900">{title}</h2>
        <p className="mt-1 break-words text-sm text-red-700">{apiError(error, 'Please check your connection and try again.')}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</button>}
      </div>
    </div>
  )
}
