export type Timezone = {
    tz: string; // IANA time zone identifier, e.g., "America/New_York". Empty string for browser default.
    label: string; // label, e.g. 'America/New_York (UTC-05:00)'
    group: string; // grouping label, e.g. 'America'
};
export const TZGROUP_RECENT = '_recent';
export const TZGROUP_COMMON = '_common';

let timezoneOptions: Timezone[] | null = null;

/* returns the full list of supported browser time zones.
 *
 * (Assumes locale does not change during the lifetime of the extension)
 */
export function getTimezoneOptions(locale: string, recentTz: string[]): Timezone[] {
    if (timezoneOptions) {
        return timezoneOptions;
    }

    const buildOption = (tz: string) => {
        const offset = getOffset(locale, tz).replace('GMT', 'UTC');
        const tzParts = tz.split('/');
        const group = tzParts.length > 1 ? tzParts[0] : 'Etc'; // Firefox has a number of funky time zones like 'CST6CDT', put them in 'Etc'
        const tzName = tzParts.length > 1 ? tzParts.slice(1).join('/') : tz;

        return {
            tz,
            label: `${tzName} (${offset})`,
            group,
        };
    };
    timezoneOptions = [
        { tz: 'UTC', label: 'UTC', group: TZGROUP_COMMON },
        ...recentTz
            .filter((tz) => tz) // filter ''
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

/**  Get offset in localized format like "GMT-08:00" */
function getOffset(locale: string, tz: string | undefined, date?: Date) {
    return getTimezoneName(locale, tz, date, 'longOffset');
}

/** Gets time zone offset in minutes from a longOffset string.
 *
 * Note: identical to function in date-parts.ts. Needs to be copied to avoid bundle splitting.
 */
function getOffsetMinutes(longOffset?: string): number {
    if (!longOffset) {
        return 0;
    }
    const match = longOffset.match(/GMT([+-]\d{2}):(\d{2})/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (hours < 0) {
            return -(hours * 60 - minutes);
        } else {
            return -(hours * 60 + minutes);
        }
    }
    return 0;
}

/** Get time zone name */
function getTimezoneName(
    locale: string,
    tz: string | undefined,
    date: Date | undefined,
    format: 'short' | 'shortGeneric' | 'longOffset'
) {
    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        timeZoneName: format,
    });
    return removeDateTimePart(formatter.format(date || new Date()));
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
    timeString: string; // localized time string without seconds, e.g. "13:34" or "01:34 PM"
    dateString: string; // date string, e.g. "Aug 6, 2025" or "2025年8月6日"
};

export function getTzInfo(locale: string, date: Date | string, timezone: string | undefined): TzInfo | null {
    try {
        if (typeof date === 'string') {
            date = new Date(date);
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

        let tzName = getTimezoneName(locale, timezone, date, 'short');
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
            timeString: date.toLocaleTimeString(locale, { timeZone: timezone, hour: 'numeric', minute: 'numeric' }),
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
