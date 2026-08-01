import { getOffsetMinutes } from '../util/date/offset';

export type Timezone = {
    tz: string; // IANA time zone identifier, e.g., "America/New_York". Empty string for browser default.
    name: string; // display name without offset, e.g. 'New York'
    group: string; // grouping label, e.g. 'America'
};
export const TZGROUP_RECENT = '_recent';
export const TZGROUP_COMMON = '_common';

let timezoneOptions: Timezone[] | null = null;
let cachedOffsets: Record<string, string> | null = null;

/** Shortens an IANA time zone id to just its city part, e.g. 'America/Argentina/Buenos_Aires' -> 'Buenos Aires' */
export function getTimezoneCity(tz: string): string {
    const tzParts = tz.split('/');
    return tzParts[tzParts.length - 1].replace(/_/g, ' ');
}

/** Returns true if `tz` is a valid IANA time zone identifier usable with the Intl APIs. */
export function isValidTimezone(tz: string | null | undefined): tz is string {
    if (!tz) {
        return false;
    }
    try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

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

/**  Get offset in localized format like "GMT-08:00" */
function getOffset(locale: string, tz: string | undefined, date: Date) {
    return getTimezoneName(locale, tz, date, 'longOffset');
}

type TimezoneNameFormat = 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Constructing an Intl.DateTimeFormat is orders of magnitude slower than formatting with it, so cache them.
 *
 * (Relevant when formatting hundreds of time zones for the time zone dropdown.)
 */
function getFormatter(locale: string, tz: string | undefined, format: TimezoneNameFormat) {
    const key = `${locale}|${tz ?? ''}|${format}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, {
            timeZone: tz,
            timeZoneName: format,
        });
        formatterCache.set(key, formatter);
    }
    return formatter;
}

/** Get time zone name */
function getTimezoneName(locale: string, tz: string | undefined, date: Date, format: TimezoneNameFormat) {
    return removeDateTimePart(getFormatter(locale, tz, format).format(date));
}

/** Remove date and time part from a string, leaving only the time zone part. */
function removeDateTimePart(str: string): string {
    const parts = str.split(' ');
    if (parts.length > 1) {
        return parts.slice(1).join(' ');
    }
    return str;
}

type TzInfo = {
    tzName: string; // e.g. "CEST"
    offset: string; // e.g. "-05:00"
    isDst: boolean;
    isYearWithDst: boolean;
    isOffsetDifferentFromNow: boolean;
    timeString: string; // localized time string, e.g. "13:34" or "01:34 PM"
    dateString: string; // date string, e.g. "Aug 6, 2025" or "2025年8月6日"
};

export type TzInfoFormat = {
    seconds?: boolean; // include seconds in the time, e.g. "13:34:07"
};

export function getTzInfo(
    locale: string,
    date: Date | string,
    timezone: string | undefined,
    format: TzInfoFormat = {}
): TzInfo | null {
    try {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (timezone === '') {
            timezone = undefined;
        }

        const summerDate = new Date(date.getFullYear(), 5, 1); // June 1st
        const winterDate = new Date(date.getFullYear(), 11, 1); // December 1st

        const offsetSummer = getOffset('en', timezone, summerDate);
        const offsetWinter = getOffset('en', timezone, winterDate);
        const yearWithDst = offsetSummer !== offsetWinter;

        // DST can happen around the end of the year in the southern hemisphere, so we check if the date's offset is smaller than either offset
        const offsetDate = getOffset('en', timezone, date);
        const isDst =
            getOffsetMinutes(offsetDate) < getOffsetMinutes(offsetWinter) ||
            getOffsetMinutes(offsetDate) < getOffsetMinutes(offsetSummer);

        let tzName = getTimezoneName(locale, timezone, date, 'long');
        if (tzName !== 'GMT' && tzName.includes('GMT')) {
            tzName = getTimezoneName(locale, timezone, date, 'shortGeneric');
        }
        const offset = offsetDate.replace('GMT', '');

        const offsetNow = getOffset('en', timezone, new Date());

        return {
            tzName,
            offset,
            isDst,
            isYearWithDst: yearWithDst,
            isOffsetDifferentFromNow: offsetDate !== offsetNow,
            timeString: date.toLocaleTimeString(locale, {
                timeZone: timezone,
                hour: 'numeric',
                minute: 'numeric',
                ...(format.seconds ? { second: '2-digit' } : {}),
            }),
            dateString: date.toLocaleDateString(locale, {
                timeZone: timezone,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        };
    } catch (e) {
        console.error('Error getting timezone info for', date, timezone, e);
        return null;
    }
}
