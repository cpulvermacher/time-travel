import { test as base } from '@playwright/test';
import { Popup } from './pages/popup';

/** The fake system time the popup runs at, unless a test overrides it with
 * `test.use({ systemTime: ... })`.
 *
 * Europe/Berlin (the browser time zone, see playwright.config.ts) is UTC+2 at that date, so the
 * popup shows 14:00 as the current time. */
export const defaultSystemTime = '2025-07-15T12:00:00Z';

type Options = {
    /** Fake system time the popup sees. It stands still until a test moves it with
     * `Popup.advanceClock()`, which keeps everything derived from the current time (the prefilled
     * date, the ticking page time, the UTC offset comparison) stable whenever the tests run. */
    systemTime: string;
    /** Whether the extension was already used in the tab, i.e. its content script is injected.
     * Chrome only injects it on first use, which needs a tab reload. */
    contentScriptActive: boolean;
    /** Whether to render the Android UI, which has a few mobile-only controls (see isAndroid()). */
    mobile: boolean;
};

type Fixtures = {
    popup: Popup;
};

export const test = base.extend<Options & Fixtures>({
    systemTime: [defaultSystemTime, { option: true }],
    contentScriptActive: [true, { option: true }],
    mobile: [false, { option: true }],

    popup: async ({ page, systemTime, contentScriptActive, mobile }, use) => {
        // must happen before the popup is opened, so the whole UI is rendered with the fake clock
        await page.clock.install({ time: systemTime });

        const popup = new Popup(page, mobile);
        if (contentScriptActive) {
            await popup.markContentScriptActive();
        }
        await popup.open();

        await use(popup);
    },
});

export { expect } from '@playwright/test';
