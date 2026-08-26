import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      all: true,
      include: ['app/components/**/*.vue'],
      reporter: ['text', ['lcov', { file: 'lcov.info' }]],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85
      }
    }
  }
})
