import { tenantSlugFromHostname } from '@nivaso/types'

export function currentSubdomainSlug(): string | null {
  return tenantSlugFromHostname(
    window.location.hostname,
    import.meta.env.VITE_TENANT_BASE_DOMAIN || 'localhost',
  )
}

/** Legacy dashboard helper. Authenticated pages use the server-verified session. */
export function resolveTenantSlug(): string {
  return currentSubdomainSlug() ?? ''
}
