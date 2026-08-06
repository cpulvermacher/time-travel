import { expect, test } from './fixtures';

// On Android the popup shows an extra <input type="time"> next to the date input, which opens the
// system time picker (see isAndroid()). The `mobile` option renders that UI.
test.use({ mobile: true });

test.describe('the time picker', () => {
    test('replaces the time, keeping the date', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');

        await expect(popup.timeInput).toHaveValue('12:40');

        await popup.timeInput.fill('09:30');

        await expect(popup.dateInput).toHaveValue('2025-04-27 09:30');
        await popup.applyButton.click();
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 9:30:00 AM');
    });

    test('uses the selected time zone for an input denoting an instant', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Asia/Tokyo');

        // 20:00Z is 05:00 the next day in Tokyo, but 22:00 the same day in the browser zone
        await popup.setDate('2025-04-27T20:00Z');
        await expect(popup.timeInput).toHaveValue('05:00');

        await popup.timeInput.fill('09:30');

        // the day is the Tokyo one, and the time is now local time there
        await expect(popup.dateInput).toHaveValue('2025-04-28 09:30');
        await popup.applyButton.click();
        await expect(popup.pageTime).toHaveText('Apr 28, 2025 9:30:00 AM');
        await expect(popup.pageTimeOffset).toHaveText('+09:00');
    });
});
