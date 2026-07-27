import { describe, expect, it } from 'vitest';
import {
    formatLocalDate,
    formatLocalTime,
    formatUnambiguousDate,
    overwriteDatePart,
    overwriteTimePart,
    parseDate,
    parseTimestamp,
    type ValidDate,
} from '../../util/date-utils';

describe('formatLocalDate', () => {
    const full = { fullPrecision: true };

    it('formats in correct format', () => {
        expect(formatLocalDate(new Date('2025-02-10 12:34'))).toBe('2025-02-10 12:34');
        expect(formatLocalDate(new Date('2000-01-01 01:01'))).toBe('2000-01-01 01:01');
        expect(formatLocalDate(new Date('2024-12-31 23:59'))).toBe('2024-12-31 23:59');
        expect(formatLocalDate(new Date('2025-02-10 12:34:55'))).toBe('2025-02-10 12:34');
        expect(formatLocalDate(new Date('2025-02-10 12:34:55.123'))).toBe('2025-02-10 12:34');
        expect(formatLocalDate(new Date('2025-02-10 00:00'))).toBe('2025-02-10 00:00');
        expect(formatLocalDate(new Date('2025-01-01 00:00'))).toBe('2025-01-01 00:00');
        expect(formatLocalDate(new Date('2005-12-31 23:59'))).toBe('2005-12-31 23:59');
    });

    it('formats dates after 9999 CE correctly', () => {
        expect(formatLocalDate(new Date('10000-02-10 00:00'))).toBe('10000-02-10 00:00');
        expect(formatLocalDate(new Date('10000-02-10 12:34:55.123'))).toBe('10000-02-10 12:34');
        expect(formatLocalDate(new Date('10000-02-10 12:34:55.123'), full)).toBe('10000-02-10 12:34:55.123');
        expect(formatLocalDate(new Date('40000-02-10 00:00'))).toBe('40000-02-10 00:00');
    });

    it('formats dates before 1000 CE correctly', () => {
        expect(formatLocalDate(new Date('0999-02-10 00:00'))).toBe('0999-02-10 00:00');
        expect(formatLocalDate(new Date('0999-02-10 12:34:55.123'))).toBe('0999-02-10 12:34');
        expect(formatLocalDate(new Date('0100-02-10T00:00'))).toBe('0100-02-10 00:00');
        // less than 3 digits require 'T' separator
        // these don't actually work nicely with the UI yet
        expect(formatLocalDate(new Date('0019-02-10T00:00'))).toBe('0019-02-10 00:00');
        expect(formatLocalDate(new Date('0009-02-10T00:00'))).toBe('0009-02-10 00:00');
        expect(formatLocalDate(new Date('0001-02-10T00:00'))).toBe('0001-02-10 00:00');
    });

    it('formats dates before 1 CE correctly', () => {
        // +0000 = 1 BCE in ISO 8601
        expect(formatLocalDate(new Date('0000-02-10T00:00'))).toBe('0000-02-10 00:00');
        // -0001 = 2 BCE needs extra digits to be parsed
        expect(formatLocalDate(new Date('-000001-02-10T00:00'))).toBe('-000001-02-10 00:00');
        expect(formatLocalDate(new Date('-000010-02-10T00:00'))).toBe('-000010-02-10 00:00');
        expect(formatLocalDate(new Date('-000100-02-10T00:00'))).toBe('-000100-02-10 00:00');
        expect(formatLocalDate(new Date('-001000-02-10T00:00'))).toBe('-001000-02-10 00:00');
    });

    it('handles invalid dates', () => {
        expect(formatLocalDate(new Date(''))).toBe('Invalid Date');
        expect(formatLocalDate(new Date('abcdefgh'))).toBe('Invalid Date');
        expect(formatLocalDate(new Date('2025-01-32'))).toBe('Invalid Date');
    });

    it('uses local time', () => {
        const date = new Date('2025-02-13T12:00Z');
        const formattedDate = formatLocalDate(date);
        expect(new Date(formattedDate).getTime()).toBe(date.getTime());
    });

    it('fullPrecision: outputs as much precision as required', () => {
        expect(formatLocalDate(new Date('2025-02-10 12:34:55.123'), full)).toBe('2025-02-10 12:34:55.123');
        expect(formatLocalDate(new Date('2025-02-10 12:34:55'), full)).toBe('2025-02-10 12:34:55');
        expect(formatLocalDate(new Date('2025-02-10 12:34'), full)).toBe('2025-02-10 12:34');
        expect(formatLocalDate(new Date('2025-02-10 00:00'), full)).toBe('2025-02-10 00:00');
    });

    describe('with a time zone', () => {
        it('formats as local time in the given time zone', () => {
            const date = new Date('2025-02-10T12:34:55.123Z');
            expect(formatLocalDate(date, { timezone: 'UTC' })).toBe('2025-02-10 12:34');
            expect(formatLocalDate(date, { timezone: 'Europe/London' })).toBe('2025-02-10 12:34');
            expect(formatLocalDate(date, { timezone: 'Europe/Berlin' })).toBe('2025-02-10 13:34');
            expect(formatLocalDate(date, { timezone: 'America/New_York' })).toBe('2025-02-10 07:34');
            expect(formatLocalDate(date, { timezone: 'Asia/Kolkata' })).toBe('2025-02-10 18:04');
            // one day later
            expect(formatLocalDate(date, { timezone: 'Pacific/Auckland' })).toBe('2025-02-11 01:34');
        });

        it('uses the browser time zone for an empty time zone', () => {
            const date = new Date('2025-02-10T12:34:55.123Z');
            expect(formatLocalDate(date, { timezone: '' })).toBe(formatLocalDate(date));
        });

        it('applies the offset in effect at the given date (DST)', () => {
            // Europe/London is GMT in winter and BST (GMT+01:00) in summer
            expect(formatLocalDate(new Date('2025-01-15T12:00Z'), { timezone: 'Europe/London' })).toBe(
                '2025-01-15 12:00'
            );
            expect(formatLocalDate(new Date('2025-07-15T12:00Z'), { timezone: 'Europe/London' })).toBe(
                '2025-07-15 13:00'
            );
            // 1 second before and after the spring transition (2025-03-30 01:00 GMT)
            expect(formatLocalDate(new Date('2025-03-30T00:59:59Z'), { timezone: 'Europe/London', ...full })).toBe(
                '2025-03-30 00:59:59'
            );
            expect(formatLocalDate(new Date('2025-03-30T01:00:00Z'), { timezone: 'Europe/London', ...full })).toBe(
                '2025-03-30 02:00'
            );
        });

        it('handles offsets with a seconds part', () => {
            // Africa/Monrovia used GMT-00:44:30 until 1972
            expect(formatLocalDate(new Date('1970-01-01T12:00Z'), { timezone: 'Africa/Monrovia', ...full })).toBe(
                '1970-01-01 11:15:30'
            );
        });

        it('handles years outside the four-digit range', () => {
            expect(formatLocalDate(new Date('+010000-02-10T00:00Z'), { timezone: 'UTC' })).toBe('10000-02-10 00:00');
            expect(formatLocalDate(new Date('0001-02-10T00:00Z'), { timezone: 'UTC' })).toBe('0001-02-10 00:00');
            expect(formatLocalDate(new Date('-000001-02-10T00:00Z'), { timezone: 'UTC' })).toBe('-000001-02-10 00:00');
        });

        it('handles invalid dates and time zones', () => {
            expect(formatLocalDate(new Date('abcdefgh'), { timezone: 'UTC' })).toBe('Invalid Date');
            // invalid zones cannot be formatted, fall back to UTC rather than throwing
            expect(formatLocalDate(new Date('2025-02-10T12:34Z'), { timezone: 'Evil/Not_A_Zone' })).toBe(
                '2025-02-10 12:34'
            );
        });

        it('round-trips with parseDate', () => {
            const timezone = 'Pacific/Chatham'; // GMT+12:45 / GMT+13:45
            for (const iso of ['2025-02-10T12:34:55.123Z', '2025-07-10T12:34:55.123Z']) {
                const date = new Date(iso);
                const formatted = formatLocalDate(date, { timezone, ...full });
                expect(parseDate(formatted, timezone)).toMatchObject({ isValid: true, date });
            }
        });
    });
});

describe('formatUnambiguousDate', () => {
    const full = { fullPrecision: true };

    it('returns a plain wall clock time when it is unambiguous', () => {
        expect(formatUnambiguousDate(new Date('2025-07-15T12:00Z'), 'Europe/Berlin')).toBe('2025-07-15 14:00');
        expect(formatUnambiguousDate(new Date('2025-01-15T12:00Z'), 'Europe/Berlin')).toBe('2025-01-15 13:00');
        expect(formatUnambiguousDate(new Date('2025-01-15T12:00Z'), 'UTC')).toBe('2025-01-15 12:00');
    });

    it('adds an explicit offset for the second of two identical wall clock times', () => {
        // 02:00-02:59 happens twice in Europe/Berlin on 2025-10-26 (CEST +02:00, then CET +01:00)
        expect(formatUnambiguousDate(new Date('2025-10-26T00:30Z'), 'Europe/Berlin')).toBe('2025-10-26 02:30');
        expect(formatUnambiguousDate(new Date('2025-10-26T01:30Z'), 'Europe/Berlin')).toBe('2025-10-26 02:30+01:00');
    });

    it('adds an offset of +00:00 for a zero offset', () => {
        // 01:00-01:59 happens twice in Europe/London on 2025-10-26 (BST +01:00, then GMT)
        expect(formatUnambiguousDate(new Date('2025-10-26T00:30Z'), 'Europe/London')).toBe('2025-10-26 01:30');
        expect(formatUnambiguousDate(new Date('2025-10-26T01:30Z'), 'Europe/London')).toBe('2025-10-26 01:30+00:00');
    });

    it('round-trips through parseDate', () => {
        for (const iso of ['2025-10-26T00:30Z', '2025-10-26T01:30Z', '2025-10-26T02:30:15.250Z']) {
            const date = new Date(iso);
            const formatted = formatUnambiguousDate(date, 'Europe/Berlin', full);
            expect(parseDate(formatted, 'Europe/Berlin')).toMatchObject({ isValid: true, date });
        }
    });

    it('adds the offset even when seconds are dropped from the output', () => {
        // the formatted string cannot round-trip exactly here, but must still denote the same hour
        const date = new Date('2025-10-26T01:30:17.500Z');
        const formatted = formatUnambiguousDate(date, 'Europe/Berlin');
        expect(formatted).toBe('2025-10-26 02:30+01:00');
        expect((parseDate(formatted, 'Europe/Berlin') as ValidDate).date.toISOString()).toBe(
            '2025-10-26T01:30:00.000Z'
        );
    });

    it('keeps the offset short enough for the input field', () => {
        // the date input has maxlength=32
        const longest = formatUnambiguousDate(new Date('2025-10-26T01:30:15.250Z'), 'Europe/Berlin', full);
        expect(longest).toBe('2025-10-26 02:30:15.250+01:00');
        expect(longest.length).toBeLessThanOrEqual(32);
    });

    it('falls back to the ambiguous time if the offset cannot be parsed back', () => {
        // no offset is added without a time zone, as there is nothing to disambiguate against
        expect(formatUnambiguousDate(new Date('2025-10-26T01:30Z'), '')).toBe(
            formatLocalDate(new Date('2025-10-26T01:30Z'))
        );
    });
});

describe('formatLocalTime', () => {
    it('formats in correct format', () => {
        expect(formatLocalTime(new Date('2025-02-10 12:34'))).toBe('12:34');
        expect(formatLocalTime(new Date('2000-01-01 01:01'))).toBe('01:01');
        expect(formatLocalTime(new Date('2024-12-31 23:59'))).toBe('23:59');
        expect(formatLocalTime(new Date('2025-02-10 12:34:55'))).toBe('12:34');
        expect(formatLocalTime(new Date('2025-02-10 12:34:55.123'))).toBe('12:34');
        expect(formatLocalTime(new Date('2025-02-10 00:00'))).toBe('00:00');
        expect(formatLocalTime(new Date('2025-01-01 00:00'))).toBe('00:00');
        expect(formatLocalTime(new Date('2005-12-31 23:59'))).toBe('23:59');
        expect(formatLocalTime(new Date('0999-02-10 12:34:55.123'))).toBe('12:34');
        expect(formatLocalTime(new Date('-001000-02-10T13:04'))).toBe('13:04');
    });

    it('handles invalid dates', () => {
        expect(formatLocalTime(new Date(''))).toBe('Invalid Date');
        expect(formatLocalTime(new Date('abcdefgh'))).toBe('Invalid Date');
        expect(formatLocalTime(new Date('2025-01-32'))).toBe('Invalid Date');
    });
});

describe('overwriteDatePart', () => {
    const date = new Date('2033-01-22 00:00');
    it('updates date part while preserving time precision and format', () => {
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34');
        expect(overwriteDatePart('2025-02-10 12:34:00', date)).toBe('2033-01-22 12:34');
        expect(overwriteDatePart('2025-02-10 12:34:10', date)).toBe('2033-01-22 12:34:10');
        expect(overwriteDatePart('2025-02-10 12:34:01', date)).toBe('2033-01-22 12:34:01');
        expect(overwriteDatePart('2025-02-10 12:34Z', date).endsWith('Z')).toBe(false);
        expect(overwriteDatePart('2023-03-25 12:40:00.120', date)).toBe('2033-01-22 12:40:00.120');
    });

    it('includes at least hours and minutes', () => {
        //readds 00:00 local time
        expect(overwriteDatePart('2025-02-10', date)).toBe('2033-01-22 00:00');
        expect(overwriteDatePart('2025-02-10 ', date)).toBe('2033-01-22 00:00');

        expect(overwriteDatePart('2025-02-10 01:00', date)).toBe('2033-01-22 01:00');
        expect(overwriteDatePart('2025-02-10 1:0', date)).toBe('2033-01-22 01:00');
        expect(overwriteDatePart('2025-02-10 1:1', date)).toBe('2033-01-22 01:01');
    });

    it('time part of unix timestamps is lost', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025');
        const timestamp = timePartFrom.getTime().toString();
        const expectedString = '2033-01-22 00:00';
        expect(overwriteDatePart(timestamp, date)).toBe(expectedString);
    });

    it('totally replaces invalid strings', () => {
        expect(overwriteDatePart('abc', date)).toBe('2033-01-22 00:00');
    });

    it('ignores time part of new date', () => {
        const date = new Date('2033-01-22 21:42:56.789');
        expect(overwriteDatePart('2025-02-10 12:34', date)).toBe('2033-01-22 12:34');
    });
});

describe('overwriteTimePart', () => {
    it('updates time part while preserving time precision and format', () => {
        expect(overwriteTimePart('2025-02-10 12:34', 1, 23)).toBe('2025-02-10 01:23');
        expect(overwriteTimePart('2025-02-10 12:34', 23, 45)).toBe('2025-02-10 23:45');
        expect(overwriteTimePart('2025-02-10 12:34', 0, 0)).toBe('2025-02-10 00:00');
        expect(overwriteTimePart('2025-02-10 12:34', 9, 9)).toBe('2025-02-10 09:09');
        expect(overwriteTimePart('2025-02-10 2:4', 9, 9)).toBe('2025-02-10 09:09');
        expect(overwriteTimePart('2025-02-10 0:0', 9, 9)).toBe('2025-02-10 09:09');
        expect(overwriteTimePart('2025-02-10 00:00', 9, 9)).toBe('2025-02-10 09:09');
        expect(overwriteTimePart('2025-02-10 ', 0, 0)).toBe('2025-02-10 00:00');

        expect(overwriteTimePart('2025-02-10 12:34Z', 0, 0).endsWith('Z')).toBe(false);
    });

    it('discards seconds and milliseconds', () => {
        expect(overwriteTimePart('2025-02-10 12:34:01', 12, 34)).toBe('2025-02-10 12:34');
        expect(overwriteTimePart('2025-02-10 12:40:00.120', 12, 40)).toBe('2025-02-10 12:40');

        expect(overwriteTimePart('2025-02-10 01:00', 23.9, 0)).toBe('2025-02-10 23:00');
        expect(overwriteTimePart('2025-02-10 01:00', 23, 0.9)).toBe('2025-02-10 23:00');
    });

    it('handles unix timestamps', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025');
        const timestamp = timePartFrom.getTime().toString();
        const expectedString = '1970-01-22 23:59';
        expect(overwriteTimePart(timestamp, 23, 59)).toBe(expectedString);
    });

    it('totally replaces invalid strings with current date', () => {
        const datePart = formatLocalDate(new Date()).split(' ')[0];

        expect(overwriteTimePart('abc', 0, 0)).toBe(`${datePart} 00:00`);
        expect(overwriteTimePart('abc', 2, 2)).toBe(`${datePart} 02:02`);
    });
});

describe('parseDate', () => {
    it('parses various date formats and returns same string', () => {
        function checkValidDate(dateStr: string) {
            const date = parseDate(dateStr) as ValidDate;

            expect(date.isValid).toBe(true);
            expect(date.isReset).toBe(false);
            expect(date.dateString).toBe(dateStr);
            expect(date.date.getTime()).toBe(Date.parse(dateStr));
        }
        checkValidDate('2025-02-27 12:40');
        checkValidDate('2025-02-27');
        checkValidDate('27 Feb 2025 12:40');
        checkValidDate('2025-03-30 00:59:55');
        checkValidDate('2025-04-27T12:40Z');
        checkValidDate('2025-02-25T12:40:00.120');
    });

    it('parses UNIX timestamps', () => {
        const nov2024 = parseDate('1731493140025') as ValidDate;

        expect(nov2024.isValid).toBe(true);
        expect(nov2024.isReset).toBe(false);
        expect(nov2024.dateString).toBe('1731493140025');
        expect(nov2024.date.getTime()).toBe(1731493140025);

        const date1970 = parseDate('01') as ValidDate;
        expect(date1970.isValid).toBe(true);
        expect(date1970.isReset).toBe(false);
        expect(date1970.date.getTime()).toBe(1);
        expect(date1970.date.getUTCFullYear()).toBe(1970);
        expect(date1970.dateString).toBe('01');

        const date1970b = parseDate('100') as ValidDate;
        expect(date1970b.isValid).toBe(true);
        expect(date1970b.isReset).toBe(false);
        expect(date1970b.date.getTime()).toBe(100);
        expect(date1970b.date.getUTCFullYear()).toBe(1970);
        expect(date1970b.dateString).toBe('100');
    });

    it('parses timestamps in base ten', () => {
        const dateBase10 = parseDate('00000000123') as ValidDate;
        expect(dateBase10.isValid).toBe(true);
        expect(dateBase10.date.getTime()).toBe(123); // base 8 result would be 83
    });

    it('returns null for invalid dates', () => {
        expect(parseDate('abcdefgh').isValid).toBe(false);
        expect(parseDate('2025-02-32').isValid).toBe(false);
        expect(parseDate('27-02-03').isValid).toBe(false);
        expect(parseDate('15/01/2024').isValid).toBe(false);
        expect(parseDate('2025-01-001ZZ').isValid).toBe(false);
        expect(parseDate('22:30').isValid).toBe(false);
        expect(parseDate('2024-01-15T10:30:00 Z').isValid).toBe(false);
        expect(parseDate('1234567898764212345678').isValid).toBe(false);
    });

    it('accepts empty string', () => {
        // can be used to clear the fake date
        const dateEmpty = parseDate('');
        expect(dateEmpty.isReset).toBe(true);
        expect(dateEmpty.isValid).toBe(false);
        expect(dateEmpty.dateString).toBe('');

        const dateWhitespace = parseDate('   ');
        expect(dateWhitespace.isReset).toBe(true);
        expect(dateWhitespace.isValid).toBe(false);
        expect(dateWhitespace.dateString).toBe('   ');
    });

    describe('with a time zone', () => {
        function expectParsedAs(dateStr: string, timezone: string, expectedIso: string) {
            const parsed = parseDate(dateStr, timezone) as ValidDate;
            expect(parsed.isValid).toBe(true);
            expect(parsed.dateString).toBe(dateStr);
            expect(parsed.date.toISOString()).toBe(expectedIso);
        }

        it('interprets strings without offset as local time in that time zone', () => {
            expectParsedAs('2025-02-27 12:40', 'UTC', '2025-02-27T12:40:00.000Z');
            expectParsedAs('2025-02-27 12:40', 'Europe/Berlin', '2025-02-27T11:40:00.000Z');
            expectParsedAs('2025-02-27 12:40', 'America/New_York', '2025-02-27T17:40:00.000Z');
            expectParsedAs('27 Feb 2025 12:40', 'America/New_York', '2025-02-27T17:40:00.000Z');
            expectParsedAs('2025-02-25T12:40:00.120', 'Asia/Tokyo', '2025-02-25T03:40:00.120Z');
        });

        it('uses the offset in effect at that date (DST)', () => {
            expectParsedAs('2025-01-15 12:00', 'Europe/London', '2025-01-15T12:00:00.000Z');
            expectParsedAs('2025-07-15 12:00', 'Europe/London', '2025-07-15T11:00:00.000Z');
        });

        it('resolves ambiguous times to the offset before the transition', () => {
            // 2025-10-26 02:30 exists twice in Europe/Berlin (CEST +02:00, then CET +01:00)
            expectParsedAs('2025-10-26 02:30', 'Europe/Berlin', '2025-10-26T00:30:00.000Z');
        });

        it('resolves nonexistent times to the offset after the transition', () => {
            // 2025-03-30 02:30 is skipped in Europe/Berlin (CET +01:00 -> CEST +02:00)
            expectParsedAs('2025-03-30 02:30', 'Europe/Berlin', '2025-03-30T01:30:00.000Z');
        });

        it('ignores the time zone for strings with an explicit offset', () => {
            expectParsedAs('2025-04-27T12:40Z', 'America/New_York', '2025-04-27T12:40:00.000Z');
            expectParsedAs('2025-04-27T12:40+02:00', 'America/New_York', '2025-04-27T10:40:00.000Z');
        });

        it('ignores the time zone for date-only strings and UNIX timestamps', () => {
            // date-only ISO strings are UTC per spec, matching the behaviour of Date in the page
            expectParsedAs('2025-02-27', 'Asia/Tokyo', '2025-02-27T00:00:00.000Z');
            expectParsedAs('1731493140025', 'Asia/Tokyo', '2024-11-13T10:19:00.025Z');
        });

        it('behaves like the browser time zone for an empty time zone', () => {
            const withoutTz = parseDate('2025-02-27 12:40') as ValidDate;
            const emptyTz = parseDate('2025-02-27 12:40', '') as ValidDate;
            expect(emptyTz.date.getTime()).toBe(withoutTz.date.getTime());
        });

        it('returns an invalid date for invalid input', () => {
            expect(parseDate('abcdefgh', 'Europe/Berlin').isValid).toBe(false);
            expect(parseDate('2025-02-32', 'Europe/Berlin').isValid).toBe(false);
        });

        it('falls back to UTC for an unusable time zone', () => {
            // the UI only ever passes validated zones, but a page-controlled one must not throw
            expectParsedAs('2025-02-27 12:40', 'Evil/Not_A_Zone', '2025-02-27T12:40:00.000Z');
        });
    });
});

describe('parseTimestamp', () => {
    it('parses valid integer strings', () => {
        expect(parseTimestamp('1757807835230')).toBe(1757807835230);
        expect(parseTimestamp('-1757807835230')).toBe(-1757807835230);
        expect(parseTimestamp('123')).toBe(123);
        expect(parseTimestamp('-123')).toBe(-123);
        expect(parseTimestamp('0')).toBe(0);
        expect(parseTimestamp('-0')).toBe(-0);
    });

    it('returns null for non-integer strings', () => {
        expect(parseTimestamp(null)).toBe(null);
        expect(parseTimestamp('')).toBe(null);
        expect(parseTimestamp('   ')).toBe(null);
        expect(parseTimestamp('123.45')).toBe(null);
        expect(parseTimestamp('abc')).toBe(null);
        expect(parseTimestamp('123abc')).toBe(null);
        expect(parseTimestamp('12 34')).toBe(null);
        expect(parseTimestamp('0x123')).toBe(null);
        expect(parseTimestamp('NaN')).toBe(null);
        expect(parseTimestamp('123,456')).toBe(null);
        expect(parseTimestamp('12-34')).toBe(null);
        expect(parseTimestamp('123.0')).toBe(null);
    });
});
