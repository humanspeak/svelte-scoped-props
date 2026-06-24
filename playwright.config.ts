import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    reporter: [['junit', { outputFile: 'junit-playwright.xml' }]],
    webServer: {
        command:
            'pnpm run build && pnpm run sync && pnpm exec vite dev --host 127.0.0.1 --port 4173 --strictPort',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        stdout: 'pipe',
        stderr: 'pipe'
    },
    use: {
        baseURL: 'http://127.0.0.1:4173',
        screenshot: 'on',
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
})
