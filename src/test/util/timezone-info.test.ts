import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOffsetMinutes, getTzInfo, isValidTimezone, TZGROUP_RECENT } from '../../util/timezone-info';

describe('getTzInfo', () => {
    it('returns short tzName', () => {
        const cet = getTzInfo('en', '2025-01-01', 'Europe/Berlin')!;
        expect(cet.tzName).toBe('Central European Standard Time');
        const cest = getTzInfo('en', '2025-07-01', 'Europe/Berlin')!;
        expect(cest.tzName).toBe('Central European Summer Time');
        const jst = getTzInfo('en', '2025-07-01', 'Asia/Tokyo')!;
        expect(jst.tzName).toBe('Japan Standard Time');
    });

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

    it('omits seconds by default', () => {
        const info = getTzInfo('de', '2025-07-01T10:00:07Z', 'America/New_York')!;
        expect(info.timeString).toBe('06:00');
    });

    it('includes seconds if requested', () => {
        // seconds are zero-padded, so the ticking preview doesn't change width
        const infoDe = getTzInfo('de', '2025-07-01T10:00:07Z', 'America/New_York', { seconds: true })!;
        expect(infoDe.timeString).toBe('06:00:07');

        const infoJa = getTzInfo('ja', '2025-07-01T10:00:07Z', 'America/New_York', { seconds: true })!;
        expect(infoJa.timeString).toBe('6:00:07');

        // the date is unaffected by the time format
        expect(infoDe.dateString).toBe('1. Juli 2025');
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

        const options = getTimezoneOptions(['Europe/London']);

        expect(options.length).toBeGreaterThan(0);

        // every option follows the { tz, name, group } shape
        for (const option of options) {
            expect(typeof option.tz).toBe('string');
            expect(option.tz).not.toBe('');
            expect(typeof option.name).toBe('string');
            expect(option.name).not.toBe('');
            expect(typeof option.group).toBe('string');
            expect(option.group).not.toBe('');
        }

        // a normal timezone is added with its region as the group, and without an offset (that depends on the date)
        const newYork = options.find((o) => o.tz === 'America/New_York');
        expect(newYork).toEqual({
            tz: 'America/New_York',
            name: 'New York',
            group: 'America',
        });

        // the recent timezone is added under the recent group
        const recentLondon = options.find((o) => o.tz === 'Europe/London' && o.group === TZGROUP_RECENT);
        expect(recentLondon).toBeDefined();
        expect(recentLondon!.name).toBe('London');
    });

    it('drops an invalid recent timezone instead of throwing', async () => {
        const getTimezoneOptions = await freshGetTimezoneOptions();

        const options = getTimezoneOptions(['Evil/Not_A_Zone', 'Europe/London']);

        const tzs = options.map((o) => o.tz);
        expect(tzs).not.toContain('Evil/Not_A_Zone');
        expect(tzs).toContain('Europe/London');
    });

    it('still returns the full list when a recent entry is invalid', async () => {
        const getTimezoneOptions = await freshGetTimezoneOptions();

        const options = getTimezoneOptions(['Evil/Not_A_Zone']);

        expect(options.length).toBeGreaterThan(100);
        expect(options.map((o) => o.tz)).toContain('America/New_York');
    });
});

describe('getTimezoneOffsets', () => {
    // both the option list and the offsets are memoized, so re-import a fresh module per test
    beforeEach(() => {
        vi.resetModules();
    });

    async function freshModule() {
        return await import('../../util/timezone-info');
    }

    it('returns offsets for the given date, not for now', async () => {
        const { getTimezoneOffsets, getTimezoneOptions } = await freshModule();
        const options = getTimezoneOptions([]);

        const winter = getTimezoneOffsets('en', new Date('2025-01-15T12:00:00Z'), options);
        const summer = getTimezoneOffsets('en', new Date('2025-07-15T12:00:00Z'), options);

        expect(winter['America/New_York']).toBe('UTC-05:00');
        expect(summer['America/New_York']).toBe('UTC-04:00');
        expect(winter['Europe/Berlin']).toBe('UTC+01:00');
        expect(summer['Europe/Berlin']).toBe('UTC+02:00');

        // a timezone without DST is unaffected
        expect(winter['Asia/Tokyo']).toBe('UTC+09:00');
        expect(summer['Asia/Tokyo']).toBe('UTC+09:00');

        // showing an offset for UTC itself would be redundant
        expect(winter.UTC).toBe('');
    });

    it('includes recent timezones that are not in the standard list', async () => {
        const { getTimezoneOffsets, getTimezoneOptions } = await freshModule();
        const options = getTimezoneOptions(['Europe/London']);

        const offsets = getTimezoneOffsets('en', new Date('2025-01-15T12:00:00Z'), options);

        expect(offsets['Europe/London']).toBe('UTC+00:00');
    });

    it('returns the identical object when no offset changed, so callers can skip DOM updates', async () => {
        const { getTimezoneOffsets, getTimezoneOptions } = await freshModule();
        const options = getTimezoneOptions([]);

        const first = getTimezoneOffsets('en', new Date('2025-07-15T12:00:00Z'), options);
        const sameDstWindow = getTimezoneOffsets('en', new Date('2025-07-16T13:37:00Z'), options);
        const otherDstWindow = getTimezoneOffsets('en', new Date('2025-01-15T12:00:00Z'), options);

        expect(sameDstWindow).toBe(first);
        expect(otherDstWindow).not.toBe(first);
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

    it('handles negative offsets of less than an hour', () => {
        // e.g. Europe/Dublin (-00:25) and Africa/Monrovia (-00:44) before 1916/1972
        expect(getOffsetMinutes('GMT-00:30')).toBe(30);
        expect(getOffsetMinutes('GMT-00:44')).toBe(44);
        expect(getOffsetMinutes('GMT-00:00')).toBe(0);
    });

    it('returns 0 for invalid timezone', () => {
        expect(getOffsetMinutes('abcd')).toBe(0);
        expect(getOffsetMinutes('')).toBe(0);
        expect(getOffsetMinutes(undefined)).toBe(0);
    });
});
