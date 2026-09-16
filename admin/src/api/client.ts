import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach JWT or fall back to dev API key ──────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  } else {
    const key = import.meta.env.VITE_INTERNAL_API_KEY
    if (key) config.headers['X-Internal-Key'] = key
  }
  return config
})

// ── Response: on 401, clear auth and redirect to login ───────────────────────
apiClient.interceptors.response.use(
  (response) => {
    // Guard: if the backend is unreachable or VITE_API_BASE_URL is wrong,
    // the SPA fallback (index.html) is returned as a 200 with HTML content.
    // Treat that as an error so React Query never stores HTML as query data —
    // which would cause "t.map is not a function" when components call .map()
    // on what they expect to be a JSON array.
    if (typeof response.data === 'string' && response.data.trimStart().startsWith('<')) {
      return Promise.reject(
        new Error(
          'API returned HTML instead of JSON. ' +
          'Check VITE_API_BASE_URL is set correctly in your environment.'
        )
      )
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const { token, clearAuth } = useAuthStore.getState()
      // Only redirect when we had a JWT — avoid redirect loops on the login
      // page itself (which fires /auth/login and legitimately gets 401 on
      // bad credentials; that shouldn't kick the user to another login page).
      if (token) {
        clearAuth()
        const next = encodeURIComponent(window.location.pathname)
        window.location.replace(`/login?expired=1&next=${next}`)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
