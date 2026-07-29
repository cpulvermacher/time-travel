import { describe, expect, it } from 'vitest';
import { getOffsetMinutes } from '@/util/date/offset';

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
