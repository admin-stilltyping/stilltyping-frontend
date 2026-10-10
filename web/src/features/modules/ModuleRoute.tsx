import { Outlet } from 'react-router-dom'
import type { FlagKey } from '@stilltyping/types'
import { FeatureGate } from '@/components/ui/FeatureGate'

export function ModuleRoute({ flag, label }: { flag: FlagKey; label: string }) {
  return <FeatureGate flag={flag} label={label}><Outlet /></FeatureGate>
}
