import { Lock } from 'lucide-react'
import { useEntitlementStore } from '@/store/entitlementStore'
import { useBusinessSession } from '@/components/auth/BusinessSession'
import { flagEnabled, type FlagKey } from '@nivaso/types'
import { InlineLoading } from './LoadingState'

interface FeatureGateProps {
  flag: FlagKey
  label: string
  children: React.ReactNode
  silent?: boolean
}

export function FeatureGate({ flag, label, children, silent = false }: FeatureGateProps) {
  const entitlements = useEntitlementStore((s) => s.entitlements)
  const isLoaded = useEntitlementStore((s) => s.isLoaded)
  const { business } = useBusinessSession()
  if (!isLoaded) return silent ? null : <InlineLoading label="Loading module access…" />
  if (entitlements?.business_id === business._id && flagEnabled(entitlements, flag)) return <>{children}</>
  if (silent) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5">
      <Lock className="mt-0.5 h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm font-semibold text-gray-700">{label} is not enabled</p>
        <p className="mt-1 text-sm text-gray-500">Contact your super-admin to enable this module for your business.</p>
      </div>
    </div>
  )
}
