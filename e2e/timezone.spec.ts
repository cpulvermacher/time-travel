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
        await expect(popup.pageTimeOffset).toHaveAttribute(
            'title',
            'Europe/London (British Summer Time)\nDaylight Saving Time (DST) is in effect for this date.'
        );
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
        await expect(popup.pageTimeOffset).toHaveAttribute('title', 'Asia/Tokyo (Japan Standard Time)');
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

test.describe('daylight saving time', () => {
    // The offset badge shows the offset of the selected time zone at the faked date, not at the
    // real current date, and is highlighted (.badge--dst) while DST is in effect there.
    const cases = [
        {
            name: 'summer time in the northern hemisphere',
            timezone: 'Europe/London',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00 PM',
            offset: '+01:00',
            isDst: true,
            title: 'Europe/London (British Summer Time)\nDaylight Saving Time (DST) is in effect for this date.',
        },
        {
            name: 'standard time in the northern hemisphere',
            timezone: 'Europe/London',
            date: '2025-01-15 12:40',
            pageTime: 'Jan 15, 2025 12:40:00 PM',
            offset: '+00:00',
            isDst: false,
            title:
                'Europe/London (Greenwich Mean Time)\n' +
                'This time zone observes Daylight Saving Time (DST) at other times of the year.',
        },
        {
            // in the southern hemisphere DST is in effect around the turn of the year
            name: 'summer time in the southern hemisphere',
            timezone: 'Australia/Sydney',
            date: '2025-01-15 12:40',
            pageTime: 'Jan 15, 2025 12:40:00 PM',
            offset: '+11:00',
            isDst: true,
            title:
                'Australia/Sydney (Australian Eastern Daylight Time)\n' +
                'Daylight Saving Time (DST) is in effect for this date.',
        },
        {
            name: 'standard time in the southern hemisphere',
            timezone: 'Australia/Sydney',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00 PM',
            offset: '+10:00',
            isDst: false,
            title:
                'Australia/Sydney (Australian Eastern Standard Time)\n' +
                'This time zone observes Daylight Saving Time (DST) at other times of the year.',
        },
        {
            name: 'a time zone that never observes DST',
            timezone: 'Asia/Tokyo',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00 PM',
            offset: '+09:00',
            isDst: false,
            title: 'Asia/Tokyo (Japan Standard Time)',
        },
    ];

    for (const { name, timezone, date, pageTime, offset, isDst, title } of cases) {
        test(`shows ${name}`, async ({ popup }) => {
            await popup.stopClockToggle.set(true);
            await popup.timezoneToggle.set(true);
            await popup.timezoneSelect.selectOption(timezone);

            await popup.applyWithButton(date);

            await expect(popup.pageTime).toHaveText(pageTime);
            await expect(popup.pageTimeOffset).toHaveText(offset);
            await expect(popup.pageTimeOffset).toHaveAttribute('title', title);
            if (isDst) {
                await expect(popup.pageTimeOffset).toHaveClass(/badge--dst/);
            } else {
                await expect(popup.pageTimeOffset).not.toHaveClass(/badge--dst/);
            }
        });
    }

    test.describe('in the browser time zone', () => {
        // Without a selected time zone the badge only shows when the fake date's offset differs
        // from the current one, so the real system time is frozen to make that comparison stable.
        // Europe/Berlin (see playwright.config.ts) is UTC+1 in winter and UTC+2 in summer.

        test('shows the summer time offset of a fake date while it is winter', async ({ popup }) => {
            await popup.setSystemTime('2025-01-15T12:00:00Z');
            await popup.stopClockToggle.set(true);

            await popup.applyWithButton('2025-07-15 12:40');

            await expect(popup.pageTime).toHaveText('Jul 15, 2025 12:40:00 PM');
            await expect(popup.pageTimeOffset).toHaveText('+02:00');
            await expect(popup.pageTimeOffset).toHaveClass(/badge--dst/);
            await expect(popup.pageTimeOffset).toHaveAttribute(
                'title',
                'Central European Summer Time\nDaylight Saving Time (DST) is in effect for this date.'
            );
        });

        test('shows the winter time offset of a fake date while it is summer', async ({ popup }) => {
            await popup.setSystemTime('2025-07-15T12:00:00Z');
            await popup.stopClockToggle.set(true);

            await popup.applyWithButton('2025-01-15 12:40');

            await expect(popup.pageTime).toHaveText('Jan 15, 2025 12:40:00 PM');
            await expect(popup.pageTimeOffset).toHaveText('+01:00');
            await expect(popup.pageTimeOffset).not.toHaveClass(/badge--dst/);
            await expect(popup.pageTimeOffset).toHaveAttribute(
                'title',
                'Central European Standard Time\n' +
                    'This time zone observes Daylight Saving Time (DST) at other times of the year.'
            );
        });

        test('shows no offset for a fake date in the same DST period', async ({ popup }) => {
            await popup.setSystemTime('2025-07-15T12:00:00Z');
            await popup.stopClockToggle.set(true);

            await popup.applyWithButton('2025-04-27 12:40');

            await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00 PM');
            await expect(popup.pageTimeOffset).toHaveCount(0);
        });
    });

    test('updates the offset when the date crosses a DST transition', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneToggle.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // Europe/London switches to summer time at 01:00 on Mar 30, 2025
        await popup.applyWithButton('2025-03-30 00:30');

        await expect(popup.pageTime).toHaveText('Mar 30, 2025 12:30:00 AM');
        await expect(popup.pageTimeOffset).toHaveText('+00:00');
        await expect(popup.pageTimeOffset).not.toHaveClass(/badge--dst/);

        await popup.applyWithButton('2025-03-30 03:30');

        await expect(popup.pageTime).toHaveText('Mar 30, 2025 3:30:00 AM');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');
        await expect(popup.pageTimeOffset).toHaveClass(/badge--dst/);
    });
});
