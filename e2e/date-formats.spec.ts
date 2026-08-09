import { expect, test } from './fixtures';

/** the date and time formats documented in the README, plus the resulting page time.
 *
 * Expectations assume the browser time zone Europe/Berlin (see playwright.config.ts), i.e. UTC+1
 * in winter and UTC+2 in summer. */
const examples = [
    { name: 'local time', input: '2025-04-27 12:40', pageTime: 'Apr 27, 2025 12:40:00' },
    { name: 'local time with seconds', input: '2025-03-30 00:59:55', pageTime: 'Mar 30, 2025 00:59:55' },
    { name: 'instant in UTC', input: '2025-04-27T12:40Z', pageTime: 'Apr 27, 2025 14:40:00' },
    { name: 'instant with UTC offset', input: '2025-04-27T12:40+1130', pageTime: 'Apr 27, 2025 03:10:00' },
    { name: 'local time with milliseconds', input: '2025-03-25T12:40:00.120', pageTime: 'Mar 25, 2025 12:40:00' },
    { name: 'UNIX timestamp', input: '1731493140025', pageTime: 'Nov 13, 2024 11:19:00' },
];

for (const { name, input, pageTime } of examples) {
    test(`sets the date from ${name} (${input})`, async ({ popup }) => {
        // stop the clock first, so the page time stays at the exact instant that was set
        await popup.stopClockToggle.set(true);

        await popup.applyWithEnter(input);

        await expect(popup.fakeDateToggle.checkbox).toBeChecked();
        await expect(popup.pageTime).toHaveText(pageTime);
    });
}

test('rejects an invalid date', async ({ popup }) => {
    await popup.setDate('not a date');

    await expect(popup.applyButton).toHaveText('Invalid date');
    await expect(popup.applyButton).toBeDisabled();

    await popup.dateInput.press('Enter');

    await expect(popup.fakeDateToggle.checkbox).not.toBeChecked();
    await expect(popup.realTimeNote).toBeVisible();
});
