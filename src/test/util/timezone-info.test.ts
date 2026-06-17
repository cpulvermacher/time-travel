import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOffsetMinutes, getTzInfo, isValidTimezone, TZGROUP_RECENT } from '../../util/timezone-info';

describe('getTzInfo', () => {
    it('detects DST for positive offset (Berlin)', () => {
        const timezone = 'Europe/Berlin';

        const winter = getTzInfo('en', '2025-01-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('+01:00');

        const summer = getTzInfo('en', '2025-07-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('+02:00');
    });

    it('detects DST for negative offset (New York)', () => {
        const timezone = 'America/New_York';

        const winter = getTzInfo('en', '2025-01-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('-05:00');

        const summer = getTzInfo('en', '2025-07-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('-04:00');
    });

    it('detects DST on southern hemisphere (Chatham Islands)', () => {
        const timezone = 'Pacific/Chatham';

        const winter = getTzInfo('en', '2025-07-01', timezone)!;
        expect(winter.isYearWithDst).toBe(true);
        expect(winter.isDst).toBe(false);
        expect(winter.offset).toBe('+12:45');

        const summer = getTzInfo('en', '2025-01-01', timezone)!;
        expect(summer.isYearWithDst).toBe(true);
        expect(summer.isDst).toBe(true);
        expect(summer.offset).toBe('+13:45');
    });

    it('detects timezones without DST (Tokyo)', () => {
        const timezone = 'Asia/Tokyo';

        const info = getTzInfo('en', '2025-07-01', timezone)!;
        expect(info.isYearWithDst).toBe(false);
        expect(info.isDst).toBe(false);
        expect(info.offset).toBe('+09:00');
    });

    it('detects if offset is different from now', () => {
        //assuming this test is run after 1972 and these places don't switch back to crazy offsets
        const infoMorovia = getTzInfo('en', '1970-01-01', 'Africa/Monrovia')!;
        expect(infoMorovia.isOffsetDifferentFromNow).toBe(true);
        expect(infoMorovia.offset).toBe('-00:44:30');
        expect(infoMorovia.isYearWithDst).toBe(false);

        const infoDublin = getTzInfo('en', '1910-01-01', 'Europe/Dublin')!;
        expect(infoDublin.isOffsetDifferentFromNow).toBe(true);
        expect(infoDublin.offset).toBe('-00:25:21');
        expect(infoDublin.isYearWithDst).toBe(false);
    });

    it('returns strings in given locale', () => {
        const infoJa = getTzInfo('ja', '2025-07-01T10:00Z', 'America/New_York')!;
        expect(infoJa.dateString).toBe('2025年7月1日');
        expect(infoJa.timeString).toBe('6:00');

        const infoDe = getTzInfo('de', '2025-07-01T10:00Z', 'America/New_York')!;
        expect(infoDe.dateString).toBe('1. Juli 2025');
        expect(infoDe.timeString).toBe('06:00');
    });
});

describe('isValidTimezone', () => {
    it('accepts valid IANA zones', () => {
        expect(isValidTimezone('America/New_York')).toBe(true);
        expect(isValidTimezone('Europe/Berlin')).toBe(true);
        expect(isValidTimezone('UTC')).toBe(true);
    });

    it('rejects non-IANA / page-controlled strings', () => {
        expect(isValidTimezone('Evil/Not_A_Zone')).toBe(false);
        expect(isValidTimezone('<img src=x onerror=alert(1)>')).toBe(false);
        expect(isValidTimezone('')).toBe(false);
        expect(isValidTimezone(null)).toBe(false);
        expect(isValidTimezone(undefined)).toBe(false);
    });
});

describe('getTimezoneOptions', () => {
    // result is memoized, so re-import a fresh module per test
    beforeEach(() => {
        vi.resetModules();
    });

    async function freshGetTimezoneOptions() {
        return (await import('../../util/timezone-info')).getTimezoneOptions;
    }

    it('returns a non-empty list that adds normal and recent timezones in the correct format', async () => {
        const getTimezoneOptions = await freshGetTimezoneOptions();

        const options = getTimezoneOptions('en', ['Europe/London']);

        expect(options.length).toBeGreaterThan(0);

        // every option follows the { tz, label, group } shape
        for (const option of options) {
            expect(typeof option.tz).toBe('string');
            expect(option.tz).not.toBe('');
            expect(typeof option.label).toBe('string');
            expect(option.label).not.toBe('');
            expect(typeof option.group).toBe('string');
            expect(option.group).not.toBe('');
        }

        // a normal timezone is added with its region as the group and a UTC offset in the label
        const newYork = options.find((o) => o.tz === 'America/New_York');
        expect(newYork).toEqual({
            tz: 'America/New_York',
            label: expect.stringMatching(/^New York \(UTC[+-]\d{2}:\d{2}\)$/),
            group: 'America',
        });

        // the recent timezone is added under the recent group
        const recentLondon = options.find((o) => o.tz === 'Europe/London' && o.group === TZGROUP_RECENT);
        expect(recentLondon).toBeDefined();
        expect(recentLondon!.label).toMatch(/^London \(UTC[+-]\d{2}:\d{2}\)$/);
    });

    it('drops an invalid recent timezone instead of throwing', async () => {
        const getTimezoneOptions = await freshGetTimezoneOptions();

        const options = getTimezoneOptions('en', ['Evil/Not_A_Zone', 'Europe/London']);

        const tzs = options.map((o) => o.tz);
        expect(tzs).not.toContain('Evil/Not_A_Zone');
        expect(tzs).toContain('Europe/London');
    });

    it('still returns the full list when a recent entry is invalid', async () => {
        const getTimezoneOptions = await freshGetTimezoneOptions();

        const options = getTimezoneOptions('en', ['Evil/Not_A_Zone']);

        expect(options.length).toBeGreaterThan(100);
        expect(options.map((o) => o.tz)).toContain('America/New_York');
    });
});

describe('getOffsetMinutes', () => {
    it('returns 0 for UTC', () => {
        expect(getOffsetMinutes('GMT')).toBe(0);
    });

    it('returns correct minute offset', () => {
        expect(getOffsetMinutes('GMT-05:00')).toBe(300);
        expect(getOffsetMinutes('GMT+02:00')).toBe(-120);
        expect(getOffsetMinutes('GMT+00:30')).toBe(-30);
        expect(getOffsetMinutes('GMT+12:45')).toBe(-765);
    });

    it('returns 0 for invalid timezone', () => {
        expect(getOffsetMinutes('abcd')).toBe(0);
        expect(getOffsetMinutes('')).toBe(0);
        expect(getOffsetMinutes(undefined)).toBe(0);
    });
});
