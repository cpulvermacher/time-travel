import { describe, expect, it } from 'vitest';
import { addDays } from '@/util/date/addDays';
import { formatLocalDate, formatUnambiguousDate } from '@/util/date/format';
import { parseDate, type ValidDate } from '@/util/date/parse';

/** parse `dateString` in `timezone`, step it and format it back, i.e. what a day step in the popup does */
function step(dateString: string, days: number, timezone: string): string {
    const parsed = parseDate(dateString, timezone) as ValidDate;
    return formatUnambiguousDate(addDays(parsed.date, days, timezone), timezone, { fullPrecision: true });
}

/** hours between `dateString` and the same date stepped by `days` */
function stepInHours(dateString: string, days: number, timezone: string): number {
    const parsed = parseDate(dateString, timezone) as ValidDate;
    return (addDays(parsed.date, days, timezone).getTime() - parsed.date.getTime()) / (60 * 60 * 1000);
}

describe('addDays', () => {
    // these tests must pass in every browser time zone, so they all use an explicit one
    const london = 'Europe/London';

    it('keeps the time of day', () => {
        expect(step('2025-02-10 12:34', 1, london)).toBe('2025-02-11 12:34');
        expect(step('2025-02-10 12:34:56.789', 1, london)).toBe('2025-02-11 12:34:56.789');
        expect(step('2025-02-10 12:34', -1, london)).toBe('2025-02-09 12:34');
        expect(step('2025-02-10 12:34', 0, london)).toBe('2025-02-10 12:34');
        expect(step('2025-02-10 12:34', 30, london)).toBe('2025-03-12 12:34');
    });

    it('rolls over months and years', () => {
        expect(step('2025-01-31 12:34', 1, london)).toBe('2025-02-01 12:34');
        expect(step('2025-03-01 12:34', -1, london)).toBe('2025-02-28 12:34');
        expect(step('2024-02-28 12:34', 1, london)).toBe('2024-02-29 12:34'); // leap year
        expect(step('2025-12-31 12:34', 1, london)).toBe('2026-01-01 12:34');
        expect(step('2025-01-01 12:34', -1, london)).toBe('2024-12-31 12:34');
    });

    it('keeps the time of day across a DST transition, making the step 23 or 25 hours long', () => {
        // Europe/London skips 01:00-02:00 on Mar 30 and repeats it on Oct 26, 2025
        expect(step('2025-03-29 12:34', 1, london)).toBe('2025-03-30 12:34');
        expect(stepInHours('2025-03-29 12:34', 1, london)).toBe(23);
        expect(step('2025-03-30 12:34', -1, london)).toBe('2025-03-29 12:34');
        expect(stepInHours('2025-03-30 12:34', -1, london)).toBe(-23);

        expect(step('2025-10-25 12:34', 1, london)).toBe('2025-10-26 12:34');
        expect(stepInHours('2025-10-25 12:34', 1, london)).toBe(25);
        expect(step('2025-10-26 12:34', -1, london)).toBe('2025-10-25 12:34');
        expect(stepInHours('2025-10-26 12:34', -1, london)).toBe(-25);
    });

    it('moves a skipped time forward with the transition', () => {
        // 2025-03-30 01:30 does not exist in Europe/London
        expect(step('2025-03-29 01:30', 1, london)).toBe('2025-03-30 02:30');
        expect(step('2025-03-31 01:30', -1, london)).toBe('2025-03-30 02:30');
    });

    it('keeps the UTC offset within a repeated hour', () => {
        // 2025-10-26 01:30 exists twice in Europe/London, plain input means the first one
        expect(step('2025-10-25 01:30', 1, london)).toBe('2025-10-26 01:30');
        expect(step('2025-10-26 01:30+01:00', 1, london)).toBe('2025-10-27 01:30');
        // and a step onto it keeps the offset of the previous date, so the step stays reversible
        expect(step('2025-10-27 01:30', -1, london)).toBe('2025-10-26 01:30+00:00');
        expect(step('2025-10-26 01:30+00:00', 1, london)).toBe('2025-10-27 01:30');
    });

    it('steps the wall clock of a time zone with a fractional offset', () => {
        expect(step('2025-02-10 12:34', 1, 'Asia/Kathmandu')).toBe('2025-02-11 12:34'); // UTC+05:45
        expect(step('2025-04-05 12:34', 1, 'Australia/Lord_Howe')).toBe('2025-04-06 12:34'); // 30 min DST step
        expect(stepInHours('2025-04-05 12:34', 1, 'Australia/Lord_Howe')).toBe(24.5);
    });

    it('uses the browser time zone if no time zone is given', () => {
        // mid-day in June, so this holds in every browser time zone
        const parsed = parseDate('2025-06-15 12:34') as ValidDate;
        expect(formatLocalDate(addDays(parsed.date, 1, ''))).toBe('2025-06-16 12:34');
        expect(formatLocalDate(addDays(parsed.date, -1, ''))).toBe('2025-06-14 12:34');
    });

    it('returns an invalid date for an unknown time zone', () => {
        expect(addDays(new Date('2025-02-10T12:34:00Z'), 1, 'Mars/Olympus_Mons').getTime()).toBeNaN();
    });
});
