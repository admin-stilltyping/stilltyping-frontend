/** Decode the JWT payload and check whether it has expired client-side.
 *
 * This is a fast pre-flight check before making API calls. The server still
 * validates the signature and expiry — this just prevents firing requests we
 * know will fail and gives us an immediate redirect rather than waiting for
 * the round-trip 401.
 */
export function isTokenExpired(token: string | null): boolean {
  const expiresAt = tokenExpiresAt(token)
  return expiresAt === null || expiresAt <= Math.floor(Date.now() / 1000)
}

/** Extract the expiry timestamp (Unix seconds) from a JWT, or null. */
export function tokenExpiresAt(token: string | null): number | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts.some((part) => !part)) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' && Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

export function isCredentialRequest(requestUrl: string | undefined): boolean {
  return requestUrl === '/auth/login' || requestUrl === '/auth/signup'
}

/** A failed password attempt or an old request must not clear a newer session. */
export function shouldExpireSession(
  requestUrl: string | undefined,
  requestAuthorization: unknown,
  currentToken: string | null,
): boolean {
  return (
    !isCredentialRequest(requestUrl) &&
    !!currentToken &&
    requestAuthorization === `Bearer ${currentToken}`
  )
}
