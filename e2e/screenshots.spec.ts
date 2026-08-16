import { expect, test } from './fixtures';
import type { Popup } from './pages/popup';

// A dev tool rather than a test: it writes the popup in its main states to /screenshots, to look at
// UI changes without clicking through the popup by hand. Run it with `pnpm screenshots`; a normal
// `pnpm test:e2e` skips it.
//
// The popup renders in the browser locale and time zone (en-US, Europe/Berlin) at a fake system
// time, so the screenshots only change when the UI does. See playwright.config.ts and fixtures.ts.

const screenshotDir = 'screenshots';

// below the 301px breakpoint, so the popup renders at the narrow desktop width
test.use({ viewport: { width: 300, height: 640 }, deviceScaleFactor: 2 });

test.describe('popup screenshots', () => {
    test.skip(!process.env.SCREENSHOTS, 'run with `pnpm screenshots`');

    async function capture(popup: Popup, name: string) {
        await popup.page.screenshot({
            path: `${screenshotDir}/${name}.png`,
            fullPage: true,
            animations: 'disabled',
        });
    }

    test('fake date off', async ({ popup }) => {
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();

        await capture(popup, 'fake-date-off');
    });

    test('fake date on', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.applyButton).toHaveText('No changes');

        await capture(popup, 'fake-date-on');
    });

    test('fake date on, in another time zone', async ({ popup }) => {
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('America/New_York');
        await popup.applyButton.click();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.applyButton).toHaveText('No changes');

        await capture(popup, 'fake-date-on-other-time-zone');
    });
});
