import { defineConfig, devices } from '@playwright/test';

const port = 5173;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL,
        // the popup formats dates with the browser locale and time zone, so both need to be fixed
        // for the expected date strings to be stable
        locale: 'en-US',
        timezoneId: 'Europe/Berlin',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ],
    webServer: {
        // the popup is served by the dev server, with the extension APIs mocked (see web-ext/browser.ts)
        command: 'pnpm exec vite',
        url: `${baseURL}/popup/main.html`,
        reuseExistingServer: !process.env.CI,
    },
});
