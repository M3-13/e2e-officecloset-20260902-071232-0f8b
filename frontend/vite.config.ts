import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: apiUrl, changeOrigin: true },
        '/uploads': { target: apiUrl, changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
    },
  }
})
