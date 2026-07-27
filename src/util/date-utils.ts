import {
    getDateParts,
    getDatePartsForLocalTimestamp,
    getOffsetSeconds,
    type SharedDateParts,
} from '../content-scripts/fake-date/date-parts';
import { parseWithTimezone } from '../content-scripts/fake-date/parseWithTimezone';

export type FormatOptions = {
    fullPrecision?: boolean;
    timezone?: string; // IANA time zone to format in, defaults to the browser time zone
};

/** Formats an instant into a string of the form "YYYY-MM-DD HH:mm" in local time, or "Invalid Date" if invalid
 *
 * If options.timezone is set, the wall clock time in that time zone is returned instead of the
 * browser's local time.
 * If options.fullPrecision is true, returns seconds and milliseconds if they are non-zero
 */
export function formatLocalDate(date: Date, options?: FormatOptions): string {
    if (Number.isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    if (options?.timezone) {
        // shift the instant so that reading it as UTC yields the wall clock of the given time zone
        const offsetMs = getOffsetSeconds(date.getTime(), options.timezone) * 1000;
        return formatDateParts(getDatePartsForLocalTimestamp(date.getTime() - offsetMs), options);
    }

    return formatDateParts(
        {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
            ms: date.getMilliseconds(),
        },
        options
    );
}

/** Returns `date` as local time in `timezone`, appending an explicit UTC offset if the wall clock
 * time alone would be ambiguous.
 *
 * An hour repeated by a DST transition has the same wall clock time twice. Parsing always resolves
 * such a time to the first of the two instants (see parseWithTimezone), so the second one can only
 * be expressed with an explicit offset, e.g. "2025-10-26 02:30+01:00".
 */
export function formatUnambiguousDate(date: Date, timezone: string, options?: Omit<FormatOptions, 'timezone'>): string {
    const formatted = formatLocalDate(date, { ...options, timezone });
    if (!timezone) {
        return formatted;
    }

    // Compare offsets rather than instants: the formatted string may have less precision than the
    // date (seconds are dropped by default), but an ambiguous time is one that parses back to the
    // same wall clock with a *different* offset.
    const offsetSeconds = getOffsetSeconds(date.getTime(), timezone);
    if (parsesToOffset(formatted, timezone, offsetSeconds)) {
        return formatted;
    }

    const withOffset = formatted + getUtcOffset(date, timezone);
    // offsets with a seconds part (historic zones) cannot be parsed back, keep the ambiguous time
    return parsesToOffset(withOffset, timezone, offsetSeconds) ? withOffset : formatted;
}

/** Returns true if `dateString` parses to a date that has the given UTC offset in `timezone` */
function parsesToOffset(dateString: string, timezone: string, offsetSeconds: number): boolean {
    const timestamp = parseWithTimezone(dateString, timezone);
    return !Number.isNaN(timestamp) && getOffsetSeconds(timestamp, timezone) === offsetSeconds;
}

/** Returns the UTC offset of `timezone` at `date` in the format "+01:00", or '' if unavailable */
function getUtcOffset(date: Date, timezone: string): string {
    const offsetName = getDateParts(date, timezone)?.offsetName;
    if (!offsetName) {
        return '';
    }
    // longOffset is just "GMT" for a zero offset
    return offsetName === 'GMT' ? '+00:00' : offsetName.replace('GMT', '');
}

function formatDateParts(parts: SharedDateParts, options?: FormatOptions): string {
    // negative years (=before 1BCE) need to be padded with extra digits for Date() to parse them
    const YYYY = parts.year >= 0 ? String(parts.year).padStart(4, '0') : '-' + String(-parts.year).padStart(6, '0');
    const MM = String(parts.month + 1).padStart(2, '0');
    const DD = String(parts.day).padStart(2, '0');
    const HH = String(parts.hour).padStart(2, '0');
    const mm = String(parts.minute).padStart(2, '0');
    let dateStr = `${YYYY}-${MM}-${DD} ${HH}:${mm}`;

    if (options?.fullPrecision) {
        if (parts.second !== 0 || parts.ms !== 0) {
            const ss = String(parts.second).padStart(2, '0');
            dateStr += ':' + ss;
        }
        if (parts.ms !== 0) {
            const sss = String(parts.ms).padStart(3, '0');
            dateStr += '.' + sss;
        }
    }
    return dateStr;
}

/** Returns time in format "HH:mm" in local time, or "Invalid Date" if invalid */
export function formatLocalTime(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return HH + ':' + mm;
}

/** Returns a date string in format "YYYY-MM-DD HH:mm..." using the date from `newDate`, and the time from `dateTimeString`.
 *
 * Precision of time part is preserved, but includes at least hours and minutes.
 * `newDate` is interpreted as local time, and the returned string will be in local time.
 */
export function overwriteDatePart(dateTimeString: string, newDate: Date): string {
    const parsedDateTime = parseDate(dateTimeString);
    const timeRegex = /\d{1,2}:\d{1,2}/;
    if (!parsedDateTime.isValid || !timeRegex.test(dateTimeString)) {
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return formatLocalDate(newDate);
    }

    const timePart = parsedDateTime.date;
    newDate.setHours(timePart.getHours());
    newDate.setMinutes(timePart.getMinutes());
    newDate.setSeconds(timePart.getSeconds());
    newDate.setMilliseconds(timePart.getMilliseconds());

    return formatLocalDate(newDate, { fullPrecision: true });
}

/** Returns a date string in format "YYYY-MM-DD HH:mm..." using the date from `dateTimeString` and the time from `hours` and `minutes`.
 */
export function overwriteTimePart(dateTimeString: string, hours: number, minutes: number): string {
    const parsedDateTime = parseDate(dateTimeString);
    const newDate = parsedDateTime.isValid ? parsedDateTime.date : new Date();

    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return formatLocalDate(newDate);
}

export type ParsedDate = ValidDate | InvalidDate | ResetDate;
export type ValidDate = {
    dateString: string; // unmodified input string
    date: Date;
    isValid: true;
    isReset: false;
};
export type InvalidDate = {
    dateString: string; // unmodified input string
    isValid: false;
    isReset: false;
};
export type ResetDate = {
    dateString: string; // unmodified input string
    isValid: false;
    isReset: true;
};

/** Try parsing a date string
 *
 * If `timezone` is set, strings without offset information are interpreted as local time in that
 * time zone instead of the browser's time zone. UNIX timestamps and strings with an explicit offset
 * (or `Z`) denote an absolute instant and are unaffected.
 */
export function parseDate(dateString: string, timezone?: string): ParsedDate {
    if (dateString.trim() === '') {
        return { dateString, isValid: false, isReset: true };
    }

    const maybeTimestamp = parseTimestamp(dateString);
    try {
        const date =
            maybeTimestamp !== null ? new Date(maybeTimestamp) : new Date(parseWithTimezone(dateString, timezone));

        if (Number.isNaN(date.getTime())) {
            return { dateString, isValid: false, isReset: false };
        }
        return { dateString, date, isValid: true, isReset: false };
    } catch {
        return { dateString, isValid: false, isReset: false };
    }
}

/** Try parsing a timestamp, return null if the string is not a valid integer */
export function parseTimestamp(timestamp: string | null): number | null {
    if (timestamp === null) {
        return null;
    }

    if (/^-?\d+$/.test(timestamp)) {
        const parsed = Number.parseInt(timestamp, 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
}
