export type LocalDateParts = SharedDateParts & {
    localTimestamp: number; // not a UTC timestamp!
};
export type SharedDateParts = {
    year: number;
    month: number; // 0-based month (0 = January)
    day: number; // 1-based day of the month
    hour: number;
    minute: number;
    second: number;
    ms: number;
};

export type FullDateParts = SharedDateParts & {
    weekday: string;
    offsetName: string; // a longOffset string, e.g. "GMT-05:00" or "GMT"
    rawFormat: Record<Intl.DateTimeFormatPartTypes, string>;
};

export function getDateParts(date: Date | number, timezone: string): FullDateParts | undefined {
    const formatter = getFormatterForTimezone(timezone);
    try {
        const parts = formatter.formatToParts(date);
        const partsMap = {} as Record<Intl.DateTimeFormatPartTypes, string>;
        parts.forEach((part) => {
            partsMap[part.type] = part.value;
        });
        return {
            year: parseInt(partsMap.year, 10),
            // Month is 1-based in formatToParts but 0-based in Date methods
            month: parseInt(partsMap.month, 10) - 1,
            day: parseInt(partsMap.day, 10),
            hour: parseInt(partsMap.hour, 10),
            minute: parseInt(partsMap.minute, 10),
            second: parseInt(partsMap.second, 10),
            ms: parseInt(partsMap.fractionalSecond, 10),
            weekday: partsMap.weekday,
            offsetName: partsMap.timeZoneName,
            rawFormat: partsMap,
        };
    } catch {
        return undefined;
    }
}

/** returns LocalDateParts for a given date.
 *
 * Resolves any overflows/undeflows, so e.g. for
 * getDatePartsForLocalDate(2025, 0, 1, 30, 0, 0, 0), it will return 6:00 on the next day.
 */
export function getDatePartsForLocalDate(
    year: number,
    month: number, //0-based month
    day: number,
    hour: number,
    minute: number,
    second: number,
    ms: number
): LocalDateParts {
    return getDatePartsForLocalTimestamp(Date.UTC(year, month, day, hour, minute, second, ms));
}

/** returns LocalDateParts for given local (!) timestamp. */
export function getDatePartsForLocalTimestamp(timestamp: number): LocalDateParts {
    const utcDate = new Date(timestamp);
    return {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth(),
        day: utcDate.getUTCDate(),
        hour: utcDate.getUTCHours(),
        minute: utcDate.getUTCMinutes(),
        second: utcDate.getUTCSeconds(),
        ms: utcDate.getUTCMilliseconds(),
        localTimestamp: utcDate.getTime(),
    };
}

export function compareDateParts(
    a: LocalDateParts | FullDateParts | undefined,
    b: LocalDateParts | FullDateParts | undefined
): boolean {
    if (a === undefined || b === undefined) {
        return a === b;
    }
    if ('offsetName' in a && 'offsetName' in b && a['offsetName'] !== b['offsetName']) {
        return false;
    }
    return (
        a.year === b.year &&
        a.month === b.month &&
        a.day === b.day &&
        a.hour === b.hour &&
        a.minute === b.minute &&
        a.second === b.second &&
        a.ms === b.ms
    );
}

/** Gets time zone offset in seconds for given date and time zone.
 *
 * Sign convention is the same as for `Date.getTimezoneOffset()`, i.e. positive values are west of UTC.
 */
export function getOffsetSeconds(date: number, timezone: string): number {
    const parts = getDateParts(date, timezone);
    if (!parts) {
        return 0;
    }
    const longOffset = parts.offsetName;

    //match offset with optional seconds part, e.g. "GMT+02:00", "GMT-05:30", "GMT+05:30:45"
    const match = longOffset.match(/GMT([+-]\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        return 0;
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    if (hours < 0) {
        return -(hours * 60 * 60 - minutes * 60 - seconds);
    } else {
        return -(hours * 60 * 60 + minutes * 60 + seconds);
    }
}

/** Gets a cached formatter */
function getFormatterForTimezone(timezone: string | undefined): Intl.DateTimeFormat {
    if (cachedFormatterForTimezone === timezone && cachedFormatter !== null) {
        return cachedFormatter;
    }
    cachedFormatterForTimezone = timezone;
    cachedFormatter = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        weekday: 'short',
        timeZoneName: 'longOffset',
        timeZone: timezone,
    });
    return cachedFormatter;
}

let cachedFormatter: Intl.DateTimeFormat | null = null;
let cachedFormatterForTimezone: string | undefined | null = null;
