import { describe, expect, it } from 'vitest';
import { getOffsetMinutes, parseLongOffsetSeconds } from '@/util/date/offset';

describe('parseLongOffsetSeconds', () => {
    it('returns 0 for UTC', () => {
        expect(parseLongOffsetSeconds('GMT')).toBe(0);
        expect(parseLongOffsetSeconds('GMT+00:00')).toBe(0);
        expect(parseLongOffsetSeconds('GMT-00:00')).toBe(0);
    });

    it('returns correct offset', () => {
        expect(parseLongOffsetSeconds('GMT-05:00')).toBe(18000);
        expect(parseLongOffsetSeconds('GMT+02:00')).toBe(-7200);
        expect(parseLongOffsetSeconds('GMT-00:44')).toBe(2640);
    });

    it('includes the seconds part', () => {
        // e.g. Asia/Kolkata and America/Caracas before 1906/1912
        expect(parseLongOffsetSeconds('GMT+05:21:10')).toBe(-19270);
        expect(parseLongOffsetSeconds('GMT-04:27:40')).toBe(16060);
    });

    it('returns 0 for invalid input', () => {
        expect(parseLongOffsetSeconds('abcd')).toBe(0);
        expect(parseLongOffsetSeconds('')).toBe(0);
        expect(parseLongOffsetSeconds(undefined)).toBe(0);
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

    it('truncates sub-minute offsets towards zero, like Date.getTimezoneOffset()', () => {
        expect(getOffsetMinutes('GMT+05:21:10')).toBe(-321);
        expect(getOffsetMinutes('GMT-04:27:40')).toBe(267);
        expect(getOffsetMinutes('GMT-00:43:08')).toBe(43);
        expect(getOffsetMinutes('GMT+00:00:30')).toBe(0);
    });

    it('returns 0 for invalid timezone', () => {
        expect(getOffsetMinutes('abcd')).toBe(0);
        expect(getOffsetMinutes('')).toBe(0);
        expect(getOffsetMinutes(undefined as unknown as string)).toBe(0);
    });
});
