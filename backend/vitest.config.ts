import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    environment: 'node',
    reporters: 'default',
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov', 'html']
    },
    hookTimeout: 30000,
    testTimeout: 30000
  }
});
