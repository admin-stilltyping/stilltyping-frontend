import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The business-admin app only ever authenticates business-admin users.
type Role = 'admin'

interface AuthState {
  token: string | null
  role: Role | null
  businessSlug: string | null
  username: string | null
  setAuth: (token: string, role: Role, businessSlug?: string, username?: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      businessSlug: null,
      username: null,
      setAuth: (token, role, businessSlug, username) =>
        set({ token, role, businessSlug: businessSlug ?? null, username: username ?? null }),
      clearAuth: () => set({ token: null, role: null, businessSlug: null, username: null }),
    }),
    { name: 'nivaso-auth' },
  ),
)
