import { businessPortalUrl } from '@nivaso/types'
import { isAxiosError } from 'axios'

export function portalUrl(slug: string): string {
  return businessPortalUrl(slug, import.meta.env.VITE_WEB_URL || 'http://localhost:5173')
}

export function businessError(error: unknown, fallback: string): string {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message || fallback
  }
  return fallback
}
