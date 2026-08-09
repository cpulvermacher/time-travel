import { expect, test } from './fixtures';

// the clock is stopped in these tests, so the page time stays at the exact instant that was set

test.describe('browser time zone', () => {
    test('interprets input in the browser time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await expect(popup.timezoneCheckbox.checkbox).not.toBeChecked();
        await expect(popup.dateInputLabel).toContainText('Set date and time');

        await popup.applyWithEnter('2025-04-27T12:40Z');

        // Europe/Berlin (see playwright.config.ts) is UTC+2 in April
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 14:40:00');
    });

    test.describe('in a different browser time zone', () => {
        test.use({ timezoneId: 'Asia/Tokyo' });

        test('interprets input in the browser time zone', async ({ popup }) => {
            await popup.stopClockToggle.set(true);

            await popup.applyWithEnter('2025-04-27T12:40Z');

            await expect(popup.pageTime).toHaveText('Apr 27, 2025 21:40:00'); // UTC+9
        });
    });
});

test.describe('changing the time zone', () => {
    test('applies the selected time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');

        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // input is now interpreted as local time in the selected zone
        await expect(popup.dateInputLabel).toContainText('Set date and time (London)');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 (London)');

        await popup.applyButton.click();

        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00');
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
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+01:00');

        await popup.timezoneSelect.selectOption('Asia/Tokyo');

        await expect(popup.dateInput).toHaveValue('2025-04-27 12:40');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 (Tokyo)');
        await popup.applyButton.click();

        // same local time, different instant
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00');
        await expect(popup.pageTimeOffset).toHaveText('+09:00');
        await expect(popup.pageTimeOffset).toHaveAttribute('title', 'Asia/Tokyo (Japan Standard Time)');
    });

    test('returns to the browser time zone when switched off', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Asia/Tokyo');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+09:00');

        await popup.timezoneCheckbox.set(false);

        await expect(popup.timezoneSelect).toHaveCount(0);
        await expect(popup.dateInputLabel).not.toContainText('(Tokyo)');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 12:40 (browser time zone)');
        await popup.applyButton.click();

        // now local time in Europe/Berlin (note: an offset badge may still show if the fake date's
        // offset differs from the current one, e.g. when running this outside of summer time)
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00');
    });

    test('keeps the local time of the selected zone when picking a day', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // an input with an explicit offset denotes an instant: 12:40Z is 13:40 in London, but 14:40
        // in the browser time zone (Europe/Berlin, see playwright.config.ts)
        await popup.setDate('2025-04-27T12:40Z');
        await expect(popup.applyButton).toHaveText('Change to Apr 27, 2025 13:40 (London)');

        await popup.calendarDay(15).click();

        // picking a day only replaces the date, the time of day stays the one in London
        await expect(popup.dateInput).toHaveValue('2025-04-15 13:40');
    });

    test('shows the day of the selected zone in the calendar', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Asia/Tokyo');

        // 20:00Z is already the next day in Tokyo, but still Apr 27 in the browser time zone
        await popup.setDate('2025-04-27T20:00Z');
        await expect(popup.applyButton).toHaveText('Change to Apr 28, 2025 05:00 (Tokyo)');

        await expect(popup.selectedCalendarDay()).toHaveText('28');

        await popup.calendarDay(15).click();

        await expect(popup.dateInput).toHaveValue('2025-04-15 05:00');
    });

    test('remembers the selected time zone', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.setDate('2025-04-27 12:40');
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');
        await popup.applyButton.click();
        await expect(popup.pageTimeOffset).toHaveText('+01:00');

        await popup.reopen();

        await expect(popup.timezoneCheckbox.checkbox).toBeChecked();
        await expect(popup.timezoneSelect).toHaveValue('Europe/London');
        await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');
    });
});

test.describe('the current date and time in the selected time zone', () => {
    // the system time is frozen, so the prefilled date is stable (Europe/London is UTC+1 in July,
    // the browser time zone Europe/Berlin is UTC+2, see playwright.config.ts)
    test.use({ systemTime: '2025-07-15T12:00:00Z' });

    test('prefills the input with the current time in the selected time zone', async ({ popup }) => {
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');
        await popup.applyButton.click();
        await expect(popup.dateInput).toHaveValue('2025-07-15 14:00'); // still the browser time zone

        // clearing the input disables the fake date and prefills the current time again
        await popup.setDate('');
        await popup.dateInput.press('Enter');
        await expect(popup.dateInput).toHaveValue('2025-07-15 13:00');

        // and the selected time zone is still used when the popup is reopened
        await popup.reopen();

        await expect(popup.dateInputLabel).toContainText('(London)');
        await expect(popup.dateInput).toHaveValue('2025-07-15 13:00');
    });

    test('shows the current UTC offsets in the time zone dropdown', async ({ popup }) => {
        await popup.timezoneCheckbox.set(true);

        // without a date the offsets of the options are the current ones
        await popup.setDate('');
        await expect(popup.timezoneOption('Europe/London')).toHaveText('London (UTC+01:00)');

        // with a date they follow that date, here across a DST transition
        await popup.setDate('2025-01-15 12:40');
        await expect(popup.timezoneOption('Europe/London')).toHaveText('London (UTC+00:00)');
    });
});

test.describe('daylight saving time', () => {
    // The offset badge shows the offset of the selected time zone at the faked date, not at the
    // real current date, and carries a season dot while that zone observes DST during the year:
    // filled (.season-dot--dst) while DST is in effect, hollow (.season-dot--standard) otherwise.
    const cases = [
        {
            name: 'summer time in the northern hemisphere',
            timezone: 'Europe/London',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00',
            offset: '+01:00',
            season: 'dst',
            title: 'Europe/London (British Summer Time)\nDaylight Saving Time (DST) is in effect for this date.',
        },
        {
            name: 'standard time in the northern hemisphere',
            timezone: 'Europe/London',
            date: '2025-01-15 12:40',
            pageTime: 'Jan 15, 2025 12:40:00',
            offset: '+00:00',
            season: 'standard',
            title:
                'Europe/London (Greenwich Mean Time)\n' +
                'This time zone observes Daylight Saving Time (DST) at other times of the year.',
        },
        {
            // in the southern hemisphere DST is in effect around the turn of the year
            name: 'summer time in the southern hemisphere',
            timezone: 'Australia/Sydney',
            date: '2025-01-15 12:40',
            pageTime: 'Jan 15, 2025 12:40:00',
            offset: '+11:00',
            season: 'dst',
            title:
                'Australia/Sydney (Australian Eastern Daylight Time)\n' +
                'Daylight Saving Time (DST) is in effect for this date.',
        },
        {
            name: 'standard time in the southern hemisphere',
            timezone: 'Australia/Sydney',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00',
            offset: '+10:00',
            season: 'standard',
            title:
                'Australia/Sydney (Australian Eastern Standard Time)\n' +
                'This time zone observes Daylight Saving Time (DST) at other times of the year.',
        },
        {
            name: 'a time zone that never observes DST',
            timezone: 'Asia/Tokyo',
            date: '2025-07-15 12:40',
            pageTime: 'Jul 15, 2025 12:40:00',
            offset: '+09:00',
            season: 'none',
            title: 'Asia/Tokyo (Japan Standard Time)',
        },
    ];

    for (const { name, timezone, date, pageTime, offset, season, title } of cases) {
        test(`shows ${name}`, async ({ popup }) => {
            await popup.stopClockToggle.set(true);
            await popup.timezoneCheckbox.set(true);
            await popup.timezoneSelect.selectOption(timezone);

            await popup.applyWithButton(date);

            await expect(popup.pageTime).toHaveText(pageTime);
            await expect(popup.pageTimeOffset).toHaveText(offset);
            await expect(popup.pageTimeOffset).toHaveAttribute('title', title);
            if (season === 'none') {
                await expect(popup.pageTimeSeasonDot).toHaveCount(0);
            } else {
                await expect(popup.pageTimeSeasonDot).toHaveClass(new RegExp(`season-dot--${season}`));
            }
        });
    }

    test.describe('in the browser time zone', () => {
        // Without a selected time zone the badge only shows when the fake date's offset differs
        // from the current one, so the system time is frozen to make that comparison stable.
        // Europe/Berlin (see playwright.config.ts) is UTC+1 in winter and UTC+2 in summer.

        test.describe('while it is winter', () => {
            test.use({ systemTime: '2025-01-15T12:00:00Z' });

            test('shows the summer time offset of a fake date', async ({ popup }) => {
                await popup.stopClockToggle.set(true);

                await popup.applyWithButton('2025-07-15 12:40');

                await expect(popup.pageTime).toHaveText('Jul 15, 2025 12:40:00');
                await expect(popup.pageTimeOffset).toHaveText('+02:00');
                await expect(popup.pageTimeSeasonDot).toHaveClass(/season-dot--dst/);
                await expect(popup.pageTimeOffset).toHaveAttribute(
                    'title',
                    'Central European Summer Time\nDaylight Saving Time (DST) is in effect for this date.'
                );
            });
        });

        test.describe('while it is summer', () => {
            test.use({ systemTime: '2025-07-15T12:00:00Z' });

            test('shows the winter time offset of a fake date', async ({ popup }) => {
                await popup.stopClockToggle.set(true);

                await popup.applyWithButton('2025-01-15 12:40');

                await expect(popup.pageTime).toHaveText('Jan 15, 2025 12:40:00');
                await expect(popup.pageTimeOffset).toHaveText('+01:00');
                await expect(popup.pageTimeSeasonDot).toHaveClass(/season-dot--standard/);
                await expect(popup.pageTimeOffset).toHaveAttribute(
                    'title',
                    'Central European Standard Time\n' +
                        'This time zone observes Daylight Saving Time (DST) at other times of the year.'
                );
            });

            test('shows no offset for a fake date in the same DST period', async ({ popup }) => {
                await popup.stopClockToggle.set(true);

                await popup.applyWithButton('2025-04-27 12:40');

                await expect(popup.pageTime).toHaveText('Apr 27, 2025 12:40:00');
                await expect(popup.pageTimeOffset).toHaveCount(0);
            });
        });
    });

    test('updates the offset when the date crosses a DST transition', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // Europe/London switches to summer time at 01:00 on Mar 30, 2025
        await popup.applyWithButton('2025-03-30 00:30');

        await expect(popup.pageTime).toHaveText('Mar 30, 2025 00:30:00');
        await expect(popup.pageTimeOffset).toHaveText('+00:00');
        await expect(popup.pageTimeSeasonDot).toHaveClass(/season-dot--standard/);

        await popup.applyWithButton('2025-03-30 03:30');

        await expect(popup.pageTime).toHaveText('Mar 30, 2025 03:30:00');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');
        await expect(popup.pageTimeSeasonDot).toHaveClass(/season-dot--dst/);
    });

    test('keeps the time of day when a day step crosses a DST transition', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // Europe/London skips 01:00-02:00 on Mar 30, 2025, so that day is only 23 hours long
        await popup.applyWithButton('2025-03-29 12:00');
        await expect(popup.pageTimeOffset).toHaveText('+00:00');

        await popup.dateInput.press('PageUp');

        // the wall clock time is kept, i.e. the step moves the instant forward by 23 hours
        await expect(popup.dateInput).toHaveValue('2025-03-30 12:00');
        await popup.applyButton.click();
        await expect(popup.pageTime).toHaveText('Mar 30, 2025 12:00:00');
        await expect(popup.pageTimeOffset).toHaveText('+01:00');

        // the browser time zone (Europe/Berlin) skips 02:00-03:00 that same night, which must not
        // affect a step in the selected time zone
        await popup.setDate('2025-03-29 02:30');
        await popup.dateInput.press('PageUp');
        await expect(popup.dateInput).toHaveValue('2025-03-30 02:30');
    });

    test('keeps the UTC offset when a day step starts in a repeated hour', async ({ popup }) => {
        await popup.stopClockToggle.set(true);
        await popup.timezoneCheckbox.set(true);
        await popup.timezoneSelect.selectOption('Europe/London');

        // Europe/London repeats 01:00-02:00 on Oct 26, 2025. An hour step reaches the second 01:30,
        // which is written with an explicit offset (see formatUnambiguousDate)
        await popup.setDate('2025-10-26 01:30');
        await popup.dateInput.press('Control+ArrowUp');
        await expect(popup.dateInput).toHaveValue('2025-10-26 01:30+00:00');

        await popup.dateInput.press('PageUp');
        await expect(popup.dateInput).toHaveValue('2025-10-27 01:30');

        // stepping back returns to the second 01:30, not to the first one
        await popup.dateInput.press('PageDown');
        await expect(popup.dateInput).toHaveValue('2025-10-26 01:30+00:00');

        await popup.applyButton.click();
        await expect(popup.pageTime).toHaveText('Oct 26, 2025 01:30:00');
        await expect(popup.pageTimeOffset).toHaveText('+00:00');
    });
});
