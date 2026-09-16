import { useBusinessSession } from '@/components/auth/BusinessSession'

/** The backend verifies the token and returns the business attached to this session. */
export function useTenantSlug(): string {
  return useBusinessSession().business.slug
}
