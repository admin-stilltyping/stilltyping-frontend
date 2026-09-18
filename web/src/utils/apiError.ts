import axios from 'axios'

export function apiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
    if (error.response?.status === 404) return 'This feature is not available yet. Please contact your platform administrator.'
    if (error.response?.status === 403) return 'You do not have access to this feature.'
    if (error.response && error.response.status >= 500) return 'The service is temporarily unavailable. Please try again.'
  }
  return fallback
}
