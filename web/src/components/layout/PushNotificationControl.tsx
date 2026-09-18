import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing, LoaderCircle } from 'lucide-react'
import { pushApi } from '@/api/push'
import { disablePush, enablePush, pushEnabled, pushSupport } from '@/utils/push'
import { apiError } from '@/utils/apiError'

export function PushNotificationControl({ slug }: { slug: string }) {
  const [support] = useState(pushSupport)
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState(() => 'Notification' in window ? Notification.permission : 'default')
  const config = useQuery({ queryKey: ['push-config', slug], queryFn: () => pushApi.config(slug), enabled: support === 'supported', staleTime: 60_000, retry: false })
  useEffect(() => {
    let active = true
    pushEnabled(slug).then(value => { if (active) setEnabled(value) }).catch(() => {
      if (active) setError('Could not check this device. Please try again.')
    }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [slug])
  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      if (enabled) await disablePush(slug)
      else if (config.data?.public_key) await enablePush(slug, config.data.public_key)
      else throw new Error('Browser notifications are not available yet.')
      setEnabled(!enabled)
    } catch (e) { setError(apiError(e, 'Could not update browser notifications. Please try again.')) }
    finally {
      setPermission(Notification.permission)
      setBusy(false)
    }
  }
  return <div className="space-y-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-medium text-gray-800"><BellRing className="h-4 w-4" /> Browser notifications</div>
    <p className="text-xs leading-5 text-gray-500">New support tickets, appointments, and orders.</p>
    {support === 'install' ? <p className="text-xs leading-5 text-gray-600">On iPhone or iPad, add this portal to your Home Screen, open it there, then enable notifications.</p>
      : support === 'unsupported' ? <p className="text-xs text-gray-600">This browser does not support push notifications. Your alerts are still available here.</p>
      : permission === 'denied' ? <p className="text-xs leading-5 text-amber-700">Notifications are blocked. Allow them in your browser’s site settings, then reopen this panel.</p>
      : checking || config.isPending ? <div role="status" className="flex items-center gap-2 text-xs text-gray-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Checking this device…</div>
      : config.isError ? <button onClick={() => void config.refetch()} className="text-xs text-blue-600 underline">Could not load settings. Try again</button>
      : !config.data?.configured && !enabled ? <p className="text-xs text-gray-500">Browser notifications will be available after setup.</p>
      : <div className="flex items-center justify-between gap-2">
        {enabled && <span role="status" className="text-xs font-medium text-emerald-700">Enabled on this device</span>}
        <button disabled={busy} onClick={() => void toggle()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
          {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{enabled ? 'Turn off' : 'Enable on this device'}
        </button>
      </div>}
    {error && <p role="alert" className="text-xs leading-5 text-red-700">{error}</p>}
  </div>
}
