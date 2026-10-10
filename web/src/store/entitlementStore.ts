import { create } from 'zustand'
import type { Entitlements } from '@stilltyping/types'
import { flagEnabled, type FlagKey } from '@stilltyping/types'

interface EntitlementState {
  entitlements: Entitlements | null
  isLoaded: boolean
  setEntitlements: (e: Entitlements | null) => void
  setLoaded: (loaded: boolean) => void
  can: (flag: FlagKey) => boolean
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  entitlements: null,
  isLoaded: false,
  setEntitlements: (e) => set({ entitlements: e }),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  can: (flag) => {
    const { entitlements, isLoaded } = get()
    if (!isLoaded) return false
    if (entitlements === null) return false
    return flagEnabled(entitlements, flag)
  },
}))
