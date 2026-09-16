import { createContext, useContext } from 'react'
import type { BusinessRecord } from '@nivaso/types'

export interface BusinessSession {
  username: string
  role: 'admin'
  business: BusinessRecord
}
export const BusinessSessionContext = createContext<BusinessSession | null>(null)

export function useBusinessSession(): BusinessSession {
  const session = useContext(BusinessSessionContext)
  if (!session) throw new Error('Business session is required')
  return session
}
