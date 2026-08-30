import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getInitialTimezoneOptions, TZGROUP_RECENT } from '@/display/timezone-options';

describe('getInitialTimezoneOptions', () => {
    it('returns UTC and the recent timezones', () => {
        const options = getInitialTimezoneOptions(['Europe/London'], '');

        expect(options).toEqual([
            { tz: 'UTC', name: 'UTC', group: expect.any(String) },
            { tz: 'Europe/London', name: 'London', group: TZGROUP_RECENT },
        ]);
    });

    it('adds the selected timezone if it is not among them', () => {
        const options = getInitialTimezoneOptions(['Europe/London'], 'America/New_York');

        expect(options).toContainEqual({ tz: 'America/New_York', name: 'New York', group: 'America' });
    });

    it('does not add the selected timezone twice', () => {
        const options = getInitialTimezoneOptions(['Europe/London'], 'Europe/London');

        expect(options.filter((o) => o.tz === 'Europe/London')).toHaveLength(1);
    });

    it('drops an invalid selected or recent timezone instead of throwing', () => {
        const options = getInitialTimezoneOptions(['Evil/Not_A_Zone'], 'Evil/Also_Not_A_Zone');

        expect(options.map((o) => o.tz)).toEqual(['UTC']);
    });
});

describe('getTimezoneOptions', () => {
    // result is memoized, so re-import a fresh module per test
    beforeEach(() => {
        vi.resetModules();
    });

    async function freshGetTimezoneOptions() {
        return (await import('@/display/timezone-options')).getTimezoneOptions;
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
        return await import('@/display/timezone-options');
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
