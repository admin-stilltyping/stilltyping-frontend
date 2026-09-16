import { Outlet } from 'react-router-dom'
import type { FlagKey } from '@nivaso/types'
import { FeatureGate } from '@/components/ui/FeatureGate'

export function ModuleRoute({ flag, label }: { flag: FlagKey; label: string }) {
  return <FeatureGate flag={flag} label={label}><Outlet /></FeatureGate>
}
