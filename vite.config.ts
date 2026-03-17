import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/pvgis': {
        target: 'https://re.jrc.ec.europa.eu/api/v5_3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pvgis/, ''),
      },
      '/api/eloverblik': {
        target: 'https://api.eloverblik.dk/customerapi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eloverblik/, ''),
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**'],
    },
  },
})
