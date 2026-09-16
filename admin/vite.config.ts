import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/super-admin': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/module-catalog': 'http://localhost:8000',
    },
  },
})
