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

export type TzTransition = {
    dateTimeString: string; // local date and time right after the change, e.g. "Oct 26, 2025, 02:00"
    offset: string; // offset in effect after the change, e.g. "+01:00"
};

export type TzInfo = {
    tzName: string; // e.g. "CEST"
    offset: string; // e.g. "-05:00"
    isDst: boolean;
    isYearWithDst: boolean;
    isOffsetDifferentFromNow: boolean;
    timeString: string; // localized time string, e.g. "13:34" or "01:34 PM"
    dateString: string; // date string, e.g. "Aug 6, 2025" or "2025年8月6日"
    previousTransition: TzTransition | null; // last offset change before the date, null if there is none nearby
    nextTransition: TzTransition | null; // next offset change after the date, null if there is none nearby
};

export type TzInfoFormat = {
    seconds?: boolean; // include seconds in the time, e.g. "13:34:07"
};

const noTransitions = { previousTransition: null, nextTransition: null };

/** How far from the shown date a transition may be to still be worth mentioning. Wide enough to always
 * cover both ends of a DST cycle (at most ~7 months apart), narrow enough to leave out the historical
 * one-off changes that zones without DST would otherwise report, e.g. Tokyo's last DST end in 1951. */
const MAX_TRANSITION_DISTANCE_MS = 365 * 24 * 60 * 60 * 1000;

/** The offset changes (DST or a permanent change of the zone's standard offset) surrounding `date`.
 *
 * Needs `Temporal.ZonedDateTime.getTimeZoneTransition()`, which older browsers within our supported
 * range do not have; there we return nulls and callers simply leave the information out.
 */
function getTransitions(locale: string, date: Date, timezone: string | undefined) {
    try {
        if (typeof Temporal === 'undefined' || !Temporal.ZonedDateTime.prototype.getTimeZoneTransition) {
            return noTransitions;
        }

        const zoned = Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(
            timezone ?? Temporal.Now.timeZoneId()
        );
        return {
            previousTransition: toTzTransition(locale, timezone, date, zoned.getTimeZoneTransition('previous')),
            nextTransition: toTzTransition(locale, timezone, date, zoned.getTimeZoneTransition('next')),
        };
    } catch (e) {
        console.error('Error getting time zone transitions for', date, timezone, e);
        return noTransitions;
    }
}

function toTzTransition(
    locale: string,
    timezone: string | undefined,
    date: Date,
    transition: Temporal.ZonedDateTime | null
): TzTransition | null {
    if (!transition || Math.abs(transition.epochMilliseconds - date.getTime()) > MAX_TRANSITION_DISTANCE_MS) {
        return null;
    }

    return {
        // the transition instant is the first one on the new offset, so this is the clock time it jumps to
        dateTimeString: new Date(transition.epochMilliseconds).toLocaleString(locale, {
            timeZone: timezone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hourCycle: 'h23',
            hour: '2-digit',
            minute: '2-digit',
        }),
        offset: transition.offset,
    };
}

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
            ...getTransitions(locale, date, timezone),
        };
    } catch (e) {
        console.error('Error getting timezone info for', date, timezone, e);
        return null;
    }
}
