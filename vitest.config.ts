import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        exclude: [
            '**/node_modules/**',
            '**/.github/**',
            '**/dist/**',
            '**/.svelte-kit/**',
            '**/e2e/**',
            '**/docs/**',
            '**/.trunk/**'
        ],
        environment: 'node'
    }
})
