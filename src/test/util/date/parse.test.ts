import { describe, expect, it } from 'vitest';
import { parseDate, parseTimestamp, type ValidDate } from '@/util/date/parse';

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
