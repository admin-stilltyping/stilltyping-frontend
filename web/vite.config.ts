import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Portal domain and API configuration live in the monorepo root .env.
  envDir: '..',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Keep the portal's /webhooks page on Vite; proxy only the callback.
      '/webhooks/instagram': 'http://localhost:8000',
      // context-agent backend lives under /api/v1/* (tenant-scoped, no auth).
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      // Match the public-chat API path, not the portal's /webhooks page.
      '^/web(?:/|$)': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/module-catalog': 'http://localhost:8000',
    },
  },
})
