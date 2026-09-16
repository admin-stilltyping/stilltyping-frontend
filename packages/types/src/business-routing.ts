export const RESERVED_BUSINESS_SLUGS = new Set([
  'www',
  'app',
  'admin',
  'super-admin',
  'superadmin',
  'api',
  'auth',
  'login',
  'signup',
  'dashboard',
  'static',
  'assets',
  'mail',
  'support',
  'staging',
  'localhost',
  'general',
  'pending',
  'suggest-slug',
  'plans',
])

export function validBusinessSlug(slug: string): boolean {
  return (
    slug === slug.trim() &&
    /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug) &&
    !RESERVED_BUSINESS_SLUGS.has(slug)
  )
}

/** Resolve exactly one tenant label under a configured domain; query strings have no authority. */
export function tenantSlugFromHostname(hostname: string, baseDomain = 'localhost'): string | null {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  const base = baseDomain.toLowerCase().replace(/^\./, '').replace(/\.$/, '')
  if (!base || !host.endsWith(`.${base}`)) return null
  const label = host.slice(0, -(base.length + 1))
  return validBusinessSlug(label) ? label : null
}

export function businessPortalUrl(slug: string, baseUrl = 'http://localhost:5173'): string {
  if (!validBusinessSlug(slug)) throw new Error('Invalid business subdomain')
  const url = new URL(baseUrl)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Configure an HTTP(S) business portal URL')
  }
  // Browser-recognized localhost subdomains support local development without editing hosts files.
  const baseHost = ['127.0.0.1', '[::1]'].includes(url.hostname) ? 'localhost' : url.hostname
  url.hostname = `${slug}.${baseHost}`
  url.pathname = '/login'
  url.search = ''
  url.hash = ''
  return url.toString()
}
