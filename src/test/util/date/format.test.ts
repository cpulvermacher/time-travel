import { describe, expect, it } from 'vitest';
import {
    formatLocalDate,
    formatLocalTime,
    formatUnambiguousDate,
    overwriteDatePart,
    overwriteTimePart,
} from '@/util/date/format';
import { parseDate, type ValidDate } from '@/util/date/parse';

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
    const day = '2033-01-22';
    it('updates date part while preserving time precision and format', () => {
        expect(overwriteDatePart('2025-02-10 12:34', day)).toBe('2033-01-22 12:34');
        expect(overwriteDatePart('2025-02-10 12:34:00', day)).toBe('2033-01-22 12:34');
        expect(overwriteDatePart('2025-02-10 12:34:10', day)).toBe('2033-01-22 12:34:10');
        expect(overwriteDatePart('2025-02-10 12:34:01', day)).toBe('2033-01-22 12:34:01');
        expect(overwriteDatePart('2025-02-10 12:34Z', day).endsWith('Z')).toBe(false);
        expect(overwriteDatePart('2023-03-25 12:40:00.120', day)).toBe('2033-01-22 12:40:00.120');
    });

    it('includes at least hours and minutes', () => {
        //readds 00:00 local time
        expect(overwriteDatePart('2025-02-10', day)).toBe('2033-01-22 00:00');
        expect(overwriteDatePart('2025-02-10 ', day)).toBe('2033-01-22 00:00');

        expect(overwriteDatePart('2025-02-10 01:00', day)).toBe('2033-01-22 01:00');
        expect(overwriteDatePart('2025-02-10 1:0', day)).toBe('2033-01-22 01:00');
        expect(overwriteDatePart('2025-02-10 1:1', day)).toBe('2033-01-22 01:01');
    });

    it('time part of unix timestamps is lost', () => {
        const timePartFrom = new Date('1970-01-22 10:19:00.025');
        const timestamp = timePartFrom.getTime().toString();
        const expectedString = '2033-01-22 00:00';
        expect(overwriteDatePart(timestamp, day)).toBe(expectedString);
    });

    it('totally replaces invalid strings', () => {
        expect(overwriteDatePart('abc', day)).toBe('2033-01-22 00:00');
    });

    it('takes the new day verbatim, without reinterpreting it', () => {
        // the day is not parsed, so it cannot be shifted by a time zone or normalized
        expect(overwriteDatePart('2025-02-10 12:34', '-002025-01-22')).toBe('-002025-01-22 12:34');
        expect(overwriteDatePart('2025-02-10 12:34', '275760-09-13')).toBe('275760-09-13 12:34');
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
