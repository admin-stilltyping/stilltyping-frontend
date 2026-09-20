/** Provider omissions are unknown, never a fabricated zero. Partial sums are lower bounds. */
export function usageTokens(value: number, complete: boolean): string {
  if (!complete && value === 0) return 'Not reported'
  return value.toLocaleString('en-IN') + (complete ? '' : '+')
}

export function usageSeconds(milliseconds: number | null): string {
  if (milliseconds === null) return '—'
  if (milliseconds > 0 && milliseconds < 10) return '<0.01 s'
  return `${(milliseconds / 1000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`
}

export function calendarDate(daysBack = 0, timeZone?: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  const date = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - daysBack)
  return date.toISOString().slice(0, 10)
}

/** Older deployments and historical records cannot establish cache usage. */
export function cacheTokens(value: number | null | undefined, complete = true): string {
  return value == null ? 'Not reported' : usageTokens(value, complete)
}

/** A reply can contain both cached and fresh input across several model calls. */
export function replyCacheStatus(cachedInput: number | null | undefined): 'Used cache' | 'No cache used' | 'Not reported' {
  if (cachedInput == null) return 'Not reported'
  return cachedInput > 0 ? 'Used cache' : 'No cache used'
}

/** Unknown requests are not cache misses and must not lower the hit rate. */
export function cacheRequestRate(cached: number | undefined, uncached: number | undefined): string {
  if (cached == null || uncached == null || cached + uncached === 0) return 'Not reported'
  return `${(cached / (cached + uncached) * 100).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`
}
