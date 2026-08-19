import { getDatePartsForLocalTimestamp, type SharedDateParts } from './date-parts';
import { getOffsetSeconds, getUtcOffset, parsesToOffset } from './offset';
import { OriginalDate } from './original-date';
import { parseDate } from './parse';

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

function formatDateParts(parts: SharedDateParts, options?: FormatOptions): string {
    // negative years (=before 1BCE) need to be padded with extra digits for Date() to parse them
    const YYYY = parts.year >= 0 ? String(parts.year).padStart(4, '0') : `-${String(-parts.year).padStart(6, '0')}`;
    const MM = String(parts.month + 1).padStart(2, '0');
    const DD = String(parts.day).padStart(2, '0');
    const HH = String(parts.hour).padStart(2, '0');
    const mm = String(parts.minute).padStart(2, '0');
    let dateStr = `${YYYY}-${MM}-${DD} ${HH}:${mm}`;

    if (options?.fullPrecision) {
        if (parts.second !== 0 || parts.ms !== 0) {
            const ss = String(parts.second).padStart(2, '0');
            dateStr += `:${ss}`;
        }
        if (parts.ms !== 0) {
            const sss = String(parts.ms).padStart(3, '0');
            dateStr += `.${sss}`;
        }
    }
    return dateStr;
}

/** Returns a date string in format "YYYY-MM-DD HH:mm..." using the day from `newDay` ("YYYY-MM-DD")
 * and the time from `dateTimeString`.
 *
 * Precision of time part is preserved, but includes at least hours and minutes. A `dateTimeString`
 * without a time part yields midnight.
 * `dateTimeString` is interpreted as local time in `timezone` (the browser time zone if unset), and
 * the returned string is in that same zone. Reading and writing the time in one zone is what keeps
 * the operation symbolic: routing it through the browser zone instead would shift a time that
 * happens to fall into a DST gap there.
 */
export function overwriteDatePart(dateTimeString: string, newDay: string, timezone?: string): string {
    const parsedDateTime = parseDate(dateTimeString, timezone);
    const timeRegex = /\d{1,2}:\d{1,2}/;
    if (!parsedDateTime.isValid || !timeRegex.test(dateTimeString)) {
        return `${newDay} 00:00`;
    }

    const timePart = formatLocalDate(parsedDateTime.date, { fullPrecision: true, timezone }).split(' ')[1];
    return `${newDay} ${timePart}`;
}

/** Returns a date string in format "YYYY-MM-DD HH:mm" using the day from `dateTimeString` and the
 * time from `newTime` ("HH:mm").
 *
 * `newTime` is taken verbatim, so it must already be zero padded (as an `<input type="time">` value
 * is). Any seconds and milliseconds of `dateTimeString` are dropped, since the time picker only has
 * minute precision. An invalid `dateTimeString` falls back to the current day.
 * `dateTimeString` is interpreted as local time in `timezone` (the browser time zone if unset), and
 * the returned string is in that same zone, for the same reason as in overwriteDatePart().
 */
export function overwriteTimePart(dateTimeString: string, newTime: string, timezone?: string): string {
    const parsedDateTime = parseDate(dateTimeString, timezone);
    const date = parsedDateTime.isValid ? parsedDateTime.date : new OriginalDate();

    const dayPart = formatLocalDate(date, { timezone }).split(' ')[0];
    return `${dayPart} ${newTime}`;
}
