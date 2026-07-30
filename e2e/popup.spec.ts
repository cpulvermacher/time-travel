import { expect, type Popup, test } from './fixtures';

/** the page time shown for 2025-04-27 12:40 while the clock is running (seconds keep advancing) */
const runningPageTime = /Apr 27, 2025\s+12:40:\d\d/;

/** wait for the page time to change, i.e. for the clock to be running */
async function expectClockTicking(popup: Popup) {
    const before = await popup.pageTime.textContent();
    await expect.poll(() => popup.pageTime.textContent(), { message: 'page time should advance' }).not.toBe(before);
}

/** check that the page time stays the same, i.e. that the clock is stopped */
async function expectClockStopped(popup: Popup) {
    const before = await popup.pageTime.textContent();
    await popup.page.waitForTimeout(1500);
    expect(await popup.pageTime.textContent()).toBe(before);
}

test.describe('setting a date', () => {
    test('applies the date via the apply button', async ({ popup }) => {
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();

        await popup.setDate('2025-04-27 12:40');
        await expect(popup.applyButton).toHaveText('Change date to Apr 27, 2025 12:40 PM');
        await popup.applyButton.click();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(runningPageTime);
        await expect(popup.realTimeNote).not.toBeVisible();
        await expect(popup.applyButton).toHaveText('No changes');
        await expect(popup.applyButton).toBeDisabled();
    });

    test('applies the date via the enable toggle', async ({ popup }) => {
        await popup.setDate('2025-04-27 12:40');
        await expect(popup.pageTime).not.toHaveText(runningPageTime);

        await popup.fakeDateToggle.click();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(runningPageTime);
        await expect(popup.applyButton).toHaveText('No changes');
    });

    test('keeps the fake date when the popup is reopened', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(runningPageTime);

        await popup.reopen();

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(runningPageTime);
        await expect(popup.dateInput).toHaveValue(/^2025-04-27 12:40/);
    });
});

test.describe('disabling', () => {
    test('turns off the fake date via the enable toggle', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(runningPageTime);

        await popup.fakeDateToggle.click();

        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.pageTime).not.toHaveText(runningPageTime);
        await expect(popup.realTimeNote).toBeVisible();

        // and it stays off after reopening the popup
        await popup.reopen();
        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();
    });

    test('turns off the fake date when the input is cleared', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.pageTime).toHaveText(runningPageTime);

        await popup.setDate('');
        await expect(popup.applyButton).toHaveText('Disable fake date');
        await popup.dateInput.press('Enter');

        await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
        await expect(popup.realTimeNote).toBeVisible();
    });
});

test.describe('stopping the clock', () => {
    test('stops and resumes the clock', async ({ popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expectClockTicking(popup);

        await popup.stopClockToggle.set(true);

        // stopping resets the page to the date that was set last
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
        await expectClockStopped(popup);

        await popup.stopClockToggle.set(false);

        await expectClockTicking(popup);
        await expect(popup.pageTime).toHaveText(runningPageTime);
    });

    test('applies a date with the clock already stopped', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
        await expectClockStopped(popup);
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
        await expect(popup.pageTime).toHaveText(runningPageTime);

        expect(popup.tabReloads()).toBe(0);
    });

    test('remembers the setting', async ({ popup }) => {
        await popup.autoReloadToggle.set(true);

        await popup.reopen();

        await expect(popup.autoReloadToggle.checkbox).toBeChecked();
    });
});

test.describe('first use in a tab', () => {
    // Firefox injects the content script via its manifest, so it is active without a reload
    test.skip(
        ({ browserName }) => browserName !== 'chromium',
        'only Chrome needs a reload to inject the content script'
    );

    test('asks for a reload after applying a date', async ({ firstUsePopup: popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');

        await expect(popup.reloadModal).toBeVisible();
    });

    test('asks for a reload after enabling via the toggle', async ({ firstUsePopup: popup }) => {
        await popup.setDate('2025-04-27 12:40');

        await popup.fakeDateToggle.click();

        await expect(popup.reloadModal).toBeVisible();
    });

    test('reloads the tab when confirming the prompt', async ({ firstUsePopup: popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.reloadButton).toBeVisible();

        await popup.reloadButton.click();

        await expect.poll(() => popup.tabReloads(), { message: 'tab should be reloaded' }).toBe(1);
    });

    test('does not ask for a reload again on later changes', async ({ firstUsePopup: popup }) => {
        await popup.applyWithButton('2025-04-27 12:40');
        await expect(popup.reloadModal).toBeVisible();

        await popup.reopen();
        await popup.applyWithButton('2025-04-28 12:40');

        await expect(popup.pageTime).toHaveText(/Apr 28, 2025/);
        await expect(popup.reloadModal).toHaveCount(0);
    });

    test('reloads instead of asking when auto-reload is on', async ({ firstUsePopup: popup }) => {
        await popup.autoReloadToggle.set(true);

        await popup.applyWithButton('2025-04-27 12:40');

        await expect.poll(() => popup.tabReloads(), { message: 'tab should be reloaded' }).toBe(1);
        await expect(popup.reloadModal).toHaveCount(0);
    });
});

test('applies a date without a reload on first use in Firefox', async ({ firstUsePopup: popup, browserName }) => {
    test.skip(browserName !== 'firefox', 'only Firefox injects the content script via its manifest');

    await popup.applyWithButton('2025-04-27 12:40');

    await expect(popup.pageTime).toHaveText(runningPageTime);
    await expect(popup.reloadModal).toHaveCount(0);
});
