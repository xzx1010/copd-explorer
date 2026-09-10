import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    env: {
      VITE_API_BASE_URL: '',
      VITE_USE_MOCK_API: 'true',
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    maxWorkers: 1,
    pool: 'threads',
    setupFiles: ['./src/test/setup.ts'],
  },
})
