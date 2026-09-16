import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  selectedBusinessSlug: string
  setSelectedBusinessSlug: (slug: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedBusinessSlug: import.meta.env.VITE_DEFAULT_BUSINESS_SLUG ?? '',
      setSelectedBusinessSlug: (slug) => set({ selectedBusinessSlug: slug }),
    }),
    { name: 'nivaso-app-store' },
  ),
)
