import { format } from 'date-fns'

export function formatCurrency(amount: string, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(
    parseFloat(amount),
  )
}

export function formatDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, HH:mm')
}

/** `12480` → `₹12,480` (whole rupees — dashboards rarely need paise). */
export function formatMoney(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** `12480` → `₹12.5K`, `1240000` → `₹12.4L` — compact money for tiles. */
export function formatMoneyCompact(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/** `1284` → `1,284`. */
export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-IN').format(n)
}

/** `1284` → `1.3K` — compact counts for tiles. */
export function formatCompact(n: number) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

/** `0.423` → `42%`. Pass `digits` for e.g. `42.3%`. */
export function formatPercent(ratio: number, digits = 0) {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** Signed delta for stat tiles: `0.18` → `+18%`, `-0.04` → `-4%`. */
export function formatDelta(ratio: number, digits = 0) {
  const sign = ratio > 0 ? '+' : ''
  return `${sign}${(ratio * 100).toFixed(digits)}%`
}

