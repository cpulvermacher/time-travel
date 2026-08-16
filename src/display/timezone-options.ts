import { getOffset, isValidTimezone } from './timezone-info';

export type Timezone = {
    tz: string; // IANA time zone identifier, e.g., "America/New_York". Empty string for browser default.
    name: string; // display name without offset, e.g. 'New York'
    group: string; // grouping label, e.g. 'America'
};
export const TZGROUP_RECENT = '_recent';
export const TZGROUP_COMMON = '_common';

let timezoneOptions: Timezone[] | null = null;
let cachedOffsets: Record<string, string> | null = null;

/* returns the full list of supported browser time zones.
 *
 * The UTC offsets are not part of this list, as they depend on the date. Use `getTimezoneOffsets()` for those.
 */
export function getTimezoneOptions(recentTz: string[]): Timezone[] {
    if (timezoneOptions) {
        return timezoneOptions;
    }

    const buildOption = (tz: string) => {
        const tzParts = tz.split('/');
        const group = tzParts.length > 1 ? tzParts[0] : 'Etc'; // Firefox has a number of funky time zones like 'CST6CDT', put them in 'Etc'
        const name = (tzParts.length > 1 ? tzParts.slice(1).join('/') : tz).replace(/_/g, ' ');

        return { tz, name, group };
    };
    timezoneOptions = [
        { tz: 'UTC', name: 'UTC', group: TZGROUP_COMMON },
        ...recentTz
            .filter(isValidTimezone)
            .map(buildOption)
            .map((option) => ({
                ...option,
                group: TZGROUP_RECENT,
            })),
    ];

    try {
        const timeZones = Intl.supportedValuesOf('timeZone');

        timezoneOptions = [
            ...timezoneOptions,
            ...timeZones
                .filter((tz) => tz !== 'UTC')
                .map(buildOption)
                .sort((a, b) => a.tz.localeCompare(b.tz)), // Sort by time zone identifier
        ];
    } catch (error) {
        console.error('Error loading timezones:', error);
    }
    return timezoneOptions;
}

/** Returns the UTC offset of each given time zone at `date`, e.g. { 'America/New_York': 'UTC-05:00' }.
 *
 * 'UTC' itself maps to an empty string, as showing an offset for it would be redundant.
 *
 * Returns the identical object as the previous call if no offset changed, so callers can cheaply skip updates
 * (offsets only change when `date` crosses a DST transition).
 */
export function getTimezoneOffsets(locale: string, date: Date, timezones: Timezone[]): Record<string, string> {
    try {
        const offsets: Record<string, string> = { UTC: '' };
        for (const { tz } of timezones) {
            if (!(tz in offsets)) {
                offsets[tz] = getOffset(locale, tz, date).replace('GMT', 'UTC');
            }
        }

        if (cachedOffsets && isSameOffsets(cachedOffsets, offsets)) {
            return cachedOffsets;
        }
        cachedOffsets = offsets;
    } catch (error) {
        console.error('Error getting timezone offsets for', date, error);
    }
    return cachedOffsets ?? {};
}

function isSameOffsets(a: Record<string, string>, b: Record<string, string>): boolean {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}
