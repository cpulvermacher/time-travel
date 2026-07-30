import { expect, test } from './fixtures';

// the clock is stopped in these tests, so the page time stays at the exact instant that was set

test.describe('browser time zone', () => {
    test('interprets input in the browser time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await expect(popup.timezoneToggle.checkbox).not.toBeChecked();
        await expect(popup.dateInputLabel).toContainText('Set date and time');

        await popup.applyWithEnter('2025-04-27T12:40Z');

        // Europe/Berlin (see playwright.config.ts) is UTC+2 in April
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 2:40:00 PM');
    });

    test.describe('in a different browser time zone', () => {
        test.use({ timezoneId: 'Asia/Tokyo' });

        test('interprets input in the browser time zone', async ({ popup }) => {
            await popup.stopClockToggle.set(true);

            await popup.applyWithEnter('2025-04-27T12:40Z');

            await expect(popup.pageTime).toHaveText('Apr 27, 2025 9:40:00 PM'); // UTC+9
        });
    });
});

test.describe('changing the time zone', () => {
    test('applies the selected time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');

        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // input is now interpreted as local time in the selected zone
        await expect(popup.dateInputLabel).toContainText('Set date and time (London)');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 PM (London)');

        await popup.applyButton.click();

        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');
        await expect(popup.pageTimeOffset).toHaveAttribute('title', /Europe\/London/);
        await expect(popup.applyButton).toHaveText('No changes');
    });

    test('keeps the local time when switching to another time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+01:00');

        await popup.timezoneSelect.selectOption('Asia/Tokyo');

        await expect(popup.dateInput).toHaveValue('2025-04-27 12:40');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 PM (Tokyo)');
        await popup.applyButton.click();

        // same local time, different instant
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
        await expect(popup.pageTimeOffset).toHaveText('+09:00');
    });

    test('returns to the browser time zone when switched off', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Asia/Tokyo');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+09:00');

        await popup.timezoneToggle.set(false);

        await expect(popup.timezoneSelect).toHaveCount(0);
        await expect(popup.dateInputLabel).not.toContainText('(Tokyo)');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 PM (browser time zone)');
        await popup.applyButton.click();

        // now local time in Europe/Berlin (note: an offset badge may still show if the fake date's
        // offset differs from the current one, e.g. when running this outside of summer time)
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
    });

    test('remembers the selected time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+01:00');

        await popup.reopen();

        await expect(popup.timezoneToggle.checkbox).toBeChecked();
        await expect(popup.timezoneSelect).toHaveValue('Europe/London');
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');
    });
});
