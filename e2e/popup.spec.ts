import { expect, test } from './fixtures';

/** the page time shown right after applying 2025-04-27 12:40, i.e. before the clock advances */
const appliedPageTime = 'Apr 27, 2025 12:40:00 PM';

test.describe('setting a date', () => {
    test('applies the date via the apply button', async ({ popup }) => {
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();

        await popup.setDate('2025-04-27 12:40');
        await expect(popup.applyButton).toHaveText('Change date to Apr 27, 2025 12:40 PM');
        await popup.applyButton.click();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await expect(popup.realTimeNote).not.toBeVisible();
        await expect(popup.applyButton).toHaveText('No changes');
        await expect(popup.applyButton).toBeDisabled();
    });

    test('applies the date via the enable toggle', async ({ popup }) => {
        await popup.setDate('2025-04-27 12:40');
        await expect(popup.pageTime).not.toHaveText(appliedPageTime);

        await popup.fakeDateToggle.click();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await expect(popup.applyButton).toHaveText('No changes');
    });

    test('applies a date picked in the calendar', async ({ popup }) => {
        await popup.setDate('2025-04-27 12:40');

        await popup.calendarDay(15).click();

        // picking a day only replaces the date, the time is kept
        await expect(popup.dateInput).toHaveValue('2025-04-15 12:40');
        // and the time is selected in the focused input, so it can be typed over right away
        await expect(popup.dateInput).toBeFocused();
        expect(await popup.selectedDateInputText()).toBe('12:40');

        await popup.page.keyboard.type('08:15');
        await expect(popup.dateInput).toHaveValue('2025-04-15 08:15');
        await popup.dateInput.press('Enter');

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(/Apr 15, 2025\s+8:15:\d\d\s*AM/);
    });

    test('keeps the fake date when the popup is reopened', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        await popup.reopen();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await expect(popup.dateInput).toHaveValue(/^2025-04-27 12:40/);
    });
});

test.describe('prefilling the current date and time', () => {
    // the system time is frozen, so the prefilled date is stable (Europe/Berlin, see
    // playwright.config.ts, is UTC+2 in July)
    test.use({ systemTime: '2025-07-15T12:00:00Z' });

    test('prefills the input with the current date and time', async ({ popup }) => {
        await expect(popup.dateInput).toHaveValue('2025-07-15 14:00');
        await expect(popup.applyButton).toHaveText('Change date to Jul 15, 2025 2:00 PM');
        // nothing is applied yet, the page still sees the real date
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();
    });

    test('opens the calendar on the current month', async ({ popup }) => {
        await popup.calendarDay(20).click();

        await expect(popup.dateInput).toHaveValue('2025-07-20 14:00');
    });
});

test.describe('disabling', () => {
    // the system time is frozen, so the date prefilled after disabling is stable
    test.use({ systemTime: '2025-07-15T12:00:00Z' });

    test('turns off the fake date via the enable toggle', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        await popup.fakeDateToggle.click();

        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.pageTime).not.toHaveText(appliedPageTime);
        await expect(popup.realTimeNote).toBeVisible();

        // and it stays off after reopening the popup
        await popup.reopen();
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();
    });

    test('turns off the fake date when the input is cleared', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        await popup.setDate('');
        await expect(popup.applyButton).toHaveText('Disable fake date');
        await popup.dateInput.press('Enter');

        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();
        // and the input is prefilled with the current date again
        await expect(popup.dateInput).toHaveValue('2025-07-15 14:00');
    });
});

test.describe('stopping the clock', () => {
    test('stops and resumes the clock', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        // while the clock runs, the page time follows the system time
        await popup.advanceClock(5000);
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:05 PM');

        await popup.stopClockToggle.set(true);

        // stopping resets the page to the date that was set last, and holds it there
        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await popup.advanceClock(5000);
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        await popup.stopClockToggle.set(false);

        // resuming restarts from that date
        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await popup.advanceClock(3000);
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:03 PM');
    });

    test('applies a date with the clock already stopped', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await popup.advanceClock(5000);
        await expect(popup.pageTime).toHaveText(appliedPageTime);
    });
});

test.describe('auto-reload', () => {
    test('reloads the tab after applying a date', async ({ popup }) => {
        await popup.autoReloadToggle.set(true);

        await popup.applyWithButton('2025-04-27 12:40');

        await expect.poll(() => popup.tabReloads(), { message: 'tab should be reloaded' }).toBe(1);
        await expect(popup.reloadModal).toHaveCount(0);
    });

    test('does not reload the tab when switched off', async ({ popup }) => {
        await expect(popup.autoReloadToggle.checkbox).not.toBeChecked();

        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(appliedPageTime);

        expect(popup.tabReloads()).toBe(0);
    });

    test('remembers the setting', async ({ popup }) => {
        await popup.autoReloadToggle.set(true);

        await popup.reopen();

        await expect(popup.autoReloadToggle.checkbox).toBeChecked();
    });
});

test.describe('first use in a tab', () => {
    test.use({ contentScriptActive: false });
    // Firefox injects the content script via its manifest, so it is active without a reload
    test.skip(
        ({ browserName }) => browserName !== 'chromium',
        'only Chrome needs a reload to inject the content script'
    );

    test('asks for a reload after applying a date', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.reloadModal).toBeVisible();
    });

    test('asks for a reload after enabling via the toggle', async ({ popup }) => {
        await popup.setDate('2025-04-27 12:40');

        await popup.fakeDateToggle.click();

        await expect(popup.reloadModal).toBeVisible();
    });

    test('reloads the tab when confirming the prompt', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.reloadButton).toBeVisible();

        await popup.reloadButton.click();

        await expect.poll(() => popup.tabReloads(), { message: 'tab should be reloaded' }).toBe(1);
    });

    test('does not ask for a reload again on later changes', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.reloadModal).toBeVisible();

        await popup.reopen();
        await popup.applyWithButton('2025-04-28 12:40');

        await expect(popup.pageTime).toHaveText(/Apr 28, 2025/);
        await expect(popup.reloadModal).toHaveCount(0);
    });

    test('reloads instead of asking when auto-reload is on', async ({ popup }) => {
        await popup.autoReloadToggle.set(true);

        await popup.applyWithButton('2025-04-27 12:40');

        await expect.poll(() => popup.tabReloads(), { message: 'tab should be reloaded' }).toBe(1);
        await expect(popup.reloadModal).toHaveCount(0);
    });
});

test.describe('first use in a tab in Firefox', () => {
    test.use({ contentScriptActive: false });
    test.skip(
        ({ browserName }) => browserName !== 'firefox',
        'only Firefox injects the content script via its manifest'
    );

    test('applies a date without a reload', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.pageTime).toHaveText(appliedPageTime);
        await expect(popup.reloadModal).toHaveCount(0);
    });
});
