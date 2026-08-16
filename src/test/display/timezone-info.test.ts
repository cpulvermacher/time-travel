import { describe, expect, it } from 'vitest';
import { getTimezoneCity, getTzInfo, isValidTimezone } from '@/display/timezone-info';

describe('getTimezoneCity', () => {
    it('returns the city part of an IANA identifier', () => {
        expect(getTimezoneCity('America/New_York')).toBe('New York');
        expect(getTimezoneCity('Europe/Berlin')).toBe('Berlin');
    });

    it('returns the last part of a three-part identifier', () => {
        expect(getTimezoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
        expect(getTimezoneCity('America/Indiana/Tell_City')).toBe('Tell City');
    });

    it('replaces all underscores, not just the first', () => {
        expect(getTimezoneCity('America/Port_of_Spain')).toBe('Port of Spain');
    });

    it('returns identifiers without a region unchanged', () => {
        expect(getTimezoneCity('UTC')).toBe('UTC');
        expect(getTimezoneCity('CST6CDT')).toBe('CST6CDT'); // Firefox has a number of these funky time zones
    });

    it('returns an empty string for the browser default timezone', () => {
        expect(getTimezoneCity('')).toBe('');
    });
});

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
        expect(infoJa.timeString).toBe('06:00');

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
        expect(infoJa.timeString).toBe('06:00:07');

        // the date is unaffected by the time format
        expect(infoDe.dateString).toBe('1. Juli 2025');
    });

    it('uses a 24h clock even in locales that default to AM/PM', () => {
        const afternoon = '2025-07-01T20:00Z'; // 4 PM in New York

        expect(getTzInfo('en-US', afternoon, 'America/New_York')!.timeString).toBe('16:00');
        expect(getTzInfo('en-US', '2025-07-01T04:00Z', 'America/New_York')!.timeString).toBe('00:00');
        expect(getTzInfo('ko', afternoon, 'America/New_York')!.timeString).toBe('16:00');
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
