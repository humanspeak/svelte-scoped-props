import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.svelte-kit/**',
            '**/e2e/**',
            '**/docs/**',
            '**/.trunk/**'
        ],
        environment: 'node',
        // junit feeds the trunk analytics uploader in CI (junit-vitest.xml
        // matches the workflow's junit-paths)
        reporters: process.env.CI ? ['default', 'junit'] : ['default'],
        outputFile: { junit: 'junit-vitest.xml' }
    }
})
