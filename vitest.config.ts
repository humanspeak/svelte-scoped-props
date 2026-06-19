import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.svelte-kit/**', '**/e2e/**', '**/docs/**'],
    environment: 'node'
  }
});
