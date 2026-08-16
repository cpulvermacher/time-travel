import { getOffsetMinutes } from '@/date/offset';

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

/** Maps a time zone from an untrusted source (page state, stored settings) to a valid IANA zone,
 * or '' (browser default) if it is not one this browser knows.
 *
 * An unknown zone would otherwise silently be treated as UTC when parsing, and make every
 * `getDateParts()` in the page return undefined once applied.
 */
export function sanitizeTimezone(tz: string | null | undefined): string {
    return isValidTimezone(tz) ? tz : '';
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

/**  Get offset in localized format like "GMT-08:00" */
export function getOffset(locale: string, tz: string | undefined, date: Date) {
    return getTimezoneName(locale, tz, date, 'longOffset');
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
            // in a dev tools, 24h everywhere is clearer
            // 2-digit rather than numeric because some locales (e.g. ko) format an unpadded hour as "6시 0분".
            timeString: date.toLocaleTimeString(locale, {
                timeZone: timezone,
                hourCycle: 'h23',
                hour: '2-digit',
                minute: '2-digit',
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
