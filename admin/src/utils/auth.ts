/** Decode the JWT payload and check whether it has expired client-side.
 *
 * This is a fast pre-flight check before making API calls. The server still
 * validates the signature and expiry — this just prevents firing requests we
 * know will fail and gives us an immediate redirect rather than waiting for
 * the round-trip 401.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds; Date.now() is in ms
    return payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true // malformed token → treat as expired
  }
}

/** Extract the expiry timestamp (Unix seconds) from a JWT, or null. */
export function tokenExpiresAt(token: string | null): number | null {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1])).exp ?? null
  } catch {
    return null
  }
}
